-- Optional Laytime2000-style "Frac" for time counting (after calendar / OODDA).
-- Explicit fraction wins; otherwise workable_hatches / total_hatches when both set.
ALTER TABLE "import_contracts"
ADD COLUMN "laytime_counting_fraction" DECIMAL(8, 6),
ADD COLUMN "workable_hatches" INTEGER,
ADD COLUMN "total_hatches" INTEGER;
