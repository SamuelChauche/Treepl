import { CHAIN_CONFIG } from "../config/constants";
import type { WalletConnection } from "./intuition";

/**
 * NetworkGuard - Protection against network changes during transactions
 *
 * This service ensures that all blockchain operations happen on the correct network
 * (Chain 1155 - Intuition) and detects/handles network switches gracefully.
 *
 * Problem solved: On mobile, wallets sometimes auto-switch networks during transactions,
 * causing the transaction flow to break with "network changed" errors.
 */
export class NetworkGuard {
  /**
   * Verify that the wallet is connected to the correct network (Chain 1155).
   * If not, attempt to switch automatically.
   *
   * @param wallet - Connected wallet to verify
   * @throws Error if network is wrong and cannot be switched
   */
  static async ensureCorrectNetwork(wallet: WalletConnection): Promise<void> {
    try {
      const network = await wallet.provider.getNetwork();
      const currentChainId = Number(network.chainId);

      if (currentChainId !== CHAIN_CONFIG.CHAIN_ID) {
        console.warn(`[NetworkGuard] Wrong network detected: ${currentChainId}, expected ${CHAIN_CONFIG.CHAIN_ID}`);

        // Try to switch network automatically
        await NetworkGuard.switchToCorrectNetwork(wallet);

        // Verify switch was successful
        const newNetwork = await wallet.provider.getNetwork();
        const newChainId = Number(newNetwork.chainId);

        if (newChainId !== CHAIN_CONFIG.CHAIN_ID) {
          throw new Error(
            `Your wallet is on the wrong network (Chain ${currentChainId}). ` +
            `Please switch to ${CHAIN_CONFIG.CHAIN_NAME} (Chain ${CHAIN_CONFIG.CHAIN_ID}) and try again.`
          );
        }

        console.log(`[NetworkGuard] Successfully switched to Chain ${CHAIN_CONFIG.CHAIN_ID}`);
      }
    } catch (error) {
      // If error is already a user-friendly message, rethrow it
      if (error instanceof Error && error.message.includes('Your wallet is on the wrong network')) {
        throw error;
      }

      // Otherwise, wrap in a user-friendly message
      console.error('[NetworkGuard] Network verification failed:', error);
      throw new Error(
        `Network verification failed. Please ensure you're connected to ${CHAIN_CONFIG.CHAIN_NAME} (Chain ${CHAIN_CONFIG.CHAIN_ID}).`
      );
    }
  }

  /**
   * Attempt to switch the wallet to the correct network using wallet_switchEthereumChain
   * or wallet_addEthereumChain if the network is not yet added.
   *
   * @param wallet - Connected wallet
   */
  private static async switchToCorrectNetwork(wallet: WalletConnection): Promise<void> {
    try {
      // First, try to switch to the network
      await wallet.provider.send('wallet_switchEthereumChain', [
        { chainId: CHAIN_CONFIG.CHAIN_ID_HEX }
      ]);
    } catch (switchError: any) {
      // Error code 4902 means the network is not added to the wallet yet
      if (switchError.code === 4902) {
        console.log('[NetworkGuard] Network not found in wallet, adding it...');

        try {
          // Add the network to the wallet
          await wallet.provider.send('wallet_addEthereumChain', [
            {
              chainId: CHAIN_CONFIG.CHAIN_ID_HEX,
              chainName: CHAIN_CONFIG.CHAIN_NAME,
              rpcUrls: [CHAIN_CONFIG.RPC_URL],
              nativeCurrency: CHAIN_CONFIG.NATIVE_CURRENCY,
              blockExplorerUrls: ['https://explorer.intuition.systems'],
            }
          ]);

          console.log('[NetworkGuard] Network added successfully');
        } catch (addError) {
          console.error('[NetworkGuard] Failed to add network:', addError);
          throw new Error(
            `Could not add ${CHAIN_CONFIG.CHAIN_NAME} to your wallet. ` +
            `Please add it manually: Chain ID ${CHAIN_CONFIG.CHAIN_ID}, RPC: ${CHAIN_CONFIG.RPC_URL}`
          );
        }
      } else {
        // User rejected the switch or other error
        console.error('[NetworkGuard] Failed to switch network:', switchError);
        throw switchError;
      }
    }
  }

  /**
   * Check if an error is a network change error from ethers.
   * These typically have error codes like NETWORK_ERROR or messages containing "network changed".
   *
   * @param error - Error to check
   * @returns true if this is a network change error
   */
  static isNetworkChangeError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const message = error.message.toLowerCase();
    const errorCode = (error as any).code;

    return (
      errorCode === 'NETWORK_ERROR' ||
      message.includes('network changed') ||
      message.includes('network mismatch') ||
      message.includes('chain id') ||
      message.includes('chainid')
    );
  }

  /**
   * Convert a network change error into a user-friendly message.
   *
   * @param error - Network error
   * @returns User-friendly error message
   */
  static formatNetworkError(error: unknown): string {
    if (!(error instanceof Error)) {
      return `Network error occurred. Please ensure you're connected to ${CHAIN_CONFIG.CHAIN_NAME} (Chain ${CHAIN_CONFIG.CHAIN_ID}).`;
    }

    const message = error.message;

    // Try to extract the chain IDs from the error message
    const match = message.match(/network changed: (\d+) => (\d+)|chain (\d+)/i);
    if (match) {
      const wrongChain = match[2] || match[3] || 'unknown';
      return (
        `Your wallet switched to Chain ${wrongChain} during the transaction. ` +
        `Please switch back to ${CHAIN_CONFIG.CHAIN_NAME} (Chain ${CHAIN_CONFIG.CHAIN_ID}) and try again.`
      );
    }

    return (
      `Network error: ${message}\n\n` +
      `Please ensure you're connected to ${CHAIN_CONFIG.CHAIN_NAME} (Chain ${CHAIN_CONFIG.CHAIN_ID}) and try again.`
    );
  }

  /**
   * Wrap an async operation with network verification.
   * This ensures the network is correct before the operation and provides
   * clear error messages if the network changes during execution.
   *
   * @param wallet - Connected wallet
   * @param operation - Async operation to execute
   * @param operationName - Name for logging/errors
   * @returns Result of the operation
   */
  static async withNetworkGuard<T>(
    wallet: WalletConnection,
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    // Verify network before operation
    await NetworkGuard.ensureCorrectNetwork(wallet);

    console.log(`[NetworkGuard] Starting ${operationName} on Chain ${CHAIN_CONFIG.CHAIN_ID}`);

    try {
      const result = await operation();
      console.log(`[NetworkGuard] ${operationName} completed successfully`);
      return result;
    } catch (error) {
      // Check if this is a network change error
      if (NetworkGuard.isNetworkChangeError(error)) {
        const friendlyMessage = NetworkGuard.formatNetworkError(error);
        console.error(`[NetworkGuard] ${operationName} failed due to network change:`, friendlyMessage);
        throw new Error(friendlyMessage);
      }

      // Not a network error, rethrow original
      throw error;
    }
  }
}
