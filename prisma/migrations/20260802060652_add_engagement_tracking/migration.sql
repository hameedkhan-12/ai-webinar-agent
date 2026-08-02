-- CreateEnum
CREATE TYPE "EngagementEventType" AS ENUM ('CHAT_MESSAGE', 'CTA_CLICK', 'WATCH_PROGRESS');

-- CreateTable
CREATE TABLE "EngagementEvent" (
    "id" TEXT NOT NULL,
    "attendanceId" UUID NOT NULL,
    "type" "EngagementEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EngagementEvent_attendanceId_idx" ON "EngagementEvent"("attendanceId");

-- CreateIndex
CREATE INDEX "EngagementEvent_attendanceId_type_idx" ON "EngagementEvent"("attendanceId", "type");

-- AddForeignKey
ALTER TABLE "EngagementEvent" ADD CONSTRAINT "EngagementEvent_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
