import { useState } from 'react';
import { useStore, useSelectedClass, useSelectedSubject } from '../store/useStore';
import { Modal } from './Modal';
import type { Category } from '../types';

interface AddCategoryModalProps {
  onClose: () => void;
  category?: Category;
}

export function AddCategoryModal({ onClose, category }: AddCategoryModalProps) {
  const selectedClass = useSelectedClass();
  const selectedSubject = useSelectedSubject();
  const addCategory = useStore((state) => state.addCategory);
  const updateCategory = useStore((state) => state.updateCategory);

  const [name, setName] = useState(category?.name ?? '');
  const [weight, setWeight] = useState(category?.weight.toString() ?? '1');

  const isEditing = !!category;

  if (!selectedClass || !selectedSubject) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(weight);
    if (name.trim() && !isNaN(weightNum) && weightNum > 0) {
      if (isEditing) {
        updateCategory(selectedClass.id, selectedSubject.id, category.id, name.trim(), weightNum);
      } else {
        addCategory(selectedClass.id, selectedSubject.id, name.trim(), weightNum);
      }
      onClose();
    }
  };

  return (
    <Modal title={isEditing ? 'Kategorie bearbeiten' : 'Kategorie hinzufügen'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Klausuren, Tests, Mündlich"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gewichtung
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="z.B. 1, 2, 3"
            min="0.01"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Prozente werden automatisch berechnet
          </p>
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
            disabled={!name.trim() || !weight || parseFloat(weight) <= 0}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isEditing ? 'Speichern' : 'Hinzufügen'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
