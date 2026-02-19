import { useState } from 'react';
import { useStore, useSelectedClass, useSelectedSubject } from '../store/useStore';
import { GradeCell } from './GradeCell';
import { AddCategoryModal } from './AddCategoryModal';
import { AddExamModal } from './AddExamModal';
import { ColumnImportModal } from './ColumnImportModal';
import {
  getGrade,
  calculateCategoryAverage,
  calculateFinalGrade,
  formatFinalGrade,
} from '../utils/gradeCalculations';
import type { Category, Exam } from '../types';

export function GradeSheet() {
  const selectedClass = useSelectedClass();
  const selectedSubject = useSelectedSubject();
  const setGrade = useStore((state) => state.setGrade);
  const deleteStudent = useStore((state) => state.deleteStudent);
  const deleteCategory = useStore((state) => state.deleteCategory);
  const deleteExam = useStore((state) => state.deleteExam);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [importColumn, setImportColumn] = useState<{ type: 'students' } | { type: 'grades'; examId: string } | null>(null);

  if (!selectedClass || !selectedSubject) return null;

  const { students } = selectedClass;
  const { categories, exams, grades } = selectedSubject;

  // Berechne Spaltenbreiten
  const getExamsForCategory = (categoryId: string) =>
    exams.filter((e) => e.categoryId === categoryId);

  const totalExamColumns = categories.reduce(
    (sum, cat) => sum + getExamsForCategory(cat.id).length + 1, // +1 für Durchschnitt
    0
  );

  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
  const getCategoryPercent = (weight: number) =>
    totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0;

  const getExamPercent = (categoryId: string, examWeight: number) => {
    const categoryExams = getExamsForCategory(categoryId);
    const totalExamWeight = categoryExams.reduce((sum, e) => sum + e.weight, 0);
    return totalExamWeight > 0 ? Math.round((examWeight / totalExamWeight) * 100) : 0;
  };

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p>Erstelle zunächst eine Kategorie</p>
          <p className="text-sm text-gray-400 mt-1">z.B. "Klausuren", "Tests", "Mündlich"</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {editingCategory && (
        <AddCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}
      {editingExam && (
        <AddExamModal
          exam={editingExam}
          onClose={() => setEditingExam(null)}
        />
      )}
      {importColumn && (
        <ColumnImportModal
          columnType={importColumn.type === 'students' ? 'students' : 'grades'}
          examId={importColumn.type === 'grades' ? importColumn.examId : undefined}
          onClose={() => setImportColumn(null)}
        />
      )}
      <div className="overflow-auto h-full">
        <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-white z-10">
          {/* Kategorie-Header */}
          <tr className="border-b border-gray-300">
            <th className="sticky left-0 bg-gray-100 border-r border-gray-300 p-2 text-left font-medium min-w-[180px] group">
              <div className="flex items-center justify-between">
                <span>Schüler</span>
                <button
                  onClick={() => setImportColumn({ type: 'students' })}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500"
                  title="Schüler importieren"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
              </div>
            </th>
            {categories.map((category) => {
              const categoryExams = getExamsForCategory(category.id);
              const colSpan = categoryExams.length + 1; // +1 für Durchschnitt
              return (
                <th
                  key={category.id}
                  colSpan={colSpan}
                  className="bg-gray-100 border-r border-gray-300 p-2 text-center font-medium group"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>
                      {category.name}{' '}
                      <span className="text-gray-500 font-normal">
                        ×{category.weight} ({getCategoryPercent(category.weight)}%)
                      </span>
                    </span>
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500"
                      title="Bearbeiten"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Kategorie "${category.name}" wirklich löschen?`)) {
                          deleteCategory(selectedClass.id, selectedSubject.id, category.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                      title="Löschen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </th>
              );
            })}
            <th className="bg-gray-200 p-2 text-center font-semibold min-w-[80px]">
              Gesamt
            </th>
          </tr>

          {/* Klausur-Header */}
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="sticky left-0 bg-gray-50 border-r border-gray-300 p-2"></th>
            {categories.map((category) => {
              const categoryExams = getExamsForCategory(category.id);
              return (
                <>
                  {categoryExams.map((exam) => (
                    <th
                      key={exam.id}
                      className="p-2 text-center font-normal text-gray-600 min-w-[80px] border-r border-gray-100 group"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="truncate" title={exam.name}>
                          {exam.name}
                        </span>
                        <button
                          onClick={() => setImportColumn({ type: 'grades', examId: exam.id })}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 flex-shrink-0"
                          title="Noten importieren"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingExam(exam)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 flex-shrink-0"
                          title="Bearbeiten"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`"${exam.name}" wirklich löschen?`)) {
                              deleteExam(selectedClass.id, selectedSubject.id, exam.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 flex-shrink-0"
                          title="Löschen"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">×{exam.weight} ({getExamPercent(category.id, exam.weight)}%)</span>
                    </th>
                  ))}
                  <th
                    key={`avg-${category.id}`}
                    className="p-2 text-center font-normal text-gray-500 bg-gray-100 border-r border-gray-300 min-w-[70px]"
                  >
                    Ø
                  </th>
                </>
              );
            })}
            <th className="bg-gray-200 p-2"></th>
          </tr>
        </thead>

        <tbody>
          {students.length === 0 ? (
            <tr>
              <td
                colSpan={totalExamColumns + 2}
                className="p-8 text-center text-gray-500"
              >
                Noch keine Schüler vorhanden. Füge Schüler über die Toolbar hinzu.
              </td>
            </tr>
          ) : (
            students.map((student, idx) => (
              <tr
                key={student.id}
                className={`border-b border-gray-100 hover:bg-blue-50/30 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td className="sticky left-0 bg-inherit border-r border-gray-200 p-2 font-medium group">
                  <div className="flex items-center justify-between">
                    <span>
                      {student.lastName}, {student.firstName}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`"${student.lastName}, ${student.firstName}" wirklich löschen?`)) {
                          deleteStudent(selectedClass.id, student.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </td>
                {categories.map((category) => {
                  const categoryExams = getExamsForCategory(category.id);
                  const categoryAvg = calculateCategoryAverage(
                    selectedSubject,
                    student.id,
                    category.id
                  );
                  return (
                    <>
                      {categoryExams.map((exam) => (
                        <td
                          key={exam.id}
                          className="p-0 border-r border-gray-100 min-w-[80px]"
                        >
                          <GradeCell
                            value={getGrade(grades, student.id, exam.id)}
                            onChange={(value) =>
                              setGrade(
                                selectedClass.id,
                                selectedSubject.id,
                                student.id,
                                exam.id,
                                value
                              )
                            }
                          />
                        </td>
                      ))}
                      <td
                        key={`avg-${category.id}`}
                        className="p-0 border-r border-gray-300 bg-gray-50 min-w-[70px]"
                      >
                        <GradeCell value={categoryAvg} onChange={() => {}} readOnly isAverage />
                      </td>
                    </>
                  );
                })}
                <td className="p-0 bg-gray-100 min-w-[80px]">
                  <GradeCell
                    value={calculateFinalGrade(selectedSubject, student.id)}
                    onChange={() => {}}
                    readOnly
                    isAverage
                    formatter={formatFinalGrade}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
    </>
  );
}
