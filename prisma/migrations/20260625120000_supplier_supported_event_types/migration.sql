-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN "supportedEventTypes" TEXT[] NOT NULL DEFAULT ARRAY['wedding']::TEXT[];
