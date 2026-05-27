import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docker from 'dockerode';
import { SubmissionLanguage } from '../entities/submission.entity';

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
    language: SubmissionLanguage,
    code: string,
    input: string,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    let container: Docker.Container | null = null;

    try {
      // Get the appropriate image for the language
      const image = this.getImageForLanguage(language);

      let container: Docker.Container;
      const createOptions = {
        Image: image,
        Env: [
          `CODE=${code}`,
          `INPUT=${input}`
        ],
        Cmd: this.getCommandForLanguage(language),
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
      };

      try {
        // Create container
        container = await this.docker.createContainer(createOptions);
      } catch (err: any) {
        if (err.statusCode === 404) {
          // Image not found, pull it first
          this.logger.log(`Image ${image} not found locally. Pulling...`);
          await new Promise((resolve, reject) => {
            this.docker.pull(image, (pullErr: Error, stream: NodeJS.ReadableStream) => {
              if (pullErr) return reject(pullErr);
              this.docker.modem.followProgress(stream, (followErr: Error, output: any) => {
                if (followErr) return reject(followErr);
                resolve(output);
              });
            });
          });
          // Try again
          container = await this.docker.createContainer(createOptions);
        } else {
          throw err;
        }
      }

      // Attach to stream BEFORE starting the container to capture fast executions
      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });

      // Start container
      await container.start();

      // Wait for container to finish or timeout
      let output = '';
      let error = '';
      let timedOut = false;

      try {
        const result = await Promise.race([
          this.readStream(container, stream),
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
        error: error
          ? error.trim()
          : memoryExceeded
            ? 'Memory limit exceeded'
            : undefined,
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
  private getImageForLanguage(language: SubmissionLanguage): string {
    const images: Record<SubmissionLanguage, string> = {
      [SubmissionLanguage.JAVASCRIPT]: 'node:22-alpine',
      [SubmissionLanguage.PYTHON]: 'python:3.11-alpine',
      [SubmissionLanguage.PYTHON3]: 'python:3.11-alpine',
      [SubmissionLanguage.CPP]: 'gcc:latest',
      [SubmissionLanguage.C]: 'gcc:latest',
      [SubmissionLanguage.JAVA]: 'openjdk:21-jdk-alpine',
      [SubmissionLanguage.BASH]: 'alpine:latest',
    };

    const image = images[language];
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
  private getCommandForLanguage(
    language: SubmissionLanguage
  ): string[] {
    switch (language) {
      case SubmissionLanguage.JAVASCRIPT:
        return ['sh', '-c', 'printf "%s" "$INPUT" | node -e "eval(process.env.CODE)"'];
      case SubmissionLanguage.PYTHON:
      case SubmissionLanguage.PYTHON3:
        return ['sh', '-c', 'printf "%s" "$INPUT" | python -c "import os; exec(os.environ[\'CODE\'])"'];
      case SubmissionLanguage.CPP:
      case SubmissionLanguage.C:
        return [
          'sh',
          '-c',
          'printf "%s" "$CODE" > /tmp/prog.c && gcc -xc /tmp/prog.c -o /tmp/prog && printf "%s" "$INPUT" | /tmp/prog',
        ];
      case SubmissionLanguage.JAVA:
        return ['sh', '-c', 'printf "%s" "$CODE" > Main.java && javac Main.java && printf "%s" "$INPUT" | java Main'];
      case SubmissionLanguage.BASH:
        return ['sh', '-c', 'printf "%s" "$INPUT" | sh -c "$CODE"'];
      default:
        throw new BadRequestException(`Unsupported language: ${language}`);
    }
  }

  private async readStream(
    container: Docker.Container,
    stream: NodeJS.ReadableStream,
  ): Promise<{ output: string; error: string }> {
    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';

      container.modem.demuxStream(
        stream,
        {
          write: (data: Buffer) => {
            output += data.toString();
          },
        },
        {
          write: (data: Buffer) => {
            error += data.toString();
          },
        },
      );

      stream.on('end', async () => {
        // Wait for container to exit completely
        await container.wait();
        resolve({ output, error });
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Get container memory stats
   */
  private async getContainerStats(container: Docker.Container): Promise<any> {
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
