-- Add pet information
ALTER TABLE "public"."Appointment"
ADD COLUMN "petAge" TEXT,
ADD COLUMN "petSpecies" TEXT;

-- Backfill existing appointments
UPDATE "public"."Appointment"
SET "petSpecies" = 'No especificada'
WHERE "petSpecies" IS NULL;

-- Make species required
ALTER TABLE "public"."Appointment"
ALTER COLUMN "petSpecies" SET NOT NULL;
