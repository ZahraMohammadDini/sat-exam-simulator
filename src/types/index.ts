// ─────────────────────────────────────────────────────────────────
// Shared types — used by both server and client
// ─────────────────────────────────────────────────────────────────

export type Subject = 'reading_writing' | 'math';
export type QuestionType = 'multiple_choice' | 'grid_in';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ModuleDifficulty = 'standard' | 'easy' | 'hard';
export type ChoiceMode = 'text' | 'image';
export type SessionStatus = 'active' | 'completed';

// ── Question types ───────────────────────────────────────────────

export interface TextChoice {
  id: 'A' | 'B' | 'C' | 'D';
  mode: 'text';
  text: string;
}

export interface ImageChoice {
  id: 'A' | 'B' | 'C' | 'D';
  mode: 'image';
  imageUrl: string;
}

export type Choice = TextChoice | ImageChoice;

// Full question — admin view, includes correctAnswer + explanation
export interface AdminQuestion {
  id: string;
  subject: Subject;
  type: QuestionType;
  difficulty: Difficulty;
  domain: string | null;
  tags: string[];

  passage: string | null;
  passageImage: string | null;
  passageIsImage: boolean;

  stem: string | null;
  stemImage: string | null;
  stemIsImage: boolean;

  choices: Choice[] | null;
  correctAnswer: string;

  explanation: string | null;
  explanationImage: string | null;
  explanationIsImage: boolean;

  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// Public question — student view, correctAnswer stripped
export interface PublicQuestion {
  id: string;
  subject: Subject;
  type: QuestionType;
  difficulty: Difficulty;
  domain: string | null;

  passage: string | null;
  passageImage: string | null;
  passageIsImage: boolean;

  stem: string | null;
  stemImage: string | null;
  stemIsImage: boolean;

  choices: Choice[] | null;

  explanation: string | null;
  explanationImage: string | null;
  explanationIsImage: boolean;
}

// ── Test structure types ─────────────────────────────────────────

export interface TestSummary {
  id: string;
  title: string;
  description: string | null;
  moduleCount: number;
}

export interface ModuleStructure {
  id: string;
  subject: Subject;
  moduleNumber: number;
  difficulty: ModuleDifficulty;
  timeLimitSeconds: number;
  breakAfterSeconds?: number | null;
  order: number;
  questions: PublicQuestion[];
}

export interface TestStructure {
  id: string;
  title: string;
  description: string | null;
  allowReview: boolean;
  showExplanations: boolean;
  adaptiveEnabled: boolean;
  modules: ModuleStructure[];
}

// ── Session types ────────────────────────────────────────────────

export interface SessionAnswerMap {
  [questionId: string]: string | null;
}

export interface SessionModuleState {
  answers: SessionAnswerMap;
  flagged: string[];
}

export interface SessionModuleAnswers {
  [moduleId: string]: SessionModuleState;
}

export interface SessionTimeRemaining {
  [moduleId: string]: number;
}

export interface RoutingEntry {
  moduleId: string;
  correct: number;
  total: number;
  routedTo: ModuleDifficulty;
}

export interface SessionState {
  id: string;
  testId: string;
  currentModuleIndex: number;
  answers: SessionModuleAnswers;
  timeRemaining: SessionTimeRemaining;
  routing: RoutingEntry[];
  status: SessionStatus;
  isPreview: boolean;
}

// ── Results types ────────────────────────────────────────────────

export interface QuestionResult {
  questionId: string;
  question: PublicQuestion;
  studentAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string | null;
  explanationImage: string | null;
  explanationIsImage: boolean;
}

export interface ModuleResult {
  moduleId: string;
  subject: Subject;
  moduleNumber: number;
  difficulty: ModuleDifficulty;
  correct: number;
  total: number;
  questions: QuestionResult[];
}

export interface Results {
  testTitle: string;
  completedAt: string;
  totalCorrect: number;
  totalQuestions: number;
  modules: ModuleResult[];
}

// ── Admin auth types ─────────────────────────────────────────────

export interface AdminSessionData {
  adminId?: string;
  username?: string;
}

// ── API response helpers ─────────────────────────────────────────

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string };

export type ApiResponse<T> = ApiOk<T> | ApiErr;