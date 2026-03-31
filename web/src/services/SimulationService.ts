import type { WalletConnection } from "./intuition";
import { CHAIN_CONFIG } from "../config/constants";

// ─── Types ───────────────────────────────────────────────────────

export interface SimulationResult {
  success: boolean;
  gasEstimate?: bigint;
  error?: string;
  errorType?: SimulationErrorType;
}

export type SimulationErrorType =
  | "INSUFFICIENT_FUNDS"
  | "ATOM_MISSING"
  | "GAS_ERROR"
  | "USER_REJECTED"
  | "TRIPLE_EXISTS"
  | "UNKNOWN";

export interface BalanceCheck {
  hasEnough: boolean;
  balance: bigint;
  required: bigint;
  deficit: bigint;
}

// ─── SimulationService ───────────────────────────────────────────

/**
 * Service for simulating transactions before sending them on-chain.
 * Uses eth_call (static call) to verify tx would succeed without spending gas.
 *
 * Pattern inspired by Sofia extension's simulation-first approach.
 */
export class SimulationService {
  /**
   * Generic transaction simulation using provider.call (eth_call).
   * This performs a static call without modifying state or spending gas.
   *
   * @param wallet - Connected wallet with provider
   * @param contractAddress - Target contract address
   * @param data - Encoded function call data
   * @param value - ETH/TRUST value to send
   * @returns Simulation result with success status and potential error
   */
  static async simulateTransaction(
    wallet: WalletConnection,
    contractAddress: string,
    data: string,
    value: bigint
  ): Promise<SimulationResult> {
    try {
      // Use a dedicated RPC provider for simulation instead of wallet.provider
      // This prevents "JsonRpcProvider failed to detect network" errors on mobile/MetaMask
      const { ethers } = wallet.ethers;
      const rpcProvider = new ethers.JsonRpcProvider(CHAIN_CONFIG.RPC_URL, {
        chainId: CHAIN_CONFIG.CHAIN_ID,
        name: CHAIN_CONFIG.CHAIN_NAME,
      });

      // Step 1: Static call to verify tx would succeed
      await rpcProvider.call({
        to: contractAddress,
        data,
        value,
        from: wallet.address,
      });

      // Step 2: If call succeeds, estimate gas cost
      const gasEstimate = await rpcProvider.estimateGas({
        to: contractAddress,
        data,
        value,
        from: wallet.address,
      });

      return { success: true, gasEstimate };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorType = SimulationService.parseErrorType(errorMsg);

      return {
        success: false,
        error: errorMsg,
        errorType,
      };
    }
  }

  /**
   * Simulate createTriples batch transaction.
   *
   * @param wallet - Connected wallet
   * @param subjectIds - Array of subject atom IDs
   * @param predicateIds - Array of predicate atom IDs
   * @param objectIds - Array of object atom IDs
   * @param assets - Array of deposit amounts per triple
   * @param totalCost - Total cost including MultiVault cost + Sofia fees
   */
  static async simulateCreateTriples(
    wallet: WalletConnection,
    subjectIds: string[],
    predicateIds: string[],
    objectIds: string[],
    assets: bigint[],
    totalCost: bigint
  ): Promise<SimulationResult> {
    const data = wallet.proxy.interface.encodeFunctionData("createTriples", [
      wallet.address,
      subjectIds,
      predicateIds,
      objectIds,
      assets,
      CHAIN_CONFIG.CURVE_ID,
    ]);

    return SimulationService.simulateTransaction(
      wallet,
      CHAIN_CONFIG.SOFIA_PROXY,
      data,
      totalCost
    );
  }

  /**
   * Simulate createAtoms transaction.
   *
   * @param wallet - Connected wallet
   * @param atomDataArray - Array of atom data (hex-encoded bytes)
   * @param assets - Array of deposit amounts per atom
   * @param totalCost - Total cost including atom cost + Sofia fees
   */
  static async simulateCreateAtoms(
    wallet: WalletConnection,
    atomDataArray: string[],
    assets: bigint[],
    totalCost: bigint
  ): Promise<SimulationResult> {
    const data = wallet.proxy.interface.encodeFunctionData("createAtoms", [
      wallet.address,
      atomDataArray,
      assets,
      CHAIN_CONFIG.CURVE_ID,
    ]);

    return SimulationService.simulateTransaction(
      wallet,
      CHAIN_CONFIG.SOFIA_PROXY,
      data,
      totalCost
    );
  }

  /**
   * Simulate depositBatch transaction.
   *
   * @param wallet - Connected wallet
   * @param termIds - Array of term IDs to deposit on
   * @param assets - Array of deposit amounts
   * @param totalValue - Total value = sum(assets) + fees
   */
  static async simulateDepositBatch(
    wallet: WalletConnection,
    termIds: string[],
    assets: bigint[],
    totalValue: bigint
  ): Promise<SimulationResult> {
    const curveIds = termIds.map(() => CHAIN_CONFIG.CURVE_ID);
    const minShares = termIds.map(() => 0n);

    const data = wallet.proxy.interface.encodeFunctionData("depositBatch", [
      wallet.address,
      termIds,
      curveIds,
      assets,
      minShares,
    ]);

    return SimulationService.simulateTransaction(
      wallet,
      CHAIN_CONFIG.SOFIA_PROXY,
      data,
      totalValue
    );
  }

  /**
   * Check if wallet has sufficient balance for transaction.
   *
   * @param wallet - Connected wallet
   * @param requiredAmount - Required amount in wei
   * @returns Balance check result with deficit calculation
   */
  static async checkBalance(
    wallet: WalletConnection,
    requiredAmount: bigint
  ): Promise<BalanceCheck> {
    const balance = await wallet.provider.getBalance(wallet.address);
    const hasEnough = balance >= requiredAmount;
    const deficit = hasEnough ? 0n : requiredAmount - balance;

    return {
      hasEnough,
      balance,
      required: requiredAmount,
      deficit,
    };
  }

  /**
   * Parse error message to determine error type.
   *
   * @param errorMsg - Raw error message from provider
   * @returns Categorized error type
   */
  private static parseErrorType(errorMsg: string): SimulationErrorType {
    const lower = errorMsg.toLowerCase();

    if (
      lower.includes("insufficient funds") ||
      lower.includes("insufficient balance") ||
      lower.includes("balance too low")
    ) {
      return "INSUFFICIENT_FUNDS";
    }

    if (
      lower.includes("does not exist") ||
      lower.includes("termdoesnotexist") ||
      lower.includes("invalid term") ||
      lower.includes("atom not found")
    ) {
      return "ATOM_MISSING";
    }

    if (
      lower.includes("triple exists") ||
      lower.includes("tripleexists") ||
      lower.includes("multivault_tripleexists")
    ) {
      return "TRIPLE_EXISTS";
    }

    if (
      lower.includes("gas") ||
      lower.includes("out of gas") ||
      lower.includes("exceeds block gas limit")
    ) {
      return "GAS_ERROR";
    }

    if (
      lower.includes("user rejected") ||
      lower.includes("user denied") ||
      lower.includes("action_rejected")
    ) {
      return "USER_REJECTED";
    }

    return "UNKNOWN";
  }

  /**
   * Verify all atoms exist on-chain before attempting transaction.
   *
   * @param multiVault - MultiVault contract instance
   * @param atomIds - Array of atom IDs to verify
   * @returns Array of missing atom IDs (empty if all exist)
   */
  static async verifyAtomsExist(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    multiVault: any,
    atomIds: string[]
  ): Promise<string[]> {
    const missing: string[] = [];

    for (const id of atomIds) {
      try {
        const exists = await multiVault.isTermCreated(id);
        if (!exists) missing.push(id);
      } catch {
        missing.push(id);
      }
    }

    return missing;
  }
}
