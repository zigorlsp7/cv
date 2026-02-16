import { ArchitectureService } from './architecture.service';

describe('ArchitectureService', () => {
  it('returns a consistent architecture graph shape', () => {
    const service = new ArchitectureService();
    const graph = service.getGraph();

    expect(graph.version).toBe('2026.02');
    expect(new Date(graph.generatedAt).toString()).not.toBe('Invalid Date');
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.stats.nodeCount).toBe(graph.nodes.length);
    expect(graph.stats.edgeCount).toBe(graph.edges.length);
    expect(graph.featureFlags).toEqual(expect.any(Object));

    const ids = new Set(graph.nodes.map((node) => node.id));
    expect(ids.size).toBe(graph.nodes.length);
    expect(graph.edges.every((edge) => ids.has(edge.from) && ids.has(edge.to))).toBe(
      true,
    );
    expect(ids.has('git')).toBe(true);
    expect(ids.has('docker')).toBe(true);
    expect(ids.has('husky')).toBe(true);
  });
});
