import {useRef, useState} from 'react';
import {FileDown, FileUp} from 'lucide-react';

type Props<TConfig> = {
  config: TConfig;
  fileName: string;
  onImport: (config: unknown) => void;
  presentation?: 'toolbar' | 'menu';
};

const toolbarButton =
  'flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-800';
const toolbarExport =
  'flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/20';
const menuButton =
  'flex w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-left text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-800';
const menuExport =
  'flex w-full items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2.5 text-left text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/20';

export default function ConfigJsonActions<TConfig>({
  config,
  fileName,
  onImport,
  presentation = 'toolbar',
}: Props<TConfig>) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMenu = presentation === 'menu';

  const handleExport = () => {
    setError(null);
    const blob = new Blob([`${JSON.stringify(config, null, 2)}\n`], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;

    try {
      setError(null);
      onImport(JSON.parse(await file.text()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import configuration.');
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className={isMenu ? 'space-y-2' : 'flex flex-col items-start gap-2 lg:items-end'}>
      <div className={isMenu ? 'space-y-2' : 'flex flex-wrap items-center gap-2'}>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => void handleImport(event.target.files?.[0])}
        />
        <button
          type="button"
          role={isMenu ? 'menuitem' : undefined}
          onClick={() => inputRef.current?.click()}
          className={isMenu ? menuButton : toolbarButton}
        >
          <FileUp size={16} />
          <span>Import JSON</span>
        </button>
        <button
          type="button"
          role={isMenu ? 'menuitem' : undefined}
          onClick={handleExport}
          className={isMenu ? menuExport : toolbarExport}
        >
          <FileDown size={16} />
          <span>Export JSON</span>
        </button>
      </div>
      {error ? <p className="max-w-sm text-xs text-amber-200">{error}</p> : null}
    </div>
  );
}
