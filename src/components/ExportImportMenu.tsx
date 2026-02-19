import { useState, useRef } from 'react';
import { useStore, useSelectedClass, useSelectedSubject } from '../store/useStore';
import { exportToJson, importFromJson, exportSubjectToCsv } from '../utils/exportImport';

export function ExportImportMenu() {
  const selectedClass = useSelectedClass();
  const selectedSubject = useSelectedSubject();
  const exportData = useStore((state) => state.exportData);
  const importData = useStore((state) => state.importData);

  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    exportToJson(exportData());
    setIsOpen(false);
  };

  const handleExportCsv = () => {
    if (selectedClass && selectedSubject) {
      exportSubjectToCsv(selectedClass, selectedSubject);
    }
    setIsOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setIsOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromJson(file);
      if (confirm('Alle bestehenden Daten werden überschrieben. Fortfahren?')) {
        importData(data);
      }
    } catch (error) {
      alert('Fehler beim Importieren: ' + (error as Error).message);
    }

    // Reset input
    e.target.value = '';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Export / Import
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="py-1">
              <button
                onClick={handleExportJson}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="font-medium">JSON Export</div>
                <div className="text-xs text-gray-500">Alle Daten als Backup</div>
              </button>
              <button
                onClick={handleExportCsv}
                disabled={!selectedSubject}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium">CSV Export</div>
                <div className="text-xs text-gray-500">Aktuelles Fach für Excel</div>
              </button>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={handleImportClick}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="font-medium">JSON Import</div>
                <div className="text-xs text-gray-500">Backup wiederherstellen</div>
              </button>
            </div>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
