import { Router } from "express";
import { pool } from "../db.js";

export const leaderboardRouter = Router();

leaderboardRouter.get("/leaderboard", async (req, res) => {
  const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 20)));
  const { rows } = await pool.query(
    `SELECT id, player_name, score, distance, duration_ms, seed, created_at
     FROM runs
     ORDER BY score DESC, created_at DESC
     LIMIT $1`,
    [limit]
  );
  res.json({ items: rows });
});
