
import type { MoveClassification } from "./classifyMove";

export interface AccuracyMove {
  color: "w" | "b";
  centipawnLoss: number | null;
  classification: MoveClassification;
}

export interface PlayerAccuracy {
  accuracy: number | null;
  averageCentipawnLoss: number | null;
  analysedMoves: number;
  scoredMoves: number;
  classifications: Record<MoveClassification, number>;
}

export interface GameAccuracy {
  white: PlayerAccuracy;
  black: PlayerAccuracy;
}

export interface AccuracyOptions {
  decayConstant?: number;
}

const DEFAULT_DECAY_CONSTANT = 0.002;

const CLASSIFICATIONS: MoveClassification[] = [
  "best",
  "excellent",
  "good",
  "inaccuracy",
  "mistake",
  "blunder",
  "mate-related",
];

function createClassificationCounts(): Record<MoveClassification, number> {
  return Object.fromEntries(
    CLASSIFICATIONS.map((classification) => [classification, 0]),
  ) as Record<MoveClassification, number>;
}

function calculatePlayerAccuracy(
  moves: AccuracyMove[],
  decayConstant: number,
): PlayerAccuracy {
  const classifications = createClassificationCounts();

  let totalCentipawnLoss = 0;
  let scoredMoves = 0;

  for (const move of moves) {
    classifications[move.classification]++;

    if (move.centipawnLoss === null) {
      continue;
    }

    if (
      !Number.isFinite(move.centipawnLoss) ||
      move.centipawnLoss < 0
    ) {
      throw new Error("Centipawn loss must be a non-negative number.");
    }

    totalCentipawnLoss += move.centipawnLoss;
    scoredMoves++;
  }

  if (scoredMoves === 0) {
    return {
      accuracy: null,
      averageCentipawnLoss: null,
      analysedMoves: moves.length,
      scoredMoves: 0,
      classifications,
    };
  }

  const averageCentipawnLoss =
    totalCentipawnLoss / scoredMoves;

  const accuracy =
    100 * Math.exp(-decayConstant * averageCentipawnLoss);

  return {
    accuracy: Number(accuracy.toFixed(2)),
    averageCentipawnLoss: Number(
      averageCentipawnLoss.toFixed(2),
    ),
    analysedMoves: moves.length,
    scoredMoves,
    classifications,
  };
}

export function calculateAccuracy(
  moves: AccuracyMove[],
  options: AccuracyOptions = {},
): GameAccuracy {
  const decayConstant =
    options.decayConstant ?? DEFAULT_DECAY_CONSTANT;

  if (!Number.isFinite(decayConstant) || decayConstant < 0) {
    throw new Error("Decay constant must be a non-negative number.");
  }

  const whiteMoves = moves.filter((move) => move.color === "w");
  const blackMoves = moves.filter((move) => move.color === "b");

  return {
    white: calculatePlayerAccuracy(whiteMoves, decayConstant),
    black: calculatePlayerAccuracy(blackMoves, decayConstant),
  };
}
