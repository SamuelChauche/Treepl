import { useState, useEffect, useCallback, useRef } from "react";
import { useAppKitAccount, useAppKitProvider, useAppKit } from "@reown/appkit/react";
import { modal } from "@reown/appkit/react";
import { CHAIN_CONFIG, STORAGE_KEYS } from "../config/constants";
import { SofiaFeeProxyAbi } from "../config/SofiaFeeProxyABI";
import type { WalletConnection } from "../services/intuition";

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

/**
 * Hook that integrates AppKit (WalletConnect, MetaMask, Coinbase)
 * and produces a WalletConnection compatible with all existing services.
 */
export function useWalletConnection() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { open } = useAppKit();

  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const buildingRef = useRef(false);
  const builtForRef = useRef<string | null>(null);

  // Build WalletConnection when AppKit connects
  useEffect(() => {
    if (!isConnected || !address || !walletProvider) {
      if (!isConnected) {
        setWallet(null);
        setBalance(null);
        builtForRef.current = null;
      }
      return;
    }

    // Don't rebuild if already built for this address
    if (builtForRef.current === address || buildingRef.current) return;

    buildingRef.current = true;
    setLoading(true);

    // Close the AppKit modal after a short delay (let WalletConnect handshake settle on mobile)
    setTimeout(() => { try { modal?.close(); } catch { /* ignore */ } }, 500);

    (async () => {
      try {
        const { ethers } = await import("ethers");
        const provider = new ethers.BrowserProvider(walletProvider as import("ethers").Eip1193Provider);
        provider.pollingInterval = 30000;

        // Ensure wallet is on Intuition chain (1155)
        let needsChainSwitch = false;
        try {
          const network = await provider.getNetwork();
          needsChainSwitch = Number(network.chainId) !== CHAIN_CONFIG.CHAIN_ID;
        } catch { /* getNetwork failed — try chain switch anyway */ needsChainSwitch = true; }

        if (needsChainSwitch) {
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
            try {
              await provider.send("wallet_switchEthereumChain", [
                { chainId: CHAIN_CONFIG.CHAIN_ID_HEX },
              ]);
            } catch { /* already on chain or user rejected — continue */ }
          }
        }

        // Build provider (always re-init after potential chain switch)
        const freshProvider = needsChainSwitch
          ? new ethers.BrowserProvider(walletProvider as import("ethers").Eip1193Provider)
          : provider;
        if (needsChainSwitch) freshProvider.pollingInterval = 30000;

        const signer = await freshProvider.getSigner();
        const addr = await signer.getAddress();

        const proxy = new ethers.Contract(CHAIN_CONFIG.SOFIA_PROXY, SofiaFeeProxyAbi, signer);
        const multiVault = new ethers.Contract(CHAIN_CONFIG.MULTIVAULT, MULTIVAULT_ABI, signer);

        const conn: WalletConnection = { provider: freshProvider, signer, proxy, multiVault, address: addr, ethers };
        setWallet(conn);
        builtForRef.current = address;
        localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, addr);
        setError("");
        setLoading(false);
        buildingRef.current = false;

        // Fetch balance in background (non-blocking) via RPC
        try {
          const rpcProvider = new ethers.JsonRpcProvider(CHAIN_CONFIG.RPC_URL);
          const bal = await rpcProvider.getBalance(addr);
          setBalance(ethers.formatEther(bal));
        } catch { /* non-critical */ }

      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Connection failed");
        setLoading(false);
        buildingRef.current = false;
      }
    })();
  }, [isConnected, address, walletProvider]);

  // Poll balance every 5s when connected and balance is 0 (waiting for $TRUST)
  useEffect(() => {
    if (!wallet || balance === null) return;
    if (parseFloat(balance) > 0) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const { ethers } = await import("ethers");
        const rpcProvider = new ethers.JsonRpcProvider(CHAIN_CONFIG.RPC_URL);
        const bal = await rpcProvider.getBalance(wallet.address);
        if (!cancelled) {
          const formatted = ethers.formatEther(bal);
          setBalance(formatted);
        }
      } catch { /* ignore polling errors */ }
    };

    const interval = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [wallet, balance]);

  // Open the AppKit modal
  const connect = useCallback(() => {
    setError("");
    open();
  }, [open]);

  // Disconnect
  const disconnect = useCallback(() => {
    setWallet(null);
    setBalance(null);
    builtForRef.current = null;
    localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
  }, []);

  return {
    wallet,
    address: address ?? null,
    isConnected,
    loading,
    error,
    balance,
    connect,
    disconnect,
  };
}
