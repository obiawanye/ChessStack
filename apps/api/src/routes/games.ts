import { Router } from 'express';
import { AccountProvider } from '../generated/prisma/client';
import { requireAuth } from '../auth';
import { db } from '../db';

const router = Router();

interface ImportedGame {
  provider: AccountProvider;
  providerGameId: string;
  white: string;
  black: string;
  result: string;
  playedAt: Date | null;
  gameUrl: string | null;
  pgn: string;
}

function isValidPgn(pgn: unknown): pgn is string {
  return typeof pgn === 'string' && pgn.trim().length > 0 && pgn.length <= 100_000;
}

function parseChessComGame(value: unknown): ImportedGame | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const game = value as Record<string, unknown>;
  if (!isValidPgn(game.pgn) || typeof game.url !== 'string') return undefined;
  const white = game.white as Record<string, unknown> | undefined;
  const black = game.black as Record<string, unknown> | undefined;
  if (typeof white?.username !== 'string' || typeof black?.username !== 'string') return undefined;

  const endTime = typeof game.end_time === 'number' ? game.end_time : undefined;
  const whiteResult = typeof white.result === 'string' ? white.result : '';
  const blackResult = typeof black.result === 'string' ? black.result : '';
  const drawResults = new Set([
    'agreed',
    'repetition',
    'stalemate',
    'insufficient',
    '50move',
    'timevsinsufficient',
  ]);
  return {
    provider: AccountProvider.CHESS_COM,
    providerGameId: game.url,
    white: white.username,
    black: black.username,
    result:
      whiteResult === 'win'
        ? '1-0'
        : blackResult === 'win'
          ? '0-1'
          : drawResults.has(whiteResult) || drawResults.has(blackResult)
            ? '1/2-1/2'
            : '*',
    playedAt: endTime ? new Date(endTime * 1000) : null,
    gameUrl: game.url,
    pgn: game.pgn,
  };
}

function parseLichessGame(value: unknown): ImportedGame | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const game = value as Record<string, unknown>;
  if (typeof game.id !== 'string' || !isValidPgn(game.pgn)) return undefined;
  const players = game.players as Record<string, unknown> | undefined;
  const white = players?.white as Record<string, unknown> | undefined;
  const black = players?.black as Record<string, unknown> | undefined;
  const whiteUser = white?.user as Record<string, unknown> | undefined;
  const blackUser = black?.user as Record<string, unknown> | undefined;
  if (typeof whiteUser?.name !== 'string' || typeof blackUser?.name !== 'string') return undefined;

  const winner = game.winner;
  const result =
    winner === 'white'
      ? '1-0'
      : winner === 'black'
        ? '0-1'
        : game.status === 'draw'
          ? '1/2-1/2'
          : '*';
  return {
    provider: AccountProvider.LICHESS,
    providerGameId: game.id,
    white: whiteUser.name,
    black: blackUser.name,
    result,
    playedAt: typeof game.createdAt === 'number' ? new Date(game.createdAt) : null,
    gameUrl: typeof game.url === 'string' ? game.url : `https://lichess.org/${game.id}`,
    pgn: game.pgn,
  };
}

async function fetchChessComGames(username: string, limit: number, ratedOnly: boolean) {
  const profileUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username)}`;
  const profileResponse = await fetch(profileUrl, {
    headers: { 'User-Agent': 'ChessStack/1.0 (public game import)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!profileResponse.ok) {
    throw new Error(`Chess.com profile lookup failed with status ${profileResponse.status}.`);
  }

  const archiveResponse = await fetch(`${profileUrl}/games/archives`, {
    headers: { 'User-Agent': 'ChessStack/1.0 (public game import)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!archiveResponse.ok) {
    throw new Error(`Chess.com archive lookup failed with status ${archiveResponse.status}.`);
  }
  const archiveData: unknown = await archiveResponse.json();
  if (
    !archiveData ||
    typeof archiveData !== 'object' ||
    !('archives' in archiveData) ||
    !Array.isArray(archiveData.archives) ||
    archiveData.archives.some((item) => typeof item !== 'string')
  ) {
    throw new Error('Chess.com returned an invalid game archive list.');
  }

  const result: ImportedGame[] = [];
  for (const archiveUrl of [...archiveData.archives].reverse().slice(0, 12)) {
    const url = new URL(archiveUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'api.chess.com') {
      throw new Error('Chess.com returned an unexpected game archive URL.');
    }

    const gamesResponse = await fetch(url, {
      headers: { 'User-Agent': 'ChessStack/1.0 (public game import)' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!gamesResponse.ok) {
      throw new Error(`Chess.com game archive lookup failed with status ${gamesResponse.status}.`);
    }
    const archiveGames: unknown = await gamesResponse.json();
    if (
      !archiveGames ||
      typeof archiveGames !== 'object' ||
      !('games' in archiveGames) ||
      !Array.isArray(archiveGames.games)
    ) {
      throw new Error('Chess.com returned an invalid game archive.');
    }

    for (const rawGame of [...archiveGames.games].reverse()) {
      if (!rawGame || typeof rawGame !== 'object') continue;
      if (ratedOnly && (!('rated' in rawGame) || rawGame.rated !== true)) continue;
      const game = parseChessComGame(rawGame);
      if (game) result.push(game);
      if (result.length >= limit) break;
    }
    if (result.length >= limit) break;
  }
  return result;
}

async function fetchLichessGames(username: string, limit: number, ratedOnly: boolean) {
  const url = new URL(`https://lichess.org/api/games/user/${encodeURIComponent(username)}`);
  url.searchParams.set('max', String(limit));
  url.searchParams.set('pgnInJson', 'true');
  if (ratedOnly) url.searchParams.set('rated', 'true');

  const response = await fetch(url, {
    headers: { Accept: 'application/x-ndjson' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Lichess game export failed with status ${response.status}.`);
  }
  const text = await response.text();
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => parseLichessGame(JSON.parse(line)))
    .filter((game): game is ImportedGame => Boolean(game))
    .slice(0, limit);
}

router.get('/', requireAuth, async (request, response) => {
  const limit = request.query.limit === undefined ? 50 : Number(request.query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    response.status(400).json({ error: 'Game limit must be a whole number between 1 and 100.' });
    return;
  }

  const games = await db.game.findMany({
    where: { userId: response.locals.userId },
    orderBy: [{ playedAt: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });
  response.json({ games });
});

router.post('/sync', requireAuth, async (_request, response) => {
  const userId = response.locals.userId;
  const [accounts, settings] = await Promise.all([
    db.connectedAccount.findMany({ where: { userId } }),
    db.userSettings.findUnique({ where: { userId } }),
  ]);
  if (!accounts.length) {
    response
      .status(400)
      .json({ error: 'Connect a Lichess or Chess.com account before importing games.' });
    return;
  }

  const limit = settings?.gamesPerSync ?? 20;
  const ratedOnly = settings?.ratedGamesOnly ?? false;
  const imported = await Promise.all(
    accounts.map((account) =>
      account.provider === AccountProvider.CHESS_COM
        ? fetchChessComGames(account.username, limit, ratedOnly)
        : fetchLichessGames(account.username, limit, ratedOnly),
    ),
  );
  const games = imported.flat();
  for (const game of games) {
    await db.game.upsert({
      where: {
        userId_provider_providerGameId: {
          userId,
          provider: game.provider,
          providerGameId: game.providerGameId,
        },
      },
      create: { ...game, userId },
      update: {
        white: game.white,
        black: game.black,
        result: game.result,
        playedAt: game.playedAt,
        gameUrl: game.gameUrl,
        pgn: game.pgn,
      },
    });
  }
  response.json({ imported: games.length, games });
});

export default router;
