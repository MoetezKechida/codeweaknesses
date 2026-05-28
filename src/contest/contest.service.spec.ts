import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContestService } from './contest.service';
import { Contest } from './entities/contest.entity';

describe('ContestService', () => {
  let service: ContestService;
  const repo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };
  const emitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestService,
        { provide: getRepositoryToken(Contest), useValue: repo },
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile();

    service = module.get<ContestService>(ContestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('emits contest.finished when finishContest is called', async () => {
    repo.findOne.mockResolvedValue({ id: 'contest-1', finishedAt: null });
    repo.save.mockResolvedValue({ id: 'contest-1', finishedAt: new Date() });

    await service.finishContest('contest-1');

    expect(emitter.emit).toHaveBeenCalledWith('contest.finished', { contestId: 'contest-1' });
  });
});
