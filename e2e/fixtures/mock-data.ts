/** Mock data for E2E tests — deterministic IDs and pre-calculated expected values. */

export const IDS = {
  class: 'class-10a',
  subject: 'subject-math',
  students: {
    alice: 'student-alice',
    bob: 'student-bob',
    clara: 'student-clara',
  },
  categories: {
    klausuren: 'cat-klausuren',
    muendlich: 'cat-muendlich',
  },
  exams: {
    k1: 'exam-k1',
    k2: 'exam-k2',
    m1: 'exam-m1',
    m2: 'exam-m2',
  },
} as const;

/**
 * Full localStorage payload for zustand persist.
 * Key: "schulnoten-storage"
 */
export const MOCK_STORAGE = {
  state: {
    classes: [
      {
        id: IDS.class,
        name: '10a',
        students: [
          { id: IDS.students.alice, firstName: 'Alice', lastName: 'Müller' },
          { id: IDS.students.bob, firstName: 'Bob', lastName: 'Schmidt' },
          { id: IDS.students.clara, firstName: 'Clara', lastName: 'Fischer' },
        ],
        subjects: [
          {
            id: IDS.subject,
            name: 'Mathematik',
            categories: [
              { id: IDS.categories.klausuren, name: 'Klausuren', weight: 2 },
              { id: IDS.categories.muendlich, name: 'Mündlich', weight: 1 },
            ],
            exams: [
              { id: IDS.exams.k1, name: 'Klausur 1', categoryId: IDS.categories.klausuren, weight: 2 },
              { id: IDS.exams.k2, name: 'Klausur 2', categoryId: IDS.categories.klausuren, weight: 1 },
              { id: IDS.exams.m1, name: 'Mitarbeit 1', categoryId: IDS.categories.muendlich, weight: 1 },
              { id: IDS.exams.m2, name: 'Mitarbeit 2', categoryId: IDS.categories.muendlich, weight: 1 },
            ],
            grades: [
              // Alice: all 4 grades
              { studentId: IDS.students.alice, examId: IDS.exams.k1, value: 2 },
              { studentId: IDS.students.alice, examId: IDS.exams.k2, value: 3 },
              { studentId: IDS.students.alice, examId: IDS.exams.m1, value: 1 },
              { studentId: IDS.students.alice, examId: IDS.exams.m2, value: 2 },
              // Bob: 3 grades (M2 missing)
              { studentId: IDS.students.bob, examId: IDS.exams.k1, value: 4 },
              { studentId: IDS.students.bob, examId: IDS.exams.k2, value: 3 },
              { studentId: IDS.students.bob, examId: IDS.exams.m1, value: 2 },
              // Clara: no grades
            ],
          },
        ],
      },
    ],
    selectedClassId: IDS.class,
    selectedSubjectId: IDS.subject,
  },
  version: 0,
};

/**
 * Pre-calculated expected values.
 *
 * Alice:
 *   Klausuren Ø = (2×2 + 3×1) / 3 = 7/3 ≈ 2.33
 *   Mündlich  Ø = (1×1 + 2×1) / 2 = 3/2 = 1.50
 *   Final     = (2.333×2 + 1.5×1) / 3 ≈ 2.06 → formatFinalGrade "2"
 *
 * Bob:
 *   Klausuren Ø = (4×2 + 3×1) / 3 = 11/3 ≈ 3.67
 *   Mündlich  Ø = 2/1 = 2.00
 *   Final     = (3.667×2 + 2.0×1) / 3 ≈ 3.11 → formatFinalGrade "3"
 *
 * Clara: all "-"
 */
export const EXPECTED = {
  alice: {
    klausurenAvg: '2.33',
    muendlichAvg: '1.50',
    final: '2',
  },
  bob: {
    klausurenAvg: '3.67',
    muendlichAvg: '2.00',
    final: '3',
  },
  clara: {
    klausurenAvg: '-',
    muendlichAvg: '-',
    final: '-',
  },
};
