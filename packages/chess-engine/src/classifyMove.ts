
import type { EngineEvaluation } from "./stockfish/types";

export type MoveClassification =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "missed-win"
  | "mate-related";

export interface MoveClassificationResult {
  classification: MoveClassification;
  centipawnLoss: number | null;
}

interface ClassificationOptions {
  best?: number;
  excellent?: number;
  good?: number;
  inaccuracy?: number;
  mistake?: number;
}

const DEFAULT_THRESHOLDS: Required<ClassificationOptions> = {
  best: 10,
  excellent: 25,
  good: 50,
  inaccuracy: 100,
  mistake: 200,
};

/**
 * Classifies a move using the change in evaluation
 * from the moving player's perspective.
 *
 * Both evaluations must already be normalised
 * to White's perspective.
 */
export function classifyMove(
  before: EngineEvaluation,
  after: EngineEvaluation,
  color: "w" | "b",
  options: ClassificationOptions = {},
): MoveClassificationResult {
  // Mate evaluations require separate treatment.
  if (before.type === "mate" || after.type === "mate") {
    return {
      classification: "mate-related",
      centipawnLoss: null,
    };
  }

  const thresholds = {
    ...DEFAULT_THRESHOLDS,
    ...options,
  };

  // Validate threshold ordering.
  if (
    thresholds.best < 0 ||
    thresholds.excellent < thresholds.best ||
    thresholds.good < thresholds.excellent ||
    thresholds.inaccuracy < thresholds.good ||
    thresholds.mistake < thresholds.inaccuracy
  ) {
    throw new Error("Invalid move classification thresholds.");
  }

  // Convert White-perspective evaluations into
  // the perspective of the player who made the move.
  const beforeValue =
    color === "w" ? before.value : -before.value;

  const afterValue =
    color === "w" ? after.value : -after.value;

  const centipawnLoss = Math.max(
    0,
    beforeValue - afterValue,
  );

  let classification: MoveClassification;

  if (centipawnLoss <= thresholds.best) {
    classification = "best";
  } else if (centipawnLoss <= thresholds.excellent) {
    classification = "excellent";
  } else if (centipawnLoss <= thresholds.good) {
    classification = "good";
  } else if (centipawnLoss <= thresholds.inaccuracy) {
    classification = "inaccuracy";
  } else if (centipawnLoss <= thresholds.mistake) {
    classification = "mistake";
  } else {
    classification = "blunder";
  }

  return {
    classification,
    centipawnLoss,
  };
}
