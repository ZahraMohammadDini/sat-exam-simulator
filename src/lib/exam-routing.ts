/** Subject-aware SAT multi-stage routing. Pure functions, no database access. */
import { routeToModule2, DEFAULT_THRESHOLDS } from './scoring';

export interface RouteModule {
  id: string;
  subject: string;
  moduleNumber: number;
  difficulty: string;
  order: number;
  adaptiveThreshold?: number | null;
}

export interface NextRoute {
  nextModuleId: string | null;
  routedTo: 'easy' | 'hard' | 'standard';
}

/** Only the selected second module is taken; the other branch is never visited. */
export function resolveNextModule(
  modules: RouteModule[], currentId: string, correct: number,
  total: number, adaptiveEnabled: boolean
): NextRoute {
  const sorted = [...modules].sort((a, b) => a.order - b.order);
  const current = sorted.find((m) => m.id === currentId);
  if (!current) throw new Error('Current module does not belong to the test');

  if (current.moduleNumber === 1) {
    const candidates = sorted.filter((m) => m.subject === current.subject && m.moduleNumber === 2);
    if (candidates.length) {
      if (adaptiveEnabled) {
        const base = DEFAULT_THRESHOLDS[current.subject] ?? 0;
        const canonical = current.subject === 'math' ? 22 : 27;
        const threshold = current.adaptiveThreshold ?? Math.max(1, Math.ceil(base * total / canonical));
        const routedTo = routeToModule2(correct, total, threshold);
        const target = candidates.find((m) => m.difficulty === routedTo);
        if (!target) throw new Error(`Missing ${current.subject} module 2 (${routedTo}) branch`);
        return { nextModuleId: target.id, routedTo };
      }
      const target = candidates.find((m) => m.difficulty === 'standard') ?? candidates[0];
      return { nextModuleId: target.id, routedTo: 'standard' };
    }
  }

  // After module 2, continue to the next *subject's module 1*, not another difficulty branch.
  const next = sorted.find((m) => m.order > current.order && m.moduleNumber === 1);
  return { nextModuleId: next?.id ?? null, routedTo: 'standard' };
}

/** Import/publishing validation: every adaptive subject needs both routes. */
export function validateAdaptiveModules(modules: RouteModule[], adaptiveEnabled: boolean): string[] {
  if (!adaptiveEnabled) return [];
  const issues: string[] = [];
  const subjects = [...new Set(modules.map((m) => m.subject))];
  for (const subject of subjects) {
    const first = modules.filter((m) => m.subject === subject && m.moduleNumber === 1);
    if (first.length !== 1) issues.push(`${subject}: exactly one module 1 is required`);
    if (first.some(m => m.difficulty !== 'standard')) issues.push(`${subject}: module 1 difficulty must be standard`);
    for (const difficulty of ['easy', 'hard']) {
      if (modules.filter((m) => m.subject === subject && m.moduleNumber === 2 && m.difficulty === difficulty).length !== 1) {
        issues.push(`${subject}: exactly one ${difficulty} module 2 is required`);
      }
    }
    const seconds = modules.filter(m => m.subject === subject && m.moduleNumber === 2);
    if (first[0] && seconds.some(m => m.order <= first[0].order)) issues.push(`${subject}: module 2 must follow module 1 in order`);
    if (first[0]?.adaptiveThreshold != null && first[0].adaptiveThreshold! < 0) {
      issues.push(`${subject}: invalid adaptive threshold`);
    }
  }
  const rw = modules.filter(m => m.subject === 'reading_writing');
  const math = modules.filter(m => m.subject === 'math');
  if (rw.length && math.length && Math.max(...rw.map(m => m.order)) >= Math.min(...math.map(m => m.order))) {
    issues.push('Reading and Writing must precede Math in a full adaptive SAT');
  }
  if (modules.some((m) => m.moduleNumber === 2 && !['easy', 'hard'].includes(m.difficulty))) {
    issues.push('Adaptive module 2 difficulty must be easy or hard');
  }
  if (new Set(modules.map((m) => m.order)).size !== modules.length) issues.push('Module orders must be unique');
  return issues;
}
