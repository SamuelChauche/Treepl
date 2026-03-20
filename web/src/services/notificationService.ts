/**
 * Native notification service.
 * Uses the browser Notification API for notifications that work even when
 * the app tab is not focused (but the browser must be open).
 */

/** Request notification permission. Call once (e.g., during onboarding). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Check if notifications are allowed */
export function canNotify(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

/** Show a native notification */
export function showNativeNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;       // prevents duplicates with same tag
    url?: string;       // URL to open on click
  }
): void {
  if (!canNotify()) return;

  const notif = new Notification(title, {
    body: options?.body,
    icon: options?.icon ?? "/images/icon-192.png",
    tag: options?.tag,
    silent: false,
  });

  if (options?.url) {
    notif.onclick = () => {
      window.focus();
      window.location.href = options.url!;
      notif.close();
    };
  }
}

/**
 * Show a notification for a session that just ended.
 * Falls back to nothing if notifications are not permitted.
 */
export function notifySessionEnd(sessionTitle: string, sessionId: string): void {
  showNativeNotification(`How was "${sessionTitle}"?`, {
    body: "Tap to rate this session",
    tag: `session-end-${sessionId}`,
    url: `/rate/${sessionId}`,
  });
}

/**
 * Show a notification for a new replay.
 */
export function notifyReplayAvailable(sessionTitle: string, youtubeUrl: string): void {
  showNativeNotification(`Replay available: ${sessionTitle}`, {
    body: "The recording is now on YouTube",
    tag: `replay-${sessionTitle}`,
    url: youtubeUrl,
  });
}
