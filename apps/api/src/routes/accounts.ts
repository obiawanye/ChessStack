import { Router } from 'express';
import { z } from 'zod';
import { AccountProvider } from '../generated/prisma/client';
import { requireAuth } from '../auth';
import { db } from '../db';

const router = Router();

const chessComUsername = z
  .string()
  .trim()
  .min(2)
  .max(25)
  .regex(/^[A-Za-z0-9_-]+$/);

router.put('/chess-com', requireAuth, async (request, response) => {
  const parsed = z.object({ username: chessComUsername }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: 'Enter a valid Chess.com username.' });
    return;
  }

  const profileResponse = await fetch(
    `https://api.chess.com/pub/player/${encodeURIComponent(parsed.data.username)}`,
    {
      headers: { 'User-Agent': 'ChessStack/1.0 (public account linking)' },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (profileResponse.status === 404) {
    response.status(404).json({ error: 'That Chess.com profile was not found.' });
    return;
  }
  if (!profileResponse.ok) {
    response
      .status(502)
      .json({ error: `Chess.com profile lookup failed with status ${profileResponse.status}.` });
    return;
  }

  const profileData: unknown = await profileResponse.json();
  const profile = z
    .object({ player_id: z.number().int().positive(), username: z.string().min(1) })
    .safeParse(profileData);
  if (!profile.success) {
    response.status(502).json({ error: 'Chess.com returned an invalid player profile.' });
    return;
  }

  const userId: string = response.locals.userId;
  const claimed = await db.connectedAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: AccountProvider.CHESS_COM,
        providerUserId: String(profile.data.player_id),
      },
    },
  });
  if (claimed && claimed.userId !== userId) {
    response
      .status(409)
      .json({ error: 'That Chess.com account is already linked to another ChessStack user.' });
    return;
  }

  const account = await db.connectedAccount.upsert({
    where: { userId_provider: { userId, provider: AccountProvider.CHESS_COM } },
    create: {
      userId,
      provider: AccountProvider.CHESS_COM,
      providerUserId: String(profile.data.player_id),
      username: profile.data.username,
    },
    update: {
      providerUserId: String(profile.data.player_id),
      username: profile.data.username,
    },
    select: { provider: true, username: true },
  });
  response.json({ account, verifiedByPublicProfile: true });
});

router.delete('/chess-com', requireAuth, async (_request, response) => {
  await db.connectedAccount.deleteMany({
    where: { userId: response.locals.userId, provider: AccountProvider.CHESS_COM },
  });
  response.status(204).end();
});

export default router;
