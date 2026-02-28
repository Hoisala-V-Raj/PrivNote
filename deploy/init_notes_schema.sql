CREATE TABLE IF NOT EXISTS "notes" (
  "id" uuid NOT NULL,
  "text" text NOT NULL,
  "passwordHash" character varying(255) NOT NULL,
  "summary" text,
  "summaryGeneratedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_a515a13f03ef7ad02efeedc071" ON "notes" ("createdAt");
CREATE INDEX IF NOT EXISTS "IDX_af6206538ea96c4e77e9f400c3" ON "notes" ("id");
