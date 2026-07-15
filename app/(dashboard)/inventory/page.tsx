'use client';

import { Toast } from '@/components/dashboard/Toast';
import { useToast } from '@/components/dashboard/useToast';
import { ImportPanel } from './ImportPanel';
import { ProductsGrid } from './ProductsGrid';

export default function InventoryPage() {
  const { toast, showToast } = useToast();

  return (
    <div className="space-y-8">
      <Toast toast={toast} />
      <ImportPanel showToast={showToast} />
      <ProductsGrid showToast={showToast} />
    </div>
  );
}
