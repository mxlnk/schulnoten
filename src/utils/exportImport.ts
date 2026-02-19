import Papa from 'papaparse';
import type { SchoolClass, Subject } from '../types';
import { calculateCategoryAverage, calculateFinalGrade, getGrade, formatGrade } from './gradeCalculations';

export function exportToJson(data: { classes: SchoolClass[] }): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, 'schulnoten-backup.json');
}

export function importFromJson(file: File): Promise<{ classes: SchoolClass[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.classes || !Array.isArray(data.classes)) {
          throw new Error('Ungültiges Dateiformat');
        }
        resolve(data);
      } catch (error) {
        reject(new Error('Fehler beim Lesen der Datei'));
      }
    };
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
    reader.readAsText(file);
  });
}

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

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
