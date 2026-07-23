'use client';

import { useState } from 'react';
import { Toast } from '@/components/dashboard/Toast';
import { useToast } from '@/components/dashboard/useToast';
import { ImportPanel } from './ImportPanel';
import { ProductsGrid } from './ProductsGrid';
import { ServiceImportPanel } from './ServiceImportPanel';
import { ServicesGrid } from './ServicesGrid';

type Tab = 'products' | 'services';

const TABS: { id: Tab; label: string }[] = [
  { id: 'products', label: 'Products' },
  { id: 'services', label: 'Services' },
];

/**
 * Top-level Inventory page: tabs between the Products and Services grids and
 * toggles the matching import panel, sharing one toast for feedback across both tabs.
 */
export default function InventoryPage() {
  const { toast, showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [isImportOpen, setIsImportOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div role="tablist" className="flex items-center gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setIsImportOpen(false);
            }}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'products' ? (
        <>
          <ProductsGrid showToast={showToast} onImportClick={() => setIsImportOpen(true)} />
          {isImportOpen && <ImportPanel onClose={() => setIsImportOpen(false)} />}
        </>
      ) : (
        <>
          <ServicesGrid showToast={showToast} onImportClick={() => setIsImportOpen(true)} />
          {isImportOpen && <ServiceImportPanel onClose={() => setIsImportOpen(false)} />}
        </>
      )}
    </div>
  );
}
