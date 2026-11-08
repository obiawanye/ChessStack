import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { getGameStatus } from "./gameStatus";

describe("getGameStatus", () => {
  it("detects an ongoing game", () => {
    const chess = new Chess();

    expect(getGameStatus(chess)).toEqual({
      isGameOver: false,
      isCheck: false,
      canClaimDraw: false,
      termination: "ongoing",
      winner: null,
    });
  });

  it("detects checkmate and identifies the winner", () => {
    const chess = new Chess();

    chess.move("f3");
    chess.move("e5");
    chess.move("g4");
    chess.move("Qh4#");

    expect(getGameStatus(chess)).toEqual({
      isGameOver: true,
      isCheck: true,
      canClaimDraw: false,
      termination: "checkmate",
      winner: "black",
    });
  });

  it("detects stalemate", () => {
    const chess = new Chess(
      "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
    );

    expect(getGameStatus(chess)).toEqual({
      isGameOver: true,
      isCheck: false,
      canClaimDraw: false,
      termination: "stalemate",
      winner: null,
    });
  });

  it("detects insufficient material", () => {
    const chess = new Chess(
      "8/8/8/8/8/8/4k3/7K w - - 0 1",
    );

    expect(getGameStatus(chess)).toEqual({
      isGameOver: true,
      isCheck: false,
      canClaimDraw: false,
      termination: "insufficient-material",
      winner: null,
    });
  });
  
  it("detects threefold repetition", () => {
    const chess = new Chess();

    chess.move("Nf3");
    chess.move("Nf6");
    chess.move("Ng1");
    chess.move("Ng8");

    chess.move("Nf3");
    chess.move("Nf6");
    chess.move("Ng1");
    chess.move("Ng8");

    expect(getGameStatus(chess)).toEqual({
        isGameOver: false,
        isCheck: false,
        canClaimDraw: true,
        termination: "ongoing",
        winner: null,
    });
  });
});