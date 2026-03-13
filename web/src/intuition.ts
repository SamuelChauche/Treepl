import graphData from "../../bdd/intuition_graph.json";

const CHAIN_ID = 1155;
const CHAIN_ID_HEX = "0x" + CHAIN_ID.toString(16);
const MULTIVAULT = "0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e";
const RPC_URL = "https://rpc.intuition.systems/http";

// Predicate atom IDs
const PREDICATES = graphData.predicates as Record<string, string>;

// Track name → atom ID
const TRACK_ATOM_IDS = graphData.trackAtomIds as Record<string, string>;

// Session ID (from sessions.json) → atom ID on Intuition
const SESSION_ATOM_IDS = graphData.sessionIdToAtomId as Record<string, string>;

// ABI fragments we need
const ABI = [
  "function getTripleCost() view returns (uint256)",
  "function getAtomCost() view returns (uint256)",
  "function createTriples(bytes32[] subjectIds, bytes32[] predicateIds, bytes32[] objectIds, uint256[] assets) payable returns (bytes32[])",
  "function createAtoms(bytes[] atomDatas, uint256[] assets) payable returns (bytes32[])",
  "function calculateAtomId(bytes data) pure returns (bytes32)",
  "function isTermCreated(bytes32 id) view returns (bool)",
];

export interface IntuitionTriple {
  subjectId: string;
  predicateId: string;
  objectId: string;
  label: string; // human-readable description
}

/**
 * Build the list of triples to create for a user's profile.
 *
 * Given the user's wallet atom ID, selected topics (track names),
 * and selected session IDs, returns:
 * - (user) are interested by (track) — for each topic
 * - (user) attending (session) — for each session
 */
export function buildProfileTriples(
  userAtomId: string,
  topics: string[],
  sessionIds: string[]
): IntuitionTriple[] {
  const triples: IntuitionTriple[] = [];

  // "are interested by" triples
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

  // "attending" triples
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

/**
 * Connect wallet, switch to Intuition chain, return ethers signer + contract.
 */
export async function connectWallet() {
  const { ethers } = await import("ethers");

  if (!window.ethereum) {
    throw new Error("No wallet found. Please install a Web3 wallet.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  provider.pollingInterval = 30000;
  await provider.send("eth_requestAccounts", []);

  // Add chain first, then switch
  try {
    await provider.send("wallet_addEthereumChain", [
      {
        chainId: CHAIN_ID_HEX,
        chainName: "Intuition",
        rpcUrls: [RPC_URL],
        nativeCurrency: { name: "TRUST", symbol: "TRUST", decimals: 18 },
      },
    ]);
  } catch {
    // Some wallets reject addEthereumChain if chain already exists, try switch
    await provider.send("wallet_switchEthereumChain", [
      { chainId: CHAIN_ID_HEX },
    ]);
  }

  // Re-init after chain switch
  const freshProvider = new ethers.BrowserProvider(window.ethereum);
  freshProvider.pollingInterval = 30000;
  const signer = await freshProvider.getSigner();
  const contract = new ethers.Contract(MULTIVAULT, ABI, signer);
  const address = await signer.getAddress();

  return { provider: freshProvider, signer, contract, address, ethers };
}

/**
 * Ensure the user's wallet has an atom on Intuition.
 * If it doesn't exist, create it.
 * Returns the atom ID (bytes32).
 */
export async function ensureUserAtom(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  address: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ethersLib: any
): Promise<string> {
  const hexData = ethersLib.hexlify(ethersLib.toUtf8Bytes(address.toLowerCase()));
  const atomId = await contract.calculateAtomId(hexData);
  const exists = await contract.isTermCreated(atomId);

  if (!exists) {
    const atomCost = await contract.getAtomCost();
    const tx = await contract.createAtoms([hexData], [atomCost], {
      value: atomCost,
    });
    await tx.wait();
  }

  return atomId;
}

/**
 * Create all profile triples in a single transaction.
 */
export async function createProfileTriples(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  triples: IntuitionTriple[]
): Promise<{ hash: string; blockNumber: number }> {
  const tripleCost = await contract.getTripleCost();
  const subjectIds = triples.map((t) => t.subjectId);
  const predicateIds = triples.map((t) => t.predicateId);
  const objectIds = triples.map((t) => t.objectId);
  const assets = triples.map(() => tripleCost);
  const totalCost = tripleCost * BigInt(triples.length);

  const tx = await contract.createTriples(
    subjectIds,
    predicateIds,
    objectIds,
    assets,
    { value: totalCost }
  );
  const receipt = await tx.wait();
  return { hash: tx.hash, blockNumber: receipt.blockNumber };
}

/**
 * Add the Intuition chain to the user's wallet (standalone, no full connect needed).
 */
export async function addIntuitionChain() {
  if (!window.ethereum) {
    throw new Error("No wallet found. Please install a Web3 wallet.");
  }
  const { ethers } = await import("ethers");
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("wallet_addEthereumChain", [
    {
      chainId: CHAIN_ID_HEX,
      chainName: "Intuition",
      rpcUrls: [RPC_URL],
      nativeCurrency: { name: "TRUST", symbol: "TRUST", decimals: 18 },
    },
  ]);
}

export { TRACK_ATOM_IDS, SESSION_ATOM_IDS, PREDICATES, CHAIN_ID, MULTIVAULT };
