import { downloadBlob } from './download';
import { NOTEN_EXTENSION, NOTEN_MIME } from './notenFile';

/**
 * Thin wrapper around the File System Access API (Chromium-based browsers)
 * with a download/<input type="file"> fallback for browsers without it.
 */

const PICKER_ID = 'schulnoten';

const NOTEN_TYPE: FilePickerAcceptType = {
  description: 'Schulnoten-Datei',
  accept: { [NOTEN_MIME]: [NOTEN_EXTENSION] },
};

const JSON_BACKUP_TYPE: FilePickerAcceptType = {
  description: 'JSON-Sicherung',
  accept: { 'application/json': ['.json'] },
};

export interface PickedFile {
  file: File;
  /** Only available with the File System Access API; null in the fallback. */
  handle: FileSystemFileHandle | null;
}

export function supportsFileSystemAccess(): boolean {
  return (
    typeof window.showOpenFilePicker === 'function' &&
    typeof window.showSaveFilePicker === 'function'
  );
}

/** True when the user dismissed a native picker without choosing a file. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** Shows a file picker for .noten files. Resolves to null when cancelled. */
export async function pickFileToOpen(): Promise<PickedFile | null> {
  if (supportsFileSystemAccess()) {
    try {
      const [handle] = await window.showOpenFilePicker!({
        id: PICKER_ID,
        multiple: false,
        types: [NOTEN_TYPE, JSON_BACKUP_TYPE],
      });
      return { file: await handle.getFile(), handle };
    } catch (error) {
      if (isAbortError(error)) return null;
      throw error;
    }
  }
  const file = await pickFileViaInput(`${NOTEN_EXTENSION},.json,application/json`);
  return file ? { file, handle: null } : null;
}

function pickFileViaInput(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    const finish = (file: File | null) => {
      input.remove();
      resolve(file);
    };
    input.addEventListener('change', () => finish(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => finish(null));
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Shows the native "save as" dialog. Resolves to null when cancelled.
 * Only call this when supportsFileSystemAccess() is true.
 */
export async function pickFileToSave(suggestedName: string): Promise<FileSystemFileHandle | null> {
  try {
    return await window.showSaveFilePicker!({
      id: PICKER_ID,
      suggestedName,
      types: [NOTEN_TYPE],
    });
  } catch (error) {
    if (isAbortError(error)) return null;
    throw error;
  }
}

/** Asks for write permission on a handle restored from IndexedDB, if needed. */
export async function ensureWritePermission(handle: FileSystemFileHandle): Promise<boolean> {
  const descriptor: FileSystemHandlePermissionDescriptor = { mode: 'readwrite' };
  if (!handle.queryPermission || !handle.requestPermission) return true;
  if ((await handle.queryPermission(descriptor)) === 'granted') return true;
  return (await handle.requestPermission(descriptor)) === 'granted';
}

export async function writeTextToHandle(handle: FileSystemFileHandle, text: string): Promise<void> {
  const writable = await handle.createWritable();
  try {
    await writable.write(text);
  } finally {
    await writable.close();
  }
}

/** Fallback save: hands the file to the browser's download flow. */
export function downloadText(text: string, fileName: string): void {
  downloadBlob(new Blob([text], { type: NOTEN_MIME }), fileName);
}

// --- Persisting the current file handle across reloads -------------------
//
// FileSystemFileHandle objects are structured-cloneable, so the handle of the
// currently open file is kept in IndexedDB. After a reload the app knows which
// file it is working on and only has to re-request permission before writing.

const DB_NAME = 'schulnoten-files';
const STORE_NAME = 'handles';
const CURRENT_KEY = 'current';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function persistFileHandle(handle: FileSystemFileHandle | null): Promise<void> {
  try {
    const db = await openDatabase();
    const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME);
    if (handle) {
      await requestToPromise(store.put(handle, CURRENT_KEY));
    } else {
      await requestToPromise(store.delete(CURRENT_KEY));
    }
    db.close();
  } catch (error) {
    // Not fatal: the app keeps working, the user just has to pick the file again.
    console.warn('Dateiverweis konnte nicht gespeichert werden', error);
  }
}

export async function loadPersistedFileHandle(): Promise<FileSystemFileHandle | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const db = await openDatabase();
    const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
    const value = await requestToPromise(store.get(CURRENT_KEY));
    db.close();
    return value instanceof FileSystemFileHandle ? value : null;
  } catch {
    return null;
  }
}
