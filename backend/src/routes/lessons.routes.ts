import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { bookLessonSchema, updateLessonSchema, lessonEvaluationSchema } from '../utils/validation';

const router = Router();

// Lista e lessons — student sheh të vetat, instruktor të veta, admin krejt (me filtra opsionale)
router.get('/', requireAuth, async (req, res) => {
  const { studentId, instructorId } = req.query as { studentId?: string; instructorId?: string };
  const where: any = {};

  if (req.user!.role === 'STUDENT') where.studentId = req.user!.studentId;
  else if (req.user!.role === 'INSTRUCTOR') where.instructorId = req.user!.instructorId;
  else {
    if (studentId) where.studentId = studentId;
    if (instructorId) where.instructorId = instructorId;
  }

  const lessons = await prisma.drivingLesson.findMany({
    where,
    include: {
      student: { include: { user: { select: { emri: true } } } },
      instructor: { include: { user: { select: { emri: true } } } },
      evaluation: { include: { ratings: { include: { skillCategory: true } } } },
    },
    orderBy: [{ data: 'desc' }, { oraFillimit: 'desc' }],
  });
  res.json(lessons);
});

// Rezervo orë — race-safe: UPDATE ... WHERE iZene = false brenda transaksionit
// është atomik në Postgres, ndaj dy rezervime njëkohshme s'mund të "fitojnë" të dyja.
router.post('/', requireAuth, requireRole('STUDENT'), async (req, res) => {
  const parsed = bookLessonSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { slotId } = parsed.data;
  const studentId = req.user!.studentId;
  if (!studentId) return res.status(400).json({ error: 'Profili i studentit s\'u gjet' });

  try {
    const lesson = await prisma.$transaction(async (tx) => {
      const claimed = await tx.availabilitySlot.updateMany({
        where: { id: slotId, iZene: false },
        data: { iZene: true },
      });

      if (claimed.count === 0) {
        throw Object.assign(new Error('SLOT_TAKEN'), { code: 'SLOT_TAKEN' });
      }

      const slot = await tx.availabilitySlot.findUniqueOrThrow({ where: { id: slotId } });

      return tx.drivingLesson.create({
        data: {
          studentId,
          instructorId: slot.instructorId,
          slotId: slot.id,
          data: slot.data,
          oraFillimit: slot.oraFillimit,
          oraMbarimit: slot.oraMbarimit,
        },
      });
    });

    res.status(201).json(lesson);
  } catch (err: any) {
    if (err.code === 'SLOT_TAKEN' || err.code === 'P2002') {
      return res.status(409).json({ error: 'Ky slot është zënë tashmë nga dikush tjetër' });
    }
    throw err;
  }
});

// Anulo / përfundo / shëno mungesë
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const parsed = updateLessonSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const lesson = await prisma.drivingLesson.findUnique({ where: { id } });
  if (!lesson) return res.status(404).json({ error: 'Ora s\'u gjet' });

  const isOwner =
    (req.user!.role === 'STUDENT' && req.user!.studentId === lesson.studentId) ||
    (req.user!.role === 'INSTRUCTOR' && req.user!.instructorId === lesson.instructorId);
  if (!isOwner && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Nuk ke akses te kjo orë' });
  }

  const { statusi, shenimet } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.drivingLesson.update({
      where: { id },
      data: { ...(statusi && { statusi }), ...(shenimet !== undefined && { shenimet }) },
    });

    // Kur anulohet, lirojmë slot-in për t'u rezervuar përsëri
    if (statusi === 'ANULUAR' && lesson.slotId) {
      await tx.availabilitySlot.update({ where: { id: lesson.slotId }, data: { iZene: false } });
    }

    return result;
  });

  res.json(updated);
});

// Vlerësimi pas orës — vetëm instruktori i asaj ore
router.post('/:id/evaluation', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), async (req, res) => {
  const { id } = req.params;
  const parsed = lessonEvaluationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const lesson = await prisma.drivingLesson.findUnique({ where: { id } });
  if (!lesson) return res.status(404).json({ error: 'Ora s\'u gjet' });
  if (req.user!.role === 'INSTRUCTOR' && req.user!.instructorId !== lesson.instructorId) {
    return res.status(403).json({ error: 'Nuk ke akses te kjo orë' });
  }

  const { shenimTekst, ratings } = parsed.data;

  const evaluation = await prisma.$transaction(async (tx) => {
    const evalRecord = await tx.lessonEvaluation.upsert({
      where: { drivingLessonId: id },
      create: { drivingLessonId: id, shenimTekst },
      update: { shenimTekst },
    });

    // rikrijo ratings (idempotent nëse instruktori ndryshon vlerësimin)
    await tx.skillRating.deleteMany({ where: { lessonEvaluationId: evalRecord.id } });
    if (ratings.length) {
      await tx.skillRating.createMany({
        data: ratings.map((r) => ({
          lessonEvaluationId: evalRecord.id,
          skillCategoryId: r.skillCategoryId,
          vleresimi: r.vleresimi,
        })),
      });
    }

    const wasAlreadyDone = lesson.statusi === 'PERFUNDUAR';
    await tx.drivingLesson.update({ where: { id }, data: { statusi: 'PERFUNDUAR' } });
    if (!wasAlreadyDone) {
      await tx.student.update({ where: { id: lesson.studentId }, data: { oreKryera: { increment: 1 } } });
    }

    return tx.lessonEvaluation.findUniqueOrThrow({
      where: { id: evalRecord.id },
      include: { ratings: { include: { skillCategory: true } } },
    });
  });

  res.status(201).json(evaluation);
});

export default router;
