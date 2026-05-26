import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';

@Injectable()
export class QueueService implements OnModuleInit {
  private submissionQueue: Queue;
  private worker: Worker;
  private redisConnection: any;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Redis connection options for BullMQ
    const redisHost = this.configService.get('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get('REDIS_PORT', 6379);

    this.redisConnection = {
      host: redisHost,
      port: redisPort,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    // Create submission queue
    this.submissionQueue = new Queue('submissions', {
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

    console.log('Queue service initialized with Redis connection');
  }

  /**
   * Get the submission queue instance
   */
  getSubmissionQueue(): Queue {
    return this.submissionQueue;
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
    if (!this.worker) {
      this.worker = new Worker(queueName, processor, {
        connection: this.redisConnection,
        concurrency: 1,
      });

      this.worker.on('completed', (job) => {
        if (job) {
          console.log(`Job ${job.id} completed`);
        }
      });

      this.worker.on('failed', (job, err) => {
        if (job) {
          console.error(`Job ${job.id} failed:`, err.message);
        }
      });
    }
  }

  /**
   * Enqueue a submission job
   */
  async enqueueSubmission(submissionId: string, data: any): Promise<void> {
    await this.submissionQueue.add(submissionId, data, {
      jobId: submissionId,
    });
  }

  /**
   * Close queue and Redis connection
   */
  async closeQueue(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.submissionQueue) {
      await this.submissionQueue.close();
    }
  }
}
