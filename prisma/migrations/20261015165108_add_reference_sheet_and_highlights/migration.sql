-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "referenceSheetImage" TEXT;

-- AlterTable
ALTER TABLE "TestSession" ADD COLUMN     "highlights" JSONB NOT NULL DEFAULT '{}';
