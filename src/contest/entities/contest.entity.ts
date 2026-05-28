import { Entity, Column, OneToMany } from 'typeorm';
import { Problem } from '../../problem/entities/problem.entity';
import { TimestampEntity } from '../../commun/entities/timestamp.entity';

@Entity('contests')
export class Contest extends TimestampEntity {
  @Column()
  title!: string;

  @Column()
  startTime!: Date;

  @Column()
  endTime!: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt!: Date | null;

  @OneToMany(() => Problem, (problem) => problem.contest)
  problems!: Problem[];
}
