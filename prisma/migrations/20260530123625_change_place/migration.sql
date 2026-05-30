/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Place` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Place` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Place_externalId_key" ON "Place"("externalId");
