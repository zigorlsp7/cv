import { FeatureFlagsService } from './feature-flags.service';

jest.mock('../../config/app.config', () => ({
  config: {
    features: {
      rum_ingest: true,
      beta_checkout: true,
    },
  },
}));

describe('FeatureFlagsService', () => {
  const service = new FeatureFlagsService();

  it('returns true only for enabled flags', () => {
    expect(service.isEnabled('rum_ingest')).toBe(true);
    expect(service.isEnabled('beta_checkout')).toBe(true);
    expect(service.isEnabled('unknown_flag')).toBe(false);
  });

  it('returns a defensive copy for all flags', () => {
    const flags = service.getAll();
    flags.rum_ingest = false;

    expect(service.getAll().rum_ingest).toBe(true);
  });
});
