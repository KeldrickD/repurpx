-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('CREATOR', 'DANCER', 'CLUB');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "primaryRole" "AccountRole",
ADD COLUMN     "roles" "AccountRole"[] DEFAULT ARRAY[]::"AccountRole"[];
