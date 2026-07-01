import { PrismaClient } from '@prisma/client';
import { OptcgProvider } from '../providers/optcgProvider';
import { CardmarketExportProvider } from '../providers/cardmarketExportProvider';
import { PriceChartingProvider } from '../providers/pricechartingProvider';
import { JustTcgProvider } from '../providers/justtcgProvider';
import { ManualProvider } from '../providers/manualProvider';

const prisma = new PrismaClient();

const providers = [
  new OptcgProvider(),
  new CardmarketExportProvider(),
  new PriceChartingProvider(),
  new JustTcgProvider(),
  new ManualProvider()
];

/**
 * Iterates through all registered providers, checks their system health,
 * and records their status in the SQLite database.
 */
export async function checkAllProvidersStatus() {
  const results = [];
  for (const provider of providers) {
    const status = await provider.getStatus();
    const updated = await prisma.providerStatus.upsert({
      where: { providerName: provider.providerName },
      update: {
        status: status.status,
        message: status.message,
        lastCheckedAt: new Date(),
      },
      create: {
        providerName: provider.providerName,
        status: status.status,
        message: status.message,
        lastCheckedAt: new Date(),
      },
    });
    results.push(updated);
  }
  return results;
}

/**
 * Fetches the list of all registered provider statuses from the database.
 */
export async function getProviderStatusesFromDb() {
  return prisma.providerStatus.findMany();
}

/**
 * Returns a provider instance matching the name.
 */
export function getProviderByName(name: string) {
  return providers.find(p => p.providerName.toUpperCase() === name.toUpperCase()) || null;
}

/**
 * Returns all provider instances.
 */
export function getAllProviders() {
  return providers;
}
