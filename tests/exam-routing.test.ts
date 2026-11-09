import { describe, expect, it } from 'vitest';
import { resolveNextModule, validateAdaptiveModules } from '@/lib/exam-routing';
const modules = [
  { id: 'rw1', subject: 'reading_writing', moduleNumber: 1, difficulty: 'standard', order: 0, adaptiveThreshold: 2 },
  { id: 'rwe', subject: 'reading_writing', moduleNumber: 2, difficulty: 'easy', order: 1 },
  { id: 'rwh', subject: 'reading_writing', moduleNumber: 2, difficulty: 'hard', order: 2 },
  { id: 'm1', subject: 'math', moduleNumber: 1, difficulty: 'standard', order: 3, adaptiveThreshold: 2 },
  { id: 'me', subject: 'math', moduleNumber: 2, difficulty: 'easy', order: 4 },
  { id: 'mh', subject: 'math', moduleNumber: 2, difficulty: 'hard', order: 5 },
];
describe('SAT multi-stage routing', () => {
  it('goes hard on threshold and easy below threshold in each subject', () => {
    expect(resolveNextModule(modules, 'rw1', 2, 3, true).nextModuleId).toBe('rwh');
    expect(resolveNextModule(modules, 'rw1', 1, 3, true).nextModuleId).toBe('rwe');
    expect(resolveNextModule(modules, 'm1', 2, 3, true).nextModuleId).toBe('mh');
  });
  it('skips the unused RW branch and starts math module 1', () => {
    expect(resolveNextModule(modules, 'rwe', 0, 3, true).nextModuleId).toBe('m1');
    expect(resolveNextModule(modules, 'rwh', 3, 3, true).nextModuleId).toBe('m1');
  });
  it('finishes after either math branch', () => {
    expect(resolveNextModule(modules, 'me', 0, 3, true).nextModuleId).toBeNull();
    expect(resolveNextModule(modules, 'mh', 3, 3, true).nextModuleId).toBeNull();
  });
  it('checks all missing branches at import', () => {
    expect(validateAdaptiveModules(modules, true)).toEqual([]);
    expect(validateAdaptiveModules(modules.filter(m => m.id !== 'me'), true).join(' ')).toMatch(/math.*easy/);
  });
  it('does not treat a standard linear exam as adaptive', () => {
    expect(resolveNextModule([modules[0], modules[1], modules[3]], 'rw1', 3, 3, false).nextModuleId).toBe('rwe');
  });
});
