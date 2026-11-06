
import assert from "node:assert/strict";
import { calculateAccuracy } from "./calculateAccuracy";

const moves = [
  {
    color: "w" as const,
    centipawnLoss: 10,
    classification: "excellent" as const,
  },
  {
    color: "b" as const,
    centipawnLoss: 50,
    classification: "good" as const,
  },
  {
    color: "w" as const,
    centipawnLoss: 30,
    classification: "good" as const,
  },
  {
    color: "b" as const,
    centipawnLoss: 100,
    classification: "inaccuracy" as const,
  },
];

const result = calculateAccuracy(moves);

// White average CPL: (10 + 30) / 2 = 20.
assert.equal(result.white.averageCentipawnLoss, 20);
assert.equal(result.white.accuracy, 96.08);

// Black average CPL: (50 + 100) / 2 = 75.
assert.equal(result.black.averageCentipawnLoss, 75);
assert.equal(result.black.accuracy, 86.07);

// Classification statistics.
assert.equal(result.white.classifications.excellent, 1);
assert.equal(result.white.classifications.good, 1);
assert.equal(result.black.classifications.good, 1);
assert.equal(result.black.classifications.inaccuracy, 1);

// Mate-related moves are excluded from the CPL average.
const mateResult = calculateAccuracy([
  {
    color: "w",
    centipawnLoss: null,
    classification: "mate-related",
  },
]);

assert.equal(mateResult.white.accuracy, null);
assert.equal(mateResult.white.scoredMoves, 0);
assert.equal(mateResult.white.classifications["mate-related"], 1);

// Empty games should not receive an artificial 100% accuracy.
const emptyResult = calculateAccuracy([]);

assert.equal(emptyResult.white.accuracy, null);
assert.equal(emptyResult.black.accuracy, null);

console.log("All accuracy calculation tests passed!");
