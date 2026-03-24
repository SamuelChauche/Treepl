import { useMemo, useState, useEffect, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { C, R, glassSurface, FONT, getTrackStyle, avatarColor } from "../config/theme";
import { GQL_URL } from "../config/constants";
import { GraphQLClient } from "@ethcc/graphql";
import { sessions } from "../data";
import { SESSION_ATOM_IDS, PREDICATES } from "../services/intuition";
import { Ic } from "../components/ui/Icons";
import { useEnsProfile } from "../hooks/useEnsProfile";
import { getSocialLinks } from "../services/ensService";
import { useVibeMatches } from "../hooks/useVibeMatches";
import { StorageService } from "../services/StorageService";
import { STORAGE_KEYS } from "../config/constants";

// ─── Styles ──────────────────────────────────────────

const page: CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column",
  background: "transparent", color: C.textPrimary, fontFamily: FONT, overflow: "hidden",
};
const header: CSSProperties = {
  flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
};
const backBtn: CSSProperties = {
  width: 42, height: 42, borderRadius: 14, background: C.surfaceGray,
  border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
const avatarStyle: CSSProperties = {
  width: 80, height: 80, borderRadius: 40,
  background: C.surfaceGray, // overridden with avatarColor()
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 28, fontWeight: 700, color: "#0a0a0a", margin: "0 auto 12px",
};
const sectionTitle: CSSProperties = {
  fontSize: 15, fontWeight: 700, color: C.textPrimary, padding: "20px 16px 10px",
};
const socialRow: CSSProperties = {
  ...glassSurface, margin: "0 16px 8px", padding: "12px 16px",
  display: "flex", alignItems: "center", gap: 12,
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

  // ENS lookup for real addresses
  const addr = match?.label && /^0x[a-fA-F0-9]{40}$/.test(match.label) ? match.label : null;
  const { profile: ensProfile } = useEnsProfile(addr);
  const socialLinks = ensProfile ? getSocialLinks(ensProfile) : [];

  if (!match) {
    return (
      <div style={page}>
        <div style={header}>
          <button style={backBtn} onClick={() => navigate(-1)}><Ic.Back c={C.textPrimary} /></button>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Profile</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>&#128566;</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>User not found</div>
          <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
            {matches.length === 0 ? "No vibe matches yet — publish your profile first." : "This profile doesn't exist."}
          </div>
        </div>
      </div>
    );
  }

  const shortAddr = match.label.startsWith("0x")
    ? `${match.label.slice(0, 6)}...${match.label.slice(-4)}`
    : match.label;
  const initials = match.label.slice(2, 4).toUpperCase();

  return (
    <div style={page}>
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}><Ic.Back c={C.textPrimary} /></button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Vibe Profile</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 24 }}>
        {/* Avatar + Name */}
        <div style={{ textAlign: "center", padding: "20px 16px" }}>
          <div style={{ ...avatarStyle, background: avatarColor(match.label) }}>{initials}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: "monospace" }}>{shortAddr}</div>
          {ensProfile?.name && (
            <div style={{ fontSize: 14, color: C.primary, marginTop: 4 }}>{ensProfile.name}</div>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.success }}>{match.matchScore}%</div>
              <div style={{ fontSize: 11, color: C.textSecondary }}>Match</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.white }}>{match.sharedTopics.length}</div>
              <div style={{ fontSize: 11, color: C.textSecondary }}>Topics</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.white }}>{match.sharedSessions.length}</div>
              <div style={{ fontSize: 11, color: C.textSecondary }}>Sessions</div>
            </div>
          </div>
        </div>

        {/* Shared Interests */}
        {match.sharedTopics.length > 0 && (
          <>
            <div style={sectionTitle}>Shared Interests</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 16px" }}>
              {match.sharedTopics.map((topic) => {
                const ts = getTrackStyle(topic);
                return (
                  <span key={topic} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: R.btn, fontSize: 12, fontWeight: 500,
                    background: `${ts.color}22`, color: ts.color,
                  }}>
                    {ts.icon} {topic}
                  </span>
                );
              })}
            </div>
          </>
        )}

        {/* Their Sessions (from on-chain attending triples) */}
        {theirSessions.length > 0 && (
          <>
            <div style={sectionTitle}>Sessions ({theirSessions.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 16px" }}>
              {theirSessions.map((sessId) => {
                const sess = sessions.find((s) => s.id === sessId);
                if (!sess) return null;
                const sts = getTrackStyle(sess.track);
                const isShared = match.sharedSessions.includes(sessId);
                return (
                  <div key={sessId} onClick={() => navigate(`/session/${sessId}`)} style={{ ...glassSurface, padding: 12, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{sts.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sess.title}</div>
                      <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>{sess.startTime} · {sess.stage}</div>
                    </div>
                    {isShared && <Ic.Check s={14} c={C.success} />}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Social Profiles (from ENS) */}
        {socialLinks.length > 0 && (
          <>
            <div style={sectionTitle}>Social Profiles</div>
            {socialLinks.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={socialRow}>
                  <span style={{ fontSize: 20 }}>{link.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{link.label}</div>
                  </div>
                  <Ic.Right s={16} c={C.textTertiary} />
                </div>
              </a>
            ))}
          </>
        )}
        {socialLinks.length === 0 && (
          <div style={{ ...glassSurface, margin: "16px 16px 0", padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: C.textSecondary }}>No ENS profile found for this address.</div>
          </div>
        )}

        {/* Send TRUST */}
        <div style={{ padding: "24px 16px" }}>
          <button
            onClick={() => navigate("/send")}
            style={{
              width: "100%", height: 48, borderRadius: R.btn,
              background: C.flat, color: "#0a0a0a", fontSize: 15, fontWeight: 600,
              border: "none", cursor: "pointer", fontFamily: FONT,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Ic.Send s={18} c="#0a0a0a" /> Send $TRUST
          </button>
        </div>
      </div>
    </div>
  );
}
