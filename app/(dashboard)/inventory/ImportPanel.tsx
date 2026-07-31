'use client';

import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
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
import * as inventoryService from '@/store/inventory/inventoryService';
import type { UploadItemPayload } from '@/store/inventory/inventoryService';
import { useLocale } from '@/lib/i18n/LocaleContext';

type ParseError = { type: 'missing-columns'; missingColumns: string[] } | { type: 'empty' } | { type: 'unreadable' };
type Stage = 'idle' | 'invalid' | 'ready';

/**
 * Builds the review-grid column defs for the parsed import rows, translating
 * each header through the given `t()` function.
 */
function buildItemColumns(t: (path: string) => string): GridColumn<UploadItemPayload>[] {
  return [
    { key: 'name', header: t('inventory.products.columns.name'), cell: (row) => <span className="font-medium text-foreground">{row.name}</span> },
    {
      key: 'supplier',
      header: t('inventory.services.columns.providerName'),
      cell: (row) => <span className="text-muted-foreground">{row.supplier || '—'}</span>,
    },
    {
      key: 'category',
      header: t('inventory.products.columns.category'),
      cell: (row) => <span className="text-muted-foreground">{row.category || '—'}</span>,
    },
    {
      key: 'subcategory',
      header: t('inventory.products.columns.subcategory'),
      cell: (row) => <span className="text-muted-foreground">{row.subcategory || '—'}</span>,
    },
    {
      key: 'reference',
      header: t('inventory.products.columns.reference'),
      cell: (row) => <span className="font-mono text-sm font-semibold text-foreground">{row.reference}</span>,
    },
    {
      key: 'oemReference',
      header: t('inventory.products.columns.oemReference'),
      cell: (row) => <span className="font-mono text-sm text-muted-foreground">{row.oemReference || '—'}</span>,
    },
    {
      key: 'brand',
      header: t('inventory.products.columns.brand'),
      cell: (row) => <span className="text-muted-foreground">{row.brand || '—'}</span>,
    },
    {
      key: 'price',
      header: t('inventory.products.columns.price'),
      align: 'right',
      cell: (row) => <span className="text-foreground">{formatKwanza(row.price)}</span>,
    },
    { key: 'quantity', header: t('inventory.products.columns.quantity'), align: 'right', cell: (row) => <span className="text-foreground">{row.quantity}</span> },
    {
      key: 'deliveryTime',
      header: t('inventory.products.columns.deliveryTime'),
      cell: (row) => <span className="text-muted-foreground">{row.deliveryTime || '—'}</span>,
    },
    {
      key: 'vehicleMake',
      header: t('inventory.products.columns.vehicleMake'),
      cell: (row) => <span className="text-muted-foreground">{row.vehicleMake || '—'}</span>,
    },
    {
      key: 'vehicleModel',
      header: t('inventory.products.columns.vehicleModel'),
      cell: (row) => <span className="text-muted-foreground">{row.vehicleModel || '—'}</span>,
    },
    { key: 'yearStart', header: t('inventory.products.columns.yearStart'), align: 'right', cell: (row) => <span className="text-muted-foreground">{row.yearStart ?? '—'}</span> },
    { key: 'yearEnd', header: t('inventory.products.columns.yearEnd'), align: 'right', cell: (row) => <span className="text-muted-foreground">{row.yearEnd ?? '—'}</span> },
    { key: 'engine', header: t('inventory.products.columns.engine'), cell: (row) => <span className="text-muted-foreground">{row.engine || '—'}</span> },
    {
      key: 'engineNumber',
      header: t('inventory.products.columns.engineNumber'),
      cell: (row) => <span className="text-muted-foreground">{row.engineNumber || '—'}</span>,
    },
    { key: 'viscosity', header: t('inventory.products.columns.viscosity'), cell: (row) => <span className="text-muted-foreground">{row.viscosity || '—'}</span> },
    {
      key: 'engineType',
      header: t('inventory.products.columns.engineType'),
      cell: (row) => <span className="text-muted-foreground">{row.engineType || '—'}</span>,
    },
    {
      key: 'volumeLiters',
      header: t('inventory.products.columns.volumeLiters'),
      align: 'right',
      cell: (row) => <span className="text-muted-foreground">{row.volumeLiters ?? '—'}</span>,
    },
    {
      key: 'specification',
      header: t('inventory.products.columns.specification'),
      cell: (row) => <span className="text-muted-foreground">{row.specification || '—'}</span>,
    },
    {
      key: 'intervalKm',
      header: t('inventory.products.columns.intervalKm'),
      align: 'right',
      cell: (row) => <span className="text-muted-foreground">{row.intervalKm ?? '—'}</span>,
    },
    {
      key: 'description',
      header: t('inventory.products.columns.description'),
      cellClassName: 'max-w-xs',
      cell: (row) => <span className="text-muted-foreground">{row.description || '—'}</span>,
    },
    {
      key: 'synonyms',
      header: t('inventory.products.columns.synonyms'),
      cellClassName: 'max-w-xs',
      cell: (row) => <span className="text-muted-foreground">{row.synonyms || '—'}</span>,
    },
    {
      key: 'imageUrl',
      header: t('inventory.products.columns.imageUrl'),
      cell: (row) => <span className="text-muted-foreground">{row.imageUrl || '—'}</span>,
    },
    {
      key: 'supplierAddress',
      header: t('inventory.productDetail.supplierAddress'),
      cell: (row) => <span className="text-muted-foreground">{row.supplierAddress || '—'}</span>,
    },
    {
      key: 'supplierPhone',
      header: t('inventory.serviceDetail.phone'),
      cell: (row) => <span className="text-muted-foreground">{row.supplierPhone || '—'}</span>,
    },
  ];
}

/**
 * Slide-over panel that walks the user through importing a product inventory
 * spreadsheet: pick/drop a file, review the parsed rows, then submit the import
 * and show the resulting added/updated/skipped counts.
 */
export function ImportPanel({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { t } = useLocale();
  const { upload } = useAppSelector((state) => state.inventory);
  const itemColumns = buildItemColumns(t);
  const steps = [t('inventory.common.steps.selectFile'), t('inventory.common.steps.review'), t('inventory.common.steps.import')];

  const [stage, setStage] = useState<Stage>('idle');
  const [parseError, setParseError] = useState<ParseError | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      dispatch(resetUpload());
    };
  }, [dispatch]);

  /**
   * Reads the selected file as a workbook, parses it via `parseWorkbookRows`,
   * and moves the panel into the invalid or ready stage depending on the result.
   */
  const processFile = (file: File) => {
    setFileName(file.name);
    setSelectedFile(file);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const headerRow = (XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 })[0] as unknown[] | undefined) ?? [];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        const result = parseWorkbookRows(rawRows, headerRow);

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

  /**
   * Grabs the file chosen via the hidden file input, resets the input value so
   * the same file can be re-selected later, and hands it off to `processFile`.
   */
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) processFile(file);
  };

  /**
   * Fetches the inventory import template file from the API and triggers a
   * browser download of it as `inventory-template.xlsx`.
   */
  const handleDownloadTemplate = async () => {
    setTemplateDownloading(true);
    try {
      const res = await inventoryService.downloadTemplate();
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'inventory-template.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setTemplateDownloading(false);
    }
  };

  /**
   * Handles a file dropped onto the drop zone, clearing the drag-active state
   * and forwarding the dropped file to `processFile`.
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  /**
   * Clears all local selection/parse state and dispatches `resetUpload` so the
   * panel returns to its initial "select file" stage.
   */
  const reset = () => {
    setStage('idle');
    setParseError(null);
    setParseResult(null);
    setSelectedFile(null);
    setFileName(null);
    dispatch(resetUpload());
  };

  /**
   * Dispatches `importInventory` with the selected file and, on success,
   * refreshes the products list so the grid reflects the newly imported data.
   */
  const handleImport = async () => {
    if (!selectedFile) return;
    const result = await dispatch(importInventory(selectedFile));
    if (importInventory.fulfilled.match(result)) {
      dispatch(fetchProducts());
    }
  };

  const currentStep = stage === 'idle' || stage === 'invalid' ? 0 : upload.status === 'idle' || upload.status === 'failed' ? 1 : 2;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-foreground/60" onClick={onClose}>
      <div className="flex h-full w-full max-w-lg flex-col bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{t('inventory.common.importTitle.products')}</h2>
            <ol className="mt-3 flex items-center gap-2">
              {steps.map((label, index) => (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-2xs font-bold ${
                      index < currentStep
                        ? 'bg-success text-success-foreground'
                        : index === currentStep
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index < currentStep ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  <span className={`hidden text-xs font-semibold sm:inline ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                  {index < steps.length - 1 && <span className="h-px w-4 bg-border" />}
                </li>
              ))}
            </ol>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('inventory.common.close')}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-accent"
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
                dragActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
              }`}
            >
              <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileInput} className="hidden" />
              <div className="flex flex-col items-center">
                <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-bold text-foreground">{t('inventory.common.dropPrompt')}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('inventory.products.dropHint')}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadTemplate();
                  }}
                  disabled={templateDownloading}
                  className="mt-4 flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition-all hover:bg-accent disabled:opacity-60"
                >
                  {templateDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  {t('inventory.common.downloadTemplate')}
                </button>
              </div>
            </div>
          )}

          {stage === 'invalid' && parseError && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-destructive">
                    {parseError.type === 'missing-columns' && t('inventory.common.missingColumnsTitle')}
                    {parseError.type === 'empty' && t('inventory.common.emptyTitle')}
                    {parseError.type === 'unreadable' && t('inventory.common.unreadableTitle')}
                  </p>
                  <p className="mt-1 text-xs text-destructive">
                    {parseError.type === 'missing-columns' &&
                      t('inventory.common.missingColumnsMessage', {
                        fileName: fileName ?? '',
                        columns: parseError.missingColumns.join(', '),
                      })}
                    {parseError.type === 'empty' && t('inventory.products.emptyMessage', { fileName: fileName ?? '' })}
                    {parseError.type === 'unreadable' && t('inventory.common.unreadableMessage', { fileName: fileName ?? '' })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="mt-4 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-bold text-destructive transition-all hover:bg-destructive/10"
              >
                {t('inventory.common.tryAnotherFile')}
              </button>
            </div>
          )}

          {stage === 'ready' && parseResult && (
            <div className="space-y-4">
              {upload.status === 'succeeded' ? (
                <div className="rounded-lg border border-success/30 bg-success/10 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <p className="text-sm font-bold text-success">{t('inventory.common.importComplete')}</p>
                  </div>
                  {upload.result && (
                    <div className={`mt-3 grid gap-3 text-center ${upload.result.skipped?.length ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      <div>
                        <p className="text-lg font-bold text-success">{upload.result.inserted}</p>
                        <p className="text-2xs font-semibold text-success">{t('inventory.common.added')}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-success">{upload.result.updated}</p>
                        <p className="text-2xs font-semibold text-success">{t('inventory.common.updated')}</p>
                      </div>
                      {upload.result.skipped && upload.result.skipped.length > 0 && (
                        <div>
                          <p className="text-lg font-bold text-warning">{upload.result.skipped.length}</p>
                          <p className="text-2xs font-semibold text-warning">{t('inventory.common.skipped')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">{fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    disabled={upload.status === 'loading'}
                    aria-label={t('inventory.common.removeFile')}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <p className="text-xs font-semibold text-muted-foreground">
                {upload.status === 'succeeded' ? t('inventory.common.importedItems') : t('inventory.common.readyToImport')} ·{' '}
                {parseResult.items.length}{' '}
                {parseResult.items.length === 1 ? t('inventory.products.productSingular') : t('inventory.products.productPlural')}
                {parseResult.skippedCount > 0 && upload.status !== 'succeeded' && (
                  <span className="text-warning">
                    {' '}
                    ·{' '}
                    {parseResult.skippedCount === 1
                      ? t('inventory.products.rowSkippedNoteSingular', { count: parseResult.skippedCount })
                      : t('inventory.products.rowSkippedNotePlural', { count: parseResult.skippedCount })}
                  </span>
                )}
              </p>

              <Grid columns={itemColumns} rows={parseResult.items} getRowId={(row) => row.reference} pageSize={5} />

              {upload.status === 'succeeded' && upload.result?.skipped && upload.result.skipped.length > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                    <p className="text-sm font-bold text-warning">
                      {upload.result.skipped.length === 1
                        ? t('inventory.products.rowSkippedTitleSingular', { count: upload.result.skipped.length })
                        : t('inventory.products.rowSkippedTitlePlural', { count: upload.result.skipped.length })}
                    </p>
                  </div>
                  <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto text-xs text-warning">
                    {upload.result.skipped.map((s) => (
                      <li key={s.row}>
                        <span className="font-bold">{t('inventory.common.rowLabel', { row: s.row })}</span> {s.reasons.join(' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {upload.status === 'failed' && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-xs font-semibold text-destructive">{upload.error}</p>
                </div>
              )}

              {upload.status === 'succeeded' ? (
                <button
                  type="button"
                  onClick={reset}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90"
                >
                  {t('inventory.common.importAnotherFile')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={upload.status === 'loading'}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
                >
                  {upload.status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('inventory.products.importingProducts', { count: parseResult.items.length })}
                    </>
                  ) : (
                    t('inventory.products.importButtonCount', { count: parseResult.items.length })
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
