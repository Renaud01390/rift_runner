export function createParticle(x, y, color = "white") {
  const a = Math.random() * Math.PI * 2;
  const s = 80 + Math.random() * 180;

  return {
    x,
    y,
    vx: Math.cos(a) * s,
    vy: Math.sin(a) * s,
    life: 0.4 + Math.random() * 0.4,
    r: 2 + Math.random() * 2,
    color,
  };
}

export function spawnExplosion(state, x, y, color = "white") {
  for (let i = 0; i < 18; i++)
    state.particles.push(createParticle(x, y, color));
}

export function tickParticles(state, dt) {
  for (const p of state.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.98;
    p.vy *= 0.98;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
}
