import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { quizSubmitSchema, quizQuestionSchema } from '../utils/validation';
import type { QuizCategory } from '@prisma/client';

const router = Router();

const ALL_CATEGORIES: QuizCategory[] = ['SHENJA_RRUGORE', 'RREGULLA', 'SIGURIA', 'PARKIMI', 'PERPARESIA'];
const DEFAULT_QUESTION_COUNT = 40;
const FULL_TEST_MINUTES = 25;
const PRACTICE_QUESTION_COUNT = 10;
const PASS_THRESHOLD = 90;

// E njëjta normë si testi i plotë (25 min për 40 pyetje), e rrumbullakuar lart.
function minutesFor(questionCount: number): number {
  return Math.max(1, Math.ceil((questionCount * FULL_TEST_MINUTES) / DEFAULT_QUESTION_COUNT));
}

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

// GET /quiz/catalog — publik: testet që mund të shihen pa llogari. Për çdo kategori kthen
// numrin e pyetjeve aktive dhe një pyetje shembull, PA treguar përgjigjen e saktë.
router.get('/catalog', async (_req, res) => {
  const counts = await prisma.quizQuestion.groupBy({
    by: ['kategoria'],
    where: { aktiv: true },
    _count: { _all: true },
  });
  const countByCategory = new Map(counts.map((c) => [c.kategoria, c._count._all]));

  const categories = await Promise.all(
    ALL_CATEGORIES.map(async (kategoria) => {
      const total = countByCategory.get(kategoria) ?? 0;
      const sample = total
        ? await prisma.quizQuestion.findFirst({
            where: { kategoria, aktiv: true },
            skip: Math.floor(Math.random() * total),
            select: { teksti: true, imazhi: true, answers: { select: { id: true, teksti: true } } },
          })
        : null;
      return { kategoria, totalQuestions: total, sample: sample && { ...sample, answers: shuffle(sample.answers) } };
    })
  );

  res.json({
    fullTest: {
      questionCount: DEFAULT_QUESTION_COUNT,
      timeLimitMinutes: FULL_TEST_MINUTES,
      passThreshold: PASS_THRESHOLD,
      totalQuestions: counts.reduce((sum, c) => sum + c._count._all, 0),
    },
    practice: { questionCount: PRACTICE_QUESTION_COUNT, timeLimitMinutes: minutesFor(PRACTICE_QUESTION_COUNT) },
    categories,
  });
});

// GET /quiz/generate?studentId=...&count=40 — test adaptiv sipas historisë së gabimeve.
// Me &kategoria=SHENJA_RRUGORE kthen test ushtrimi vetëm nga ajo kategori (default 10 pyetje).
router.get('/generate', requireAuth, async (req, res) => {
  const studentId = (req.query.studentId as string) || req.user!.studentId;
  const kategoria = req.query.kategoria as QuizCategory | undefined;
  if (kategoria && !ALL_CATEGORIES.includes(kategoria)) return res.status(400).json({ error: 'Kategori e panjohur' });
  const defaultCount = kategoria ? PRACTICE_QUESTION_COUNT : DEFAULT_QUESTION_COUNT;
  const count = Math.min(Math.max(parseInt((req.query.count as string) || '', 10) || defaultCount, 5), 100);
  if (!studentId) return res.status(400).json({ error: 'studentId mungon' });

  if (kategoria) {
    const pool = await prisma.quizQuestion.findMany({
      where: { kategoria, aktiv: true },
      include: { answers: { select: { id: true, teksti: true } } }, // s'kthejmë eSakte gjatë testit
    });
    const questions = shuffle(pool)
      .slice(0, count)
      .map((q) => ({
        id: q.id,
        teksti: q.teksti,
        kategoria: q.kategoria,
        imazhi: q.imazhi,
        veshtiresia: q.veshtiresia,
        answers: shuffle(q.answers),
      }));
    return res.json({ questions, timeLimitMinutes: minutesFor(questions.length), passThreshold: PASS_THRESHOLD });
  }

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

  res.json({ questions, timeLimitMinutes: FULL_TEST_MINUTES, passThreshold: PASS_THRESHOLD });
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

// ─────────────────────────────────────────────────────────────
// CRUD pyetjesh (vetëm ADMIN) — menaxhimi i bankës së pyetjeve
// ─────────────────────────────────────────────────────────────

// GET /quiz/questions?kategoria=... — lista e plotë (përfshi jo-aktivet), për panelin e adminit
router.get('/questions', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { kategoria } = req.query as { kategoria?: string };
  const questions = await prisma.quizQuestion.findMany({
    where: kategoria ? { kategoria: kategoria as QuizCategory } : undefined,
    include: { answers: true },
    orderBy: { id: 'desc' },
  });
  res.json(questions);
});

router.post('/questions', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = quizQuestionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { teksti, kategoria, veshtiresia, imazhi, aktiv, answers } = parsed.data;

  const question = await prisma.quizQuestion.create({
    data: { teksti, kategoria, veshtiresia, imazhi, aktiv, answers: { create: answers } },
    include: { answers: true },
  });
  res.status(201).json(question);
});

router.put('/questions/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const parsed = quizQuestionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { teksti, kategoria, veshtiresia, imazhi, aktiv, answers } = parsed.data;

  const existing = await prisma.quizQuestion.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Pyetja s\'u gjet' });

  const question = await prisma.$transaction(async (tx) => {
    // rikrijo përgjigjet — historia e attempt-eve mban eSakte edhe nëse answerId bëhet null (ON DELETE SET NULL)
    await tx.quizAnswer.deleteMany({ where: { questionId: id } });
    return tx.quizQuestion.update({
      where: { id },
      data: { teksti, kategoria, veshtiresia, imazhi, aktiv, answers: { create: answers } },
      include: { answers: true },
    });
  });

  res.json(question);
});

router.delete('/questions/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.quizQuestion.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Pyetja s\'u gjet' });
    if (err.code === 'P2003') {
      return res.status(409).json({ error: 'Kjo pyetje është përdorur në teste ekzistuese — çaktivizoje në vend të fshirjes' });
    }
    throw err;
  }
});

export default router;
