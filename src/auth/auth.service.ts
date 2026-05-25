import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}


  async validateUser(name: string, pass: string): Promise<any> {
    const user = await this.userService.findByName(name);
    
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  
  async login(user: any) {
    
    const payload = { name: user.name, sub: user.id, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}