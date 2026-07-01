import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clear database
  await prisma.alert.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.marketPrice.deleteMany();
  await prisma.priceSnapshot.deleteMany();
  await prisma.providerStatus.deleteMany();
  await prisma.weeklyStrategy.deleteMany();
  await prisma.card.deleteMany();

  console.log('Database cleared.');

  // 2. Create Cards
  const shanks = await prisma.card.create({
    data: {
      id: 'shanks-op01-120',
      game: 'One Piece',
      name: 'Shanks (Parallel)',
      setName: 'Romance Dawn',
      cardNumber: 'OP01-120',
      rarity: 'SEC',
      language: 'English',
      version: 'Parallel Alt Art',
      condition: 'Near Mint',
      notes: 'Grail card from Romance Dawn. Watching closely for price drops.',
      status: 'WATCH',
      demandLevel: 'HIGH',
      supplyLevel: 'LOW',
      reprintRisk: 'LOW',
    },
  });

  const nami = await prisma.card.create({
    data: {
      id: 'nami-op01-016',
      game: 'One Piece',
      name: 'Nami (Parallel)',
      setName: 'Romance Dawn',
      cardNumber: 'OP01-016',
      rarity: 'R',
      language: 'English',
      version: 'Parallel Alt Art',
      condition: 'Near Mint',
      notes: 'Highly playable red searcher. Price remains high but volatile.',
      status: 'CONSIDER',
      demandLevel: 'HIGH',
      supplyLevel: 'MEDIUM',
      reprintRisk: 'MEDIUM',
    },
  });

  const luffy = await prisma.card.create({
    data: {
      id: 'luffy-op05-119',
      game: 'One Piece',
      name: 'Monkey.D.Luffy',
      setName: 'Awakening of the New Era',
      cardNumber: 'OP05-119',
      rarity: 'SEC',
      language: 'English',
      version: 'Regular',
      condition: 'Near Mint',
      notes: 'Standard Secret Rare of Gear 5 Luffy. Added to portfolio.',
      status: 'OWNED',
      demandLevel: 'MEDIUM',
      supplyLevel: 'HIGH',
      reprintRisk: 'LOW',
    },
  });

  const zoro = await prisma.card.create({
    data: {
      id: 'zoro-op01-025',
      game: 'One Piece',
      name: 'Roronoa Zoro',
      setName: 'Romance Dawn',
      cardNumber: 'OP01-025',
      rarity: 'SR',
      language: 'English',
      version: 'Regular Super Rare',
      condition: 'Near Mint',
      notes: 'Core card for Red aggro decks. Monitor reprint risk.',
      status: 'WATCH',
      demandLevel: 'HIGH',
      supplyLevel: 'MEDIUM',
      reprintRisk: 'HIGH',
    },
  });

  console.log('Cards seeded.');

  // 3. Create Market Prices
  await prisma.marketPrice.createMany({
    data: [
      // Shanks OP01-120
      {
        cardId: shanks.id,
        source: 'CARDMARKET_EXPORT',
        rawPrice: 475.0,
        lowPrice: 450.0,
        trendPrice: 480.0,
        averagePrice: 475.0,
        currency: 'EUR',
        language: 'English',
        condition: 'Near Mint',
        confidenceScore: 0.9,
        lastUpdated: new Date(),
        dataQuality: 'SEED_SAMPLE',
        isSeedData: true,
        isMock: false,
        providerMode: 'MOCK',
        explanation: 'Seeded Cardmarket public export sample.',
      },
      {
        cardId: shanks.id,
        source: 'PRICECHARTING',
        rawPrice: 510.0,
        averagePrice: 505.0,
        currency: 'USD',
        language: 'English',
        condition: 'Near Mint',
        confidenceScore: 0.85,
        lastUpdated: new Date(),
        dataQuality: 'SEED_SAMPLE',
        isSeedData: true,
        isMock: true,
        providerMode: 'MOCK',
        explanation: 'Seeded PriceCharting sample record. Not a live query.',
      },
      {
        cardId: shanks.id,
        source: 'JUSTTCG',
        rawPrice: 490.0,
        currency: 'USD',
        language: 'English',
        condition: 'Near Mint',
        confidenceScore: 0.8,
        lastUpdated: new Date(),
        dataQuality: 'SEED_SAMPLE',
        isSeedData: true,
        isMock: true,
        providerMode: 'MOCK',
        explanation: 'Seeded JustTCG sample record. Not a live query.',
      },

      // Nami OP01-016
      {
        cardId: nami.id,
        source: 'CARDMARKET_EXPORT',
        rawPrice: 190.0,
        lowPrice: 180.0,
        trendPrice: 195.0,
        averagePrice: 190.0,
        currency: 'EUR',
        language: 'English',
        condition: 'Near Mint',
        confidenceScore: 0.9,
        lastUpdated: new Date(),
        dataQuality: 'SEED_SAMPLE',
        isSeedData: true,
        isMock: false,
        providerMode: 'MOCK',
        explanation: 'Seeded Cardmarket public export sample.',
      },
      {
        cardId: nami.id,
        source: 'PRICECHARTING',
        rawPrice: 205.0,
        averagePrice: 200.0,
        currency: 'USD',
        language: 'English',
        condition: 'Near Mint',
        confidenceScore: 0.85,
        lastUpdated: new Date(),
        dataQuality: 'SEED_SAMPLE',
        isSeedData: true,
        isMock: true,
        providerMode: 'MOCK',
        explanation: 'Seeded PriceCharting sample record. Not a live query.',
      },

      // Luffy OP05-119
      {
        cardId: luffy.id,
        source: 'CARDMARKET_EXPORT',
        rawPrice: 13.8,
        lowPrice: 12.5,
        trendPrice: 14.0,
        averagePrice: 13.8,
        currency: 'EUR',
        language: 'English',
        condition: 'Near Mint',
        confidenceScore: 0.9,
        lastUpdated: new Date(),
        dataQuality: 'SEED_SAMPLE',
        isSeedData: true,
        isMock: false,
        providerMode: 'MOCK',
        explanation: 'Seeded Cardmarket public export sample.',
      },

      // Zoro OP01-025
      {
        cardId: zoro.id,
        source: 'CARDMARKET_EXPORT',
        rawPrice: 16.5,
        lowPrice: 15.0,
        trendPrice: 17.2,
        averagePrice: 16.5,
        currency: 'EUR',
        language: 'English',
        condition: 'Near Mint',
        confidenceScore: 0.9,
        lastUpdated: new Date(),
        dataQuality: 'SEED_SAMPLE',
        isSeedData: true,
        isMock: false,
        providerMode: 'MOCK',
        explanation: 'Seeded Cardmarket public export sample.',
      },
    ],
  });

  console.log('Market prices seeded.');

  // 4. Create Offers
  await prisma.offer.createMany({
    data: [
      // Shanks OP01-120
      {
        cardId: shanks.id,
        marketplace: 'VINTED',
        title: 'Shanks OP01-120 SEC Alt Art',
        price: 390.0,
        shipping: 10.0,
        totalPrice: 400.0,
        currency: 'EUR',
        condition: 'Near Mint',
        language: 'English',
        sellerReliability: 'MEDIUM',
        url: 'https://www.vinted.fr/items/123-shanks',
        notes: 'Price is below trend. Photos look genuine, but ask for back photos to double-check condition.',
        isSuspicious: false,
        confidenceScore: 0.8,
        dataQuality: 'SEED_SAMPLE',
        isSeedData: true,
        isMock: false,
        providerMode: 'MOCK',
        explanation: 'Seeded sample offer listing.',
      },
      {
        cardId: shanks.id,
        marketplace: 'FACEBOOK',
        title: 'Romance Dawn Shanks Alt Art',
        price: 520.0,
        shipping: 0.0,
        totalPrice: 520.0,
        currency: 'EUR',
        condition: 'Near Mint',
        language: 'English',
        sellerReliability: 'LOW',
        url: 'https://facebook.com/marketplace/item/456',
        notes: 'Local meetup only. Seller has no ratings.',
        isSuspicious: false,
        confidenceScore: 0.6,
        dataQuality: 'SEED_SAMPLE',
        isSeedData: true,
        isMock: false,
        providerMode: 'MOCK',
        explanation: 'Seeded sample offer listing.',
      },
      {
        cardId: shanks.id,
        marketplace: 'PRIVATE',
        title: 'Custom Shanks OP01-120 proxy card replica',
        price: 35.0,
        shipping: 2.0,
        totalPrice: 37.0,
        currency: 'EUR',
        condition: 'Near Mint',
        language: 'English',
        sellerReliability: 'MEDIUM',
        notes: 'Replica card, obviously fake.',
        isSuspicious: true,
        suspiciousReasonsJson: JSON.stringify(['Contains keyword replica/proxy', 'Extremely low price compared to market range']),
        confidenceScore: 0.9,
        dataQuality: 'SEED_SAMPLE',
        isSeedData: true,
        isMock: false,
        providerMode: 'MOCK',
        explanation: 'Seeded sample offer listing.',
      },

      // Luffy OP05-119
      {
        cardId: luffy.id,
        marketplace: 'TELEGRAM',
        title: 'OP05 Luffy SEC raw',
        price: 10.0,
        shipping: 2.0,
        totalPrice: 12.0,
        currency: 'EUR',
        condition: 'Near Mint',
        language: 'English',
        sellerReliability: 'HIGH',
        notes: 'From reputable seller in local chat.',
        isSuspicious: false,
        confidenceScore: 0.95,
        dataQuality: 'SEED_SAMPLE',
        isSeedData: true,
        isMock: false,
        providerMode: 'MOCK',
        explanation: 'Seeded sample offer listing.',
      },
    ],
  });

  console.log('Offers seeded.');

  // 5. Create Portfolio Items
  await prisma.portfolioItem.create({
    data: {
      cardId: luffy.id,
      purchasePrice: 12.0,
      shipping: 2.0,
      totalCost: 14.0,
      purchaseDate: new Date('2026-06-15'),
      marketplace: 'PRIVATE',
      seller: 'JohnDoe TCG',
      estimatedCurrentValue: 13.8,
      theoreticalProfitLoss: -0.2,
      roiPercentage: -1.43,
      notes: 'Added standard raw copy for play.',
    },
  });

  console.log('Portfolio items seeded.');

  // 6. Create Price Snapshots
  await prisma.priceSnapshot.createMany({
    data: [
      {
        cardId: shanks.id,
        date: new Date('2026-06-01'),
        source: 'CARDMARKET_EXPORT',
        minPrice: 440.0,
        maxPrice: 490.0,
        averagePrice: 470.0,
        medianPrice: 472.0,
        fairLow: 432.4,
        fairHigh: 507.6,
        listingOrSampleCount: 12,
        confidenceAvg: 0.9,
      },
      {
        cardId: shanks.id,
        date: new Date('2026-06-15'),
        source: 'CARDMARKET_EXPORT',
        minPrice: 445.0,
        maxPrice: 495.0,
        averagePrice: 473.0,
        medianPrice: 475.0,
        fairLow: 435.16,
        fairHigh: 510.84,
        listingOrSampleCount: 14,
        confidenceAvg: 0.9,
      },
      {
        cardId: shanks.id,
        date: new Date('2026-07-01'),
        source: 'CARDMARKET_EXPORT',
        minPrice: 450.0,
        maxPrice: 480.0,
        averagePrice: 475.0,
        medianPrice: 475.0,
        fairLow: 437.0,
        fairHigh: 513.0,
        listingOrSampleCount: 10,
        confidenceAvg: 0.9,
      },
    ],
  });

  console.log('Price snapshots seeded.');

  // 7. Create Provider Status
  await prisma.providerStatus.createMany({
    data: [
      {
        providerName: 'OPTCG',
        status: 'AVAILABLE',
        message: 'Mock Card search and metadata resolver fully active.',
        lastCheckedAt: new Date(),
      },
      {
        providerName: 'CARDMARKET_EXPORT',
        status: 'AVAILABLE',
        message: 'Cardmarket public export parsing available. Sample data loaded.',
        lastCheckedAt: new Date(),
      },
      {
        providerName: 'PRICECHARTING',
        status: 'NOT_CONFIGURED',
        message: 'PRICECHARTING_API_TOKEN is not defined in backend/.env config.',
        lastCheckedAt: new Date(),
      },
      {
        providerName: 'JUSTTCG',
        status: 'NOT_CONFIGURED',
        message: 'JUSTTCG_API_KEY is not defined in backend/.env config.',
        lastCheckedAt: new Date(),
      },
      {
        providerName: 'MANUAL',
        status: 'AVAILABLE',
        message: 'Manual price feeds and list import services active.',
        lastCheckedAt: new Date(),
      },
    ],
  });

  console.log('Provider statuses seeded.');

  // 8. Create Weekly Strategy
  await prisma.weeklyStrategy.create({
    data: {
      title: 'Romance Dawn Alt-Art Market Outlook',
      weekStartDate: new Date('2026-06-29'),
      weekEndDate: new Date('2026-07-05'),
      marketSummary: 'Romance Dawn alt-arts are stabilizing this week. General listing volume is holding steady, but local private sellers are posting interesting offers with minor price drops. Overall trading volume remains moderate.',
      cardsToWatch: 'Shanks (Parallel) SEC (OP01-120) alt-art shows high local demand; watch for private offers under €400.',
      cardsToAvoid: 'Avoid cards with high reprint risk and low playability ratings in current meta.',
      buyZoneNotes: 'Shanks OP01-120: buy zone to verify is between €380 and €410. Nami OP01-016 parallel: buy zone to verify is between €175 and €190.',
      sellZoneNotes: 'Shanks OP01-120 parallel: sell zone to verify is above €500. Nami OP01-016 parallel: sell zone to verify is above €210.',
      riskNotes: 'High volatility in secondary marketplaces like Vinted and Facebook Marketplace. Be cautious about replica listings and unrated sellers.',
      relatedCardIdsJson: JSON.stringify(['shanks-op01-120', 'nami-op01-016']),
    }
  });

  console.log('Weekly strategies seeded.');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
