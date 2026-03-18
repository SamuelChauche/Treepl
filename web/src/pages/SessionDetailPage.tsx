import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { C, R, glassSurface, btnPill, FONT, getTrackStyle, TYPE_COLORS } from "../config/theme";
import { sessions } from "../data";
import { Ic } from "../components/ui/Icons";
import { getReplayUrl } from "../services/replayService";

import { useCart } from "../hooks/useCart";
import { Spark } from "../components/ui/Spark";
import type { CSSProperties } from "react";

// ─── Helpers ──────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

/** Deterministic pseudo-random from session id */
function hashNum(id: string, max: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h) % max;
}

function generateSparkData(id: string): number[] {
  const seed = hashNum(id, 10000);
  const data: number[] = [];
  let val = 40 + (seed % 30);
  for (let i = 0; i < 20; i++) {
    val += (Math.sin(seed + i * 0.7) * 8) + (Math.cos(seed * 0.3 + i) * 4);
    data.push(Math.max(5, val));
  }
  return data;
}

// ─── Styles ───────────────────────────────────────────

const page: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  background: "transparent",
  fontFamily: FONT,
  color: C.textPrimary,
  overflow: "hidden",
};

const topNav: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 16px",
  flexShrink: 0,
};

const navBtn: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: C.surfaceGray,
};

const heroSection: CSSProperties = {
  borderRadius: R.lg,
  margin: "0 20px 20px",
  padding: 20,
  position: "relative",
  overflow: "hidden",
  boxSizing: "border-box",
};

const tagPill: CSSProperties = {
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: R.btn,
  fontSize: 11,
  fontWeight: 500,
  marginRight: 6,
  marginBottom: 4,
};

const statsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  padding: "0 20px",
  marginBottom: 16,
};

const statCard: CSSProperties = {
  ...glassSurface,
  padding: 14,
  textAlign: "center",
};

const infoCard: CSSProperties = {
  ...glassSurface,
  padding: 14,
  display: "flex",
  alignItems: "center",
  gap: 12,
  overflow: "hidden",
  minWidth: 0,
};

const descSection: CSSProperties = {
  padding: "0 20px",
  marginBottom: 24,
};

const bottomBar: CSSProperties = {
  flexShrink: 0,
  padding: "12px 20px 24px",
  background: "rgba(10,10,10,0.95)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderTop: `1px solid ${C.border}`,
  display: "flex",
  gap: 12,
  boxSizing: "border-box",
};

// ─── Component ────────────────────────────────────────

export default function SessionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { cart, toggleCart } = useCart();

  const session = useMemo(() => sessions.find((s) => s.id === id), [id]);

  if (!session) {
    return (
      <div style={page}>
        <div style={topNav}>
          <button style={navBtn} onClick={() => navigate(-1)}>
            <Ic.Back s={22} c={C.textPrimary} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Details</span>
          <div style={{ width: 42 }} />
        </div>
        <p style={{ textAlign: "center", color: C.textTertiary, marginTop: 60, fontSize: 14 }}>
          Session not found.
        </p>
      </div>
    );
  }

  const ts = getTrackStyle(session.track);
  const publishedSessions: string[] = JSON.parse(localStorage.getItem("ethcc-published-sessions") ?? "[]");
  const isPublished = publishedSessions.includes(session.id);
  const inCart = isPublished || cart.has(session.id);

  // ── Ratings from localStorage ──────────────────────
  const allRatings: Record<string, { rating: number; timestamp: number }> = JSON.parse(
    localStorage.getItem("ethcc-ratings") ?? "{}"
  );
  const myRating = allRatings[session.id];

  // ── Replay URL (fetched from replays.json) ─────────
  const [replayUrl, setReplayUrl] = useState<string | null>(null);
  useEffect(() => {
    getReplayUrl(session.id).then((url) => setReplayUrl(url));
  }, [session.id]);

  // ── Want replay ────────────────────────────────────
  const [wantReplay, setWantReplay] = useState(() => {
    const replays = JSON.parse(localStorage.getItem("ethcc-want-replay") ?? "[]") as string[];
    return replays.includes(session.id);
  });

  const toggleWantReplay = () => {
    const replays = JSON.parse(localStorage.getItem("ethcc-want-replay") ?? "[]") as string[];
    if (wantReplay) {
      localStorage.setItem("ethcc-want-replay", JSON.stringify(replays.filter((id: string) => id !== session.id)));
    } else {
      localStorage.setItem("ethcc-want-replay", JSON.stringify([...replays, session.id]));
    }
    setWantReplay(!wantReplay);
  };
  const interestedCount = 12 + hashNum(session.id, 80);
  const trendPct = 3 + hashNum(session.id + "t", 25);
  const trendUp = hashNum(session.id + "dir", 2) === 1;
  const sparkData = generateSparkData(session.id);
  const speakerLine = session.speakers.map((sp) => sp.name).join(", ");

  return (
    <div style={page}>
      {/* Top nav */}
      <div style={topNav}>
        <button style={navBtn} onClick={() => navigate(-1)}>
          <Ic.Back s={22} c={C.textPrimary} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Details</span>
        <button
          style={{
            ...navBtn,
            background: inCart ? C.errorLight : "rgba(255,255,255,0.06)",
          }}
          onClick={() => toggleCart(session.id)}
        >
          <Ic.Heart s={20} c={inCart ? C.error : C.textSecondary} f={inCart} />
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

      {/* Hero */}
      <div
        style={{
          ...heroSection,
          background: `linear-gradient(135deg, ${ts.color}33 0%, ${ts.color}11 100%)`,
          border: `1px solid ${ts.color}33`,
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>{ts.icon}</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>
          {session.title}
        </h1>
        {speakerLine && (
          <div style={{ fontSize: 14, color: C.textSecondary, marginBottom: 12 }}>
            {speakerLine}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          <span
            style={{
              ...tagPill,
              background: `${ts.color}22`,
              color: ts.color,
            }}
          >
            {session.track}
          </span>
          <span
            style={{
              ...tagPill,
              background: `${TYPE_COLORS[session.type] ?? C.primary}22`,
              color: TYPE_COLORS[session.type] ?? C.primary,
            }}
          >
            {session.type}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={statsGrid}>
        <div style={statCard}>
          <div style={{ fontSize: 11, color: C.textTertiary, marginBottom: 6 }}>Interested</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Ic.People s={16} c={C.primary} />
            <span style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>{interestedCount}</span>
          </div>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: 11, color: C.textTertiary, marginBottom: 6 }}>Trend</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            {trendUp ? (
              <Ic.ArrowUp s={14} c={C.success} />
            ) : (
              <Ic.ArrowDown s={14} c={C.error} />
            )}
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: trendUp ? C.success : C.error,
              }}
            >
              {trendPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Sparkline chart */}
      <div style={{ padding: "0 20px", marginBottom: 20 }}>
        <div style={{ ...glassSurface, padding: 16 }}>
          <div style={{ fontSize: 12, color: C.textTertiary, marginBottom: 8 }}>Interest over time</div>
          <Spark data={sparkData} color={ts.color} h={48} />
        </div>
      </div>

      {/* Time & Stage info cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px", marginBottom: 20 }}>
        <div style={infoCard}>
          <Ic.Clock s={18} c={C.primary} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.textTertiary }}>Time</div>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session.startTime} - {session.endTime}
            </div>
            <div style={{ fontSize: 11, color: C.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmtDate(session.date)}</div>
          </div>
        </div>
        <div style={infoCard}>
          <Ic.Pin s={18} c={C.primary} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.textTertiary }}>Stage</div>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.stage}</div>
          </div>
        </div>
      </div>

      {/* Description */}
      {session.description && (
        <div style={descSection}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Description</div>
          <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.65, margin: 0 }}>
            {session.description}
          </p>
        </div>
      )}

      {/* Speakers detail */}
      {session.speakers.length > 0 && (
        <div style={{ padding: "0 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
            Speaker{session.speakers.length > 1 ? "s" : ""}
          </div>
          {session.speakers.map((sp) => (
            <div
              key={sp.slug}
              style={{
                ...glassSurface,
                padding: 12,
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
              }}
              onClick={() => navigate(`/speaker/${sp.slug}`)}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  background: `${ts.color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  color: ts.color,
                  flexShrink: 0,
                }}
              >
                {sp.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sp.name}</div>
                {sp.organization && (
                  <div style={{ fontSize: 12, color: C.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sp.organization}</div>
                )}
              </div>
              <Ic.Right s={16} c={C.textTertiary} />
            </div>
          ))}
        </div>
      )}

      {/* Ratings section */}
      <div style={{ padding: "0 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Ratings</div>

        {myRating ? (
          <div style={{ ...glassSurface, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={{ fontSize: 18, color: s <= myRating.rating ? C.flat : C.textTertiary }}>★</span>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.flat }}>You rated {myRating.rating}/5</div>
            </div>
            <button
              style={{
                padding: "6px 14px", borderRadius: R.btn, border: "none",
                background: C.surfaceGray, color: C.textSecondary,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
              }}
              onClick={() => navigate(`/rate/${session.id}`)}
            >
              Edit
            </button>
          </div>
        ) : (
          <div
            style={{ ...glassSurface, padding: 16, textAlign: "center", cursor: "pointer" }}
            onClick={() => navigate(`/rate/${session.id}`)}
          >
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={{ fontSize: 22, color: C.textTertiary }}>★</span>
              ))}
            </div>
            <div style={{ fontSize: 13, color: C.textSecondary }}>
              Attended this session? Tap to rate it
            </div>
          </div>
        )}

        {/* TODO: Show other people's ratings from on-chain data */}
        {/* When on-chain ratings are available, display rating distribution here */}
      </div>

      {/* Replay / Want to watch */}
      <div style={{ padding: "0 20px", marginBottom: 24 }}>
        {replayUrl ? (
          <a
            href={replayUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: "100%", padding: 14, borderRadius: R.lg,
              border: `1px solid ${C.success}44`, background: C.successLight,
              display: "flex", alignItems: "center", gap: 12,
              textDecoration: "none", fontFamily: FONT, boxSizing: "border-box",
            }}
          >
            <span style={{ fontSize: 20 }}>▶️</span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.success }}>
                Watch Replay
              </div>
              <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
                Available on YouTube
              </div>
            </div>
            <Ic.Right s={16} c={C.success} />
          </a>
        ) : (
          <button
            onClick={toggleWantReplay}
            style={{
              width: "100%", padding: 14, borderRadius: R.lg,
              border: wantReplay ? `1px solid ${C.flat}` : `1px solid ${C.border}`,
              background: wantReplay ? C.flatLight : C.surfaceGray,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
              fontFamily: FONT,
            }}
          >
            <span style={{ fontSize: 20 }}>{wantReplay ? "📺" : "👀"}</span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: wantReplay ? C.flat : C.textPrimary }}>
                {wantReplay ? "Replay requested!" : "Want to watch the replay?"}
              </div>
              <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
                {wantReplay
                  ? "We'll notify you when it's available"
                  : "Get notified when the replay is published"}
              </div>
            </div>
            {wantReplay && <Ic.Check s={18} c={C.flat} />}
          </button>
        )}
      </div>

      </div>{/* end scrollable content */}

      {/* Bottom action bar */}
      <div style={bottomBar}>
        <button
          onClick={() => { if (!isPublished) toggleCart(session.id); }}
          style={{
            ...btnPill,
            flex: 1,
            background: isPublished ? C.successLight : inCart ? C.successLight : C.iridescence,
            color: isPublished ? C.success : inCart ? C.success : C.dark,
            cursor: isPublished ? "default" : "pointer",
          }}
        >
          {isPublished ? (
            <>
              <Ic.Check s={18} c={C.success} />
              Attending (on-chain)
            </>
          ) : inCart ? (
            <>
              <Ic.Check s={18} c={C.success} />
              In Cart
            </>
          ) : (
            <>
              <Ic.Plus s={18} c={C.dark} />
              Add to Cart
            </>
          )}
        </button>
        <button
          style={{
            width: 56,
            height: 56,
            borderRadius: R.btn,
            background: C.surfaceGray,
            border: `1px solid ${C.border}`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: session.title,
                text: `${session.title} - ${session.track} at EthCC`,
                url: window.location.href,
              }).catch(() => {});
            }
          }}
        >
          <Ic.Share s={20} c={C.textPrimary} />
        </button>
      </div>
    </div>
  );
}
