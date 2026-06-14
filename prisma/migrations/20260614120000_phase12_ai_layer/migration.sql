-- AlterTable: add category and confidence to EmailClassification
ALTER TABLE "EmailClassification" ADD COLUMN "category" TEXT;
ALTER TABLE "EmailClassification" ADD COLUMN "confidence" DOUBLE PRECISION;

-- CreateTable: EmailSummary
CREATE TABLE "EmailSummary" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "shortSummary" TEXT NOT NULL,
    "mediumSummary" TEXT NOT NULL,
    "bulletSummary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EmailDraft
CREATE TABLE "EmailDraft" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailSummary_emailId_key" ON "EmailSummary"("emailId");

-- CreateIndex
CREATE INDEX "EmailDraft_emailId_idx" ON "EmailDraft"("emailId");

-- AddForeignKey
ALTER TABLE "EmailSummary" ADD CONSTRAINT "EmailSummary_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft" ADD CONSTRAINT "EmailDraft_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
