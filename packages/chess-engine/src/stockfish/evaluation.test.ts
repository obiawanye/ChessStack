
import assert from "node:assert/strict";
import { normalizeEvaluation } from "../analyseGame";

const whiteToMove =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const blackToMove =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1";

// White-to-move evaluations retain their sign.
assert.deepEqual(
  normalizeEvaluation({ type: "cp", value: 35 }, whiteToMove),
  { type: "cp", value: 35 },
);

// Black-to-move evaluations have their sign reversed.
assert.deepEqual(
  normalizeEvaluation({ type: "cp", value: 35 }, blackToMove),
  { type: "cp", value: -35 },
);

// Mate evaluations are normalised in the same way.
assert.deepEqual(
  normalizeEvaluation({ type: "mate", value: 3 }, blackToMove),
  { type: "mate", value: -3 },
);

console.log("Evaluation normalisation tests passed!");
