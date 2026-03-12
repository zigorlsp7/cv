import { NextResponse } from 'next/server';

function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is required');
  }
  return base;
}

function resolveContactApiUrl(): string {
  const normalized = getApiBase().replace(/\/+$/, '');
  return normalized.endsWith('/v1')
    ? `${normalized}/contact`
    : `${normalized}/v1/contact`;
}

export async function POST(request: Request) {
  const body = await request.text();

  try {
    const response = await fetch(resolveContactApiUrl(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
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
        error: 'Failed to proxy contact request',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
