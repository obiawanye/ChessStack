
import type { Request, Response, NextFunction } from "express";
import { runGameAnalysis } from "../services/analysis.service";

export async function analyseGameController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { pgn, depth } = req.body;

    const analysis = await runGameAnalysis({
      pgn,
      depth,
    });

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
}
