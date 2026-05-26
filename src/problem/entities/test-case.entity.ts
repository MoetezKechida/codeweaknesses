import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TimestampEntity } from 'src/commun/entities/timestamp.entity';
import { Problem } from 'src/problem/entities/problem.entity';

@Entity('test_cases')
export class TestCase extends TimestampEntity {
  @Column()
  problemId!: string;

  @Column('text')
  input!: string;

  @Column('text')
  expectedOutput!: string;

  @Column({ default: false })
  isHidden!: boolean; // Hidden test cases don't show input/output to user

  @Column({ default: 0 })
  orderIndex!: number; // For ordering test cases

  @ManyToOne(() => Problem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'problemId' })
  problem!: Problem;
}
