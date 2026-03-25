import { useMemo, useEffect, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { C, R, glassSurface, FONT } from "../config/theme";
import { allTopics, categories } from "../data/topics";
import { Ic } from "../components/ui/Icons";
import { Spark } from "../components/ui/Spark";
import { fetchTrendingTopics, fetchTopicEvents, eventsToChartData, type TopicVaultData } from "../services/trendingService";

const ICON_EMOJI: Record<string, string> = {
  "chart-line": "📊", image: "🖼️", layers: "🔗", shield: "🔒", brain: "🤖",
  lock: "🛡️", users: "🏛️", wrench: "🛠️", "dollar-sign": "💲", building: "🏠",
  gamepad: "🎮", fingerprint: "👤", cube: "⚙️", server: "🥩", link: "🌐",
  gavel: "⚖️", fire: "🔥", "bar-chart": "📈", leaf: "🌿", rocket: "🚀",
};

function formatTrust(wei: string): string {
  const val = Number(BigInt(wei)) / 1e18;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  if (val >= 1) return val.toFixed(2);
  if (val >= 0.01) return val.toFixed(3);
  if (val > 0) return val.toFixed(4);
  return "0";
}

// ─── Styles ──────────────────────────────────────────

const page: CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column",
  background: "transparent", color: C.textPrimary, fontFamily: FONT, overflow: "hidden",
};

const header: CSSProperties = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "12px 16px 0", flexShrink: 0,
};

const backBtn: CSSProperties = {
  width: 42, height: 42, borderRadius: 14, background: C.surfaceGray,
  border: "none", color: C.textPrimary, fontSize: 18, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const title: CSSProperties = { fontSize: 20, fontWeight: 700, flex: 1 };

const heroSection: CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  padding: "28px 20px 20px", gap: 12,
};

const card: CSSProperties = {
  ...glassSurface, margin: "0 16px 10px", padding: "14px 16px",
  background: "rgba(22,22,24,0.85)",
};

const row: CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "8px 0", borderBottom: `1px solid ${C.border}`,
};

const label: CSSProperties = { fontSize: 13, color: C.textSecondary };
const value: CSSProperties = { fontSize: 13, color: C.textPrimary, fontWeight: 600 };

const sectionTitle: CSSProperties = {
  fontSize: 12, fontWeight: 600, color: C.textTertiary,
  textTransform: "uppercase" as const, letterSpacing: 1,
  padding: "16px 16px 8px",
};

// ─── Component ───────────────────────────────────────

export default function TopicDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const topic = useMemo(() => allTopics.find((t) => t.id === id), [id]);
  const cat = useMemo(() => {
    if (!topic) return undefined;
    return categories.find((c) => c.topics.some((t) => t.id === topic.id));
  }, [topic]);

  const [vaultData, setVaultData] = useState<TopicVaultData | null>(null);
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setChartLoading(true);
    Promise.all([
      fetchTrendingTopics(),
      fetchTopicEvents(id),
    ]).then(([trending, events]) => {
      const match = trending.find((d) => d.topicId === id);
      if (match) setVaultData(match);
      setChartData(eventsToChartData(events));
    }).catch(() => {}).finally(() => setChartLoading(false));
  }, [id]);

  if (!topic) {
    return (
      <div style={page}>
        <div style={header}>
          <button style={backBtn} onClick={() => navigate(-1)}>
            <Ic.Back c={C.textPrimary} />
          </button>
          <div style={title}>Topic</div>
        </div>
        <div style={{ textAlign: "center", padding: 40, color: C.textTertiary }}>
          Topic not found.
        </div>
      </div>
    );
  }

  const emoji = ICON_EMOJI[cat?.icon ?? ""] ?? "📌";
  const color = cat?.color ?? C.primary;

  return (
    <div style={page}>
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          <Ic.Back c={C.textPrimary} />
        </button>
        <div style={title}>Topic</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}>
        {/* Hero */}
        <div style={heroSection}>
          <div style={{
            width: 64, height: 64, borderRadius: R.lg,
            background: `${color}22`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 32,
          }}>
            {emoji}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, textAlign: "center" }}>{topic.name}</div>
          <div style={{
            padding: "4px 14px", borderRadius: R.btn,
            background: `${color}22`, color, fontSize: 12, fontWeight: 600,
          }}>
            {cat?.name ?? "Web3"}
          </div>
          <div style={{
            padding: "4px 12px", borderRadius: R.btn,
            background: "rgba(255,255,255,0.08)", fontSize: 11, color: C.textSecondary,
          }}>
            {topic.type}
          </div>
        </div>

        {/* Description */}
        <div style={card}>
          <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6 }}>
            {topic.description}
          </div>
        </div>

        {/* Trend */}
        <div style={sectionTitle}>Trend</div>
        <div style={{ ...card, padding: "16px" }}>
          {chartLoading ? (
            <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.textTertiary }}>
              Loading...
            </div>
          ) : (
            <Spark data={chartData} color={color} h={40} emptyLabel="No activity yet" />
          )}
        </div>

        {/* On-chain data */}
        <div style={sectionTitle}>On-Chain Data</div>
        <div style={card}>
          <div style={row}>
            <span style={label}>Supporters</span>
            <span style={value}>{vaultData ? vaultData.supportCount : "—"}</span>
          </div>
          <div style={row}>
            <span style={label}>TRUST Staked</span>
            <span style={{ ...value, color: C.trust }}>
              {vaultData && BigInt(vaultData.supportAssets) > 0n
                ? `${formatTrust(vaultData.supportAssets)} TRUST`
                : "—"}
            </span>
          </div>
          <div style={{ ...row, borderBottom: "none" }}>
            <span style={label}>Category</span>
            <span style={{ ...value, color }}>{cat?.name ?? "Other"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
