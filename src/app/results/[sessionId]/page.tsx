import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ResultsContent } from '@/components/results/ResultsContent';
import type {
  Results,
  ModuleResult,
  QuestionResult,
  PublicQuestion,
  Choice,
  Subject,
  ModuleDifficulty,
  QuestionType,
  Difficulty,
} from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { sessionId: string };
}

interface StoredQuestionResult {
  questionId: string;
  studentAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}
interface StoredModuleResult {
  moduleId: string;
  subject: Subject;
  moduleNumber: number;
  difficulty: ModuleDifficulty;
  correct: number;
  total: number;
  questions: StoredQuestionResult[];
}
interface StoredResults {
  testTitle: string;
  completedAt: string;
  totalCorrect: number;
  totalQuestions: number;
  modules: StoredModuleResult[];
}

export default async function ResultsPage({ params }: PageProps) {
  const session = await prisma.testSession.findUnique({
    where: { id: params.sessionId },
    include: {
      test: {
        select: {
          title: true,
          allowReview: true,
          showExplanations: true,
        },
      },
    },
  });

  if (!session) notFound();
  if (session.status !== 'completed') {
    redirect(`/test/${session.id}`);
  }

  const stored = session.results as unknown as StoredResults | null;
  if (!stored) notFound();

  const questionIds = stored.modules.flatMap((m) =>
    m.questions.map((q) => q.questionId)
  );

  const questionRows = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      subject: true,
      type: true,
      difficulty: true,
      domain: true,
      passage: true,
      passageImage: true,
      passageIsImage: true,
      stem: true,
      stemImage: true,
      stemIsImage: true,
      choices: true,
      explanation: true,
      explanationImage: true,
      explanationIsImage: true,
    },
  });

  const byId = new Map(questionRows.map((q) => [q.id, q]));

  const modules: ModuleResult[] = stored.modules.map((m) => {
    const questions: QuestionResult[] = m.questions.map((q) => {
      const row = byId.get(q.questionId);
      const choiceList = Array.isArray(row?.choices)
        ? (row?.choices as unknown as Choice[])
        : null;

      const pub: PublicQuestion = {
        id: q.questionId,
        subject: (row?.subject as Subject) ?? m.subject,
        type: (row?.type as QuestionType) ?? 'multiple_choice',
        difficulty: (row?.difficulty as Difficulty) ?? 'medium',
        domain: row?.domain ?? null,
        passage: row?.passage ?? null,
        passageImage: row?.passageImage ?? null,
        passageIsImage: row?.passageIsImage ?? false,
        stem: row?.stem ?? null,
        stemImage: row?.stemImage ?? null,
        stemIsImage: row?.stemIsImage ?? false,
        choices: choiceList,
        explanation: null,
        explanationImage: null,
        explanationIsImage: false,
      };

      return {
        questionId: q.questionId,
        question: pub,
        studentAnswer: q.studentAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect: q.isCorrect,
        explanation: row?.explanation ?? null,
        explanationImage: row?.explanationImage ?? null,
        explanationIsImage: row?.explanationIsImage ?? false,
      };
    });

    return {
      moduleId: m.moduleId,
      subject: m.subject,
      moduleNumber: m.moduleNumber,
      difficulty: m.difficulty,
      correct: m.correct,
      total: m.total,
      questions,
    };
  });

  const results: Results = {
    testTitle: stored.testTitle ?? session.test.title,
    completedAt: stored.completedAt,
    totalCorrect: stored.totalCorrect,
    totalQuestions: stored.totalQuestions,
    modules,
  };

  return (
    <ResultsContent
      results={results}
      allowReview={session.test.allowReview}
      showExplanations={session.test.showExplanations}
      isPreview={session.isPreview}
    />
  );
}
