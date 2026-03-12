import { ContactService } from './contact.service';
import { NotificationPublisherService } from '../notifications/notification.publisher.service';

describe('ContactService', () => {
  it('publishes a CV contact notification event', async () => {
    const publisher = {
      publishEmail: jest.fn().mockResolvedValue(undefined),
    } as unknown as NotificationPublisherService;

    const service = new ContactService(publisher);

    const result = await service.sendMessage(
      {
        name: 'Visitor Name',
        email: 'Visitor@example.com',
        subject: 'New opportunity',
        message: 'Let us talk about the role.',
        pageUrl: 'https://cv.zigordev.com',
        locale: 'en',
      },
      {
        sourceIp: '203.0.113.10',
        userAgent: 'Mozilla/5.0',
      },
    );

    expect(result.accepted).toBe(true);
    expect(result.messageId).toEqual(expect.any(String));
    expect(publisher.publishEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: result.messageId,
        idempotencyKey: result.messageId,
        sourceApp: 'cv',
        channel: 'email',
        templateId: 'cv.contact-message',
        replyTo: 'visitor@example.com',
        recipient: { email: 'zigorlsp7@gmail.com' },
        data: expect.objectContaining({
          senderName: 'Visitor Name',
          senderEmail: 'visitor@example.com',
          subjectLine: 'New opportunity',
          message: 'Let us talk about the role.',
          pageUrl: 'https://cv.zigordev.com',
          locale: 'en',
          submittedAt: expect.any(String),
        }),
        metadata: expect.objectContaining({
          feature: 'cv-contact',
          sourceIp: '203.0.113.10',
          userAgent: 'Mozilla/5.0',
        }),
        requestedAt: expect.any(String),
      }),
    );
  });

  it('keeps optional fields undefined when they are not provided', async () => {
    const publisher = {
      publishEmail: jest.fn().mockResolvedValue(undefined),
    } as unknown as NotificationPublisherService;

    const service = new ContactService(publisher);

    await service.sendMessage(
      {
        name: 'Visitor Name',
        email: 'Visitor@example.com',
        subject: 'New opportunity',
        message: 'Let us talk about the role.',
      },
      {},
    );

    expect(publisher.publishEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: 'visitor@example.com',
        data: expect.objectContaining({
          pageUrl: undefined,
          locale: undefined,
        }),
        metadata: expect.objectContaining({
          sourceIp: undefined,
          userAgent: undefined,
        }),
      }),
    );
  });
});
