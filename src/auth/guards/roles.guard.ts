// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../user/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get the roles required for this route from the @Roles decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, let them through
    if (!requiredRoles) {
      return true;
    }

    // 2. Extract the user from the request (injected previously by JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // 3. Verify the user exists and has the necessary role
    return requiredRoles.some((role) => user?.role?.includes(role));
  }
}
