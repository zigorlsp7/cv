import { getUiTheme } from "@/lib/architecture-variants";

export const dynamic = "force-dynamic";

async function getHealth() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  const res = await fetch(`${base}/v1/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export default async function HealthPage() {
  const data = await getHealth();
  const theme = getUiTheme();

  return (
    <main
      id="main-content"
      className={`min-h-[calc(100vh-4rem)] px-6 py-10 ${theme.mainBg}`}
    >
      <div className="mx-auto max-w-5xl">
        <section className={`rounded-3xl p-8 ${theme.surface}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${theme.muted}`}>
            Runtime Diagnostics
          </p>
          <h1 className={`mt-2 text-3xl font-semibold ${theme.title}`}>API Health</h1>
          <pre
            className={`mt-5 overflow-x-auto rounded-2xl p-4 text-sm ${theme.chipPrimary}`}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
