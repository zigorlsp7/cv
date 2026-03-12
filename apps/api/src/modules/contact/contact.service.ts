import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NotificationPublisherService } from '../notifications/notification.publisher.service';
import { SendContactMessageDto } from './contact.dto';

type ContactContext = {
  sourceIp?: string;
  userAgent?: string;
};

@Injectable()
export class ContactService {
  private readonly recipientEmail = 'zigorlsp7@gmail.com';

  constructor(
    private readonly notificationPublisher: NotificationPublisherService,
  ) {}

  async sendMessage(
    input: SendContactMessageDto,
    context: ContactContext = {},
  ): Promise<{ accepted: true; messageId: string }> {
    const messageId = randomUUID();
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const subject = input.subject.trim();
    const message = input.message.trim();
    const pageUrl = input.pageUrl?.trim();
    const locale = input.locale?.trim();

    await this.notificationPublisher.publishEmail({
      messageId,
      idempotencyKey: messageId,
      sourceApp: 'cv',
      channel: 'email',
      templateId: 'cv.contact-message',
      replyTo: email,
      recipient: {
        email: this.recipientEmail,
      },
      data: {
        senderName: name,
        senderEmail: email,
        subjectLine: subject,
        message,
        pageUrl,
        locale,
        submittedAt: new Date().toISOString(),
      },
      metadata: {
        feature: 'cv-contact',
        sourceIp: context.sourceIp,
        userAgent: context.userAgent,
      },
      requestedAt: new Date().toISOString(),
    });

    return {
      accepted: true,
      messageId,
    };
  }
}
