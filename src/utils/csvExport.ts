import Papa from 'papaparse';
import { downloadBlob } from './download';
import type { SchoolClass, Subject } from '../types';
import { calculateCategoryAverage, calculateFinalGrade, getGrade, formatGrade } from './gradeCalculations';

export function exportSubjectToCsv(schoolClass: SchoolClass, subject: Subject): void {
  const rows: string[][] = [];

  // Header-Zeile 1: Kategorien
  const header1: string[] = ['Schüler'];
  for (const category of subject.categories) {
    const categoryExams = subject.exams.filter((e) => e.categoryId === category.id);
    for (let i = 0; i < categoryExams.length; i++) {
      header1.push(`${category.name} (${Math.round(category.weight * 100)}%)`);
    }
    header1.push(`Ø ${category.name}`);
  }
  header1.push('Gesamtnote');

  // Header-Zeile 2: Klausurnamen
  const header2: string[] = [''];
  for (const category of subject.categories) {
    const categoryExams = subject.exams.filter((e) => e.categoryId === category.id);
    for (const exam of categoryExams) {
      header2.push(exam.name);
    }
    header2.push('');
  }
  header2.push('');

  rows.push(header1);
  rows.push(header2);

  // Schüler-Zeilen
  for (const student of schoolClass.students) {
    const row: string[] = [`${student.lastName}, ${student.firstName}`];

    for (const category of subject.categories) {
      const categoryExams = subject.exams.filter((e) => e.categoryId === category.id);
      for (const exam of categoryExams) {
        const grade = getGrade(subject.grades, student.id, exam.id);
        row.push(formatGrade(grade));
      }
      const categoryAvg = calculateCategoryAverage(subject, student.id, category.id);
      row.push(formatGrade(categoryAvg));
    }

    const finalGrade = calculateFinalGrade(subject, student.id);
    row.push(formatGrade(finalGrade));

    rows.push(row);
  }

  const csv = Papa.unparse(rows, { delimiter: ';' });
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }); // BOM für Excel
  downloadBlob(blob, `${schoolClass.name}-${subject.name}.csv`);
}

