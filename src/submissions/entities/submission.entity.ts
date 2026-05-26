import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TimestampEntity } from 'src/commun/entities/timestamp.entity';
import { User } from 'src/user/entities/user.entity';
import { Problem } from 'src/problem/entities/problem.entity';
import { TestResult } from './test-result.entity';

export enum SubmissionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  ACCEPTED = 'accepted',
  WRONG = 'wrong',
  TLE = 'tle', 
  MLE = 'mle', 
  RUNTIME_ERROR = 'runtime_error',
  COMPILATION_ERROR = 'compilation_error',
}

export enum SubmissionLanguage {
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  PYTHON3 = 'python3',
  CPP = 'cpp',
  C = 'c',
  JAVA = 'java',
  BASH = 'bash',
}

@Entity('submissions')
export class Submission extends TimestampEntity {
  @Column()
  code!: string;

  @Column({
    type: 'enum',
    enum: SubmissionLanguage,
  })
  language!: SubmissionLanguage;

  @Column({
    type: 'varchar',
    default: SubmissionStatus.PENDING,
  })
  status!: SubmissionStatus;

  @Column()
  userId!: string;

  @Column()
  problemId!: string;

  @Column()
  contestId!: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date;

  @Column({ default: 0 })
  score!: number;

  @Column({ nullable: true })
  executionTime!: number;

  @Column({ nullable: true })
  memoryUsed!: number; 

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Problem, (problem) => problem.id)
  @JoinColumn({ name: 'problemId' })
  problem!: Problem;

  @OneToMany(() => TestResult, (result) => result.submission)
  testResults!: TestResult[];
}
