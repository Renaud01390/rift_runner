export function createInput() {
  const keys = new Set();
  const pressed = new Set();

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") e.preventDefault();
    if (!keys.has(e.code)) pressed.add(e.code);
    keys.add(e.code);
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
  });

  return {
    ax: () =>
      (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) -
      (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0),

    ay: () =>
      (keys.has("ArrowDown") || keys.has("KeyS") ? 1 : 0) -
      (keys.has("ArrowUp") || keys.has("KeyW") ? 1 : 0),

    firePressed: () => pressed.has("Space"),
    boost: () => keys.has("ShiftLeft") || keys.has("ShiftRight"),
    clearPressed: () => pressed.clear(),
  };
}
