import topicGraph from "../../../bdd/web3_topics_graph.json";
import { DEFAULT_DEPOSIT_PER_TRIPLE, GQL_URL } from "../config/constants";
import { GraphQLClient, GET_USER_VOTED_POSITIONS, type GetUserVotedPositionsQuery } from "@ethcc/graphql";
import type { WalletConnection } from "./intuition";
import { approveProxy, depositOnAtoms } from "./intuition";

const TOPIC_ATOM_IDS = topicGraph.topicAtomIds as Record<string, string>;

// Reverse lookup: atom term_id → topic id
const ATOM_TO_TOPIC = new Map(
  Object.entries(TOPIC_ATOM_IDS).map(([k, v]) => [v, k])
);

// ─── Types ───────────────────────────────────────────────────────

export interface VoteResult {
  hash: string;
  blockNumber: number;
  topicCount: number;
}

// ─── Resolve topic IDs to atom IDs ───────────────────────────────

export function getTopicAtomId(topicId: string): string | null {
  return TOPIC_ATOM_IDS[topicId] ?? null;
}

export function resolveTopicAtomIds(topicIds: string[]): {
  resolved: { topicId: string; atomId: string }[];
  missing: string[];
} {
  const resolved: { topicId: string; atomId: string }[] = [];
  const missing: string[] = [];
  for (const id of topicIds) {
    const atomId = TOPIC_ATOM_IDS[id];
    if (atomId) resolved.push({ topicId: id, atomId });
    else missing.push(id);
  }
  return { resolved, missing };
}

// ─── Fetch user's on-chain positions for app topics ─────────────

/**
 * Query GraphQL for all topic atoms where the user has a position with shares > 0.
 * Returns a Set of topic IDs (app-level) that the user has voted on.
 */
export async function fetchUserVotedTopics(address: string): Promise<Set<string>> {
  const client = new GraphQLClient({ endpoint: GQL_URL });
  const allAtomIds = Object.values(TOPIC_ATOM_IDS);
  const voted = new Set<string>();

  // Batch query (50 at a time to avoid timeouts)
  for (let i = 0; i < allAtomIds.length; i += 50) {
    const batch = allAtomIds.slice(i, i + 50);
    try {
      const data = await client.request<GetUserVotedPositionsQuery>(
        GET_USER_VOTED_POSITIONS,
        { address: address.toLowerCase(), termIds: batch }
      );
      for (const pos of data.positions ?? []) {
        const topicId = ATOM_TO_TOPIC.get(pos.term_id);
        if (topicId) voted.add(topicId);
      }
    } catch { /* GraphQL failed — skip batch */ }
  }

  return voted;
}

// ─── Submit votes on-chain (deposit into atom vaults) ────────────

/**
 * Deposit into topic atom vaults to signal support.
 * No triples created — users are identified by their vault positions.
 * 1. Approves proxy (if needed)
 * 2. Batch deposits into all selected topic atom vaults
 */
export async function submitVotes(
  wallet: WalletConnection,
  topicIds: string[],
  depositPerAtom?: bigint,
  onStep?: (step: string) => void
): Promise<VoteResult> {
  const { resolved, missing } = resolveTopicAtomIds(topicIds);

  if (resolved.length === 0) {
    throw new Error(
      `No valid topics to vote on.${missing.length > 0 ? ` Missing: ${missing.join(", ")}` : ""}`
    );
  }

  // Step 1: Approve proxy
  onStep?.("Approving proxy contract...");
  try {
    await approveProxy(wallet.multiVault, wallet);
  } catch {
    // Already approved — ignore
  }

  // Step 2: Deposit into atom vaults
  const atomIds = resolved.map((r) => r.atomId);
  const deposit = depositPerAtom ?? BigInt(DEFAULT_DEPOSIT_PER_TRIPLE);

  const result = await depositOnAtoms(wallet, atomIds, deposit, onStep);

  return {
    hash: result.hash,
    blockNumber: result.blockNumber,
    topicCount: resolved.length,
  };
}
