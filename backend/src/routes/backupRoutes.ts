import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { exportDatabaseBackup, importDatabaseBackup } from '../utils/jsonBackup';
import { exportPortfolioToCsv } from '../utils/csvExport';
import { getPortfolioItems } from '../services/portfolioService';
import { requireAdminToken } from '../middleware/adminAuth';
import { adminRateLimiter } from '../middleware/rateLimit';

const router = Router();
const prisma = new PrismaClient();

// GET /api/export/json
router.get('/json', adminRateLimiter, requireAdminToken, async (req, res) => {
  try {
    const backup = await exportDatabaseBackup(prisma);
    res.setHeader('Content-disposition', 'attachment; filename=cardadvisor-backup.json');
    res.setHeader('Content-type', 'application/json');
    res.status(200).send(JSON.stringify(backup, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/portfolio.csv
router.get('/portfolio.csv', async (req, res) => {
  try {
    const items = await getPortfolioItems();
    const csv = exportPortfolioToCsv(items);
    res.setHeader('Content-disposition', 'attachment; filename=cardadvisor-portfolio.csv');
    res.setHeader('Content-type', 'text/csv');
    res.status(200).send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/import/json
router.post('/json', adminRateLimiter, requireAdminToken, async (req, res) => {
  try {
    const backup = req.body;
    await importDatabaseBackup(prisma, backup);
    res.json({ message: 'Database backup loaded successfully. Catalog state replaced.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
