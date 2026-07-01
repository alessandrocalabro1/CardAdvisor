import { Router } from 'express';
import * as cardService from '../services/cardService';
import * as priceService from '../services/marketPriceService';
import * as offerService from '../services/offerService';
import * as snapshotService from '../services/snapshotService';
import { generateDecisionBrief } from '../utils/decisionBrief';
import { getWeeklyStrategyReferencesForCard } from '../services/weeklyStrategyService';

const router = Router();

// GET /api/cards
router.get('/', async (req, res) => {
  try {
    const cards = await cardService.getCards();
    res.json(cards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cards/:id
router.get('/:id', async (req, res) => {
  try {
    const card = await cardService.getCardById(req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json(card);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cards
router.post('/', async (req, res) => {
  try {
    const card = await cardService.createCard(req.body);
    res.status(201).json(card);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/cards/:id
router.put('/:id', async (req, res) => {
  try {
    const card = await cardService.updateCard(req.params.id, req.body);
    res.json(card);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/cards/:id
router.delete('/:id', async (req, res) => {
  try {
    await cardService.deleteCard(req.params.id);
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cards/:id/market-prices
router.get('/:id/market-prices', async (req, res) => {
  try {
    const prices = await priceService.getMarketPricesForCard(req.params.id);
    res.json(prices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cards/:id/market-prices/manual
router.post('/:id/market-prices/manual', async (req, res) => {
  try {
    const price = await priceService.createManualMarketPrice(req.params.id, req.body);
    res.status(201).json(price);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/cards/:id/refresh-prices
router.post('/:id/refresh-prices', async (req, res) => {
  try {
    const prices = await priceService.refreshPricesForCard(req.params.id);
    res.json({ message: 'Prices refreshed successfully', data: prices });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cards/:id/offers
router.get('/:id/offers', async (req, res) => {
  try {
    const offers = await offerService.getOffersForCard(req.params.id);
    res.json(offers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cards/:id/offers
router.post('/:id/offers', async (req, res) => {
  try {
    const offer = await offerService.createOfferForCard(req.params.id, req.body);
    res.status(201).json(offer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/cards/:id/snapshots
router.get('/:id/snapshots', async (req, res) => {
  try {
    const snapshots = await snapshotService.getSnapshotsForCard(req.params.id);
    res.json(snapshots);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cards/:id/snapshots/create
router.post('/:id/snapshots/create', async (req, res) => {
  try {
    const snapshot = await snapshotService.createSnapshotForCard(req.params.id);
    res.status(201).json(snapshot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cards/:id/decision-brief
router.get('/:id/decision-brief', async (req, res) => {
  try {
    const card = await cardService.getCardById(req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const brief = generateDecisionBrief(
      card,
      card.marketPrices || [],
      card.offers || [],
      card.fairRange
    );

    res.json(brief);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cards/:id/weekly-strategy-references
router.get('/:id/weekly-strategy-references', async (req, res) => {
  try {
    const refs = await getWeeklyStrategyReferencesForCard(req.params.id);
    res.json(refs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
