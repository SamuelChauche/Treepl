import { useState, useEffect, useMemo, type CSSProperties  } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, btnPill, FONT, getTrackStyle } from "../config/theme";
import { sessions, trackNames, ratingsGraph } from "../data";
import { allTopics, categories } from "../data/topics";
import { Ic } from "../components/ui/Icons";
import { useCart } from "../hooks/useCart";
import { CHAIN_CONFIG, STORAGE_KEYS, DEFAULT_DEPOSIT_PER_TRIPLE } from "../config/constants";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { useEmbeddedWallet } from "../contexts/EmbeddedWalletContext";
import { depositOnAtoms, ensureUserAtom, buildProfileTriples, createProfileTriples, TRACK_ATOM_IDS } from "../services/intuition";
import { avatarColor } from "../config/theme";
import { resolveTopicAtomIds } from "../services/voteService";
import { formatTxError } from "../utils/txErrors";
import { PublishSuccessSheet } from "../components/cart/PublishSuccessSheet";
import {
  scrollContent,
  fluidContent,
  cardTitle,
  metaText,
  monoText,
  deleteBtn,
  accentBar,
  avatarSmall,
  iconBoxSmall,
  truncateLabel,
  getInitials,
} from "../styles/common";

// ─── Icon mapping (same as VotePage) ────────────────
const ICON_EMOJI: Record<string, string> = {
  "chart-line": "📊", image: "🖼️", layers: "🔗", shield: "🔒", brain: "🤖",
  lock: "🛡️", users: "🏛️", wrench: "🛠️", "dollar-sign": "💲", building: "🏠",
  gamepad: "🎮", fingerprint: "👤", cube: "⚙️", server: "🥩", link: "🌐",
  gavel: "⚖️", fire: "🔥", "bar-chart": "📈", leaf: "🌿", rocket: "🚀",
};

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

// ─── Styles ─────────────────────────────────────────
const page: CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column",
  background: "transparent", fontFamily: FONT, color: C.textPrimary, overflow: "hidden",
};

const sectionWrap: CSSProperties = { padding: "0 20px", marginBottom: 20 };

const sectionHead: CSSProperties = {
  fontSize: 14, fontWeight: 700, color: C.textSecondary,
  textTransform: "uppercase" as const, letterSpacing: 1,
  marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
};

const pill: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "6px 14px", borderRadius: R.btn, fontSize: 12, fontWeight: 600, marginRight: 6, marginBottom: 6,
};

const card: CSSProperties = {
  ...glassSurface, display: "flex", gap: 12, padding: 12,
  marginBottom: 8, boxSizing: "border-box" as const, overflow: "hidden",
};

const summaryCard: CSSProperties = {
  ...glassSurface, padding: 16, margin: "0 20px 16px", boxSizing: "border-box" as const,
};

const summaryRow: CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "8px 0", fontSize: 13, color: C.textSecondary,
  borderBottom: `1px solid ${C.border}`, gap: 8,
};

const bottomBar: CSSProperties = {
  flexShrink: 0, padding: "12px 20px 24px",
  background: C.background, borderTop: `1px solid ${C.border}`, boxSizing: "border-box" as const,
};

const emptyState: CSSProperties = {
  textAlign: "center" as const, padding: "32px 20px", color: C.textTertiary, fontSize: 13,
};

const pageHeader: CSSProperties = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "12px 20px", borderBottom: `1px solid ${C.border}`,
  position: "sticky" as const, top: 0, background: C.background,
  zIndex: 10, flexShrink: 0,
};

const backBtn: CSSProperties = {
  width: 36, height: 36, borderRadius: R.md,
  background: C.surfaceGray, border: "none",
  color: C.textPrimary, fontSize: 18,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: FONT, flexShrink: 0,
};

const pageTitle: CSSProperties = {
  fontSize: 18, fontWeight: 700, color: C.textPrimary,
  flex: 1, margin: 0,
};

const emptyIcon: CSSProperties = { fontSize: 40, marginBottom: 12 };

const emptyTitle: CSSProperties = { fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 4 };

const emptyBackBtn: CSSProperties = {
  ...btnPill, padding: "10px 20px", marginTop: 16,
  background: C.surfaceGray, color: C.textPrimary,
  fontSize: 14, fontWeight: 600, cursor: "pointer",
  border: "none", fontFamily: FONT,
};

const sectionEmoji: CSSProperties = { fontSize: 16 };

const interestWrap: CSSProperties = { display: "flex", flexWrap: "wrap" };

const interestPill = (color: string): CSSProperties => ({
  ...pill, background: color, color: "#fff", cursor: "pointer",
});

const topicIconBox = (color: string | undefined): CSSProperties => ({
  width: 36, height: 36, borderRadius: R.md, flexShrink: 0,
  background: color ? `${color}22` : C.primaryLight,
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
});

const topicTitle: CSSProperties = {
  fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};

const topicMeta = (color: string): CSSProperties => ({
  fontSize: 11, color, marginTop: 2,
});

const deleteBtnCentered: CSSProperties = {
  ...deleteBtn, alignSelf: "center",
};

const sessionSpeakers: CSSProperties = {
  fontSize: 11, color: C.textSecondary, marginTop: 2,
  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};

const sessionTrackMeta = (color: string): CSSProperties => ({
  fontSize: 11, color, marginTop: 2,
});

const ratingIconBox: CSSProperties = {
  width: 36, height: 36, borderRadius: R.md, flexShrink: 0,
  background: C.flatLight,
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 14, fontWeight: 700, color: C.flat,
};

const summaryTitle: CSSProperties = { fontSize: 14, fontWeight: 700, marginBottom: 10 };

const summaryValue = (color: string): CSSProperties => ({ color, fontWeight: 600 });


const summaryRowNoBorder: CSSProperties = { ...summaryRow, borderBottom: "none" };

const estimatedCost: CSSProperties = { fontSize: 15, fontWeight: 800, color: C.trust };


const successBtn: CSSProperties = { ...btnPill, background: C.success, color: "#fff" };

const connectBtn: CSSProperties = { ...btnPill, background: "#ffa7b1", color: "#0a0a0a" };

const publishBtn = (isPublishing: boolean): CSSProperties => ({
  ...btnPill, background: "#ffa7b1", color: "#0a0a0a", opacity: isPublishing ? 0.7 : 1,
});

const errorCard: CSSProperties = {
  ...glassSurface, margin: "0 20px 16px",
  borderLeft: `3px solid ${C.error}`, boxSizing: "border-box" as const,
};
const errorCardHeader: CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "12px 16px 6px",
};
const errorCardTitle: CSSProperties = {
  fontSize: 13, fontWeight: 700, color: C.error,
  display: "flex", alignItems: "center", gap: 6,
};
const errorStepBadge: CSSProperties = {
  display: "inline-block", padding: "2px 8px",
  borderRadius: R.sm, background: C.errorLight,
  color: C.error, fontSize: 11, fontWeight: 600,
  margin: "0 16px 8px",
};
const errorMessage: CSSProperties = {
  fontSize: 13, color: C.textPrimary, lineHeight: 1.6,
  padding: "0 16px 10px",
};
const rawToggle: CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  fontSize: 11, color: C.textTertiary, padding: "0 16px 8px",
  display: "block", fontFamily: FONT, textAlign: "left" as const,
};
const rawErrorBox: CSSProperties = {
  margin: "0 16px 10px", padding: 10,
  background: "rgba(0,0,0,0.35)", borderRadius: R.sm,
  fontSize: 10, color: C.textTertiary, fontFamily: "monospace",
  wordBreak: "break-all" as const, lineHeight: 1.4,
  maxHeight: 90, overflow: "auto",
};
const errorActions: CSSProperties = {
  display: "flex", gap: 8, padding: "10px 16px 14px",
  borderTop: `1px solid ${C.border}`,
};
const sendTrustBtn: CSSProperties = {
  flex: 1, height: 36, borderRadius: R.btn,
  background: C.errorLight, border: `1px solid ${C.error}`,
  color: C.error, fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: FONT,
};
const retryBtn: CSSProperties = {
  flex: 1, height: 36, borderRadius: R.btn,
  background: C.surfaceGray, border: "none",
  color: C.textPrimary, fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: FONT,
};
const dismissBtn: CSSProperties = {
  width: 26, height: 26, borderRadius: R.sm,
  background: C.errorLight, border: "none",
  color: C.error, fontSize: 14, fontWeight: 700,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: FONT, flexShrink: 0,
};

// ─── Component ──────────────────────────────────────
export default function CartPage() {
  const navigate = useNavigate();
  const { cart, toggleCart, clearCart } = useCart();
  const { wallet: appKitWallet, isConnected: appKitConnected, connect: openWalletModal } = useWalletConnection();
  const embeddedCtx = useEmbeddedWallet();
  const wallet = appKitWallet ?? embeddedCtx.wallet;
  const isConnected = appKitConnected || !!embeddedCtx.wallet;
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState("");
  const [publishDone, setPublishDone] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [failedStep, setFailedStep] = useState("");
  const [rawError, setRawError] = useState("");
  const [showRawError, setShowRawError] = useState(false);
  const [publishedTxHash, setPublishedTxHash] = useState("");
  const [userAtomId, setUserAtomId] = useState("");

  // Category lookup
  const categoryMap = useMemo(() => {
    const m = new Map<string, { icon: string; color: string; name: string }>();
    categories.forEach((c) => c.topics.forEach((t) => m.set(t.id, { icon: c.icon, color: c.color, name: c.name })));
    return m;
  }, []);

  // Build lookup maps
  const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s])), []);
  const topicMap = useMemo(() => new Map(allTopics.map((t) => [t.id, t])), []);

  // Categorize all cart items
  const cartSessions = useMemo(() => {
    const result: typeof sessions = [];
    cart.forEach((id) => {
      const s = sessionMap.get(id);
      if (s) result.push(s);
    });
    return result;
  }, [cart, sessionMap]);

  const cartTopics = useMemo(() => {
    const result: typeof allTopics = [];
    cart.forEach((id) => {
      const t = topicMap.get(id);
      if (t) result.push(t);
    });
    return result;
  }, [cart, topicMap]);

  // Derived interests: extract unique tracks from sessions + explicit interests from cart
  const derivedInterests = useMemo(() => {
    const tracks = new Set<string>();

    // Auto-derived from sessions
    cartSessions.forEach(session => {
      if (session.track) tracks.add(session.track);
    });

    // Explicit interests from cart (prefixed with "interest:")
    cart.forEach((id) => {
      if (id.startsWith("interest:")) {
        const track = id.slice(9); // Remove "interest:" prefix
        if (trackNames.includes(track)) tracks.add(track);
      }
    });

    return Array.from(tracks);
  }, [cartSessions, cart]);

  const topicList = derivedInterests;

  // Pending follows (from useFollow)
  const cartFollows = useMemo(() => {
    const result: string[] = [];
    cart.forEach((id) => {
      if (id.startsWith("follow:")) result.push(id.slice(7));
    });
    return result;
  }, [cart]);

  // Pending ratings (from RateSessionPage)
  const pendingRatings: Record<string, number> = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.RATINGS_PENDING) ?? "{}"
  );
  const cartRatings = useMemo(() => {
    const result: { session: typeof sessions[0]; rating: number }[] = [];
    for (const [sessionId, ratingValue] of Object.entries(pendingRatings)) {
      const s = sessionMap.get(sessionId);
      if (s) result.push({ session: s, rating: ratingValue });
    }
    return result;
  }, [pendingRatings, sessionMap]);

  const tripleCount = topicList.length + cartSessions.length + cartTopics.length + cartRatings.length + cartFollows.length;
  const isEmpty = tripleCount === 0;

  // Estimate cost: deposits use calculateDepositFee, sessions use getTotalCreationCost
  const depositCount = topicList.length + cartTopics.length; // interests + voted topics → deposit
  const sessionCount = cartSessions.length; // sessions → triples
  const ratingCount = cartRatings.length; // ratings → deposit into existing triple vaults

  interface CostBreakdown {
    mvFees: bigint;     // MultiVault creation fees (atom + triples)
    deposits: bigint;   // User deposits → vault shares
    sofiaFees: bigint;  // Sofia proxy fees (fixed + 5%)
    total: bigint;
  }
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);

  useEffect(() => {
    if (tripleCount === 0) { setCostBreakdown(null); return; }
    let cancelled = false;
    import("ethers").then(async ({ ethers }) => {
      const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG.RPC_URL);
      const proxy = new ethers.Contract(
        CHAIN_CONFIG.SOFIA_PROXY,
        [
          "function calculateDepositFee(uint256 depositCount, uint256 totalDeposit) view returns (uint256)",
          "function getTotalCreationCost(uint256 depositCount, uint256 totalDeposit, uint256 multiVaultCost) view returns (uint256)",
        ],
        provider
      );
      const mv = new ethers.Contract(
        CHAIN_CONFIG.MULTIVAULT,
        [
          "function getTripleCost() view returns (uint256)",
          "function getAtomCost() view returns (uint256)",
        ],
        provider
      );

      const deposit = BigInt(DEFAULT_DEPOSIT_PER_TRIPLE);
      let mvFees = 0n;
      let deposits = 0n;
      let sofiaFees = 0n;

      const [tripleCost, atomCost]: [bigint, bigint] = await Promise.all([
        mv.getTripleCost(),
        mv.getAtomCost(),
      ]);

      // User atom creation (worst case: atom not yet on-chain)
      mvFees += atomCost;

      // Deposits on interests + topics (depositBatch, no creation)
      if (depositCount > 0) {
        const n = BigInt(depositCount);
        const totalDep = deposit * n;
        const fee: bigint = await proxy.calculateDepositFee(n, totalDep);
        deposits += totalDep;
        sofiaFees += fee;
      }

      // Session triples (createTriples: creation + deposit)
      if (sessionCount > 0) {
        const n = BigInt(sessionCount);
        const totalDep = deposit * n;
        const mvCost = (tripleCost * n) + totalDep;
        const triCost: bigint = await proxy.getTotalCreationCost(n, totalDep, mvCost);
        mvFees += tripleCost * n;
        deposits += totalDep;
        sofiaFees += triCost - tripleCost * n - totalDep;
      }

      // Follow triples (createTriples: creation + deposit)
      if (cartFollows.length > 0) {
        const n = BigInt(cartFollows.length);
        const totalDep = deposit * n;
        const mvCost = (tripleCost * n) + totalDep;
        const triCost: bigint = await proxy.getTotalCreationCost(n, totalDep, mvCost);
        mvFees += tripleCost * n;
        deposits += totalDep;
        sofiaFees += triCost - tripleCost * n - totalDep;
      }

      // Rating deposits (depositBatch into existing triple vaults, 0.001 TRUST each)
      if (ratingCount > 0) {
        const ratingDeposit = ethers.parseEther("0.001");
        const n = BigInt(ratingCount);
        const totalRatingDep = ratingDeposit * n;
        try {
          const fee: bigint = await proxy.calculateDepositFee(n, totalRatingDep);
          deposits += totalRatingDep;
          sofiaFees += fee;
        } catch {
          deposits += totalRatingDep;
        }
      }

      if (cancelled) return;
      setCostBreakdown({ mvFees, deposits, sofiaFees, total: mvFees + deposits + sofiaFees });
    }).catch(() => {
      if (!cancelled) setCostBreakdown(null);
    });
    return () => { cancelled = true; };
  }, [depositCount, sessionCount, ratingCount, cartFollows.length, tripleCount]);

  const clearError = () => {
    setPublishError("");
    setFailedStep("");
    setRawError("");
    setShowRawError(false);
  };

  const isInsufficientFunds = /insufficient.funds|insufficient_funds|SofiaFeeProxy_InsufficientValue/i.test(rawError);

  async function handlePublish() {
    if (!wallet || publishing) return;
    clearError();
    setPublishing(true);
    let lastTxHash = "";
    try {
      // Get user atom ID (might already exist)
      setPublishStatus("Preparing your profile...");
      const nickname = localStorage.getItem(STORAGE_KEYS.NICKNAME) ?? undefined;
      const atomId = await ensureUserAtom(wallet.multiVault, wallet.proxy, wallet.address, wallet.ethers, nickname);
      setUserAtomId(atomId);

      // 1. Deposit on track atoms (interests)
      const trackAtomIds = topicList.map((t) => TRACK_ATOM_IDS[t]).filter(Boolean);
      if (trackAtomIds.length > 0) {
        setPublishStatus(`Depositing on ${trackAtomIds.length} interests...`);
        const result = await depositOnAtoms(wallet, trackAtomIds, undefined, (step) => {
          setPublishStatus(step);
        });
        if (typeof result === 'string') {
          lastTxHash = result;
        } else if (result && 'hash' in result) {
          lastTxHash = result.hash;
        }
      }

      // 2. Deposit on topic atoms (votes)
      if (cartTopics.length > 0) {
        const { resolved } = resolveTopicAtomIds(cartTopics.map((t) => t.id));
        if (resolved.length > 0) {
          setPublishStatus(`Depositing on ${resolved.length} topics...`);
          const result = await depositOnAtoms(wallet, resolved.map((r) => r.atomId), undefined, (step) => {
            setPublishStatus(step);
          });
          if (typeof result === 'string') {
            lastTxHash = result;
          } else if (result && 'hash' in result) {
            lastTxHash = result.hash;
          }
        }
        const pubVotes: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_VOTES) ?? "[]");
        for (const t of cartTopics) {
          if (!pubVotes.includes(t.id)) pubVotes.push(t.id);
        }
        localStorage.setItem(STORAGE_KEYS.PUBLISHED_VOTES, JSON.stringify(pubVotes));
      }

      // 3. Create attending triples (sessions)
      if (cartSessions.length > 0) {
        setPublishStatus(`Creating ${cartSessions.length} session triples...`);
        const triples = buildProfileTriples(atomId, [], cartSessions.map((s) => s.id));
        console.log('[CartPage] Session triples to create:', triples.length, triples);
        if (triples.length > 0) {
          const result = await createProfileTriples(wallet, triples, undefined, (step) => {
            console.log('[CartPage] Step:', step);
            setPublishStatus(step);
          });
          console.log('[CartPage] Session triples created!', result);
          if (typeof result === 'string') {
            lastTxHash = result;
          } else if (result && 'hash' in result) {
            lastTxHash = result.hash;
          }
        }
        const published: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]");
        for (const s of cartSessions) {
          if (!published.includes(s.id)) published.push(s.id);
        }
        localStorage.setItem(STORAGE_KEYS.PUBLISHED_SESSIONS, JSON.stringify(published));
      }

      // 4. Deposit on rating triple vaults
      if (cartRatings.length > 0) {
        setPublishStatus(`Depositing ${cartRatings.length} ratings...`);
        const ratingTripleIds: string[] = [];
        for (const { session: s, rating: r } of cartRatings) {
          const tripleData = ratingsGraph.sessionRatingTriples[s.id]?.[String(r)];
          if (tripleData) {
            const tripleId = await wallet.multiVault.calculateTripleId(
              tripleData.subjectId, tripleData.predicateId, tripleData.objectId
            );
            ratingTripleIds.push(tripleId);
          }
        }
        if (ratingTripleIds.length > 0) {
          const depositPerRating = wallet.ethers.parseEther("0.001");
          const n = BigInt(ratingTripleIds.length);
          const totalDeposit = depositPerRating * n;
          const fee: bigint = await wallet.proxy.calculateDepositFee(n, totalDeposit);
          const curveIds = ratingTripleIds.map(() => CHAIN_CONFIG.CURVE_ID);
          const assets = ratingTripleIds.map(() => depositPerRating);
          const minShares = ratingTripleIds.map(() => 0n);
          const tx = await wallet.proxy.depositBatch(
            wallet.address, ratingTripleIds, curveIds, assets, minShares,
            { value: totalDeposit + fee }
          );
          await tx.wait();
        }
      }

      // Clear cart and temporary storage
      clearCart();
      localStorage.removeItem(STORAGE_KEYS.VOTES);
      localStorage.removeItem(STORAGE_KEYS.RATINGS_PENDING);
      setPublishedTxHash(lastTxHash);
      setPublishDone(true);
      setPublishStatus("");
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e);
      setFailedStep(publishStatus);
      setRawError(raw);
      setPublishError(formatTxError(e));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div style={page}>
      {/* Header with back button */}
      <div style={pageHeader}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          <Ic.Back s={20} c={C.textPrimary} />
        </button>
        <h1 style={pageTitle}>Cart</h1>
      </div>

      <div style={scrollContent}>

        {/* ── Error card ──────────────────────── */}
        {publishError && !publishing && (
          <div style={errorCard}>
            <div style={errorCardHeader}>
              <span style={errorCardTitle}>Transaction failed</span>
              <button style={dismissBtn} onClick={clearError}>×</button>
            </div>
            {failedStep && (
              <span style={errorStepBadge}>
                Step: {failedStep}
              </span>
            )}
            <div style={errorMessage}>{publishError}</div>
            <button style={rawToggle} onClick={() => setShowRawError((v) => !v)}>
              {showRawError ? "▲ Hide" : "▼ Show"} raw error
            </button>
            {showRawError && (
              <div style={rawErrorBox}>{rawError}</div>
            )}
            <div style={errorActions}>
              {isInsufficientFunds && (
                <button style={sendTrustBtn} onClick={() => navigate("/send")}>
                  Add TRUST
                </button>
              )}
              <button style={retryBtn} onClick={handlePublish}>
                ↺ Retry
              </button>
            </div>
          </div>
        )}

        {isEmpty && (
          <div style={emptyState}>
            <div style={emptyIcon}>🛒</div>
            <p style={emptyTitle}>Cart is empty</p>
            <p>Select interests, sessions, or vote on topics to fill your cart.</p>
            <button style={emptyBackBtn} onClick={() => navigate(-1)}>
              ← Go Back
            </button>
          </div>
        )}

        {/* ── Interests ──────────────────────── */}
        {topicList.length > 0 && (
          <div style={sectionWrap}>
            <div style={sectionHead}>
              <span style={sectionEmoji}>💜</span>
              Interests ({topicList.length})
            </div>
            <p style={{ fontSize: 12, color: C.textSecondary, marginBottom: 12, marginTop: -4 }}>
              Auto-detected from your session selections
            </p>
            <div style={interestWrap}>
              {topicList.map((t) => {
                const ts = getTrackStyle(t);
                return (
                  <span key={t} style={interestPill(ts.color)}>
                    {ts.icon} {t}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Supported Topics ────────────────── */}
        {cartTopics.length > 0 && (
          <div style={sectionWrap}>
            <div style={sectionHead}>
              <span style={sectionEmoji}>🗳️</span>
              Supported Topics ({cartTopics.length})
            </div>
            {cartTopics.map((t) => {
              const cat = categoryMap.get(t.id);
              const emoji = ICON_EMOJI[cat?.icon ?? ""] ?? "📌";
              return (
                <div key={t.id} style={card}>
                  <div style={topicIconBox(cat?.color)}>
                    {emoji}
                  </div>
                  <div style={fluidContent}>
                    <div style={topicTitle}>
                      {t.name}
                    </div>
                    <div style={topicMeta(cat?.color ?? C.textTertiary)}>
                      {cat?.name ?? "Other"} &middot; {t.type}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCart(t.id)}
                    style={deleteBtnCentered}
                  >
                    <Ic.Trash s={12} c={C.error} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Sessions ───────────────────────── */}
        {cartSessions.length > 0 && (
          <div style={sectionWrap}>
            <div style={sectionHead}>
              <span style={sectionEmoji}>📅</span>
              Sessions ({cartSessions.length})
            </div>
            {cartSessions.map((s) => {
              const ts = getTrackStyle(s.track);
              return (
                <div key={s.id} style={card}>
                  <div style={accentBar(ts.color)} />
                  <div style={iconBoxSmall(ts.color)}>
                    {ts.icon}
                  </div>
                  <div style={fluidContent}>
                    <div style={cardTitle}>
                      {s.title}
                    </div>
                    {s.speakers.length > 0 && (
                      <div style={sessionSpeakers}>
                        {s.speakers.map((sp) => sp.name).join(", ")}
                      </div>
                    )}
                    <div style={sessionTrackMeta(ts.color)}>
                      {fmtDate(s.date)} &middot; {s.startTime}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCart(s.id)}
                    style={deleteBtnCentered}
                  >
                    <Ic.Trash s={12} c={C.error} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Ratings ────────────────────────── */}
        {cartRatings.length > 0 && (
          <div style={sectionWrap}>
            <div style={sectionHead}>
              <span style={sectionEmoji}>⭐</span>
              Ratings ({cartRatings.length})
            </div>
            {cartRatings.map(({ session: s, rating: r }) => {
              return (
                <div key={`rate-${s.id}`} style={card}>
                  <div style={accentBar(C.flat)} />
                  <div style={ratingIconBox}>
                    {r}/5
                  </div>
                  <div style={fluidContent}>
                    <div style={cardTitle}>
                      {s.title}
                    </div>
                    <div style={metaText}>
                      Deposit into {r}/5 vault
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const p = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATINGS_PENDING) ?? "{}");
                      delete p[s.id];
                      localStorage.setItem(STORAGE_KEYS.RATINGS_PENDING, JSON.stringify(p));
                      toggleCart(s.id);
                    }}
                    style={deleteBtnCentered}
                  >
                    <Ic.Trash s={12} c={C.error} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Follows ────────────────────────── */}
        {cartFollows.length > 0 && (
          <div style={sectionWrap}>
            <div style={sectionHead}>
              <span style={sectionEmoji}>👤</span>
              Following ({cartFollows.length})
            </div>
            {cartFollows.map((addr) => {
              const short = truncateLabel(addr);
              const initials = getInitials(addr);
              return (
                <div key={`follow-${addr}`} style={card}>
                  <div style={accentBar(C.primary)} />
                  <div style={avatarSmall(avatarColor(addr))}>
                    {initials}
                  </div>
                  <div style={fluidContent}>
                    <div style={monoText}>
                      {short}
                    </div>
                    <div style={metaText}>
                      Follow triple
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      toggleCart(`follow:${addr}`);
                      // Also remove from pending follows in localStorage
                      try {
                        const pending = JSON.parse(localStorage.getItem("ethcc-pending-follows") ?? "[]");
                        const next = pending.filter((f: { label: string }) => f.label.toLowerCase() !== addr.toLowerCase());
                        localStorage.setItem("ethcc-pending-follows", JSON.stringify(next));
                      } catch { /* ignore */ }
                    }}
                    style={deleteBtnCentered}
                  >
                    <Ic.Trash s={12} c={C.error} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Transaction summary ────────────── */}
        {tripleCount > 0 && (() => {
          // Static fallback breakdown using known on-chain constants
          // MultiVault: 0.1 per creation (atom + triple), Proxy: 0.1 fixed/deposit + 5%
          const DEP = Number(DEFAULT_DEPOSIT_PER_TRIPLE) / 1e18; // 0.1 TRUST
          const tripleOps = sessionCount + cartFollows.length;
          const staticMvFees = (1 + tripleOps) * 0.1; // user atom + all triples
          const staticDeposits = (depositCount + tripleOps) * DEP + ratingCount * 0.001;
          const staticDepositOps = depositCount + tripleOps + ratingCount;
          const staticSofiaFees = staticDepositOps * 0.1 + staticDeposits * 0.05;
          const staticTotal = staticMvFees + staticDeposits + staticSofiaFees;

          const fmtBig = (v: bigint) => {
            const n = Number(v) / 1e18;
            return n.toFixed(n < 0.01 ? 4 : 3);
          };
          const fmtNum = (v: number) => v.toFixed(v < 0.01 ? 4 : 3);
          const bd = costBreakdown;

          return (
            <div style={summaryCard}>
              <div style={summaryTitle}>On-Chain Summary</div>

              {topicList.length > 0 && (
                <div style={summaryRow}>
                  <span>Interests</span>
                  <span style={summaryValue(C.textPrimary)}>{topicList.length} × deposit</span>
                </div>
              )}
              {cartTopics.length > 0 && (
                <div style={summaryRow}>
                  <span>Supported topics</span>
                  <span style={summaryValue(C.textPrimary)}>{cartTopics.length} × deposit</span>
                </div>
              )}
              {cartSessions.length > 0 && (
                <div style={summaryRow}>
                  <span>Sessions</span>
                  <span style={summaryValue(C.textPrimary)}>{cartSessions.length} × triple</span>
                </div>
              )}
              {cartRatings.length > 0 && (
                <div style={summaryRow}>
                  <span>Ratings</span>
                  <span style={summaryValue(C.flat)}>{cartRatings.length} × deposit</span>
                </div>
              )}
              {cartFollows.length > 0 && (
                <div style={summaryRow}>
                  <span>Following</span>
                  <span style={summaryValue(C.primary)}>{cartFollows.length} × triple</span>
                </div>
              )}

              {/* Cost breakdown separator */}
              <div style={{ ...summaryRow, paddingTop: 12, paddingBottom: 4, borderBottom: "none" }}>
                <span style={{ fontSize: 11, color: C.textTertiary, textTransform: "uppercase" as const, letterSpacing: 0.8 }}>
                  Cost breakdown
                </span>
                <span style={{ fontSize: 11, color: C.textTertiary }}>
                  via Sofia proxy
                </span>
              </div>

              <div style={summaryRow}>
                <span>MultiVault fees</span>
                <span style={summaryValue(C.textSecondary)}>
                  {bd ? `${fmtBig(bd.mvFees)} TRUST` : `~${fmtNum(staticMvFees)} TRUST`}
                  <span style={{ fontSize: 10, color: C.textTertiary, marginLeft: 4 }}>
                    (0.1 × {1 + tripleOps} ops*)
                  </span>
                </span>
              </div>

              <div style={summaryRow}>
                <span>
                  Your deposits
                  <span style={{ fontSize: 10, color: C.trust, marginLeft: 4 }}>→ vault shares</span>
                </span>
                <span style={summaryValue(C.trust)}>
                  {bd ? `${fmtBig(bd.deposits)} TRUST` : `~${fmtNum(staticDeposits)} TRUST`}
                  <span style={{ fontSize: 10, color: C.textTertiary, marginLeft: 4 }}>
                    (récupérables)
                  </span>
                </span>
              </div>

              <div style={summaryRow}>
                <span>
                  Sofia proxy fees
                  <span style={{ fontSize: 10, color: C.textTertiary, marginLeft: 4 }}>0.1/op + 5%</span>
                </span>
                <span style={summaryValue(C.textSecondary)}>
                  {bd ? `${fmtBig(bd.sofiaFees)} TRUST` : `~${fmtNum(staticSofiaFees)} TRUST`}
                </span>
              </div>

              <div style={summaryRowNoBorder}>
                <span style={{ fontWeight: 700 }}>Total estimé</span>
                <span style={estimatedCost}>
                  {bd ? `${fmtBig(bd.total)} TRUST` : `~${fmtNum(staticTotal)} TRUST`}
                </span>
              </div>

              <div style={{ fontSize: 10, color: C.textTertiary, paddingTop: 6, lineHeight: 1.5 }}>
                * inclut 1 atom wallet (si pas encore créé) · Network: Intuition L3 ({CHAIN_CONFIG.CHAIN_ID})
              </div>
            </div>
          );
        })()}
      </div>

      {tripleCount > 0 && (
        <div style={bottomBar}>
          {publishDone ? (
            <button style={successBtn} onClick={() => navigate("/vote")}>
              Published! View My Votes
            </button>
          ) : !isConnected ? (
            <button onClick={openWalletModal} style={connectBtn}>
              Connect Wallet to Publish
            </button>
          ) : (
            <button onClick={handlePublish} disabled={publishing} style={publishBtn(publishing)}>
              {publishing ? publishStatus || "Publishing..." : "Validate & Publish On-Chain"}
            </button>
          )}
        </div>
      )}

      {/* Success Modal */}
      {publishDone && (
        <PublishSuccessSheet
          interestCount={topicList.length}
          sessionCount={cartSessions.length}
          voteCount={cartTopics.length}
          ratingCount={cartRatings.length}
          followCount={cartFollows.length}
          txHash={publishedTxHash}
          walletAddress={wallet?.address ?? ""}
          userAtomId={userAtomId}
          topics={new Set(topicList)}
          sessionIds={cartSessions.map((s) => s.id)}
          totalCost={costBreakdown ? `${(Number(costBreakdown.total) / 1e18).toFixed(4)} TRUST` : undefined}
          depositsAmount={costBreakdown ? `${(Number(costBreakdown.deposits) / 1e18).toFixed(4)} TRUST` : undefined}
          multiVaultFees={costBreakdown ? `${(Number(costBreakdown.mvFees) / 1e18).toFixed(4)} TRUST` : undefined}
          sofiaFees={costBreakdown ? `${(Number(costBreakdown.sofiaFees) / 1e18).toFixed(4)} TRUST` : undefined}
          onClose={() => setPublishDone(false)}
        />
      )}
    </div>
  );
}
