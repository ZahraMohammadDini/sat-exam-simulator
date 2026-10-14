import { describe, it, expect } from 'vitest';
import {
  questionInputSchema,
  testInputSchema,
  moduleInputSchema,
  verifyPasswordSchema,
  bulkPublishSchema,
} from '@/lib/validation';

describe('questionInputSchema', () => {
  const baseMC = {
    subject: 'math',
    type: 'multiple_choice',
    difficulty: 'medium',
    stem: 'What is 2+2?',
    choices: [
      { id: 'A', mode: 'text', text: '3' },
      { id: 'B', mode: 'text', text: '4' },
    ],
    correctAnswer: 'B',
  };

  it('accepts a valid MC question', () => {
    expect(questionInputSchema.safeParse(baseMC).success).toBe(true);
  });

  it('rejects MC with fewer than 2 choices', () => {
    const bad = {
      ...baseMC,
      choices: [{ id: 'A', mode: 'text', text: '3' }],
    };
    expect(questionInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects MC where correctAnswer is not a choice id', () => {
    const bad = { ...baseMC, correctAnswer: 'Z' };
    expect(questionInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects duplicate choice ids', () => {
    const bad = {
      ...baseMC,
      choices: [
        { id: 'A', mode: 'text', text: '3' },
        { id: 'A', mode: 'text', text: '4' },
      ],
    };
    expect(questionInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects stem-less questions', () => {
    const bad = { ...baseMC, stem: '' };
    expect(questionInputSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts image-mode stem with stemImage', () => {
    const ok = {
      ...baseMC,
      stem: null,
      stemIsImage: true,
      stemImage: 'https://example.com/img.png',
    };
    expect(questionInputSchema.safeParse(ok).success).toBe(true);
  });

  it('rejects image-mode stem without stemImage', () => {
    const bad = {
      ...baseMC,
      stem: null,
      stemIsImage: true,
      stemImage: null,
    };
    expect(questionInputSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts a valid grid-in question', () => {
    const ok = {
      subject: 'math',
      type: 'grid_in',
      difficulty: 'easy',
      stem: 'What is 2+2?',
      correctAnswer: '4',
    };
    expect(questionInputSchema.safeParse(ok).success).toBe(true);
  });

  it('accepts a fractional grid-in answer', () => {
    const ok = {
      subject: 'math',
      type: 'grid_in',
      difficulty: 'easy',
      stem: 'Half?',
      correctAnswer: '3/4',
    };
    expect(questionInputSchema.safeParse(ok).success).toBe(true);
  });

  it('rejects a non-numeric grid-in answer', () => {
    const bad = {
      subject: 'math',
      type: 'grid_in',
      difficulty: 'easy',
      stem: 'Half?',
      correctAnswer: 'three-fourths',
    };
    expect(questionInputSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts mixed text+image choices', () => {
    const ok = {
      ...baseMC,
      choices: [
        { id: 'A', mode: 'text', text: '3' },
        { id: 'B', mode: 'image', imageUrl: 'https://example.com/b.png' },
      ],
    };
    expect(questionInputSchema.safeParse(ok).success).toBe(true);
  });
});

describe('testInputSchema', () => {
  it('accepts a valid test', () => {
    const ok = {
      title: 'Practice 1',
      description: 'A demo.',
      password: 'demo1234',
      isPublished: true,
      allowReview: true,
      showExplanations: true,
      adaptiveEnabled: false,
    };
    expect(testInputSchema.safeParse(ok).success).toBe(true);
  });

  it('requires a title and password', () => {
    expect(testInputSchema.safeParse({ password: 'x' }).success).toBe(false);
    expect(testInputSchema.safeParse({ title: 'T' }).success).toBe(false);
  });

  it('rejects a too-short password', () => {
    const bad = {
      title: 'T',
      password: 'abc',
    };
    expect(testInputSchema.safeParse(bad).success).toBe(false);
  });
});

describe('moduleInputSchema', () => {
  it('accepts a valid module', () => {
    const ok = {
      subject: 'math',
      moduleNumber: 1,
      difficulty: 'standard',
      timeLimitSeconds: 2100,
      order: 0,
    };
    expect(moduleInputSchema.safeParse(ok).success).toBe(true);
  });

  it('rejects a moduleNumber outside 1..2', () => {
    const bad = {
      subject: 'math',
      moduleNumber: 3,
      timeLimitSeconds: 100,
      order: 0,
    };
    expect(moduleInputSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a time limit of zero', () => {
    const bad = {
      subject: 'math',
      moduleNumber: 1,
      timeLimitSeconds: 0,
      order: 0,
    };
    expect(moduleInputSchema.safeParse(bad).success).toBe(false);
  });
});

describe('verifyPasswordSchema', () => {
  it('accepts valid input', () => {
    const ok = { testId: 'a'.repeat(25), password: 'demo1234' };
    expect(verifyPasswordSchema.safeParse(ok).success).toBe(true);
  });

  it('rejects a too-short testId', () => {
    expect(
      verifyPasswordSchema.safeParse({ testId: 'abc', password: 'x' }).success
    ).toBe(false);
  });
});

describe('bulkPublishSchema', () => {
  it('accepts an array of ids and a boolean', () => {
    const ok = {
      ids: ['a'.repeat(25), 'b'.repeat(25)],
      isPublished: true,
    };
    expect(bulkPublishSchema.safeParse(ok).success).toBe(true);
  });

  it('rejects an empty array', () => {
    expect(bulkPublishSchema.safeParse({ ids: [], isPublished: true }).success).toBe(
      false
    );
  });
});
