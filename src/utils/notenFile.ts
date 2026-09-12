import type { Category, Exam, Grade, SchoolClass, Student, Subject } from '../types';

export const NOTEN_EXTENSION = '.noten';
export const NOTEN_MIME = 'application/x-noten';
export const DEFAULT_FILE_NAME = `Schulnoten${NOTEN_EXTENSION}`;

const FORMAT = 'schulnoten';
const FORMAT_VERSION = 1;

export interface NotenFileData {
  classes: SchoolClass[];
}

/** Serializes all classes into the .noten file format (pretty-printed JSON). */
export function serializeNotenFile(classes: SchoolClass[]): string {
  const document = {
    format: FORMAT,
    version: FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    classes,
  };
  return JSON.stringify(document, null, 2);
}

/**
 * Parses a .noten file (or a legacy JSON backup, which has the same shape
 * minus the format header). Throws a German error message on invalid input.
 */
export function parseNotenFile(text: string): NotenFileData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Die Datei enthält kein gültiges JSON.');
  }
  if (!isRecord(raw) || !Array.isArray(raw.classes)) {
    throw new Error('Die Datei ist keine Schulnoten-Datei.');
  }
  if (typeof raw.version === 'number' && raw.version > FORMAT_VERSION) {
    throw new Error('Die Datei stammt aus einer neueren Version von Schulnoten.');
  }
  return { classes: raw.classes.map(normalizeClass) };
}

export function isNotenFileName(name: string): boolean {
  return name.toLowerCase().endsWith(NOTEN_EXTENSION);
}

export function ensureNotenExtension(name: string): string {
  return isNotenFileName(name) ? name : `${name}${NOTEN_EXTENSION}`;
}

function normalizeClass(value: unknown, index: number): SchoolClass {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
    throw new Error(`Klasse ${index + 1} in der Datei ist unvollständig.`);
  }
  const name = value.name;
  return {
    id: value.id,
    name,
    students: arrayOf<Student>(value.students),
    subjects: arrayOf<unknown>(value.subjects).map((subject, i) => normalizeSubject(subject, name, i)),
  };
}

function normalizeSubject(value: unknown, className: string, index: number): Subject {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
    throw new Error(`Fach ${index + 1} der Klasse „${className}“ ist unvollständig.`);
  }
  return {
    id: value.id,
    name: value.name,
    categories: arrayOf<Category>(value.categories),
    exams: arrayOf<Exam>(value.exams),
    grades: arrayOf<Grade>(value.grades),
  };
}

function arrayOf<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
