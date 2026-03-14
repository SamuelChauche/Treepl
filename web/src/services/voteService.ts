import topicGraph from "../../../bdd/web3_topics_graph.json";
import { CHAIN_CONFIG, DEFAULT_DEPOSIT_PER_TRIPLE } from "../config/constants";
import type { WalletConnection } from "./intuition";
import { ensureUserAtom, approveProxy } from "./intuition";

const TOPIC_ATOM_IDS = topicGraph.topicAtomIds as Record<string, string>;
const SUPPORTS_PREDICATE = topicGraph.predicates.supports;

// ─── Types ───────────────────────────────────────────────────────

export interface VoteResult {
  hash: string;
  blockNumber: number;
  tripleCount: number;
}

export interface VoteCostEstimate {
  tripleCost: bigint;
  depositPerTriple: bigint;
  sofiaFee: bigint;
  totalCost: bigint;
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

// ─── Estimate vote cost ──────────────────────────────────────────

export async function estimateVoteCost(
  wallet: WalletConnection,
  topicCount: number,
  depositPerTriple?: bigint
): Promise<VoteCostEstimate> {
  const tripleCost = await wallet.multiVault.getTripleCost();
  const deposit = depositPerTriple ?? BigInt(DEFAULT_DEPOSIT_PER_TRIPLE);
  const n = BigInt(topicCount);
  const totalDeposit = deposit * n;
  const multiVaultCost = (tripleCost + deposit) * n;

  const totalCost: bigint = await wallet.proxy.getTotalCreationCost(
    n,
    totalDeposit,
    multiVaultCost
  );

  const sofiaFee = totalCost - multiVaultCost;

  return { tripleCost, depositPerTriple: deposit, sofiaFee, totalCost, topicCount };
}

// ─── Submit votes on-chain ───────────────────────────────────────

/**
 * Create vote triples: User → supports → Topic for each selected topic.
 * 1. Ensures user atom exists
 * 2. Approves proxy (if needed)
 * 3. Creates all triples in a single batch tx
 */
export async function submitVotes(
  wallet: WalletConnection,
  topicIds: string[],
  depositPerTriple?: bigint,
  onStep?: (step: string) => void
): Promise<VoteResult> {
  const { resolved, missing } = resolveTopicAtomIds(topicIds);

  if (resolved.length === 0) {
    throw new Error(
      `No valid topics to vote on.${missing.length > 0 ? ` Missing: ${missing.join(", ")}` : ""}`
    );
  }

  // Step 1: Ensure user atom
  onStep?.("Creating your on-chain identity...");
  const userAtomId = await ensureUserAtom(
    wallet.multiVault,
    wallet.proxy,
    wallet.address,
    wallet.ethers
  );

  // Step 2: Approve proxy
  onStep?.("Approving proxy contract...");
  try {
    await approveProxy(wallet.multiVault);
  } catch {
    // Already approved — ignore
  }

  // Step 3: Build triple arrays
  const subjectIds = resolved.map(() => userAtomId);
  const predicateIds = resolved.map(() => SUPPORTS_PREDICATE);
  const objectIds = resolved.map((r) => r.atomId);

  const deposit = depositPerTriple ?? BigInt(DEFAULT_DEPOSIT_PER_TRIPLE);
  const assets = resolved.map(() => deposit);

  // Step 4: Calculate cost
  onStep?.("Calculating costs...");
  const tripleCost = await wallet.multiVault.getTripleCost();
  const n = BigInt(resolved.length);
  const totalDeposit = deposit * n;
  const multiVaultCost = (tripleCost + deposit) * n;
  const totalCost = await wallet.proxy.getTotalCreationCost(
    n,
    totalDeposit,
    multiVaultCost
  );

  // Step 5: Send batch tx
  onStep?.(`Submitting ${resolved.length} vote${resolved.length > 1 ? "s" : ""} on-chain...`);
  const tx = await wallet.proxy.createTriples(
    wallet.address,
    subjectIds,
    predicateIds,
    objectIds,
    assets,
    CHAIN_CONFIG.CURVE_ID,
    { value: totalCost }
  );

  onStep?.("Waiting for confirmation...");
  const receipt = await tx.wait();

  return {
    hash: tx.hash,
    blockNumber: receipt.blockNumber,
    tripleCount: resolved.length,
  };
}
