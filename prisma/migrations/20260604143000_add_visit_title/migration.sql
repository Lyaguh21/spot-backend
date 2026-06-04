ALTER TABLE "Visit" ADD COLUMN "title" TEXT;

UPDATE "Visit"
SET "title" = "Place"."title"
FROM "Place"
WHERE "Visit"."placeId" = "Place"."id";

ALTER TABLE "Visit" ALTER COLUMN "title" SET NOT NULL;
