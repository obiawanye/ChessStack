import { createHash, randomBytes } from 'node:crypto';
import type { RequestHandler, Response } from 'express';

const sessionCookie = 'chessstack_session';
const sessionDurationSeconds = 60 * 60 * 24 * 7;

function jwtSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must contain at least 32 characters.');
  }
  return new TextEncoder().encode(secret);
}

function sessionToken(cookieHeader: string | undefined) {
  return cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${sessionCookie}=`))
    ?.slice(sessionCookie.length + 1);
}

function cookieOptions() {
  return [
    'Path=/api/v1',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${sessionDurationSeconds}`,
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
  ].join('; ');
}

export async function setSessionCookie(userId: string, response: Response) {
  const { SignJWT } = await import('jose');
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${sessionDurationSeconds}s`)
    .sign(jwtSecret());

  response.setHeader('Set-Cookie', `${sessionCookie}=${token}; ${cookieOptions()}`);
}

export function clearSessionCookie(response: Response) {
  response.setHeader(
    'Set-Cookie',
    `${sessionCookie}=; Path=/api/v1; HttpOnly; SameSite=Lax; Max-Age=0${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }`,
  );
}

export const requireAuth: RequestHandler = async (request, response, next) => {
  const token = sessionToken(request.headers.cookie);
  if (!token) {
    response.status(401).json({ error: 'Sign in to continue.' });
    return;
  }

  const secret = jwtSecret();
  const { jwtVerify } = await import('jose');
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) {
      response.status(401).json({ error: 'Your session is invalid. Sign in again.' });
      return;
    }

    response.locals.userId = payload.sub;
    next();
  } catch (error) {
    if (
      error instanceof Error &&
      [
        'JWTClaimValidationFailed',
        'JWTExpired',
        'JWTInvalid',
        'JWSInvalid',
        'JWSSignatureVerificationFailed',
      ].includes(error.name)
    ) {
      response.status(401).json({ error: 'Your session has expired. Sign in again.' });
      return;
    }
    next(error);
  }
};

export const optionalAuth: RequestHandler = (request, response, next) => {
  if (!sessionToken(request.headers.cookie)) {
    next();
    return;
  }
  return requireAuth(request, response, next);
};

export function createOAuthCredentials() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge, state: randomBytes(32).toString('base64url') };
}
