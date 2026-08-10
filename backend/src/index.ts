import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import authRoutes from './routes/auth.routes';
import instructorsRoutes from './routes/instructors.routes';
import studentsRoutes from './routes/students.routes';
import lessonsRoutes from './routes/lessons.routes';
import quizRoutes from './routes/quiz.routes';
import reportsRoutes from './routes/reports.routes';
import skillsRoutes from './routes/skills.routes';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/auth', authRoutes);
app.use('/instructors', instructorsRoutes);
app.use('/students', studentsRoutes);
app.use('/lessons', lessonsRoutes);
app.use('/quiz', quizRoutes);
app.use('/reports', reportsRoutes);
app.use('/skills', skillsRoutes);

// Error handler qendror
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Gabim i papritur në server' });
});

// Çdo orë kontrollon lessons brenda 24h dhe do të dërgonte email (SMTP config e nevojshme)
cron.schedule('0 * * * *', async () => {
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const windowStart = new Date(in24h.getTime() - 60 * 60 * 1000);
  const upcoming = await prisma.drivingLesson.findMany({
    where: { statusi: 'REZERVUAR', data: { gte: windowStart, lte: in24h } },
    include: { student: { include: { user: true } } },
  });
  for (const lesson of upcoming) {
    console.log(`[njoftim] Ora e ${lesson.student.user.emri} është nesër në ${lesson.oraFillimit}`);
    // TODO: integro SMTP/nodemailer këtu kur env vars SMTP_* të jenë vendosur
  }
});

app.listen(PORT, () => {
  console.log(`Autoshkolla API duke dëgjuar në portin ${PORT}`);
});
