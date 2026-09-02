import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: [
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

prisma.$on('error', (e) => {
  logger.error('Database error', { message: e.message });
});

prisma.$on('warn', (e) => {
  logger.warn('Database warning', { message: e.message });
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

export { prisma };
