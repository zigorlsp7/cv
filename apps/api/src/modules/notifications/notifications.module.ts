import { Module } from '@nestjs/common';
import { NotificationPublisherService } from './notification.publisher.service';

@Module({
  providers: [NotificationPublisherService],
  exports: [NotificationPublisherService],
})
export class NotificationsModule {}
