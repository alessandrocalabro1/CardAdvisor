import { PrismaClient } from '@prisma/client';

/**
 * Exports all database records into a single JSON object.
 */
export async function exportDatabaseBackup(prisma: PrismaClient): Promise<any> {
  const cards = await prisma.card.findMany();
  const marketPrices = await prisma.marketPrice.findMany();
  const offers = await prisma.offer.findMany();
  const portfolioItems = await prisma.portfolioItem.findMany();
  const priceSnapshots = await prisma.priceSnapshot.findMany();
  const alerts = await prisma.alert.findMany();
  const providerStatuses = await prisma.providerStatus.findMany();
  const weeklyStrategies = await prisma.weeklyStrategy.findMany();

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      cards,
      marketPrices,
      offers,
      portfolioItems,
      priceSnapshots,
      alerts,
      providerStatuses,
      weeklyStrategies,
    },
  };
}

/**
 * Transactionally replaces all database content with records from a JSON backup.
 */
export async function importDatabaseBackup(prisma: PrismaClient, backup: any): Promise<void> {
  if (!backup || backup.version !== '1.0.0' || !backup.data) {
    throw new Error('Invalid backup schema. Make sure the version is 1.0.0.');
  }

  const { cards, marketPrices, offers, portfolioItems, priceSnapshots, alerts, providerStatuses, weeklyStrategies } = backup.data;

  await prisma.$transaction(async (tx) => {
    // 1. Wipe everything
    await tx.alert.deleteMany();
    await tx.portfolioItem.deleteMany();
    await tx.offer.deleteMany();
    await tx.marketPrice.deleteMany();
    await tx.priceSnapshot.deleteMany();
    await tx.providerStatus.deleteMany();
    await tx.weeklyStrategy.deleteMany();
    await tx.card.deleteMany();

    // 2. Re-populate in order
    if (cards && cards.length > 0) {
      await tx.card.createMany({
        data: cards.map((c: any) => ({
          ...c,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        })),
      });
    }

    if (marketPrices && marketPrices.length > 0) {
      await tx.marketPrice.createMany({
        data: marketPrices.map((m: any) => ({
          ...m,
          lastUpdated: m.lastUpdated ? new Date(m.lastUpdated) : new Date(),
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        })),
      });
    }

    if (offers && offers.length > 0) {
      await tx.offer.createMany({
        data: offers.map((o: any) => ({
          ...o,
          createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
          updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(),
        })),
      });
    }

    if (portfolioItems && portfolioItems.length > 0) {
      await tx.portfolioItem.createMany({
        data: portfolioItems.map((p: any) => ({
          ...p,
          purchaseDate: p.purchaseDate ? new Date(p.purchaseDate) : new Date(),
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        })),
      });
    }

    if (priceSnapshots && priceSnapshots.length > 0) {
      await tx.priceSnapshot.createMany({
        data: priceSnapshots.map((s: any) => ({
          ...s,
          date: s.date ? new Date(s.date) : new Date(),
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        })),
      });
    }

    if (alerts && alerts.length > 0) {
      await tx.alert.createMany({
        data: alerts.map((a: any) => ({
          ...a,
          createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
          updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
        })),
      });
    }

    if (providerStatuses && providerStatuses.length > 0) {
      for (const ps of providerStatuses) {
        await tx.providerStatus.upsert({
          where: { providerName: ps.providerName },
          update: {
            status: ps.status,
            message: ps.message,
            lastCheckedAt: ps.lastCheckedAt ? new Date(ps.lastCheckedAt) : new Date(),
          },
          create: {
            providerName: ps.providerName,
            status: ps.status,
            message: ps.message,
            lastCheckedAt: ps.lastCheckedAt ? new Date(ps.lastCheckedAt) : new Date(),
          },
        });
      }
    }

    if (weeklyStrategies && weeklyStrategies.length > 0) {
      await tx.weeklyStrategy.createMany({
        data: weeklyStrategies.map((s: any) => ({
          ...s,
          weekStartDate: new Date(s.weekStartDate),
          weekEndDate: new Date(s.weekEndDate),
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        })),
      });
    }
  });
}
