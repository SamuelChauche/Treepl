import type { WalletConnection } from "./intuition";
import { DEFAULT_DEPOSIT_PER_TRIPLE } from "../config/constants";

// ─── Types ───────────────────────────────────────────────────────

export interface CostBreakdown {
  // MultiVault base costs
  tripleCost: bigint;
  atomCost: bigint;
  depositAmount: bigint;

  // Sofia Fee Proxy costs
  sofiaFixedFee: bigint;
  sofiaPercentageFee: bigint;

  // Totals
  multiVaultTotal: bigint;
  sofiaFeeTotal: bigint;
  grandTotal: bigint;

  // Metadata
  itemCount: number; // triples or atoms
  depositPerItem: bigint;
}

export interface BatchCostEstimate {
  batches: CostBreakdown[];
  totalCost: bigint;
  batchCount: number;
}

// ─── FeeCalculationService ───────────────────────────────────────

/**
 * Service for calculating transaction costs with detailed breakdowns.
 * Handles both MultiVault base costs and Sofia Fee Proxy fees.
 *
 * Pattern: All methods are static, no state management.
 */
export class FeeCalculationService {
  /**
   * Calculate detailed cost breakdown for creating N triples with deposits.
   *
   * @param wallet - Connected wallet with proxy and multiVault contracts
   * @param tripleCount - Number of triples to create
   * @param depositPerTriple - Deposit amount per triple (defaults to DEFAULT_DEPOSIT_PER_TRIPLE)
   * @returns Detailed cost breakdown
   */
  static async calculateTripleCreationCost(
    wallet: WalletConnection,
    tripleCount: number,
    depositPerTriple?: bigint
  ): Promise<CostBreakdown> {
    const deposit = depositPerTriple ?? BigInt(DEFAULT_DEPOSIT_PER_TRIPLE);
    const n = BigInt(tripleCount);

    let tripleCost: bigint;
    let depositAmount: bigint;
    let multiVaultTotal: bigint;
    let grandTotal: bigint;

    try {
      // Get base costs from MultiVault
      tripleCost = await wallet.multiVault.getTripleCost();
      // No atoms created in triple creation

      // Calculate deposit totals
      depositAmount = deposit * n;
      multiVaultTotal = tripleCost * n + depositAmount;

      // Get total cost from Sofia Fee Proxy (includes fees)
      const assets = Array.from({ length: tripleCount }, () => deposit);
      const depositCount = FeeCalculationService.countNonZero(assets);
      grandTotal = await wallet.proxy.getTotalCreationCost(
        depositCount,
        depositAmount,
        multiVaultTotal
      );
    } catch (error) {
      // Check if this is a network change error
      const { NetworkGuard } = await import('./NetworkGuard');
      if (NetworkGuard.isNetworkChangeError(error)) {
        const friendlyMessage = NetworkGuard.formatNetworkError(error);
        throw new Error(friendlyMessage);
      }
      throw error;
    }

    const atomCost = 0n;
    const sofiaFeeTotal = grandTotal - multiVaultTotal;

    // Try to get detailed fee breakdown (if proxy exposes these methods)
    let sofiaFixedFee = 0n;
    let sofiaPercentageFee = 0n;

    try {
      sofiaFixedFee = await wallet.proxy.creationFixedFee();
      const percentageRate = await wallet.proxy.depositPercentageFee();
      // Sofia uses basis points (1% = 100 bp)
      sofiaPercentageFee = (depositAmount * percentageRate) / 10000n;
    } catch {
      // Proxy may not expose these, use total fee as fallback
      sofiaFixedFee = sofiaFeeTotal;
    }

    return {
      tripleCost,
      atomCost,
      depositAmount,
      sofiaFixedFee,
      sofiaPercentageFee,
      multiVaultTotal,
      sofiaFeeTotal,
      grandTotal,
      itemCount: tripleCount,
      depositPerItem: deposit,
    };
  }

  /**
   * Calculate cost breakdown for creating N atoms with deposits.
   *
   * @param wallet - Connected wallet
   * @param atomCount - Number of atoms to create
   * @param depositPerAtom - Deposit amount per atom
   * @returns Detailed cost breakdown
   */
  static async calculateAtomCreationCost(
    wallet: WalletConnection,
    atomCount: number,
    depositPerAtom?: bigint
  ): Promise<CostBreakdown> {
    const deposit = depositPerAtom ?? BigInt(DEFAULT_DEPOSIT_PER_TRIPLE);
    const n = BigInt(atomCount);

    // Get base costs from MultiVault
    const atomCost = await wallet.multiVault.getAtomCost();
    const tripleCost = 0n; // No triples created

    // Calculate deposit totals
    const depositAmount = deposit * n;
    const multiVaultTotal = atomCost * n + depositAmount;

    // Get total cost from Sofia Fee Proxy
    const assets = Array.from({ length: atomCount }, () => deposit);
    const depositCount = FeeCalculationService.countNonZero(assets);
    const grandTotal = await wallet.proxy.getTotalCreationCost(
      depositCount,
      depositAmount,
      multiVaultTotal
    );

    const sofiaFeeTotal = grandTotal - multiVaultTotal;

    // Try to get detailed fee breakdown
    let sofiaFixedFee = 0n;
    let sofiaPercentageFee = 0n;

    try {
      sofiaFixedFee = await wallet.proxy.creationFixedFee();
      const percentageRate = await wallet.proxy.depositPercentageFee();
      sofiaPercentageFee = (depositAmount * percentageRate) / 10000n;
    } catch {
      sofiaFixedFee = sofiaFeeTotal;
    }

    return {
      tripleCost,
      atomCost,
      depositAmount,
      sofiaFixedFee,
      sofiaPercentageFee,
      multiVaultTotal,
      sofiaFeeTotal,
      grandTotal,
      itemCount: atomCount,
      depositPerItem: deposit,
    };
  }

  /**
   * Calculate cost for batch deposit (no creation, just deposits into existing vaults).
   *
   * @param wallet - Connected wallet
   * @param termCount - Number of terms to deposit on
   * @param depositPerTerm - Deposit amount per term
   * @returns Detailed cost breakdown
   */
  static async calculateDepositBatchCost(
    wallet: WalletConnection,
    termCount: number,
    depositPerTerm?: bigint
  ): Promise<CostBreakdown> {
    const deposit = depositPerTerm ?? BigInt(DEFAULT_DEPOSIT_PER_TRIPLE);
    const n = BigInt(termCount);

    const depositAmount = deposit * n;

    let fee: bigint;
    let grandTotal: bigint;

    try {
      // Calculate fee via proxy
      fee = await wallet.proxy.calculateDepositFee(n, depositAmount);
      grandTotal = depositAmount + fee;
    } catch (error) {
      // Check if this is a network change error
      const { NetworkGuard } = await import('./NetworkGuard');
      if (NetworkGuard.isNetworkChangeError(error)) {
        const friendlyMessage = NetworkGuard.formatNetworkError(error);
        throw new Error(friendlyMessage);
      }
      throw error;
    }

    // Try to get detailed fee breakdown
    let sofiaFixedFee = 0n;
    let sofiaPercentageFee = 0n;

    try {
      sofiaFixedFee = await wallet.proxy.depositFixedFee();
      const percentageRate = await wallet.proxy.depositPercentageFee();
      sofiaPercentageFee = (depositAmount * percentageRate) / 10000n;
    } catch {
      sofiaFixedFee = fee;
    }

    return {
      tripleCost: 0n,
      atomCost: 0n,
      depositAmount,
      sofiaFixedFee,
      sofiaPercentageFee,
      multiVaultTotal: depositAmount, // No creation cost
      sofiaFeeTotal: fee,
      grandTotal,
      itemCount: termCount,
      depositPerItem: deposit,
    };
  }

  /**
   * Estimate cost for batch triple creation split into multiple batches.
   *
   * @param wallet - Connected wallet
   * @param tripleCount - Total number of triples
   * @param batchSize - Maximum triples per batch
   * @param depositPerTriple - Deposit per triple
   * @returns Cost estimate for all batches
   */
  static async estimateBatchedTripleCreation(
    wallet: WalletConnection,
    tripleCount: number,
    batchSize: number,
    depositPerTriple?: bigint
  ): Promise<BatchCostEstimate> {
    const batches: CostBreakdown[] = [];
    const batchCount = Math.ceil(tripleCount / batchSize);

    for (let i = 0; i < tripleCount; i += batchSize) {
      const currentBatchSize = Math.min(batchSize, tripleCount - i);
      const batchCost = await FeeCalculationService.calculateTripleCreationCost(
        wallet,
        currentBatchSize,
        depositPerTriple
      );
      batches.push(batchCost);
    }

    const totalCost = batches.reduce((sum, b) => sum + b.grandTotal, 0n);

    return {
      batches,
      totalCost,
      batchCount,
    };
  }

  /**
   * Format bigint as human-readable $TRUST amount.
   *
   * @param amount - Amount in wei
   * @param decimals - Number of decimal places (default: 4)
   * @returns Formatted string (e.g., "0.1234")
   */
  static formatTrust(amount: bigint, decimals: number = 4): string {
    // Dynamic import to avoid bundling ethers in all chunks
    const ethers = typeof window !== "undefined" ? (window as any).ethers : null;
    if (!ethers) {
      // Fallback: manual calculation (used in tests or when ethers not loaded)
      const divisor = 10n ** 18n;
      const whole = amount / divisor;
      const remainder = amount % divisor;
      const fractional = Number(remainder) / Number(divisor);
      return (Number(whole) + fractional).toFixed(decimals);
    }
    const formatted = ethers.formatEther(amount);
    return parseFloat(formatted).toFixed(decimals);
  }

  /**
   * Parse human-readable $TRUST amount to wei.
   *
   * @param amount - Amount as string (e.g., "0.1")
   * @returns Amount in wei
   */
  static parseTrust(amount: string): bigint {
    const ethers = typeof window !== "undefined" ? (window as any).ethers : null;
    if (!ethers) {
      // Fallback: manual calculation (used in tests or when ethers not loaded)
      const parts = amount.split(".");
      const whole = BigInt(parts[0] || "0");
      const fractional = parts[1] || "0";
      const padding = "0".repeat(18 - fractional.length);
      const fraction = BigInt(fractional + padding);
      return whole * 10n ** 18n + fraction;
    }
    return ethers.parseEther(amount);
  }

  /**
   * Count non-zero assets in array (mirrors SofiaFeeProxy._countNonZero).
   *
   * @param assets - Array of asset amounts
   * @returns Count of assets > 0
   */
  private static countNonZero(assets: bigint[]): bigint {
    return BigInt(assets.filter((a) => a > 0n).length);
  }
}
