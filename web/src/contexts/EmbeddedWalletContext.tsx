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

const SESSION_PW_KEY = "__ethcc_pw";

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
  setWalletDirectly: (conn: WalletConnection, addr: string, password?: string) => void;
}

const EmbeddedWalletContext = createContext<EmbeddedWalletState | null>(null);

// In dev mode, use VITE_DEV_WALLET to skip wallet connection
const DEV_WALLET = import.meta.env.DEV ? (import.meta.env.VITE_DEV_WALLET || "0xbA58601d164b94510BfFe99E96613b9Bcd1A4cFD") : undefined;

export function EmbeddedWalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [address, setAddress] = useState(() => DEV_WALLET ?? getEmbeddedAddress() ?? "");
  const [balance, setBalance] = useState<string | null>(null);

  // In dev mode, seed localStorage so pages that read WALLET_ADDRESS directly also work
  useEffect(() => {
    if (DEV_WALLET) {
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, DEV_WALLET);
    }
  }, []);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState("");

  const needsUnlock = DEV_WALLET ? false : hasEmbeddedWallet() && !wallet;

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
      // Store password in sessionStorage for auto-reconnect on reload
      sessionStorage.setItem(SESSION_PW_KEY, password);
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
    sessionStorage.removeItem(SESSION_PW_KEY);
  }, []);

  // Auto-reconnect on mount if password is in sessionStorage
  useEffect(() => {
    if (wallet) return; // already connected
    if (!hasEmbeddedWallet()) return; // no wallet
    const pw = sessionStorage.getItem(SESSION_PW_KEY);
    if (!pw) return; // no stored password
    // Auto-unlock silently
    connectEmbeddedWallet(pw).then((conn) => {
      setWallet(conn);
      setAddress(conn.address);
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, conn.address);
    }).catch(() => {
      sessionStorage.removeItem(SESSION_PW_KEY); // invalid pw, clear
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Store password on successful wallet creation too
  const setWalletDirectlyWithPw = useCallback((conn: WalletConnection, addr: string, password?: string) => {
    setWallet(conn);
    setAddress(addr);
    localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, addr);
    if (password) sessionStorage.setItem(SESSION_PW_KEY, password);
  }, []);

  return (
    <EmbeddedWalletContext.Provider value={{
      wallet, address, balance, needsUnlock, unlocking, error,
      unlock, disconnect, refreshBalance,
      setWalletDirectly: setWalletDirectlyWithPw,
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
