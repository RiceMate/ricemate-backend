-- AlterTable
ALTER TABLE "income_instance" ADD COLUMN     "parcel_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "income_source" ADD COLUMN     "default_parcel_price" DECIMAL(12,2) NOT NULL DEFAULT 0;
