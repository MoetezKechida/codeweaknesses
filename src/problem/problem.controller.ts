import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { Role } from 'src/user/entities/user.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UseGuards } from '@nestjs/common';

@Controller('problem')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  create(@Body() createProblemDto: CreateProblemDto) {
    return this.problemService.create(createProblemDto);
  }

  @Get()
  findAll() {
    return this.problemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.problemService.findOne(id);
  }

  @Get('/byContest/:contestId')
  findByContest(@Param('contestId') contestId: string) {
    return this.problemService.findByContest(contestId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  update(@Param('id') id: string, @Body() updateProblemDto: UpdateProblemDto) {
    return this.problemService.update(id, updateProblemDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  remove(@Param('id') id: string) {
    return this.problemService.remove(id);
  }

  @Patch('restore/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  restore(@Param('id') id: string) {
    return this.problemService.restore(id);
  }

  // Test Case Management
  @Post(':problemId/testcases')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  addTestCase(
    @Param('problemId') problemId: string,
    @Body() createTestCaseDto: CreateTestCaseDto,
  ) {
    return this.problemService.addTestCase(problemId, createTestCaseDto);
  }

  @Get(':problemId/testcases')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  getTestCases(@Param('problemId') problemId: string) {
    return this.problemService.getTestCases(problemId);
  }

  @Get(':problemId/testcases/visible')
  getVisibleTestCases(@Param('problemId') problemId: string) {
    return this.problemService.getVisibleTestCases(problemId);
  }

  @Delete(':problemId/testcases/:testCaseId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  deleteTestCase(
    @Param('problemId') problemId: string,
    @Param('testCaseId') testCaseId: string,
  ) {
    return this.problemService.deleteTestCase(testCaseId);
  }
}
