import { Router } from 'express';
import * as offerService from '../services/offerService';

const router = Router();

// PUT /api/offers/:id
router.put('/:id', async (req, res) => {
  try {
    const offer = await offerService.updateOffer(req.params.id, req.body);
    res.json(offer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/offers/:id
router.delete('/:id', async (req, res) => {
  try {
    await offerService.deleteOffer(req.params.id);
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
