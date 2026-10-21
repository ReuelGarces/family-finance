CREATE TYPE "FinancialAccountType" AS ENUM ('BANK', 'CASH', 'DIGITAL_WALLET', 'CREDIT_CARD', 'OTHER');
CREATE TYPE "FinancialAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "OperationType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "EntryStatus" AS ENUM ('POSTED', 'CANCELED');

CREATE TABLE "FinancialAccount" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "type" "FinancialAccountType" NOT NULL,
    "initialBalance" DECIMAL(14,2) NOT NULL,
    "referenceDate" DATE NOT NULL,
    "status" "FinancialAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "type" "OperationType" NOT NULL,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" "OperationType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "description" VARCHAR(240) NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "occurredOn" DATE NOT NULL,
    "authorId" TEXT NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'POSTED',
    "canceledAt" TIMESTAMP(3),
    "canceledById" TEXT,
    "cancellationReason" VARCHAR(240),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "originAccountId" TEXT NOT NULL,
    "destinationAccountId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "transferredOn" DATE NOT NULL,
    "authorId" TEXT NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'POSTED',
    "canceledAt" TIMESTAMP(3),
    "canceledById" TEXT,
    "cancellationReason" VARCHAR(240),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FinancialAccount_name_key" ON "FinancialAccount"("name");
CREATE INDEX "FinancialAccount_status_referenceDate_idx" ON "FinancialAccount"("status", "referenceDate");

CREATE UNIQUE INDEX "Category_name_type_key" ON "Category"("name", "type");
CREATE INDEX "Category_type_status_idx" ON "Category"("type", "status");

CREATE INDEX "Transaction_accountId_occurredOn_status_idx" ON "Transaction"("accountId", "occurredOn", "status");
CREATE INDEX "Transaction_categoryId_occurredOn_status_idx" ON "Transaction"("categoryId", "occurredOn", "status");
CREATE INDEX "Transaction_authorId_createdAt_idx" ON "Transaction"("authorId", "createdAt");
CREATE INDEX "Transaction_status_occurredOn_idx" ON "Transaction"("status", "occurredOn");

CREATE INDEX "Transfer_originAccountId_transferredOn_status_idx" ON "Transfer"("originAccountId", "transferredOn", "status");
CREATE INDEX "Transfer_destinationAccountId_transferredOn_status_idx" ON "Transfer"("destinationAccountId", "transferredOn", "status");
CREATE INDEX "Transfer_authorId_createdAt_idx" ON "Transfer"("authorId", "createdAt");
CREATE INDEX "Transfer_status_transferredOn_idx" ON "Transfer"("status", "transferredOn");

ALTER TABLE "FinancialAccount"
ADD CONSTRAINT "FinancialAccount_initialBalance_non_negative_check"
CHECK ("initialBalance" >= 0);

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_amount_positive_check"
CHECK ("amount" > 0),
ADD CONSTRAINT "Transaction_cancellation_fields_check"
CHECK (
    ("status" = 'POSTED' AND "canceledAt" IS NULL AND "canceledById" IS NULL AND "cancellationReason" IS NULL)
    OR
    ("status" = 'CANCELED' AND "canceledAt" IS NOT NULL AND "canceledById" IS NOT NULL AND "cancellationReason" IS NOT NULL)
);

ALTER TABLE "Transfer"
ADD CONSTRAINT "Transfer_amount_positive_check"
CHECK ("amount" > 0),
ADD CONSTRAINT "Transfer_origin_destination_check"
CHECK ("originAccountId" <> "destinationAccountId"),
ADD CONSTRAINT "Transfer_cancellation_fields_check"
CHECK (
    ("status" = 'POSTED' AND "canceledAt" IS NULL AND "canceledById" IS NULL AND "cancellationReason" IS NULL)
    OR
    ("status" = 'CANCELED' AND "canceledAt" IS NOT NULL AND "canceledById" IS NOT NULL AND "cancellationReason" IS NOT NULL)
);

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id")
ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "Transaction_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "Transaction_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "Transaction_canceledById_fkey"
FOREIGN KEY ("canceledById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Transfer"
ADD CONSTRAINT "Transfer_originAccountId_fkey"
FOREIGN KEY ("originAccountId") REFERENCES "FinancialAccount"("id")
ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "Transfer_destinationAccountId_fkey"
FOREIGN KEY ("destinationAccountId") REFERENCES "FinancialAccount"("id")
ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "Transfer_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "Transfer_canceledById_fkey"
FOREIGN KEY ("canceledById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
