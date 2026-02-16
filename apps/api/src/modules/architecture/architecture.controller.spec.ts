import { ArchitectureController } from './architecture.controller';
import { ArchitectureService } from './architecture.service';

describe('ArchitectureController', () => {
  it('returns graph payload from service', () => {
    const mockGraph = {
      version: '2026.02',
      generatedAt: new Date().toISOString(),
      layers: ['frontend', 'api', 'data', 'observability', 'delivery'],
      featureFlags: { rum_ingest: true },
      nodes: [],
      edges: [],
      stats: { nodeCount: 0, edgeCount: 0 },
    };
    const service = {
      getGraph: jest.fn().mockReturnValue(mockGraph),
    } as unknown as ArchitectureService;
    const controller = new ArchitectureController(service);

    expect(controller.getGraph()).toEqual(mockGraph);
    expect(service.getGraph).toHaveBeenCalledTimes(1);
  });
});
