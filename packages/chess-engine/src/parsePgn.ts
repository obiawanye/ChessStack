
import { Chess } from "chess.js";
import { getGameStatus } from "./gameStatus";
import type { GameStatus } from "./gameStatus";

export interface ParsedPgnMove {
  ply: number;
  color: "w" | "b";
  from: string;
  to: string;
  san: string;
  lan: string;
  piece: string;
  captured?: string;
  promotion?: string;
  before: string;
  after: string;
}

export type PgnResult = "1-0" | "0-1" | "1/2-1/2" | "*";

export interface ParsedPgn {
  headers: Record<string, string>;
  result: PgnResult;
  initialFen: string;
  finalFen: string;
  moves: ParsedPgnMove[];
  status: GameStatus;
}

export function parsePgn(pgn: string): ParsedPgn {
  if (!pgn || !pgn.trim()) {
    throw new Error("PGN input cannot be empty.");
  }

  const chess = new Chess();

  chess.loadPgn(pgn);

  const headers = chess.getHeaders();

  const validResults: readonly PgnResult[] = [
    "1-0",
    "0-1",
    "1/2-1/2",
    "*",
  ];

  const rawResult = headers.Result ?? "*";

  if (!validResults.includes(rawResult as PgnResult)) {
    throw new Error(`Invalid PGN result: ${rawResult}`);
  }

  const result = rawResult as PgnResult;

  const history = chess.history({ verbose: true });

  const moves: ParsedPgnMove[] = history.map((move, index) => ({
    ply: index + 1,
    color: move.color,
    from: move.from,
    to: move.to,
    san: move.san,
    lan: move.lan,
    piece: move.piece,
    captured: move.captured,
    promotion: move.promotion,
    before: move.before,
    after: move.after,
  }));

  return {
    headers,
    result,
    initialFen: moves[0]?.before ?? chess.fen(),
    finalFen: chess.fen(),
    moves,
    status: getGameStatus(chess),
  };
}
