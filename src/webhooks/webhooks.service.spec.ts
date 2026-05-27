import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WebhooksService } from './webhooks.service';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';

describe('WebhooksService retry helpers', () => {
  let service: WebhooksService;

  const subsRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'sub-1', ...value })),
    find: jest.fn(async () => []),
    findOne: jest.fn(async (options) => (options?.where?.id === 'sub-1' ? { id: 'sub-1' } : null)),
  };
  const deliveryRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'delivery-1', attempts: 0, ...value })),
    update: jest.fn(async () => undefined),
    findOne: jest.fn(async ({ where }) => ({ id: where.id })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: getRepositoryToken(WebhookSubscription), useValue: subsRepo },
        { provide: getRepositoryToken(WebhookDelivery), useValue: deliveryRepo },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  it('uses exponential backoff with a cap', () => {
    expect(service.getRetryDelayMs(1)).toBe(1000);
    expect(service.getRetryDelayMs(2)).toBe(2000);
    expect(service.getRetryDelayMs(3)).toBe(4000);
    expect(service.getRetryDelayMs(10)).toBe(15000);
  });
});import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WebhooksService } from './webhooks.service';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';

describe('WebhooksService', () => {
  let service: WebhooksService;
  const subsRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'sub-1', ...value })),
    find: jest.fn(async () => []),
    findOne: jest.fn(async (options) => (options?.where?.id === 'sub-1' ? { id: 'sub-1' } : null)),
  };
  const deliveryRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'delivery-1', ...value })),
    update: jest.fn(async () => undefined),
    findOne: jest.fn(async ({ where }) => ({ id: where.id })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: getRepositoryToken(WebhookSubscription), useValue: subsRepo },
        { provide: getRepositoryToken(WebhookDelivery), useValue: deliveryRepo },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('signs payloads with HMAC-SHA256', () => {
    expect(service.signPayload('secret', '{"ok":true}')).toMatch(/^sha256=/);
  });

  it('creates a delivery and sends a signed webhook', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);

    const subscription = {
      id: 'sub-1',
      targetUrl: 'https://example.com/webhook',
      secret: 'secret',
      contestId: null,
      active: true,
    } as WebhookSubscription;

    const result = await service.deliver(subscription, { winner: 'alice', score: 100 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.com/webhook');
    expect((init?.headers as Record<string, string>)['x-signature-256']).toMatch(/^sha256=/);
    expect(init?.method).toBe('POST');
    expect(deliveryRepo.save).toHaveBeenCalledTimes(1);
    expect(deliveryRepo.update).toHaveBeenCalledWith('delivery-1', expect.objectContaining({
      status: 'sent',
      attempts: 1,
      responseCode: 204,
    }));
    expect(result).toEqual({ id: 'delivery-1' });

    fetchMock.mockRestore();
  });
});