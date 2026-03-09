import type { Locale } from "./config";
import { loadLocalMessages } from "./local";
import { loadRemoteMessages } from "./remote";

function isTolgeeConfigured(): boolean {
  const apiUrl = process.env.TOLGEE_API_URL?.trim();
  const projectId = process.env.TOLGEE_PROJECT_ID?.trim();
  const apiKey = process.env.TOLGEE_API_KEY?.trim();
  return Boolean(apiUrl && projectId && apiKey);
}

export async function loadMessages(locale: Locale) {
  if (!isTolgeeConfigured()) {
    const local = await loadLocalMessages(locale);
    if (local) return local;
    throw new Error(
      `Local translations not available for locale "${locale}". ` +
        "Provide local message files or configure Tolgee (TOLGEE_API_URL, TOLGEE_PROJECT_ID, TOLGEE_API_KEY).",
    );
  }

  const remote = await loadRemoteMessages(locale);
  if (remote) return remote;

  throw new Error(
    `Tolgee translations not available for locale "${locale}". ` +
      "Set TOLGEE_API_URL, TOLGEE_PROJECT_ID, and TOLGEE_API_KEY.",
  );
}
