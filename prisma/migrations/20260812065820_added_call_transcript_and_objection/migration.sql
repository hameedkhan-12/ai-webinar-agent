-- CreateTable
CREATE TABLE "CallTranscript" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attendanceId" UUID NOT NULL,
    "vapiCallId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "webinarId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Objection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectionInstance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "objectionId" UUID NOT NULL,
    "attendanceId" UUID NOT NULL,
    "transcriptExcerpt" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObjectionInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CallTranscript_vapiCallId_key" ON "CallTranscript"("vapiCallId");

-- CreateIndex
CREATE INDEX "CallTranscript_attendanceId_idx" ON "CallTranscript"("attendanceId");

-- CreateIndex
CREATE INDEX "Objection_webinarId_idx" ON "Objection"("webinarId");

-- CreateIndex
CREATE UNIQUE INDEX "Objection_webinarId_label_key" ON "Objection"("webinarId", "label");

-- CreateIndex
CREATE INDEX "ObjectionInstance_objectionId_idx" ON "ObjectionInstance"("objectionId");

-- CreateIndex
CREATE INDEX "ObjectionInstance_attendanceId_idx" ON "ObjectionInstance"("attendanceId");

-- AddForeignKey
ALTER TABLE "CallTranscript" ADD CONSTRAINT "CallTranscript_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objection" ADD CONSTRAINT "Objection_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "Webinar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectionInstance" ADD CONSTRAINT "ObjectionInstance_objectionId_fkey" FOREIGN KEY ("objectionId") REFERENCES "Objection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectionInstance" ADD CONSTRAINT "ObjectionInstance_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
