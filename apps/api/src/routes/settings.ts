import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import { db } from '../db';

const router = Router();

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  accent: z.enum(['indigo', 'emerald', 'violet', 'rose', 'amber']),
  gamesPerSync: z.number().int().min(10).max(100),
  ratedGamesOnly: z.boolean(),
});

router.get('/', requireAuth, async (_request, response) => {
  const settings = await db.userSettings.upsert({
    where: { userId: response.locals.userId },
    create: { userId: response.locals.userId },
    update: {},
  });
  response.json({ settings });
});

router.put('/', requireAuth, async (request, response) => {
  const parsed = settingsSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: 'Settings contain an unsupported value.' });
    return;
  }
  const settings = await db.userSettings.upsert({
    where: { userId: response.locals.userId },
    create: { userId: response.locals.userId, ...parsed.data },
    update: parsed.data,
  });
  response.json({ settings });
});

export default router;
