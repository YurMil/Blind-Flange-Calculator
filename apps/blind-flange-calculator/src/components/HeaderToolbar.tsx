import {useEffect, useId, useRef, useState} from 'react';
import {HelpCircle, History, MoreHorizontal} from 'lucide-react';
import ConfigJsonActions from './ConfigJsonActions';

type Props<TConfig> = {
  config: TConfig;
  fileName: string;
  onImport: (config: unknown) => void;
  onOpenHelp: () => void;
  onOpenHistory: () => void;
};

const menuButtonClass =
  'flex w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-left text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-800';

export default function HeaderToolbar<TConfig>({
  config,
  fileName,
  onImport,
  onOpenHelp,
  onOpenHistory,
}: Props<TConfig>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div ref={rootRef} className="relative flex w-full flex-col items-stretch gap-2 sm:items-end">
      <div className="hidden flex-wrap items-center gap-2 md:flex md:justify-end">
        <button
          type="button"
          onClick={onOpenHelp}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-800"
          aria-label="Open calculation help"
        >
          <HelpCircle size={17} />
        </button>
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-800"
        >
          <History size={16} />
          <span>History</span>
        </button>
        <ConfigJsonActions config={config} fileName={fileName} onImport={onImport} />
      </div>

      <div className="md:hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm font-semibold text-slate-100"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span>Actions</span>
          <MoreHorizontal size={18} aria-hidden="true" />
        </button>
        {menuOpen ? (
          <div
            id={menuId}
            role="menu"
            className="absolute right-0 z-30 mt-2 w-full min-w-[14rem] space-y-2 rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-2xl shadow-slate-950"
          >
            <button
              type="button"
              role="menuitem"
              className={menuButtonClass}
              onClick={() => {
                setMenuOpen(false);
                onOpenHelp();
              }}
            >
              <HelpCircle size={16} />
              Calculation help
            </button>
            <button
              type="button"
              role="menuitem"
              className={menuButtonClass}
              onClick={() => {
                setMenuOpen(false);
                onOpenHistory();
              }}
            >
              <History size={16} />
              History
            </button>
            <ConfigJsonActions
              config={config}
              fileName={fileName}
              onImport={(next) => {
                setMenuOpen(false);
                onImport(next);
              }}
              presentation="menu"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
