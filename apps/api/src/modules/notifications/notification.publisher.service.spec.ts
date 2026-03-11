import { Logger } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import {
  NotificationEventEnvelope,
  NotificationPublisherService,
} from './notification.publisher.service';

jest.mock('kafkajs', () => ({
  Kafka: jest.fn(),
}));

type MockProducer = {
  connect: jest.Mock<Promise<void>, []>;
  send: jest.Mock<Promise<void>, [unknown]>;
  disconnect: jest.Mock<Promise<void>, []>;
};

const kafkaMock = Kafka as jest.MockedClass<typeof Kafka>;

function createProducer(): MockProducer {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };
}

function createEvent(): NotificationEventEnvelope {
  return {
    messageId: 'msg-1',
    idempotencyKey: 'idem-1',
    sourceApp: 'cv',
    channel: 'email',
    templateId: 'cv.contact-message',
    replyTo: 'visitor@example.com',
    recipient: {
      email: 'zigorlsp7@gmail.com',
    },
    data: {
      senderName: 'Visitor',
    },
    metadata: {
      feature: 'cv-contact',
    },
    requestedAt: '2026-03-11T20:00:00.000Z',
  };
}

describe('NotificationPublisherService', () => {
  const env = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...env,
      NOTIFICATIONS_KAFKA_BROKERS: 'broker-a:9092,broker-b:9092',
      NOTIFICATIONS_EMAIL_TOPIC: 'notification.email.requested.v1',
      OTEL_SERVICE_NAME: 'cv-api',
    };
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = env;
  });

  it('publishes a serialized email notification event', async () => {
    const producer = createProducer();
    kafkaMock.mockImplementation(
      () =>
        ({
          producer: jest.fn().mockReturnValue(producer),
        }) as never,
    );
    const service = new NotificationPublisherService();

    await service.publishEmail(createEvent());

    expect(Kafka).toHaveBeenCalledWith({
      clientId: 'cv-api',
      brokers: ['broker-a:9092', 'broker-b:9092'],
    });
    expect(producer.connect).toHaveBeenCalledTimes(1);
    expect(producer.send).toHaveBeenCalledWith({
      topic: 'notification.email.requested.v1',
      messages: [
        {
          key: 'idem-1',
          value: JSON.stringify(createEvent()),
          headers: {
            sourceApp: 'cv',
            templateId: 'cv.contact-message',
            channel: 'email',
          },
        },
      ],
    });
  });

  it('throws when kafka brokers are not configured', async () => {
    process.env.NOTIFICATIONS_KAFKA_BROKERS = '';
    const service = new NotificationPublisherService();

    await expect(service.publishEmail(createEvent())).rejects.toThrow(
      'NOTIFICATIONS_KAFKA_BROKERS is required',
    );

    expect(Kafka).not.toHaveBeenCalled();
  });

  it('reuses the in-flight connect promise', async () => {
    let resolveConnect!: () => void;
    const producer = createProducer();
    producer.connect.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveConnect = resolve;
        }),
    );
    kafkaMock.mockImplementation(
      () =>
        ({
          producer: jest.fn().mockReturnValue(producer),
        }) as never,
    );
    const service = new NotificationPublisherService();

    const first = (service as unknown as { getProducer(): Promise<unknown> }).getProducer();
    const second = (service as unknown as { getProducer(): Promise<unknown> }).getProducer();

    expect(Kafka).toHaveBeenCalledTimes(1);
    resolveConnect();
    await expect(first).resolves.toBe(producer);
    await expect(second).resolves.toBe(producer);
  });

  it('returns the cached producer after a successful connect', async () => {
    const producer = createProducer();
    kafkaMock.mockImplementation(
      () =>
        ({
          producer: jest.fn().mockReturnValue(producer),
        }) as never,
    );
    const service = new NotificationPublisherService();

    await service.publishEmail(createEvent());
    const cached = await (
      service as unknown as { getProducer(): Promise<unknown> }
    ).getProducer();

    expect(cached).toBe(producer);
    expect(producer.connect).toHaveBeenCalledTimes(1);
  });

  it('resets the cached producer after a send failure', async () => {
    const producer = createProducer();
    producer.send.mockRejectedValueOnce(new Error('send failed'));
    kafkaMock.mockImplementation(
      () =>
        ({
          producer: jest.fn().mockReturnValue(producer),
        }) as never,
    );
    const service = new NotificationPublisherService();

    await expect(service.publishEmail(createEvent())).rejects.toThrow('send failed');

    expect(producer.disconnect).toHaveBeenCalledTimes(1);
    expect((service as unknown as { producer: unknown }).producer).toBeNull();
    expect(
      (service as unknown as { connectPromise: Promise<unknown> | null }).connectPromise,
    ).toBeNull();
  });

  it('clears the failed connect state and retries cleanly', async () => {
    const failingProducer = createProducer();
    failingProducer.connect.mockRejectedValueOnce(new Error('connect failed'));
    const healthyProducer = createProducer();

    kafkaMock
      .mockImplementationOnce(
        () =>
          ({
            producer: jest.fn().mockReturnValue(failingProducer),
          }) as never,
      )
      .mockImplementationOnce(
        () =>
          ({
            producer: jest.fn().mockReturnValue(healthyProducer),
          }) as never,
      );

    const service = new NotificationPublisherService();

    await expect(service.publishEmail(createEvent())).rejects.toThrow('connect failed');
    await expect(service.publishEmail(createEvent())).resolves.toBeUndefined();

    expect(failingProducer.disconnect).toHaveBeenCalledTimes(1);
    expect(healthyProducer.connect).toHaveBeenCalledTimes(1);
    expect(healthyProducer.send).toHaveBeenCalledTimes(1);
  });

  it('swallows disconnect errors during module teardown', async () => {
    const producer = createProducer();
    producer.disconnect.mockRejectedValueOnce(new Error('disconnect failed'));
    const service = new NotificationPublisherService();
    (service as unknown as { producer: MockProducer }).producer = producer;

    await expect(service.onModuleDestroy()).resolves.toBeUndefined();

    expect(producer.disconnect).toHaveBeenCalledTimes(1);
    expect(Logger.prototype.warn).toHaveBeenCalledWith(
      'Failed to disconnect Kafka producer cleanly: disconnect failed',
    );
  });

  it('returns early during teardown when no producer was created', async () => {
    const service = new NotificationPublisherService();

    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
  });
});
