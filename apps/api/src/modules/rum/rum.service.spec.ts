import { RumService } from './rum.service';

describe('RumService', () => {
  it('logs one line per ingested event without injecting placeholder values', () => {
    const service = new RumService();
    const loggerSpy = jest
      .spyOn(
        (
          service as unknown as { logger: { log: (line: string) => void } }
        ).logger,
        'log',
      )
      .mockImplementation(() => undefined);

    service.ingest([
      {
        type: 'web-vital',
        path: '/health',
        metricName: 'CLS',
        metricValue: 0.03,
        requestId: 'ed6f2cf5-7d62-42f8-be2a-5e432efab947',
        release: 'web@0.1.0',
      },
      {
        type: 'navigation',
        path: '/dashboard',
      },
    ]);

    expect(loggerSpy).toHaveBeenCalledTimes(2);
    expect(loggerSpy.mock.calls[0][0]).toContain('rum type=web-vital path=/health metric=CLS');
    expect(loggerSpy.mock.calls[1][0]).toContain(
      'rum type=navigation path=/dashboard metric=undefined value=undefined requestId=undefined release=undefined',
    );
  });
});
