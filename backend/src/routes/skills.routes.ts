import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Kategoritë e aftësive — përdoren nga instruktori te formulari i vlerësimit pas ore
router.get('/', requireAuth, async (_req, res) => {
  const skills = await prisma.skillCategory.findMany({ orderBy: { renditja: 'asc' } });
  res.json(skills);
});

export default router;
