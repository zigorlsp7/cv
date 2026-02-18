import type { Locale } from "./config";
import { loadLocalMessages } from "./local";
import { loadRemoteMessages } from "./remote";

type I18nSource = "tolgee" | "local";

function getSource(): I18nSource {
  const raw = process.env.I18N_SOURCE?.trim().toLowerCase();
  if (raw === "local") return "local";
  return "tolgee";
}

export async function loadMessages(locale: Locale) {
  const source = getSource();

  if (source === "local") {
    const local = await loadLocalMessages(locale);
    if (local) return local;
    throw new Error(`Local translations not available for locale "${locale}".`);
  }

  const remote = await loadRemoteMessages(locale);
  if (remote) return remote;

  throw new Error(
    `Tolgee translations not available for locale "${locale}". ` +
      "Set TOLGEE_API_URL, TOLGEE_PROJECT_ID, TOLGEE_API_KEY, or use I18N_SOURCE=local for CI.",
  );
}
