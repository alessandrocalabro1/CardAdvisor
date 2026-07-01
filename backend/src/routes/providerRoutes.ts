import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import * as providerStatusService from '../services/providerStatusService';
import { CardmarketExportProvider } from '../providers/cardmarketExportProvider';
import { requireAdminToken } from '../middleware/adminAuth';
import { adminRateLimiter } from '../middleware/rateLimit';

const router = Router();
const prisma = new PrismaClient();

// GET /api/providers/status
router.get('/status', async (req, res) => {
  try {
    const statuses = await providerStatusService.getProviderStatusesFromDb();
    res.json(statuses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/providers/check
router.post('/check', adminRateLimiter, requireAdminToken, async (req, res) => {
  try {
    const statuses = await providerStatusService.checkAllProvidersStatus();
    res.json(statuses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/providers/optcg/search
router.post('/optcg/search', async (req, res) => {
  try {
    const provider = providerStatusService.getProviderByName('OPTCG');
    if (!provider) {
      return res.status(500).json({ error: 'OPTCG provider not loaded' });
    }
    const query = req.body.query || '';
    const results = await provider.searchCard(query);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/providers/cardmarket/import-sample
router.post('/cardmarket/import-sample', adminRateLimiter, requireAdminToken, async (req, res) => {
  try {
    const provider = providerStatusService.getProviderByName('CARDMARKET_EXPORT') as CardmarketExportProvider;
    if (!provider) {
      return res.status(500).json({ error: 'Cardmarket export provider not loaded' });
    }

    const status = await provider.getStatus();
    if (status.status === 'NOT_CONFIGURED') {
      return res.status(400).json({ error: 'Cardmarket export file is missing.' });
    }

    const cards = await prisma.card.findMany();
    const importedPrices = [];

    for (const card of cards) {
      const priceResult = await provider.getPriceByCard(card);
      if (priceResult) {
        const created = await prisma.marketPrice.create({
          data: {
            cardId: card.id,
            source: 'CARDMARKET_EXPORT',
            rawPrice: priceResult.rawPrice ?? null,
            lowPrice: priceResult.lowPrice ?? null,
            trendPrice: priceResult.trendPrice ?? null,
            averagePrice: priceResult.averagePrice ?? null,
            currency: 'EUR',
            sourceProductId: priceResult.sourceProductId || null,
            productUrl: priceResult.productUrl || null,
            confidenceScore: priceResult.confidenceScore,
            rawPayloadJson: JSON.stringify(priceResult.rawPayload),
            lastUpdated: new Date(),
            dataQuality: priceResult.dataQuality || 'PUBLIC_EXPORT',
            providerMode: priceResult.providerMode || 'EXPORT',
            isMock: priceResult.isMock || false,
            isSeedData: priceResult.isSeedData || false,
            explanation: priceResult.explanation || null,
          },
        });
        importedPrices.push(created);
      }
    }

    res.json({
      message: `Successfully processed Cardmarket sheet. Created ${importedPrices.length} price references in local database.`,
      importedCount: importedPrices.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/providers/pricecharting/test
router.post('/pricecharting/test', adminRateLimiter, requireAdminToken, async (req, res) => {
  try {
    const provider = providerStatusService.getProviderByName('PRICECHARTING');
    if (!provider) {
      return res.status(500).json({ error: 'PriceCharting provider not loaded' });
    }

    const status = await provider.getStatus();
    if (status.status === 'NOT_CONFIGURED') {
      return res.json({
        configured: false,
        message: 'PRICECHARTING_API_TOKEN not set. Displaying simulated API connection test.',
        testResult: {
          source: 'PRICECHARTING',
          rawPrice: 505.0,
          gradedPrice: 1200.0,
          currency: 'USD',
          confidenceScore: 0.85,
          timestamp: new Date(),
          dataQuality: 'MOCK_TEST',
          isMock: true,
          providerMode: 'MOCK',
          explanation: 'Simulated connection test response.',
        },
      });
    }

    const results = await provider.searchCard('Shanks');
    res.json({
      configured: true,
      message: 'PriceCharting test query executed successfully.',
      testResult: results,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/providers/justtcg/test
router.post('/justtcg/test', adminRateLimiter, requireAdminToken, async (req, res) => {
  try {
    const provider = providerStatusService.getProviderByName('JUSTTCG');
    if (!provider) {
      return res.status(500).json({ error: 'JustTCG provider not loaded' });
    }

    const status = await provider.getStatus();
    if (status.status === 'NOT_CONFIGURED') {
      return res.json({
        configured: false,
        message: 'JUSTTCG_API_KEY not set. Displaying simulated API connection test.',
        testResult: {
          source: 'JUSTTCG',
          rawPrice: 485.0,
          currency: 'USD',
          confidenceScore: 0.8,
          timestamp: new Date(),
          dataQuality: 'MOCK_TEST',
          isMock: true,
          providerMode: 'MOCK',
          explanation: 'Simulated connection test response.',
        },
      });
    }

    const results = await provider.searchCard('Shanks');
    res.json({
      configured: true,
      message: 'JustTCG test query executed successfully.',
      testResult: results,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
