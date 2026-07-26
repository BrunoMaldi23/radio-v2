ALTER TABLE "Article" ADD COLUMN "eventId" INTEGER;

ALTER TABLE "Article"
  ADD CONSTRAINT "Article_eventId_fkey"
  FOREIGN KEY ("eventId")
  REFERENCES "Article"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX "Article_eventId_idx" ON "Article"("eventId");
