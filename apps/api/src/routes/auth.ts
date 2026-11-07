import { Router } from 'express';
import argon2 from 'argon2';
import { z } from 'zod';
import { AccountProvider } from '../../generated/prisma/client';
import { clearSessionCookie, createOAuthCredentials, optionalAuth, requireAuth, setSessionCookie } from '../auth';
import { db } from '../db';

const router = Router();

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(10).max(128),
});

const lichessClientId = () => process.env.LICHESS_CLIENT_ID;
const lichessRedirectUri = () =>
  process.env.LICHESS_REDIRECT_URI ?? 'http://localhost:4000/api/v1/auth/lichess/callback';
const webOrigin = () => process.env.WEB_ORIGIN ?? 'http://localhost:5173';

function publicUser(user: {
  id: string;
  email: string | null;
  displayName: string | null;
  accounts: { provider: AccountProvider; username: string }[];
  settings: {
    theme: string;
    accent: string;
    gamesPerSync: number;
    ratedGamesOnly: boolean;
  } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    accounts: user.accounts,
    settings: user.settings,
  };
}

async function loadUser(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: { accounts: true, settings: true },
  });
}

router.post('/register', async (request, response) => {
  const parsed = credentialsSchema
    .extend({ displayName: z.string().trim().min(1).max(80).optional() })
    .safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: 'Enter a valid email and a password of at least 10 characters.' });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    response.status(409).json({ error: 'An account with that email already exists.' });
    return;
  }

  const user = await db.user.create({
    data: {
      email,
      displayName: parsed.data.displayName,
      passwordHash: await argon2.hash(parsed.data.password),
      settings: { create: {} },
    },
    include: { accounts: true, settings: true },
  });
  await setSessionCookie(user.id, response);
  response.status(201).json({ user: publicUser(user) });
});

router.post('/login', async (request, response) => {
  const parsed = credentialsSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: 'Enter a valid email and password.' });
    return;
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true, passwordHash: true },
  });
  if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, parsed.data.password))) {
    response.status(401).json({ error: 'Email or password is incorrect.' });
    return;
  }

  const sessionUser = await loadUser(user.id);
  if (!sessionUser) {
    response.status(500).json({ error: 'Unable to load the account after signing in.' });
    return;
  }
  await setSessionCookie(user.id, response);
  response.json({ user: publicUser(sessionUser) });
});

router.post('/logout', (_request, response) => {
  clearSessionCookie(response);
  response.status(204).end();
});

router.get('/me', requireAuth, async (_request, response) => {
  const user = await loadUser(response.locals.userId);
  if (!user) {
    response.status(401).json({ error: 'Your account is no longer available.' });
    return;
  }
  response.json({ user: publicUser(user) });
});

router.get('/lichess', optionalAuth, async (_request, response) => {
  const clientId = lichessClientId();
  if (!clientId) {
    response.status(503).json({ error: 'Lichess sign-in is not configured on this server.' });
    return;
  }

  const { verifier, challenge, state } = createOAuthCredentials();
  await db.oAuthState.create({
    data: {
      state,
      codeVerifier: verifier,
      userId: response.locals.userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  const authorizationUrl = new URL('https://lichess.org/oauth');
  authorizationUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: lichessRedirectUri(),
    state,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  }).toString();
  response.redirect(authorizationUrl.toString());
});

router.get('/lichess/callback', async (request, response) => {
  const state = typeof request.query.state === 'string' ? request.query.state : '';
  const code = typeof request.query.code === 'string' ? request.query.code : '';
  if (!state || !code) {
    response.redirect(`${webOrigin()}/?auth=lichess-error`);
    return;
  }

  const oauthState = await db.oAuthState.findUnique({ where: { state } });
  await db.oAuthState.deleteMany({ where: { state } });
  if (!oauthState || oauthState.expiresAt < new Date()) {
    response.redirect(`${webOrigin()}/?auth=lichess-error`);
    return;
  }

  const clientId = lichessClientId();
  if (!clientId) {
    response.redirect(`${webOrigin()}/?auth=lichess-error`);
    return;
  }

  const tokenResponse = await fetch('https://lichess.org/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: oauthState.codeVerifier,
      redirect_uri: lichessRedirectUri(),
      client_id: clientId,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!tokenResponse.ok) {
    response.redirect(`${webOrigin()}/?auth=lichess-error`);
    return;
  }
  const tokenData: unknown = await tokenResponse.json();
  const token = z.object({ access_token: z.string().min(1) }).safeParse(tokenData);
  if (!token.success) {
    response.redirect(`${webOrigin()}/?auth=lichess-error`);
    return;
  }

  const identityResponse = await fetch('https://lichess.org/api/account', {
    headers: { Authorization: `Bearer ${token.data.access_token}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!identityResponse.ok) {
    response.redirect(`${webOrigin()}/?auth=lichess-error`);
    return;
  }
  const identityData: unknown = await identityResponse.json();
  const identity = z
    .object({ id: z.string().min(1), username: z.string().min(1).max(100) })
    .safeParse(identityData);
  if (!identity.success) {
    response.redirect(`${webOrigin()}/?auth=lichess-error`);
    return;
  }

  const providerAccount = await db.connectedAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: AccountProvider.LICHESS,
        providerUserId: identity.data.id,
      },
    },
  });
  if (oauthState.userId && providerAccount && providerAccount.userId !== oauthState.userId) {
    response.redirect(`${webOrigin()}/?auth=lichess-already-linked`);
    return;
  }

  let userId: string;
  if (oauthState.userId) {
    userId = oauthState.userId;
    const existingAccount = await db.connectedAccount.findUnique({
      where: { userId_provider: { userId, provider: AccountProvider.LICHESS } },
    });
    if (existingAccount && existingAccount.providerUserId !== identity.data.id) {
      response.redirect(`${webOrigin()}/?auth=lichess-already-linked`);
      return;
    }
    await db.connectedAccount.upsert({
      where: {
        provider_providerUserId: {
          provider: AccountProvider.LICHESS,
          providerUserId: identity.data.id,
        },
      },
      create: {
        provider: AccountProvider.LICHESS,
        providerUserId: identity.data.id,
        username: identity.data.username,
        userId,
      },
      update: { username: identity.data.username },
    });
  } else if (providerAccount) {
    userId = providerAccount.userId;
    await db.connectedAccount.update({
      where: { id: providerAccount.id },
      data: { username: identity.data.username },
    });
  } else {
    const user = await db.user.create({
      data: {
        displayName: identity.data.username,
        accounts: {
          create: {
            provider: AccountProvider.LICHESS,
            providerUserId: identity.data.id,
            username: identity.data.username,
          },
        },
        settings: { create: {} },
      },
      select: { id: true },
    });
    userId = user.id;
  }

  await setSessionCookie(userId, response);
  response.redirect(`${webOrigin()}/?auth=lichess-success`);
});

export default router;
