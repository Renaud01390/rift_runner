export function createPlayer(x, y) {
  return { x, y, r: 10, speed: 230, fuel: 100, shootCooldown: 0 };
}

export function createGameState(seed, w, h) {
  return {
    seed,
    time: 0,
    score: 0,
    distance: 0,
    startedAt: performance.now(),
    over: false,

    viewportW: w,
    viewportH: h,

    fuelSpawnTimer: 0,
    enemySpawnTimer: 0,
    spawnInvuln: 0,

    player: null,

    bullets: [],
    enemyBullets: [],
    enemies: [],
    pickups: [],
    particles: [],
  };
}

/* ---------- PLAYER BULLETS ---------- */
export function spawnBullet(state) {
  const p = state.player;
  state.bullets.push({ x: p.x, y: p.y - 14, vy: -520, r: 3 });
}

export function tickBullets(state, dt) {
  for (const b of state.bullets) b.y += b.vy * dt;
  state.bullets = state.bullets.filter((b) => b.y > -60);
}

/* ---------- FUEL ---------- */
export function spawnFuelPickup(state, x, y) {
  state.pickups.push({ x, y, r: 9, value: 25 });
}

export function tickPickups(state, dt, scrollSpeed) {
  for (const p of state.pickups) p.y += scrollSpeed * dt;
  state.pickups = state.pickups.filter((p) => p.y < state.viewportH + 60);
}

/* ---------- ENEMIES ---------- */
export function spawnTurret(state, x, y) {
  state.enemies.push({ kind: "turret", x, y, r: 12, hp: 2, shootCd: 0.8 });
}

export function spawnChaser(state, x, y, vx) {
  state.enemies.push({ kind: "chaser", x, y, r: 11, hp: 1, vx });
}

export function spawnEnemyBullet(state, x, y, vy) {
  state.enemyBullets.push({ x, y, vy, r: 4 });
}

export function tickEnemies(state, dt, scrollSpeed, world) {
  for (const e of state.enemies) {
    e.y += scrollSpeed * dt;

    const minX = world.left + e.r + 3;
    const maxX = world.right - e.r - 3;

    if (e.kind === "chaser") {
      e.x += e.vx * dt;

      if (e.x < minX) {
        e.x = minX;
        e.vx = Math.abs(e.vx);
      } else if (e.x > maxX) {
        e.x = maxX;
        e.vx = -Math.abs(e.vx);
      }
    }

    if (e.kind === "turret") {
      e.shootCd -= dt;
      if (e.shootCd <= 0) {
        spawnEnemyBullet(state, e.x, e.y + 10, 260);
        e.shootCd = 0.8;
      }
    }

    if (e.x < minX) e.x = minX;
    if (e.x > maxX) e.x = maxX;
  }

  state.enemies = state.enemies.filter((e) => e.y < state.viewportH + 80);
}

export function tickEnemyBullets(state, dt) {
  for (const b of state.enemyBullets) b.y += b.vy * dt;
  state.enemyBullets = state.enemyBullets.filter(
    (b) => b.y > -80 && b.y < state.viewportH + 80
  );
}
