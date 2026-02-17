import { getUiTheme } from "@/lib/architecture-variants";

export const dynamic = "force-dynamic";

const CHECKS = [
  {
    title: "Keyboard Navigation",
    status: "Active",
    detail: "Visible focus ring, skip link, and full keyboard access to controls.",
  },
  {
    title: "Focus Management",
    status: "Active",
    detail: "Modal focus trap, escape to close, and focus restore on exit.",
  },
  {
    title: "Screen Reader Semantics",
    status: "Active",
    detail: "ARIA labels, dialog roles, and descriptive headings.",
  },
  {
    title: "Form Labels",
    status: "Active",
    detail: "All inputs have visible labels and clear error messaging.",
  },
  {
    title: "Color Contrast",
    status: "Reviewed",
    detail: "Contrast-safe text colors for primary surfaces.",
  },
  {
    title: "Motion Preferences",
    status: "Planned",
    detail: "Respect prefers-reduced-motion for future animations.",
  },
];

const TARGETS = [
  { label: "Lighthouse Accessibility", target: "≥ 95" },
  { label: "Lighthouse Performance", target: "≥ 90" },
  { label: "Lighthouse Best Practices", target: "≥ 95" },
];

export default function AccessibilityPage() {
  const theme = getUiTheme();

  return (
    <main id="main-content" className={`min-h-[calc(100vh-4rem)] px-6 py-12 ${theme.mainBg}`}>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className={`rounded-3xl p-6 ${theme.surface}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${theme.muted}`}>
            Accessibility Program
          </p>
          <h1 className={`mt-2 text-3xl font-semibold md:text-4xl ${theme.title}`}>
            A11y Checklist & Automation
          </h1>
          <p className={`mt-3 max-w-3xl text-sm leading-relaxed md:text-base ${theme.text}`}>
            This page summarizes the accessibility standards implemented in the UI and the
            automated audits that run in CI. It exists to keep a11y checks visible and actionable.
          </p>
        </header>

        <section className={`rounded-3xl p-6 ${theme.surface}`}>
          <h2 className={`text-lg font-semibold ${theme.title}`}>Checklist Coverage</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {CHECKS.map((check) => (
              <article key={check.title} className={`rounded-2xl p-4 ${theme.card}`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className={`text-sm font-semibold ${theme.title}`}>{check.title}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.chipPrimary}`}>
                    {check.status}
                  </span>
                </div>
                <p className={`mt-2 text-sm ${theme.text}`}>{check.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`rounded-3xl p-6 ${theme.surface}`}>
          <h2 className={`text-lg font-semibold ${theme.title}`}>Automated Audits</h2>
          <p className={`mt-2 text-sm ${theme.text}`}>
            Playwright + axe-core run against the main pages to block regressions and ensure
            detectable violations are addressed before merge.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {TARGETS.map((target) => (
              <div key={target.label} className={`rounded-2xl p-4 ${theme.card}`}>
                <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${theme.muted}`}>
                  {target.label}
                </p>
                <p className={`mt-2 text-2xl font-semibold ${theme.title}`}>{target.target}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
