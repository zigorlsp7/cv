"use server";

import { cookies } from "next/headers";
import { LANGUAGE_COOKIE, type Locale } from "./config";

export async function setLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(LANGUAGE_COOKIE, locale, { path: "/" });
}
