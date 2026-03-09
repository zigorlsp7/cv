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
  if (!raw) {
    throw new Error("NEXT_PUBLIC_RUM_ENABLED is required");
  }
  const normalized = raw.trim().toLowerCase();
  if (!["true", "1", "yes", "false", "0", "no"].includes(normalized)) {
    throw new Error("NEXT_PUBLIC_RUM_ENABLED must be true/false (or 1/0, yes/no)");
  }
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function resolveRumEndpoint(): string {
  const explicit = process.env.NEXT_PUBLIC_RUM_ENDPOINT;
  if (explicit && explicit.trim().length > 0) {
    return explicit.trim();
  }

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base || base.trim().length === 0) {
    throw new Error("NEXT_PUBLIC_RUM_ENDPOINT or NEXT_PUBLIC_API_BASE_URL is required");
  }
  return `${base.trim().replace(/\/$/, "")}/v1/rum/events`;
}

function resolveReleaseTag(): string | undefined {
  const release = process.env.NEXT_PUBLIC_RELEASE;
  if (!release || release.trim().length === 0) {
    return undefined;
  }
  return release.trim();
}

function buildRumPayload(event: RumEvent): string {
  const release = event.release ?? resolveReleaseTag();
  return JSON.stringify({
    events: [
      {
        ...event,
        ...(release ? { release } : {}),
      },
    ],
  });
}

export function sendRumEvent(event: RumEvent): void {
  if (!isRumEnabled()) return;
  const endpoint = resolveRumEndpoint();

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
