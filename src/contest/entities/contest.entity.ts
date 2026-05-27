import { Entity, Column, OneToMany } from 'typeorm';
import { Problem } from '../../problem/entities/problem.entity';
import { TimestampEntity } from 'src/commun/entities/timestamp.entity';

@Entity('contests')
export class Contest extends TimestampEntity {
  @Column()
  title!: string;

  @Column()
  startTime!: Date;

  @Column()
  endTime!: Date;

  @OneToMany(() => Problem, (problem) => problem.contest)
  problems!: Problem[];
}
