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
import { importServices, resetServiceUpload, fetchServices } from '@/store/services/servicesSlice';
import { Grid } from '@/components/Grid/Grid';
import type { GridColumn } from '@/components/Grid/types';
import { parseServiceWorkbookRows, type ServiceParseResult } from './serviceAdapters';
import * as servicesService from '@/store/services/servicesService';
import type { ServiceUploadItemPayload } from '@/store/services/servicesService';

// Mirrors ImportPanel.tsx — client-side parsing (serviceAdapters.ts) only
// drives the preview grid below; the file itself is what actually gets
// uploaded and validated server-side (see handleImport).

type ParseError = { type: 'missing-columns'; missingColumns: string[] } | { type: 'empty' } | { type: 'unreadable' };
type Stage = 'idle' | 'invalid' | 'ready';

const STEPS = ['Select file', 'Review', 'Import'] as const;

// One column per column in servicos_rede_pecas_v3_EN.csv, in file order — no
// combining fields into a single cell, so the review step shows exactly
// what's in the source file, matching ServicesGrid's columns.
const ITEM_COLUMNS: GridColumn<ServiceUploadItemPayload>[] = [
  {
    key: 'providerName',
    header: 'Provider Name',
    cell: (row) => <span className="text-muted-foreground">{row.providerName}</span>,
  },
  {
    key: 'providerAddress',
    header: 'Address',
    cell: (row) => <span className="text-muted-foreground">{row.providerAddress || '—'}</span>,
  },
  {
    key: 'providerProvince',
    header: 'Province',
    cell: (row) => <span className="text-muted-foreground">{row.providerProvince || '—'}</span>,
  },
  {
    key: 'providerPhone',
    header: 'Phone',
    cell: (row) => <span className="text-muted-foreground">{row.providerPhone || '—'}</span>,
  },
  {
    key: 'specialties',
    header: 'Specialties',
    cell: (row) => <span className="text-muted-foreground">{row.specialties || '—'}</span>,
  },
  {
    key: 'rating',
    header: 'Rating',
    align: 'right',
    cell: (row) => <span className="text-muted-foreground">{row.rating ?? '—'}</span>,
  },
  {
    key: 'responseTime',
    header: 'Response Time',
    cell: (row) => <span className="text-muted-foreground">{row.responseTime || '—'}</span>,
  },
  {
    key: 'serviceName',
    header: 'Service Name',
    cell: (row) => <span className="font-medium text-foreground">{row.serviceName}</span>,
  },
  {
    key: 'serviceCategory',
    header: 'Service Category',
    cell: (row) => <span className="text-muted-foreground">{row.serviceCategory}</span>,
  },
  {
    key: 'serviceBasePrice',
    header: 'Service Base Price',
    align: 'right',
    cell: (row) => <span className="text-foreground">{formatKwanza(row.serviceBasePrice)}</span>,
  },
  {
    key: 'serviceDurationH',
    header: 'Service Duration H',
    align: 'right',
    cell: (row) => <span className="text-foreground">{row.serviceDurationH}</span>,
  },
  {
    key: 'availableAtHome',
    header: 'Available At Home',
    align: 'center',
    cell: (row) => <span className="text-foreground">{row.availableAtHome ? 'Yes' : 'No'}</span>,
  },
  {
    key: 'baseTravelFee',
    header: 'Base Travel Fee',
    align: 'right',
    cell: (row) => <span className="text-muted-foreground">{row.baseTravelFee != null ? formatKwanza(row.baseTravelFee) : '—'}</span>,
  },
  {
    key: 'logisticsFeeNotes',
    header: 'Logistics Fee Notes',
    cellClassName: 'max-w-xs',
    cell: (row) => <span className="text-muted-foreground">{row.logisticsFeeNotes || '—'}</span>,
  },
];

export function ServiceImportPanel({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { upload } = useAppSelector((state) => state.services);

  const [stage, setStage] = useState<Stage>('idle');
  const [parseError, setParseError] = useState<ParseError | null>(null);
  const [parseResult, setParseResult] = useState<ServiceParseResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Panel is only ever mounted while open (page.tsx conditionally renders
  // it) — unmount clears the shared upload status so reopening always starts
  // from a clean 'ready' stage instead of showing a stale success/error.
  useEffect(() => {
    return () => {
      dispatch(resetServiceUpload());
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
        const headerRow = (XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 })[0] as unknown[] | undefined) ?? [];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        const result = parseServiceWorkbookRows(rawRows, headerRow);

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

  const handleDownloadTemplate = async () => {
    setTemplateDownloading(true);
    try {
      const res = await servicesService.downloadServiceTemplate();
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'service-template.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setTemplateDownloading(false);
    }
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
    dispatch(resetServiceUpload());
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    const result = await dispatch(importServices(selectedFile));
    if (importServices.fulfilled.match(result)) {
      dispatch(fetchServices());
    }
  };

  const currentStep = stage === 'idle' || stage === 'invalid' ? 0 : upload.status === 'idle' || upload.status === 'failed' ? 1 : 2;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-foreground/60" onClick={onClose}>
      <div className="flex h-full w-full max-w-lg flex-col bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Import Services</h2>
            <ol className="mt-3 flex items-center gap-2">
              {STEPS.map((label, index) => (
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
                  {index < STEPS.length - 1 && <span className="h-px w-4 bg-border" />}
                </li>
              ))}
            </ol>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
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
                <p className="text-sm font-bold text-foreground">Drop a CSV or Excel file, or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Needs Provider Name, Service Name, Service Category, Service Base Price and Service Duration H columns
                </p>
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
                  Download template
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
                    {parseError.type === 'missing-columns' && "Couldn't find some required columns"}
                    {parseError.type === 'empty' && 'No usable rows found'}
                    {parseError.type === 'unreadable' && "Couldn't read this file"}
                  </p>
                  <p className="mt-1 text-xs text-destructive">
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
                className="mt-4 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-bold text-destructive transition-all hover:bg-destructive/10"
              >
                Try another file
              </button>
            </div>
          )}

          {stage === 'ready' && parseResult && (
            <div className="space-y-4">
              {upload.status === 'succeeded' ? (
                <div className="rounded-lg border border-success/30 bg-success/10 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <p className="text-sm font-bold text-success">Import complete</p>
                  </div>
                  {upload.result && (
                    <div className={`mt-3 grid gap-3 text-center ${upload.result.skipped?.length ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      <div>
                        <p className="text-lg font-bold text-success">{upload.result.inserted}</p>
                        <p className="text-2xs font-semibold text-success">Added</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-success">{upload.result.updated}</p>
                        <p className="text-2xs font-semibold text-success">Updated</p>
                      </div>
                      {upload.result.skipped && upload.result.skipped.length > 0 && (
                        <div>
                          <p className="text-lg font-bold text-warning">{upload.result.skipped.length}</p>
                          <p className="text-2xs font-semibold text-warning">Skipped</p>
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
                    aria-label="Remove file"
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <p className="text-xs font-semibold text-muted-foreground">
                {upload.status === 'succeeded' ? 'Imported items' : 'Ready to import'} · {parseResult.items.length} service
                {parseResult.items.length === 1 ? '' : 's'}
                {parseResult.skippedCount > 0 && upload.status !== 'succeeded' && (
                  <span className="text-warning">
                    {' '}
                    · {parseResult.skippedCount} row{parseResult.skippedCount === 1 ? '' : 's'} skipped (missing provider, service name, or category)
                  </span>
                )}
              </p>

              <Grid
                columns={ITEM_COLUMNS}
                rows={parseResult.items}
                getRowId={(row) => `${row.providerName}-${row.serviceName}`}
                pageSize={5}
              />

              {upload.status === 'succeeded' && upload.result?.skipped && upload.result.skipped.length > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                    <p className="text-sm font-bold text-warning">
                      {upload.result.skipped.length} row{upload.result.skipped.length === 1 ? '' : 's'} skipped
                    </p>
                  </div>
                  <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto text-xs text-warning">
                    {upload.result.skipped.map((s) => (
                      <li key={s.row}>
                        <span className="font-bold">Row {s.row}:</span> {s.reasons.join(' ')}
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
                  Import another file
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
                      Importing {parseResult.items.length} services…
                    </>
                  ) : (
                    `Import ${parseResult.items.length} services`
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
