ALTER TABLE "TestSession"
  ADD COLUMN "moduleStartedAt" TIMESTAMP(3),
  ADD COLUMN "breakEndsAt" TIMESTAMP(3),
  ADD COLUMN "strikethrough" JSONB NOT NULL DEFAULT '{}';
UPDATE "TestSession" SET "moduleStartedAt" = "startedAt" WHERE "status" = 'active' AND "currentModuleIndex" = 0;
