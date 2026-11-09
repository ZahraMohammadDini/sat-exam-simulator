'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { adminGet, adminPost } from '@/lib/admin-client';
import { hydrateTestImages } from '@/lib/import-assets';

interface TestOption {
  id: string;
  title: string;
  isPublished: boolean;
}

export interface ImportExportPanelProps {
  tests: TestOption[];
}

export function ImportExportPanel({ tests }: ImportExportPanelProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [exportId, setExportId] = useState(tests[0]?.id ?? '');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [importPassword, setImportPassword] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [assetProgress, setAssetProgress] = useState<{ completed: number; total: number } | null>(null);

  const doExport = async () => {
    if (!exportId) return;
    setExporting(true);
    setExportError(null);
    try {
      const data = await adminGet<unknown>(
        `/api/admin/import-export?testId=${exportId}`
      );
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const t = tests.find((x) => x.id === exportId);
      const safe = (t?.title ?? 'test').replace(/[^a-z0-9_-]+/gi, '-');
      a.download = `${safe}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!importPassword.trim()) {
      setImportError('Enter a password for the imported test first');
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const text = await file.text();
      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error('File is not valid JSON');
      }

      if (file.size > 60 * 1024 * 1024) throw new Error('JSON file too large (60 MB maximum). Split large pictures into smaller compressed images.');
      setAssetProgress({ completed: 0, total: 0 });
      const hydratedPayload = await hydrateTestImages(payload, (completed, total) => setAssetProgress({ completed, total }));
      const result = await adminPost<{ testId: string }>(
        '/api/admin/import-export',
        { password: importPassword, payload: hydratedPayload }
      );

      setImportSuccess(`Imported successfully. Opening editor…`);
      setImportPassword('');
      router.push(`/admin/tests/${result.testId}`);
      router.refresh();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
      setImporting(false);
      setAssetProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export */}
      <section className="space-y-4 rounded-lg border border-border-default bg-surface p-6 shadow-card">
        <div>
          <h2 className="text-base font-semibold">Export a test</h2>
          <p className="mt-1 text-xs text-text-muted">
            Downloads a JSON file with the test structure and all question content.
          </p>
        </div>

        {exportError && <Alert tone="error">{exportError}</Alert>}

        {tests.length === 0 ? (
          <p className="text-sm text-text-muted">No tests to export yet.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={exportId}
              onChange={(e) => setExportId(e.target.value)}
              className="h-10 flex-1 rounded-md border border-border-default px-3 text-sm"
            >
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                  {t.isPublished ? '' : ' (draft)'}
                </option>
              ))}
            </select>
            <Button onClick={doExport} loading={exporting}>
              Download JSON
            </Button>
          </div>
        )}
      </section>

      {/* Import */}
      <section className="space-y-4 rounded-lg border border-border-default bg-surface p-6 shadow-card">
        <div>
          <h2 className="text-base font-semibold">Import a test</h2>
          <p className="mt-1 text-xs text-text-muted">
            Upload an export or a PDF-converted JSON test. Each module, question, answer,
            branching route, and embedded base64 image is imported. Images upload directly
            to Vercel Blob first; existing tests remain unchanged.
          </p>
        </div>

        {importError && <Alert tone="error">{importError}</Alert>}
        {importSuccess && <Alert tone="success">{importSuccess}</Alert>}
        {importing && assetProgress && <p role="status" className="text-sm text-text-secondary">
          {assetProgress.total ? `Uploading images ${assetProgress.completed} / ${assetProgress.total}…` : 'Validating JSON and creating test…'}
        </p>}
        <div className="rounded-md bg-surface-alt px-3 py-3 text-xs leading-relaxed text-text-secondary">
          <strong>PDF → JSON workflow:</strong> use the included <code>examples/sat-adaptive-demo.json</code> as a template.
          For images, put <code>data:image/png;base64,...</code> in an image field; the importer replaces it
          with a hosted image URL. Complete adaptive tests require separate easy and hard Module 2 banks
          for each subject, plus Module 1. Imports can be published after review.
        </div>

        <label className="block space-y-1 text-xs">
          <span className="font-medium">
            Password for the imported test{' '}
            <span className="text-text-muted">(students will use this)</span>
          </span>
          <input
            type="text"
            value={importPassword}
            onChange={(e) => setImportPassword(e.target.value)}
            placeholder="e.g. demo1234"
            className="h-10 w-full max-w-xs rounded-md border border-border-default px-3 font-mono text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <div>
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            loading={importing}
            disabled={!importPassword.trim()}
          >
            Choose JSON file…
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onFileChange}
            className="hidden"
          />
        </div>
      </section>
    </div>
  );
}
