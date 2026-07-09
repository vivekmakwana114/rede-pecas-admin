'use client';

import { useAppSelector } from '@/store/hooks';
import { Toast } from '@/components/dashboard/Toast';
import { useToast } from '@/components/dashboard/useToast';
import { UploadPanel } from './UploadPanel';

export function InventoryClient() {
  const accessToken = useAppSelector((state) => state.auth.tokens?.access?.token);
  const { toast, showToast } = useToast();

  return (
    <>
      <Toast toast={toast} />

      <div className="max-w-md">
        <UploadPanel showToast={showToast} accessToken={accessToken} />
      </div>
    </>
  );
}
