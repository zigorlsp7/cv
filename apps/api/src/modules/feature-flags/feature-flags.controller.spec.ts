import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';

describe('FeatureFlagsController', () => {
  it('returns the full feature-flag map', () => {
    const service = {
      getAll: jest.fn().mockReturnValue({
        swagger_docs: true,
        rum_ingest: false,
      }),
    } as unknown as FeatureFlagsService;
    const controller = new FeatureFlagsController(service);

    expect(controller.list()).toEqual({
      swagger_docs: true,
      rum_ingest: false,
    });
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });
});
