'use client';

import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { importInventory, resetUpload, fetchProducts } from '@/store/inventory/inventorySlice';
import { Grid } from '@/components/Grid/Grid';
import type { GridColumn } from '@/components/Grid/types';
import { parseWorkbookRows, type ParseResult } from './adapters';
import type { UploadItemPayload } from '@/store/inventory/inventoryService';

// Client-side parsing (adapters.ts) only drives the preview grid below —
// the file itself is what actually gets uploaded and validated server-side
// (see handleImport), so this preview can be a little looser than the
// server's rules without risk of a bad file slipping through.

type ParseError = { type: 'missing-columns'; missingColumns: string[] } | { type: 'empty' } | { type: 'unreadable' };
type Stage = 'idle' | 'invalid' | 'ready';

const STEPS = ['Select file', 'Review', 'Import'] as const;

const ITEM_COLUMNS: GridColumn<UploadItemPayload>[] = [
  {
    key: 'reference',
    header: 'SKU',
    cell: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{row.reference}</span>,
  },
  { key: 'name', header: 'Product', cell: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
  {
    key: 'supplier',
    header: 'Supplier',
    cell: (row) => <span className="text-slate-500">{row.supplier || '—'}</span>,
  },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    cell: (row) => <span className="text-slate-700">{formatKwanza(row.price)}</span>,
  },
  { key: 'quantity', header: 'Stock', align: 'right', cell: (row) => <span className="text-slate-700">{row.quantity}</span> },
  {
    key: 'service',
    header: 'Service',
    cell: (row) =>
      row.serviceName ? (
        <span className="text-slate-700">
          {row.serviceName}
          {row.servicePrice !== undefined && <span className="text-slate-400"> · {formatKwanza(row.servicePrice)}</span>}
        </span>
      ) : (
        <span className="text-slate-400">—</span>
      ),
  },
];

export function ImportPanel({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { upload } = useAppSelector((state) => state.inventory);

  const [stage, setStage] = useState<Stage>('idle');
  const [parseError, setParseError] = useState<ParseError | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The panel is only ever mounted while open (page.tsx conditionally renders
  // it), so unmount is the one reliable "closed" signal — clear the shared
  // upload status here rather than on every close path, so reopening always
  // starts from a clean 'ready' stage instead of showing a stale success/error.
  useEffect(() => {
    return () => {
      dispatch(resetUpload());
    };
  }, [dispatch]);

  const processFile = (file: File) => {
    setFileName(file.name);
    setSelectedFile(file);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        const result = parseWorkbookRows(rawRows);

        if (result.missingColumns.length > 0) {
          setParseError({ type: 'missing-columns', missingColumns: result.missingColumns });
          setStage('invalid');
          return;
        }
        if (result.items.length === 0) {
          setParseError({ type: 'empty' });
          setStage('invalid');
          return;
        }

        setParseResult(result);
        setStage('ready');
      } catch {
        setParseError({ type: 'unreadable' });
        setStage('invalid');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setStage('idle');
    setParseError(null);
    setParseResult(null);
    setSelectedFile(null);
    setFileName(null);
    dispatch(resetUpload());
  };

  const handleImport = async () => {
    // The uploaded file itself is what's sent — the server parses and
    // validates it (parseResult only drives the preview grid above). Result
    // is shown inline in the stage === 'ready' / upload.status === 'succeeded'
    // block below — no separate toast, so there's only one place to look.
    if (!selectedFile) return;
    const result = await dispatch(importInventory(selectedFile));
    if (importInventory.fulfilled.match(result)) {
      dispatch(fetchProducts());
    }
  };

  const currentStep = stage === 'idle' || stage === 'invalid' ? 0 : upload.status === 'idle' || upload.status === 'failed' ? 1 : 2;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/60" onClick={onClose}>
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Import Inventory</h2>
            <ol className="mt-3 flex items-center gap-2">
              {STEPS.map((label, index) => (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-2xs font-bold ${
                      index < currentStep
                        ? 'bg-emerald-600 text-white'
                        : index === currentStep
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {index < currentStep ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  <span className={`hidden text-xs font-semibold sm:inline ${index <= currentStep ? 'text-slate-700' : 'text-slate-400'}`}>
                    {label}
                  </span>
                  {index < STEPS.length - 1 && <span className="h-px w-4 bg-slate-200" />}
                </li>
              ))}
            </ol>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-all hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {stage === 'idle' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all ${
                dragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50/50'
              }`}
            >
              <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileInput} className="hidden" />
              <div className="flex flex-col items-center">
                <UploadCloud className="mb-3 h-10 w-10 text-slate-400" />
                <p className="text-sm font-bold text-slate-700">Drop a CSV or Excel file, or click to browse</p>
                <p className="mt-1 text-xs text-slate-400">Needs Reference, Name, Supplier, Price and Quantity columns</p>
              </div>
            </div>
          )}

          {stage === 'invalid' && parseError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-800">
                    {parseError.type === 'missing-columns' && "Couldn't find some required columns"}
                    {parseError.type === 'empty' && 'No usable rows found'}
                    {parseError.type === 'unreadable' && "Couldn't read this file"}
                  </p>
                  <p className="mt-1 text-xs text-red-700">
                    {parseError.type === 'missing-columns' && (
                      <>
                        {fileName} is missing: <span className="font-semibold">{parseError.missingColumns.join(', ')}</span>. Add
                        these columns and try again.
                      </>
                    )}
                    {parseError.type === 'empty' && `${fileName} has columns for every field, but every row was missing a reference or name.`}
                    {parseError.type === 'unreadable' &&
                      `${fileName} doesn't look like a valid CSV or Excel file — check the format and try again.`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="mt-4 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition-all hover:bg-red-100"
              >
                Try another file
              </button>
            </div>
          )}

          {stage === 'ready' && parseResult && (
            <div className="space-y-4">
              {upload.status === 'succeeded' ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm font-bold text-emerald-800">Import complete</p>
                  </div>
                  {upload.result && (
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-emerald-700">{upload.result.inserted}</p>
                        <p className="text-2xs font-semibold text-emerald-600">Added</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-emerald-700">{upload.result.updated}</p>
                        <p className="text-2xs font-semibold text-emerald-600">Updated</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-emerald-700">{upload.result.deactivated}</p>
                        <p className="text-2xs font-semibold text-emerald-600">Deactivated</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">{fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    disabled={upload.status === 'loading'}
                    aria-label="Remove file"
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <p className="text-xs font-semibold text-slate-500">
                {upload.status === 'succeeded' ? 'Imported items' : 'Ready to import'} · {parseResult.items.length} product
                {parseResult.items.length === 1 ? '' : 's'}
                {parseResult.skippedCount > 0 && upload.status !== 'succeeded' && (
                  <span className="text-amber-600"> · {parseResult.skippedCount} row{parseResult.skippedCount === 1 ? '' : 's'} skipped (missing reference or name)</span>
                )}
              </p>

              <Grid columns={ITEM_COLUMNS} rows={parseResult.items} getRowId={(row) => row.reference} pageSize={5} />

              {upload.status === 'failed' && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <p className="text-xs font-semibold text-red-700">{upload.error}</p>
                </div>
              )}

              {upload.status === 'succeeded' ? (
                <button
                  type="button"
                  onClick={reset}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90"
                >
                  Import another file
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={upload.status === 'loading'}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
                >
                  {upload.status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing {parseResult.items.length} products…
                    </>
                  ) : (
                    `Import ${parseResult.items.length} products`
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
