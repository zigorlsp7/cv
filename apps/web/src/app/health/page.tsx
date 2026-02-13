export const dynamic = "force-dynamic";

async function getHealth() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  const res = await fetch(`${base}/v1/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export default async function HealthPage() {
  const data = await getHealth();

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>API Health</h1>
      <pre style={{ marginTop: 16, padding: 16, background: "#111", color: "#eee", borderRadius: 8 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}