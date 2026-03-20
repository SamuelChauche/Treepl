import { useState, useMemo, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, FONT, getTrackStyle, TYPE_COLORS } from "../config/theme";
import { sessions, dates, trackNames } from "../data";
import { Ic } from "../components/ui/Icons";
import { useCart } from "../hooks/useCart";
import { StorageService } from "../services/StorageService";
import { STORAGE_KEYS } from "../config/constants";

// ─── Helpers ──────────────────────────────────────────

function fmtShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SESSION_TYPES = ["All", "Talk", "Workshop", "Panel", "Demo"] as const;

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

// header inlined - color block is now a fixed absolute div

const searchBar: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  borderRadius: R.xl,
  padding: "10px 16px",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)",
  border: `1px solid ${C.border}`,
};

const searchInput: CSSProperties = {
  flex: 1,
  background: "none",
  border: "none",
  outline: "none",
  color: "#0a0a0a",
  fontSize: 14,
  fontFamily: FONT,
  boxSizing: "border-box",
  minWidth: 0,
};

const pillRow: CSSProperties = {
  display: "flex",
  gap: 8,
  overflowX: "auto",
  paddingBottom: 4,
  scrollbarWidth: "none",
};

const pillBase: CSSProperties = {
  padding: "6px 14px",
  borderRadius: R.btn,
  fontSize: 13,
  fontWeight: 500,
  border: "1px solid rgba(255,255,255,0.1)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: FONT,
  transition: "all 0.2s",
  flexShrink: 0,
};

const cardWrap: CSSProperties = {
  ...glassSurface,
  display: "flex",
  gap: 12,
  padding: 14,
  marginBottom: 10,
  cursor: "pointer",
  transition: "transform 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
  overflow: "hidden",
  background: "rgba(22,22,24,0.29)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};

const trackIcon: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: R.md,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  flexShrink: 0,
};

const sessionListWrap: CSSProperties = {
  padding: "0 20px 24px",
};

// ─── Component ────────────────────────────────────────

export default function AgendaPage() {
  const navigate = useNavigate();
  const { cart, toggleCart } = useCart();
  const publishedSessions: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]");

  // Published interests (on-chain) vs pending interests (in cart, not yet published)
  const publishedTopics = useMemo(() => StorageService.loadTopics(), []);
  const [pendingTopics, setPendingTopics] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("ethcc-pending-topics");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });

  const allMyTopics = useMemo(() => new Set([...publishedTopics, ...pendingTopics]), [publishedTopics, pendingTopics]);
  const availableTopics = useMemo(() => trackNames.filter((t) => !allMyTopics.has(t)), [allMyTopics]);
  // All non-published tracks for the modal (includes pending so user can toggle)
  const modalTopics = useMemo(() => trackNames.filter((t) => !publishedTopics.has(t)), [publishedTopics]);

  const [showAddInterest, setShowAddInterest] = useState(false);
  const [selectedDay, setSelectedDay] = useState(dates[0] ?? "");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [search, setSearch] = useState("");

  const toggleInterest = (track: string) => {
    const next = new Set(pendingTopics);
    if (next.has(track)) {
      // Remove interest
      next.delete(track);
      setPendingTopics(next);
      localStorage.setItem("ethcc-pending-topics", JSON.stringify([...next]));
    } else {
      // Add interest only — sessions are NOT added to cart
      next.add(track);
      setPendingTopics(next);
      localStorage.setItem("ethcc-pending-topics", JSON.stringify([...next]));
    }
    // Modal stays open
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sessions.filter((s) => {
      if (s.date !== selectedDay) return false;
      if (selectedType !== "All" && s.type !== selectedType) return false;
      if (q) {
        const haystack = `${s.title} ${s.speakers.map((sp) => sp.name).join(" ")} ${s.track} ${s.stage}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [selectedDay, selectedType, search]);

  return (
    <div style={page}>
      {/* Fixed color background */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "#cea2fd", borderRadius: `0 0 ${20}px ${20}px`, zIndex: 0 }} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", position: "relative", zIndex: 1 }}>
      {/* Header content */}
      <div style={{ padding: "16px 20px 0", color: "#0a0a0a" }}>
        <div style={{ fontSize: 60, fontWeight: 900, lineHeight: 1, marginBottom: 20 }}>Agenda</div>
      </div>

      {/* Glass toolbar - search + filters */}
      <div style={{
        ...glassSurface,
        margin: "0 16px 16px",
        padding: 16,
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}>
        {/* Search */}
        <div style={{ ...searchBar, marginBottom: 12 }}>
          <Ic.Search s={18} c={C.textSecondary} />
          <input
            className="agenda-search"
            style={{ ...searchInput, color: C.textPrimary }}
            placeholder="Search sessions, speakers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Day pills */}
        <div style={{ ...pillRow, marginBottom: 10 }}>
          {dates.map((d) => {
            const active = d === selectedDay;
            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                style={{
                  ...pillBase,
                  background: active ? C.flat : C.surfaceGray,
                  color: active ? "#0a0a0a" : C.textPrimary,
                  borderColor: active ? C.flat : "transparent",
                }}
              >
                {fmtShortDate(d)}
              </button>
            );
          })}
        </div>

        {/* Type pills */}
        <div style={pillRow}>
          {SESSION_TYPES.map((t) => {
            const active = t === selectedType;
            return (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                style={{
                  ...pillBase,
                  background: active ? C.flat : C.surfaceGray,
                  color: active ? "#0a0a0a" : C.textPrimary,
                  borderColor: active ? C.flat : "transparent",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Add Interest button */}
        {availableTopics.length > 0 && (
          <button
            onClick={() => setShowAddInterest(!showAddInterest)}
            style={{
              marginTop: 10, padding: "8px 16px", borderRadius: R.btn, border: `1px solid ${C.flat}`,
              background: "transparent", color: C.flat, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Ic.Plus s={14} c={C.flat} />
            Add Interest ({availableTopics.length} available)
          </button>
        )}
      </div>

      {/* Add Interest modal */}
      {showAddInterest && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={() => setShowAddInterest(false)}
        >
          <div
            style={{
              width: "100%", maxWidth: 390,
              background: C.background, borderRadius: "20px 20px 0 0",
              border: `1px solid ${C.border}`, borderBottom: "none",
              maxHeight: "70vh", fontFamily: FONT,
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed header */}
            <div style={{ flexShrink: 0, padding: "24px 24px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, fontFamily: FONT }}>Add Interest</h3>
                <button
                  onClick={() => setShowAddInterest(false)}
                  style={{ width: 32, height: 32, borderRadius: 16, background: C.surfaceGray, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Ic.X s={16} c={C.textSecondary} />
                </button>
              </div>
              <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16, fontFamily: FONT }}>
                Select a topic to unlock its sessions. The interest will be added to your cart for on-chain validation.
              </div>
            </div>
            {/* Scrollable list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 32px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {modalTopics.map((track) => {
                const ts = getTrackStyle(track);
                const sessionCount = sessions.filter((s) => s.track === track).length;
                const isSelected = pendingTopics.has(track);
                return (
                  <div
                    key={track}
                    onClick={() => toggleInterest(track)}
                    style={{
                      ...glassSurface, padding: 14, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 12,
                      border: isSelected ? `1px solid ${C.success}44` : undefined,
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: `${ts.color}22`, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18,
                    }}>
                      {ts.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{track}</div>
                      <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>{sessionCount} sessions</div>
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: 14, flexShrink: 0,
                      background: isSelected ? C.successLight : C.surfaceGray,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isSelected ? <Ic.Check s={14} c={C.success} /> : <Ic.Plus s={14} c={C.textSecondary} />}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>{/* end scrollable list */}
          </div>
        </div>
      )}

      {/* Session list */}
      <div style={sessionListWrap}>
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: C.textTertiary, marginTop: 40 }}>
            No sessions match your filters.
          </p>
        )}

        {filtered.map((s) => {
          const ts = getTrackStyle(s.track);
          const isPublished = publishedSessions.includes(s.id);
          const isTrackPublished = publishedTopics.has(s.track);
          const isTrackPending = pendingTopics.has(s.track);
          const isLocked = isTrackPending && !isTrackPublished;
          const inCart = isPublished || cart.has(s.id);
          const speakerLine = s.speakers.map((sp) => sp.name).join(", ");

          // Locked card — session from a pending (unpublished) interest
          if (isLocked) {
            return (
              <div key={s.id} style={{ ...cardWrap, opacity: 0.5, cursor: "default" }}>
                <div style={{ ...trackIcon, background: `${ts.color}22` }}>
                  🔒
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.textTertiary, marginBottom: 4 }}>
                    Session locked
                  </div>
                  <div style={{ fontSize: 12, color: C.textTertiary }}>
                    Validate the tx to see this event
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: R.sm, background: `${ts.color}22`, color: ts.color }}>
                      {s.track}
                    </span>
                  </div>
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: 18,
                  background: C.surfaceGray, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Ic.Clock s={14} c={C.textTertiary} />
                </div>
              </div>
            );
          }

          return (
            <div
              key={s.id}
              style={cardWrap}
              onClick={() => navigate(`/session/${s.id}`)}
            >
              {/* Track icon */}
              <div style={{ ...trackIcon, background: `${ts.color}22` }}>
                {ts.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", color: C.textPrimary }}>
                  {s.title}
                </div>
                {speakerLine && (
                  <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {speakerLine}
                  </div>
                )}
                <div style={{ fontSize: 12, color: C.textTertiary, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.startTime} - {s.endTime} &middot; {s.stage}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: R.sm, background: `${ts.color}22`, color: ts.color }}>
                    {s.track}
                  </span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: R.sm, background: `${TYPE_COLORS[s.type] ?? C.primary}22`, color: TYPE_COLORS[s.type] ?? C.primary }}>
                    {s.type}
                  </span>
                </div>
              </div>

              {/* Cart toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isPublished) toggleCart(s.id);
                }}
                style={{
                  ...(isPublished ? {
                    width: 36, height: 36, minWidth: 36, minHeight: 36,
                    borderRadius: 18, padding: 0,
                  } : inCart ? {
                    padding: "6px 14px", borderRadius: R.btn,
                  } : {
                    width: 36, height: 36, minWidth: 36, minHeight: 36,
                    borderRadius: 18, padding: 0,
                  }),
                  border: "none",
                  cursor: isPublished ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, alignSelf: "center",
                  background: isPublished ? C.successLight : inCart ? C.flatLight : C.surfaceGray,
                  transition: "background 0.2s",
                  fontSize: 12, fontWeight: 600, fontFamily: FONT,
                  color: C.flat, whiteSpace: "nowrap",
                }}
              >
                {isPublished ? (
                  <Ic.Check s={16} c={C.success} />
                ) : inCart ? (
                  "In cart"
                ) : (
                  <Ic.Plus s={16} c={C.textSecondary} />
                )}
              </button>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
