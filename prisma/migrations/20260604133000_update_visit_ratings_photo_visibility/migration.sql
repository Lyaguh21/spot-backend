ALTER TABLE "Visit" ADD COLUMN "ratings" JSONB NOT NULL DEFAULT '[]';

UPDATE "Visit"
SET "ratings" = CASE
    WHEN "rating" IS NULL THEN '[]'::jsonb
    ELSE jsonb_build_array(jsonb_build_object('nickname', '', 'rating', "rating"))
END;

ALTER TABLE "Visit" ADD COLUMN "photoURL" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Visit" ADD COLUMN "icon" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Visit" ADD COLUMN "color" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Visit" DROP COLUMN "rating",
DROP COLUMN "visibility";
