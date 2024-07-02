/*
  Warnings:

  - Changed the type of `requirements` on the `Job` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `Job` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "requirements",
ADD COLUMN     "requirements" JSONB NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" JSONB NOT NULL;
