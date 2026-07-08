import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
import { setSessionToken } from '@/lib/session';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = body?.password;

  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
  }

  const backendRes = await backendFetch('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });

  const data = await backendRes.json().catch(() => ({}));

  if (!backendRes.ok || !data.token) {
    return NextResponse.json(
      { error: data.error || 'Incorrect password.' },
      { status: backendRes.status || 401 },
    );
  }

  await setSessionToken(data.token);

  return NextResponse.json({ ok: true });
}
