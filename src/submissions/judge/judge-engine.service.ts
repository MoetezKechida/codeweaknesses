import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docker from 'dockerode';

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  memoryUsed: number;
  timedOut: boolean;
  memoryExceeded: boolean;
}

@Injectable()
export class JudgeEngineService {
  private docker: Docker;
  private readonly submissionTimeout: number;
  private readonly memoryLimit: number;

  constructor(private configService: ConfigService) {
    // Initialize Docker client
    // On Windows, Docker Desktop uses named pipes or TCP
    // On Linux, use socket
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows: Try named pipe first, then TCP
      try {
        this.docker = new Docker({
          socketPath: '//./pipe/docker_engine',
        });
      } catch (err) {
        // Fallback to TCP (Docker API server)
        this.docker = new Docker({
          host: 'localhost',
          port: 2375,
          protocol: 'http',
        });
      }
    } else {
      // Linux: Use Unix socket
      this.docker = new Docker({
        socketPath: '/var/run/docker.sock',
      });
    }

    // Get limits from config, with defaults
    const timeoutStr = this.configService.get('SUBMISSION_TIMEOUT', '5000');
    const memoryStr = this.configService.get('MEMORY_LIMIT', '268435456');
    
    this.submissionTimeout = parseInt(timeoutStr, 10);
    this.memoryLimit = parseInt(memoryStr, 10);
  }

  /**
   * Execute code in an isolated Docker container
   */
  async executeCode(
    language: string,
    code: string,
    input: string,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    let container: Docker.Container | null = null;

    try {
      // Get the appropriate image for the language
      const image = this.getImageForLanguage(language);

      // Create container
      container = await this.docker.createContainer({
        Image: image,
        Cmd: this.getCommandForLanguage(language, code),
        AttachStdout: true,
        AttachStderr: true,
        Tty: false,
        HostConfig: {
          Memory: this.memoryLimit,
          MemorySwap: this.memoryLimit, // Prevent swap
          CpuQuota: 100000, // Limit CPU
          ReadonlyRootfs: true,
        },
        NetworkDisabled: true, // No network access
      });

      // Start container
      await container.start();

      // Wait for container to finish or timeout
      let output = '';
      let error = '';
      let timedOut = false;

      try {
        const result = await Promise.race([
          this.captureOutput(container),
          this.timeoutPromise(this.submissionTimeout),
        ]);

        if (result === 'TIMEOUT') {
          timedOut = true;
          await container.kill();
          return {
            success: false,
            output: '',
            error: `Execution timeout exceeded ${this.submissionTimeout}ms`,
            executionTime: this.submissionTimeout,
            memoryUsed: 0,
            timedOut: true,
            memoryExceeded: false,
          };
        }

        ({ output, error } = result as any);
      } catch (err) {
        await container.kill().catch(() => {});
      }

      const executionTime = Date.now() - startTime;

      // Get container stats to check memory usage
      const stats = await this.getContainerStats(container);
      const memoryUsed = stats.memory_stats?.usage || 0;
      const memoryExceeded = memoryUsed > this.memoryLimit;

      return {
        success: !error && !memoryExceeded,
        output: output.trim(),
        error: error ? error.trim() : memoryExceeded ? 'Memory limit exceeded' : undefined,
        executionTime,
        memoryUsed,
        timedOut: false,
        memoryExceeded,
      };
    } catch (err) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        output: '',
        error: err instanceof Error ? err.message : 'Unknown execution error',
        executionTime,
        memoryUsed: 0,
        timedOut: false,
        memoryExceeded: false,
      };
    } finally {
      // Cleanup: remove container
      if (container) {
        try {
          await container.remove({ force: true });
        } catch (err) {
          // Silently fail on cleanup errors
        }
      }
    }
  }

  /**
   * Compare actual output with expected output
   */
  compareOutput(actual: string, expected: string): boolean {
    // Normalize whitespace
    const normalizeOutput = (str: string) => {
      const lines = str
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      return lines.join('\n');
    };

    const normalizedActual = normalizeOutput(actual);
    const normalizedExpected = normalizeOutput(expected);

    return normalizedActual === normalizedExpected;
  }

  /**
   * Get Docker image for language
   */
  private getImageForLanguage(language: string): string {
    const images: { [key: string]: string } = {
      javascript: 'node:22-alpine',
      python: 'python:3.11-alpine',
      python3: 'python:3.11-alpine',
      cpp: 'gcc:latest',
      c: 'gcc:latest',
      java: 'openjdk:21-jdk-alpine',
      bash: 'alpine:latest',
    };

    const image = images[language.toLowerCase()];
    if (!image) {
      throw new BadRequestException(
        `Unsupported language: ${language}. Supported: ${Object.keys(images).join(', ')}`,
      );
    }
    return image;
  }

  /**
   * Get execution command for language
   */
  private getCommandForLanguage(language: string, code: string): string[] {
    switch (language.toLowerCase()) {
      case 'javascript':
        return ['node', '-e', code];
      case 'python':
      case 'python3':
        return ['python', '-c', code];
      case 'cpp':
      case 'c':
        // For C/C++, we'd need to compile and run
        // This is simplified - in production, write file and compile
        return ['sh', '-c', `echo "${code}" | gcc -xc - -o /tmp/prog && /tmp/prog`];
      case 'java':
        // Simplified Java execution
        return ['sh', '-c', `echo "${code}" | java`];
      case 'bash':
        return ['sh', '-c', code];
      default:
        throw new BadRequestException(`Unsupported language: ${language}`);
    }
  }

  /**
   * Capture container stdout/stderr
   */
  private async captureOutput(
    container: Docker.Container,
  ): Promise<{ output: string; error: string }> {
    return new Promise(async (resolve, reject) => {
      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });

      let output = '';
      let error = '';
      let buffer = Buffer.alloc(0);

      stream.on('data', (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk]);

        // Parse Docker multiplexed stream format
        // Each frame: [stream_type(1), 0, 0, 0, size(4 bytes), payload]
        while (buffer.length >= 8) {
          const streamType = buffer[0];
          const size = buffer.readUInt32BE(4);

          if (buffer.length < 8 + size) {
            break; // Not enough data yet
          }

          const payload = buffer.slice(8, 8 + size).toString('utf-8');

          // stream_type: 1=stdout, 2=stderr, 5=stdout, 6=stderr
          if (streamType === 1 || streamType === 5) {
            output += payload;
          } else if (streamType === 2 || streamType === 6) {
            error += payload;
          }

          buffer = buffer.slice(8 + size);
        }
      });

      stream.on('error', (err) => {
        error = err.message;
      });

      stream.on('end', () => {
        // Add any remaining data in buffer
        if (buffer.length > 0) {
          output += buffer.toString('utf-8');
        }
        resolve({ output, error });
      });

      // Wait for container to exit
      await container.wait();
    });
  }

  /**
   * Get container memory stats
   */
  private async getContainerStats(
    container: Docker.Container,
  ): Promise<any> {
    try {
      return new Promise((resolve) => {
        container.stats({ stream: false }, (err, stats) => {
          if (err) {
            resolve({});
            return;
          }
          
          // If stats is a Buffer, parse it
          if (Buffer.isBuffer(stats)) {
            try {
              const parsed = JSON.parse(stats.toString());
              resolve(parsed);
              return;
            } catch (e) {
              resolve({});
              return;
            }
          }
          
          resolve(stats || {});
        });
      });
    } catch (err) {
      return {};
    }
  }

  /**
   * Promise that rejects after timeout
   */
  private timeoutPromise(ms: number): Promise<'TIMEOUT'> {
    return new Promise((resolve) => {
      setTimeout(() => resolve('TIMEOUT'), ms);
    });
  }
}
