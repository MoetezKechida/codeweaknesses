import { Injectable } from '@nestjs/common';

import { User } from './entities/user.entity';
import { BaseService } from 'src/commun/generic-crud.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>)
    {
      super(userRepository);
    }

  
}
