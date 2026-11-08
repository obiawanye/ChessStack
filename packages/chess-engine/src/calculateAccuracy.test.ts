import { describe, expect, it } from "vitest";
import { calculateAccuracy } from "./calculateAccuracy";

describe("calculateAccuracy", () => {
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

  it("calculates White's average centipawn loss and accuracy", () => {
    const result = calculateAccuracy(moves);

    expect(result.white.averageCentipawnLoss).toBe(20);
    expect(result.white.accuracy).toBe(96.08);
  });

  it("calculates Black's average centipawn loss and accuracy", () => {
    const result = calculateAccuracy(moves);

    expect(result.black.averageCentipawnLoss).toBe(75);
    expect(result.black.accuracy).toBe(86.07);
  });

  it("calculates classification statistics for both players", () => {
    const result = calculateAccuracy(moves);

    expect(result.white.classifications.excellent).toBe(1);
    expect(result.white.classifications.good).toBe(1);
    expect(result.black.classifications.good).toBe(1);
    expect(result.black.classifications.inaccuracy).toBe(1);
  });

  it("excludes mate-related moves from the centipawn average", () => {
    const result = calculateAccuracy([
      {
        color: "w",
        centipawnLoss: null,
        classification: "mate-related",
      },
    ]);

    expect(result.white.accuracy).toBeNull();
    expect(result.white.scoredMoves).toBe(0);
    expect(result.white.classifications["mate-related"]).toBe(1);
  });

  it("does not assign artificial accuracy to empty games", () => {
    const result = calculateAccuracy([]);

    expect(result.white.accuracy).toBeNull();
    expect(result.black.accuracy).toBeNull();
  });
});