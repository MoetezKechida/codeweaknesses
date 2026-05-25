import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TimestampEntity } from 'src/commun/entities/timestamp.entity';
import { Submission } from './submission.entity';

@Entity('test_results')
export class TestResult extends TimestampEntity {
  @Column()
  submissionId!: string;

  @Column()
  testCaseId!: string;

  @Column({ default: false })
  passed!: boolean;

  @Column({ nullable: true })
  output!: string;

  @Column({ nullable: true })
  expectedOutput!: string;

  @Column({ nullable: true })
  error!: string;

  @Column({ nullable: true })
  executionTime!: number; // milliseconds

  @Column({ nullable: true })
  memoryUsed!: number; // bytes

  // Relationships
  @ManyToOne(() => Submission, (submission) => submission.testResults)
  @JoinColumn({ name: 'submissionId' })
  submission!: Submission;
}
