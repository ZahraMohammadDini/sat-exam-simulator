import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { importPayloadSchema, formatZodError } from '@/lib/validation';
import { jsonOrDbNull } from '@/lib/serialize';
import { validateAdaptiveModules } from '@/lib/exam-routing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Export ───────────────────────────────────────────────────────
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const url = new URL(request.url);
  const testId = url.searchParams.get('testId');
  if (!testId) {
    return NextResponse.json(
      { ok: false, error: 'testId is required' },
      { status: 400 }
    );
  }

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: { question: true },
          },
        },
      },
    },
  });

  if (!test) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const payload = {
    version: 1 as const,
    test: {
      title: test.title,
      description: test.description,
      isPublished: test.isPublished,
      allowReview: test.allowReview,
      showExplanations: test.showExplanations,
      adaptiveEnabled: test.adaptiveEnabled,
      referenceSheetImage: test.referenceSheetImage,
      modules: test.modules.map((m) => ({
        subject: m.subject,
        moduleNumber: m.moduleNumber,
        difficulty: m.difficulty,
        timeLimitSeconds: m.timeLimitSeconds,
        breakAfterSeconds: m.breakAfterSeconds,
        order: m.order,
        adaptiveThreshold: m.adaptiveThreshold,
        routesTo: m.routesTo,
        questions: m.questions.map((tmq) => ({
          subject: tmq.question.subject,
          type: tmq.question.type,
          difficulty: tmq.question.difficulty,
          domain: tmq.question.domain,
          tags: tmq.question.tags,
          passage: tmq.question.passage,
          passageImage: tmq.question.passageImage,
          passageIsImage: tmq.question.passageIsImage,
          stem: tmq.question.stem,
          stemImage: tmq.question.stemImage,
          stemIsImage: tmq.question.stemIsImage,
          choices: tmq.question.choices,
          correctAnswer: tmq.question.correctAnswer,
          explanation: tmq.question.explanation,
          explanationImage: tmq.question.explanationImage,
          explanationIsImage: tmq.question.explanationIsImage,
          isPublished: tmq.question.isPublished,
        })),
      })),
    },
  };

  return NextResponse.json({ ok: true, data: payload });
}

// ── Import ───────────────────────────────────────────────────────
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const wrapper = body as { password?: string; payload?: unknown };
  if (!wrapper.password || typeof wrapper.password !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'password is required for the imported test' },
      { status: 400 }
    );
  }

  const parsed = importPayloadSchema.safeParse(wrapper.payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { test } = parsed.data;
  const issues = validateAdaptiveModules(test.modules.map((m, i) => ({
    id: String(i), subject: m.subject, moduleNumber: m.moduleNumber,
    difficulty: m.difficulty, order: m.order, adaptiveThreshold: m.adaptiveThreshold,
  })), test.adaptiveEnabled);
  for (const [index, module] of test.modules.entries()) {
    if (module.questions.some(q => q.subject !== module.subject)) issues.push(`module ${index + 1}: question subject mismatch`);
    if (module.adaptiveThreshold != null && module.adaptiveThreshold > module.questions.length) issues.push(`module ${index + 1}: threshold exceeds question count`);
  }
  if (issues.length) return NextResponse.json({ ok: false, error: issues.join('; ') }, { status: 400 });
  const refs = [test.referenceSheetImage, ...test.modules.flatMap(m => m.questions.flatMap(q => [
    q.passageImage, q.stemImage, q.explanationImage, ...(q.choices ?? []).filter(c => c.mode === 'image').map(c => c.mode === 'image' ? c.imageUrl : null),
  ]))].filter((x): x is string => !!x);
  if (refs.some(x => !/^https:\/\//i.test(x))) return NextResponse.json({ ok: false, error: 'Embedded images must finish uploading before test import' }, { status: 400 });
  const passwordHash = await bcrypt.hash(wrapper.password, 12);

  const created = await prisma.$transaction(async (tx) => {
    const newTest = await tx.test.create({
      data: {
        title: test.title,
        description: test.description ?? null,
        passwordHash,
        isPublished: test.isPublished,
        allowReview: test.allowReview,
        showExplanations: test.showExplanations,
        adaptiveEnabled: test.adaptiveEnabled,
        referenceSheetImage: test.referenceSheetImage ?? null,
      },
    });

    for (const mod of test.modules) {
      const newMod = await tx.testModule.create({
        data: {
          testId: newTest.id,
          subject: mod.subject,
          moduleNumber: mod.moduleNumber,
          difficulty: mod.difficulty,
          timeLimitSeconds: mod.timeLimitSeconds,
          breakAfterSeconds: mod.breakAfterSeconds ?? null,
          order: mod.order,
          adaptiveThreshold: mod.adaptiveThreshold ?? null,
          routesTo: mod.routesTo ?? null,
        },
      });

      let orderIndex = 0;
      for (const q of mod.questions) {
        const newQ = await tx.question.create({
          data: {
            subject: q.subject,
            type: q.type,
            difficulty: q.difficulty,
            domain: q.domain ?? null,
            tags: q.tags,
            passage: q.passage ?? null,
            passageImage: q.passageImage ?? null,
            passageIsImage: q.passageIsImage,
            stem: q.stem ?? null,
            stemImage: q.stemImage ?? null,
            stemIsImage: q.stemIsImage,
            choices: q.choices ? jsonOrDbNull(q.choices) : undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation ?? null,
            explanationImage: q.explanationImage ?? null,
            explanationIsImage: q.explanationIsImage,
            isPublished: q.isPublished,
          },
        });

        await tx.testModuleQuestion.create({
          data: {
            moduleId: newMod.id,
            questionId: newQ.id,
            order: orderIndex++,
          },
        });
      }
    }

    return newTest;
  });

  return NextResponse.json({ ok: true, data: { testId: created.id } });
}
