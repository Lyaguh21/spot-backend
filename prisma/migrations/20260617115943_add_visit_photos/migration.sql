/*
  Warnings:

  - You are about to drop the column `photoURL` on the `Visit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Visit" DROP COLUMN "photoURL",
ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
