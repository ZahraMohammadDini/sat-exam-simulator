// ─────────────────────────────────────────────────────────────────
// Scoring + adaptive routing — pure functions, fully testable
// ─────────────────────────────────────────────────────────────────

const EPSILON = 1e-9;

// ── Grid-in normalization ────────────────────────────────────────

function normalizeGridIn(raw: string): number | null {
  const s = raw.trim().replace(/[$,\s%]/g, '');
  if (s.length === 0) return null;

  // Fraction form: a/b
  const fracMatch = /^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(s);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    if (den === 0 || Number.isNaN(num) || Number.isNaN(den)) return null;
    return num / den;
  }

  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

export function compareGridIn(student: string | null, correct: string): boolean {
  if (student == null) return false;
  const a = normalizeGridIn(student);
  const b = normalizeGridIn(correct);
  if (a === null || b === null) return false;
  return Math.abs(a - b) < EPSILON;
}

// ── Per-question grading ─────────────────────────────────────────

export interface GradableQuestion {
  id: string;
  type: 'multiple_choice' | 'grid_in';
  correctAnswer: string;
}

export function isAnswerCorrect(
  question: GradableQuestion,
  studentAnswer: string | null
): boolean {
  if (studentAnswer == null || studentAnswer === '') return false;
  if (question.type === 'grid_in') {
    return compareGridIn(studentAnswer, question.correctAnswer);
  }
  return studentAnswer.trim().toUpperCase() === question.correctAnswer.trim().toUpperCase();
}

// ── Module grading ───────────────────────────────────────────────

export interface GradeResult {
  correct: number;
  total: number;
  perQuestion: Record<string, boolean>;
}

export function gradeModule(
  answers: Record<string, string | null>,
  questions: GradableQuestion[]
): GradeResult {
  const perQuestion: Record<string, boolean> = {};
  let correct = 0;

  for (const q of questions) {
    const studentAnswer = answers[q.id] ?? null;
    const isCorrect = isAnswerCorrect(q, studentAnswer);
    perQuestion[q.id] = isCorrect;
    if (isCorrect) correct++;
  }

  return { correct, total: questions.length, perQuestion };
}

// ── Adaptive routing ─────────────────────────────────────────────

export type RoutedDifficulty = 'easy' | 'hard' | 'standard';

export function routeToModule2(
  correct: number,
  total: number,
  threshold: number | null
): RoutedDifficulty {
  if (threshold == null || total === 0) return 'standard';
  return correct >= threshold ? 'hard' : 'easy';
}

// ── Default thresholds (used at test creation) ───────────────────

export const DEFAULT_THRESHOLDS: Record<string, number> = {
  // Math Module 1: 22 questions, 16 correct → hard Module 2
  math: 16,
  // Reading & Writing Module 1: 27 questions, 19 correct → hard Module 2
  reading_writing: 19,
};