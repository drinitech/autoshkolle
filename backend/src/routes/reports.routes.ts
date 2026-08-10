import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/weak-categories/:studentId', requireAuth, async (req, res) => {
  const { studentId } = req.params;
  if (req.user!.role === 'STUDENT' && req.user!.studentId !== studentId) {
    return res.status(403).json({ error: 'Nuk ke akses te ky raport' });
  }

  const rows = await prisma.quizAttemptAnswer.findMany({
    where: { quizAttempt: { studentId } },
    select: { eSakte: true, question: { select: { kategoria: true } } },
  });

  const stats: Record<string, { total: number; gabime: number }> = {};
  for (const row of rows) {
    const cat = row.question.kategoria;
    if (!stats[cat]) stats[cat] = { total: 0, gabime: 0 };
    stats[cat].total += 1;
    if (!row.eSakte) stats[cat].gabime += 1;
  }

  const result = Object.entries(stats)
    .map(([kategoria, v]) => ({
      kategoria,
      totalPergjigjur: v.total,
      gabime: v.gabime,
      perqindjaGabimit: Math.round((v.gabime / v.total) * 100),
    }))
    .sort((a, b) => b.perqindjaGabimit - a.perqindjaGabimit);

  res.json(result);
});

// Dashboard admini — numra të përgjithshëm
router.get('/admin-overview', requireAuth, async (_req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [studenteAktive, instruktoreTotal, oreSot, studenteGati] = await Promise.all([
    prisma.student.count({ where: { statusi: 'AKTIV' } }),
    prisma.instructor.count(),
    prisma.drivingLesson.count({ where: { data: { gte: todayStart, lte: todayEnd } } }),
    prisma.student.count({ where: { statusi: 'PROVIM' } }),
  ]);

  res.json({ studenteAktive, instruktoreTotal, oreSot, studenteGati });
});

export default router;
