import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

@Injectable()
export class SubmissionSseService {
  private streams = new Map<string, Subject<MessageEvent>>();
  // Track reference counts for multiple clients listening to the same submission
  private refCounts = new Map<string, number>();

  getOrCreate(submissionId: string): Subject<MessageEvent> {
    if (!this.streams.has(submissionId)) {
      this.streams.set(submissionId, new Subject<MessageEvent>());
      this.refCounts.set(submissionId, 0);
    }

    // Increment ref count
    const currentCount = this.refCounts.get(submissionId) || 0;
    this.refCounts.set(submissionId, currentCount + 1);

    return this.streams.get(submissionId)!;
  }

  push(submissionId: string, event: unknown): void {
    this.streams.get(submissionId)?.next({ data: event } as MessageEvent);
  }

  complete(submissionId: string): void {
    const subject = this.streams.get(submissionId);
    if (subject) {
      subject.complete();
      this.streams.delete(submissionId);
      this.refCounts.delete(submissionId);
    }
  }

  error(submissionId: string, message: string): void {
    const subject = this.streams.get(submissionId);
    if (subject) {
      subject.next({
        data: { type: 'submission.error', message },
      } as MessageEvent);
      this.complete(submissionId);
    }
  }

  cleanup(submissionId: string): void {
    if (!this.refCounts.has(submissionId)) {
      return;
    }

    const currentCount = this.refCounts.get(submissionId)! - 1;

    if (currentCount <= 0) {
      this.complete(submissionId);
    } else {
      this.refCounts.set(submissionId, currentCount);
    }
  }
}
