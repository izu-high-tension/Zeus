-- CreateEnum
CREATE TYPE "Species" AS ENUM ('DOG', 'CAT');

-- CreateEnum
CREATE TYPE "AttributeTrait" AS ENUM ('BEARD', 'BODY', 'EARS', 'EYES', 'EYEBROWS', 'FACE', 'NOSE', 'TAIL');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('MINT', 'PET_PURCHASE', 'LISTING_FEE', 'TOPUP');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'APPROVED', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DrawStatus" AS ENUM ('PENDING', 'REQUESTED', 'FULFILLED', 'PAID');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "piUid" TEXT NOT NULL,
    "username" TEXT,
    "walletAddress" TEXT,
    "referredById" TEXT,
    "vitality" INTEGER NOT NULL DEFAULT 0,
    "petBalance" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "generation" INTEGER NOT NULL,
    "tokenId" BIGINT NOT NULL,
    "contractAddr" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 137,
    "metadataCid" TEXT NOT NULL,
    "imageCid" TEXT NOT NULL,
    "rarityScore" INTEGER NOT NULL,
    "miningRate" DECIMAL(36,18) NOT NULL,
    "lastMinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mintedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetAttribute" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "trait" "AttributeTrait" NOT NULL,
    "value" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL,

    CONSTRAINT "PetAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "piPaymentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountPi" DECIMAL(36,18) NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "metadata" JSONB NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "txid" TEXT,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "accruedPet" DECIMAL(36,18) NOT NULL DEFAULT 0,

    CONSTRAINT "MiningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dividend" (
    "id" TEXT NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL,
    "totalPool" DECIMAL(36,18) NOT NULL,
    "perPetUnit" DECIMAL(36,18) NOT NULL,

    CONSTRAINT "Dividend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DividendPayout" (
    "id" TEXT NOT NULL,
    "dividendId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,

    CONSTRAINT "DividendPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotteryDraw" (
    "id" TEXT NOT NULL,
    "drawAt" TIMESTAMP(3) NOT NULL,
    "vrfRequestId" TEXT,
    "randomWord" TEXT,
    "winnerUserId" TEXT,
    "prizeAmount" DECIMAL(36,18) NOT NULL,
    "status" "DrawStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "LotteryDraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotteryEntry" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,

    CONSTRAINT "LotteryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "priceInPi" DECIMAL(36,18) NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldAt" TIMESTAMP(3),
    "buyerId" TEXT,

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "meta" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VitalityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "rewardPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_piUid_key" ON "User"("piUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_referredById_idx" ON "User"("referredById");

-- CreateIndex
CREATE UNIQUE INDEX "Pet_tokenId_key" ON "Pet"("tokenId");

-- CreateIndex
CREATE INDEX "Pet_ownerId_species_idx" ON "Pet"("ownerId", "species");

-- CreateIndex
CREATE UNIQUE INDEX "PetAttribute_petId_trait_key" ON "PetAttribute"("petId", "trait");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_piPaymentId_key" ON "Payment"("piPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "MiningSession_userId_startedAt_idx" ON "MiningSession"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DividendPayout_dividendId_userId_key" ON "DividendPayout"("dividendId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "LotteryDraw_vrfRequestId_key" ON "LotteryDraw"("vrfRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "LotteryEntry_drawId_userId_key" ON "LotteryEntry"("drawId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceListing_petId_key" ON "MarketplaceListing"("petId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_createdAt_idx" ON "MarketplaceListing"("status", "createdAt");

-- CreateIndex
CREATE INDEX "VitalityEvent_userId_createdAt_idx" ON "VitalityEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_refereeId_key" ON "Referral"("refereeId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetAttribute" ADD CONSTRAINT "PetAttribute_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiningSession" ADD CONSTRAINT "MiningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DividendPayout" ADD CONSTRAINT "DividendPayout_dividendId_fkey" FOREIGN KEY ("dividendId") REFERENCES "Dividend"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DividendPayout" ADD CONSTRAINT "DividendPayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryEntry" ADD CONSTRAINT "LotteryEntry_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "LotteryDraw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryEntry" ADD CONSTRAINT "LotteryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalityEvent" ADD CONSTRAINT "VitalityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.8.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
