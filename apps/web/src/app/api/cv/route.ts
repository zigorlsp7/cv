import { NextResponse } from 'next/server';
import { cloneDefaultCvProfile } from '@/lib/cv-content';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE}/v1/cv`, { cache: 'no-store' });
    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: true,
          requestId: 'web-fallback',
          data: cloneDefaultCvProfile(),
        },
        { status: 200 },
      );
    }

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'content-type':
          response.headers.get('content-type') ?? 'application/json; charset=utf-8',
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: true,
        requestId: 'web-fallback',
        data: cloneDefaultCvProfile(),
      },
      { status: 200 },
    );
  }
}

export async function PUT(request: Request) {
  const body = await request.text();
  const response = await fetch(`${API_BASE}/v1/cv`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body,
    cache: 'no-store',
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      'content-type':
        response.headers.get('content-type') ?? 'application/json; charset=utf-8',
    },
  });
}

