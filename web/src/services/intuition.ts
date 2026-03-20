import graphData from "../../../bdd/intuition_graph.json";
import { CHAIN_CONFIG, DEFAULT_DEPOSIT_PER_TRIPLE } from "../config/constants";
import { SofiaFeeProxyAbi } from "../config/SofiaFeeProxyABI";
import { modal } from "@reown/appkit/react";

// ─── On-chain data mappings ──────────────────────────────────────
const PREDICATES = graphData.predicates as Record<string, string>;
const TRACK_ATOM_IDS = graphData.trackAtomIds as Record<string, string>;
const SESSION_ATOM_IDS = graphData.sessionIdToAtomId as Record<string, string>;

// ─── Types ───────────────────────────────────────────────────────
interface IntuitionTriple {
  subjectId: string;
  predicateId: string;
  objectId: string;
  label: string;
}

// MultiVault ABI — reads + approve + redeem
const MULTIVAULT_ABI = [
  "function getTripleCost() view returns (uint256)",
  "function getAtomCost() view returns (uint256)",
  "function calculateAtomId(bytes data) pure returns (bytes32)",
  "function isTermCreated(bytes32 id) view returns (bool)",
  "function approve(address sender, uint8 approvalType)",
  "function redeem(address receiver, bytes32 termId, uint256 curveId, uint256 shares, uint256 minAssets) returns (uint256)",
  "function previewRedeem(bytes32 termId, uint256 curveId, uint256 shares) view returns (uint256 assetsAfterFees, uint256 sharesUsed)",
  "function maxRedeem(address account, bytes32 termId, uint256 curveId) view returns (uint256)",
  "function currentSharePrice(bytes32 id, uint256 curveId) view returns (uint256)",
];

export interface WalletConnection {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signer: any;
  /** Proxy contract — writes only (createAtoms, createTriples, deposit, fee calc) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proxy: any;
  /** MultiVault contract — reads + approve */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  multiVault: any;
  address: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ethers: any;
}

// ─── Connect wallet ──────────────────────────────────────────────

export async function connectWallet(): Promise<WalletConnection> {
  const { ethers } = await import("ethers");

  // Try direct window.ethereum first (MetaMask injected, or inside MetaMask browser)
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    provider.pollingInterval = 30000;

    try {
      await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
    } catch {
      await provider.send("eth_requestAccounts", []);
    }

    // Add / switch to Intuition chain
    try {
      await provider.send("wallet_addEthereumChain", [
        {
          chainId: CHAIN_CONFIG.CHAIN_ID_HEX,
          chainName: CHAIN_CONFIG.CHAIN_NAME,
          rpcUrls: [CHAIN_CONFIG.RPC_URL],
          nativeCurrency: CHAIN_CONFIG.NATIVE_CURRENCY,
        },
      ]);
    } catch {
      await provider.send("wallet_switchEthereumChain", [
        { chainId: CHAIN_CONFIG.CHAIN_ID_HEX },
      ]);
    }

    const freshProvider = new ethers.BrowserProvider(window.ethereum);
    freshProvider.pollingInterval = 30000;
    const signer = await freshProvider.getSigner();
    const address = await signer.getAddress();

    localStorage.setItem("ethcc-wallet-address", address);

    return buildWalletConnection(ethers, freshProvider, signer, address);
  }

  // No injected wallet
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // Redirect into MetaMask's in-app browser where window.ethereum is available
    const dappUrl = window.location.href.replace(/^https?:\/\//, "");
    window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
    throw new Error("REDIRECT_METAMASK");
  }

  // Try embedded wallet
  const { hasEmbeddedWallet, connectEmbeddedWallet } = await import("./embeddedWallet");
  if (hasEmbeddedWallet()) {
    const password = prompt("Enter your embedded wallet password:");
    if (password) {
      return await connectEmbeddedWallet(password);
    }
  }

  // Desktop — open AppKit modal (WalletConnect QR, Coinbase, etc.)
  if (modal) {
    modal.open();
  }
  throw new Error("NO_WALLET");
}

function buildWalletConnection(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ethers: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signer: any,
  address: string
): WalletConnection {

  // Proxy for writes (createAtoms, createTriples, deposit) + fee calc
  const proxy = new ethers.Contract(
    CHAIN_CONFIG.SOFIA_PROXY,
    SofiaFeeProxyAbi,
    signer
  );

  // MultiVault for reads (getTripleCost, calculateAtomId, etc.) + approve
  const multiVault = new ethers.Contract(
    CHAIN_CONFIG.MULTIVAULT,
    MULTIVAULT_ABI,
    signer
  );

  return { provider, signer, proxy, multiVault, address, ethers };
}

// ─── Proxy approval ──────────────────────────────────────────────

/**
 * Approve the proxy as a spender on MultiVault (one-time per wallet).
 * Must be called before any proxy write operation.
 */
export async function approveProxy(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  multiVault: any
): Promise<void> {
  const tx = await multiVault.approve(
    CHAIN_CONFIG.SOFIA_PROXY,
    CHAIN_CONFIG.APPROVAL_TYPE_DEPOSIT
  );
  await tx.wait();
}

// ─── Get user atom ID ────────────────────────────────────────────

/**
 * Calculate the deterministic atom ID for a wallet address.
 * Does NOT create the atom — it must already exist on-chain.
 */
async function getUserAtomId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  multiVault: any,
  address: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ethersLib: any
): Promise<string> {
  const hexData = ethersLib.hexlify(
    ethersLib.toUtf8Bytes(address.toLowerCase())
  );
  return await multiVault.calculateAtomId(hexData);
}

// ─── Ensure user atom exists on-chain ─────────────────────────────

/**
 * Check if the user's wallet atom exists on-chain.
 * If not, create it via the proxy's createAtoms function.
 * Returns the user's atom ID.
 */
export async function ensureUserAtom(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  multiVault: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proxy: any,
  address: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ethersLib: any
): Promise<string> {
  const userAtomId = await getUserAtomId(multiVault, address, ethersLib);
  const exists = await multiVault.isTermCreated(userAtomId);

  if (!exists) {
    const atomData = ethersLib.hexlify(
      ethersLib.toUtf8Bytes(address.toLowerCase())
    );
    const atomCost = await multiVault.getAtomCost();
    // getTotalCreationCost(depositCount=1, totalDeposit=0, multiVaultCost=atomCost)
    const totalCost = await proxy.getTotalCreationCost(
      1n,
      0n,
      atomCost
    );

    const tx = await proxy.createAtoms(
      address,
      [atomData],
      [0n],
      CHAIN_CONFIG.CURVE_ID,
      { value: totalCost }
    );
    await tx.wait();
  }

  return userAtomId;
}

// ─── Build profile triples ───────────────────────────────────────

export function buildProfileTriples(
  userAtomId: string,
  topics: string[],
  sessionIds: string[]
): IntuitionTriple[] {
  const triples: IntuitionTriple[] = [];

  for (const topic of topics) {
    const trackAtomId = TRACK_ATOM_IDS[topic];
    if (!trackAtomId) continue;
    triples.push({
      subjectId: userAtomId,
      predicateId: PREDICATES["are interested by"],
      objectId: trackAtomId,
      label: `You are interested by ${topic}`,
    });
  }

  for (const sessionId of sessionIds) {
    const sessionAtomId = SESSION_ATOM_IDS[sessionId];
    if (!sessionAtomId) continue;
    triples.push({
      subjectId: userAtomId,
      predicateId: PREDICATES["attending"],
      objectId: sessionAtomId,
      label: `You attending session`,
    });
  }

  return triples;
}

// ─── Create profile triples via proxy with deposit ───────────────

/**
 * Create all profile triples in a single batch transaction via the proxy.
 * Each triple gets a deposit of `depositPerTriple` into its vault.
 */
export async function createProfileTriples(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  multiVault: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proxy: any,
  address: string,
  triples: IntuitionTriple[],
  depositPerTriple?: bigint
): Promise<{ hash: string; blockNumber: number }> {
  const tripleCost = await multiVault.getTripleCost();

  const deposit = depositPerTriple ?? BigInt(DEFAULT_DEPOSIT_PER_TRIPLE);

  const subjectIds = triples.map((t) => t.subjectId);
  const predicateIds = triples.map((t) => t.predicateId);
  const objectIds = triples.map((t) => t.objectId);
  // assets[i] = deposit only — proxy adds tripleCost internally before forwarding to MultiVault
  const assets = triples.map(() => deposit);

  // Calculate costs for getTotalCreationCost
  const n = BigInt(triples.length);
  const totalDeposit = deposit * n;
  const multiVaultCost = (tripleCost * n) + totalDeposit;
  const totalCost = await proxy.getTotalCreationCost(
    n,              // depositCount
    totalDeposit,   // totalDeposit (just deposits, not including tripleCost)
    multiVaultCost  // multiVaultCost (tripleCost * count + totalDeposit)
  );

  // Verify all atoms exist on-chain before calling createTriples
  const allIds = [...new Set([...subjectIds, ...predicateIds, ...objectIds])];
  for (const id of allIds) {
    const exists = await multiVault.isTermCreated(id);
    if (!exists) {
      throw new Error(`Atom ${id} does not exist on-chain. Cannot create triple.`);
    }
  }

  const tx = await proxy.createTriples(
    address,       // receiver
    subjectIds,
    predicateIds,
    objectIds,
    assets,
    CHAIN_CONFIG.CURVE_ID,
    { value: totalCost }
  );
  const receipt = await tx.wait();
  return { hash: tx.hash, blockNumber: receipt.blockNumber };
}

// ─── Deposit on atoms (position-based, no triple creation) ───────

/**
 * Deposit $TRUST into atom vaults in batch.
 * Each atom gets `depositPerAtom` deposited into its vault.
 * The user receives shares proportional to their deposit.
 * Used for interests (tracks) and votes (topics) — no triple created.
 */
export async function depositOnAtoms(
  wallet: WalletConnection,
  atomIds: string[],
  depositPerAtom?: bigint,
  onStep?: (step: string) => void
): Promise<{ hash: string; blockNumber: number }> {
  if (atomIds.length === 0) throw new Error("No atoms to deposit on.");

  const deposit = depositPerAtom ?? BigInt(DEFAULT_DEPOSIT_PER_TRIPLE);
  const n = BigInt(atomIds.length);
  const totalDeposit = deposit * n;

  // Approve proxy on MultiVault (required before any proxy operation)
  onStep?.("Approving proxy...");
  try {
    await approveProxy(wallet.multiVault);
  } catch { /* already approved */ }

  // Calculate fee: depositCount * fixedFee + percentageFee on totalDeposit
  const fee: bigint = await wallet.proxy.calculateDepositFee(n, totalDeposit);
  const totalCost = totalDeposit + fee;

  onStep?.(`Depositing on ${atomIds.length} atom${atomIds.length > 1 ? "s" : ""}...`);

  const termIds = atomIds;
  const curveIds = atomIds.map(() => CHAIN_CONFIG.CURVE_ID);
  const assets = atomIds.map(() => deposit);
  const minShares = atomIds.map(() => 0n);

  const tx = await wallet.proxy.depositBatch(
    wallet.address,
    termIds,
    curveIds,
    assets,
    minShares,
    { value: totalCost }
  );

  onStep?.("Waiting for confirmation...");
  const receipt = await tx.wait();
  return { hash: tx.hash, blockNumber: receipt.blockNumber };
}

// ─── Fee estimation (for UI) ─────────────────────────────────────

export interface FeeEstimate {
  tripleCost: bigint;
  depositPerTriple: bigint;
  sofiaFee: bigint;
  totalCost: bigint;
}

/**
 * Estimate the total cost for creating N triples with deposit.
 * Useful for displaying cost breakdown in the UI before signing.
 */
export async function estimateFees(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  multiVault: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proxy: any,
  tripleCount: number,
  depositPerTriple?: bigint
): Promise<FeeEstimate> {
  const tripleCost = await multiVault.getTripleCost();
  const deposit = depositPerTriple ?? BigInt(DEFAULT_DEPOSIT_PER_TRIPLE);
  const perTripleValue = tripleCost + deposit;
  const n = BigInt(tripleCount);
  const totalDeposit = deposit * n;
  const totalMultiVaultCost = perTripleValue * n;

  const totalCost: bigint = await proxy.getTotalCreationCost(
    n,
    totalDeposit,
    totalMultiVaultCost
  );

  const sofiaFee = totalCost - totalMultiVaultCost;

  return { tripleCost, depositPerTriple: deposit, sofiaFee, totalCost };
}

// ─── Add chain (standalone) ──────────────────────────────────────

export async function addIntuitionChain() {
  if (!window.ethereum) {
    throw new Error("No wallet found. Please install a Web3 wallet.");
  }
  const { ethers } = await import("ethers");
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("wallet_addEthereumChain", [
    {
      chainId: CHAIN_CONFIG.CHAIN_ID_HEX,
      chainName: CHAIN_CONFIG.CHAIN_NAME,
      rpcUrls: [CHAIN_CONFIG.RPC_URL],
      nativeCurrency: CHAIN_CONFIG.NATIVE_CURRENCY,
    },
  ]);
}

// ─── Re-exports ──────────────────────────────────────────────────
export {
  TRACK_ATOM_IDS,
  SESSION_ATOM_IDS,
  PREDICATES,
};
