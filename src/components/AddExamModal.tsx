import { useState } from 'react';
import { useStore, useSelectedClass, useSelectedSubject } from '../store/useStore';
import { Modal } from './Modal';
import type { Exam } from '../types';

interface AddExamModalProps {
  onClose: () => void;
  exam?: Exam;
}

export function AddExamModal({ onClose, exam }: AddExamModalProps) {
  const selectedClass = useSelectedClass();
  const selectedSubject = useSelectedSubject();
  const addExam = useStore((state) => state.addExam);
  const updateExam = useStore((state) => state.updateExam);

  const [name, setName] = useState(exam?.name ?? '');
  const [categoryId, setCategoryId] = useState(exam?.categoryId ?? selectedSubject?.categories[0]?.id ?? '');
  const [weight, setWeight] = useState(exam?.weight.toString() ?? '1');
  const [date, setDate] = useState(exam?.date ?? '');

  const isEditing = !!exam;

  if (!selectedClass || !selectedSubject) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(weight);
    if (name.trim() && categoryId && !isNaN(weightNum) && weightNum > 0) {
      if (isEditing) {
        updateExam(
          selectedClass.id,
          selectedSubject.id,
          exam.id,
          name.trim(),
          weightNum,
          date || undefined
        );
      } else {
        addExam(
          selectedClass.id,
          selectedSubject.id,
          name.trim(),
          categoryId,
          weightNum,
          date || undefined
        );
      }
      onClose();
    }
  };

  return (
    <Modal title={isEditing ? 'Klausur bearbeiten' : 'Klausur / Prüfung hinzufügen'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Klausur 1, Test Kapitel 3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategorie
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {selectedSubject.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gewichtung
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            min="0.01"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Standard: 1. Höhere Werte = größerer Anteil am Kategoriedurchschnitt
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Datum (optional)
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
            disabled={!name.trim() || !categoryId}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isEditing ? 'Speichern' : 'Hinzufügen'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
