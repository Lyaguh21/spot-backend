-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('USER', 'COUPLE');

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "ownerType" "OwnerType" NOT NULL DEFAULT 'USER';
