import { ArchitectureMap } from '@/components/architecture-map';
import { getArchitectureGraph } from '@/lib/architecture';
import { getUiTheme } from '@/lib/architecture-variants';
import { getTranslator } from '@/i18n/server';

export const dynamic = 'force-dynamic';

export default async function ArchitecturePage() {
  const graph = await getArchitectureGraph();
  const theme = getUiTheme();
  const t = await getTranslator();

  return (
    <main
      id="main-content"
      className={`min-h-[calc(100vh-4rem)] p-6 md:p-10 ${theme.mainBg}`}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <header className={`rounded-3xl p-6 ${theme.surface}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${theme.muted}`}>
            {t('architecture.overline')}
          </p>
          <h1 className={`mt-2 text-3xl font-semibold md:text-4xl ${theme.title}`}>
            {t('architecture.title')}
          </h1>
          <p className={`mt-3 max-w-3xl text-sm leading-relaxed md:text-base ${theme.text}`}>
            {t('architecture.subtitle')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className={`rounded-full px-3 py-1.5 ${theme.chipPrimary}`}>
              {t('architecture.version', { version: graph.version })}
            </span>
            <span className={`rounded-full px-3 py-1.5 ${theme.chipSecondary}`}>
              {t('architecture.nodes', { count: graph.stats.nodeCount })}
            </span>
            <span className={`rounded-full px-3 py-1.5 ${theme.chipSecondary}`}>
              {t('architecture.edges', { count: graph.stats.edgeCount })}
            </span>
          </div>
        </header>

        <ArchitectureMap graph={graph} />
      </div>
    </main>
  );
}
