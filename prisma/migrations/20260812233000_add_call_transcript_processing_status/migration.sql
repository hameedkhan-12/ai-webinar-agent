-- CreateEnum
CREATE TYPE "CallTranscriptProcessingStatusEnum" AS ENUM ('TRANSCRIPT_SAVED', 'CLASSIFIED', 'FOLLOWED_UP');

-- AlterTable
ALTER TABLE "CallTranscript" ADD COLUMN "processingStatus" "CallTranscriptProcessingStatusEnum" NOT NULL DEFAULT 'TRANSCRIPT_SAVED';
