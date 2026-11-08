
import type { Chess } from "chess.js";

export type GameTermination =
  | "checkmate"
  | "stalemate"
  | "threefold-repetition"
  | "fifty-move-rule"
  | "insufficient-material"
  | "draw"
  | "ongoing";

export interface GameStatus {
  isGameOver: boolean;
  isCheck: boolean;
  canClaimDraw: boolean;
  termination: GameTermination;
  winner: "white" | "black" | null;
}

export function getGameStatus(chess: Chess): GameStatus {
  const isCheck = chess.isCheck();

  if (chess.isCheckmate()) {
    return {
      isGameOver: true,
      isCheck,
      canClaimDraw: false,
      termination: "checkmate",
      winner: chess.turn() === "w" ? "black" : "white",
    };
  }

  if (chess.isStalemate()) {
    return {
      isGameOver: true,
      isCheck,
      canClaimDraw: false,
      termination: "stalemate",
      winner: null,
    };
  }

  if (chess.isInsufficientMaterial()) {
    return {
      isGameOver: true,
      isCheck,
      canClaimDraw: false,
      termination: "insufficient-material",
      winner: null,
    };
  }

  if (chess.isThreefoldRepetition() || chess.isDrawByFiftyMoves()) {
    return {
      isGameOver: false,
      isCheck,
      canClaimDraw: true,
      termination: "ongoing",
      winner: null,
    };
  }

  if (chess.isDraw()) {
    return {
      isGameOver: true,
      isCheck,
      canClaimDraw: false,
      termination: "draw",
      winner: null,
    };
  }

  return {
    isGameOver: false,
    isCheck,
    canClaimDraw: false,
    termination: "ongoing",
    winner: null,
  };
}