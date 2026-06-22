-- Plan catalog: one row per SchoolPlan tier, editable by the Super Admin.

CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

CREATE TABLE "plans" (
    "tier" "SchoolPlan" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "priceNaira" INTEGER NOT NULL DEFAULT 0,
    "billingInterval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "maxPupils" INTEGER,
    "maxStaff" INTEGER,
    "smsQuota" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("tier")
);

-- Seed default tiers so the catalog is never empty.
INSERT INTO "plans" ("tier", "name", "description", "priceNaira", "billingInterval", "maxPupils", "maxStaff", "smsQuota", "updatedAt")
VALUES
    ('TRIAL',    'Trial',    '30-day free trial with core features.',                  0, 'MONTHLY', 100,  10,  100,  CURRENT_TIMESTAMP),
    ('BASIC',    'Basic',    'For small schools getting started.',                 15000, 'MONTHLY', 300,  20,  1000, CURRENT_TIMESTAMP),
    ('STANDARD', 'Standard', 'Growing schools with more staff and messaging.',     40000, 'MONTHLY', 1000, 60,  5000, CURRENT_TIMESTAMP),
    ('PREMIUM',  'Premium',  'Large schools — unlimited pupils, staff and SMS.',   90000, 'MONTHLY', NULL, NULL, NULL, CURRENT_TIMESTAMP);
