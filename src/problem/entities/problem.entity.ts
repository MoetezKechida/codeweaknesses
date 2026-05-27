import { Entity, Column, ManyToOne } from 'typeorm';
import { Contest } from '../../contest/entities/contest.entity';
import { TimestampEntity } from '../../commun/entities/timestamp.entity';

@Entity('problems')
export class Problem extends TimestampEntity {

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  timeLimitMs!: number;

  @ManyToOne(() => Contest, (contest) => contest.problems)
  contest!: Contest;
}