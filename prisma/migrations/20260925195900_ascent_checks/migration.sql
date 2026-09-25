-- Checks Prisma's schema language can't express. The app validates the same
-- things; these catch a bug that slips past it.
ALTER TABLE "Ascent"
  ADD CONSTRAINT "Ascent_hillId_check" CHECK ("hillId" > 0),
  ADD CONSTRAINT "Ascent_notes_check" CHECK (char_length("notes") <= 1000),
  ADD CONSTRAINT "Ascent_climbedOn_check" CHECK ("climbedOn" >= DATE '1900-01-01');
