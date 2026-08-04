/*
  Warnings:

  - You are about to drop the column `stripeConnectId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `priceId` on the `Webinar` table. All the data in the column will be lost.
  - You are about to drop the column `stripeProductId` on the `Webinar` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "stripeConnectId",
DROP COLUMN "stripeCustomerId",
ADD COLUMN     "whopCompanyId" VARCHAR(255),
ADD COLUMN     "whopUserId" VARCHAR(255);

-- AlterTable
ALTER TABLE "Webinar" DROP COLUMN "priceId",
DROP COLUMN "stripeProductId",
ADD COLUMN     "price" DECIMAL(10,2);
