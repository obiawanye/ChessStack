import { describe, expect, it } from "vitest";
import { normalizeEvaluation } from "../analyseGame";

describe("normalizeEvaluation", () => {
  const whiteToMove =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  const blackToMove =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1";

  it("preserves evaluation signs when White is to move", () => {
    expect(
      normalizeEvaluation({ type: "cp", value: 35 }, whiteToMove),
    ).toEqual({ type: "cp", value: 35 });
  });

  it("reverses evaluation signs when Black is to move", () => {
    expect(
      normalizeEvaluation({ type: "cp", value: 35 }, blackToMove),
    ).toEqual({ type: "cp", value: -35 });
  });

  it("normalizes mate evaluations correctly", () => {
    expect(
      normalizeEvaluation({ type: "mate", value: 3 }, blackToMove),
    ).toEqual({ type: "mate", value: -3 });
  });
});