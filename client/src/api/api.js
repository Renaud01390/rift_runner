const API_BASE = localStorage.getItem("API_BASE") || "http://localhost:8080";

export async function fetchLeaderboard(limit = 20) {
  const res = await fetch(`${API_BASE}/leaderboard?limit=${limit}`);
  if (!res.ok) throw new Error(`Leaderboard error ${res.status}`);
  return await res.json();
}

export async function submitRun(payload) {
  const res = await fetch(`${API_BASE}/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Submit error ${res.status}: ${txt}`);
  }
  return await res.json();
}
