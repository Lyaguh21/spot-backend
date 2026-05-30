/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `Couple` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inviteCode` to the `Couple` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Couple" ADD COLUMN     "inviteCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Couple_inviteCode_key" ON "Couple"("inviteCode");
