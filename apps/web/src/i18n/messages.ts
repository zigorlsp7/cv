import type { Locale } from "./config";
import { loadRemoteMessages } from "./remote";

export async function loadMessages(locale: Locale) {
  const remote = await loadRemoteMessages(locale);
  if (remote) return remote;

  throw new Error(
    `Tolgee translations not available for locale "${locale}". ` +
      "Set TOLGEE_API_URL, TOLGEE_PROJECT_ID, and TOLGEE_API_KEY.",
  );
}
