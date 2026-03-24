/**
 * Map raw ethers.js / RPC error messages to user-friendly strings.
 * Call formatTxError(e) in any catch block that shows errors to users.
 */

const PATTERNS: [RegExp, string][] = [
  [/INSUFFICIENT_FUNDS|insufficient funds/i, "Not enough TRUST to complete this transaction. Send more TRUST to your wallet."],
  [/ACTION_REJECTED|user rejected|user denied/i, "Transaction cancelled — you rejected it in your wallet."],
  [/UNPREDICTABLE_GAS_LIMIT|cannot estimate gas/i, "Transaction would fail on-chain. Check your balance or try again."],
  [/CALL_EXCEPTION|execution reverted/i, "Smart contract call failed. The operation may not be allowed."],
  [/NONCE_EXPIRED|nonce.*too low/i, "Transaction conflict — a previous transaction is still pending. Wait and retry."],
  [/REPLACEMENT_UNDERPRICED/i, "Gas price too low to replace the pending transaction. Wait or increase gas."],
  [/TIMEOUT|timeout/i, "Network timeout — the RPC server didn't respond. Try again."],
  [/NETWORK_ERROR|network error|fetch failed/i, "Network error — check your internet connection."],
  [/BUFFER_OVERRUN|NUMERIC_FAULT/i, "Invalid transaction data. Please try again."],
  [/MultiVault_AtomExists|AtomExists/i, "This atom already exists on-chain."],
  [/MultiVault_TripleExists|TripleExists/i, "This triple already exists on-chain."],
  [/SofiaFeeProxy_InsufficientValue/i, "Not enough value sent to cover the proxy fee. Try again."],
  [/SofiaFeeProxy_TransferFailed/i, "Fee transfer failed. Try again later."],
  [/Wrong password/i, "Wrong password. Please try again."],
  [/No embedded wallet found/i, "No wallet found. Create a new embedded wallet."],
  [/REDIRECT_METAMASK/i, "Redirecting to MetaMask..."],
  [/NO_WALLET/i, "No wallet connected. Please connect or create a wallet."],
];

export function formatTxError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  for (const [pattern, message] of PATTERNS) {
    if (pattern.test(raw)) return message;
  }

  // Truncate very long raw errors (ethers dumps full tx data)
  if (raw.length > 200) {
    return "Transaction failed. Please try again.";
  }

  return raw;
}
