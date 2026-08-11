-- CreateTable
CREATE TABLE "UserIntegration" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "integrationId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserIntegration_userId_idx" ON "UserIntegration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserIntegration_userId_integrationId_key" ON "UserIntegration"("userId", "integrationId");

-- AddForeignKey
ALTER TABLE "UserIntegration" ADD CONSTRAINT "UserIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
