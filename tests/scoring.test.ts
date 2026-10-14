import { describe, it, expect } from 'vitest';
import {
  compareGridIn,
  isAnswerCorrect,
  gradeModule,
  routeToModule2,
} from '@/lib/scoring';

describe('compareGridIn', () => {
  it('accepts exact integers', () => {
    expect(compareGridIn('19', '19')).toBe(true);
  });

  it('accepts equivalent decimals', () => {
    expect(compareGridIn('3.50', '3.5')).toBe(true);
    expect(compareGridIn('.5', '0.5')).toBe(true);
  });

  it('accepts fractions equal to decimals', () => {
    expect(compareGridIn('3/4', '0.75')).toBe(true);
    expect(compareGridIn('1/2', '2/4')).toBe(true);
  });

  it('accepts negatives', () => {
    expect(compareGridIn('-2', '-2')).toBe(true);
    expect(compareGridIn('-0.5', '-1/2')).toBe(true);
  });

  it('strips whitespace, $, commas, and %', () => {
    expect(compareGridIn(' 1,200 ', '1200')).toBe(true);
    expect(compareGridIn('$42', '42')).toBe(true);
    expect(compareGridIn('50%', '50')).toBe(true);
  });

  it('rejects blank answers', () => {
    expect(compareGridIn('', '5')).toBe(false);
    expect(compareGridIn(null, '5')).toBe(false);
  });

  it('rejects wrong answers', () => {
    expect(compareGridIn('18', '19')).toBe(false);
    expect(compareGridIn('3/5', '0.75')).toBe(false);
  });

  it('rejects invalid division', () => {
    expect(compareGridIn('3/0', '0')).toBe(false);
  });
});

describe('isAnswerCorrect', () => {
  it('grades multiple choice case-insensitively', () => {
    const q = { id: 'q1', type: 'multiple_choice' as const, correctAnswer: 'B' };
    expect(isAnswerCorrect(q, 'B')).toBe(true);
    expect(isAnswerCorrect(q, 'b')).toBe(true);
    expect(isAnswerCorrect(q, 'A')).toBe(false);
  });

  it('routes grid-in to numeric comparison', () => {
    const q = { id: 'q2', type: 'grid_in' as const, correctAnswer: '0.75' };
    expect(isAnswerCorrect(q, '3/4')).toBe(true);
    expect(isAnswerCorrect(q, '0.7')).toBe(false);
  });
});

describe('gradeModule', () => {
  const questions = [
    { id: 'a', type: 'multiple_choice' as const, correctAnswer: 'A' },
    { id: 'b', type: 'multiple_choice' as const, correctAnswer: 'B' },
    { id: 'c', type: 'grid_in' as const, correctAnswer: '12' },
    { id: 'd', type: 'grid_in' as const, correctAnswer: '0.5' },
  ];

  it('scores a perfect module', () => {
    const r = gradeModule({ a: 'A', b: 'B', c: '12', d: '1/2' }, questions);
    expect(r.correct).toBe(4);
    expect(r.total).toBe(4);
  });

  it('scores a mixed module', () => {
    const r = gradeModule({ a: 'B', b: 'B', c: '11', d: '0.5' }, questions);
    expect(r.correct).toBe(2);
    expect(r.perQuestion).toEqual({
      a: false,
      b: true,
      c: false,
      d: true,
    });
  });

  it('treats missing answers as incorrect', () => {
    const r = gradeModule({}, questions);
    expect(r.correct).toBe(0);
    expect(r.total).toBe(4);
  });
});

describe('routeToModule2', () => {
  it('routes to hard when at threshold', () => {
    expect(routeToModule2(16, 22, 16)).toBe('hard');
  });

  it('routes to hard when above threshold', () => {
    expect(routeToModule2(20, 22, 16)).toBe('hard');
  });

  it('routes to easy when below threshold', () => {
    expect(routeToModule2(15, 22, 16)).toBe('easy');
  });

  it('routes to standard when threshold is null', () => {
    expect(routeToModule2(22, 22, null)).toBe('standard');
  });

  it('handles a zero-question module', () => {
    expect(routeToModule2(0, 0, 16)).toBe('standard');
  });

  it('handles a perfect score with no threshold', () => {
    expect(routeToModule2(22, 22, null)).toBe('standard');
  });
});
