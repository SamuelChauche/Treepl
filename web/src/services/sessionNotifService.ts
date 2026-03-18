/**
 * Session notification scheduler.
 * Shows toast notifications when sessions end.
 * - "Rate this session" → toast at session endTime
 * - Replays: handled separately via polling replays.json
 */

import type { Session } from "../types";

// ─── Test session (changes daily for testing) ────────────────
// This creates a test session ending a few minutes from now.
// In production, remove this and use the real event dates.

export function createTestSession(): Session {
  const now = new Date();
  const endMinutes = now.getMinutes() + 3; // ends 3 minutes from now
  const startMinutes = endMinutes - 20;

  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  return {
    id: "__test_session__",
    title: "[TEST] Notification Test Session",
    date: today,
    startTime: `${pad(now.getHours())}:${pad(Math.max(0, startMinutes))}`,
    endTime: `${pad(now.getHours())}:${pad(Math.min(59, endMinutes))}`,
    stage: "Test Stage",
    stageId: "test-stage",
    track: "Core Protocol",
    type: "Talk" as const,
    description: "This is a test session for notification scheduling. It ends 3 minutes from now.",
    speakers: [{ name: "Test Speaker", organization: "Sofia", slug: "test-speaker" }],
  };
}

// ─── Scheduling ──────────────────────────────────────────────

interface ScheduledNotif {
  sessionId: string;
  sessionTitle: string;
  endTime: Date;
  sent: boolean;
  timerId?: ReturnType<typeof setTimeout>;
}

const scheduled = new Map<string, ScheduledNotif>();
let checkInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Parse a session date + endTime into a Date object.
 */
function getEndDate(session: Session): Date | null {
  if (!session.date || !session.endTime) return null;
  const [hours, minutes] = session.endTime.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const d = new Date(session.date + "T00:00:00");
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Schedule end-of-session notifications for a list of sessions.
 * Only schedules sessions that end in the future.
 */
export function scheduleSessionNotifications(
  sessions: Session[],
  onNotify: (session: Session) => void
): void {
  const now = Date.now();

  for (const session of sessions) {
    // Skip already scheduled
    if (scheduled.has(session.id)) continue;

    const endDate = getEndDate(session);
    if (!endDate) continue;

    const delay = endDate.getTime() - now;

    // Skip sessions that already ended (more than 2 min ago)
    if (delay < -2 * 60 * 1000) continue;

    // If session ends within the next 24 hours, schedule it
    if (delay < 24 * 60 * 60 * 1000) {
      const effectiveDelay = Math.max(0, delay);

      const entry: ScheduledNotif = {
        sessionId: session.id,
        sessionTitle: session.title,
        endTime: endDate,
        sent: false,
      };

      entry.timerId = setTimeout(() => {
        entry.sent = true;
        onNotify(session);
      }, effectiveDelay);

      scheduled.set(session.id, entry);
    }
  }
}

/**
 * Start a periodic check that schedules notifications for today's sessions.
 * Call once at app startup.
 */
export function startSessionNotifScheduler(
  sessions: Session[],
  onNotify: (session: Session) => void
): () => void {
  // Schedule immediately
  scheduleSessionNotifications(sessions, onNotify);

  // Re-check every 5 minutes (for sessions that start later in the day)
  checkInterval = setInterval(() => {
    scheduleSessionNotifications(sessions, onNotify);
  }, 5 * 60 * 1000);

  return () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    for (const entry of scheduled.values()) {
      if (entry.timerId) clearTimeout(entry.timerId);
    }
    scheduled.clear();
  };
}

/**
 * Get the status of scheduled notifications (for debugging).
 */
export function getScheduledStatus(): { id: string; title: string; endTime: string; sent: boolean }[] {
  return [...scheduled.values()].map((e) => ({
    id: e.sessionId,
    title: e.sessionTitle,
    endTime: e.endTime.toLocaleTimeString(),
    sent: e.sent,
  }));
}
