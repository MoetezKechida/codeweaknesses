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

  @Column({ default: false })
  isHidden!: boolean;

  @Column({ type: 'text', nullable: true })
  output!: string | null;

  @Column({ type: 'text', nullable: true })
  expectedOutput!: string | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @Column({ type: 'integer', nullable: true })
  executionTime!: number | null;

  @Column({ type: 'integer', nullable: true })
  memoryUsed!: number | null;

  @ManyToOne(() => Submission, (submission) => submission.testResults)
  @JoinColumn({ name: 'submissionId' })
  submission!: Submission;
}
