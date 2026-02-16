import 'server-only';
import type { CvProfile } from './cv-content';

type Envelope<T> = {
  ok: boolean;
  requestId: string;
  data: T;
};

export async function getCvProfile(): Promise<CvProfile> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is required to load CV profile');
  }

  const response = await fetch(`${base}/v1/cv`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load CV profile: ${response.status}`);
  }

  const payload = (await response.json()) as Envelope<CvProfile> | CvProfile;
  return 'data' in payload ? payload.data : payload;
}
