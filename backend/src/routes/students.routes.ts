import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

const MIN_HOURS_REQUIRED: Record<string, number> = {
  A: 20, B: 30, C: 40, D: 50, BE: 15, CE: 15,
};
const SKILL_LEVEL_SCORE: Record<string, number> = { E_DOBET: 1, MESATARE: 2, MIRE: 3 };

router.get('/:id/progress', requireAuth, async (req, res) => {
  const { id } = req.params;

  if (req.user!.role === 'STUDENT' && req.user!.studentId !== id) {
    return res.status(403).json({ error: 'Nuk ke akses te ky profil' });
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: { select: { emri: true, email: true } } },
  });
  if (!student) return res.status(404).json({ error: 'Studenti s\'u gjet' });

  const minRequired = MIN_HOURS_REQUIRED[student.kategoria] || 30;
  const orePercentazhi = Math.min(100, Math.round((student.oreKryera / minRequired) * 100));

  const ratings = await prisma.skillRating.findMany({
    where: { lessonEvaluation: { drivingLesson: { studentId: id } } },
    include: { skillCategory: true },
  });
  const bySkill: Record<string, { emri: string; scores: number[] }> = {};
  for (const r of ratings) {
    const key = r.skillCategoryId;
    if (!bySkill[key]) bySkill[key] = { emri: r.skillCategory.emri, scores: [] };
    bySkill[key].scores.push(SKILL_LEVEL_SCORE[r.vleresimi]);
  }
  const skillAverages = Object.entries(bySkill).map(([id, v]) => ({
    skillCategoryId: id,
    emri: v.emri,
    mesatarja: Math.round((v.scores.reduce((a, b) => a + b, 0) / v.scores.length) * 100) / 100,
  }));
  const overallSkillAvg = skillAverages.length
    ? skillAverages.reduce((a, s) => a + s.mesatarja, 0) / skillAverages.length
    : 0;

  const bestQuiz = await prisma.quizAttempt.findFirst({
    where: { studentId: id },
    orderBy: { rezultati: 'desc' },
    select: { rezultati: true, data: true, iKaluar: true },
  });

  // Gatishmëria: kombinim i orëve, aftësive dhe rezultatit më të mirë të quiz-it
  let gatishmeria: 'JESHIL' | 'VERDHE' | 'KUQ' = 'KUQ';
  const quizOk = (bestQuiz?.rezultati || 0) >= 90;
  const skillsOk = overallSkillAvg >= 2.5;
  const hoursOk = orePercentazhi >= 100;
  if (hoursOk && skillsOk && quizOk) gatishmeria = 'JESHIL';
  else if (orePercentazhi >= 60 && overallSkillAvg >= 1.8) gatishmeria = 'VERDHE';

  res.json({
    student: { id: student.id, emri: student.user.emri, kategoria: student.kategoria, statusi: student.statusi },
    ore: { kryera: student.oreKryera, minimumi: minRequired, perqindja: orePercentazhi },
    aftesite: skillAverages,
    quizMeMireRezultat: bestQuiz,
    gatishmeria,
  });
});

export default router;
