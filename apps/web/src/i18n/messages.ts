import type { Locale } from "./config";
import { loadLocalMessages } from "./local";
import { loadRemoteMessages } from "./remote";

export async function loadMessages(locale: Locale) {
  if (process.env.I18N_SOURCE === "local") {
    const local = await loadLocalMessages(locale);
    if (local) return local;
  }

  const remote = await loadRemoteMessages(locale);
  if (remote) return remote;

  const local = await loadLocalMessages(locale);
  if (local) return local;

  throw new Error(
    `Tolgee translations not available for locale "${locale}". ` +
      "Set TOLGEE_API_URL, TOLGEE_PROJECT_ID, and TOLGEE_API_KEY.",
  );
}
