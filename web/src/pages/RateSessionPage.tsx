import { useState, useMemo, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { C, R, glassSurface, btnPill, FONT, getTrackStyle } from "../config/theme";
import { sessions, ratingsGraph } from "../data";
import { Ic } from "../components/ui/Icons";
import { STORAGE_KEYS } from "../config/constants";
import { useCart } from "../hooks/useCart";

// ─── Styles ──────────────────────────────────────────

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

const starBtn = (active: boolean): CSSProperties => ({
  width: 56,
  height: 56,
  borderRadius: R.lg,
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: active ? C.flatLight : C.surfaceGray,
  transition: "all 0.2s ease",
  transform: active ? "scale(1.15)" : "scale(1)",
});

const ratingLabel: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  textAlign: "center",
  minHeight: 24,
  marginTop: 12,
};

const bottomBar: CSSProperties = {
  flexShrink: 0,
  padding: "12px 20px 24px",
  background: "rgba(10,10,10,0.95)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderTop: `1px solid ${C.border}`,
  boxSizing: "border-box",
};

// ─── Rating labels ───────────────────────────────────

const RATING_LABELS: Record<number, string> = {
  1: "Not great",
  2: "Could be better",
  3: "Decent",
  4: "Really good",
  5: "Outstanding!",
};

// ─── Component ───────────────────────────────────────

export default function RateSessionPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const session = useMemo(() => sessions.find((s) => s.id === id), [id]);

  const { addToCart } = useCart();

  const [rating, setRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!session) {
    return (
      <div style={page}>
        <div style={topNav}>
          <button style={navBtn} onClick={() => navigate(-1)}>
            <Ic.Back s={22} c={C.textPrimary} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Rate Session</span>
          <div style={{ width: 42 }} />
        </div>
        <p style={{ textAlign: "center", color: C.textTertiary, marginTop: 60, fontSize: 14 }}>
          Session not found.
        </p>
      </div>
    );
  }

  const ts = getTrackStyle(session.track);

  const handleSubmit = () => {
    if (rating === 0) return;
    setSubmitting(true);
    setError("");

    try {
      // Check the triple exists for this session + rating
      const sessionTriples = ratingsGraph.sessionRatingTriples[session.id];
      if (!sessionTriples || !sessionTriples[String(rating)]) {
        throw new Error("Rating triple not found on-chain for this session");
      }

      // Save rating to pending ratings (will be deposited at checkout)
      const pending: Record<string, number> = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.RATINGS) ?? "{}"
      );
      pending[session.id] = rating;
      localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(pending));

      // Also save to display ratings
      const ratings = JSON.parse(localStorage.getItem("ethcc-ratings") ?? "{}");
      ratings[session.id] = { rating, timestamp: Date.now() };
      localStorage.setItem("ethcc-ratings", JSON.stringify(ratings));

      // Add session to cart so user goes through checkout
      addToCart(session.id);

      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={page}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: "pop-in 0.5s ease" }}>
            {rating >= 4 ? "🎉" : rating >= 3 ? "👍" : "🤔"}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>
            Thanks for your feedback!
          </h2>
          <p style={{ fontSize: 14, color: C.textSecondary, textAlign: "center", marginBottom: 4 }}>
            You rated <strong style={{ color: C.textPrimary }}>{session.title}</strong>
          </p>
          <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} style={{ fontSize: 24, opacity: s <= rating ? 1 : 0.2 }}>★</span>
            ))}
          </div>
          <p style={{ fontSize: 13, color: C.flat, marginTop: 8 }}>{RATING_LABELS[rating]}</p>

          <button
            style={{ ...btnPill, marginTop: 32, background: C.flat, maxWidth: 280 }}
            onClick={() => navigate("/cart")}
          >
            Go to Cart
          </button>
          <button
            style={{ ...btnPill, marginTop: 8, background: C.surfaceGray, color: C.textPrimary, maxWidth: 280 }}
            onClick={() => navigate(`/session/${session.id}`)}
          >
            Back to Session
          </button>
        </div>
        <style>{`
          @keyframes pop-in {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={page}>
      {/* Top nav */}
      <div style={topNav}>
        <button style={navBtn} onClick={() => navigate(-1)}>
          <Ic.Back s={22} c={C.textPrimary} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Rate Session</span>
        <div style={{ width: 42 }} />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "0 20px 80px" }}>

        {/* Session info */}
        <div
          style={{
            ...glassSurface,
            padding: 20,
            marginTop: 8,
            background: `linear-gradient(135deg, ${ts.color}22 0%, ${ts.color}08 100%)`,
            border: `1px solid ${ts.color}33`,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10 }}>{ts.icon}</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>
            {session.title}
          </h2>
          <div style={{ fontSize: 13, color: C.textSecondary }}>
            {session.speakers.map((sp) => sp.name).join(", ")}
          </div>
          <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 4 }}>
            {session.startTime} - {session.endTime} · {session.stage}
          </div>
        </div>

        {/* Rating prompt */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            How was this session?
          </h3>
          <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 24 }}>
            Your rating helps other attendees
          </p>
        </div>

        {/* Star rating */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              style={starBtn(s <= rating)}
              onClick={() => setRating(s === rating ? 0 : s)}
            >
              <span style={{ fontSize: 28, color: s <= rating ? C.flat : C.textTertiary }}>
                ★
              </span>
            </button>
          ))}
        </div>

        {/* Rating label */}
        <div style={ratingLabel}>
          <span style={{ color: rating > 0 ? C.flat : "transparent" }}>
            {RATING_LABELS[rating] ?? ""}
          </span>
        </div>

        {/* Rating summary card */}
        {rating > 0 && (
          <div style={{ ...glassSurface, marginTop: 24, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textSecondary, marginBottom: 6 }}>
              <span>Session</span>
              <span style={{ color: C.textPrimary, fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.title}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textSecondary, marginBottom: 6 }}>
              <span>Your rating</span>
              <span style={{ color: C.flat, fontWeight: 700 }}>{rating}/5</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textSecondary }}>
              <span>On-chain</span>
              <span style={{ color: C.trust, fontWeight: 600 }}>
                Deposit into {rating}/5 vault (at checkout)
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ ...glassSurface, marginTop: 16, padding: 12, border: `1px solid rgba(239,68,68,0.3)`, fontSize: 13, color: C.error, textAlign: "center" }}>
            {error}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div style={bottomBar}>
        <button
          style={{
            ...btnPill,
            background: rating > 0 ? C.iridescence : C.surfaceGray,
            color: rating > 0 ? C.dark : C.textTertiary,
            opacity: submitting ? 0.5 : 1,
            cursor: rating > 0 && !submitting ? "pointer" : "not-allowed",
          }}
          disabled={rating === 0 || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Adding..." : rating > 0 ? `Add ${rating}/5 Rating to Cart` : "Select a rating"}
        </button>
      </div>
    </div>
  );
}
