import { GQL_URL } from "../config/constants";
import { CHAIN_CONFIG } from "../config/constants";
import topicGraph from "../../../bdd/web3_topics_graph.json";
import type { WalletConnection } from "./intuition";

const TOPIC_ATOM_IDS = topicGraph.topicAtomIds as Record<string, string>;
const SUPPORTS_PREDICATE = topicGraph.predicates.supports;
const I_ATOM = (topicGraph as Record<string, unknown>).subjectAtoms
  ? ((topicGraph as Record<string, unknown>).subjectAtoms as Record<string, string>).I
  : "0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b";

// Reverse map: atomId → topicId
const ATOM_TO_TOPIC = new Map(
  Object.entries(TOPIC_ATOM_IDS).map(([k, v]) => [v, k])
);

// ─── Types ───────────────────────────────────────────

export interface UserPosition {
  tripleId: string;
  topicId: string;
  topicLabel: string;
  /** "for" = support vault, "against" = oppose vault */
  side: "for" | "against";
  shares: string;
  /** Current value of shares in wei */
  currentValue: string;
  /** What was deposited (if available from events) */
  deposited: string;
  /** P&L in wei */
  pnl: string;
  /** P&L percentage */
  pnlPercent: number;
}

export interface PortfolioSummary {
  positions: UserPosition[];
  totalValue: string;
  totalDeposited: string;
  totalPnl: string;
  totalPnlPercent: number;
}

// ─── Fetch user positions via GraphQL ────────────────

export async function fetchUserPositions(
  userAddress: string
): Promise<UserPosition[]> {
  const addr = userAddress.toLowerCase();
  const topicAtomIds = Object.values(TOPIC_ATOM_IDS).map((id) => `"${id}"`).join(",");

  // Query triples where user has positions:
  // 1) "I → supports → Topic" triples (shared model)
  // 2) "UserAtom → supports → Topic" triples (legacy per-user model)
  // We query ALL supports triples for our topics and filter by user positions.
  const query = `{
    triples(
      where: {
        predicate: { term_id: { _eq: "${SUPPORTS_PREDICATE}" } }
        object: { term_id: { _in: [${topicAtomIds}] } }
        _or: [
          { subject: { term_id: { _eq: "${I_ATOM}" } } }
          { subject: { label: { _ilike: "${addr}" } } }
        ]
      }
    ) {
      term_id
      subject { term_id label }
      object { term_id label }
      positions(where: { account: { id: { _ilike: "${addr}" } } }) {
        shares
      }
      counter_positions(where: { account: { id: { _ilike: "${addr}" } } }) {
        shares
      }
    }
  }`;

  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  console.log("[Portfolio] Triples result:", json);
  const triples = json.data?.triples ?? [];

  const positions: UserPosition[] = [];

  for (const t of triples) {
    const objectAtomId = t.object?.term_id ?? "";
    const topicId = ATOM_TO_TOPIC.get(objectAtomId) ?? objectAtomId;
    const topicLabel = t.object?.label ?? topicId;

    const forShares = t.positions?.[0]?.shares ?? "0";
    if (forShares !== "0") {
      positions.push({
        tripleId: t.term_id,
        topicId,
        topicLabel,
        side: "for",
        shares: forShares,
        currentValue: "0",
        deposited: "0",
        pnl: "0",
        pnlPercent: 0,
      });
    }

    const againstShares = t.counter_positions?.[0]?.shares ?? "0";
    if (againstShares !== "0") {
      positions.push({
        tripleId: t.term_id,
        topicId,
        topicLabel,
        side: "against",
        shares: againstShares,
        currentValue: "0",
        deposited: "0",
        pnl: "0",
        pnlPercent: 0,
      });
    }
  }

  return positions;
}

// ─── Fetch full portfolio with PnL via previewRedeem ─

export async function fetchPortfolio(
  userAddress: string,
  wallet?: WalletConnection | null
): Promise<PortfolioSummary> {
  const positions = await fetchUserPositions(userAddress);

  let totalValue = 0n;
  let totalDeposited = 0n;

  for (const p of positions) {
    const shares = BigInt(p.shares);

    // Use previewRedeem on-chain to get actual redeemable value
    if (wallet?.multiVault && shares > 0n) {
      try {
        const [assetsAfterFees] = await wallet.multiVault.previewRedeem(
          p.tripleId,
          CHAIN_CONFIG.CURVE_ID,
          shares
        );
        p.currentValue = assetsAfterFees.toString();
      } catch {
        // Fallback: approximate value ≈ shares
        p.currentValue = shares.toString();
      }
    } else {
      p.currentValue = shares.toString();
    }

    const currentVal = BigInt(p.currentValue);
    totalValue += currentVal;

    // Deposited ≈ shares (no deposit history available from GraphQL)
    p.deposited = shares.toString();
    totalDeposited += shares;

    const pnl = currentVal - shares;
    p.pnl = pnl.toString();
    p.pnlPercent = shares > 0n ? Number((pnl * 10000n) / shares) / 100 : 0;
  }

  const totalPnl = totalValue - totalDeposited;

  return {
    positions,
    totalValue: totalValue.toString(),
    totalDeposited: totalDeposited.toString(),
    totalPnl: totalPnl.toString(),
    totalPnlPercent: totalDeposited > 0n ? Number((totalPnl * 10000n) / totalDeposited) / 100 : 0,
  };
}

// ─── Redeem (withdraw) from a vault ──────────────────

export async function redeemPosition(
  wallet: WalletConnection,
  tripleId: string,
  shares: bigint,
  onStep?: (step: string) => void
): Promise<{ hash: string; assetsReceived: string }> {
  onStep?.("Previewing redemption...");

  // Preview to get expected assets
  const [expectedAssets] = await wallet.multiVault.previewRedeem(
    tripleId,
    CHAIN_CONFIG.CURVE_ID,
    shares
  );

  // 5% slippage tolerance
  const minAssets = (expectedAssets * 95n) / 100n;

  onStep?.("Submitting withdrawal...");

  // redeem(receiver, termId, curveId, shares, minAssets)
  const tx = await wallet.multiVault.redeem(
    wallet.address,
    tripleId,
    CHAIN_CONFIG.CURVE_ID,
    shares,
    minAssets
  );

  onStep?.("Waiting for confirmation...");
  await tx.wait();

  return {
    hash: tx.hash,
    assetsReceived: expectedAssets.toString(),
  };
}
