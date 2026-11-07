# ChessStack

**Understand every move.**

ChessStack is a cross-platform chess game analysis application that helps players understand their games through detailed Stockfish-powered analysis.

Users can upload completed chess games in PGN format from platforms such as Chess.com and Lichess and receive an analysis of their moves, mistakes, blunders, missed opportunities and overall performance.

## Platforms

- Web: React + TypeScript
- Android: React Native + Kotlin
- iOS: React Native + Swift

## Technology Stack

| Component       | Technology                      |
| --------------- | ------------------------------- |
| Web             | React, TypeScript, Tailwind CSS |
| Mobile          | React Native, Expo, TypeScript  |
| Backend         | Node.js, Express.js, TypeScript |
| Database        | PostgreSQL                      |
| ORM             | Prisma                          |
| Chess Engine    | Stockfish                       |
| Chess Logic     | chess.js                        |
| Package Manager | pnpm                            |

## Repository Structure

```text
apps/
  web/                 # Web application
  mobile/              # React Native application
  api/                 # Backend API

packages/
  shared/              # Shared types and schemas
  chess-engine/        # Chess analysis utilities

docs/                  # Project documentation
```

## Development

### Prerequisites

- Node.js 22
- pnpm
- Git

### Installation

```bash
git clone YOUR_REPOSITORY_URL
cd ChessStack
pnpm install
```

### Accounts and game imports

The API stores users, linked providers, game PGNs, preferences, and short-lived Lichess OAuth
states in PostgreSQL. Start the local database with `docker compose up -d postgres`, copy
`apps/api/.env.example` to `apps/api/.env`, set a unique `JWT_ACCESS_SECRET`, and register a
Lichess OAuth application whose callback URL matches `LICHESS_REDIRECT_URI`. Then run:

```bash
npm run prisma:generate --workspace=@chessstack/api
npm run prisma:migrate --workspace=@chessstack/api
npm run dev --workspace=@chessstack/api
npm run dev --workspace=@chessstack/web
```

Lichess supports OAuth sign-in and account linking. Chess.com does not offer a public OAuth
sign-in flow, so ChessStack links its public profile by verifying the supplied username with
the Chess.com public API. Imported games and account settings are saved per ChessStack user.

## Core Features

- PGN file uploads
- PGN game viewer with an interactive board, move list, and playback controls
- Automated Stockfish analysis
- Move classification
- Best move recommendations
- Interactive chessboard
- Game evaluation graphs
- Game performance reports
- Saved game analysis

The web PGN viewer uses [`chess.js`](https://github.com/jhlywa/chess.js), an open-source
TypeScript chess rules and PGN library (BSD-2-Clause). The board UI is rendered by ChessStack.

## Platforms Supported

- Web
- iOS
- Android

## License

To be determined.
