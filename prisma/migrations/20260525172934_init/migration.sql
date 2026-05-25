-- CreateEnum
CREATE TYPE "Category" AS ENUM ('PHOTOGRAPHER', 'BRIDAL_SUITE', 'VIDEOGRAPHER', 'FLORIST', 'DJ', 'CATERING');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('PROFILE', 'COVER', 'PORTFOLIO');

-- CreateEnum
CREATE TYPE "AvailabilitySource" AS ENUM ('GOOGLE', 'MANUAL');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('VIDEO', 'PHONE', 'IN_PERSON');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "weddingDate" TIMESTAMP(3),
    "weddingArea" TEXT,
    "weddingAreaLat" DOUBLE PRECISION,
    "weddingAreaLng" DOUBLE PRECISION,
    "sessionToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "category" "Category" NOT NULL DEFAULT 'PHOTOGRAPHER',
    "bioHe" TEXT,
    "city" TEXT,
    "serviceAreas" TEXT[],
    "basePriceFrom" INTEGER,
    "basePriceTo" INTEGER,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "googleCalendarId" TEXT,
    "googleRefreshToken" TEXT,
    "googleAccessToken" TEXT,
    "googleTokenExpiry" TIMESTAMP(3),
    "responseRate" DOUBLE PRECISION,
    "sessionToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPhoto" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "type" "PhotoType" NOT NULL DEFAULT 'PORTFOLIO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPackage" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "nameHe" TEXT NOT NULL,
    "descHe" TEXT,
    "price" INTEGER NOT NULL,
    "hours" INTEGER,
    "includes" TEXT[],
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT true,
    "source" "AvailabilitySource" NOT NULL DEFAULT 'MANUAL',
    "googleEventId" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "requestedDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'PENDING',
    "meetingType" "MeetingType" NOT NULL DEFAULT 'VIDEO',
    "customerNotes" TEXT,
    "supplierNotes" TEXT,
    "googleEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "textHe" TEXT,
    "photos" TEXT[],
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSupplier" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "supplierId" TEXT,
    "type" TEXT NOT NULL,
    "titleHe" TEXT NOT NULL,
    "bodyHe" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Otp_phone_idx" ON "Otp"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_slug_key" ON "Supplier"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_phone_key" ON "Supplier"("phone");

-- CreateIndex
CREATE INDEX "Supplier_category_idx" ON "Supplier"("category");

-- CreateIndex
CREATE INDEX "Supplier_isActive_isVerified_idx" ON "Supplier"("isActive", "isVerified");

-- CreateIndex
CREATE INDEX "SupplierPhoto_supplierId_idx" ON "SupplierPhoto"("supplierId");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_supplierId_date_idx" ON "AvailabilitySlot"("supplierId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_supplierId_date_googleEventId_key" ON "AvailabilitySlot"("supplierId", "date", "googleEventId");

-- CreateIndex
CREATE INDEX "Meeting_customerId_idx" ON "Meeting"("customerId");

-- CreateIndex
CREATE INDEX "Meeting_supplierId_idx" ON "Meeting"("supplierId");

-- CreateIndex
CREATE INDEX "Meeting_requestedDate_idx" ON "Meeting"("requestedDate");

-- CreateIndex
CREATE UNIQUE INDEX "Review_meetingId_key" ON "Review"("meetingId");

-- CreateIndex
CREATE INDEX "Review_supplierId_idx" ON "Review"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedSupplier_customerId_supplierId_key" ON "SavedSupplier"("customerId", "supplierId");

-- AddForeignKey
ALTER TABLE "SupplierPhoto" ADD CONSTRAINT "SupplierPhoto_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPackage" ADD CONSTRAINT "SupplierPackage_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSupplier" ADD CONSTRAINT "SavedSupplier_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSupplier" ADD CONSTRAINT "SavedSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
