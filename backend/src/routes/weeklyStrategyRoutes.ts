import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/weekly-strategies
router.get('/', async (req, res) => {
  try {
    const list = await prisma.weeklyStrategy.findMany({
      orderBy: { weekStartDate: 'desc' },
    });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/weekly-strategies/latest
router.get('/latest', async (req, res) => {
  try {
    const latest = await prisma.weeklyStrategy.findFirst({
      orderBy: { weekStartDate: 'desc' },
    });
    res.json(latest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/weekly-strategies/:id
router.get('/:id', async (req, res) => {
  try {
    const strategy = await prisma.weeklyStrategy.findUnique({
      where: { id: req.params.id },
    });
    if (!strategy) {
      return res.status(404).json({ error: 'Weekly strategy not found' });
    }
    res.json(strategy);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/weekly-strategies
router.post('/', async (req, res) => {
  try {
    const { 
      title, weekStartDate, weekEndDate, marketSummary, 
      cardsToWatch, cardsToAvoid, buyZoneNotes, sellZoneNotes, 
      riskNotes, relatedCardIdsJson 
    } = req.body;

    const created = await prisma.weeklyStrategy.create({
      data: {
        title,
        weekStartDate: new Date(weekStartDate),
        weekEndDate: new Date(weekEndDate),
        marketSummary,
        cardsToWatch,
        cardsToAvoid,
        buyZoneNotes,
        sellZoneNotes,
        riskNotes,
        relatedCardIdsJson: relatedCardIdsJson || '[]',
      },
    });

    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/weekly-strategies/:id
router.put('/:id', async (req, res) => {
  try {
    const { 
      title, weekStartDate, weekEndDate, marketSummary, 
      cardsToWatch, cardsToAvoid, buyZoneNotes, sellZoneNotes, 
      riskNotes, relatedCardIdsJson 
    } = req.body;

    const updated = await prisma.weeklyStrategy.update({
      where: { id: req.params.id },
      data: {
        title,
        weekStartDate: weekStartDate ? new Date(weekStartDate) : undefined,
        weekEndDate: weekEndDate ? new Date(weekEndDate) : undefined,
        marketSummary,
        cardsToWatch,
        cardsToAvoid,
        buyZoneNotes,
        sellZoneNotes,
        riskNotes,
        relatedCardIdsJson,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/weekly-strategies/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.weeklyStrategy.delete({
      where: { id: req.params.id },
    });
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
