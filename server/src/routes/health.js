import { Router } from "express";
import { pool } from "../db.js";

export const healthRouter = Router();

healthRouter.get("/health", async (req, res) => {
  const r = await pool.query("SELECT 1 as ok");
  res.json({ ok: true, db: r.rows[0].ok === 1 });
});
