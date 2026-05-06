-- AlterTable
ALTER TABLE "import_contracts" ADD COLUMN     "laytime_demurrage_rate_per_day" DECIMAL(18,4),
ADD COLUMN     "laytime_dispatch_rate_per_day" DECIMAL(18,4);

-- AlterTable
ALTER TABLE "lighter_trips" ADD COLUMN     "laytime_commence_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "statements_of_fact" ADD COLUMN     "laytime_commence_at" TIMESTAMP(3);
