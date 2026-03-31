import { useState, useEffect, useMemo } from "react";
import { sessions } from "../data";
import {
  connectWallet,
  addIntuitionChain,
  approveProxy,
  ensureUserAtom,
  buildProfileTriples,
  createProfileTriples,
} from "../services/intuition";
import type { WalletConnection } from "../services/intuition";
import { StorageService } from "../services/StorageService";
import { FeeCalculationService, type CostBreakdown } from "../services/FeeCalculationService";

export type WalletStep = "recap" | "wallet" | "connected" | "signing" | "created";

export function useWallet() {
  const [step, setStep] = useState<WalletStep>("recap");
  const [txStatus, setTxStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");
  const [userAtomId, setUserAtomId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletState, setWalletState] = useState<WalletConnection | null>(null);
  const [trustBalance, setTrustBalance] = useState<string | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);

  const cart = useMemo(() => StorageService.loadCart(), []);

  // Extract derived interests from sessions in cart
  const derivedInterests = useMemo(() => {
    const tracks = new Set<string>();
    cart.forEach((id) => {
      if (id.startsWith("interest:")) {
        tracks.add(id.slice(9)); // Remove "interest:" prefix
      }
    });
    return tracks;
  }, [cart]);

  const selectedSessions = useMemo(
    () => sessions.filter((s) => cart.has(s.id)),
    [cart]
  );

  const tripleCount = derivedInterests.size + selectedSessions.length;

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
        await approveProxy(connection.multiVault, connection);
      } catch (approvalErr: unknown) {
        const msg = approvalErr instanceof Error ? approvalErr.message : String(approvalErr);

        // Check if network changed during approval
        const { NetworkGuard } = await import('../services/NetworkGuard');
        if (NetworkGuard.isNetworkChangeError(approvalErr)) {
          setTxError(NetworkGuard.formatNetworkError(approvalErr));
          setTxStatus("");
          return;
        }

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

      // Calculate detailed cost breakdown using service
      if (tripleCount > 0) {
        setTxStatus("Calculating transaction costs...");
        try {
          const breakdown = await FeeCalculationService.calculateTripleCreationCost(
            connection,
            tripleCount
          );
          setCostBreakdown(breakdown);

          // Check if balance is sufficient
          if (bal < breakdown.grandTotal) {
            const deficit = breakdown.grandTotal - bal;
            setTxError(
              `Insufficient $TRUST: You need ${FeeCalculationService.formatTrust(breakdown.grandTotal)} $TRUST ` +
              `but only have ${FeeCalculationService.formatTrust(bal)} $TRUST. ` +
              `Please add ${FeeCalculationService.formatTrust(deficit)} $TRUST to continue.`
            );
          }
        } catch (err) {
          console.error("Cost breakdown failed:", err);
          setTxError("Unable to calculate transaction costs. Please try again.");
        }
        setTxStatus("");
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
      const { proxy, ethers, address, multiVault } = walletState;

      setTxStatus("Checking your atom on Intuition...");
      const atomId = await ensureUserAtom(multiVault, proxy, address, ethers);
      setUserAtomId(atomId);

      const triples = buildProfileTriples(
        atomId,
        [...derivedInterests],
        selectedSessions.map(s => s.id)
      );

      if (triples.length === 0) {
        setTxError("No triples to create.");
        setStep("connected");
        return;
      }

      // Use createProfileTriples with onStep callback for real-time progress updates
      // The service layer (SimulationService, FeeCalculationService, ErrorHandlingService)
      // handles all validation, simulation, and error parsing
      const result = await createProfileTriples(
        walletState,
        triples,
        undefined, // Use default deposit
        (step) => setTxStatus(step) // Real-time progress updates
      );

      setTxHash(result.hash);
      setStep("created");
    } catch (e: unknown) {
      // Error is already formatted by ErrorHandlingService in intuition.ts
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
    userAtomId,
    trustBalance,
    costBreakdown,
    cart,
    derivedInterests,
    selectedSessions,
    tripleCount,
    handleConnect,
    handleCreate,
    addIntuitionChain,
  };
}
