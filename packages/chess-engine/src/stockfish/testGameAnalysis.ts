
import { analyseGame } from "../analyseGame";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function main() {
  try {
    const sampleGame = await readFile(
      resolve(process.cwd(), "packages/chess-engine/src/stockfish/testGame.pgn"),
      "utf8"
    );
    console.log("Starting full-game analysis...");

    const result = await analyseGame(sampleGame, {
      depth: 8,
      threads: 2,
      hash: 128,
    });

    console.log("\nGame analysis completed!");

    console.log("Headers:", result.headers);
    console.log("Depth:", result.depth);
    console.log("Initial evaluation:", result.initialEvaluation);
    console.log("Final evaluation:", result.finalEvaluation);
    console.log("Positions analysed:", result.totalPositionsAnalysed);

    console.log("\nMove-by-move analysis:");

    console.table(
      result.moves.map((move) => ({
        ply: move.ply,
        color: move.color === "w" ? "White" : "Black",
        move: move.san,
        before: move.beforeEvaluation.value,
        after: move.afterEvaluation.value,
        centipawnLoss: move.centipawnLoss,
        classification: move.classification
      })),
    );

    console.log("\nPlayer accuracy:");

    console.log("White:", result.accuracy.white);
    console.log("Black:", result.accuracy.black);
    
  } catch (error) {
    console.error("Game analysis failed:", error);
    process.exitCode = 1;
  }
}

main();
