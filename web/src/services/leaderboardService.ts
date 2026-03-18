const EXPLORER_API = "https://explorer.intuition.systems/api/v2";

export interface LeaderboardEntry {
  address: string;
  label: string;
  totalSent: number; // in TRUST (float)
  txCount: number;
  rank: number;
}

interface BlockscoutTx {
  from: { hash: string };
  to: { hash: string } | null;
  value: string;
  hash: string;
  timestamp: string;
  tx_types: string[];
}

/**
 * Fetch native $TRUST transfers for a set of addresses and build a leaderboard
 * ranked by total TRUST sent to other users (not contracts).
 */
export async function fetchLeaderboard(
  addresses: string[],
  labels?: Record<string, string>
): Promise<LeaderboardEntry[]> {
  const sendTotals: Record<string, { total: number; count: number }> = {};

  for (const addr of addresses) {
    try {
      const url = `${EXPLORER_API}/addresses/${addr}/transactions?filter=from&type=coin_transfer`;
      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      const txs: BlockscoutTx[] = data.items ?? data;

      let total = 0;
      let count = 0;

      for (const tx of txs) {
        if (!tx.to) continue;
        // Only count transfers to other users (not to contracts like MultiVault/Proxy)
        if (tx.from.hash.toLowerCase() !== addr.toLowerCase()) continue;
        const value = parseFloat(tx.value) / 1e18;
        if (value > 0) {
          total += value;
          count++;
        }
      }

      sendTotals[addr] = { total, count };
    } catch {
      // Skip failed fetches
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 300));
  }

  // Build sorted leaderboard
  const entries: LeaderboardEntry[] = Object.entries(sendTotals)
    .filter(([, v]) => v.total > 0)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([addr, v], i) => ({
      address: addr,
      label: labels?.[addr.toLowerCase()] ?? `${addr.slice(0, 6)}...${addr.slice(-4)}`,
      totalSent: v.total,
      txCount: v.count,
      rank: i + 1,
    }));

  return entries;
}

/**
 * Fetch transfer history for a single address (sent + received).
 */
export async function fetchTransferHistory(address: string): Promise<{
  sent: { to: string; amount: number; hash: string; timestamp: string }[];
  received: { from: string; amount: number; hash: string; timestamp: string }[];
}> {
  const sent: { to: string; amount: number; hash: string; timestamp: string }[] = [];
  const received: { from: string; amount: number; hash: string; timestamp: string }[] = [];

  try {
    const url = `${EXPLORER_API}/addresses/${address}/transactions?type=coin_transfer`;
    const res = await fetch(url);
    if (!res.ok) return { sent, received };

    const data = await res.json();
    const txs: BlockscoutTx[] = data.items ?? data;

    for (const tx of txs) {
      if (!tx.to) continue;
      const value = parseFloat(tx.value) / 1e18;
      if (value <= 0) continue;

      if (tx.from.hash.toLowerCase() === address.toLowerCase()) {
        sent.push({ to: tx.to.hash, amount: value, hash: tx.hash, timestamp: tx.timestamp });
      } else if (tx.to.hash.toLowerCase() === address.toLowerCase()) {
        received.push({ from: tx.from.hash, amount: value, hash: tx.hash, timestamp: tx.timestamp });
      }
    }
  } catch {
    // ignore
  }

  return { sent, received };
}
