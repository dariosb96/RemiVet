/*
  Warnings:

  - Added the required column `price` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Service" ADD COLUMN     "description" TEXT,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL;
