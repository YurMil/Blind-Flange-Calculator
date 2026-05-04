import {useEffect, useRef, useState} from 'react';
import {Download, FolderOpen, History, Save, Trash2, Upload, X} from 'lucide-react';
import {
  clearHistoryEntries,
  createHistoryEntryId,
  deleteHistoryEntry,
  getAllHistoryEntries,
  isHistoryEntry,
  normalizeHistoryEntry,
  saveHistoryEntry,
  type ConfigurationHistorySummary,
  type HistoryEntry,
} from '../history/configurationHistoryStore';

type Props = {
  open: boolean;
  currentTag: string;
  currentConfig: unknown;
  currentSummary: ConfigurationHistorySummary;
  onClose: () => void;
  onOpenConfig: (config: unknown) => void;
};

export default function ConfigurationHistoryPanel({
  open,
  currentTag,
  currentConfig,
  currentSummary,
  onClose,
  onOpenConfig,
}: Props) {
  const importRef = useRef<HTMLInputElement | null>(null);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const refresh = async () => {
    const nextEntries = await getAllHistoryEntries();
    setEntries(nextEntries.map(normalizeHistoryEntry).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  };

  useEffect(() => {
    if (!open) return;
    void refresh().catch((err) => setError(err instanceof Error ? err.message : String(err)));

    const handleHistoryChanged = () => {
      void refresh().catch((err) => setError(err instanceof Error ? err.message : String(err)));
    };
    window.addEventListener('blind-flange-history-changed', handleHistoryChanged);
    return () => window.removeEventListener('blind-flange-history-changed', handleHistoryChanged);
  }, [open]);

  if (!open) return null;

  const run = async (action: () => Promise<void>) => {
    try {
      setIsBusy(true);
      setError(null);
      await action();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveCurrent = () =>
    run(async () => {
      const now = new Date().toISOString();
      await saveHistoryEntry({
        id: createHistoryEntryId(),
        tag: currentTag,
        savedAt: now,
        updatedAt: now,
        source: 'manual',
        summary: currentSummary,
        config: currentConfig,
      });
    });

  const handleExportHistory = async () => {
    const history = entries.length > 0 ? entries : await getAllHistoryEntries();
    const payload = {
      schema: 'blind-flange-calculator-history',
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: history.map(normalizeHistoryEntry).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `blind-flange-history-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportHistory = async (file: File | undefined) => {
    if (!file) return;

    await run(async () => {
      const parsed = JSON.parse(await file.text()) as unknown;
      const entriesCandidate =
        typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as {entries?: unknown}).entries)
          ? (parsed as {entries: unknown[]}).entries
          : Array.isArray(parsed)
            ? parsed
            : null;

      if (!entriesCandidate) {
        throw new Error('History file has an unsupported format.');
      }

      const importedEntries = entriesCandidate.filter(isHistoryEntry);
      if (importedEntries.length === 0) {
        throw new Error('History file does not contain valid configuration entries.');
      }

      await Promise.all(importedEntries.map((entry) => saveHistoryEntry(normalizeHistoryEntry(entry))));
    });

    if (importRef.current) {
      importRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex max-h-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950">
        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200">
              <History size={14} />
              Configuration history
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-100">Saved flange parameterizations</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-start rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-slate-300 transition hover:border-slate-500 hover:text-slate-100 md:self-auto"
            aria-label="Close history"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 p-4">
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => void handleImportHistory(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={handleSaveCurrent}
            disabled={isBusy}
            className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/20 disabled:cursor-wait disabled:opacity-60"
          >
            <Save size={16} />
            <span>Save current</span>
          </button>
          <button
            type="button"
            onClick={() => void handleExportHistory()}
            disabled={isBusy || entries.length === 0}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            <span>Export history</span>
          </button>
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            disabled={isBusy}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
          >
            <Upload size={16} />
            <span>Import history</span>
          </button>
        </div>

        {error ? <div className="border-b border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">{error}</div> : null}

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">
              No saved flange configurations yet.
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/55 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{entry.tag}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Last updated: {new Date(entry.updatedAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      DN {entry.summary.dn} / PN {entry.summary.pn} · P {entry.summary.pressureOp}/{entry.summary.pressureTest} bar ·{' '}
                      {entry.summary.material}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.summary.geometryMode}
                      {entry.summary.outerDiameter ? ` · D ${entry.summary.outerDiameter} mm` : ''}
                      {entry.summary.thickness ? ` · t ${entry.summary.thickness} mm` : ''}
                      {entry.summary.boltCount && entry.summary.boltSize ? ` · ${entry.summary.boltCount} x ${entry.summary.boltSize}` : ''}
                      {entry.source === 'live' ? ' · live' : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenConfig(entry.config);
                        onClose();
                      }}
                      className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/20"
                    >
                      <FolderOpen size={16} />
                      <span>Open</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void run(async () => deleteHistoryEntry(entry.id))}
                      className="rounded-xl border border-slate-700 bg-slate-950/50 p-2 text-slate-400 transition hover:border-rose-400/50 hover:text-rose-200"
                      aria-label={`Delete ${entry.tag}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {entries.length > 0 ? (
          <div className="flex justify-end border-t border-slate-800 p-4">
            <button
              type="button"
              onClick={() => void run(clearHistoryEntries)}
              className="text-sm font-semibold text-slate-500 transition hover:text-rose-200"
            >
              Clear history
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
