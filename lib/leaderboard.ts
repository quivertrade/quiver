export const HANDLE_KEY = "quiver-handle";
const ID_KEY = "quiver-id";

export function getTraderId(): string {
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function getHandle(): string {
  return localStorage.getItem(HANDLE_KEY) ?? "";
}

export function setHandle(handle: string) {
  localStorage.setItem(HANDLE_KEY, handle.trim().slice(0, 20));
}

/** Push the local points score to the shared leaderboard (no-op without a handle). */
export async function syncPoints(points: number, pnl: number): Promise<void> {
  const handle = getHandle();
  if (!handle) return;
  try {
    await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: getTraderId(), handle, points, pnl }),
    });
  } catch {
    // offline — will sync next time
  }
}
