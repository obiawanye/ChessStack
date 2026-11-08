CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "AccountProvider" AS ENUM ('LICHESS', 'CHESS_COM');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConnectedAccount" (
    "id" TEXT NOT NULL,
    "provider" "AccountProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConnectedAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "provider" "AccountProvider" NOT NULL,
    "providerGameId" TEXT NOT NULL,
    "white" TEXT NOT NULL,
    "black" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3),
    "gameUrl" TEXT,
    "pgn" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "accent" TEXT NOT NULL DEFAULT 'indigo',
    "gamesPerSync" INTEGER NOT NULL DEFAULT 20,
    "ratedGamesOnly" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "OAuthState" (
    "state" TEXT NOT NULL,
    "codeVerifier" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OAuthState_pkey" PRIMARY KEY ("state")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "ConnectedAccount_userId_idx" ON "ConnectedAccount"("userId");
CREATE UNIQUE INDEX "ConnectedAccount_provider_providerUserId_key" ON "ConnectedAccount"("provider", "providerUserId");
CREATE UNIQUE INDEX "ConnectedAccount_userId_provider_key" ON "ConnectedAccount"("userId", "provider");
CREATE INDEX "Game_userId_playedAt_idx" ON "Game"("userId", "playedAt");
CREATE UNIQUE INDEX "Game_userId_provider_providerGameId_key" ON "Game"("userId", "provider", "providerGameId");
CREATE INDEX "OAuthState_expiresAt_idx" ON "OAuthState"("expiresAt");

ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Game" ADD CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OAuthState" ADD CONSTRAINT "OAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
