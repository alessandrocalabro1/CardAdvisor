import { PrismaClient } from '@prisma/client';
import { calculateFairPriceRange } from '../utils/fairPrice';

const prisma = new PrismaClient();

/**
 * Lists all portfolio items, recalculating current value, net P/L, and ROI on the fly.
 */
export async function getPortfolioItems() {
  const items = await prisma.portfolioItem.findMany({
    include: {
      card: {
        include: {
          marketPrices: true,
          snapshots: true,
          offers: true,
        },
      },
    },
    orderBy: { purchaseDate: 'desc' },
  });

  return items.map(item => {
    const card = item.card;
    const fairRange = calculateFairPriceRange(card, card.marketPrices, card.snapshots, card.offers, 'EUR');
    
    const estimatedCurrentValue = fairRange.referencePrice || item.purchasePrice;
    const totalCost = item.purchasePrice + item.shipping;
    const theoreticalProfitLoss = estimatedCurrentValue - totalCost;
    const roiPercentage = totalCost > 0 ? (theoreticalProfitLoss / totalCost) * 100 : 0;

    return {
      ...item,
      totalCost,
      estimatedCurrentValue,
      theoreticalProfitLoss,
      roiPercentage,
    };
  });
}

/**
 * Adds a new collectible card to the portfolio, automatically updating the card status to OWNED.
 */
export async function createPortfolioItem(data: {
  cardId: string;
  purchasePrice: number;
  shipping: number;
  purchaseDate: Date;
  marketplace?: string;
  seller?: string;
  notes?: string;
}) {
  const totalCost = data.purchasePrice + data.shipping;

  const card = await prisma.card.findUnique({
    where: { id: data.cardId },
    include: { marketPrices: true, snapshots: true, offers: true },
  });
  if (!card) throw new Error('Card not found');

  const fairRange = calculateFairPriceRange(card, card.marketPrices, card.snapshots, card.offers, 'EUR');
  const estimatedCurrentValue = fairRange.referencePrice || data.purchasePrice;
  const theoreticalProfitLoss = estimatedCurrentValue - totalCost;
  const roiPercentage = totalCost > 0 ? (theoreticalProfitLoss / totalCost) * 100 : 0;

  // Set card status to OWNED in database
  await prisma.card.update({
    where: { id: data.cardId },
    data: { status: 'OWNED' },
  });

  return prisma.portfolioItem.create({
    data: {
      cardId: data.cardId,
      purchasePrice: data.purchasePrice,
      shipping: data.shipping,
      totalCost,
      purchaseDate: new Date(data.purchaseDate),
      marketplace: data.marketplace || null,
      seller: data.seller || null,
      notes: data.notes || null,
      estimatedCurrentValue,
      theoreticalProfitLoss,
      roiPercentage,
    },
  });
}

/**
 * Updates financial records of an owned copy.
 */
export async function updatePortfolioItem(
  id: string,
  data: Partial<{
    purchasePrice: number;
    shipping: number;
    purchaseDate: Date;
    marketplace: string;
    seller: string;
    notes: string;
  }>
) {
  const current = await prisma.portfolioItem.findUnique({
    where: { id },
  });
  if (!current) throw new Error('Portfolio item not found');

  const merged = { ...current, ...data };
  const totalCost = merged.purchasePrice + merged.shipping;

  const card = await prisma.card.findUnique({
    where: { id: merged.cardId },
    include: { marketPrices: true, snapshots: true, offers: true },
  });
  if (!card) throw new Error('Card associated with the portfolio item not found.');

  const fairRange = calculateFairPriceRange(card, card.marketPrices, card.snapshots, card.offers, 'EUR');
  const estimatedCurrentValue = fairRange.referencePrice || merged.purchasePrice;
  const theoreticalProfitLoss = estimatedCurrentValue - totalCost;
  const roiPercentage = totalCost > 0 ? (theoreticalProfitLoss / totalCost) * 100 : 0;

  return prisma.portfolioItem.update({
    where: { id },
    data: {
      ...data,
      totalCost,
      estimatedCurrentValue,
      theoreticalProfitLoss,
      roiPercentage,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      marketplace: data.marketplace !== undefined ? data.marketplace : undefined,
      seller: data.seller !== undefined ? data.seller : undefined,
      notes: data.notes !== undefined ? data.notes : undefined,
    },
  });
}

/**
 * Deletes a portfolio item, resetting card status to WATCH if no other copies are owned.
 */
export async function deletePortfolioItem(id: string) {
  const item = await prisma.portfolioItem.findUnique({
    where: { id },
  });

  if (item) {
    const otherCopies = await prisma.portfolioItem.findMany({
      where: {
        cardId: item.cardId,
        id: { not: id },
      },
    });

    if (otherCopies.length === 0) {
      await prisma.card.update({
        where: { id: item.cardId },
        data: { status: 'WATCH' },
      });
    }
  }

  return prisma.portfolioItem.delete({
    where: { id },
  });
}
