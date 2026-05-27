// src/contest/contest.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  UseGuards,
  Patch,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../user/entities/user.entity';
import { ContestService } from './contest.service';

@Controller('contests')
export class ContestController {
  constructor(private readonly contestService: ContestService) {}

  @Get()
  getAllContests() {
    return this.contestService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  createContest(@Body() createContestDto: any) {
    return this.contestService.create(createContestDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  updateContest(@Body() updateContestDto: any, @Param('id') id: string) {
    return this.contestService.update(id, updateContestDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  deleteContest(@Param('id') id: string) {
    return this.contestService.remove(id);
  }

  @Patch('restore/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  restoreContest(@Param('id') id: string) {
    return this.contestService.restore(id);
  }
}
