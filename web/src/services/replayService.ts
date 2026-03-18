/**
 * Replay polling service.
 * Fetches replays.json periodically and notifies when new replay links appear.
 */

const REPLAY_URL = import.meta.env.BASE_URL + "replays.json";
const SEEN_KEY = "ethcc-seen-replays";
const POLL_INTERVAL = 60 * 60 * 1000; // 1 hour

interface ReplaysData {
  lastUpdated: string;
  replays: Record<string, string>; // sessionId → YouTube URL
}

/** Get the set of replay session IDs already seen by this user */
function getSeenReplays(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/** Mark a replay as seen */
function markSeen(sessionId: string): void {
  const seen = getSeenReplays();
  seen.add(sessionId);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

/** Fetch replays.json (cache-bust to get latest) */
async function fetchReplays(): Promise<ReplaysData | null> {
  try {
    const res = await fetch(`${REPLAY_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Check if the user wants replays for specific sessions */
function getWantedReplays(): string[] {
  try {
    return JSON.parse(localStorage.getItem("ethcc-want-replay") ?? "[]");
  } catch {
    return [];
  }
}

export interface NewReplay {
  sessionId: string;
  url: string;
}

/**
 * Check for new replays once.
 * Returns array of new replays the user hasn't seen yet.
 * Optionally filters to only sessions the user requested ("Want to watch replay").
 */
export async function checkForNewReplays(onlyWanted = true): Promise<NewReplay[]> {
  const data = await fetchReplays();
  if (!data || Object.keys(data.replays).length === 0) return [];

  const seen = getSeenReplays();
  const wanted = onlyWanted ? new Set(getWantedReplays()) : null;

  const newReplays: NewReplay[] = [];
  for (const [sessionId, url] of Object.entries(data.replays)) {
    if (seen.has(sessionId)) continue;
    if (wanted && !wanted.has(sessionId)) continue;
    newReplays.push({ sessionId, url });
    markSeen(sessionId);
  }

  return newReplays;
}

/**
 * Get the replay URL for a specific session (if available).
 */
export async function getReplayUrl(sessionId: string): Promise<string | null> {
  const data = await fetchReplays();
  if (!data) return null;
  return data.replays[sessionId] ?? null;
}

/**
 * Start polling for new replays.
 * Calls onNewReplays whenever new replay links are detected.
 */
export function startReplayPolling(
  onNewReplays: (replays: NewReplay[]) => void
): () => void {
  // Check immediately
  checkForNewReplays().then((replays) => {
    if (replays.length > 0) onNewReplays(replays);
  });

  // Then poll every hour
  const interval = setInterval(async () => {
    const replays = await checkForNewReplays();
    if (replays.length > 0) onNewReplays(replays);
  }, POLL_INTERVAL);

  return () => clearInterval(interval);
}
