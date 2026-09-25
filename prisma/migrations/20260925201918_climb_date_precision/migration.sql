-- CreateEnum
CREATE TYPE "DatePrecision" AS ENUM ('DAY', 'YEAR', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Ascent" ADD COLUMN     "precision" "DatePrecision" NOT NULL DEFAULT 'DAY',
ALTER COLUMN "climbedOn" DROP NOT NULL;

-- The date and its precision must agree: an exact day or a year has a date (a
-- year is stored as its 1 January), and an unknown date has none.
ALTER TABLE "Ascent" ADD CONSTRAINT "Ascent_precision_check" CHECK (
  ("precision" = 'DAY' AND "climbedOn" IS NOT NULL)
  OR ("precision" = 'YEAR' AND "climbedOn" IS NOT NULL
      AND EXTRACT(MONTH FROM "climbedOn") = 1 AND EXTRACT(DAY FROM "climbedOn") = 1)
  OR ("precision" = 'UNKNOWN' AND "climbedOn" IS NULL)
);
