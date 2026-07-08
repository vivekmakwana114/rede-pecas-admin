import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/backend';

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyToBackend('/admin/inventory/upload', {
    method: 'POST',
    body,
  });
}
