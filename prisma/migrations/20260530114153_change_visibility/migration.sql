/*
  Warnings:

  - The values [FOLLOWERS] on the enum `Visibility` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Visibility_new" AS ENUM ('PRIVATE', 'PUBLIC');
ALTER TABLE "public"."User" ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "public"."Visit" ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "visibility" TYPE "Visibility_new" USING ("visibility"::text::"Visibility_new");
ALTER TABLE "Visit" ALTER COLUMN "visibility" TYPE "Visibility_new" USING ("visibility"::text::"Visibility_new");
ALTER TYPE "Visibility" RENAME TO "Visibility_old";
ALTER TYPE "Visibility_new" RENAME TO "Visibility";
DROP TYPE "public"."Visibility_old";
ALTER TABLE "User" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';
ALTER TABLE "Visit" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';
COMMIT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "Visit" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';
