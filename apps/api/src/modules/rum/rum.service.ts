import { Injectable, Logger } from '@nestjs/common';
import { RumEventDto } from './rum.dto';

@Injectable()
export class RumService {
  private readonly logger = new Logger(RumService.name);

  ingest(events: RumEventDto[]): void {
    for (const event of events) {
      this.logger.log(
        `rum type=${event.type} path=${event.path} metric=${event.metricName} value=${event.metricValue} requestId=${event.requestId} release=${event.release}`,
      );
    }
  }
}
