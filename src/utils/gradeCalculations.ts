import type { Subject, Grade } from '../types';

export function getGrade(
  grades: Grade[],
  studentId: string,
  examId: string
): number | null {
  const grade = grades.find(
    (g) => g.studentId === studentId && g.examId === examId
  );
  return grade?.value ?? null;
}

export function calculateCategoryAverage(
  subject: Subject,
  studentId: string,
  categoryId: string
): number | null {
  const categoryExams = subject.exams.filter((e) => e.categoryId === categoryId);
  if (categoryExams.length === 0) return null;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const exam of categoryExams) {
    const grade = getGrade(subject.grades, studentId, exam.id);
    if (grade !== null) {
      weightedSum += grade * exam.weight;
      totalWeight += exam.weight;
    }
  }

  if (totalWeight === 0) return null;
  return weightedSum / totalWeight;
}

export function calculateFinalGrade(
  subject: Subject,
  studentId: string
): number | null {
  if (subject.categories.length === 0) return null;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const category of subject.categories) {
    const avg = calculateCategoryAverage(subject, studentId, category.id);
    if (avg !== null) {
      weightedSum += avg * category.weight;
      totalWeight += category.weight;
    }
  }

  if (totalWeight === 0) return null;
  return weightedSum / totalWeight;
}

export function formatGrade(value: number | null): string {
  if (value === null) return '-';
  return value.toFixed(2);
}

export function formatFinalGrade(value: number | null): string {
  if (value === null) return '-';

  const base = Math.floor(value);
  const decimal = value - base;

  // Grenzen bei Achteln: 1/8=0.125, 3/8=0.375, 5/8=0.625, 7/8=0.875
  if (decimal < 0.125) {
    return `${base}`;
  } else if (decimal < 0.375) {
    return `${base}-`;
  } else if (decimal < 0.625) {
    return `${base}-${base + 1}`;
  } else if (decimal < 0.875) {
    return `${base + 1}+`;
  } else {
    return `${base + 1}`;
  }
}

export function isValidGrade(value: string): boolean {
  if (value === '' || value === '-') return true;
  const num = parseFloat(value.replace(',', '.'));
  return !isNaN(num) && num >= 1 && num <= 6;
}

export function parseGrade(value: string): number | null {
  if (value === '' || value === '-') return null;
  const num = parseFloat(value.replace(',', '.'));
  if (isNaN(num) || num < 1 || num > 6) return null;
  return Math.round(num * 100) / 100; // Auf zwei Dezimalstellen runden
}
