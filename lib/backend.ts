import 'server-only';
import { NextResponse } from 'next/server';
import { clearSessionToken, getSessionToken } from '@/lib/session';

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3000/v1';

export function backendFetch(path: string, init: RequestInit & { token?: string } = {}) {
  const { token, headers, ...rest } = init;

  return fetch(`${BACKEND_API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: 'no-store',
  });
}

/**
 * Shared logic for API routes that just forward an authenticated request to
 * the backend and relay its response. Clears the session cookie on a 401 so
 * an expired/invalid token doesn't linger past the next request.
 */
export async function proxyToBackend(path: string, init: RequestInit = {}) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const backendRes = await backendFetch(path, { ...init, token });

  if (backendRes.status === 401) {
    await clearSessionToken();
  }

  const data = await backendRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendRes.status });
}
