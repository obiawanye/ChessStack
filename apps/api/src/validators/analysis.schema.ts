
import { z } from "zod";

export const analysisSchema = z.object({
  pgn: z
    .string({
      error: "PGN must be a string.",
    })
    .trim()
    .min(1, "PGN cannot be empty."),

  depth: z
    .number({
      error: "Analysis depth must be a number.",
    })
    .int("Analysis depth must be an integer.")
    .min(1, "Analysis depth must be at least 1.")
    .max(30, "Analysis depth cannot exceed 30.")
    .optional()
    .default(15),
});

export type AnalysisInput = z.infer<typeof analysisSchema>;
