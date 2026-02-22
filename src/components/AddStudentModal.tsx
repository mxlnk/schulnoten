import { useState } from 'react';
import { useStore, useSelectedClass } from '../store/useStore';
import { Modal } from './Modal';

interface AddStudentModalProps {
  onClose: () => void;
}

function parseLine(line: string): { firstName: string; lastName: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Format: "Nachname, Vorname"
  const commaIndex = trimmed.indexOf(',');
  if (commaIndex !== -1) {
    const lastName = trimmed.substring(0, commaIndex).trim();
    const firstName = trimmed.substring(commaIndex + 1).trim();
    if (lastName && firstName) return { firstName, lastName };
    if (lastName) return { firstName: '', lastName };
  }

  // Format: "Vorname Nachname" (letztes Wort = Nachname)
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');
    return { firstName, lastName };
  }

  // Nur ein Wort → Nachname
  return { firstName: '', lastName: trimmed };
}

export function AddStudentModal({ onClose }: AddStudentModalProps) {
  const selectedClass = useSelectedClass();
  const addStudent = useStore((state) => state.addStudent);
  const addStudentsBulk = useStore((state) => state.addStudentsBulk);

  const [mode, setMode] = useState<'single' | 'list'>('single');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [listText, setListText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!selectedClass) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim()) {
      addStudent(selectedClass.id, firstName.trim(), lastName.trim());
      setFirstName('');
      setLastName('');
    }
  };

  const handleSubmitAndClose = () => {
    if (firstName.trim() && lastName.trim()) {
      addStudent(selectedClass.id, firstName.trim(), lastName.trim());
    }
    onClose();
  };

  const handleListImport = () => {
    setError(null);
    const lines = listText.split('\n').filter((l) => l.trim() !== '');
    if (lines.length === 0) {
      setError('Keine Namen eingegeben.');
      return;
    }

    const students: { firstName: string; lastName: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const parsed = parseLine(lines[i]);
      if (!parsed) continue;
      students.push(parsed);
    }

    if (students.length === 0) {
      setError('Keine gültigen Namen gefunden.');
      return;
    }

    addStudentsBulk(selectedClass.id, students);
    onClose();
  };

  const previewStudents = listText
    .split('\n')
    .map((l) => parseLine(l))
    .filter((s) => s !== null);

  return (
    <Modal title="Schüler hinzufügen" onClose={onClose}>
      {/* Tab-Umschalter */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            mode === 'single'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Einzeln
        </button>
        <button
          type="button"
          onClick={() => setMode('list')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            mode === 'list'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Liste importieren
        </button>
      </div>

      {mode === 'single' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vorname
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nachname
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!firstName.trim() || !lastName.trim()}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Hinzufügen & Weiter
            </button>
            <button
              type="button"
              onClick={handleSubmitAndClose}
              disabled={!firstName.trim() || !lastName.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Hinzufügen & Schließen
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Ein Name pro Zeile. Unterstützte Formate:
          </p>
          <ul className="text-sm text-gray-500 list-disc list-inside space-y-0.5">
            <li><span className="font-mono text-gray-700">Nachname, Vorname</span></li>
            <li><span className="font-mono text-gray-700">Vorname Nachname</span></li>
          </ul>

          <textarea
            className="w-full h-48 border border-gray-300 rounded-md p-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={'Müller, Max\nAnna Schmidt\nTim Fischer\n...'}
            value={listText}
            onChange={(e) => { setListText(e.target.value); setError(null); }}
            autoFocus
          />

          {previewStudents.length > 0 && (
            <div className="text-sm text-gray-500">
              {previewStudents.length} {previewStudents.length === 1 ? 'Schüler' : 'Schüler'} erkannt
            </div>
          )}

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
              onClick={handleListImport}
              disabled={previewStudents.length === 0}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {previewStudents.length} Schüler hinzufügen
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
