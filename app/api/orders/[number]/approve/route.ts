import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/backend';

export async function POST(request: NextRequest, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  return proxyToBackend(request, `/admin/orders/${encodeURIComponent(number)}/approve`, {
    method: 'POST',
  });
}
