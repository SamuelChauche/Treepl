import { useMemo, useState, useEffect, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { C, R, glassSurface, FONT, getTrackStyle, avatarColor } from "../config/theme";
import { GQL_URL } from "../config/constants";
import { GraphQLClient } from "@ethcc/graphql";
import { sessions } from "../data";
import { SESSION_ATOM_IDS, PREDICATES, fetchUserNickname } from "../services/intuition";
import { Ic } from "../components/ui/Icons";
import { useEnsProfile } from "../hooks/useEnsProfile";
import { getSocialLinks } from "../services/ensService";
import { useVibeMatches } from "../hooks/useVibeMatches";
import { useFollow } from "../hooks/useFollow";
import { STORAGE_KEYS } from "../config/constants";
import { SkeletonProfile, SkeletonSessionList } from "../components/ui/Skeleton";
import {
  scrollContent, fluidContent, cardTitle, emptyStateText,
  statsRow, statCell, statValue, statLabel, listColumn, trackBadge, trackBadgeSmall,
  glassInfoCard, truncateLabel, getInitials,
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
const sessionItem: CSSProperties = {
  ...glassSurface, padding: 12, display: "flex", alignItems: "center",
  gap: 10, cursor: "pointer",
};
const sessionMeta: CSSProperties = { fontSize: 11, color: C.textSecondary, marginTop: 4 };
const notFoundCenter: CSSProperties = {
  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 24,
};

// ─── Component ───────────────────────────────────────

export default function VibeProfilePage() {
  const navigate = useNavigate();
  const { index, address } = useParams<{ index?: string; address?: string }>();

  // Load real vibe matches
  const walletAddress = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS) ?? "";
  const [savedTopics, setSavedTopics] = useState<Set<string>>(new Set());
  const publishedSessionIds = useMemo<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]"); }
    catch { return []; }
  }, []);
  const votedTopicIds = useMemo<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_VOTES) ?? "[]"); }
    catch { return []; }
  }, []);

  // Sync on-chain interests when wallet connects
  useEffect(() => {
    if (walletAddress) {
      import("../services/profileSync").then(({ syncProfileFromChain }) => {
        syncProfileFromChain(walletAddress).then(result => {
          setSavedTopics(new Set(result.interests));
        }).catch(err => {
          console.error("Failed to sync:", err);
        });
      });
    }
  }, [walletAddress]);

  const { matches, loading: vibeLoading } = useVibeMatches(savedTopics, publishedSessionIds, walletAddress, votedTopicIds);
  const { follow: followUser, pendingFollows, publishedFollows } = useFollow();

  // Find the match by index OR by address
  let match = null;
  if (index !== undefined) {
    const idx = parseInt(index, 10);
    match = matches[idx] ?? null;
  } else if (address) {
    // Find match by address (label)
    const foundMatch = matches.find(m => m.label.toLowerCase() === address.toLowerCase());
    if (foundMatch) {
      match = foundMatch;
    } else {
      // Create a minimal match object for unknown users
      match = {
        subjectTermId: address,
        label: address,
        sharedTopics: [],
        sharedSessions: [],
        matchScore: 0,
        trackScore: 0,
        voteScore: 0,
        sessionScore: 0,
      };
    }
  }

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

  // Show loading state while vibe matches are loading
  if (vibeLoading) {
    return (
      <div style={page}>
        <div style={headerBar}>
          <button style={backBtn} onClick={() => navigate(-1)}><Ic.Back c={C.textPrimary} /></button>
          <div style={headerTitle}>Profile</div>
        </div>
        <div style={scrollContent}>
          <SkeletonProfile />
          <div style={sectionTitleStyle}>Sessions</div>
          <SkeletonSessionList count={5} />
        </div>
      </div>
    );
  }

  // If not loading and still no match, show "not found"
  if (!vibeLoading && !match) {
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
              return (
                <div
                  key={sessId}
                  onClick={() => navigate(`/session/${sessId}`)}
                  style={sessionItem}
                >
                  <div style={fluidContent}>
                    <div style={cardTitle}>{sess.title}</div>
                    <div style={sessionMeta}>{sess.startTime} · {sess.stage}</div>
                    <span style={{ ...trackBadgeSmall(sts.color), marginTop: 6 }}>{sts.icon} {sess.track}</span>
                  </div>
                  {isShared && <Ic.Check s={14} c={C.success} />}
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

    </div>
  );
}
