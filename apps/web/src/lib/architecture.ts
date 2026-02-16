import 'server-only';

export type ArchitectureLayer =
  | 'frontend'
  | 'api'
  | 'data'
  | 'observability'
  | 'delivery';

export type ArchitectureNode = {
  id: string;
  label: string;
  layer: ArchitectureLayer;
  kind: 'ui' | 'service' | 'database' | 'pipeline' | 'gateway';
  summary: string;
  x: number;
  y: number;
};

export type ArchitectureEdge = {
  from: string;
  to: string;
  relation: string;
};

export type ArchitectureGraph = {
  version: string;
  generatedAt: string;
  layers: ArchitectureLayer[];
  featureFlags: Record<string, boolean>;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  stats: {
    nodeCount: number;
    edgeCount: number;
  };
};

type Envelope<T> = {
  ok: boolean;
  requestId: string;
  data: T;
};

export async function getArchitectureGraph(): Promise<ArchitectureGraph> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
  const response = await fetch(`${base}/v1/architecture/graph`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to load architecture graph: ${response.status}`);
  }

  const payload = (await response.json()) as Envelope<ArchitectureGraph> | ArchitectureGraph;
  if ('data' in payload) {
    return payload.data;
  }
  return payload;
}
