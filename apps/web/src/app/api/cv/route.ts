import { NextResponse } from 'next/server';

function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is required');
  }
  return base;
}

export async function GET() {
  try {
    const response = await fetch(`${getApiBase()}/v1/cv`, { cache: 'no-store' });
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
  const body = await request.text();
  try {
    const response = await fetch(`${getApiBase()}/v1/cv`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
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
