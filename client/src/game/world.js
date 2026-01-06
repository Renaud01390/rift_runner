function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWorld(seed) {
  const rand = mulberry32(seed);

  return {
    seed,
    rand,

    left: 160,
    right: 560,

    // Cibles
    targetCenter: 360,
    targetWidth: 400,

    changeTimer: 0,
  };
}

export function updateWorld(world, dt, viewW, difficulty = 0) {
  const CHANGE_EVERY = 2.2;

  world.changeTimer += dt;
  if (world.changeTimer >= CHANGE_EVERY) {
    world.changeTimer = 0;

    const minW = Math.max(320, viewW * 0.52);
    const maxW = Math.max(420, viewW * 0.72);

    world.targetWidth = minW + (maxW - minW) * world.rand();

    const margin = Math.max(140, viewW * 0.18);
    world.targetCenter = margin + (viewW - margin * 2) * world.rand();
  }

  const width = world.right - world.left;
  const center = (world.left + world.right) * 0.5;

  const K = 1.2 + difficulty * 0.05;

  const a = Math.min(1, K * dt);

  const newWidth = width + (world.targetWidth - width) * a;
  const newCenter = center + (world.targetCenter - center) * a;

  const wallMin = 20;
  let left = newCenter - newWidth * 0.5;
  let right = newCenter + newWidth * 0.5;

  if (left < wallMin) {
    left = wallMin;
    right = left + newWidth;
  }
  if (right > viewW - wallMin) {
    right = viewW - wallMin;
    left = right - newWidth;
  }

  world.left = left;
  world.right = right;
}
