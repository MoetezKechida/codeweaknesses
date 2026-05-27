import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { OmitType } from '@nestjs/mapped-types';

export class LoginDto extends OmitType(CreateUserDto, ['role']) {}
