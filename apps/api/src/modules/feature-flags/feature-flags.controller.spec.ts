import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';

describe('FeatureFlagsController', () => {
  it('returns the full feature-flag map', () => {
    const service = {
      getAll: jest.fn().mockReturnValue({
        rum_ingest: false,
        beta_profile_editor: true,
      }),
    } as unknown as FeatureFlagsService;
    const controller = new FeatureFlagsController(service);

    expect(controller.list()).toEqual({
      rum_ingest: false,
      beta_profile_editor: true,
    });
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });
});
