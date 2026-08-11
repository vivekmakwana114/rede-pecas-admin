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
import { useLocale } from '@/lib/i18n/LocaleContext';

type ParseError = { type: 'missing-columns'; missingColumns: string[] } | { type: 'empty' } | { type: 'unreadable' };
type Stage = 'idle' | 'invalid' | 'ready';

/**
 * Builds the review-grid column defs for the parsed import rows, translating
 * each header through the given `t()` function.
 */
function buildItemColumns(t: (path: string) => string): GridColumn<ServiceUploadItemPayload>[] {
  return [
    {
      key: 'providerName',
      header: t('inventory.services.columns.providerName'),
      cell: (row) => <span className="text-muted-foreground">{row.providerName}</span>,
    },
    {
      key: 'providerAddress',
      header: t('inventory.services.columns.address'),
      cell: (row) => <span className="text-muted-foreground">{row.providerAddress || '—'}</span>,
    },
    {
      key: 'providerProvince',
      header: t('inventory.services.columns.province'),
      cell: (row) => <span className="text-muted-foreground">{row.providerProvince || '—'}</span>,
    },
    {
      key: 'providerPhone',
      header: t('inventory.services.columns.phone'),
      cell: (row) => <span className="text-muted-foreground">{row.providerPhone || '—'}</span>,
    },
    {
      key: 'specialties',
      header: t('inventory.services.columns.specialties'),
      cell: (row) => <span className="text-muted-foreground">{row.specialties || '—'}</span>,
    },
    {
      key: 'rating',
      header: t('inventory.services.columns.rating'),
      align: 'right',
      cell: (row) => <span className="text-muted-foreground">{row.rating ?? '—'}</span>,
    },
    {
      key: 'responseTime',
      header: t('inventory.services.columns.responseTime'),
      cell: (row) => <span className="text-muted-foreground">{row.responseTime || '—'}</span>,
    },
    {
      key: 'serviceName',
      header: t('inventory.services.columns.serviceName'),
      cell: (row) => <span className="font-medium text-foreground">{row.serviceName}</span>,
    },
    {
      key: 'serviceCategory',
      header: t('inventory.services.columns.serviceCategory'),
      cell: (row) => <span className="text-muted-foreground">{row.serviceCategory}</span>,
    },
    {
      key: 'serviceBasePrice',
      header: t('inventory.services.columns.serviceBasePrice'),
      align: 'right',
      cell: (row) => <span className="text-foreground">{formatKwanza(row.serviceBasePrice)}</span>,
    },
    {
      key: 'serviceDurationH',
      header: t('inventory.services.columns.serviceDurationH'),
      align: 'right',
      cell: (row) => <span className="text-foreground">{row.serviceDurationH}</span>,
    },
    {
      key: 'availableAtHome',
      header: t('inventory.services.columns.availableAtHome'),
      align: 'center',
      cell: (row) => <span className="text-foreground">{row.availableAtHome ? t('inventory.common.yes') : t('inventory.common.no')}</span>,
    },
    {
      key: 'baseTravelFee',
      header: t('inventory.services.columns.baseTravelFee'),
      align: 'right',
      cell: (row) => <span className="text-muted-foreground">{row.baseTravelFee != null ? formatKwanza(row.baseTravelFee) : '—'}</span>,
    },
    {
      key: 'logisticsFeeNotes',
      header: t('inventory.services.columns.logisticsFeeNotes'),
      cellClassName: 'max-w-xs',
      cell: (row) => <span className="text-muted-foreground">{row.logisticsFeeNotes || '—'}</span>,
    },
  ];
}

/**
 * Slide-over panel that walks the user through importing a services
 * spreadsheet: pick/drop a file, review the parsed rows, then submit the import
 * and show the resulting added/updated/skipped counts.
 */
export function ServiceImportPanel({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { t } = useLocale();
  const { upload } = useAppSelector((state) => state.services);
  const itemColumns = buildItemColumns(t);
  const steps = [t('inventory.common.steps.selectFile'), t('inventory.common.steps.review'), t('inventory.common.steps.import')];

  const [stage, setStage] = useState<Stage>('idle');
  const [parseError, setParseError] = useState<ParseError | null>(null);
  const [parseResult, setParseResult] = useState<ServiceParseResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      dispatch(resetServiceUpload());
    };
  }, [dispatch]);

  /**
   * Reads the selected file as a workbook, parses it via `parseServiceWorkbookRows`,
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
   * Fetches the service import template file from the API and triggers a
   * browser download of it as `service-template.xlsx`.
   */
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
   * Clears all local selection/parse state and dispatches `resetServiceUpload`
   * so the panel returns to its initial "select file" stage.
   */
  const reset = () => {
    setStage('idle');
    setParseError(null);
    setParseResult(null);
    setSelectedFile(null);
    setFileName(null);
    dispatch(resetServiceUpload());
  };

  /**
   * Dispatches `importServices` with the selected file and, on success,
   * refreshes the services list so the grid reflects the newly imported data.
   */
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
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{t('inventory.common.importTitle.services')}</h2>
            <ol className="mt-3 flex items-center gap-2">
              {steps.map((label, index) => {
                const isCompleted = index < currentStep || (index === 2 && upload.status === 'succeeded');
                const isCurrent = index === currentStep && upload.status !== 'succeeded';
                return (
                  <li key={label} className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-2xs font-bold ${
                        isCompleted
                          ? 'bg-success text-success-foreground'
                          : isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                    </span>
                    <span className={`hidden text-xs font-semibold sm:inline ${index <= currentStep || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {label}
                    </span>
                    {index < steps.length - 1 && <span className="h-px w-4 bg-border" />}
                  </li>
                );
              })}
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
                <p className="mt-1 text-xs text-muted-foreground">{t('inventory.services.dropHint')}</p>
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
                    {parseError.type === 'empty' && t('inventory.services.emptyMessage', { fileName: fileName ?? '' })}
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
                {parseResult.items.length === 1 ? t('inventory.services.serviceSingular') : t('inventory.services.servicePlural')}
                {parseResult.skippedCount > 0 && upload.status !== 'succeeded' && (
                  <span className="text-warning">
                    {' '}
                    ·{' '}
                    {parseResult.skippedCount === 1
                      ? t('inventory.services.rowSkippedNoteSingular', { count: parseResult.skippedCount })
                      : t('inventory.services.rowSkippedNotePlural', { count: parseResult.skippedCount })}
                  </span>
                )}
              </p>

              <Grid
                columns={itemColumns}
                rows={parseResult.items}
                getRowId={(row) => `${row.providerName}-${row.serviceName}`}
                pageSize={5}
              />

              {upload.status === 'succeeded' && upload.result?.skipped && upload.result.skipped.length > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                    <p className="text-sm font-bold text-warning">
                      {upload.result.skipped.length === 1
                        ? t('inventory.services.rowSkippedTitleSingular', { count: upload.result.skipped.length })
                        : t('inventory.services.rowSkippedTitlePlural', { count: upload.result.skipped.length })}
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
                      {t('inventory.services.importingServices', { count: parseResult.items.length })}
                    </>
                  ) : (
                    t('inventory.services.importButtonCount', { count: parseResult.items.length })
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
