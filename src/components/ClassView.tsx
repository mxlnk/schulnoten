import { useState } from 'react';
import { useStore, useSelectedClass, useSelectedSubject } from '../store/useStore';
import { GradeSheet } from './GradeSheet';
import { AddStudentModal } from './AddStudentModal';
import { AddCategoryModal } from './AddCategoryModal';
import { AddExamModal } from './AddExamModal';
import { ExportImportMenu } from './ExportImportMenu';

export function ClassView() {
  const selectedClass = useSelectedClass();
  const selectedSubject = useSelectedSubject();
  const selectedSubjectId = useStore((state) => state.selectedSubjectId);
  const addSubject = useStore((state) => state.addSubject);
  const deleteSubject = useStore((state) => state.deleteSubject);
  const selectSubject = useStore((state) => state.selectSubject);

  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);

  if (!selectedClass) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p>Wähle eine Klasse aus oder erstelle eine neue</p>
        </div>
      </div>
    );
  }

  const handleAddSubject = () => {
    if (newSubjectName.trim()) {
      addSubject(selectedClass.id, newSubjectName.trim());
      setNewSubjectName('');
      setIsAddingSubject(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Fach-Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-center px-4">
          <div className="flex overflow-x-auto">
            {selectedClass.subjects.map((subject) => (
              <div
                key={subject.id}
                className={`group relative flex items-center px-4 py-3 cursor-pointer border-b-2 -mb-px ${
                  selectedSubjectId === subject.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => selectSubject(subject.id)}
              >
                <span className="whitespace-nowrap">{subject.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Fach "${subject.name}" wirklich löschen?`)) {
                      deleteSubject(selectedClass.id, subject.id);
                    }
                  }}
                  className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {isAddingSubject ? (
            <div className="flex items-center ml-2">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubject();
                  if (e.key === 'Escape') {
                    setIsAddingSubject(false);
                    setNewSubjectName('');
                  }
                }}
                onBlur={() => {
                  if (!newSubjectName.trim()) setIsAddingSubject(false);
                }}
                placeholder="Fachname..."
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setIsAddingSubject(true)}
              className="flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Fach
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {selectedSubject && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
          <button
            onClick={() => setShowStudentModal(true)}
            className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Schüler
          </button>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Kategorie
          </button>
          <button
            onClick={() => setShowExamModal(true)}
            disabled={selectedSubject.categories.length === 0}
            className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Klausur
          </button>
          <div className="flex-1" />
          <ExportImportMenu />
        </div>
      )}

      {/* Hauptinhalt */}
      <div className="flex-1 overflow-auto">
        {selectedSubject ? (
          <GradeSheet />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p>Wähle ein Fach aus oder erstelle ein neues</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showStudentModal && (
        <AddStudentModal onClose={() => setShowStudentModal(false)} />
      )}
      {showCategoryModal && (
        <AddCategoryModal onClose={() => setShowCategoryModal(false)} />
      )}
      {showExamModal && (
        <AddExamModal onClose={() => setShowExamModal(false)} />
      )}
    </div>
  );
}
