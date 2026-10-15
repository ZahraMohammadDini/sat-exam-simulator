import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { serializePublicQuestion } from '@/lib/serialize';
import { ExamShell } from '@/components/exam/ExamShell';
import type { Highlight } from '@/lib/highlight-store';
import type {
  TestStructure,
  SessionState,
  SessionModuleAnswers,
  SessionTimeRemaining,
  RoutingEntry,
  ModuleDifficulty,
  Subject,
} from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { sessionId: string };
}

export default async function TestPage({ params }: PageProps) {
  const session = await prisma.testSession.findUnique({
    where: { id: params.sessionId },
    include: {
      test: {
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
      },
    },
  });

  if (!session) notFound();
  if (session.status === 'completed') {
    redirect(`/results/${session.id}`);
  }

  const test: TestStructure = {
    id: session.test.id,
    title: session.test.title,
    description: session.test.description,
    allowReview: session.test.allowReview,
    showExplanations: session.test.showExplanations,
    adaptiveEnabled: session.test.adaptiveEnabled,
    modules: session.test.modules.map((m) => ({
      id: m.id,
      subject: m.subject as Subject,
      moduleNumber: m.moduleNumber,
      difficulty: m.difficulty as ModuleDifficulty,
      timeLimitSeconds: m.timeLimitSeconds,
      breakAfterSeconds: m.breakAfterSeconds,
      order: m.order,
      questions: m.questions.map((tmq) => serializePublicQuestion(tmq.question)),
    })),
  };

  const sessionState: SessionState = {
    id: session.id,
    testId: session.testId,
    currentModuleIndex: session.currentModuleIndex,
    answers: (session.answers as unknown as SessionModuleAnswers) ?? {},
    timeRemaining: (session.timeRemaining as unknown as SessionTimeRemaining) ?? {},
    routing: (session.routing as unknown as RoutingEntry[]) ?? [],
    status: 'active',
    isPreview: session.isPreview,
  };

  const initialHighlights =
    (session.highlights as unknown as Record<string, Highlight[]>) ?? {};

  return (
    <ExamShell
      test={test}
      session={sessionState}
      initialHighlights={initialHighlights}
      referenceSheetImage={session.test.referenceSheetImage}
    />
  );
}
