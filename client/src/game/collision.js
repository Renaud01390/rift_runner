export function circleVsWalls(p, world) {
  return p.x - p.r < world.left || p.x + p.r > world.right;
}

export function circlesHit(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = a.r + b.r;
  return dx * dx + dy * dy <= r * r;
}
