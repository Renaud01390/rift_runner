CREATE TABLE IF NOT EXISTS runs (
  id           BIGSERIAL PRIMARY KEY,
  player_name  TEXT NOT NULL DEFAULT 'Anonymous',
  score        INTEGER NOT NULL CHECK (score >= 0),
  distance     INTEGER NOT NULL CHECK (distance >= 0),
  duration_ms  INTEGER NOT NULL CHECK (duration_ms >= 0),
  seed         INTEGER NOT NULL,
  replay       TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS runs_score_idx ON runs (score DESC, created_at DESC);
