-- AlterTable
ALTER TABLE "ObjectionInstance" ADD COLUMN     "callTranscriptId" UUID;

-- CreateIndex
CREATE INDEX "ObjectionInstance_callTranscriptId_idx" ON "ObjectionInstance"("callTranscriptId");

-- AddForeignKey
ALTER TABLE "ObjectionInstance" ADD CONSTRAINT "ObjectionInstance_callTranscriptId_fkey" FOREIGN KEY ("callTranscriptId") REFERENCES "CallTranscript"("id") ON DELETE SET NULL ON UPDATE CASCADE;
