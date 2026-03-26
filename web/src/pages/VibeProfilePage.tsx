import { useMemo, useState, useEffect, useCallback, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { C, R, glassSurface, FONT, getTrackStyle, avatarColor } from "../config/theme";
import { GQL_URL } from "../config/constants";
import { GraphQLClient } from "@ethcc/graphql";
import { sessions, tracks } from "../data";
import { SESSION_ATOM_IDS, PREDICATES, fetchUserNickname } from "../services/intuition";
import { Ic } from "../components/ui/Icons";
import { useEnsProfile } from "../hooks/useEnsProfile";
import { getSocialLinks } from "../services/ensService";
import { useVibeMatches } from "../hooks/useVibeMatches";
import { useCart } from "../hooks/useCart";
import { useFollow } from "../hooks/useFollow";
import { StorageService } from "../services/StorageService";
import { STORAGE_KEYS } from "../config/constants";
import {
  scrollContent, fluidContent, cardTitle, emptyStateText,
  statsRow, statCell, statValue, statLabel, listColumn, trackBadge, trackBadgeSmall,
  glassInfoCard, modalOverlay, modalSheet, modalHeader, modalTitleRow,
  modalDesc, modalScrollArea, closeBtn, iconBox, truncateLabel, getInitials,
} from "../styles/common";

// ─── Styles ──────────────────────────────────────────

const page: CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column",
  background: "transparent", color: C.textPrimary, fontFamily: FONT, overflow: "hidden",
};
const headerBar: CSSProperties = {
  flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
};
const backBtn: CSSProperties = {
  width: 42, height: 42, borderRadius: 14, background: C.surfaceGray,
  border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
const headerTitle: CSSProperties = { fontSize: 18, fontWeight: 700 };
const avatarLarge: CSSProperties = {
  width: 80, height: 80, borderRadius: 40,
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 28, fontWeight: 700, color: "#0a0a0a", margin: "0 auto 12px",
};
const profileSection: CSSProperties = { textAlign: "center", padding: "20px 16px" };
const addrText: CSSProperties = { fontSize: 18, fontWeight: 700, color: C.white, fontFamily: "monospace" };
const ensNameText: CSSProperties = { fontSize: 14, color: C.primary, marginTop: 4 };
const socialLinksWrap: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 };
const socialLinkPill: CSSProperties = {
  ...glassSurface, padding: "6px 12px", display: "inline-flex",
  alignItems: "center", gap: 6, textDecoration: "none", borderRadius: R.btn,
};
const socialLinkLabel: CSSProperties = { fontSize: 12, fontWeight: 500, color: C.textPrimary };
const noEnsCard: CSSProperties = { ...glassSurface, margin: "16px 0 0", padding: 12, textAlign: "center" };
const noEnsText: CSSProperties = { fontSize: 12, color: C.textSecondary };
const actionRow: CSSProperties = { display: "flex", gap: 10, marginTop: 16 };
const actionBtn = (bg: string, fg: string, borderColor: string, clickable = true): CSSProperties => ({
  flex: 1, height: 44, borderRadius: R.btn,
  background: bg, color: fg, fontSize: 14, fontWeight: 600,
  border: `1px solid ${borderColor}`,
  cursor: clickable ? "pointer" : "default", fontFamily: FONT,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
});
const sectionTitleStyle: CSSProperties = {
  fontSize: 15, fontWeight: 700, color: C.textPrimary, padding: "20px 16px 10px",
};
const topicsWrap: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, padding: "0 16px" };
const sessionItem = (hasTrack: boolean): CSSProperties => ({
  ...glassSurface, padding: 12, display: "flex", alignItems: "center",
  gap: 10, cursor: "pointer", opacity: hasTrack ? 1 : 0.5,
});
const lockIcon: CSSProperties = { fontSize: 16, flexShrink: 0 };
const sessionMeta: CSSProperties = { fontSize: 11, color: C.textSecondary, marginTop: 4 };
const modalTrackName: CSSProperties = { fontSize: 16, fontWeight: 700, color: C.textPrimary };
const modalTrackInfo: CSSProperties = { fontSize: 11, color: C.textSecondary };
const addBtn = (added: boolean): CSSProperties => ({
  width: "100%", height: 44, borderRadius: R.btn,
  background: added ? C.successLight : C.flat,
  color: added ? C.success : "#0a0a0a",
  fontSize: 14, fontWeight: 600, border: "none",
  cursor: added ? "default" : "pointer", fontFamily: FONT,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  marginBottom: 16,
});
const modalListHeader: CSSProperties = { fontSize: 12, fontWeight: 600, color: C.textTertiary, marginBottom: 8 };
const modalListItem: CSSProperties = { ...glassSurface, padding: 10, display: "flex", alignItems: "center", gap: 8, opacity: 0.6 };
const modalItemIcon: CSSProperties = { fontSize: 14, flexShrink: 0 };
const modalItemTitle: CSSProperties = { fontSize: 12, fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const modalItemMeta: CSSProperties = { fontSize: 10, color: C.textSecondary, marginTop: 2 };
const notFoundCenter: CSSProperties = {
  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 24,
};

// ─── Component ───────────────────────────────────────

export default function VibeProfilePage() {
  const navigate = useNavigate();
  const { index } = useParams<{ index: string }>();

  // Load real vibe matches
  const walletAddress = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS) ?? "";
  const savedTopics = useMemo(() => StorageService.loadTopics(), []);
  const publishedSessionIds = useMemo<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]"); }
    catch { return []; }
  }, []);
  const votedTopicIds = useMemo<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_VOTES) ?? "[]"); }
    catch { return []; }
  }, []);
  const { matches } = useVibeMatches(savedTopics, publishedSessionIds, walletAddress, votedTopicIds);
  const { addToCart } = useCart();
  const { follow: followUser, pendingFollows, publishedFollows } = useFollow();

  // Track interest modal
  const [lockedTrack, setLockedTrack] = useState<string | null>(null);
  const [pendingTopics, setPendingTopics] = useState<Set<string>>(() => {
    try { const raw = localStorage.getItem(STORAGE_KEYS.PENDING_TOPICS); return raw ? new Set(JSON.parse(raw)) : new Set(); }
    catch { return new Set(); }
  });

  const addInterest = useCallback((track: string) => {
    const next = new Set(pendingTopics);
    next.add(track);
    setPendingTopics(next);
    localStorage.setItem(STORAGE_KEYS.PENDING_TOPICS, JSON.stringify([...next]));
    addToCart(track);
    setLockedTrack(null);
  }, [pendingTopics, addToCart]);

  // Find the match by index
  const idx = parseInt(index ?? "", 10);
  const match = matches[idx] ?? null;

  // Fetch this user's attending sessions from chain
  const ATOM_TO_SESSION = useMemo(() => new Map(
    Object.entries(SESSION_ATOM_IDS).map(([k, v]) => [v, k])
  ), []);

  const [theirSessions, setTheirSessions] = useState<string[]>([]);
  useEffect(() => {
    if (!match) return;
    const userLabel = match.label.toLowerCase();
    const gql = new GraphQLClient({ endpoint: GQL_URL });
    gql.request<{ triples: { object: { term_id: string } }[] }>(
      `query($predId: String!, $userLabel: String!) {
        triples(where: {
          predicate: { term_id: { _eq: $predId } }
          subject: { label: { _ilike: $userLabel } }
        }, limit: 100) {
          object { term_id }
        }
      }`,
      { predId: PREDICATES["attending"], userLabel }
    ).then((data) => {
      const sessIds = data.triples
        .map((t) => ATOM_TO_SESSION.get(t.object.term_id))
        .filter((id): id is string => !!id);
      setTheirSessions(sessIds);
    }).catch(() => {});
  }, [match, ATOM_TO_SESSION]);

  // Fetch on-chain nickname
  const [theirNickname, setTheirNickname] = useState<string | null>(null);
  useEffect(() => {
    if (!match?.label) return;
    fetchUserNickname(match.label).then(setTheirNickname).catch(() => {});
  }, [match?.label]);

  // ENS lookup for real addresses
  const addr = match?.label && /^0x[a-fA-F0-9]{40}$/.test(match.label) ? match.label : null;
  const { profile: ensProfile } = useEnsProfile(addr);
  const socialLinks = ensProfile ? getSocialLinks(ensProfile) : [];

  if (!match) {
    return (
      <div style={page}>
        <div style={headerBar}>
          <button style={backBtn} onClick={() => navigate(-1)}><Ic.Back c={C.textPrimary} /></button>
          <div style={headerTitle}>Profile</div>
        </div>
        <div style={notFoundCenter}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>&#128566;</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>User not found</div>
          <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
            {matches.length === 0 ? "No vibe matches yet — publish your profile first." : "This profile doesn't exist."}
          </div>
        </div>
      </div>
    );
  }

  const shortAddr = truncateLabel(match.label);
  const initials = getInitials(match.label);

  return (
    <div style={page}>
      <div style={headerBar}>
        <button style={backBtn} onClick={() => navigate(-1)}><Ic.Back c={C.textPrimary} /></button>
        <div style={headerTitle}>Vibe Profile</div>
      </div>

      <div style={scrollContent}>
        {/* Avatar + Name */}
        <div style={profileSection}>
          <div style={{ ...avatarLarge, background: avatarColor(match.label) }}>{initials}</div>
          {theirNickname ? (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.white }}>{theirNickname}</div>
              <div style={{ fontSize: 12, color: C.textTertiary, fontFamily: "monospace", marginTop: 4 }}>{shortAddr}</div>
            </>
          ) : (
            <div style={addrText}>{shortAddr}</div>
          )}
          {ensProfile?.name && <div style={ensNameText}>{ensProfile.name}</div>}

          <div style={statsRow}>
            <div style={statCell}>
              <div style={{ ...statValue, color: C.success }}>{match.matchScore}%</div>
              <div style={statLabel}>Match</div>
            </div>
            <div style={statCell}>
              <div style={{ ...statValue, color: C.white }}>{match.sharedTopics.length}</div>
              <div style={statLabel}>Topics</div>
            </div>
            <div style={statCell}>
              <div style={{ ...statValue, color: C.white }}>{match.sharedSessions.length}</div>
              <div style={statLabel}>Sessions</div>
            </div>
          </div>

          {/* ENS / Social card */}
          {socialLinks.length > 0 ? (
            <div style={socialLinksWrap}>
              {socialLinks.map((link) => {
                const iconMap: Record<string, React.ReactNode> = {
                  github: <Ic.GitHub s={16} c={C.textPrimary} />,
                  twitter: <Ic.XTwitter s={14} c={C.textPrimary} />,
                  discord: <Ic.Discord s={16} c="#5865F2" />,
                  website: <Ic.Globe s={16} c={C.textPrimary} />,
                };
                return (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" style={socialLinkPill}>
                    {iconMap[link.icon] ?? <Ic.Globe s={16} c={C.textPrimary} />}
                    <span style={socialLinkLabel}>{link.label}</span>
                  </a>
                );
              })}
            </div>
          ) : (
            <div style={noEnsCard}>
              <div style={noEnsText}>No ENS profile found for this address.</div>
            </div>
          )}

          {/* Action buttons */}
          <div style={actionRow}>
            <button onClick={() => navigate("/send")} style={actionBtn(C.flat, "#0a0a0a", C.flat)}>
              <Ic.Send s={16} c="#0a0a0a" /> Send $TRUST
            </button>
            {(() => {
              const isPublished = publishedFollows.some((f) => f.label.toLowerCase() === match.label.toLowerCase());
              const isPending = pendingFollows.some((f) => f.label.toLowerCase() === match.label.toLowerCase());
              const bg = isPublished ? C.successLight : isPending ? `${C.flat}22` : C.surfaceGray;
              const fg = isPublished ? C.success : isPending ? C.flat : C.textPrimary;
              const border = isPublished ? C.success : isPending ? C.flat : C.border;
              return (
                <button
                  onClick={() => { if (!isPublished && !isPending) followUser(match.label); }}
                  style={actionBtn(bg, fg, border, !isPublished && !isPending)}
                >
                  {isPublished
                    ? <><Ic.Check s={16} c={C.success} /> Following</>
                    : isPending
                      ? <><Ic.Cart s={16} c={C.flat} /> In Cart</>
                      : <><Ic.People s={16} c={C.textPrimary} /> Follow</>
                  }
                </button>
              );
            })()}
          </div>
        </div>

        {/* Shared Interests */}
        {match.sharedTopics.length > 0 && (
          <>
            <div style={sectionTitleStyle}>Shared Interests</div>
            <div style={topicsWrap}>
              {match.sharedTopics.map((topic) => {
                const ts = getTrackStyle(topic);
                return <span key={topic} style={trackBadge(ts.color)}>{ts.icon} {topic}</span>;
              })}
            </div>
          </>
        )}

        {/* Their Sessions */}
        <div style={sectionTitleStyle}>Sessions ({theirSessions.length})</div>
        {theirSessions.length > 0 ? (
          <div style={listColumn}>
            {theirSessions.map((sessId) => {
              const sess = sessions.find((s) => s.id === sessId);
              if (!sess) return null;
              const sts = getTrackStyle(sess.track);
              const isShared = match.sharedSessions.includes(sessId);
              const hasTrack = savedTopics.has(sess.track);
              return (
                <div
                  key={sessId}
                  onClick={() => hasTrack ? navigate(`/session/${sessId}`) : setLockedTrack(sess.track)}
                  style={sessionItem(hasTrack)}
                >
                  {!hasTrack && <span style={lockIcon}>🔒</span>}
                  <div style={fluidContent}>
                    <div style={cardTitle}>{hasTrack ? sess.title : "Session locked"}</div>
                    <div style={sessionMeta}>{hasTrack ? `${sess.startTime} · ${sess.stage}` : "Add this interest to see details"}</div>
                    <span style={{ ...trackBadgeSmall(sts.color), marginTop: 6 }}>{sts.icon} {sess.track}</span>
                  </div>
                  {hasTrack && isShared && <Ic.Check s={14} c={C.success} />}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={glassInfoCard}>
            <div style={emptyStateText}>This user hasn't added any sessions to their profile yet.</div>
          </div>
        )}
      </div>

      {/* Add Interest Modal */}
      {lockedTrack && (() => {
        const ts = getTrackStyle(lockedTrack);
        const trackInfo = tracks.find((t) => t.name === lockedTrack);
        const trackSessions = sessions.filter((s) => s.track === lockedTrack);
        const alreadyAdded = pendingTopics.has(lockedTrack) || savedTopics.has(lockedTrack);
        return (
          <div style={modalOverlay} onClick={() => setLockedTrack(null)}>
            <div style={modalSheet} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeader}>
                <div style={modalTitleRow}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={iconBox(ts.color)}>{ts.icon}</div>
                    <div>
                      <div style={modalTrackName}>{lockedTrack}</div>
                      {trackInfo && <div style={modalTrackInfo}>{trackInfo.sector} · {trackInfo.sessionCount} sessions</div>}
                    </div>
                  </div>
                  <button onClick={() => setLockedTrack(null)} style={closeBtn}>
                    <Ic.X s={16} c={C.textSecondary} />
                  </button>
                </div>
                <div style={modalDesc}>
                  Add this interest to your profile to unlock {trackSessions.length} sessions and see their details.
                </div>
                <button onClick={() => !alreadyAdded && addInterest(lockedTrack)} style={addBtn(alreadyAdded)}>
                  {alreadyAdded
                    ? <><Ic.Check s={16} c={C.success} /> Added to cart</>
                    : <><Ic.Plus s={16} c="#0a0a0a" /> Add Interest</>
                  }
                </button>
              </div>
              <div style={modalScrollArea}>
                <div style={modalListHeader}>Sessions in this track</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {trackSessions.map((s) => (
                    <div key={s.id} style={modalListItem}>
                      <span style={modalItemIcon}>{ts.icon}</span>
                      <div style={fluidContent}>
                        <div style={modalItemTitle}>{s.title}</div>
                        <div style={modalItemMeta}>{s.startTime} · {s.stage}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
