import type { PublicQuestion, Choice } from '@/types';

// The shape Prisma returns for a Question row — correctAnswer included.
// We take this and produce a PublicQuestion safe to send to the client.
export interface QuestionRow {
  id: string;
  subject: string;
  type: string;
  difficulty: string;
  domain: string | null;
  passage: string | null;
  passageImage: string | null;
  passageIsImage: boolean;
  stem: string | null;
  stemImage: string | null;
  stemIsImage: boolean;
  choices: unknown;
  explanation: string | null;
  explanationImage: string | null;
  explanationIsImage: boolean;
}

export function serializePublicQuestion(q: QuestionRow): PublicQuestion {
  return {
    id: q.id,
    subject: q.subject as PublicQuestion['subject'],
    type: q.type as PublicQuestion['type'],
    difficulty: q.difficulty as PublicQuestion['difficulty'],
    domain: q.domain,
    passage: q.passage,
    passageImage: q.passageImage,
    passageIsImage: q.passageIsImage,
    stem: q.stem,
    stemImage: q.stemImage,
    stemIsImage: q.stemIsImage,
    choices: normalizeChoices(q.choices),
    // NOTE: explanation fields are NOT sent during the exam — only on results
    explanation: null,
    explanationImage: null,
    explanationIsImage: false,
  };
}

function normalizeChoices(raw: unknown): Choice[] | null {
  if (!Array.isArray(raw)) return null;
  return raw as Choice[];
}

// For internal API use — verifies the shape of answers JSON stored on session
export interface StoredModuleState {
  answers: Record<string, string | null>;
  flagged: string[];
}

export function readModuleState(
  answersJson: unknown,
  moduleId: string
): StoredModuleState {
  if (answersJson == null || typeof answersJson !== 'object') {
    return { answers: {}, flagged: [] };
  }
  const all = answersJson as Record<string, unknown>;
  const mod = all[moduleId];
  if (mod == null || typeof mod !== 'object') {
    return { answers: {}, flagged: [] };
  }
  const m = mod as Record<string, unknown>;
  const answers =
    m.answers != null && typeof m.answers === 'object'
      ? (m.answers as Record<string, string | null>)
      : {};
  const flagged = Array.isArray(m.flagged)
    ? (m.flagged as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];
  return { answers, flagged };
}

export function writeModuleState(
  answersJson: unknown,
  moduleId: string,
  state: StoredModuleState
): Record<string, unknown> {
  const all =
    answersJson != null && typeof answersJson === 'object'
      ? { ...(answersJson as Record<string, unknown>) }
      : {};
  all[moduleId] = state;
  return all;
}
// ── Prisma JSON field helpers ────────────────────────────────────
// Prisma's Json columns reject plain `null`. To store SQL NULL,
// use Prisma.DbNull; to store the JSON literal null, use Prisma.JsonNull.
import { Prisma } from '@prisma/client';

export function jsonOrDbNull(
  value: unknown
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value == null) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
}
