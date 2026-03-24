/**
 * Hook encapsulating all wallet state for onboarding step 6.
 * Manages AppKit (MetaMask/WalletConnect) + embedded wallet,
 * balance polling, create/unlock/disconnect handlers.
 */

import { useState, useEffect, useCallback } from "react";
import { useWalletConnection } from "./useWalletConnection";
import { useEmbeddedWallet } from "../contexts/EmbeddedWalletContext";
import {
  createEmbeddedWallet,
  connectEmbeddedWallet,
  markBackupDone,
  deleteEmbeddedWallet,
} from "../services/embeddedWallet";
import { CHAIN_CONFIG, STORAGE_KEYS } from "../config/constants";
import { formatTxError } from "../utils/txErrors";
import type { WalletConnection } from "../services/intuition";

export function useOnboardingWallet() {
  const {
    wallet, address: walletAddress, isConnected: walletConnected,
    loading: walletLoading, error: walletError, balance: trustBalance,
    connect: openWalletModal, disconnect: disconnectWallet,
  } = useWalletConnection();

  const embeddedCtx = useEmbeddedWallet();

  const [txError, setTxError] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [embeddedMode, setEmbeddedMode] = useState<"none" | "create" | "unlock" | "backup">("none");
  const [embeddedPrivateKey, setEmbeddedPrivateKey] = useState("");
  const [embeddedKeyCopied, setEmbeddedKeyCopied] = useState(false);
  const [embeddedWallet, setEmbeddedWallet] = useState<WalletConnection | null>(null);
  const [embeddedAddress, setEmbeddedAddress] = useState("");
  const [embeddedBalance, setEmbeddedBalance] = useState<string | null>(null);
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);

  // Derived state
  const effectiveWallet = wallet ?? embeddedWallet;
  const effectiveAddress = walletAddress ?? embeddedAddress;
  const effectiveBalance = trustBalance ?? embeddedBalance;

  // Show wallet errors
  useEffect(() => {
    if (walletError) setTxError(walletError);
  }, [walletError]);

  // Balance refresh
  const refreshEmbeddedBalance = useCallback(async () => {
    if (!embeddedWallet) return;
    setBalanceRefreshing(true);
    try {
      const { ethers } = await import("ethers");
      const rpcProvider = new ethers.JsonRpcProvider(CHAIN_CONFIG.RPC_URL);
      const bal = await rpcProvider.getBalance(embeddedWallet.address);
      setEmbeddedBalance(ethers.formatEther(bal));
    } catch { /* ignore */ }
    setBalanceRefreshing(false);
  }, [embeddedWallet]);

  // Poll balance every 10s
  useEffect(() => {
    if (!embeddedWallet) return;
    refreshEmbeddedBalance();
    const interval = setInterval(refreshEmbeddedBalance, 10000);
    return () => clearInterval(interval);
  }, [embeddedWallet, refreshEmbeddedBalance]);

  // Trust received notification
  const [trustNotified, setTrustNotified] = useState(false);
  useEffect(() => {
    if (trustNotified) return;
    const bal = parseFloat(effectiveBalance ?? "0");
    const isConnected = (walletConnected && wallet) || embeddedWallet;
    if (bal > 0 && isConnected) {
      setTrustNotified(true);
      setTxStatus(`${bal.toFixed(4)} TRUST received!`);
      setTimeout(() => setTxStatus(""), 3000);
    }
  }, [effectiveBalance, walletConnected, wallet, embeddedWallet, trustNotified]);

  // Wallet state derivation
  const computeWalletState = (txState: "idle" | "signing" | "done") => {
    if (txState !== "idle") return txState;
    if (walletLoading) return "connecting" as const;
    if ((walletConnected && wallet) || embeddedWallet) return "connected" as const;
    return "idle" as const;
  };

  // Handlers
  const handleCreateEmbedded = useCallback(async (pw: string) => {
    if (!pw || pw.length < 4) {
      setTxError("Password must be at least 4 characters");
      return;
    }
    setTxError("");
    try {
      const { address, privateKey } = await createEmbeddedWallet(pw);
      setEmbeddedAddress(address);
      setEmbeddedPrivateKey(privateKey);
      const conn = await connectEmbeddedWallet(pw);
      setEmbeddedWallet(conn);
      embeddedCtx.setWalletDirectly(conn, address);
      try {
        const bal = await conn.provider.getBalance(address);
        setEmbeddedBalance(conn.ethers.formatEther(bal));
      } catch { /* non-critical */ }
      setShowWalletPicker(false);
      setEmbeddedMode("backup");
    } catch (e: unknown) {
      setTxError(formatTxError(e));
    }
  }, [embeddedCtx]);

  const handleUnlockEmbedded = useCallback(async (pw: string): Promise<boolean> => {
    if (!pw) return false;
    setTxError("");
    try {
      const conn = await connectEmbeddedWallet(pw);
      setEmbeddedWallet(conn);
      setEmbeddedAddress(conn.address);
      setEmbeddedMode("none");
      embeddedCtx.setWalletDirectly(conn, conn.address);
      try {
        const bal = await conn.provider.getBalance(conn.address);
        setEmbeddedBalance(conn.ethers.formatEther(bal));
      } catch { /* non-critical */ }
      return true;
    } catch (e: unknown) {
      setTxError(formatTxError(e));
      return false;
    }
  }, [embeddedCtx]);

  const handleBackupDone = useCallback(() => {
    markBackupDone();
    setEmbeddedMode("none");
    setShowWalletPicker(false);
  }, []);

  const handleDisconnect = useCallback(() => {
    if (walletConnected) disconnectWallet();
    setEmbeddedWallet(null);
    setEmbeddedAddress("");
    setEmbeddedBalance(null);
    setEmbeddedMode("none");
    setEmbeddedPrivateKey("");
    setEmbeddedKeyCopied(false);
    deleteEmbeddedWallet();
    localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
    setTxError("");
    setTxStatus("");
    setShowSettings(false);
  }, [walletConnected, disconnectWallet]);

  const handleClearAllData = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  return {
    // Effective (merged AppKit + embedded)
    effectiveWallet,
    effectiveAddress,
    effectiveBalance,
    computeWalletState,
    walletConnected,

    // TX feedback
    txError, setTxError,
    txStatus, setTxStatus,

    // Settings menu
    showSettings, setShowSettings,

    // Wallet picker modal
    showWalletPicker, setShowWalletPicker,
    embeddedMode, setEmbeddedMode,
    embeddedPrivateKey,
    embeddedKeyCopied, setEmbeddedKeyCopied,
    embeddedWallet,
    balanceRefreshing,
    refreshEmbeddedBalance,

    // Handlers
    openWalletModal,
    disconnectWallet,
    handleCreateEmbedded,
    handleUnlockEmbedded,
    handleBackupDone,
    handleDisconnect,
    handleClearAllData,
  };
}
