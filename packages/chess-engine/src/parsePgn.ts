
import { Chess } from "chess.js";

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

export interface ParsedPgn {
  headers: Record<string, string>;
  initialFen: string;
  finalFen: string;
  moves: ParsedPgnMove[];
}

export function parsePgn(pgn: string): ParsedPgn {
  if (!pgn || !pgn.trim()) {
    throw new Error("PGN input cannot be empty.");
  }

  const chess = new Chess();

  chess.loadPgn(pgn);

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
    headers: chess.getHeaders(),
    initialFen: moves[0]?.before ?? chess.fen(),
    finalFen: chess.fen(),
    moves,
  };
}
