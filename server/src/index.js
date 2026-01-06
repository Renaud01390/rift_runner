import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import { healthRouter } from "./routes/health.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { runsRouter } from "./routes/runs.js";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: "300kb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));

app.use(healthRouter);
app.use(leaderboardRouter);
app.use(runsRouter);

async function initDb() {
  const sqlPath = path.join(__dirname, "../sql/001_init.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  await pool.query(sql);
}

const port = Number(process.env.PORT ?? 8080);

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("DB init failed:", err);
    process.exit(1);
  });
