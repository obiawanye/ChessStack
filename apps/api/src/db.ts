import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be configured before starting the API.');
}

const adapter = new PrismaPg({ connectionString });

export const db = new PrismaClient({ adapter });
