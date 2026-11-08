
import { analyseGame } from "@chessstack/chess-engine";
import type { GameAnalysis } from "@chessstack/chess-engine";

export interface AnalyseGameInput {
  pgn: string;
  depth?: number;
}

export async function runGameAnalysis(
  input: AnalyseGameInput,
): Promise<GameAnalysis> {
  return analyseGame(input.pgn, {
    depth: input.depth ?? 15,
    threads: 2,
    hash: 128,
  });
}
