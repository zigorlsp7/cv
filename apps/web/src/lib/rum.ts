export type RumEvent = {
  type: "web-vital" | "js-error" | "navigation";
  path: string;
  metricName?: string;
  metricValue?: number;
  message?: string;
  requestId?: string;
  release?: string;
};

function isRumEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_RUM_ENABLED;
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function resolveRumEndpoint(): string | null {
  const explicit = process.env.NEXT_PUBLIC_RUM_ENDPOINT;
  if (explicit && explicit.trim().length > 0) return explicit.trim();

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) return null;
  return `${apiBase.replace(/\/$/, "")}/v1/rum/events`;
}

function buildRumPayload(event: RumEvent): string {
  return JSON.stringify({
    events: [
      {
        ...event,
        release: event.release ?? process.env.NEXT_PUBLIC_RELEASE,
      },
    ],
  });
}

export function sendRumEvent(event: RumEvent): void {
  if (!isRumEnabled()) return;
  const endpoint = resolveRumEndpoint();
  if (!endpoint) return;

  const payload = buildRumPayload(event);
  const body = new Blob([payload], { type: "application/json" });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const queued = navigator.sendBeacon(endpoint, body);
    if (queued) return;
  }

  void fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}

