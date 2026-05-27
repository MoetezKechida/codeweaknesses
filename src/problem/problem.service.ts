import { Injectable } from '@nestjs/common';

import { Problem } from './entities/problem.entity';
import { TestCase } from './entities/test-case.entity';
import { BaseService } from 'src/commun/generic-crud.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProblemDto } from './dto/create-problem.dto';
import { CreateTestCaseDto } from './dto/create-test-case.dto';

@Injectable()
export class ProblemService extends BaseService<Problem> {
  constructor(
    @InjectRepository(Problem)
    private readonly problemRepository: Repository<Problem>,
    @InjectRepository(TestCase)
    private readonly testCaseRepository: Repository<TestCase>,
  ) {
    super(problemRepository);
  }

  async findByContest(contestId: string): Promise<Problem[]> {
    return this.problemRepository.find({
      where: { contest: { id: contestId } },
      withDeleted: false,
    });
  }

  async create(createProblemDto: CreateProblemDto) {
    const { contestId, ...restOfDto } = createProblemDto;
    const problem = this.problemRepository.create({
      ...restOfDto,
      contest: { id: contestId },
    });

    return this.problemRepository.save(problem);
  }

  /**
   * Add a test case to a problem
   */
  async addTestCase(
    problemId: string,
    createTestCaseDto: CreateTestCaseDto,
  ): Promise<TestCase> {
    const testCase = this.testCaseRepository.create({
      ...createTestCaseDto,
      problemId,
    });
    return this.testCaseRepository.save(testCase);
  }

  /**
   * Get all test cases for a problem
   */
  async getTestCases(problemId: string): Promise<TestCase[]> {
    return this.testCaseRepository.find({
      where: { problemId },
      order: { orderIndex: 'ASC' },
    });
  }

  /**
   * Get visible test cases (not hidden) for a problem
   */
  async getVisibleTestCases(problemId: string): Promise<TestCase[]> {
    return this.testCaseRepository.find({
      where: { problemId, isHidden: false },
      order: { orderIndex: 'ASC' },
    });
  }

  /**
   * Delete a test case
   */
  async deleteTestCase(testCaseId: string): Promise<void> {
    await this.testCaseRepository.delete(testCaseId);
  }
}
