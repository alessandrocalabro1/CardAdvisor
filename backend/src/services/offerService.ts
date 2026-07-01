import { PrismaClient } from '@prisma/client';
import { detectSuspiciousOffer } from '../utils/suspiciousDetection';
import { calculateFairPriceRange } from '../utils/fairPrice';

const prisma = new PrismaClient();

/**
 * Lists all manual seller offers logged for a card.
 */
export async function getOffersForCard(cardId: string) {
  return prisma.offer.findMany({
    where: { cardId },
    orderBy: { totalPrice: 'asc' },
  });
}

/**
 * Creates a new manual listing offer, automatically evaluating it for suspicious flags.
 */
export async function createOfferForCard(
  cardId: string,
  data: {
    marketplace: string;
    title: string;
    price: number;
    shipping: number;
    currency: string;
    condition: string;
    language: string;
    sellerReliability: string;
    url?: string;
    notes?: string;
  }
) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { marketPrices: true, snapshots: true, offers: true },
  });

  if (!card) throw new Error('Card not found');

  const fairRange = calculateFairPriceRange(card, card.marketPrices, card.snapshots, card.offers, 'EUR');
  
  // Detect suspicion
  const detection = detectSuspiciousOffer(
    {
      title: data.title,
      price: data.price,
      shipping: data.shipping,
      currency: data.currency,
      language: data.language,
      notes: data.notes,
    },
    card,
    fairRange.fairLow,
    fairRange.currency
  );

  const totalPrice = data.price + data.shipping;
  const confidenceScore = data.sellerReliability === 'HIGH' ? 0.9 : data.sellerReliability === 'MEDIUM' ? 0.7 : 0.4;

  return prisma.offer.create({
    data: {
      cardId,
      marketplace: data.marketplace,
      title: data.title,
      price: data.price,
      shipping: data.shipping,
      totalPrice,
      currency: data.currency,
      condition: data.condition,
      language: data.language,
      sellerReliability: data.sellerReliability,
      url: data.url || null,
      notes: data.notes || null,
      isSuspicious: detection.isSuspicious,
      suspiciousReasonsJson: JSON.stringify(detection.reasons),
      confidenceScore,
      dataQuality: 'MANUAL',
      providerMode: 'MANUAL',
      isMock: false,
      isSeedData: false,
      explanation: 'Manually logged by user.',
    },
  });
}

/**
 * Modifies an existing offer record, re-evaluating it for suspicious patterns.
 */
export async function updateOffer(
  id: string,
  data: Partial<{
    marketplace: string;
    title: string;
    price: number;
    shipping: number;
    currency: string;
    condition: string;
    language: string;
    sellerReliability: string;
    url: string;
    notes: string;
  }>
) {
  const current = await prisma.offer.findUnique({
    where: { id },
  });
  if (!current) throw new Error('Offer not found');

  const card = await prisma.card.findUnique({
    where: { id: current.cardId },
    include: { marketPrices: true, snapshots: true, offers: true },
  });
  if (!card) throw new Error('Card associated with the offer was not found.');

  const merged = { ...current, ...data };
  const fairRange = calculateFairPriceRange(card, card.marketPrices, card.snapshots, card.offers, 'EUR');

  const detection = detectSuspiciousOffer(
    {
      title: merged.title,
      price: merged.price,
      shipping: merged.shipping,
      currency: merged.currency,
      language: merged.language,
      notes: merged.notes,
    },
    card,
    fairRange.fairLow,
    fairRange.currency
  );

  const totalPrice = merged.price + merged.shipping;
  const confidenceScore = merged.sellerReliability === 'HIGH' ? 0.9 : merged.sellerReliability === 'MEDIUM' ? 0.7 : 0.4;

  return prisma.offer.update({
    where: { id },
    data: {
      ...data,
      totalPrice,
      isSuspicious: detection.isSuspicious,
      suspiciousReasonsJson: JSON.stringify(detection.reasons),
      confidenceScore,
      url: data.url !== undefined ? data.url : undefined,
      notes: data.notes !== undefined ? data.notes : undefined,
      dataQuality: 'MANUAL',
      providerMode: 'MANUAL',
      isMock: false,
      isSeedData: false,
      explanation: 'Manually logged by user.',
    },
  });
}

/**
 * Deletes a manual offer listing from the database.
 */
export async function deleteOffer(id: string) {
  return prisma.offer.delete({
    where: { id },
  });
}
