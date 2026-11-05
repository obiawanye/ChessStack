
import type {
  BestMove,
  EngineEvaluation,
  EngineInfo,
} from "./types";

export function parseEvaluation(
  tokens: string[],
): EngineEvaluation | undefined {
  const scoreIndex = tokens.indexOf("score");

  if (scoreIndex === -1 || scoreIndex + 2 >= tokens.length) {
    return undefined;
  }

  const type = tokens[scoreIndex + 1];
  const value = Number(tokens[scoreIndex + 2]);

  if (!Number.isFinite(value)) {
    return undefined;
  }

  if (type === "cp" || type === "mate") {
    return { type, value };
  }

  return undefined;
}

export function parseInfoLine(line: string): EngineInfo | undefined {
  const tokens = line.trim().split(/\s+/);

  if (tokens[0] !== "info") {
    return undefined;
  }

  const getNumber = (key: string): number | undefined => {
    const index = tokens.indexOf(key);

    if (index === -1 || index + 1 >= tokens.length) {
      return undefined;
    }

    const value = Number(tokens[index + 1]);

    return Number.isFinite(value) ? value : undefined;
  };

  const depth = getNumber("depth");

  // Ignore informational messages without search depth.
  if (depth === undefined) {
    return undefined;
  }

  const pvIndex = tokens.indexOf("pv");

  const principalVariation =
    pvIndex === -1 ? [] : tokens.slice(pvIndex + 1);

  return {
    depth,
    selectiveDepth: getNumber("seldepth"),
    evaluation: parseEvaluation(tokens),
    multipv: getNumber("multipv") ?? 1,
    nodes: getNumber("nodes"),
    nodesPerSecond: getNumber("nps"),
    principalVariation,
  };
}

export function parseBestMove(line: string): BestMove | undefined {
  const tokens = line.trim().split(/\s+/);

  if (tokens[0] !== "bestmove" || !tokens[1]) {
    return undefined;
  }

  if (tokens[1] === "(none)" || tokens[1] === "0000") {
    return undefined;
  }

  const ponderIndex = tokens.indexOf("ponder");

  return {
    move: tokens[1],
    ponder:
      ponderIndex !== -1 ? tokens[ponderIndex + 1] : undefined,
  };
}
