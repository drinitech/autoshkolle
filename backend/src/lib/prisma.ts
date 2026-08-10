import { PrismaClient } from '@prisma/client';

// Ruajmë një instancë të vetme edhe gjatë hot-reload në dev (tsx watch),
// përndryshe çdo reload hap një pool të ri lidhjesh ndaj NeonDB.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
