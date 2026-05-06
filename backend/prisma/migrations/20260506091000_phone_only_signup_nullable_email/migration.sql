-- Allow phone-only accounts by making email optional.
ALTER TABLE "users"
ALTER COLUMN "email" DROP NOT NULL;
