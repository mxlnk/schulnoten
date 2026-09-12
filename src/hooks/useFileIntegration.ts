import { useEffect } from 'react';
import { useFileStore } from '../store/useFileStore';

/**
 * Wires the file store into the browser: Ctrl/Cmd+S saves, and files opened
 * through the OS (the PWA is registered as a .noten handler) are loaded via
 * the Launch Handler API.
 */
export function useFileIntegration() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isSave =
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === 's';
      if (!isSave) return;
      event.preventDefault();
      void useFileStore.getState().saveFile();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    window.launchQueue?.setConsumer((params) => {
      const handle = params.files.find(isFileHandle);
      if (handle) void useFileStore.getState().openFromHandle(handle);
    });
  }, []);
}

function isFileHandle(handle: FileSystemHandle): handle is FileSystemFileHandle {
  return handle.kind === 'file';
}
