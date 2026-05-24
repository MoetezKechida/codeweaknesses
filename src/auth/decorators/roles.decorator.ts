import { SetMetadata } from '@nestjs/common';
import { Role } from '../../user/entities/user.entity';

export const ROLES_KEY = 'roles';
// This decorator allows us to write @Roles(Role.ADMIN) above any route
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);