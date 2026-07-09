import 'server-only';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:4000/v1';

export function backendFetch(path: string, init: RequestInit = {}) {
  return fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  });
}

/**
 * Shared logic for API routes that just forward an authenticated request to
 * the backend and relay its response. Auth now lives client-side (Redux +
 * localStorage/sessionStorage), so the token arrives as the incoming
 * request's own Authorization header rather than a server-side cookie.
 */
export async function proxyToBackend(request: NextRequest, path: string, init: RequestInit = {}) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const backendRes = await backendFetch(path, { ...init, headers: { Authorization: authHeader } });
  const data = await backendRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendRes.status });
}
