import { useState } from 'react';
import { useStore } from '../store/useStore';

export function Sidebar({ onShowImpressum }: { onShowImpressum: () => void }) {
  const classes = useStore((state) => state.classes);
  const selectedClassId = useStore((state) => state.selectedClassId);
  const addClass = useStore((state) => state.addClass);
  const selectClass = useStore((state) => state.selectClass);
  const deleteClass = useStore((state) => state.deleteClass);

  const [isAdding, setIsAdding] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const handleAdd = () => {
    if (newClassName.trim()) {
      addClass(newClassName.trim());
      setNewClassName('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') {
      setIsAdding(false);
      setNewClassName('');
    }
  };

  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-800">Schulnoten</h1>
      </div>

      <div className="p-3">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Klassen
        </h2>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        {classes.map((schoolClass) => (
          <div
            key={schoolClass.id}
            className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer mb-1 ${
              selectedClassId === schoolClass.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => selectClass(schoolClass.id)}
          >
            <span className="truncate">{schoolClass.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Klasse "${schoolClass.name}" wirklich löschen?`)) {
                  deleteClass(schoolClass.id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {isAdding ? (
          <div className="px-1 py-1">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newClassName.trim()) {
                  setIsAdding(false);
                }
              }}
              placeholder="Klassenname..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Neue Klasse
          </button>
        )}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={onShowImpressum}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Impressum & Datenschutz
        </button>
      </div>
    </aside>
  );
}
