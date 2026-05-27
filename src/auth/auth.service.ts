import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(name: string, pass: string): Promise<any> {
    const user = await this.userService.findByName(name);

    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      return this.sanitizeUser(user);
    }
    return null;
  }

  async login(user: any) {
    const sanitizedUser = this.sanitizeUser(user);
    const payload = {
      name: sanitizedUser.name,
      sub: sanitizedUser.id,
      role: sanitizedUser.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: sanitizedUser,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userService.findOne(userId);
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: User | Record<string, any>) {
    const { passwordHash, deletedAt, ...safeUser } = user as User & {
      passwordHash?: string;
      deletedAt?: Date | null;
    };

    return safeUser;
  }
}
