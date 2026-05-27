import { Entity, Column } from 'typeorm';
import { TimestampEntity } from 'src/commun/entities/timestamp.entity';

export enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  USER = 'user',
}

@Entity('users')
export class User extends TimestampEntity {
  @Column({ unique: true })
  name!: string;

  @Column()
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role!: Role;
}
