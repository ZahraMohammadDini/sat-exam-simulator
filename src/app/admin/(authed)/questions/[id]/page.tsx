import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { QuestionEditor } from '@/components/admin/QuestionEditor';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function EditQuestionPage({ params }: PageProps) {
  const q = await prisma.question.findUnique({ where: { id: params.id } });
  if (!q) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Edit question</h1>
        <p className="mt-1 text-sm text-text-muted">
          Created {q.createdAt.toLocaleDateString()}
        </p>
      </header>
      <QuestionEditor
        initial={{
          id: q.id,
          subject: q.subject,
          type: q.type,
          difficulty: q.difficulty,
          domain: q.domain,
          tags: q.tags,
          passage: q.passage,
          passageImage: q.passageImage,
          passageIsImage: q.passageIsImage,
          stem: q.stem,
          stemImage: q.stemImage,
          stemIsImage: q.stemIsImage,
          choices: q.choices,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          explanationImage: q.explanationImage,
          explanationIsImage: q.explanationIsImage,
          isPublished: q.isPublished,
        }}
      />
    </div>
  );
}
