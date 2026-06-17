-- AlterTable
ALTER TABLE "BugReport"
ADD COLUMN     "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "BugReport"
SET "photos" = CASE
    WHEN "photoUrl" IS NULL THEN ARRAY[]::TEXT[]
    ELSE ARRAY["photoUrl"]
END;

ALTER TABLE "BugReport"
DROP COLUMN "photoUrl";