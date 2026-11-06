
import assert from "node:assert/strict";

import { classifyMove } from "./classifyMove";

// White loses 60 centipawns.
const whiteMistake = classifyMove(
  { type: "cp", value: 80 },
  { type: "cp", value: 20 },
  "w",
);

assert.deepEqual(whiteMistake, {
  classification: "inaccuracy",
  centipawnLoss: 60,
});

// Black loses 20 centipawns.
const blackMove = classifyMove(
  { type: "cp", value: 80 },
  { type: "cp", value: 100 },
  "b",
);

assert.deepEqual(blackMove, {
  classification: "excellent",
  centipawnLoss: 20,
});

// A move with negligible loss is classified as best.
const bestMove = classifyMove(
  { type: "cp", value: 50 },
  { type: "cp", value: 45 },
  "w",
);

assert.equal(bestMove.classification, "best");

// A large evaluation loss is a blunder.
const blunder = classifyMove(
  { type: "cp", value: 250 },
  { type: "cp", value: 0 },
  "w",
);

assert.equal(blunder.classification, "blunder");

// Mate evaluations are not classified using centipawn thresholds.
const mateMove = classifyMove(
  { type: "mate", value: 3 },
  { type: "cp", value: 200 },
  "w",
);

assert.deepEqual(mateMove, {
  classification: "mate-related",
  centipawnLoss: null,
});

console.log("All move classification tests passed!");
