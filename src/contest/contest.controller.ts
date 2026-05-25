// src/contest/contest.controller.ts
import { Controller, Get, Post, Body, Delete, UseGuards } from '@nestjs/common';
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


  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  deleteContest(id: string) {
    return this.contestService.remove(id);
  }


}