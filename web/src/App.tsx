import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { PhoneFrame } from "./components/ui/PhoneFrame";
import { Nav5 } from "./components/ui/Nav5";
import { SplashBg } from "./components/ui/SplashBg";
import { useCart } from "./hooks/useCart";
import { StorageService } from "./services/StorageService";
import { sessions } from "./data";
import { startSessionNotifScheduler, createTestSession, type SessionNotifEvent } from "./services/sessionNotifService";
import { STORAGE_KEYS } from "./config/constants";
import { requestNotificationPermission, showNativeNotification, notifyReplayAvailable } from "./services/notificationService";
import { startReplayPolling } from "./services/replayService";
import { subscribeToPush } from "./services/pushService";
import { C, FONT, glassSurface } from "./config/theme";
import "./styles/globals.css";

const isPWA =
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
  window.matchMedia("(display-mode: standalone)").matches;

const IMG = import.meta.env.BASE_URL + "images/";

function InstallScreen() {
  return (
    <PhoneFrame>
      <SplashBg>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
          <img src={`${IMG}sofia-splash.png`} alt="Sofia" style={{ width: 160, height: 160, objectFit: "contain", marginBottom: 24 }} />
          <h1 style={{ fontSize: 32, fontWeight: 900, color: C.white, letterSpacing: -1, margin: 0 }}>EthCC[9]</h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", margin: "8px 0 40px", fontFamily: FONT }}>Sofia Manager</p>
          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "24px 20px", width: "100%", boxSizing: "border-box" }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, fontFamily: FONT, margin: "0 0 16px" }}>
              Install the app to continue
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>1.</span>
                <p style={{ fontSize: 14, color: C.textSecondary, fontFamily: FONT, margin: 0 }}>
                  Tap the <strong style={{ color: C.textPrimary }}>Share</strong> button <span style={{ fontSize: 16 }}>⎋</span> at the bottom of Safari
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>2.</span>
                <p style={{ fontSize: 14, color: C.textSecondary, fontFamily: FONT, margin: 0 }}>
                  Select <strong style={{ color: C.textPrimary }}>Add to Home Screen</strong>
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>3.</span>
                <p style={{ fontSize: 14, color: C.textSecondary, fontFamily: FONT, margin: 0 }}>
                  Open the app from your home screen
                </p>
              </div>
            </div>
          </div>
        </div>
      </SplashBg>
    </PhoneFrame>
  );
}

const TAB_PATHS = ["/home", "/agenda", "/cart", "/vote", "/profile"];

// ─── Toast style ─────────────────────────────────────────────
const toastStyle: CSSProperties = {
  position: "absolute",
  top: 56,
  left: 16,
  right: 16,
  ...glassSurface,
  background: "rgba(22,22,24,0.95)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  padding: 14,
  zIndex: 9999,
  animation: "slideDown 0.3s ease",
  cursor: "pointer",
};

function AppContent() {
  const location = useLocation();
  const { cart } = useCart();
  const showNav = TAB_PATHS.includes(location.pathname);

  // Check if onboarding is completed
  const topics = StorageService.loadTopics();
  const hasOnboarded = topics.size > 0 || localStorage.getItem("ethcc-onboarded") === "1";

  if (!hasOnboarded && location.pathname !== "/") {
    // We let the router handle this via the index route
  }

  const navigate = useNavigate();

  // ── Notification toast ──────────────────────────────────
  const [toast, setToast] = useState<{ title: string; body: string; sessionId?: string } | null>(null);

  const dismissToast = useCallback(() => {
    if (toast?.sessionId) {
      navigate(`/rate/${toast.sessionId}`);
    }
    setToast(null);
  }, [toast, navigate]);

  // Auto-dismiss toast after 15s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 15000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Request notification permission + push subscription ──
  useEffect(() => {
    requestNotificationPermission().then(() => {
      subscribeToPush().catch(() => {});
    });
  }, []);

  // ── Session notification scheduler ────────────────────
  useEffect(() => {
    // Only notify for sessions the user cares about (cart + published)
    const cartIds = [...cart];
    const publishedIds: string[] = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]"); } catch { return []; } })();
    const userSessionIds = new Set([...cartIds, ...publishedIds]);

    const testSession = createTestSession();
    const userSessions = [
      testSession,
      ...sessions.filter((s) => userSessionIds.has(s.id)),
    ];

    const cleanup = startSessionNotifScheduler(userSessions, (event: SessionNotifEvent) => {
      // In-app toast
      const isRatable = event.type === "end" || event.type === "eod";
      setToast({
        title: event.message,
        body: event.type === "h1" ? "Don't miss it!" : "Tap to rate this session",
        sessionId: isRatable ? event.session.id : undefined,
      });

      // Native notification (works when tab is not focused)
      showNativeNotification(event.message, {
        body: event.type === "h1" ? "Don't miss it!" : "Tap to rate",
        tag: `${event.type}-${event.session.id}`,
        url: isRatable ? `/rate/${event.session.id}` : `/session/${event.session.id}`,
      });
    });

    return cleanup;
  }, [cart]);

  // ── Replay polling ─────────────────────────────────────
  useEffect(() => {
    // Session title lookup for notifications
    const sessionMap = new Map(sessions.map((s) => [s.id, s.title]));

    const cleanup = startReplayPolling((newReplays) => {
      for (const replay of newReplays) {
        const title = sessionMap.get(replay.sessionId) ?? "Session";

        // In-app toast (shows the last one)
        setToast({
          title: `Replay available: ${title}`,
          body: "The recording is now on YouTube",
        });

        // Native notification
        notifyReplayAvailable(title, replay.url);
      }
    });

    return cleanup;
  }, []);

  return (
    <PhoneFrame>
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0,
        paddingBottom: showNav ? "calc(88px + env(safe-area-inset-bottom, 0px))" : 0,
      }}>
        <Outlet />
      </div>
      {showNav && <Nav5 cartCount={cart.size} />}

      {/* Notification toast */}
      {toast && (
        <div style={toastStyle} onClick={dismissToast}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, fontFamily: FONT }}>
            {toast.title}
          </div>
          {toast.body && (
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4, fontFamily: FONT }}>
              {toast.body}
            </div>
          )}
        </div>
      )}

      {/* Toast animation */}
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </PhoneFrame>
  );
}

export default function App() {
  if (!isPWA) return <InstallScreen />;
  return <AppContent />;
}
