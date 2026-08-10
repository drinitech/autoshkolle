import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { availabilitySlotSchema } from '../utils/validation';

const router = Router();

// Lista e instruktorëve (për studentin që zgjedh kë të rezervojë)
router.get('/', requireAuth, async (_req, res) => {
  const instructors = await prisma.instructor.findMany({
    include: { user: { select: { id: true, emri: true, email: true } } },
  });
  res.json(instructors);
});

// Disponueshmëria e lirë e një instruktori (opsionalisht filtruar me ?from=&to=)
router.get('/:id/availability', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { from, to } = req.query as { from?: string; to?: string };

  const where: any = { instructorId: id, iZene: false };
  if (from || to) {
    where.data = {};
    if (from) where.data.gte = new Date(from);
    if (to) where.data.lte = new Date(to);
  }

  const slots = await prisma.availabilitySlot.findMany({
    where,
    orderBy: [{ data: 'asc' }, { oraFillimit: 'asc' }],
  });
  res.json(slots);
});

// Instruktori/admini shton disponueshmëri të re
router.post('/:id/availability', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), async (req, res) => {
  const { id } = req.params;

  if (req.user!.role === 'INSTRUCTOR' && req.user!.instructorId !== id) {
    return res.status(403).json({ error: 'Mund të shtosh disponueshmëri vetëm për veten' });
  }

  const parsed = availabilitySlotSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { data, oraFillimit, oraMbarimit } = parsed.data;

  try {
    const slot = await prisma.availabilitySlot.create({
      data: { instructorId: id, data: new Date(data), oraFillimit, oraMbarimit },
    });
    res.status(201).json(slot);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ky slot ekziston tashmë për këtë instruktor' });
    }
    throw err;
  }
});

// Heqja e një disponueshmërie (vetëm nëse s'është e zënë)
router.delete('/availability/:slotId', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), async (req, res) => {
  const { slotId } = req.params;
  const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
  if (!slot) return res.status(404).json({ error: 'Slot-i nuk u gjet' });
  if (req.user!.role === 'INSTRUCTOR' && req.user!.instructorId !== slot.instructorId) {
    return res.status(403).json({ error: 'Nuk ke akses' });
  }
  if (slot.iZene) {
    return res.status(409).json({ error: 'Nuk mund të fshish një slot që është i rezervuar' });
  }
  await prisma.availabilitySlot.delete({ where: { id: slotId } });
  res.status(204).send();
});

// Orari (lessons e ardhshme) i instruktorit
router.get('/:id/schedule', requireAuth, async (req, res) => {
  const { id } = req.params;
  const lessons = await prisma.drivingLesson.findMany({
    where: { instructorId: id, statusi: 'REZERVUAR' },
    include: { student: { include: { user: { select: { emri: true } } } } },
    orderBy: [{ data: 'asc' }, { oraFillimit: 'asc' }],
  });
  res.json(lessons);
});

export default router;
