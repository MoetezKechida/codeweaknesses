import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission, SubmissionStatus } from './entities/submission.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { Problem } from 'src/problem/entities/problem.entity';
import { Contest } from 'src/contest/entities/contest.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
    @InjectRepository(Problem)
    private problemsRepository: Repository<Problem>,
    @InjectRepository(Contest)
    private contestsRepository: Repository<Contest>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    createSubmissionDto: CreateSubmissionDto,
    userId: string,
  ): Promise<Submission> {
    const { code, language, problemId, contestId } = createSubmissionDto;

    const problem = await this.problemsRepository.findOne({
      where: { id: problemId },
      relations: {
        contest: true,
      },
    });
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }
    const contest = await this.contestsRepository.findOne({
      where: { id: contestId },
    });
    if (!contest) {
      throw new NotFoundException('Contest not found');
    }

    if (!problem.contest || problem.contest.id !== contestId) {
      throw new BadRequestException(
        'Problem does not belong to this contest',
      );
    }
    const now = new Date();
    if (new Date(contest.startTime) > now) {
      throw new BadRequestException('Contest has not started yet');
    }
    if (new Date(contest.endTime) < now) {
      throw new BadRequestException('Contest has ended');
    }


    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }


    if (!code || code.trim().length === 0) {
      throw new BadRequestException('Code cannot be empty');
    }

    const submission = this.submissionsRepository.create({
      code,
      language,
      problemId,
      contestId,
      userId,
      status: SubmissionStatus.PENDING,
      submittedAt: new Date(),
    });

    return this.submissionsRepository.save(submission);
  }

  async findOne(id: string): Promise<Submission> {
    const submission = await this.submissionsRepository.findOne({
      where: { id },
      relations: {
        user: true,
        problem: true,
        testResults: true,
      },
    });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return submission;
  }

  async findByUser(userId: string): Promise<Submission[]> {
    return this.submissionsRepository.find({
      where: { userId },
      relations: {
        problem: true,
        testResults: true,
      },
      order: { submittedAt: 'DESC' },
    });
  }

  async findByProblem(problemId: string): Promise<Submission[]> {
    return this.submissionsRepository.find({
      where: { problemId },
      relations: {
        user: true,
        testResults: true,
      },
      order: { submittedAt: 'DESC' },
    });
  }

  async findByContest(contestId: string): Promise<Submission[]> {
    return this.submissionsRepository.find({
      where: { contestId },
      relations: {
        user: true,
        problem: true,
        testResults: true,
      },
      order: { submittedAt: 'DESC' },
    });
  }

  async updateStatus(
    id: string,
    status: SubmissionStatus,
  ): Promise<Submission> {
    await this.submissionsRepository.update(id, {
      status,
      completedAt:
        status !== SubmissionStatus.PENDING ? new Date() : undefined,
    });
    return this.findOne(id);
  }

  async updateResult(
    id: string,
    score: number,
    executionTime: number,
    memoryUsed: number,
  ): Promise<Submission> {
    await this.submissionsRepository.update(id, {
      score,
      executionTime,
      memoryUsed,
    });
    return this.findOne(id);
  }
}
