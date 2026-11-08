import { describe, expect, it } from "vitest";
import type { MoveClassification } from "./classifyMove";
import { classifyMove } from "./classifyMove";

describe("classifyMove", () => {
  it("supports brilliant, great, and missed-win classifications", () => {
    const brilliantClassification: MoveClassification = "brilliant";
    const greatClassification: MoveClassification = "great";
    const missedWinClassification: MoveClassification = "missed-win";

    expect(brilliantClassification).toBe("brilliant");
    expect(greatClassification).toBe("great");
    expect(missedWinClassification).toBe("missed-win");
  });

  it("classifies a 60-centipawn loss for White as an inaccuracy", () => {
    const result = classifyMove(
      { type: "cp", value: 80 },
      { type: "cp", value: 20 },
      "w",
    );

    expect(result).toEqual({
      classification: "inaccuracy",
      centipawnLoss: 60,
    });
  });

  it("classifies a 20-centipawn loss for Black as excellent", () => {
    const result = classifyMove(
      { type: "cp", value: 80 },
      { type: "cp", value: 100 },
      "b",
    );

    expect(result).toEqual({
      classification: "excellent",
      centipawnLoss: 20,
    });
  });

  it("classifies negligible evaluation loss as best", () => {
    const result = classifyMove(
      { type: "cp", value: 50 },
      { type: "cp", value: 45 },
      "w",
    );

    expect(result.classification).toBe("best");
  });

  it("classifies a large evaluation loss as a blunder", () => {
    const result = classifyMove(
      { type: "cp", value: 250 },
      { type: "cp", value: 0 },
      "w",
    );

    expect(result.classification).toBe("blunder");
  });

  it("does not use centipawn thresholds for mate evaluations", () => {
    const result = classifyMove(
      { type: "mate", value: 3 },
      { type: "cp", value: 200 },
      "w",
    );

    expect(result).toEqual({
      classification: "mate-related",
      centipawnLoss: null,
    });
  });
});