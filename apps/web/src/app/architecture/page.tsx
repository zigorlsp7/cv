import { ArchitectureMap } from '@/components/architecture-map';
import { getArchitectureGraph } from '@/lib/architecture';
import { getUiTheme } from '@/lib/architecture-variants';

export const dynamic = 'force-dynamic';

export default async function ArchitecturePage() {
  const graph = await getArchitectureGraph();
  const theme = getUiTheme();

  return (
    <main className={`min-h-[calc(100vh-4rem)] p-6 md:p-10 ${theme.mainBg}`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className={`rounded-3xl p-6 ${theme.surface}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${theme.muted}`}>
            Interactive Platform Blueprint
          </p>
          <h1 className={`mt-2 text-3xl font-semibold md:text-4xl ${theme.title}`}>
            CV Platform Architecture
          </h1>
          <p className={`mt-3 max-w-3xl text-sm leading-relaxed md:text-base ${theme.text}`}>
            This page is powered by a real API endpoint and maps the current platform
            components across frontend, backend, data, observability, and delivery
            pipelines. Select nodes and layers to inspect dependencies and runtime links.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className={`rounded-full px-3 py-1.5 ${theme.chipPrimary}`}>
              version {graph.version}
            </span>
            <span className={`rounded-full px-3 py-1.5 ${theme.chipSecondary}`}>
              {graph.stats.nodeCount} nodes
            </span>
            <span className={`rounded-full px-3 py-1.5 ${theme.chipSecondary}`}>
              {graph.stats.edgeCount} edges
            </span>
          </div>
        </header>

        <ArchitectureMap graph={graph} />
      </div>
    </main>
  );
}
