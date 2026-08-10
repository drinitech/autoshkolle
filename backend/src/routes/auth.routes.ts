import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { registerSchema, loginSchema } from '../utils/validation';

const router = Router();

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { emri, email, telefoni, password, role, kategoria, specializimi } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Ky email është i regjistruar tashmë' });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { emri, email, telefoni, password: hashed, role },
    });

    if (role === 'STUDENT') {
      await tx.student.create({
        data: {
          userId: newUser.id,
          kategoria: kategoria || 'B',
        },
      });
    } else if (role === 'INSTRUCTOR') {
      await tx.instructor.create({
        data: {
          userId: newUser.id,
          specializimi: specializimi && specializimi.length ? specializimi : ['B'],
        },
      });
    }

    return newUser;
  });

  const profile = await getProfileForUser(user.id, user.role);
  const token = signToken({
    userId: user.id,
    role: user.role,
    studentId: profile.studentId,
    instructorId: profile.instructorId,
  });

  res.status(201).json({
    token,
    user: { id: user.id, emri: user.emri, email: user.email, role: user.role, ...profile },
  });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Email ose fjalëkalim i gabuar' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Email ose fjalëkalim i gabuar' });

  const profile = await getProfileForUser(user.id, user.role);
  const token = signToken({
    userId: user.id,
    role: user.role,
    studentId: profile.studentId,
    instructorId: profile.instructorId,
  });

  res.json({
    token,
    user: { id: user.id, emri: user.emri, email: user.email, role: user.role, ...profile },
  });
});

async function getProfileForUser(userId: string, role: string) {
  if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId } });
    return { studentId: student?.id };
  }
  if (role === 'INSTRUCTOR') {
    const instructor = await prisma.instructor.findUnique({ where: { userId } });
    return { instructorId: instructor?.id };
  }
  return {};
}

export default router;
