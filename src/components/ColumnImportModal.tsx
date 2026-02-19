import { useState } from 'react';
import { Modal } from './Modal';
import { useStore, useSelectedClass, useSelectedSubject } from '../store/useStore';
import { parseGrade } from '../utils/gradeCalculations';

interface ColumnImportModalProps {
  columnType: 'students' | 'grades';
  examId?: string;
  onClose: () => void;
}

export function ColumnImportModal({ columnType, examId, onClose }: ColumnImportModalProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const selectedClass = useSelectedClass();
  const selectedSubject = useSelectedSubject();
  const replaceStudents = useStore((state) => state.replaceStudents);
  const importExamGrades = useStore((state) => state.importExamGrades);

  if (!selectedClass || !selectedSubject) return null;

  const hasExistingData =
    columnType === 'students'
      ? selectedClass.students.length > 0
      : selectedSubject.grades.some((g) => g.examId === examId);

  const handleImport = () => {
    setError(null);
    const lines = text.split('\n').filter((line) => line.trim() !== '');

    if (lines.length === 0) {
      setError('Keine Daten eingegeben.');
      return;
    }

    if (columnType === 'students') {
      const students: { firstName: string; lastName: string }[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const commaIndex = line.indexOf(',');
        if (commaIndex === -1) {
          setError(`Zeile ${i + 1}: Erwartet "Nachname, Vorname" — kein Komma gefunden.`);
          return;
        }
        const lastName = line.substring(0, commaIndex).trim();
        const firstName = line.substring(commaIndex + 1).trim();
        if (!lastName || !firstName) {
          setError(`Zeile ${i + 1}: Nachname oder Vorname fehlt.`);
          return;
        }
        students.push({ firstName, lastName });
      }
      replaceStudents(selectedClass.id, students);
      onClose();
    } else {
      if (!examId) return;
      const { students } = selectedClass;

      if (lines.length > students.length) {
        setError(`Zu viele Zeilen: ${lines.length} Noten, aber nur ${students.length} Schüler.`);
        return;
      }

      const grades: { studentId: string; value: number | null }[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const value = parseGrade(line);
        if (value === null && line !== '' && line !== '-') {
          setError(`Zeile ${i + 1}: "${line}" ist keine gültige Note (1–6).`);
          return;
        }
        grades.push({ studentId: students[i].id, value });
      }
      importExamGrades(selectedClass.id, selectedSubject.id, examId, grades);
      onClose();
    }
  };

  const title = columnType === 'students' ? 'Schüler importieren' : 'Noten importieren';
  const placeholder =
    columnType === 'students'
      ? 'Müller, Max\nSchmidt, Anna\nFischer, Tim\n...'
      : '2,3\n1,7\n3\n4,5\n...';
  const description =
    columnType === 'students'
      ? 'Eine Zeile pro Schüler im Format "Nachname, Vorname".'
      : `Eine Note pro Zeile (1–6), zugeordnet nach Reihenfolge der Schüler (${selectedClass.students.length} vorhanden).`;

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        {hasExistingData && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
            Vorhandene Daten werden überschrieben.
          </div>
        )}

        <p className="text-sm text-gray-600">{description}</p>

        <textarea
          className="w-full h-48 border border-gray-300 rounded-md p-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Abbrechen
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            Importieren
          </button>
        </div>
      </div>
    </Modal>
  );
}
