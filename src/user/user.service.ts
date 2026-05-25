import { Injectable } from '@nestjs/common';

import { Role, User } from './entities/user.entity';
import { BaseService } from 'src/commun/generic-crud.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>)
    {
      super(userRepository);
    }

    async onApplicationBootstrap() {
    const adminExists = await this.userRepository.findOne({ 
      where: { role: Role.ADMIN } 
    });

    if (!adminExists) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash('admin123', salt); // Change this password!

      await this.create({
        name: 'superadmin',
        passwordHash: hashedPassword,
        role: Role.ADMIN,
      });
    }
  }

    async findByName(name: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { name } 
    });
  }

  
}
