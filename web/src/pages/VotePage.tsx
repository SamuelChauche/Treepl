import { useState, useMemo, useCallback, useEffect } from "react";
import { categories } from "../data/topics";
import type { Web3Topic, Web3Category } from "../types";
import { connectWallet } from "../services/intuition";
import type { WalletConnection } from "../services/intuition";
import { submitVotes } from "../services/voteService";
import {
  fetchTrendingTopics,
  fetchTopicVoters,
  fetchAllTopicEvents,
  fetchTopicEvents,
  eventsToChartData,
  fetchLikeMinded,
  type TopicVaultData,
  type TopicPosition,
} from "../services/trendingService";
import {
  fetchPortfolio,
  redeemPosition,
  type PortfolioSummary,
  type UserPosition,
} from "../services/portfolioService";
import { explorerTxUrl } from "../config/constants";
import SparkChart from "../components/vote/SparkChart";
import "../styles/vote.css";

// ─── Helpers ─────────────────────────────────────────

function formatTrust(wei: string): string {
  const n = Number(wei) / 1e18;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(3);
  return n.toFixed(4);
}

function shortenAddr(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ─── Wallet Gate ─────────────────────────────────────

function WalletGate({ onConnected }: { onConnected: (w: WalletConnection) => void }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleConnect() {
    setError("");
    setStatus("Connecting...");
    try {
      const connection = await connectWallet();
      setStatus("");
      onConnected(connection);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("");
    }
  }

  return (
    <div className="wallet-gate">
      <h2>EthCC Sofia Manager</h2>
      <p>Connect your wallet to trade conviction on web3 topics. Every vote is on-chain.</p>
      <button className="connect-btn" onClick={handleConnect} disabled={!!status}>
        {status || "Connect Wallet"}
      </button>
      {error && <p style={{ color: "#ff5c7a", fontSize: "0.82rem" }}>{error}</p>}
    </div>
  );
}

// ─── Topic Row (trading style) ───────────────────────

function TopicRow({
  topic,
  category,
  selected,
  vaultData,
  chartData,
  index,
  onSelect,
  onTap,
}: {
  topic: Web3Topic;
  category: Web3Category;
  selected: boolean;
  vaultData?: TopicVaultData;
  chartData?: number[];
  index: number;
  onSelect: (id: string) => void;
  onTap: (id: string) => void;
}) {
  const sparkData = chartData && chartData.length >= 2 ? chartData : null;
  const isUp = sparkData ? sparkData[sparkData.length - 1] > sparkData[0] : true;

  return (
    <div
      className={`topic-row${selected ? " selected" : ""}`}
      style={{ animationDelay: `${index * 0.025}s` }}
      onClick={() => onTap(topic.id)}
    >
      {/* Color accent */}
      <div className="topic-row-accent" style={{ background: category.color }} />

      {/* Left: info */}
      <div className="topic-row-info">
        <div className="topic-row-name">{topic.name}</div>
        <div className="topic-row-meta">
          <span style={{ color: category.color }}>{category.name}</span>
          <span className="topic-row-dot">·</span>
          <span>{topic.type}</span>
        </div>
      </div>

      {/* Center: sparkline (real on-chain data only) */}
      <div className="topic-row-chart">
        {sparkData ? (
          <SparkChart
            data={sparkData}
            width={72}
            height={28}
            color={isUp ? "#2acecc" : "#ff5c7a"}
          />
        ) : (
          <div style={{ width: 72, height: 28, opacity: 0.15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: "rgba(255,255,255,0.3)" }}>
            no data
          </div>
        )}
      </div>

      {/* Right: support/oppose + vote button */}
      <div className="topic-row-right">
        {vaultData ? (
          <div className="topic-row-value">
            <div className="topic-row-sentiment">
              <span className="topic-row-support">{formatTrust(vaultData.supportAssets)}</span>
              <span className="topic-row-vs">/</span>
              <span className="topic-row-oppose">{formatTrust(vaultData.opposeAssets)}</span>
            </div>
            <span className="topic-row-unit">support / oppose</span>
          </div>
        ) : (
          <div className="topic-row-value">
            <span className="topic-row-support" style={{ opacity: 0.3 }}>--</span>
          </div>
        )}
        <button
          className={`topic-row-btn${selected ? " active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(topic.id);
          }}
        >
          {selected ? "✓" : "+"}
        </button>
      </div>
    </div>
  );
}

// ─── Topic Detail Sheet ──────────────────────────────

function TopicSheet({
  topic,
  category,
  vaultData,
  chartData,
  voters,
  loadingVoters,
  onClose,
}: {
  topic: Web3Topic;
  category: Web3Category;
  vaultData?: TopicVaultData;
  chartData: number[];
  voters: TopicPosition[];
  loadingVoters: boolean;
  onClose: () => void;
}) {

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        {/* Header */}
        <div className="sheet-header">
          <div className="sheet-badge" style={{ background: category.color }}>
            {topic.type}
          </div>
          <h3 className="sheet-title">{topic.name}</h3>
          <p className="sheet-desc">{topic.description}</p>
        </div>

        {/* Chart */}
        <div className="sheet-chart">
          {chartData.length >= 2 ? (
            <SparkChart data={chartData} width={320} height={100} color={category.color} />
          ) : (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }}>
              No trading activity yet
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="sheet-stats">
          <div className="sheet-stat">
            <span className="sheet-stat-value" style={{ color: "#2acecc" }}>
              {vaultData ? formatTrust(vaultData.supportAssets) : "0"}
            </span>
            <span className="sheet-stat-label">Support</span>
          </div>
          <div className="sheet-stat">
            <span className="sheet-stat-value" style={{ color: "#ff5c7a" }}>
              {vaultData ? formatTrust(vaultData.opposeAssets) : "0"}
            </span>
            <span className="sheet-stat-label">Oppose</span>
          </div>
          <div className="sheet-stat">
            <span className="sheet-stat-value">
              {(vaultData?.supportCount ?? 0) + (vaultData?.opposeCount ?? 0)}
            </span>
            <span className="sheet-stat-label">Voters</span>
          </div>
        </div>

        {/* Voters list */}
        <div className="sheet-section">
          <h4 className="sheet-section-title">Who supports this</h4>
          {loadingVoters ? (
            <div className="sheet-loading">Loading voters...</div>
          ) : voters.length === 0 ? (
            <div className="sheet-empty">No votes yet — be the first!</div>
          ) : (
            <div className="sheet-voters">
              {voters.slice(0, 20).map((v, i) => (
                <div key={i} className="sheet-voter">
                  <div className="sheet-voter-avatar">
                    {v.address.slice(2, 4).toUpperCase()}
                  </div>
                  <span className="sheet-voter-addr">{shortenAddr(v.address)}</span>
                  <span className="sheet-voter-shares">
                    {formatTrust(v.shares)} shares
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="sheet-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ─── Swipe Card ──────────────────────────────────────

function SwipeMode({
  topics,
  voted,
  onVote,
  chartDataMap,
}: {
  topics: { topic: Web3Topic; category: Web3Category }[];
  voted: Set<string>;
  onVote: (topicId: string) => void;
  chartDataMap: Map<string, number[]>;
}) {
  const unvoted = useMemo(
    () => topics.filter((t) => !voted.has(t.topic.id)),
    [topics, voted]
  );
  const [currentIdx, setCurrentIdx] = useState(0);

  if (currentIdx >= unvoted.length) {
    return (
      <div className="swipe-container">
        <div className="swipe-card">
          <div className="swipe-name">All done!</div>
          <div className="swipe-desc">
            You've seen all {topics.length} topics. Switch to list view to review.
          </div>
        </div>
      </div>
    );
  }

  const { topic, category } = unvoted[currentIdx];

  return (
    <div className="swipe-container">
      <div className="swipe-progress">
        {currentIdx + 1} / {unvoted.length}
      </div>
      <div
        className="swipe-card"
        key={topic.id}
        style={{ "--accent": category.color } as React.CSSProperties}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: category.color,
          }}
        />
        <div className="swipe-category" style={{ color: category.color }}>
          {category.name}
        </div>
        <div className="swipe-type">{topic.type}</div>
        <div className="swipe-name">{topic.name}</div>
        <div className="swipe-desc">{topic.description}</div>
        <div className="swipe-chart">
          {(chartDataMap.get(topic.id)?.length ?? 0) >= 2 ? (
            <SparkChart
              data={chartDataMap.get(topic.id)!}
              width={200}
              height={60}
              color={category.color}
            />
          ) : (
            <div style={{ padding: "0.5rem", color: "rgba(255,255,255,0.2)", fontSize: "0.7rem" }}>
              No activity yet
            </div>
          )}
        </div>
      </div>
      <div className="swipe-actions">
        <button
          className="swipe-action skip"
          onClick={() => setCurrentIdx((i) => i + 1)}
          title="Skip"
        >
          &times;
        </button>
        <button
          className="swipe-action like"
          onClick={() => {
            onVote(topic.id);
            setCurrentIdx((i) => i + 1);
          }}
          title="Vote"
        >
          &hearts;
        </button>
      </div>
    </div>
  );
}

// ─── Portfolio View ──────────────────────────────────

const CARD_COLORS = [
  { bg: "#E74C3C", light: "#FADBD8" },
  { bg: "#F4D03F", light: "#FEF9E7" },
  { bg: "#3498DB", light: "#D6EAF8" },
  { bg: "#2acecc", light: "#D1F2EB" },
  { bg: "#9B59B6", light: "#EBDEF0" },
  { bg: "#E67E22", light: "#FDEBD0" },
  { bg: "#1ABC9C", light: "#D1F2EB" },
  { bg: "#E91E63", light: "#FCE4EC" },
];

function PortfolioView({
  portfolio,
  loading,
  onRedeem,
  redeemingId,
}: {
  wallet: WalletConnection;
  portfolio: PortfolioSummary | null;
  loading: boolean;
  onRedeem: (pos: UserPosition) => void;
  redeemingId: string;
}) {
  if (loading) {
    return <div className="pf-loading">Loading positions...</div>;
  }

  if (!portfolio || portfolio.positions.length === 0) {
    return (
      <div className="pf-empty">
        <div className="pf-empty-icon">&#128176;</div>
        <div className="pf-empty-title">No positions yet</div>
        <div className="pf-empty-desc">
          Vote on topics to build your on-chain portfolio
        </div>
      </div>
    );
  }

  const totalVal = Number(portfolio.totalValue) / 1e18;
  const pnlVal = Number(portfolio.totalPnl);

  return (
    <div className="pf">
      {/* Hero balance */}
      <div className="pf-hero">
        <div className="pf-hero-label">Total Balance</div>
        <div className="pf-hero-amount">{totalVal.toFixed(4)} TRUST</div>
        <div className="pf-hero-row">
          <div className="pf-hero-stat">
            <span className="pf-hero-stat-label">Positions</span>
            <span className="pf-hero-stat-value">{portfolio.positions.length}</span>
          </div>
          <div className="pf-hero-stat">
            <span className="pf-hero-stat-label">P&L</span>
            <span
              className="pf-hero-stat-value"
              style={{ color: pnlVal >= 0 ? "#2acecc" : "#ff5c7a" }}
            >
              {pnlVal >= 0 ? "+" : ""}{formatTrust(portfolio.totalPnl)}
            </span>
          </div>
        </div>
      </div>

      {/* Position cards */}
      <div className="pf-section-title">Your Positions</div>
      <div className="pf-cards">
        {portfolio.positions.map((pos, i) => {
          const color = CARD_COLORS[i % CARD_COLORS.length];
          const isRedeeming = redeemingId === `${pos.tripleId}-${pos.side}`;
          const shares = Number(pos.shares) / 1e18;
          const currentVal = Number(pos.currentValue) / 1e18;
          const pnl = Number(pos.pnl);

          return (
            <div
              key={`${pos.tripleId}-${pos.side}`}
              className="pf-card"
              style={{ background: color.bg }}
            >
              <div className="pf-card-header">
                <span className="pf-card-name">{pos.topicLabel}</span>
                <span className={`pf-card-pnl-badge ${pnl >= 0 ? "up" : "down"}`}>
                  {pnl >= 0 ? "+" : ""}{pos.pnlPercent.toFixed(1)}%
                </span>
              </div>

              <div className="pf-card-balance-label">Balance</div>
              <div className="pf-card-balance">
                <span className="pf-card-amount">{currentVal.toFixed(4)}</span>
                <span className="pf-card-unit">TRUST</span>
              </div>

              <div className="pf-card-bar-track">
                <div
                  className="pf-card-bar-fill"
                  style={{
                    width: `${Math.min(100, (shares / (totalVal || 1)) * 100)}%`,
                    background: color.light,
                  }}
                />
              </div>

              <div className="pf-card-footer">
                <div className="pf-card-shares">
                  {shares.toFixed(4)} shares
                </div>
                <button
                  className="pf-card-redeem"
                  onClick={(e) => { e.stopPropagation(); onRedeem(pos); }}
                  disabled={isRedeeming}
                >
                  {isRedeeming ? "..." : "Redeem"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main VotePage ───────────────────────────────────

export default function VotePage() {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [mode, setMode] = useState<"list" | "swipe" | "trending" | "portfolio" | "community">("list");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [txHash, setTxHash] = useState("");

  // Trending data
  const [trendingData, setTrendingData] = useState<TopicVaultData[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Portfolio
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [redeemingId, setRedeemingId] = useState("");

  // Community (like-minded voters)
  const [communityData, setCommunityData] = useState<{ address: string; commonTopics: string[]; count: number }[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

  // Chart data (real on-chain events)
  const [chartDataMap, setChartDataMap] = useState<Map<string, number[]>>(new Map());

  // Detail sheet
  const [detailTopic, setDetailTopic] = useState<string | null>(null);
  const [detailVoters, setDetailVoters] = useState<TopicPosition[]>([]);
  const [detailChartData, setDetailChartData] = useState<number[]>([]);
  const [loadingVoters, setLoadingVoters] = useState(false);

  // Vault data map for quick lookup
  const vaultMap = useMemo(() => {
    const m = new Map<string, TopicVaultData>();
    for (const d of trendingData) m.set(d.topicId, d);
    return m;
  }, [trendingData]);

  // Fetch trending + chart data on mount
  useEffect(() => {
    setLoadingTrending(true);
    fetchTrendingTopics()
      .then(setTrendingData)
      .catch(() => {})
      .finally(() => setLoadingTrending(false));
    fetchAllTopicEvents()
      .then(setChartDataMap)
      .catch(() => {});
  }, []);

  // Fetch portfolio when mode switches
  useEffect(() => {
    if (mode !== "portfolio" || !wallet) return;
    setLoadingPortfolio(true);
    fetchPortfolio(wallet.address, wallet)
      .then((p) => {
        console.log("[P&L] Portfolio loaded:", p.positions.length, "positions", p);
        setPortfolio(p);
      })
      .catch((err) => {
        console.error("[P&L] Failed to fetch portfolio:", err);
      })
      .finally(() => setLoadingPortfolio(false));
  }, [mode, wallet]);

  // Fetch community when mode switches
  useEffect(() => {
    if (mode !== "community" || !wallet) return;
    setLoadingCommunity(true);
    fetchLikeMinded(wallet.address)
      .then(setCommunityData)
      .catch(() => {})
      .finally(() => setLoadingCommunity(false));
  }, [mode, wallet]);

  const handleRedeem = useCallback(
    async (pos: UserPosition) => {
      if (!wallet) return;
      const id = `${pos.tripleId}-${pos.side}`;
      setRedeemingId(id);
      try {
        await redeemPosition(wallet, pos.tripleId, BigInt(pos.shares));
        // Refresh portfolio after redeem
        const updated = await fetchPortfolio(wallet.address, wallet);
        setPortfolio(updated);
        // Refresh trending too
        fetchTrendingTopics().then(setTrendingData).catch(() => {});
      } catch {
        // User rejected or error — silently reset
      } finally {
        setRedeemingId("");
      }
    },
    [wallet]
  );

  // Fetch voters + detailed chart when detail sheet opens
  useEffect(() => {
    if (!detailTopic) return;
    setLoadingVoters(true);
    setDetailVoters([]);
    setDetailChartData([]);
    fetchTopicVoters(detailTopic)
      .then(setDetailVoters)
      .catch(() => {})
      .finally(() => setLoadingVoters(false));
    fetchTopicEvents(detailTopic)
      .then((events) => setDetailChartData(eventsToChartData(events)))
      .catch(() => {});
  }, [detailTopic]);

  const handleSelect = useCallback((topicId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
    setTxHash("");
    setSubmitError("");
  }, []);

  const handleSubmitVotes = useCallback(async () => {
    if (!wallet || selected.size === 0) return;
    setSubmitting(true);
    setSubmitError("");
    setTxHash("");
    try {
      const result = await submitVotes(wallet, Array.from(selected), undefined, setSubmitStep);
      setTxHash(result.hash);
      setSubmitStep(`${result.tripleCount} votes confirmed!`);
      // Refresh trending
      fetchTrendingTopics().then(setTrendingData).catch(() => {});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSubmitError(msg.includes("rejected") || msg.includes("ACTION_REJECTED") ? "Transaction rejected" : msg);
    } finally {
      setSubmitting(false);
    }
  }, [wallet, selected]);

  // Flat list
  const allTopicsWithCategory = useMemo(
    () => categories.flatMap((cat) => cat.topics.map((t) => ({ topic: t, category: cat }))),
    []
  );

  const filteredTopics = useMemo(
    () =>
      activeCategory
        ? allTopicsWithCategory.filter((t) => t.category.id === activeCategory)
        : allTopicsWithCategory,
    [activeCategory, allTopicsWithCategory]
  );

  // Detail sheet topic data
  const detailTopicData = useMemo(() => {
    if (!detailTopic) return null;
    const found = allTopicsWithCategory.find((t) => t.topic.id === detailTopic);
    return found ?? null;
  }, [detailTopic, allTopicsWithCategory]);

  // Not connected
  if (!wallet) {
    return (
      <div className="vote-page">
        <div className="vote-content">
          <WalletGate onConnected={setWallet} />
        </div>
      </div>
    );
  }

  return (
    <div className="vote-page">
      <div className="vote-content">
        {/* Header */}
        <div className="vote-header">
          <h1>EthCC Sofia Manager</h1>
          <p>{shortenAddr(wallet.address)} · {allTopicsWithCategory.length} topics</p>
        </div>

        {/* Mode toggle */}
        <div className="mode-toggle">
          <button className={`mode-btn${mode === "list" ? " active" : ""}`} onClick={() => setMode("list")}>
            List
          </button>
          <button className={`mode-btn${mode === "trending" ? " active" : ""}`} onClick={() => setMode("trending")}>
            Trending
          </button>
          <button className={`mode-btn${mode === "swipe" ? " active" : ""}`} onClick={() => setMode("swipe")}>
            Swipe
          </button>
          <button className={`mode-btn${mode === "portfolio" ? " active" : ""}`} onClick={() => setMode("portfolio")}>
            P&L
          </button>
          <button className={`mode-btn${mode === "community" ? " active" : ""}`} onClick={() => setMode("community")}>
            Community
          </button>
        </div>

        {/* Category pills */}
        {mode !== "swipe" && mode !== "portfolio" && mode !== "community" && (
          <div className="category-pills">
            <button
              className={`cat-pill${activeCategory === null ? " active" : ""}`}
              style={activeCategory === null ? { background: "var(--teal)", color: "#001e2f" } : {}}
              onClick={() => setActiveCategory(null)}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`cat-pill${activeCategory === cat.id ? " active" : ""}`}
                style={activeCategory === cat.id ? { background: cat.color } : {}}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {mode === "list" && (
          <div className="topic-list">
            {filteredTopics.map(({ topic, category }, i) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                category={category}
                selected={selected.has(topic.id)}
                vaultData={vaultMap.get(topic.id)}
                chartData={chartDataMap.get(topic.id)}
                index={i}
                onSelect={handleSelect}
                onTap={setDetailTopic}
              />
            ))}
          </div>
        )}

        {mode === "trending" && (
          <div className="topic-list">
            {loadingTrending ? (
              <div className="trending-loading">Loading on-chain data...</div>
            ) : trendingData.length === 0 ? (
              <div className="trending-empty">
                No votes yet. Be the first to vote on a topic!
              </div>
            ) : (
              trendingData
                .filter((d) => !activeCategory || d.topicId.startsWith(activeCategory))
                .map((d, i) => {
                  const found = allTopicsWithCategory.find((t) => t.topic.id === d.topicId);
                  if (!found) return null;
                  return (
                    <TopicRow
                      key={d.topicId}
                      topic={found.topic}
                      category={found.category}
                      selected={selected.has(d.topicId)}
                      vaultData={d}
                      chartData={chartDataMap.get(d.topicId)}
                      index={i}
                      onSelect={handleSelect}
                      onTap={setDetailTopic}
                    />
                  );
                })
            )}
          </div>
        )}

        {mode === "swipe" && (
          <SwipeMode topics={filteredTopics} voted={selected} onVote={handleSelect} chartDataMap={chartDataMap} />
        )}

        {mode === "portfolio" && wallet && (
          <PortfolioView
            wallet={wallet}
            portfolio={portfolio}
            loading={loadingPortfolio}
            onRedeem={handleRedeem}
            redeemingId={redeemingId}
          />
        )}

        {mode === "community" && (
          <div className="community-view">
            <h2 className="community-title">People who think like you</h2>
            <p className="community-subtitle">
              Participants who voted on the same topics as you.
            </p>

            {loadingCommunity && (
              <div className="pf-loading">Searching for your tribe...</div>
            )}

            {!loadingCommunity && communityData.length === 0 && (
              <div className="community-empty">
                <p>No matches yet.</p>
                <p>Vote on topics first — then come back to discover who shares your convictions.</p>
              </div>
            )}

            {!loadingCommunity && communityData.length > 0 && (
              <div className="community-cards">
                {communityData.map((person) => (
                  <div key={person.address} className="community-card">
                    <div className="community-card-header">
                      <span className="community-card-addr">
                        {person.address.length > 20
                          ? `${person.address.slice(0, 6)}...${person.address.slice(-4)}`
                          : person.address}
                      </span>
                      <span className="community-card-count">
                        {person.count} shared
                      </span>
                    </div>
                    <div className="community-card-topics">
                      {person.commonTopics.map((t) => (
                        <span key={t} className="community-pill">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detail sheet */}
        {detailTopicData && (
          <TopicSheet
            topic={detailTopicData.topic}
            category={detailTopicData.category}
            vaultData={vaultMap.get(detailTopicData.topic.id)}
            chartData={detailChartData}
            voters={detailVoters}
            loadingVoters={loadingVoters}
            onClose={() => setDetailTopic(null)}
          />
        )}

        {/* Batch bar */}
        {selected.size > 0 && (
          <div className="batch-bar">
            <div className="batch-info">
              <span>{selected.size}</span> selected
            </div>
            {txHash ? (
              <a
                href={explorerTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="batch-submit"
                style={{ textDecoration: "none" }}
              >
                View tx
              </a>
            ) : (
              <button
                className="batch-submit"
                onClick={handleSubmitVotes}
                disabled={submitting}
              >
                {submitting ? submitStep || "..." : `Vote on-chain (${selected.size})`}
              </button>
            )}
            {submitError && (
              <div style={{ color: "#ff5c7a", fontSize: "0.75rem", width: "100%", textAlign: "center" }}>
                {submitError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
