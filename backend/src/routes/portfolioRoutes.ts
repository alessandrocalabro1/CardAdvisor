import { Router } from 'express';
import * as portfolioService from '../services/portfolioService';

const router = Router();

// GET /api/portfolio
router.get('/', async (req, res) => {
  try {
    const items = await portfolioService.getPortfolioItems();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/portfolio
router.post('/', async (req, res) => {
  try {
    const item = await portfolioService.createPortfolioItem(req.body);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/portfolio/:id
router.put('/:id', async (req, res) => {
  try {
    const item = await portfolioService.updatePortfolioItem(req.params.id, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/portfolio/:id
router.delete('/:id', async (req, res) => {
  try {
    await portfolioService.deletePortfolioItem(req.params.id);
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
