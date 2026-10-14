-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "passwordHash" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "allowReview" BOOLEAN NOT NULL DEFAULT true,
    "showExplanations" BOOLEAN NOT NULL DEFAULT true,
    "adaptiveEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestModule" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "moduleNumber" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'standard',
    "timeLimitSeconds" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "adaptiveThreshold" INTEGER,
    "routesTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "domain" TEXT,
    "tags" TEXT[],
    "passage" TEXT,
    "passageImage" TEXT,
    "passageIsImage" BOOLEAN NOT NULL DEFAULT false,
    "stem" TEXT,
    "stemImage" TEXT,
    "stemIsImage" BOOLEAN NOT NULL DEFAULT false,
    "choices" JSONB,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "explanationImage" TEXT,
    "explanationIsImage" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestModuleQuestion" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TestModuleQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSession" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "currentModuleIndex" INTEGER NOT NULL DEFAULT 0,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "timeRemaining" JSONB NOT NULL DEFAULT '{}',
    "routing" JSONB NOT NULL DEFAULT '[]',
    "results" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isPreview" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TestSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE INDEX "Test_isPublished_idx" ON "Test"("isPublished");

-- CreateIndex
CREATE INDEX "TestModule_testId_order_idx" ON "TestModule"("testId", "order");

-- CreateIndex
CREATE INDEX "Question_subject_difficulty_idx" ON "Question"("subject", "difficulty");

-- CreateIndex
CREATE INDEX "Question_isPublished_idx" ON "Question"("isPublished");

-- CreateIndex
CREATE INDEX "TestModuleQuestion_moduleId_order_idx" ON "TestModuleQuestion"("moduleId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "TestModuleQuestion_moduleId_questionId_key" ON "TestModuleQuestion"("moduleId", "questionId");

-- CreateIndex
CREATE INDEX "TestSession_testId_idx" ON "TestSession"("testId");

-- CreateIndex
CREATE INDEX "TestSession_testId_isPreview_idx" ON "TestSession"("testId", "isPreview");

-- CreateIndex
CREATE INDEX "TestSession_status_isPreview_idx" ON "TestSession"("status", "isPreview");

-- AddForeignKey
ALTER TABLE "TestModule" ADD CONSTRAINT "TestModule_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestModuleQuestion" ADD CONSTRAINT "TestModuleQuestion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TestModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestModuleQuestion" ADD CONSTRAINT "TestModuleQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
