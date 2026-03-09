import { NextResponse } from 'next/server';
import { buildApiAuthHeaders, getAuthSession } from '@/lib/auth-session';

function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is required');
  }
  return base;
}

function resolveCvApiUrl(): string {
  const normalized = getApiBase().replace(/\/+$/, '');
  return normalized.endsWith('/v1')
    ? `${normalized}/cv`
    : `${normalized}/v1/cv`;
}

export async function GET() {
  try {
    const response = await fetch(resolveCvApiUrl(), { cache: 'no-store' });
    const text = await response.text();
    const contentType = response.headers.get('content-type');

    return new NextResponse(text, {
      status: response.status,
      headers: contentType ? { 'content-type': contentType } : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to proxy CV profile request',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getAuthSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json(
      {
        ok: false,
        error: 'Admin authentication required',
      },
      { status: 401 },
    );
  }

  const authHeaders = buildApiAuthHeaders(session);
  if (!authHeaders) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Session signer is not configured',
      },
      { status: 500 },
    );
  }

  const body = await request.text();
  try {
    const response = await fetch(resolveCvApiUrl(), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        ...authHeaders,
      },
      body,
      cache: 'no-store',
    });

    const text = await response.text();
    const contentType = response.headers.get('content-type');
    return new NextResponse(text, {
      status: response.status,
      headers: contentType ? { 'content-type': contentType } : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to proxy CV profile update request',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
