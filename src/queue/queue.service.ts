import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();
  private redisConnection: any;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Redis connection options for BullMQ
    const redisHost = this.configService.get('REDIS_HOST', 'localhost');
    const redisPort = this.getPositiveIntegerConfig('REDIS_PORT', 6379);

    this.redisConnection = {
      host: redisHost,
      port: redisPort,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    // Create submission queue
    this.getOrCreateQueue('submissions');

    console.log('Queue service initialized with Redis connection');
  }

  /**
   * Get the submission queue instance
   */
  getSubmissionQueue(): Queue {
    return this.getOrCreateQueue('submissions');
  }

  /**
   * Get Redis connection options
   */
  getRedisConnection(): any {
    return this.redisConnection;
  }

  /**
   * Register a job processor
   */
  registerProcessor(
    queueName: string,
    processor: (job: any) => Promise<any>,
  ): void {
    if (this.workers.has(queueName)) {
      return;
    }

    const worker = new Worker(queueName, processor, {
      connection: this.redisConnection,
      concurrency: this.getWorkerConcurrency(queueName),
    });

    worker.on('completed', (job) => {
      if (job) {
        console.log(`Job ${job.id} completed`);
      }
    });

    worker.on('failed', (job, err) => {
      if (job) {
        console.error(`Job ${job.id} failed:`, err.message);
      }
    });

    this.workers.set(queueName, worker);
  }

  /**
   * Enqueue a submission job
   */
  async enqueueSubmission(submissionId: string, data: any): Promise<void> {
    await this.getSubmissionQueue().add(submissionId, data, {
      jobId: submissionId,
    });
  }

  /**
   * Close queue and Redis connection
   */
  async closeQueue(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.close();
    }

    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }

  private getOrCreateQueue(queueName: string): Queue {
    const existingQueue = this.queues.get(queueName);
    if (existingQueue) {
      return existingQueue;
    }

    const queue = new Queue(queueName, {
      connection: this.redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    this.queues.set(queueName, queue);
    return queue;
  }

  private getWorkerConcurrency(queueName: string): number {
    const queueEnvKeys = this.getQueueConcurrencyEnvKeys(queueName);
    const globalFallback = this.getPositiveIntegerConfig(
      'WORKER_CONCURRENCY',
      1,
    );
    const queueDefault = queueName === 'submissions' ? 2 : globalFallback;

    for (const envKey of queueEnvKeys) {
      const configuredValue = this.configService.get<
        string | number | undefined
      >(envKey);
      if (
        configuredValue === undefined ||
        configuredValue === null ||
        configuredValue === ''
      ) {
        continue;
      }

      return this.parsePositiveInteger(configuredValue, queueDefault);
    }

    return queueDefault;
  }

  private getQueueConcurrencyEnvKeys(queueName: string): string[] {
    const normalizedQueueName = queueName
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .toUpperCase();
    const envKeys = [`${normalizedQueueName}_WORKER_CONCURRENCY`];

    if (normalizedQueueName.endsWith('S')) {
      envKeys.unshift(`${normalizedQueueName.slice(0, -1)}_WORKER_CONCURRENCY`);
    }

    return envKeys;
  }

  private getPositiveIntegerConfig(key: string, fallback: number): number {
    const value = this.configService.get<string | number | undefined>(key);
    if (value === undefined || value === null || value === '') {
      return fallback;
    }

    return this.parsePositiveInteger(value, fallback);
  }

  private parsePositiveInteger(
    value: string | number,
    fallback: number,
  ): number {
    const parsedValue =
      typeof value === 'number' ? value : Number.parseInt(value, 10);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      return fallback;
    }

    return parsedValue;
  }
}
