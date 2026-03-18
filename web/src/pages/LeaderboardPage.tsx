import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, glassSurface, FONT } from "../config/theme";
import { LEADERBOARD } from "../data/social";
import { fetchLeaderboard, type LeaderboardEntry } from "../services/leaderboardService";


// ─── Styles ──────────────────────────────────────────

const page: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  background: "transparent",
  color: C.textPrimary,
  fontFamily: FONT,
  overflow: "hidden",
};

const header: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 16px 0",
  flexShrink: 0,
};

const backBtn: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: C.surfaceGray,
  border: "none",
  color: C.textPrimary,
  fontSize: 18,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const title: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  flex: 1,
};

// Podium
const podiumSection: CSSProperties = {
  padding: "24px 16px 32px",
  background: "linear-gradient(180deg, rgba(206,162,253,0.12) 0%, transparent 100%)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  gap: 8,
};

const MEDAL_COLORS: Record<number, { bg: string; border: string; shadow: string }> = {
  1: { bg: "#FCD34D", border: "#F59E0B", shadow: "rgba(252,211,77,0.3)" },
  2: { bg: "#CBD5E1", border: "#94A3B8", shadow: "rgba(203,213,225,0.3)" },
  3: { bg: "#D97706", border: "#B45309", shadow: "rgba(217,119,6,0.3)" },
};

const podiumCard = (rank: number): CSSProperties => {
  const medal = MEDAL_COLORS[rank] ?? MEDAL_COLORS[3];
  const isFirst = rank === 1;
  return {
    ...glassSurface,
    padding: "16px 8px",
    textAlign: "center" as const,
    flex: 1,
    maxWidth: isFirst ? 120 : 100,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    order: rank === 1 ? 1 : rank === 2 ? 0 : 2,
    transform: isFirst ? "translateY(-16px)" : "none",
    boxShadow: `0 8px 24px ${medal.shadow}`,
  };
};

const podiumAvatar = (rank: number): CSSProperties => {
  const medal = MEDAL_COLORS[rank] ?? MEDAL_COLORS[3];
  const size = rank === 1 ? 56 : 44;
  return {
    width: size,
    height: size,
    borderRadius: size / 2,
    background: `linear-gradient(135deg, ${medal.bg}, ${medal.border})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: rank === 1 ? 18 : 14,
    fontWeight: 700,
    color: C.dark,
    border: `2px solid ${medal.border}`,
  };
};

const podiumRank = (rank: number): CSSProperties => {
  const medal = MEDAL_COLORS[rank] ?? MEDAL_COLORS[3];
  return {
    width: 22,
    height: 22,
    borderRadius: 11,
    background: medal.bg,
    color: C.dark,
    fontSize: 12,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -14,
    border: `2px solid ${C.background}`,
    position: "relative" as const,
    zIndex: 1,
  };
};

const podiumName: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: C.textPrimary,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
};

const podiumPnl = (up: boolean): CSSProperties => ({
  fontSize: 16,
  fontWeight: 700,
  color: up ? C.success : C.error,
});

const podiumMeta: CSSProperties = {
  fontSize: 10,
  color: C.textTertiary,
};

// List items
const listSection: CSSProperties = {
  padding: "0 16px",
};

const listCard = (isMe: boolean): CSSProperties => ({
  ...glassSurface,
  marginBottom: 8,
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  gap: 12,
  border: isMe
    ? `1px solid ${C.primary}44`
    : "1px solid rgba(255,255,255,0.06)",
  background: isMe
    ? "rgba(206,162,253,0.08)"
    : "rgba(255,255,255,0.04)",
});

const rankBadge: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 14,
  background: "rgba(255,255,255,0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 700,
  color: C.textSecondary,
  flexShrink: 0,
};

const listAvatar: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 20,
  background: "rgba(206,162,253,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 700,
  color: C.primary,
  flexShrink: 0,
};

const listInfo: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const listName: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: C.textPrimary,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const listAddr: CSSProperties = {
  fontSize: 11,
  color: C.textTertiary,
  marginTop: 1,
};

const listRight: CSSProperties = {
  textAlign: "right" as const,
  flexShrink: 0,
};

const listPnl = (up: boolean): CSSProperties => ({
  fontSize: 15,
  fontWeight: 700,
  color: up ? C.success : C.error,
});

const listMeta: CSSProperties = {
  fontSize: 10,
  color: C.textTertiary,
  marginTop: 2,
};

const meTag: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: C.primary,
  background: C.primaryLight,
  padding: "2px 6px",
  borderRadius: 4,
  marginLeft: 6,
  textTransform: "uppercase" as const,
};

// ─── Component ───────────────────────────────────────

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const walletAddr = (localStorage.getItem("ethcc-wallet-address") ?? "").toLowerCase();

  const [liveData, setLiveData] = useState<LeaderboardEntry[] | null>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real leaderboard from Blockscout explorer API
    // Use known addresses (connected users stored in localStorage transfers, or hardcoded event addresses)
    const knownAddresses: string[] = [];
    try {
      const transfers = JSON.parse(localStorage.getItem("ethcc-trust-transfers") ?? "[]");
      for (const t of transfers) {
        if (t.from && !knownAddresses.includes(t.from)) knownAddresses.push(t.from);
        if (t.to && !knownAddresses.includes(t.to)) knownAddresses.push(t.to);
      }
    } catch { /* ignore */ }
    if (walletAddr && !knownAddresses.includes(walletAddr)) knownAddresses.push(walletAddr);

    if (knownAddresses.length > 0) {
      fetchLeaderboard(knownAddresses).then((data) => {
        if (data.length > 0) setLiveData(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [walletAddr]);

  // Use live data if available, fallback to mock
  const leaderboard = liveData
    ? liveData.map((e) => ({
        name: e.label,
        addr: `${e.address.slice(0, 6)}...${e.address.slice(-4)}`,
        pnl: `${e.totalSent.toFixed(2)} TRUST`,
        up: true,
        votes: e.txCount,
        mktCap: `${e.txCount} tx`,
        rank: e.rank,
        isMe: e.address.toLowerCase() === walletAddr,
      }))
    : LEADERBOARD;

  const top3 = leaderboard.filter((u) => u.rank <= 3);
  const rest = leaderboard.filter((u) => u.rank > 3);

  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          &#8249;
        </button>
        <div style={title}>{liveData ? "Trust Sent" : "PnL Leaderboard"}</div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

      {/* Podium - Top 3 */}
      <div style={podiumSection}>
        {top3.map((user) => (
          <div key={user.rank} style={podiumCard(user.rank)}>
            <div style={podiumAvatar(user.rank)}>
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={podiumRank(user.rank)}>{user.rank}</div>
            <div style={podiumName}>{user.name}</div>
            <div style={podiumPnl(user.up)}>{user.pnl}</div>
            <div style={podiumMeta}>
              {user.votes} votes · ${user.mktCap}
            </div>
            {user.isMe && <div style={meTag}>You</div>}
          </div>
        ))}
      </div>

      {/* Rest of Rankings */}
      <div style={listSection}>
        {rest.map((user) => (
          <div key={user.rank} style={listCard(!!user.isMe)}>
            <div style={rankBadge}>{user.rank}</div>
            <div style={listAvatar}>
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={listInfo}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={listName}>{user.name}</span>
                {user.isMe && <span style={meTag}>You</span>}
              </div>
              <div style={listAddr}>{user.addr}</div>
            </div>
            <div style={listRight}>
              <div style={listPnl(user.up)}>{user.pnl}</div>
              <div style={listMeta}>
                {user.votes} votes · ${user.mktCap}
              </div>
            </div>
          </div>
        ))}
      </div>

      </div>{/* end scrollable content */}
    </div>
  );
}
