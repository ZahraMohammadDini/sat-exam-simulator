import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ── 1. First admin ────────────────────────────────────────────
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'changeme123';

  const existingAdmin = await prisma.admin.findUnique({ where: { username } });

  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        username,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
    console.log(`✓ Admin created`);
    console.log(`    username: ${username}`);
    console.log(`    password: ${password}`);
    console.log(`    → CHANGE THIS PASSWORD AFTER FIRST LOGIN`);
  } else {
    console.log(`• Admin already exists: ${username}`);
  }

  // ── 2. Sample test ────────────────────────────────────────────
  const sampleTitle = 'SAT Practice Test 1';
  const existingTest = await prisma.test.findFirst({
    where: { title: sampleTitle },
  });

  if (existingTest) {
    console.log(`• Sample test already exists: "${sampleTitle}"`);
    return;
  }

  const test = await prisma.test.create({
    data: {
      title: sampleTitle,
      description: 'A short demo with 2 math modules.',
      passwordHash: await bcrypt.hash('demo1234', 12),
      isPublished: true,
      adaptiveEnabled: false,
      allowReview: true,
      showExplanations: true,
      modules: {
        create: [
          {
            subject: 'math',
            moduleNumber: 1,
            difficulty: 'standard',
            timeLimitSeconds: 35 * 60,
            order: 0,
          },
          {
            subject: 'math',
            moduleNumber: 2,
            difficulty: 'standard',
            timeLimitSeconds: 35 * 60,
            order: 1,
          },
        ],
      },
    },
    include: { modules: { orderBy: { order: 'asc' } } },
  });

  // ── 3. Questions ──────────────────────────────────────────────
  const q1 = await prisma.question.create({
    data: {
      subject: 'math',
      type: 'multiple_choice',
      difficulty: 'easy',
      domain: 'Algebra',
      tags: ['linear-equations'],
      stem: 'If \\(2x + 3 = 11\\), what is the value of \\(x\\)?',
      choices: [
        { id: 'A', mode: 'text', text: '3' },
        { id: 'B', mode: 'text', text: '4' },
        { id: 'C', mode: 'text', text: '5' },
        { id: 'D', mode: 'text', text: '6' },
      ],
      correctAnswer: 'B',
      explanation:
        'Subtract 3 from both sides: \\(2x = 8\\). Divide by 2: \\(x = 4\\).',
    },
  });

  const q2 = await prisma.question.create({
    data: {
      subject: 'math',
      type: 'multiple_choice',
      difficulty: 'medium',
      domain: 'Algebra',
      tags: ['quadratics', 'factoring'],
      stem: 'Which of the following is a factored form of \\(x^2 - 5x + 6\\)?',
      choices: [
        { id: 'A', mode: 'text', text: '\\((x - 1)(x - 6)\\)' },
        { id: 'B', mode: 'text', text: '\\((x - 2)(x - 3)\\)' },
        { id: 'C', mode: 'text', text: '\\((x + 2)(x + 3)\\)' },
        { id: 'D', mode: 'text', text: '\\((x - 5)(x + 1)\\)' },
      ],
      correctAnswer: 'B',
      explanation:
        'We need two numbers that multiply to \\(6\\) and add to \\(-5\\): \\(-2\\) and \\(-3\\). So \\((x - 2)(x - 3)\\).',
    },
  });

  const q3 = await prisma.question.create({
    data: {
      subject: 'math',
      type: 'grid_in',
      difficulty: 'easy',
      domain: 'Functions',
      tags: ['evaluation'],
      stem: 'If \\(f(x) = 2x + 5\\), what is the value of \\(f(7)\\)?',
      correctAnswer: '19',
      explanation: '\\(f(7) = 2(7) + 5 = 14 + 5 = 19\\).',
    },
  });

  const q4 = await prisma.question.create({
    data: {
      subject: 'math',
      type: 'multiple_choice',
      difficulty: 'easy',
      domain: 'Arithmetic',
      tags: ['addition'],
      stem: 'What is \\(5 + 7\\)?',
      choices: [
        { id: 'A', mode: 'text', text: '10' },
        { id: 'B', mode: 'text', text: '11' },
        { id: 'C', mode: 'text', text: '12' },
        { id: 'D', mode: 'text', text: '13' },
      ],
      correctAnswer: 'C',
      explanation: '\\(5 + 7 = 12\\).',
    },
  });

  // ── 4. Attach questions to modules ────────────────────────────
  const [m1, m2] = test.modules;

  await prisma.testModuleQuestion.createMany({
    data: [
      { moduleId: m1.id, questionId: q1.id, order: 0 },
      { moduleId: m1.id, questionId: q2.id, order: 1 },
      { moduleId: m1.id, questionId: q3.id, order: 2 },
      { moduleId: m2.id, questionId: q4.id, order: 0 },
    ],
  });

  console.log(`✓ Sample test created`);
  console.log(`    title:    ${sampleTitle}`);
  console.log(`    password: demo1234`);
  console.log(`    3 questions in Module 1, 1 question in Module 2`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
