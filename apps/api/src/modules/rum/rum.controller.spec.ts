import { NotFoundException } from '@nestjs/common';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { RumBatchDto } from './rum.dto';
import { RumController } from './rum.controller';
import { RumService } from './rum.service';

describe('RumController', () => {
  function buildController(rumIngestEnabled: boolean) {
    const rumService = {
      ingest: jest.fn(),
    } as unknown as RumService;
    const flags = {
      isEnabled: jest.fn().mockReturnValue(rumIngestEnabled),
    } as unknown as FeatureFlagsService;

    return {
      controller: new RumController(rumService, flags),
      rumService,
      flags,
    };
  }

  const batch: RumBatchDto = {
    events: [
      {
        type: 'web-vital',
        path: '/health',
        metricName: 'LCP',
        metricValue: 1200,
      },
      {
        type: 'navigation',
        path: '/dashboard',
      },
    ],
  };

  it('accepts RUM events when feature flag is enabled', () => {
    const { controller, rumService, flags } = buildController(true);

    expect(controller.ingest(batch)).toEqual({ accepted: 2 });
    expect(flags.isEnabled).toHaveBeenCalledWith('rum_ingest');
    expect(rumService.ingest).toHaveBeenCalledWith(batch.events);
  });

  it('rejects RUM events when feature flag is disabled', () => {
    const { controller, rumService } = buildController(false);

    expect(() => controller.ingest(batch)).toThrow(NotFoundException);
    expect(rumService.ingest).not.toHaveBeenCalled();
  });
});
