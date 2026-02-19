import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, SchoolClass, Student, Subject, Category, Exam, Grade } from '../types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

interface StoreActions {
  // Klassen
  addClass: (name: string) => void;
  updateClass: (id: string, name: string) => void;
  deleteClass: (id: string) => void;
  selectClass: (id: string | null) => void;

  // Schüler
  addStudent: (classId: string, firstName: string, lastName: string) => void;
  updateStudent: (classId: string, studentId: string, firstName: string, lastName: string) => void;
  deleteStudent: (classId: string, studentId: string) => void;

  // Fächer
  addSubject: (classId: string, name: string) => void;
  updateSubject: (classId: string, subjectId: string, name: string) => void;
  deleteSubject: (classId: string, subjectId: string) => void;
  selectSubject: (id: string | null) => void;

  // Kategorien
  addCategory: (classId: string, subjectId: string, name: string, weight: number) => void;
  updateCategory: (classId: string, subjectId: string, categoryId: string, name: string, weight: number) => void;
  deleteCategory: (classId: string, subjectId: string, categoryId: string) => void;

  // Klausuren
  addExam: (classId: string, subjectId: string, name: string, categoryId: string, weight: number, date?: string) => void;
  updateExam: (classId: string, subjectId: string, examId: string, name: string, weight: number, date?: string) => void;
  deleteExam: (classId: string, subjectId: string, examId: string) => void;

  // Noten
  setGrade: (classId: string, subjectId: string, studentId: string, examId: string, value: number | null) => void;

  // Spalten-Import
  replaceStudents: (classId: string, students: { firstName: string; lastName: string }[]) => void;
  importExamGrades: (classId: string, subjectId: string, examId: string, grades: { studentId: string; value: number | null }[]) => void;

  // Import/Export
  importData: (data: { classes: SchoolClass[] }) => void;
  exportData: () => { classes: SchoolClass[] };
}

type Store = AppState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      classes: [],
      selectedClassId: null,
      selectedSubjectId: null,

      // Klassen
      addClass: (name) => {
        const newClass: SchoolClass = {
          id: generateId(),
          name,
          students: [],
          subjects: [],
        };
        set((state) => ({
          classes: [...state.classes, newClass],
          selectedClassId: newClass.id,
        }));
      },

      updateClass: (id, name) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === id ? { ...c, name } : c
          ),
        }));
      },

      deleteClass: (id) => {
        set((state) => ({
          classes: state.classes.filter((c) => c.id !== id),
          selectedClassId: state.selectedClassId === id ? null : state.selectedClassId,
          selectedSubjectId: state.selectedClassId === id ? null : state.selectedSubjectId,
        }));
      },

      selectClass: (id) => {
        set({ selectedClassId: id, selectedSubjectId: null });
      },

      // Schüler
      addStudent: (classId, firstName, lastName) => {
        const newStudent: Student = {
          id: generateId(),
          firstName,
          lastName,
        };
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? { ...c, students: [...c.students, newStudent] }
              : c
          ),
        }));
      },

      updateStudent: (classId, studentId, firstName, lastName) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  students: c.students.map((s) =>
                    s.id === studentId ? { ...s, firstName, lastName } : s
                  ),
                }
              : c
          ),
        }));
      },

      deleteStudent: (classId, studentId) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  students: c.students.filter((s) => s.id !== studentId),
                  subjects: c.subjects.map((subj) => ({
                    ...subj,
                    grades: subj.grades.filter((g) => g.studentId !== studentId),
                  })),
                }
              : c
          ),
        }));
      },

      // Fächer
      addSubject: (classId, name) => {
        const newSubject: Subject = {
          id: generateId(),
          name,
          categories: [],
          exams: [],
          grades: [],
        };
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? { ...c, subjects: [...c.subjects, newSubject] }
              : c
          ),
          selectedSubjectId: newSubject.id,
        }));
      },

      updateSubject: (classId, subjectId, name) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  subjects: c.subjects.map((s) =>
                    s.id === subjectId ? { ...s, name } : s
                  ),
                }
              : c
          ),
        }));
      },

      deleteSubject: (classId, subjectId) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? { ...c, subjects: c.subjects.filter((s) => s.id !== subjectId) }
              : c
          ),
          selectedSubjectId: state.selectedSubjectId === subjectId ? null : state.selectedSubjectId,
        }));
      },

      selectSubject: (id) => {
        set({ selectedSubjectId: id });
      },

      // Kategorien
      addCategory: (classId, subjectId, name, weight) => {
        const newCategory: Category = {
          id: generateId(),
          name,
          weight,
        };
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  subjects: c.subjects.map((s) =>
                    s.id === subjectId
                      ? { ...s, categories: [...s.categories, newCategory] }
                      : s
                  ),
                }
              : c
          ),
        }));
      },

      updateCategory: (classId, subjectId, categoryId, name, weight) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  subjects: c.subjects.map((s) =>
                    s.id === subjectId
                      ? {
                          ...s,
                          categories: s.categories.map((cat) =>
                            cat.id === categoryId ? { ...cat, name, weight } : cat
                          ),
                        }
                      : s
                  ),
                }
              : c
          ),
        }));
      },

      deleteCategory: (classId, subjectId, categoryId) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  subjects: c.subjects.map((s) =>
                    s.id === subjectId
                      ? {
                          ...s,
                          categories: s.categories.filter((cat) => cat.id !== categoryId),
                          exams: s.exams.filter((e) => e.categoryId !== categoryId),
                          grades: s.grades.filter(
                            (g) => !s.exams.find((e) => e.id === g.examId && e.categoryId === categoryId)
                          ),
                        }
                      : s
                  ),
                }
              : c
          ),
        }));
      },

      // Klausuren
      addExam: (classId, subjectId, name, categoryId, weight, date) => {
        const newExam: Exam = {
          id: generateId(),
          name,
          categoryId,
          weight,
          date,
        };
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  subjects: c.subjects.map((s) =>
                    s.id === subjectId
                      ? { ...s, exams: [...s.exams, newExam] }
                      : s
                  ),
                }
              : c
          ),
        }));
      },

      updateExam: (classId, subjectId, examId, name, weight, date) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  subjects: c.subjects.map((s) =>
                    s.id === subjectId
                      ? {
                          ...s,
                          exams: s.exams.map((e) =>
                            e.id === examId ? { ...e, name, weight, date } : e
                          ),
                        }
                      : s
                  ),
                }
              : c
          ),
        }));
      },

      deleteExam: (classId, subjectId, examId) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  subjects: c.subjects.map((s) =>
                    s.id === subjectId
                      ? {
                          ...s,
                          exams: s.exams.filter((e) => e.id !== examId),
                          grades: s.grades.filter((g) => g.examId !== examId),
                        }
                      : s
                  ),
                }
              : c
          ),
        }));
      },

      // Noten
      setGrade: (classId, subjectId, studentId, examId, value) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  subjects: c.subjects.map((s) => {
                    if (s.id !== subjectId) return s;
                    const existingGradeIndex = s.grades.findIndex(
                      (g) => g.studentId === studentId && g.examId === examId
                    );
                    let newGrades: Grade[];
                    if (existingGradeIndex >= 0) {
                      if (value === null) {
                        newGrades = s.grades.filter((_, i) => i !== existingGradeIndex);
                      } else {
                        newGrades = s.grades.map((g, i) =>
                          i === existingGradeIndex ? { ...g, value } : g
                        );
                      }
                    } else if (value !== null) {
                      newGrades = [...s.grades, { studentId, examId, value }];
                    } else {
                      newGrades = s.grades;
                    }
                    return { ...s, grades: newGrades };
                  }),
                }
              : c
          ),
        }));
      },

      // Spalten-Import
      replaceStudents: (classId, students) => {
        const newStudents: Student[] = students.map((s) => ({
          id: generateId(),
          firstName: s.firstName,
          lastName: s.lastName,
        }));
        const newStudentIds = new Set(newStudents.map((s) => s.id));
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  students: newStudents,
                  subjects: c.subjects.map((subj) => ({
                    ...subj,
                    grades: subj.grades.filter((g) => newStudentIds.has(g.studentId)),
                  })),
                }
              : c
          ),
        }));
      },

      importExamGrades: (classId, subjectId, examId, grades) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  subjects: c.subjects.map((s) => {
                    if (s.id !== subjectId) return s;
                    // Remove existing grades for this exam
                    const otherGrades = s.grades.filter((g) => g.examId !== examId);
                    // Add new grades (skip nulls)
                    const newGrades = grades
                      .filter((g) => g.value !== null)
                      .map((g) => ({ studentId: g.studentId, examId, value: g.value! }));
                    return { ...s, grades: [...otherGrades, ...newGrades] };
                  }),
                }
              : c
          ),
        }));
      },

      // Import/Export
      importData: (data) => {
        set({
          classes: data.classes,
          selectedClassId: data.classes.length > 0 ? data.classes[0].id : null,
          selectedSubjectId: null,
        });
      },

      exportData: () => {
        return { classes: get().classes };
      },
    }),
    {
      name: 'schulnoten-storage',
    }
  )
);

// Selektoren
export const useSelectedClass = () => {
  const classes = useStore((state) => state.classes);
  const selectedClassId = useStore((state) => state.selectedClassId);
  return classes.find((c) => c.id === selectedClassId) ?? null;
};

export const useSelectedSubject = () => {
  const selectedClass = useSelectedClass();
  const selectedSubjectId = useStore((state) => state.selectedSubjectId);
  return selectedClass?.subjects.find((s) => s.id === selectedSubjectId) ?? null;
};
