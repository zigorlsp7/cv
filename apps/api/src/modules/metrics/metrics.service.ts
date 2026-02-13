import { Injectable } from '@nestjs/common';
import { registry } from './metrics.registry';

@Injectable()
export class MetricsService {
  getContentType() {
    return registry.contentType;
  }

  async getMetrics() {
    return registry.metrics();
  }
}
