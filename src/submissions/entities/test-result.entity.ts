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

  @Column({ nullable: true })
  output!: string | null;

  @Column({ nullable: true })
  expectedOutput!: string | null;

  @Column({ nullable: true })
  error!: string | null;

  @Column({ nullable: true })
  executionTime!: number | null;

  @Column({ nullable: true })
  memoryUsed!: number | null;

  @ManyToOne(() => Submission, (submission) => submission.testResults)
  @JoinColumn({ name: 'submissionId' })
  submission!: Submission;
}
