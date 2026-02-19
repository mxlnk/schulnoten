import { useState } from 'react';
import { useStore, useSelectedClass } from '../store/useStore';
import { Modal } from './Modal';

interface AddStudentModalProps {
  onClose: () => void;
}

export function AddStudentModal({ onClose }: AddStudentModalProps) {
  const selectedClass = useSelectedClass();
  const addStudent = useStore((state) => state.addStudent);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  if (!selectedClass) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim()) {
      addStudent(selectedClass.id, firstName.trim(), lastName.trim());
      setFirstName('');
      setLastName('');
      // Modal offen lassen für weitere Eingaben
    }
  };

  const handleSubmitAndClose = () => {
    if (firstName.trim() && lastName.trim()) {
      addStudent(selectedClass.id, firstName.trim(), lastName.trim());
    }
    onClose();
  };

  return (
    <Modal title="Schüler hinzufügen" onClose={onClose}>
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
    </Modal>
  );
}
