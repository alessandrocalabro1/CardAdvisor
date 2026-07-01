import { PrismaClient } from '@prisma/client';
import { calculateFairPriceRange } from '../utils/fairPrice';
import { calculateOpportunityScore } from '../utils/scoring';
import { detectSuspiciousOffer } from '../utils/suspiciousDetection';

const prisma = new PrismaClient();

/**
 * Fetches all tracked cards, attaching their calculated fair range and active opportunity statistics.
 */
export async function getCards() {
  const cards = await prisma.card.findMany({
    include: {
      marketPrices: true,
      snapshots: true,
      offers: true,
      portfolio: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return cards.map(card => {
    const fairRange = calculateFairPriceRange(card, card.marketPrices, card.snapshots, card.offers, 'EUR');
    
    // Find best opportunity score among active offers
    let bestScore = 0;
    let bestLabel = 'watch';
    
    if (card.offers.length > 0) {
      const scored = card.offers.map(o => {
        return calculateOpportunityScore(card, o, fairRange);
      });
      bestScore = Math.max(...scored.map(s => s.score));
      bestLabel = scored.find(s => s.score === bestScore)?.label || 'watch';
    }

    return {
      ...card,
      fairRange,
      bestOpportunityScore: bestScore,
      bestOpportunityLabel: bestLabel,
    };
  });
}

/**
 * Retrieves a single card with its related lists, calculating pricing references,
 * suspicious listing warnings, and opportunity rankings.
 */
export async function getCardById(id: string) {
  const card = await prisma.card.findUnique({
    where: { id },
    include: {
      marketPrices: { orderBy: { lastUpdated: 'desc' } },
      offers: { orderBy: { totalPrice: 'asc' } },
      portfolio: { orderBy: { purchaseDate: 'desc' } },
      snapshots: { orderBy: { date: 'asc' } },
      alerts: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!card) return null;

  const fairRange = calculateFairPriceRange(card, card.marketPrices, card.snapshots, card.offers, 'EUR');

  // Enrich offers with dynamic suspicious detection & opportunity score
  const enrichedOffers = card.offers.map(offer => {
    const suspicion = detectSuspiciousOffer(offer, card, fairRange.fairLow, fairRange.currency);
    
    // Update offer fields if they differ from static database values
    const isSuspicious = suspicion.isSuspicious;
    const suspiciousReasonsJson = JSON.stringify(suspicion.reasons);
    
    const scoreResult = calculateOpportunityScore(card, {
      ...offer,
      isSuspicious,
    }, fairRange);

    return {
      ...offer,
      isSuspicious,
      suspiciousReasonsJson,
      opportunityScore: scoreResult.score,
      opportunityLabel: scoreResult.label,
      opportunityExplanation: scoreResult.explanation,
    };
  });

  // Sort offers from highest score (best opportunity) to lowest
  enrichedOffers.sort((a, b) => b.opportunityScore - a.opportunityScore);

  return {
    ...card,
    fairRange,
    offers: enrichedOffers,
  };
}

/**
 * Creates a new card record in the catalog.
 */
export async function createCard(data: {
  game: string;
  name: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  language: string;
  version: string;
  condition: string;
  imageUrl?: string;
  notes?: string;
  status: string;
  demandLevel: string;
  supplyLevel: string;
  reprintRisk: string;
}) {
  return prisma.card.create({
    data: {
      game: data.game,
      name: data.name,
      setName: data.setName,
      cardNumber: data.cardNumber,
      rarity: data.rarity,
      language: data.language,
      version: data.version,
      condition: data.condition,
      imageUrl: data.imageUrl || null,
      notes: data.notes || null,
      status: data.status,
      demandLevel: data.demandLevel,
      supplyLevel: data.supplyLevel,
      reprintRisk: data.reprintRisk,
    },
  });
}

/**
 * Updates metadata fields of an existing card record.
 */
export async function updateCard(
  id: string,
  data: Partial<{
    game: string;
    name: string;
    setName: string;
    cardNumber: string;
    rarity: string;
    language: string;
    version: string;
    condition: string;
    imageUrl: string;
    notes: string;
    status: string;
    demandLevel: string;
    supplyLevel: string;
    reprintRisk: string;
  }>
) {
  return prisma.card.update({
    where: { id },
    data: {
      ...data,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
      notes: data.notes !== undefined ? data.notes : undefined,
    },
  });
}

/**
 * Deletes a card record and cascade-deletes all child tables.
 */
export async function deleteCard(id: string) {
  return prisma.card.delete({
    where: { id },
  });
}
