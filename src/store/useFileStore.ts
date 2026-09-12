import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStore } from './useStore';
import {
  DEFAULT_FILE_NAME,
  ensureNotenExtension,
  isNotenFileName,
  parseNotenFile,
  serializeNotenFile,
} from '../utils/notenFile';
import {
  downloadText,
  ensureWritePermission,
  loadPersistedFileHandle,
  persistFileHandle,
  pickFileToOpen,
  pickFileToSave,
  supportsFileSystemAccess,
  writeTextToHandle,
} from '../utils/fileSystem';

/**
 * Tracks which .noten file the current data belongs to and whether there are
 * unsaved changes. The grade data itself lives in useStore (and localStorage,
 * which acts as the working copy); this store only handles the file on disk.
 */

interface FileState {
  /** Name of the current .noten file, or null if the data was never saved. */
  fileName: string | null;
  /** True when the data changed since it was last loaded from / saved to a file. */
  dirty: boolean;
  /** Handle of the current file (File System Access API only; not persisted here). */
  handle: FileSystemFileHandle | null;
  /** True while a file operation is running, to avoid double pickers. */
  busy: boolean;
}

interface FileActions {
  openFile: () => Promise<void>;
  openFromHandle: (handle: FileSystemFileHandle) => Promise<void>;
  saveFile: () => Promise<void>;
  saveFileAs: () => Promise<void>;
  newFile: () => void;
}

type FileStore = FileState & FileActions;

const UNSAVED_WARNING =
  'Es gibt ungespeicherte Änderungen, die dabei verloren gehen. Trotzdem fortfahren?';

/** Resolves once the handle persisted from the last session has been restored. */
const handleRestored: Promise<void> = loadPersistedFileHandle().then((handle) => {
  if (handle) useFileStore.setState({ handle });
});

export const useFileStore = create<FileStore>()(
  persist(
    (set, get) => {
      const runExclusive = async (operation: () => Promise<void>, failureMessage: string) => {
        if (get().busy) return;
        set({ busy: true });
        try {
          await operation();
        } catch (error) {
          alert(`${failureMessage}: ${(error as Error).message}`);
        } finally {
          set({ busy: false });
        }
      };

      const loadFromFile = async (file: File, handle: FileSystemFileHandle | null) => {
        const data = parseNotenFile(await file.text());
        if (hasUnsavedData() && !confirm(UNSAVED_WARNING)) return;

        useStore.getState().importData(data);

        // A legacy .json backup is imported but not adopted as the working
        // file, so the next save asks for a .noten location.
        const isNoten = isNotenFileName(file.name);
        const nextHandle = isNoten ? handle : null;
        set({ fileName: isNoten ? file.name : null, handle: nextHandle, dirty: !isNoten });
        await persistFileHandle(nextHandle);
      };

      const writeTo = async (handle: FileSystemFileHandle, text: string) => {
        await writeTextToHandle(handle, text);
        set({ handle, fileName: handle.name, dirty: false });
      };

      const saveAs = async (text: string) => {
        const suggestedName = ensureNotenExtension(get().fileName ?? DEFAULT_FILE_NAME);
        if (!supportsFileSystemAccess()) {
          downloadText(text, suggestedName);
          set({ fileName: suggestedName, dirty: false });
          return;
        }
        const handle = await pickFileToSave(suggestedName);
        if (!handle) return;
        await writeTo(handle, text);
        await persistFileHandle(handle);
      };

      return {
        fileName: null,
        dirty: false,
        handle: null,
        busy: false,

        openFile: () =>
          runExclusive(async () => {
            const picked = await pickFileToOpen();
            if (picked) await loadFromFile(picked.file, picked.handle);
          }, 'Datei konnte nicht geöffnet werden'),

        openFromHandle: (handle) =>
          runExclusive(async () => {
            await loadFromFile(await handle.getFile(), handle);
          }, 'Datei konnte nicht geöffnet werden'),

        saveFile: () =>
          runExclusive(async () => {
            await handleRestored;
            const text = serializeNotenFile(useStore.getState().classes);
            const { handle } = get();
            if (!handle) {
              await saveAs(text);
              return;
            }
            if (!(await ensureWritePermission(handle))) return;
            try {
              await writeTo(handle, text);
            } catch (error) {
              // The file was moved or deleted since it was opened: pick a new location.
              if (error instanceof DOMException && error.name === 'NotFoundError') {
                await saveAs(text);
                return;
              }
              throw error;
            }
          }, 'Datei konnte nicht gespeichert werden'),

        saveFileAs: () =>
          runExclusive(async () => {
            await handleRestored;
            await saveAs(serializeNotenFile(useStore.getState().classes));
          }, 'Datei konnte nicht gespeichert werden'),

        newFile: () => {
          if (hasUnsavedData() && !confirm(UNSAVED_WARNING)) return;
          useStore.getState().importData({ classes: [] });
          set({ fileName: null, handle: null, dirty: false });
          void persistFileHandle(null);
        },
      };
    },
    {
      name: 'schulnoten-file',
      partialize: (state) => ({ fileName: state.fileName, dirty: state.dirty }),
    }
  )
);

/**
 * Data counts as unsaved when it was changed after the last save, or when it
 * was never written to a file at all (e.g. data from before file support).
 */
export function hasUnsavedData(): boolean {
  const { classes } = useStore.getState();
  const { dirty, fileName } = useFileStore.getState();
  return classes.length > 0 && (dirty || fileName === null);
}

// Any change to the grade data marks the file dirty. Subscribe only after
// hydration so that restoring localStorage on startup doesn't count as a change.
function watchDataChanges() {
  useStore.subscribe((state, previous) => {
    if (state.classes !== previous.classes) {
      useFileStore.setState({ dirty: true });
    }
  });
}

if (useStore.persist.hasHydrated()) {
  watchDataChanges();
} else {
  useStore.persist.onFinishHydration(watchDataChanges);
}
