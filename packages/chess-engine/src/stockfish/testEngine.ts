
import { StockfishEngine } from "./StockfishEngine";

async function main() {
  const engine = new StockfishEngine({
    executablePath: "/opt/homebrew/bin/stockfish",
    threads: 2,
    hash: 128,
  });

  try {
    console.log("Starting Stockfish...");

    await engine.start();

    console.log("Stockfish is ready!");

    const startingPosition =
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    console.log("Analysing starting position...");

    const result = await engine.analysePosition(
      startingPosition,
      15,
    );

    console.log("\nAnalysis result:");
    console.dir(result, { depth: null });
  } catch (error) {
    console.error("Stockfish test failed:", error);
    process.exitCode = 1;
  } finally {
    await engine.stop();
  }
}

main();
