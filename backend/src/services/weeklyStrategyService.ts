import { PrismaClient } from '@prisma/client';
import { isCardReferencedByStrategy } from '../utils/strategyReferences';

const prisma = new PrismaClient();

function getSnippet(text: string | null | undefined, length = 120): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Loads all weekly strategies, parses their card links safely,
 * and returns details for strategies matching the target card.
 */
export async function getWeeklyStrategyReferencesForCard(cardId: string) {
  const allStrategies = await prisma.weeklyStrategy.findMany({
    orderBy: { weekStartDate: 'desc' },
  });

  const matching = allStrategies.filter(strategy => 
    isCardReferencedByStrategy(cardId, strategy.relatedCardIdsJson)
  );

  return matching.map(s => ({
    id: s.id,
    title: s.title,
    weekStartDate: s.weekStartDate,
    weekEndDate: s.weekEndDate,
    marketSummary: getSnippet(s.marketSummary),
    cardsToWatch: getSnippet(s.cardsToWatch),
    cardsToAvoid: getSnippet(s.cardsToAvoid),
    buyZoneNotes: getSnippet(s.buyZoneNotes),
    sellZoneNotes: getSnippet(s.sellZoneNotes),
    riskNotes: getSnippet(s.riskNotes),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
}
