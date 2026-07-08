import { proxyToBackend } from '@/lib/backend';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  const { number } = await params;
  return proxyToBackend(`/admin/orders/${encodeURIComponent(number)}/reject`, {
    method: 'POST',
  });
}
