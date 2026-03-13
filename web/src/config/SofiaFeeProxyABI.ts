/**
 * SofiaFeeProxy ABI — subset used by Treepl
 * Proxy contract for Intuition MultiVault with fee collection + receiver pattern
 */
export const SofiaFeeProxyAbi = [
  // ── Write ──────────────────────────────────────────────────────
  {
    inputs: [
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "bytes[]", name: "data", type: "bytes[]" },
      { internalType: "uint256[]", name: "assets", type: "uint256[]" },
      { internalType: "uint256", name: "curveId", type: "uint256" },
    ],
    name: "createAtoms",
    outputs: [{ internalType: "bytes32[]", name: "atomIds", type: "bytes32[]" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "bytes32[]", name: "subjectIds", type: "bytes32[]" },
      { internalType: "bytes32[]", name: "predicateIds", type: "bytes32[]" },
      { internalType: "bytes32[]", name: "objectIds", type: "bytes32[]" },
      { internalType: "uint256[]", name: "assets", type: "uint256[]" },
      { internalType: "uint256", name: "curveId", type: "uint256" },
    ],
    name: "createTriples",
    outputs: [{ internalType: "bytes32[]", name: "tripleIds", type: "bytes32[]" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "bytes32", name: "termId", type: "bytes32" },
      { internalType: "uint256", name: "curveId", type: "uint256" },
      { internalType: "uint256", name: "minShares", type: "uint256" },
    ],
    name: "deposit",
    outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "bytes32[]", name: "termIds", type: "bytes32[]" },
      { internalType: "uint256[]", name: "curveIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "assets", type: "uint256[]" },
      { internalType: "uint256[]", name: "minShares", type: "uint256[]" },
    ],
    name: "depositBatch",
    outputs: [{ internalType: "uint256[]", name: "shares", type: "uint256[]" }],
    stateMutability: "payable",
    type: "function",
  },

  // ── Fee Calculation ────────────────────────────────────────────
  {
    inputs: [
      { internalType: "uint256", name: "depositCount", type: "uint256" },
      { internalType: "uint256", name: "totalDeposit", type: "uint256" },
    ],
    name: "calculateDepositFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "depositCount", type: "uint256" },
      { internalType: "uint256", name: "totalDeposit", type: "uint256" },
      { internalType: "uint256", name: "multiVaultCost", type: "uint256" },
    ],
    name: "getTotalCreationCost",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "depositAmount", type: "uint256" }],
    name: "getTotalDepositCost",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ── View (passthrough from MultiVault) ─────────────────────────
  {
    inputs: [],
    name: "getAtomCost",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTripleCost",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes", name: "data", type: "bytes" }],
    name: "calculateAtomId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "id", type: "bytes32" }],
    name: "isTermCreated",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },

  // ── Fee State ──────────────────────────────────────────────────
  {
    inputs: [],
    name: "creationFixedFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "depositFixedFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "depositPercentageFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Minimal MultiVault ABI — only the approve function needed for proxy setup
 */
export const MultiVaultApproveAbi = [
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "uint8", name: "approvalType", type: "uint8" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
