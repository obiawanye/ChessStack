# ChessStack

**Understand every move.**

ChessStack is a cross-platform chess game analysis application that helps players understand their games through detailed Stockfish-powered analysis.

Users can upload completed chess games in PGN format from platforms such as Chess.com and Lichess and receive an analysis of their moves, mistakes, blunders, missed opportunities and overall performance.

## Platforms

- Web: React + TypeScript
- Android: React Native + Kotlin
- iOS: React Native + Swift

## Technology Stack

| Component | Technology |
|---|---|
| Web | React, TypeScript, Tailwind CSS |
| Mobile | React Native, Expo, TypeScript |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Chess Engine | Stockfish |
| Chess Logic | chess.js |
| Package Manager | pnpm |

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

## Core Features

- PGN file uploads
- Automated Stockfish analysis
- Move classification
- Best move recommendations
- Interactive chessboard
- Game evaluation graphs
- Game performance reports
- Saved game analysis

## Platforms Supported

- Web
- iOS
- Android

## License
Copyright (c) 2026 Obichukwu Awanye and Mustapha Abba. All rights reserved.

This source code and all related files are confidential and proprietary. 

Unauthorized copying, modification, distribution, or commercial exploitation of this software, via any medium, is strictly prohibited. 

Use, modification, or monetization of this code is permitted only under explicit, written authorization from the copyright holders.

## Developers
 - Obichukwu Awanye
 - Mustapha Abba 