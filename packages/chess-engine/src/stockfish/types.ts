
export interface StockfishOptions {
  threads?: number;
  hash?: number;
  multiPV?: number;
  executablePath?: string;
}

export interface EngineEvaluation {
  type: "cp" | "mate";
  value: number;
}

export interface EngineInfo {
  depth: number;
  selectiveDepth?: number;
  evaluation?: EngineEvaluation;
  multipv: number;
  nodes?: number;
  nodesPerSecond?: number;
  principalVariation: string[];
}

export interface BestMove {
  move: string;
  ponder?: string;
}

export interface PositionAnalysis {
  fen: string;
  bestMove: BestMove;
  evaluation?: EngineEvaluation;
  lines: EngineInfo[];
  depth: number;
}
