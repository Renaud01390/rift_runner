import { z } from "zod";

export const postRunSchema = z.object({
  playerName: z.string().min(1).max(32).optional(),
  score: z.number().int().min(0).max(2_000_000),
  distance: z.number().int().min(0).max(5_000_000),
  durationMs: z
    .number()
    .int()
    .min(0)
    .max(60 * 60 * 1000),
  seed: z.number().int(),
  replay: z.string().max(200_000).optional(),
});
