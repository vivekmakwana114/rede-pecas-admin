'use client';

import { useState } from 'react';
import { Toast } from '@/components/dashboard/Toast';
import { useToast } from '@/components/dashboard/useToast';
import { ImportPanel } from './ImportPanel';
import { ProductsGrid } from './ProductsGrid';

export default function InventoryPage() {
  const { toast, showToast } = useToast();
  const [isImportOpen, setIsImportOpen] = useState(false);

  return (
    <div className="space-y-8">
      <Toast toast={toast} />
      <ProductsGrid showToast={showToast} onImportClick={() => setIsImportOpen(true)} />
      {isImportOpen && <ImportPanel onClose={() => setIsImportOpen(false)} />}
    </div>
  );
}
