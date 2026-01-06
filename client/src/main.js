import { createGame } from "./game/game.js";
import { fetchLeaderboard, submitRun } from "./api/api.js";

const canvas = document.getElementById("game");
const btnPlay = document.getElementById("btnPlay");
const btnSubmit = document.getElementById("btnSubmit");
const nameInput = document.getElementById("name");
const leaderboardEl = document.getElementById("leaderboard");

const game = createGame(canvas);

let running = false;
let last = performance.now();

function loop(now) {
  if (!running) return;
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  game.update(dt);
  game.render();

  btnSubmit.disabled = !game.isOver();
  requestAnimationFrame(loop);
}

btnPlay.addEventListener("click", () => {
  try {
    btnPlay.blur();
    const seed = Date.now() % 2147483647 | 0;
    game.reset(seed);

    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  } catch (e) {
    console.error("Erreur lancement jeu:", e);
    alert("Erreur lancement jeu: " + String(e?.message ?? e));
  }
});

btnSubmit.addEventListener("click", async () => {
  try {
    const run = game.getRunSummary();
    const playerName = nameInput.value.trim();

    await submitRun({
      playerName: playerName.length ? playerName : undefined,
      score: run.score,
      distance: run.distance,
      durationMs: run.durationMs,
      seed: run.seed,
      replay: run.replay,
    });

    await loadLeaderboard();
    btnSubmit.disabled = true;
  } catch (e) {
    alert(String(e.message ?? e));
  }
});

async function loadLeaderboard() {
  leaderboardEl.innerHTML = "";
  try {
    const data = await fetchLeaderboard(20);
    for (const item of data.items) {
      const li = document.createElement("li");
      li.textContent = `${item.player_name} — ${item.score} pts (dist ${item.distance})`;
      leaderboardEl.appendChild(li);
    }
  } catch (e) {
    const li = document.createElement("li");
    li.textContent = "Leaderboard indisponible (API non lancée ?)";
    leaderboardEl.appendChild(li);
  }
}

loadLeaderboard();
