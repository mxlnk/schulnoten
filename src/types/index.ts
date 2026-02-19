export interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Category {
  id: string;
  name: string;
  weight: number; // 0-1, z.B. 0.5 = 50%
}

export interface Exam {
  id: string;
  name: string;
  categoryId: string;
  weight: number; // Gewicht innerhalb der Kategorie
  date?: string;
}

export interface Grade {
  examId: string;
  studentId: string;
  value: number | null; // 1-6 oder null
}

export interface Subject {
  id: string;
  name: string;
  categories: Category[];
  exams: Exam[];
  grades: Grade[];
}

export interface SchoolClass {
  id: string;
  name: string;
  students: Student[];
  subjects: Subject[];
}

export interface AppState {
  classes: SchoolClass[];
  selectedClassId: string | null;
  selectedSubjectId: string | null;
}
