import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────

export const cuidSchema = z.string().min(20).max(40);

export const subjectSchema = z.enum(['reading_writing', 'math']);
export const questionTypeSchema = z.enum(['multiple_choice', 'grid_in']);
export const difficultySchema = z.enum(['easy', 'medium', 'hard']);
export const moduleDifficultySchema = z.enum(['standard', 'easy', 'hard']);
export const choiceIdSchema = z.enum(['A', 'B', 'C', 'D']);

// ─────────────────────────────────────────────────────────────────
// Choice (discriminated union on `mode`)
// ─────────────────────────────────────────────────────────────────

export const choiceSchema = z.discriminatedUnion('mode', [
  z.object({
    id: choiceIdSchema,
    mode: z.literal('text'),
    text: z.string().min(1, 'Choice text cannot be empty'),
  }),
  z.object({
    id: choiceIdSchema,
    mode: z.literal('image'),
    imageUrl: z.string().url('Choice image must be a valid URL'),
  }),
]);

export type ChoiceInput = z.infer<typeof choiceSchema>;

// ─────────────────────────────────────────────────────────────────
// Question — with cross-field validation
// ─────────────────────────────────────────────────────────────────

export const questionInputSchema = z
  .object({
    subject: subjectSchema,
    type: questionTypeSchema,
    difficulty: difficultySchema.default('medium'),
    domain: z.string().max(120).optional().nullable(),
    tags: z.array(z.string().min(1).max(60)).max(20).default([]),

    passage: z.string().optional().nullable(),
    passageImage: z.string().url().optional().nullable(),
    passageIsImage: z.boolean().default(false),

    stem: z.string().optional().nullable(),
    stemImage: z.string().url().optional().nullable(),
    stemIsImage: z.boolean().default(false),

    choices: z.array(choiceSchema).optional().nullable(),
    correctAnswer: z.string().min(1),

    explanation: z.string().optional().nullable(),
    explanationImage: z.string().url().optional().nullable(),
    explanationIsImage: z.boolean().default(false),

    isPublished: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    // Stem: exactly one of text / image
    if (data.stemIsImage && !data.stemImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'stemImage is required when stemIsImage is true',
        path: ['stemImage'],
      });
    }
    if (!data.stemIsImage && (!data.stem || data.stem.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'stem text is required when stemIsImage is false',
        path: ['stem'],
      });
    }

    // Passage: optional, but if image mode, image required
    if (data.passageIsImage && !data.passageImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'passageImage is required when passageIsImage is true',
        path: ['passageImage'],
      });
    }

    // Explanation: optional, but if image mode, image required
    if (data.explanationIsImage && !data.explanationImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'explanationImage is required when explanationIsImage is true',
        path: ['explanationImage'],
      });
    }

    // Multiple choice: choices required, correctAnswer must match a choice id
    if (data.type === 'multiple_choice') {
      if (!data.choices || data.choices.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least 2 choices are required for multiple-choice questions',
          path: ['choices'],
        });
      } else {
        const ids = data.choices.map((c) => c.id);
        if (!ids.includes(data.correctAnswer as (typeof ids)[number])) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'correctAnswer must match one of the choice ids',
            path: ['correctAnswer'],
          });
        }
        // Duplicate check
        const uniq = new Set(ids);
        if (uniq.size !== ids.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Choice ids must be unique',
            path: ['choices'],
          });
        }
      }
    }

    // Grid-in: correctAnswer must be numeric (accepts fractions and decimals)
    if (data.type === 'grid_in') {
      const pattern = /^-?\d+(\.\d+)?([\/]\d+(\.\d+)?)?$/;
      if (!pattern.test(data.correctAnswer.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Grid-in answer must be numeric (e.g. "3", "3.5", "-2", "3/4")',
          path: ['correctAnswer'],
        });
      }
    }
  });

export type QuestionInput = z.infer<typeof questionInputSchema>;

// ─────────────────────────────────────────────────────────────────
// Test
// ─────────────────────────────────────────────────────────────────

export const testInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  password: z.string().min(4).max(100),
  isPublished: z.boolean().default(false),
  allowReview: z.boolean().default(true),
  showExplanations: z.boolean().default(true),
  adaptiveEnabled: z.boolean().default(false),
});

export type TestInput = z.infer<typeof testInputSchema>;

export const moduleInputSchema = z.object({
  subject: subjectSchema,
  moduleNumber: z.number().int().min(1).max(2),
  difficulty: moduleDifficultySchema.default('standard'),
  timeLimitSeconds: z.number().int().min(60).max(3600),
  order: z.number().int().min(0),
  adaptiveThreshold: z.number().int().min(0).optional().nullable(),
  routesTo: z.enum(['easy', 'hard']).optional().nullable(),
  breakAfterSeconds: z.number().int().min(0).max(3600).optional().nullable(),
});

export type ModuleInput = z.infer<typeof moduleInputSchema>;

// ─────────────────────────────────────────────────────────────────
// Admin auth
// ─────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const setupSchema = z.object({
  token: z.string().min(1),
  username: z.string().min(3).max(100),
  password: z.string().min(8).max(200),
});

// ─────────────────────────────────────────────────────────────────
// Public student flow
// ─────────────────────────────────────────────────────────────────

export const verifyPasswordSchema = z.object({
  testId: cuidSchema,
  password: z.string().min(1).max(200),
});

export const createSessionSchema = z.object({
  testId: cuidSchema,
});

export const autosaveSchema = z.object({
  moduleId: cuidSchema,
  questionId: cuidSchema.optional(),
  answer: z.string().nullable().optional(),
  flagged: z.boolean().optional(),
  timeRemaining: z.number().int().min(0).optional(),
});

export const submitModuleSchema = z.object({
  moduleId: cuidSchema,
});

// ─────────────────────────────────────────────────────────────────
// Admin operations
// ─────────────────────────────────────────────────────────────────

export const bulkPublishSchema = z.object({
  ids: z.array(cuidSchema).min(1).max(200),
  isPublished: z.boolean(),
});

export const reorderSchema = z.object({
  orderedIds: z.array(cuidSchema).min(1),
});

export const importPayloadSchema = z.object({
  version: z.literal(1),
  test: z.object({
    title: z.string().min(1),
    description: z.string().nullable().optional(),
    isPublished: z.boolean().default(false),
    allowReview: z.boolean().default(true),
    showExplanations: z.boolean().default(true),
    adaptiveEnabled: z.boolean().default(false),
    modules: z.array(
      z.object({
        subject: subjectSchema,
        moduleNumber: z.number().int(),
        difficulty: moduleDifficultySchema,
        timeLimitSeconds: z.number().int(),
        order: z.number().int(),
        adaptiveThreshold: z.number().int().nullable().optional(),
        routesTo: z.enum(['easy', 'hard']).nullable().optional(),
        questions: z.array(questionInputSchema),
      })
    ),
  }),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;

// ─────────────────────────────────────────────────────────────────
// Helper: format Zod errors for API responses
// ─────────────────────────────────────────────────────────────────

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
}