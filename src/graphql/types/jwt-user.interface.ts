import { Role } from 'src/user/entities/user.entity';

export interface JwtUser {
  userId: string;
  name: string;
  role: Role;
}
