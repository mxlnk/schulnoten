import { useSelectedClass, useSelectedSubject } from '../store/useStore';
import { exportSubjectToCsv } from '../utils/csvExport';

/** Exports the currently selected subject as a CSV file for Excel. */
export function CsvExportButton() {
  const selectedClass = useSelectedClass();
  const selectedSubject = useSelectedSubject();

  if (!selectedClass || !selectedSubject) return null;

  return (
    <button
      onClick={() => exportSubjectToCsv(selectedClass, selectedSubject)}
      title="Aktuelles Fach als CSV für Excel exportieren"
      className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
    >
      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      CSV Export
    </button>
  );
}
