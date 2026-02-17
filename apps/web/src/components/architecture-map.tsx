'use client';

import { useId, useMemo, useState } from 'react';
import { useI18n } from '@/i18n/client';
import type {
  ArchitectureEdge,
  ArchitectureGraph,
  ArchitectureLayer,
  ArchitectureNode,
} from '@/lib/architecture';

type LayerFilter = ArchitectureLayer | 'all';
type LayerVisuals = { chip: string; node: string; ring: string };
type VariantTheme = {
  surface: string;
  panel: string;
  panelTitle: string;
  panelText: string;
  canvas: string;
  canvasGlowA: string;
  canvasGlowB: string;
  edge: string;
  edgeActive: string;
  chipDefault: string;
  chipDefaultActive: string;
  featureBox: string;
  featureEnabled: string;
  featureDisabled: string;
  layerStyles: Record<ArchitectureLayer, LayerVisuals>;
};

const THEME: VariantTheme = {
  surface: 'rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-xl shadow-slate-200 backdrop-blur',
  panel: 'space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200',
  panelTitle: 'text-xs font-bold uppercase tracking-[0.16em] text-slate-500',
  panelText: 'text-slate-700',
  canvas:
    'relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-2',
  canvasGlowA: 'absolute -right-16 top-0 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl',
  canvasGlowB: 'absolute -left-14 bottom-0 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl',
  edge: '#64748b',
  edgeActive: '#f8fafc',
  chipDefault: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
  chipDefaultActive: 'bg-slate-900 text-white',
  featureBox: 'rounded-xl border border-slate-200 bg-slate-50 p-3',
  featureEnabled: 'bg-emerald-100 text-emerald-700',
  featureDisabled: 'bg-rose-100 text-rose-700',
  layerStyles: {
    frontend: {
      chip: 'bg-cyan-100 text-cyan-800',
      node: '#06b6d4',
      ring: '#67e8f9',
    },
    api: {
      chip: 'bg-blue-100 text-blue-800',
      node: '#3b82f6',
      ring: '#93c5fd',
    },
    data: {
      chip: 'bg-emerald-100 text-emerald-800',
      node: '#10b981',
      ring: '#6ee7b7',
    },
    observability: {
      chip: 'bg-amber-100 text-amber-800',
      node: '#f59e0b',
      ring: '#fcd34d',
    },
    delivery: {
      chip: 'bg-rose-100 text-rose-800',
      node: '#f43f5e',
      ring: '#fda4af',
    },
  },
};

function countByLayer(nodes: ArchitectureNode[]): Record<ArchitectureLayer, number> {
  return nodes.reduce(
    (acc, node) => {
      acc[node.layer] += 1;
      return acc;
    },
    {
      frontend: 0,
      api: 0,
      data: 0,
      observability: 0,
      delivery: 0,
    },
  );
}

function buildAdjacency(edges: ArchitectureEdge[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!map.has(edge.from)) map.set(edge.from, new Set<string>());
    if (!map.has(edge.to)) map.set(edge.to, new Set<string>());
    map.get(edge.from)?.add(edge.to);
    map.get(edge.to)?.add(edge.from);
  }
  return map;
}

export function ArchitectureMap({ graph }: { graph: ArchitectureGraph }) {
  const markerId = useId().replace(/:/g, '');
  const theme = THEME;
  const { t } = useI18n();
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    graph.nodes[0]?.id ?? null,
  );
  const instructionsId = useId().replace(/:/g, '-');

  const layerCounts = useMemo(() => countByLayer(graph.nodes), [graph.nodes]);

  const visibleNodes = useMemo(
    () =>
      layerFilter === 'all'
        ? graph.nodes
        : graph.nodes.filter((node) => node.layer === layerFilter),
    [graph.nodes, layerFilter],
  );

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((node) => node.id)),
    [visibleNodes],
  );

  const visibleEdges = useMemo(
    () =>
      graph.edges.filter(
        (edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to),
      ),
    [graph.edges, visibleNodeIds],
  );

  const adjacency = useMemo(() => buildAdjacency(visibleEdges), [visibleEdges]);
  const selectedNode =
    visibleNodes.find((node) => node.id === selectedNodeId) ?? visibleNodes[0] ?? null;
  const selectedRelatedIds = selectedNode
    ? adjacency.get(selectedNode.id) ?? new Set<string>()
    : new Set<string>();

  const nodeMap = useMemo(
    () => new Map(visibleNodes.map((node) => [node.id, node])),
    [visibleNodes],
  );

  const inboundEdges = selectedNode
    ? visibleEdges.filter((edge) => edge.to === selectedNode.id)
    : [];
  const outboundEdges = selectedNode
    ? visibleEdges.filter((edge) => edge.from === selectedNode.id)
    : [];

  return (
    <section className="grid gap-6 lg:grid-cols-[3fr,1.2fr]">
      <div className={theme.surface}>
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter layers">
          {(['all', ...graph.layers] as const).map((layer) => {
            const active = layerFilter === layer;
            const count = layer === 'all' ? graph.nodes.length : layerCounts[layer];
            const chipClass =
              layer === 'all'
                ? theme.chipDefaultActive
                : theme.layerStyles[layer].chip;
            return (
              <button
                key={layer}
                type="button"
                onClick={() => {
                  setLayerFilter(layer);
                  const firstVisible =
                    layer === 'all'
                      ? graph.nodes[0]
                      : graph.nodes.find((node) => node.layer === layer);
                  setSelectedNodeId((prev) =>
                    prev
                      ? layer === 'all' ||
                        graph.nodes.find((node) => node.id === prev)?.layer === layer
                        ? prev
                        : firstVisible?.id ?? null
                      : firstVisible?.id ?? null,
                  );
                }}
                aria-pressed={active}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                  active ? chipClass : theme.chipDefault
                }`}
              >
                {layer} ({count})
              </button>
            );
          })}
        </div>

        <p id={instructionsId} className="sr-only">
          {t('architecture.map.instructions')}
        </p>

        <div
          className={theme.canvas}
          role="group"
          aria-label={t('architecture.map.ariaLabel')}
          aria-describedby={instructionsId}
        >
          <div className={theme.canvasGlowA} />
          <div className={theme.canvasGlowB} />
          <svg
            viewBox="0 0 1160 760"
            className="relative z-10 w-full"
          >
            <defs>
              <marker
                id={`arrow-${markerId}`}
                markerWidth="10"
                markerHeight="8"
                refX="8"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 10 4, 0 8" fill={theme.edge} />
              </marker>
            </defs>

            {visibleEdges.map((edge) => {
              const from = nodeMap.get(edge.from);
              const to = nodeMap.get(edge.to);
              if (!from || !to) return null;
              const selected =
                selectedNode &&
                (edge.from === selectedNode.id || edge.to === selectedNode.id);
              return (
                <g key={`${edge.from}-${edge.to}-${edge.relation}`}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={selected ? theme.edgeActive : theme.edge}
                    strokeOpacity={selected ? 0.95 : 0.5}
                    strokeWidth={selected ? 2.4 : 1.4}
                    markerEnd={`url(#arrow-${markerId})`}
                  />
                </g>
              );
            })}

            {visibleNodes.map((node) => {
              const styles = theme.layerStyles[node.layer];
              const isSelected = selectedNode?.id === node.id;
              const isConnected = selectedRelatedIds.has(node.id);
              const faded =
                selectedNode !== null && !isSelected && !isConnected && selectedNodeId !== null;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onClick={() => setSelectedNodeId(node.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedNodeId(node.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={t('architecture.map.selectNode', { label: node.label })}
                  aria-pressed={isSelected}
                >
                  <circle
                    r={isSelected ? 36 : 30}
                    fill={styles.node}
                    opacity={faded ? 0.3 : 1}
                  />
                  <circle
                    r={isSelected ? 42 : 35}
                    fill="none"
                    stroke={styles.ring}
                    strokeWidth={isSelected ? 4 : 2}
                    opacity={faded ? 0.25 : 0.9}
                  />
                  <text
                    y={isSelected ? 62 : 56}
                    textAnchor="middle"
                    className="fill-slate-100 text-[12px] font-semibold tracking-wide"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <section
        className={theme.panel}
        aria-labelledby="architecture-node-details"
      >
        <h2 className={theme.panelTitle} id="architecture-node-details">
          {t('architecture.details.title')}
        </h2>
        {selectedNode ? (
          <>
            <div>
              <p className={`text-lg font-semibold ${theme.panelText}`}>{selectedNode.label}</p>
              <p className={`mt-1 text-sm ${theme.panelText}`}>{selectedNode.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className={`rounded-full px-2 py-1 ${theme.chipDefault}`}>
                {t('architecture.details.layer')}: {selectedNode.layer}
              </span>
              <span className={`rounded-full px-2 py-1 ${theme.chipDefault}`}>
                {t('architecture.details.kind')}: {selectedNode.kind}
              </span>
            </div>

            <div>
              <p className={theme.panelTitle}>
                {t('architecture.details.incoming')}
              </p>
              <ul className={`mt-2 space-y-1 text-sm ${theme.panelText}`}>
                {inboundEdges.length === 0 ? (
                  <li className="text-zinc-400">{t('architecture.details.none')}</li>
                ) : (
                  inboundEdges.map((edge) => (
                    <li key={`in-${edge.from}-${edge.relation}`}>
                      {nodeMap.get(edge.from)?.label}{' '}
                      <span className="text-slate-600">({edge.relation})</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div>
              <p className={theme.panelTitle}>
                {t('architecture.details.outgoing')}
              </p>
              <ul className={`mt-2 space-y-1 text-sm ${theme.panelText}`}>
                {outboundEdges.length === 0 ? (
                  <li className="text-zinc-400">{t('architecture.details.none')}</li>
                ) : (
                  outboundEdges.map((edge) => (
                    <li key={`out-${edge.to}-${edge.relation}`}>
                      {nodeMap.get(edge.to)?.label}{' '}
                      <span className="text-slate-600">({edge.relation})</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </>
        ) : (
          <p className={`text-sm ${theme.panelText}`}>No nodes available for this filter.</p>
        )}

        <div className={theme.featureBox}>
          <h3 className={theme.panelTitle}>
            {t('architecture.flags.title')}
          </h3>
          <div className="mt-2 space-y-1 text-sm">
            {Object.entries(graph.featureFlags).map(([flag, enabled]) => (
              <div key={flag} className="flex items-center justify-between">
                <span className={`font-mono text-xs ${theme.panelText}`}>{flag}</span>
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                    enabled ? theme.featureEnabled : theme.featureDisabled
                  }`}
                >
                  {enabled ? t('architecture.flags.enabled') : t('architecture.flags.disabled')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
