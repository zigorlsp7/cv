import 'server-only';
import { cloneDefaultCvProfile, type CvProfile } from './cv-content';

type Envelope<T> = {
  ok: boolean;
  requestId: string;
  data: T;
};

function normalizeCvProfile(input: Partial<CvProfile> | undefined): CvProfile {
  const fallback = cloneDefaultCvProfile();
  if (!input) return fallback;

  return {
    fullName: input.fullName ?? fallback.fullName,
    role: input.role ?? fallback.role,
    tagline: input.tagline ?? fallback.tagline,
    chips: Array.isArray(input.chips) ? input.chips : fallback.chips,
    sections: Array.isArray(input.sections) ? input.sections : fallback.sections,
    updatedAt: input.updatedAt ?? fallback.updatedAt,
  };
}

export async function getCvProfile(): Promise<CvProfile> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

  try {
    const response = await fetch(`${base}/v1/cv`, { cache: 'no-store' });
    if (!response.ok) return cloneDefaultCvProfile();

    const payload = (await response.json()) as Envelope<CvProfile> | CvProfile;
    if ('data' in payload) return normalizeCvProfile(payload.data);
    return normalizeCvProfile(payload);
  } catch {
    return cloneDefaultCvProfile();
  }
}

