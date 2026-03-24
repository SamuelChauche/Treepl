import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { formatTxError } from "../utils/txErrors";
import {
  hasEmbeddedWallet,
  getEmbeddedAddress,
  connectEmbeddedWallet,
  deleteEmbeddedWallet,
} from "../services/embeddedWallet";
import { CHAIN_CONFIG, STORAGE_KEYS } from "../config/constants";
import type { WalletConnection } from "../services/intuition";

interface EmbeddedWalletState {
  wallet: WalletConnection | null;
  address: string;
  balance: string | null;
  needsUnlock: boolean;
  unlocking: boolean;
  error: string;
  unlock: (password: string) => Promise<boolean>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  /** Called after wallet creation in onboarding — sets wallet without re-unlock */
  setWalletDirectly: (conn: WalletConnection, addr: string) => void;
}

const EmbeddedWalletContext = createContext<EmbeddedWalletState | null>(null);

export function EmbeddedWalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [address, setAddress] = useState(() => getEmbeddedAddress() ?? "");
  const [balance, setBalance] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState("");

  const needsUnlock = hasEmbeddedWallet() && !wallet;

  const refreshBalance = useCallback(async () => {
    const addr = wallet?.address ?? address;
    if (!addr) return;
    try {
      const { ethers } = await import("ethers");
      const rpc = new ethers.JsonRpcProvider(CHAIN_CONFIG.RPC_URL);
      const bal = await rpc.getBalance(addr);
      setBalance(ethers.formatEther(bal));
    } catch { /* ignore */ }
  }, [wallet, address]);

  // Poll balance every 10s when wallet is connected
  useEffect(() => {
    if (!wallet) return;
    refreshBalance();
    const interval = setInterval(refreshBalance, 10000);
    return () => clearInterval(interval);
  }, [wallet, refreshBalance]);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    setUnlocking(true);
    setError("");
    try {
      const conn = await connectEmbeddedWallet(password);
      setWallet(conn);
      setAddress(conn.address);
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, conn.address);
      setUnlocking(false);
      return true;
    } catch (e: unknown) {
      setError(formatTxError(e));
      setUnlocking(false);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setAddress("");
    setBalance(null);
    setError("");
    deleteEmbeddedWallet();
    localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
  }, []);

  const setWalletDirectly = useCallback((conn: WalletConnection, addr: string) => {
    setWallet(conn);
    setAddress(addr);
    localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, addr);
  }, []);

  return (
    <EmbeddedWalletContext.Provider value={{
      wallet, address, balance, needsUnlock, unlocking, error,
      unlock, disconnect, refreshBalance, setWalletDirectly,
    }}>
      {children}
    </EmbeddedWalletContext.Provider>
  );
}

export function useEmbeddedWallet() {
  const ctx = useContext(EmbeddedWalletContext);
  if (!ctx) throw new Error("useEmbeddedWallet must be used within EmbeddedWalletProvider");
  return ctx;
}
