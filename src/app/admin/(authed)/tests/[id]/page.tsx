import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { TestEditor } from '@/components/admin/TestEditor';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function EditTestPage({ params }: PageProps) {
  const test = await prisma.test.findUnique({
    where: { id: params.id },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: {
              question: {
                select: {
                  id: true,
                  subject: true,
                  type: true,
                  difficulty: true,
                  domain: true,
                  stem: true,
                  stemImage: true,
                  stemIsImage: true,
                  isPublished: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!test) notFound();

  const serialized = {
    id: test.id,
    title: test.title,
    description: test.description,
    isPublished: test.isPublished,
    allowReview: test.allowReview,
    showExplanations: test.showExplanations,
    adaptiveEnabled: test.adaptiveEnabled,
    modules: test.modules.map((m) => ({
      id: m.id,
      subject: m.subject,
      moduleNumber: m.moduleNumber,
      difficulty: m.difficulty,
      timeLimitSeconds: m.timeLimitSeconds,
      order: m.order,
      adaptiveThreshold: m.adaptiveThreshold,
      routesTo: m.routesTo,
      questions: m.questions.map((tmq) => ({
        tmqId: tmq.id,
        order: tmq.order,
        question: tmq.question,
      })),
    })),
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Edit test</h1>
        <p className="mt-1 text-sm text-bluebook-muted">{test.title}</p>
      </header>
      <TestEditor test={serialized} />
    </div>
  );
}
