import { Router } from "express";
import { pool } from "../db.js";
import { postRunSchema } from "../validate.js";

export const runsRouter = Router();

runsRouter.post("/runs", async (req, res) => {
  const parsed = postRunSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const { playerName, score, distance, durationMs, seed, replay } = parsed.data;

  const maxScore = Math.floor(distance * 5 + (durationMs / 1000) * 50) + 50_000;
  if (score > maxScore) {
    return res
      .status(400)
      .json({ error: "Run rejected (score too high for distance/duration)" });
  }

  const { rows } = await pool.query(
    `INSERT INTO runs (player_name, score, distance, duration_ms, seed, replay)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      (playerName ?? "Anonymous").trim(),
      score,
      distance,
      durationMs,
      seed,
      replay ?? "",
    ]
  );

  res.status(201).json({ id: rows[0].id });
});

runsRouter.get("/runs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id))
    return res.status(400).json({ error: "Invalid id" });

  const { rows } = await pool.query(
    `SELECT id, player_name, score, distance, duration_ms, seed, replay, created_at
     FROM runs
     WHERE id = $1`,
    [id]
  );

  if (rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});
