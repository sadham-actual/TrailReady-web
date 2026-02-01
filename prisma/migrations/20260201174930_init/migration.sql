-- CreateEnum
CREATE TYPE "Status" AS ENUM ('clear', 'rough', 'impassable');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('stockSUV_solidAxle', 'stockSUV_IFS', 'stockSUV_IFRS', 'lifted4x4_solidAxle', 'lifted4x4_IFS', 'lifted4x4_IFRS', 'sideBySide', 'dirtBike');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trails" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condition_reports" (
    "id" TEXT NOT NULL,
    "trailId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "confidence" "Confidence" NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "condition_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trails_region_idx" ON "trails"("region");

-- CreateIndex
CREATE INDEX "trails_name_idx" ON "trails"("name");

-- CreateIndex
CREATE INDEX "condition_reports_trailId_timestamp_idx" ON "condition_reports"("trailId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "condition_reports_userId_idx" ON "condition_reports"("userId");

-- AddForeignKey
ALTER TABLE "condition_reports" ADD CONSTRAINT "condition_reports_trailId_fkey" FOREIGN KEY ("trailId") REFERENCES "trails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condition_reports" ADD CONSTRAINT "condition_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
