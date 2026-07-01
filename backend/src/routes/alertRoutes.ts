import { Router } from 'express';
import * as alertService from '../services/alertService';

const router = Router();

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await alertService.getAlerts();
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts
router.post('/', async (req, res) => {
  try {
    const alert = await alertService.createAlert(req.body);
    res.status(201).json(alert);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/alerts/:id
router.put('/:id', async (req, res) => {
  try {
    const alert = await alertService.updateAlert(req.params.id, req.body);
    res.json(alert);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req, res) => {
  try {
    await alertService.deleteAlert(req.params.id);
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
