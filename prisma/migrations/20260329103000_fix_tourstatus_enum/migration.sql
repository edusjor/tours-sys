-- Fix mismatch between Prisma enum TourStatus and existing TEXT column in PostgreSQL.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TourStatus') THEN
    CREATE TYPE "TourStatus" AS ENUM ('ACTIVO', 'NO_ACTIVO', 'BORRADOR');
  END IF;
END $$;

UPDATE "Tour"
SET status = 'BORRADOR'
WHERE status IS NULL
  OR status NOT IN ('ACTIVO', 'NO_ACTIVO', 'BORRADOR');

ALTER TABLE "Tour" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Tour" ALTER COLUMN status TYPE "TourStatus" USING status::"TourStatus";
ALTER TABLE "Tour" ALTER COLUMN status SET DEFAULT 'ACTIVO';
