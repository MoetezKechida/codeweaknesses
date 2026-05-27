import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { Submission } from './entities/submission.entity';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findCurrentUserSubmissions(@Request() req): Promise<Submission[]> {
    return this.submissionsService.findByUser(req.user.userId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @Request() req,
  ): Promise<Submission> {
    const userId = req.user.userId;
    return this.submissionsService.create(createSubmissionDto, userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string): Promise<Submission> {
    return this.submissionsService.findOne(id);
  }

  @Get('user/history')
  @UseGuards(AuthGuard('jwt'))
  async getUserSubmissions(@Request() req): Promise<Submission[]> {
    const userId = req.user.userId;
    return this.submissionsService.findByUser(userId);
  }

  @Get('problem/:problemId')
  @UseGuards(AuthGuard('jwt'))
  async getProblemSubmissions(
    @Param('problemId') problemId: string,
  ): Promise<Submission[]> {
    return this.submissionsService.findByProblem(problemId);
  }

  @Get('contest/:contestId')
  @UseGuards(AuthGuard('jwt'))
  async getContestSubmissions(
    @Param('contestId') contestId: string,
  ): Promise<Submission[]> {
    return this.submissionsService.findByContest(contestId);
  }
}
