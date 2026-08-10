import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { quizSubmitSchema } from '../utils/validation';
import type { QuizCategory } from '@prisma/client';

const router = Router();

const ALL_CATEGORIES: QuizCategory[] = ['SHENJA_RRUGORE', 'RREGULLA', 'SIGURIA', 'PARKIMI', 'PERPARESIA'];
const DEFAULT_QUESTION_COUNT = 40;
const PASS_THRESHOLD = 90;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Llogarit % gabimi për student për çdo kategori, bazuar në historinë e QuizAttemptAnswer
async function computeCategoryErrorRates(studentId: string): Promise<Record<string, number>> {
  const rows = await prisma.quizAttemptAnswer.findMany({
    where: { quizAttempt: { studentId } },
    select: { eSakte: true, question: { select: { kategoria: true } } },
  });

  const stats: Record<string, { total: number; gabime: number }> = {};
  for (const cat of ALL_CATEGORIES) stats[cat] = { total: 0, gabime: 0 };

  for (const row of rows) {
    const cat = row.question.kategoria;
    stats[cat].total += 1;
    if (!row.eSakte) stats[cat].gabime += 1;
  }

  const rates: Record<string, number> = {};
  for (const cat of ALL_CATEGORIES) {
    rates[cat] = stats[cat].total > 0 ? stats[cat].gabime / stats[cat].total : 0;
  }
  return rates;
}

// Shpërndan N pyetje mes kategorive: peshë bazë 1 + errorRate, kategoritë ku studenti
// gabon më shpesh marrin proporcionalisht më shumë pyetje në testin e ardhshëm.
function distributeByWeight(errorRates: Record<string, number>, n: number): Record<string, number> {
  const weights = ALL_CATEGORIES.map((cat) => 1 + errorRates[cat] * 2);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const raw = ALL_CATEGORIES.map((cat, i) => (weights[i] / totalWeight) * n);
  const counts: Record<string, number> = {};
  let assigned = 0;
  ALL_CATEGORIES.forEach((cat, i) => {
    counts[cat] = Math.floor(raw[i]);
    assigned += counts[cat];
  });

  // shpërndaj mbetjen e rrumbullakimit te kategoritë me peshën më të lartë (më "të dobëta")
  let remainder = n - assigned;
  const order = ALL_CATEGORIES.map((cat, i) => ({ cat, frac: raw[i] - Math.floor(raw[i]) })).sort(
    (a, b) => b.frac - a.frac
  );
  for (let i = 0; remainder > 0 && i < order.length; i++, remainder--) {
    counts[order[i].cat] += 1;
  }
  return counts;
}

// GET /quiz/generate?studentId=...&count=40 — test adaptiv sipas historisë së gabimeve
router.get('/generate', requireAuth, async (req, res) => {
  const studentId = (req.query.studentId as string) || req.user!.studentId;
  const count = Math.min(Math.max(parseInt((req.query.count as string) || '', 10) || DEFAULT_QUESTION_COUNT, 5), 100);
  if (!studentId) return res.status(400).json({ error: 'studentId mungon' });

  const errorRates = await computeCategoryErrorRates(studentId);
  const distribution = distributeByWeight(errorRates, count);

  const selected: any[] = [];
  for (const cat of ALL_CATEGORIES) {
    const need = distribution[cat];
    if (need <= 0) continue;
    const pool = await prisma.quizQuestion.findMany({
      where: { kategoria: cat, aktiv: true },
      include: { answers: { select: { id: true, teksti: true } } }, // s'kthejmë eSakte gjatë testit
    });
    selected.push(...shuffle(pool).slice(0, need));
  }

  // nëse ndonjë kategori s'ka mjaftueshëm pyetje, plotëso nga pjesa tjetër e pool-it
  if (selected.length < count) {
    const usedIds = new Set(selected.map((q) => q.id));
    const filler = await prisma.quizQuestion.findMany({
      where: { aktiv: true, id: { notIn: Array.from(usedIds) } },
      include: { answers: { select: { id: true, teksti: true } } },
    });
    selected.push(...shuffle(filler).slice(0, count - selected.length));
  }

  const questions = shuffle(selected).map((q) => ({
    id: q.id,
    teksti: q.teksti,
    kategoria: q.kategoria,
    imazhi: q.imazhi,
    veshtiresia: q.veshtiresia,
    answers: shuffle(q.answers),
  }));

  res.json({ questions, timeLimitMinutes: 25, passThreshold: PASS_THRESHOLD });
});

// POST /quiz/submit
router.post('/submit', requireAuth, async (req, res) => {
  const parsed = quizSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { studentId, kohaSekonda, answers } = parsed.data;

  const questionIds = answers.map((a) => a.questionId);
  const correctAnswers = await prisma.quizAnswer.findMany({
    where: { questionId: { in: questionIds }, eSakte: true },
    select: { id: true, questionId: true },
  });
  const correctByQuestion = new Map(correctAnswers.map((a) => [a.questionId, a.id]));

  let correctCount = 0;
  const gradedAnswers = answers.map((a) => {
    const correctAnswerId = correctByQuestion.get(a.questionId);
    const eSakte = !!a.answerId && a.answerId === correctAnswerId;
    if (eSakte) correctCount++;
    return { ...a, eSakte, correctAnswerId };
  });

  const rezultati = answers.length ? Math.round((correctCount / answers.length) * 10000) / 100 : 0;
  const iKaluar = rezultati >= PASS_THRESHOLD;

  const attempt = await prisma.$transaction(async (tx) => {
    const created = await tx.quizAttempt.create({
      data: { studentId, rezultati, kohaSekonda, iKaluar },
    });
    await tx.quizAttemptAnswer.createMany({
      data: gradedAnswers.map((a) => ({
        quizAttemptId: created.id,
        questionId: a.questionId,
        answerId: a.answerId,
        eSakte: a.eSakte,
      })),
    });
    return created;
  });

  res.status(201).json({
    attemptId: attempt.id,
    rezultati,
    iKaluar,
    saktesia: `${correctCount}/${answers.length}`,
    breakdown: gradedAnswers.map((a) => ({
      questionId: a.questionId,
      eSakte: a.eSakte,
      correctAnswerId: a.correctAnswerId,
      answerId: a.answerId,
    })),
  });
});

// GET /quiz/history/:studentId
router.get('/history/:studentId', requireAuth, async (req, res) => {
  const { studentId } = req.params;
  const attempts = await prisma.quizAttempt.findMany({
    where: { studentId },
    orderBy: { data: 'desc' },
    select: { id: true, data: true, rezultati: true, kohaSekonda: true, iKaluar: true },
  });
  res.json(attempts);
});

export default router;
