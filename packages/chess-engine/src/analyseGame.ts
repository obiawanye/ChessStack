import { calculateAccuracy } from "./calculateAccuracy";
import type { GameAccuracy } from "./calculateAccuracy";
import { classifyMove } from "./classifyMove";
import type { MoveClassification } from "./classifyMove";
import { parsePgn } from "./parsePgn";
import { StockfishEngine } from "./stockfish/StockfishEngine";

import type {
  EngineEvaluation,
  StockfishOptions,
} from "./stockfish/types";

// ---------------------------------------------
// Types
// ---------------------------------------------

export interface GameAnalysisOptions {
  depth?: number;
  threads?: number;
  hash?: number;
  executablePath?: string;
}

export interface AnalysedMove {
  ply: number;
  color: "w" | "b";
  san: string;
  lan: string;
  from: string;
  to: string;
  beforeEvaluation: EngineEvaluation;
  afterEvaluation: EngineEvaluation;
  centipawnLoss: number | null;
  classification: MoveClassification;
}

export interface GameAnalysis {
  headers: Record<string, string>;
  depth: number;
  initialEvaluation: EngineEvaluation;
  finalEvaluation: EngineEvaluation;
  moves: AnalysedMove[];
  totalPositionsAnalysed: number;
  accuracy: GameAccuracy;
}

// ---------------------------------------------
// Evaluation normalisation
// ---------------------------------------------

/**
 * Converts a Stockfish evaluation into White's perspective.
 */
export function normalizeEvaluation(
  evaluation: EngineEvaluation,
  fen: string,
): EngineEvaluation {
  const fenParts = fen.trim().split(/\s+/);

  if (fenParts.length < 2) {
    throw new Error("Invalid FEN: missing active colour.");
  }

  const activeColor = fenParts[1];

  if (activeColor !== "w" && activeColor !== "b") {
    throw new Error("Invalid FEN: active colour must be w or b.");
  }

  return {
    type: evaluation.type,
    value:
      activeColor === "w"
        ? evaluation.value
        : -evaluation.value,
  };
}

// ---------------------------------------------
// Evaluation comparison
// ---------------------------------------------

/**
 * Calculates how much evaluation the moving player lost.
 *
 * Positive centipawn loss means the player worsened
 * their position compared with the engine evaluation
 * before their move.
 */
function calculateCentipawnLoss(
  before: EngineEvaluation,
  after: EngineEvaluation,
  color: "w" | "b",
): number {
  if (before.type !== "cp" || after.type !== "cp") {
    return 0;
  }

  const loss =
    color === "w"
      ? before.value - after.value
      : after.value - before.value;

  return Math.max(0, loss);
}

// ---------------------------------------------
// Full-game analysis
// ---------------------------------------------

export async function analyseGame(
  pgn: string,
  options: GameAnalysisOptions = {},
): Promise<GameAnalysis> {
  const depth = options.depth ?? 15;

  if (!Number.isInteger(depth) || depth < 1 || depth > 30) {
    throw new Error("Analysis depth must be between 1 and 30.");
  }

  const parsedGame = parsePgn(pgn);

  const engineOptions: StockfishOptions = {
    threads: options.threads ?? 2,
    hash: options.hash ?? 128,
    multiPV: 1,
    executablePath: options.executablePath,
  };

  const engine = new StockfishEngine(engineOptions);

  try {
    await engine.start();

    // Analyse the starting position.
    const initialResult = await engine.analysePosition(
      parsedGame.initialFen,
      depth,
    );

    if (!initialResult.evaluation) {
      throw new Error(
        "Stockfish did not return an evaluation for the initial position.",
      );
    }

    const initialEvaluation = normalizeEvaluation(
      initialResult.evaluation,
      parsedGame.initialFen,
    );

    let previousEvaluation = initialEvaluation;

    const analysedMoves: AnalysedMove[] = [];

    // Analyse every resulting position.
    for (const move of parsedGame.moves) {
      const positionResult = await engine.analysePosition(
        move.after,
        depth,
      );

      if (!positionResult.evaluation) {
        throw new Error(
          `Stockfish did not return an evaluation after move ${move.san}.`,
        );
      }

      const afterEvaluation = normalizeEvaluation(
        positionResult.evaluation,
        move.after,
      );

      const moveClassification = classifyMove(
        previousEvaluation,
        afterEvaluation,
        move.color,
      );

      analysedMoves.push({
        ply: move.ply,
        color: move.color,
        san: move.san,
        lan: move.lan,
        from: move.from,
        to: move.to,
        beforeEvaluation: previousEvaluation,
        afterEvaluation,
        centipawnLoss: moveClassification.centipawnLoss,
        classification: moveClassification.classification
      });

      previousEvaluation = afterEvaluation;
    }

    const accuracy = calculateAccuracy(analysedMoves);

    return {
      headers: parsedGame.headers,
      depth,
      initialEvaluation,
      finalEvaluation: previousEvaluation,
      moves: analysedMoves,
      totalPositionsAnalysed: parsedGame.moves.length + 1,
      accuracy,
    };
  } finally {
    await engine.stop();
  }
}