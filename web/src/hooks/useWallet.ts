import { useState, useEffect, useMemo } from "react";
import { sessions } from "../data";
import {
  connectWallet,
  addIntuitionChain,
  ensureUserAtom,
  buildProfileTriples,
  createProfileTriples,
} from "../intuition";
import { StorageService } from "../services/StorageService";

export type WalletStep = "recap" | "wallet" | "connected" | "signing" | "created";

interface WalletState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ethers: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any;
}

export function useWallet() {
  const [step, setStep] = useState<WalletStep>("recap");
  const [txStatus, setTxStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const [trustBalance, setTrustBalance] = useState<string | null>(null);

  const cart = useMemo(() => StorageService.loadCart(), []);
  const topics = useMemo(() => StorageService.loadTopics(), []);

  const selectedSessions = useMemo(
    () => sessions.filter((s) => cart.has(s.id)),
    [cart]
  );

  const tripleCount = topics.size + selectedSessions.length;

  async function handleConnect() {
    setTxError("");
    setTxStatus("Connecting wallet...");
    try {
      const { contract, address, ethers, provider } = await connectWallet();
      setWalletAddress(address);
      setWalletState({ contract, ethers, provider });
      setTxStatus("");
      setStep("connected");
      const bal = await provider.getBalance(address);
      setTrustBalance(ethers.formatEther(bal));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setTxError(msg);
      setTxStatus("");
    }
  }

  // Poll balance when connected and balance is 0
  useEffect(() => {
    if (!walletState || !walletAddress || trustBalance === null) return;
    if (parseFloat(trustBalance) > 0) return;

    const interval = setInterval(async () => {
      try {
        const bal = await walletState.provider.getBalance(walletAddress);
        const formatted = walletState.ethers.formatEther(bal);
        setTrustBalance(formatted);
        if (parseFloat(formatted) > 0) {
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [walletState, walletAddress, trustBalance]);

  async function handleCreate() {
    if (!walletState) return;
    setTxError("");
    setStep("signing");

    try {
      const { contract, ethers } = walletState;

      setTxStatus("Checking your atom on Intuition...");
      const userAtomId = await ensureUserAtom(contract, walletAddress, ethers);

      const triples = buildProfileTriples(
        userAtomId,
        [...topics],
        [...cart]
      );

      if (triples.length === 0) {
        setTxError("No triples to create.");
        setStep("connected");
        return;
      }

      setTxStatus(
        `Creating ${triples.length} triples... Confirm in your wallet`
      );
      const result = await createProfileTriples(contract, triples);

      setTxHash(result.hash);
      setStep("created");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setTxError(msg);
      setStep("connected");
    }
  }

  return {
    step,
    setStep,
    txStatus,
    txHash,
    txError,
    walletAddress,
    trustBalance,
    cart,
    topics,
    selectedSessions,
    tripleCount,
    handleConnect,
    handleCreate,
    addIntuitionChain,
  };
}
