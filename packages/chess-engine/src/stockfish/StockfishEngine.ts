
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface, type Interface } from "node:readline";

import { parseBestMove, parseInfoLine } from "./uciParser";

import type {
  EngineInfo,
  PositionAnalysis,
  StockfishOptions,
} from "./types";

type LineListener = (line: string) => void;

export class StockfishEngine {
  private process?: ChildProcessWithoutNullStreams;
  private output?: Interface;
  private listeners = new Set<LineListener>();
  private isAnalyzing = false;

  private readonly options: StockfishOptions;

  constructor(options: StockfishOptions = {}) {
    this.options = options;
  }

  async start(): Promise<void> {
    if (this.process && !this.process.killed) {
      return;
    }

    const executablePath =
      this.options.executablePath ??
      process.env.STOCKFISH_PATH ??
      "stockfish";

    const engine = spawn(executablePath, [], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.process = engine;

    this.output = createInterface({
      input: engine.stdout,
    });

    this.output.on("line", (line) => {
      for (const listener of this.listeners) {
        listener(line);
      }
    });

    engine.stderr.on("data", (data: Buffer) => {
      // Stockfish diagnostic output is separate from UCI responses.
      // Keep it available for debugging when necessary.
      if (process.env.NODE_ENV === "development") {
        process.stderr.write(data);
      }
    });

    engine.on("exit", () => {
      this.process = undefined;
      this.output?.close();
      this.output = undefined;
    });

    try {
      await this.sendAndWait("uci", "uciok");

      this.sendCommand(
        `setoption name Threads value ${this.options.threads ?? 1}`,
      );

      this.sendCommand(
        `setoption name Hash value ${this.options.hash ?? 128}`,
      );

      this.sendCommand(
        `setoption name MultiPV value ${this.options.multiPV ?? 1}`,
      );

      await this.sendAndWait("isready", "readyok");
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  async analysePosition(
    fen: string,
    depth = 15,
  ): Promise<PositionAnalysis> {
    if (!this.process || this.process.killed) {
      throw new Error("Stockfish has not been started.");
    }

    if (this.isAnalyzing) {
      throw new Error("Stockfish is already analysing a position.");
    }

    if (!Number.isInteger(depth) || depth < 1) {
      throw new Error("Analysis depth must be a positive integer.");
    }

    this.isAnalyzing = true;

    const lines: EngineInfo[] = [];

    const listener: LineListener = (line) => {
      const info = parseInfoLine(line);

      if (info) {
        lines.push(info);
      }
    };

    this.listeners.add(listener);

    try {
      this.sendCommand(`position fen ${fen}`);

      const bestMovePromise = this.waitForLine(
        (line) => line.startsWith("bestmove "),
        120_000,
      );

      this.sendCommand(`go depth ${depth}`);

      const bestMoveLine = await bestMovePromise;
      const bestMove = parseBestMove(bestMoveLine);

      if (!bestMove) {
        throw new Error(
          "Stockfish did not return a legal best move for this position.",
        );
      }

      const principalLine = lines
        .filter((line) => line.multipv === 1)
        .at(-1);

      return {
        fen,
        bestMove,
        evaluation: principalLine?.evaluation,
        lines,
        depth: Math.max(0, ...lines.map((line) => line.depth)),
      };
    } finally {
      this.listeners.delete(listener);
      this.isAnalyzing = false;
    }
  }

  async stop(): Promise<void> {
    const engine = this.process;

    if (!engine) {
      return;
    }

    this.process = undefined;

    try {
      if (engine.stdin.writable) {
        engine.stdin.write("quit\n");
      }
    } catch {
      // The process may already be shutting down.
    }

    this.output?.close();
    this.output = undefined;

    if (!engine.killed) {
      engine.kill();
    }
  }

  private sendCommand(command: string): void {
    if (!this.process || !this.process.stdin.writable) {
      throw new Error("Stockfish process is not available.");
    }

    this.process.stdin.write(`${command}\n`);
  }

  private async sendAndWait(
    command: string,
    expectedResponse: string,
  ): Promise<void> {
    const response = this.waitForLine(
      (line) => line.trim() === expectedResponse,
      15_000,
    );

    this.sendCommand(command);

    await response;
  }

  private waitForLine(
    predicate: (line: string) => boolean,
    timeoutMs: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const listener: LineListener = (line) => {
        if (predicate(line)) {
          cleanup();
          resolve(line);
        }
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(
          new Error("Timed out waiting for a Stockfish response."),
        );
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timeout);
        this.listeners.delete(listener);
      };

      this.listeners.add(listener);
    });
  }
}
