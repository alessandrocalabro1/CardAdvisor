-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setName" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "imageUrl" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "demandLevel" TEXT NOT NULL,
    "supplyLevel" TEXT NOT NULL,
    "reprintRisk" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPrice" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "rawPrice" DOUBLE PRECISION,
    "gradedPrice" DOUBLE PRECISION,
    "lowPrice" DOUBLE PRECISION,
    "trendPrice" DOUBLE PRECISION,
    "averagePrice" DOUBLE PRECISION,
    "medianPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL,
    "language" TEXT,
    "condition" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceProductId" TEXT,
    "productUrl" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "rawPayloadJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataQuality" TEXT NOT NULL DEFAULT 'REAL_PROVIDER',
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    "providerMode" TEXT NOT NULL DEFAULT 'LIVE',
    "explanation" TEXT,

    CONSTRAINT "MarketPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "shipping" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "sellerReliability" TEXT NOT NULL,
    "url" TEXT,
    "notes" TEXT,
    "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "suspiciousReasonsJson" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataQuality" TEXT NOT NULL DEFAULT 'MANUAL',
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    "providerMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "explanation" TEXT,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "shipping" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "marketplace" TEXT,
    "seller" TEXT,
    "estimatedCurrentValue" DOUBLE PRECISION,
    "theoreticalProfitLoss" DOUBLE PRECISION,
    "roiPercentage" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "minPrice" DOUBLE PRECISION,
    "maxPrice" DOUBLE PRECISION,
    "averagePrice" DOUBLE PRECISION,
    "medianPrice" DOUBLE PRECISION,
    "fairLow" DOUBLE PRECISION,
    "fairHigh" DOUBLE PRECISION,
    "listingOrSampleCount" INTEGER,
    "confidenceAvg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "targetPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "marketplace" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "triggered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderStatus" (
    "id" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyStrategy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "marketSummary" TEXT NOT NULL,
    "cardsToWatch" TEXT NOT NULL,
    "cardsToAvoid" TEXT NOT NULL,
    "buyZoneNotes" TEXT NOT NULL,
    "sellZoneNotes" TEXT NOT NULL,
    "riskNotes" TEXT NOT NULL,
    "relatedCardIdsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderStatus_providerName_key" ON "ProviderStatus"("providerName");

-- AddForeignKey
ALTER TABLE "MarketPrice" ADD CONSTRAINT "MarketPrice_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
