import { getUiTheme } from "@/lib/architecture-variants";
import { getTranslator } from "@/i18n/server";

export const dynamic = "force-dynamic";

const CHECK_KEYS = [
  { key: "accessibility.checks.keyboard", statusKey: "accessibility.status.active" },
  { key: "accessibility.checks.focus", statusKey: "accessibility.status.active" },
  { key: "accessibility.checks.screenReader", statusKey: "accessibility.status.active" },
  { key: "accessibility.checks.labels", statusKey: "accessibility.status.active" },
  { key: "accessibility.checks.contrast", statusKey: "accessibility.status.reviewed" },
  { key: "accessibility.checks.motion", statusKey: "accessibility.status.planned" },
];

const TARGET_KEYS = [
  { key: "accessibility.targets.lighthouseAccessibility", score: 95 },
  { key: "accessibility.targets.lighthousePerformance", score: 90 },
  { key: "accessibility.targets.lighthouseBest", score: 95 },
];

export default async function AccessibilityPage() {
  const theme = getUiTheme();
  const t = await getTranslator();

  return (
    <main id="main-content" className={`min-h-[calc(100vh-4rem)] px-6 py-12 ${theme.mainBg}`}>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className={`rounded-3xl p-6 ${theme.surface}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${theme.muted}`}>
            {t("accessibility.overline")}
          </p>
          <h1 className={`mt-2 text-3xl font-semibold md:text-4xl ${theme.title}`}>
            {t("accessibility.title")}
          </h1>
          <p className={`mt-3 max-w-3xl text-sm leading-relaxed md:text-base ${theme.text}`}>
            {t("accessibility.subtitle")}
          </p>
        </header>

        <section className={`rounded-3xl p-6 ${theme.surface}`}>
          <h2 className={`text-lg font-semibold ${theme.title}`}>
            {t("accessibility.checks.title")}
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {CHECK_KEYS.map((check) => (
              <article key={check.key} className={`rounded-2xl p-4 ${theme.card}`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className={`text-sm font-semibold ${theme.title}`}>
                    {t(`${check.key}.title`)}
                  </h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.chipPrimary}`}>
                    {t(check.statusKey)}
                  </span>
                </div>
                <p className={`mt-2 text-sm ${theme.text}`}>
                  {t(`${check.key}.detail`)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className={`rounded-3xl p-6 ${theme.surface}`}>
          <h2 className={`text-lg font-semibold ${theme.title}`}>
            {t("accessibility.audits.title")}
          </h2>
          <p className={`mt-2 text-sm ${theme.text}`}>
            {t("accessibility.audits.subtitle")}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {TARGET_KEYS.map((target) => (
              <div key={target.key} className={`rounded-2xl p-4 ${theme.card}`}>
                <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${theme.muted}`}>
                  {t(target.key)}
                </p>
                <p className={`mt-2 text-2xl font-semibold ${theme.title}`}>
                  {t("accessibility.target.value", { score: target.score })}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
