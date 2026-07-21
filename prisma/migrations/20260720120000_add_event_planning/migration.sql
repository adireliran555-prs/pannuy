-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PlanItemStatus" AS ENUM ('PENDING', 'BROWSING', 'SELECTED', 'SKIPPED', 'NOT_NEEDED');

-- CreateEnum
CREATE TYPE "BudgetMode" AS ENUM ('TOTAL', 'PER_GUEST');

-- CreateEnum
CREATE TYPE "SupplierRelationType" AS ENUM ('EXCLUSIVE', 'PREFERRED', 'RECOMMENDED');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'wedding',
    "date" DATE,
    "dateFlexible" BOOLEAN NOT NULL DEFAULT false,
    "areas" TEXT[],
    "city" TEXT,
    "guestCount" INTEGER,
    "budgetMode" "BudgetMode" NOT NULL DEFAULT 'TOTAL',
    "budgetAmount" INTEGER,
    "vibeTags" TEXT[],
    "kosher" BOOLEAN NOT NULL DEFAULT false,
    "status" "EventStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPlanItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PlanItemStatus" NOT NULL DEFAULT 'PENDING',
    "allocatedBudget" INTEGER,
    "selectedSupplierId" TEXT,
    "selectedPackageId" TEXT,
    "committedPrice" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierRelationship" (
    "id" TEXT NOT NULL,
    "fromSupplierId" TEXT NOT NULL,
    "toSupplierId" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "type" "SupplierRelationType" NOT NULL DEFAULT 'PREFERRED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_userId_status_idx" ON "Event"("userId", "status");

-- CreateIndex
CREATE INDEX "EventPlanItem_eventId_idx" ON "EventPlanItem"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventPlanItem_eventId_category_key" ON "EventPlanItem"("eventId", "category");

-- CreateIndex
CREATE INDEX "SupplierRelationship_fromSupplierId_category_idx" ON "SupplierRelationship"("fromSupplierId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierRelationship_fromSupplierId_toSupplierId_key" ON "SupplierRelationship"("fromSupplierId", "toSupplierId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPlanItem" ADD CONSTRAINT "EventPlanItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPlanItem" ADD CONSTRAINT "EventPlanItem_selectedSupplierId_fkey" FOREIGN KEY ("selectedSupplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRelationship" ADD CONSTRAINT "SupplierRelationship_fromSupplierId_fkey" FOREIGN KEY ("fromSupplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRelationship" ADD CONSTRAINT "SupplierRelationship_toSupplierId_fkey" FOREIGN KEY ("toSupplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
