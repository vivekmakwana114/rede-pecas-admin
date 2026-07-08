'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet } from 'lucide-react';

const SUPPLIERS = [
  { id: '1', name: 'Auto Peças Luanda' },
  { id: '2', name: 'Moto Parts Angola' },
  { id: '3', name: 'Import Car Parts' },
];

export function UploadPanel({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  const [supplierId, setSupplierId] = useState('1');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Excel/CSV file parsing and upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Parse rows to JSON
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        // Map fields to API expectations (reference, name, price, quantity).
        // Portuguese header aliases are kept — supplier spreadsheets use them.
        const items = rawRows
          .map((row) => {
            const sku =
              row.reference || row.Reference || row.referencia || row.Referencia || row.SKU || row.CodArtigo || row.codigo || row['Código'];
            const description =
              row.name || row.Name || row.nome || row.Nome || row.Descricao || row['Descrição'] || row.artigo || row.Artigo;
            const price = parseFloat(
              String(row.price || row.Price || row.preco || row.Preco || row['Preço'] || row.PVP || row.PVP1 || '0'),
            );
            const qty = parseInt(
              String(row.quantity || row.Quantity || row.quantidade || row.Quantidade || row.stock || row.Stock || row.StkActual || '0'),
              10,
            );

            return {
              reference: String(sku || '').trim(),
              name: String(description || '').trim(),
              price: isNaN(price) ? 0 : price,
              quantity: isNaN(qty) ? 0 : qty,
            };
          })
          .filter((a) => a.reference && a.name);

        if (items.length === 0) {
          showToast('No valid items found in the sheet. Check the column headers.', 'error');
          setUploadLoading(false);
          return;
        }

        // Upload via our own API route, which forwards to the backend with the session token
        const res = await fetch('/api/inventory/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplierId: parseInt(supplierId, 10), items }),
        });
        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || 'Failed to process the stock file.', 'error');
          return;
        }

        showToast(`Sync OK! Inserted: ${data.inserted}, Updated: ${data.updated}, Deactivated: ${data.deactivated}`, 'success');
      } catch {
        showToast('Failed to process the stock file.', 'error');
      } finally {
        setUploadLoading(false);
        // Clear input value so same file can be uploaded again
        e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/80">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Upload Inventory</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2">Select Supplier</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {SUPPLIERS.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 hover:bg-slate-50/50 transition-all text-center">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            id="excelFileInput"
            className="hidden"
            disabled={uploadLoading}
          />
          <label htmlFor="excelFileInput" className="cursor-pointer block">
            <div className="flex flex-col items-center">
              <FileSpreadsheet className={`h-10 w-10 text-slate-400 mb-3 ${uploadLoading ? 'animate-bounce text-sky-500' : ''}`} />
              <p className="text-sm font-bold text-slate-700">{uploadLoading ? 'Processing file...' : 'Import CSV or Excel'}</p>
              <p className="text-xs text-slate-400 mt-1">Upload a file with SKU, Item, Stock and Price columns</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
