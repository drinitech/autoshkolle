import { z } from 'zod';

export const registerSchema = z.object({
  emri: z.string().min(2, 'Emri duhet të ketë të paktën 2 shkronja'),
  email: z.string().email('Email i pavlefshëm'),
  telefoni: z.string().optional(),
  password: z.string().min(6, 'Fjalëkalimi duhet të ketë të paktën 6 karaktere'),
  role: z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT']).default('STUDENT'),
  kategoria: z.enum(['A', 'B', 'C', 'D', 'BE', 'CE']).optional(),
  specializimi: z.array(z.enum(['A', 'B', 'C', 'D', 'BE', 'CE'])).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Fjalëkalimi është i detyrueshëm'),
});

export const availabilitySlotSchema = z.object({
  data: z.string(), // "YYYY-MM-DD"
  oraFillimit: z.string().regex(/^\d{2}:\d{2}$/),
  oraMbarimit: z.string().regex(/^\d{2}:\d{2}$/),
});

export const bookLessonSchema = z.object({
  slotId: z.string().min(1),
});

export const updateLessonSchema = z.object({
  statusi: z.enum(['REZERVUAR', 'PERFUNDUAR', 'ANULUAR', 'MUNGESE']).optional(),
  shenimet: z.string().optional(),
});

export const lessonEvaluationSchema = z.object({
  shenimTekst: z.string().optional(),
  ratings: z.array(
    z.object({
      skillCategoryId: z.string().min(1),
      vleresimi: z.enum(['E_DOBET', 'MESATARE', 'MIRE']),
    })
  ),
});

export const quizQuestionSchema = z.object({
  teksti: z.string().min(3, 'Teksti i pyetjes duhet të ketë të paktën 3 karaktere'),
  kategoria: z.enum(['SHENJA_RRUGORE', 'RREGULLA', 'SIGURIA', 'PARKIMI', 'PERPARESIA']),
  veshtiresia: z.enum(['LEHTE', 'MESATARE', 'VESHTIRE']).default('MESATARE'),
  imazhi: z.string().optional().nullable(),
  aktiv: z.boolean().default(true),
  answers: z
    .array(z.object({ teksti: z.string().min(1, 'Përgjigja s\'mund të jetë bosh'), eSakte: z.boolean() }))
    .min(2, 'Duhen të paktën 2 përgjigje')
    .refine((arr) => arr.filter((a) => a.eSakte).length === 1, 'Duhet saktësisht një përgjigje e saktë'),
});

export const quizSubmitSchema = z.object({
  studentId: z.string().min(1),
  kohaSekonda: z.number().int().nonnegative(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      answerId: z.string().nullable(),
    })
  ),
});
