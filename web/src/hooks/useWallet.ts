import { useState, useEffect, useMemo } from "react";
import { sessions } from "../data";
import {
  connectWallet,
  addIntuitionChain,
  approveProxy,
  getUserAtomId,
  buildProfileTriples,
  createProfileTriples,
  estimateFees,
} from "../services/intuition";
import type { WalletConnection, FeeEstimate } from "../services/intuition";
import { StorageService } from "../services/StorageService";

export type WalletStep = "recap" | "wallet" | "connected" | "signing" | "created";

export function useWallet() {
  const [step, setStep] = useState<WalletStep>("recap");
  const [txStatus, setTxStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletState, setWalletState] = useState<WalletConnection | null>(null);
  const [trustBalance, setTrustBalance] = useState<string | null>(null);
  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null);

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
      const connection = await connectWallet();
      setWalletAddress(connection.address);
      setWalletState(connection);

      // Approve proxy on MultiVault (one-time)
      setTxStatus("Approving proxy on MultiVault... Please confirm in your wallet");
      try {
        await approveProxy(connection.multiVault);
      } catch (approvalErr: unknown) {
        const msg = approvalErr instanceof Error ? approvalErr.message : String(approvalErr);
        if (msg.includes("user rejected") || msg.includes("denied") || msg.includes("ACTION_REJECTED")) {
          setTxError("You must approve the proxy to create your profile.");
          setTxStatus("");
          return;
        }
        // May already be approved — continue
      }

      setTxStatus("");
      setStep("connected");

      const bal = await connection.provider.getBalance(connection.address);
      setTrustBalance(connection.ethers.formatEther(bal));

      // Estimate fees in background
      if (tripleCount > 0) {
        try {
          const fees = await estimateFees(connection.multiVault, connection.proxy, tripleCount);
          setFeeEstimate(fees);
        } catch {
          // Fee estimate is non-critical
        }
      }
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
      const { proxy, ethers, address } = walletState;

      setTxStatus("Checking your atom on Intuition...");
      const { multiVault } = walletState;
      const userAtomId = await getUserAtomId(multiVault, address, ethers);

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
        `Creating ${triples.length} triples with deposit... Confirm in your wallet`
      );
      const result = await createProfileTriples(multiVault, proxy, address, triples);

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
    feeEstimate,
    cart,
    topics,
    selectedSessions,
    tripleCount,
    handleConnect,
    handleCreate,
    addIntuitionChain,
  };
}
