import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

describe('ContactController', () => {
  it('delegates contact requests to the service with request context', async () => {
    const service = {
      sendMessage: jest.fn().mockResolvedValue({
        accepted: true,
        messageId: 'msg-1',
      }),
    } as unknown as ContactService;

    const controller = new ContactController(service);
    const body = {
      name: 'Visitor',
      email: 'visitor@example.com',
      subject: 'Hello',
      message: 'Interested in working together.',
    };

    await expect(
      controller.sendMessage(body, {
        ip: '127.0.0.1',
        get: (header: string) =>
          header === 'user-agent' ? 'JestAgent/1.0' : undefined,
      } as any),
    ).resolves.toEqual({
      accepted: true,
      messageId: 'msg-1',
    });

    expect(service.sendMessage).toHaveBeenCalledWith(body, {
      sourceIp: '127.0.0.1',
      userAgent: 'JestAgent/1.0',
    });
  });
});
