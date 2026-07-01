import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fetches all registered alerts, including their card details.
 */
export async function getAlerts() {
  return prisma.alert.findMany({
    include: {
      card: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Creates a price target alert.
 */
export async function createAlert(data: {
  cardId: string;
  targetPrice: number;
  currency: string;
  marketplace?: string;
}) {
  return prisma.alert.create({
    data: {
      cardId: data.cardId,
      targetPrice: data.targetPrice,
      currency: data.currency,
      marketplace: data.marketplace || null,
      active: true,
      triggered: false,
    },
  });
}

/**
 * Updates status or configuration fields of an alert.
 */
export async function updateAlert(
  id: string,
  data: Partial<{
    targetPrice: number;
    currency: string;
    marketplace: string;
    active: boolean;
    triggered: boolean;
  }>
) {
  return prisma.alert.update({
    where: { id },
    data: {
      ...data,
      marketplace: data.marketplace !== undefined ? data.marketplace : undefined,
    },
  });
}

/**
 * Deletes an alert record.
 */
export async function deleteAlert(id: string) {
  return prisma.alert.delete({
    where: { id },
  });
}

/**
 * Scans active alerts for a card and marks them as triggered if price thresholds are reached.
 */
export async function evaluatePriceAlerts(cardId: string, currentPrice: number) {
  const activeAlerts = await prisma.alert.findMany({
    where: { cardId, active: true, triggered: false },
  });

  const triggeredAlertIds: string[] = [];

  for (const alert of activeAlerts) {
    // If the card price is equal to or lower than the targetPrice, trigger it
    if (currentPrice <= alert.targetPrice) {
      await prisma.alert.update({
        where: { id: alert.id },
        data: { triggered: true },
      });
      triggeredAlertIds.push(alert.id);
    }
  }

  return triggeredAlertIds;
}
