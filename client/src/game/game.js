import { createInput } from "./input.js";
import { createWorld, updateWorld } from "./world.js";
import {
  createGameState,
  createPlayer,
  spawnBullet,
  tickBullets,
  spawnFuelPickup,
  tickPickups,
  spawnTurret,
  spawnChaser,
  tickEnemies,
  tickEnemyBullets,
} from "./entities.js";
import { circleVsWalls, circlesHit } from "./collision.js";
import { spawnExplosion, tickParticles } from "./particles.js";

export function createGame(canvas) {
  const ctx = canvas.getContext("2d");
  const input = createInput();

  let world;
  let state;
  let shake = 0;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function randomXInCanyon(margin) {
    const left = world.left + margin;
    const right = world.right - margin;
    const w = Math.max(1, right - left);

    const r = world.rand();
    if (r < 0.75) return left + w * world.rand();

    const edgeBand = Math.min(60, w * 0.25);
    if (world.rand() < 0.5) return left + world.rand() * edgeBand;
    return right - world.rand() * edgeBand;
  }

  function reset(seed) {
    world = createWorld(seed);
    state = createGameState(seed, canvas.clientWidth, canvas.clientHeight);

    const playerR = 10;
    const safe = 10;
    const centerX = (world.left + world.right) * 0.5;
    const minX = world.left + playerR + safe;
    const maxX = world.right - playerR - safe;
    const px = clamp(centerX, minX, maxX);
    const py = canvas.clientHeight * 0.75;

    state.player = createPlayer(px, py);
    state.spawnInvuln = 0.6;
    shake = 0;
  }

  function gameOver() {
    spawnExplosion(state, state.player.x, state.player.y, "red");
    shake = Math.max(shake, 12);
    state.over = true;
  }

  function update(dt) {
    if (state.over) {
      tickParticles(state, dt);
      shake *= 0.9;
      return;
    }

    state.time += dt;
    state.spawnInvuln = Math.max(0, state.spawnInvuln - dt);

    const scrollSpeed = 150;
    state.distance += scrollSpeed * dt;
    state.score = Math.floor(state.distance);

    updateWorld(world, dt, canvas.clientWidth, 0);

    const p = state.player;

    const speed = p.speed * (input.boost() ? 1.3 : 1);
    p.x += input.ax() * speed * dt;
    p.y += input.ay() * speed * dt;

    const top = p.r + 4;
    const bottom = canvas.clientHeight - p.r - 4;
    if (p.y < top) p.y = top;
    if (p.y > bottom) p.y = bottom;

    if (state.spawnInvuln <= 0 && circleVsWalls(p, world)) {
      gameOver();
      return;
    }

    p.fuel -= dt * (input.boost() ? 10 : 6);
    if (p.fuel <= 0) {
      gameOver();
      return;
    }

    p.shootCooldown = Math.max(0, p.shootCooldown - dt);
    if (input.firePressed() && p.shootCooldown === 0) {
      spawnBullet(state);
      p.shootCooldown = 0.15;
      p.fuel -= 0.3;
      shake = Math.max(shake, 4);
    }
    tickBullets(state, dt);

    state.fuelSpawnTimer -= dt;
    if (state.fuelSpawnTimer <= 0) {
      spawnFuelPickup(state, randomXInCanyon(26), -20);
      state.fuelSpawnTimer = 1.6;
    }
    tickPickups(state, dt, scrollSpeed);

    state.enemySpawnTimer -= dt;
    if (state.enemySpawnTimer <= 0) {
      const xCanyon = randomXInCanyon(30);

      if (world.rand() < 0.55) {
        spawnTurret(state, xCanyon, -30);
      } else {
        spawnChaser(state, xCanyon, -30, world.rand() < 0.5 ? -140 : 140);
      }

      state.enemySpawnTimer = 1.15;
    }

    tickEnemies(state, dt, scrollSpeed, world);
    tickEnemyBullets(state, dt);

    for (let i = state.pickups.length - 1; i >= 0; i--) {
      if (circlesHit(p, state.pickups[i])) {
        p.fuel = Math.min(100, p.fuel + state.pickups[i].value);
        state.pickups.splice(i, 1);
      }
    }

    if (state.spawnInvuln <= 0) {
      for (const e of state.enemies) {
        if (circlesHit(p, e)) {
          gameOver();
          return;
        }
      }
      for (const b of state.enemyBullets) {
        if (circlesHit(p, b)) {
          gameOver();
          return;
        }
      }
    }

    for (let i = state.enemies.length - 1; i >= 0; i--) {
      for (let j = state.bullets.length - 1; j >= 0; j--) {
        if (circlesHit(state.enemies[i], state.bullets[j])) {
          spawnExplosion(state, state.enemies[i].x, state.enemies[i].y);
          shake = Math.max(shake, 8);
          state.enemies.splice(i, 1);
          state.bullets.splice(j, 1);
          break;
        }
      }
    }

    tickParticles(state, dt);
    shake *= 0.9;
    input.clearPressed();
  }

  // -------- RENDU --------

  function drawPlayerJet(p) {
    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.fillStyle = "#7dd3fc";
    ctx.beginPath();
    ctx.moveTo(0, -p.r - 6);
    ctx.lineTo(p.r + 6, p.r + 6);
    ctx.lineTo(0, p.r);
    ctx.lineTo(-p.r - 6, p.r + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(0, -4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "white";
  }

  function drawRoundedRect(x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function drawTankEnemy(e) {
    const r = e.r;

    // proportions plus "char"
    const hullW = r * 2.6;
    const hullH = r * 1.55;

    const trackW = hullW * 1.05;
    const trackH = hullH * 0.42;

    const turretR = r * 0.55;

    const hull = e.kind === "turret" ? "#84cc16" : "#fb923c"; // vert / orange
    const hullDark = "rgba(0,0,0,0.35)";
    const track = "rgba(0,0,0,0.55)";
    const metal = "rgba(255,255,255,0.75)";

    let recoil = 0;
    if (e.kind === "turret" && typeof e.shootCd === "number") {
      const t = Math.max(0, Math.min(1, (0.15 - e.shootCd) / 0.15));
      recoil = t * 3.5; 
    }

    ctx.save();
    ctx.translate(e.x, e.y);

    //  chenilles (base) 
    ctx.fillStyle = track;
    drawRoundedRect(-trackW * 0.5, -hullH * 0.5, trackW, trackH, 6);
    ctx.fill();
    drawRoundedRect(-trackW * 0.5, hullH * 0.5 - trackH, trackW, trackH, 6);
    ctx.fill();

    // galets (roues) pour crédibilité
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    const wheelCount = 4;
    const wheelR = Math.max(2, r * 0.18);
    for (let i = 0; i < wheelCount; i++) {
      const t = i / (wheelCount - 1);
      const wx = -trackW * 0.38 + t * (trackW * 0.76);
      // roue du haut et du bas (sur la chenille)
      ctx.beginPath();
      ctx.arc(wx, -hullH * 0.5 + trackH * 0.55, wheelR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx, hullH * 0.5 - trackH * 0.55, wheelR, 0, Math.PI * 2);
      ctx.fill();
    }

    // caisse (hull) 
    ctx.fillStyle = hull;
    drawRoundedRect(-hullW * 0.5, -hullH * 0.38, hullW, hullH * 0.76, 6);
    ctx.fill();

    // ombrage bas de caisse
    ctx.fillStyle = hullDark;
    drawRoundedRect(-hullW * 0.5, hullH * 0.05, hullW, hullH * 0.33, 6);
    ctx.fill();

    //  superstructure (dessus de caisse)
    ctx.fillStyle = metal;
    drawRoundedRect(
      -hullW * 0.22,
      -hullH * 0.22,
      hullW * 0.44,
      hullH * 0.26,
      6
    );
    ctx.fill();

    //  tourelle ronde
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.beginPath();
    ctx.arc(0, -hullH * 0.1, turretR, 0, Math.PI * 2);
    ctx.fill();

    // canon (vers le bas)
    ctx.fillStyle = "rgba(255,255,255,0.90)";
    const gunLen = e.kind === "turret" ? hullH * 1.05 : hullH * 0.72;
    const gunW = Math.max(3, r * 0.22);

    // départ sous la tourelle
    const gunX = -gunW * 0.5;
    const gunY = -hullH * 0.1 + turretR - recoil;
    drawRoundedRect(gunX, gunY, gunW, gunLen, 3);
    ctx.fill();

    // bouche du canon
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.arc(0, gunY + gunLen + 1.5, gunW * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // "phare" / repère direction
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(0, -hullH * 0.48, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // reset état
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "white";
  }

  function render() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.save();
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, w, h);

    // sécurité états
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // canyon
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, 0, world.left, h);
    ctx.fillRect(world.right, 0, w - world.right, h);

    const p = state.player;

    // player
    drawPlayerJet(p);

    // enemies
    for (const e of state.enemies) {
      drawTankEnemy(e);
    }

    // bullets player
    ctx.fillStyle = "white";
    for (const b of state.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // bullets enemy
    ctx.fillStyle = "white";
    for (const b of state.enemyBullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // fuel pickups
    ctx.fillStyle = "white";
    for (const pu of state.pickups) {
      ctx.save();
      ctx.translate(pu.x, pu.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-6, -6, 12, 12);
      ctx.restore();
    }

    // particles
    for (const pt of state.particles) {
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "14px system-ui";
    ctx.fillText(`Score (distance): ${state.score}`, 12, 20);
    ctx.fillText("Fuel", 12, 40);
    ctx.fillRect(60, 32, 100 * (p.fuel / 100), 8);

    if (state.over) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "white";
      ctx.font = "20px system-ui";
      ctx.fillText("GAME OVER", w / 2 - 50, h / 2);
    }
  }

  return {
    reset,
    update,
    render,
    isOver: () => state.over,
    getRunSummary: () => ({
      seed: state.seed,
      score: state.score,
      distance: Math.floor(state.distance),
      durationMs: Math.floor(performance.now() - state.startedAt),
      replay: "",
    }),
  };
}
