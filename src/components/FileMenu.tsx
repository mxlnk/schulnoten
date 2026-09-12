import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useFileStore } from '../store/useFileStore';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
const SAVE_SHORTCUT = isMac ? '⌘S' : 'Strg+S';

/** App title, current .noten file with unsaved indicator, and the "Datei" menu. */
export function FileMenu() {
  const hasData = useStore((state) => state.classes.length > 0);
  const fileName = useFileStore((state) => state.fileName);
  const dirty = useFileStore((state) => state.dirty);
  const busy = useFileStore((state) => state.busy);
  const openFile = useFileStore((state) => state.openFile);
  const saveFile = useFileStore((state) => state.saveFile);
  const saveFileAs = useFileStore((state) => state.saveFileAs);
  const newFile = useFileStore((state) => state.newFile);

  const [isOpen, setIsOpen] = useState(false);

  const unsaved = hasData && (dirty || fileName === null);
  const label = fileName ?? (hasData ? 'Nicht gespeichert' : 'Keine Datei');

  useEffect(() => {
    document.title = fileName ? `${fileName} – Schulnoten` : 'Schulnoten';
  }, [fileName]);

  const run = (action: () => unknown) => {
    setIsOpen(false);
    void action();
  };

  const itemClass =
    'w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-gray-800">Schulnoten</h1>

        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            className="flex items-center px-2.5 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Datei
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <div
                role="menu"
                className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-20"
              >
                <div className="py-1">
                  <button role="menuitem" onClick={() => run(openFile)} disabled={busy} className={itemClass}>
                    <span>Öffnen…</span>
                  </button>
                  <button role="menuitem" onClick={() => run(saveFile)} disabled={busy} className={itemClass}>
                    <span>Speichern</span>
                    <span className="text-xs text-gray-400">{SAVE_SHORTCUT}</span>
                  </button>
                  <button role="menuitem" onClick={() => run(saveFileAs)} disabled={busy} className={itemClass}>
                    <span>Speichern unter…</span>
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button role="menuitem" onClick={() => run(newFile)} disabled={busy} className={itemClass}>
                    <span>Neue Datei</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div
        className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 min-w-0"
        data-testid="file-status"
        title={fileName ?? undefined}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="truncate">{label}</span>
        {unsaved && (
          <span
            className="shrink-0 text-amber-500"
            title="Ungespeicherte Änderungen"
            aria-label="Ungespeicherte Änderungen"
            data-testid="file-dirty"
          >
            ●
          </span>
        )}
      </div>
    </div>
  );
}
