/**
 * Hook for the on-chain publish flow during onboarding.
 * Handles atom creation, interest deposits, session triples.
 */

import { useState, useCallback } from "react";
import {
  ensureUserAtom,
  buildProfileTriples,
  createProfileTriples,
  approveProxy,
} from "../services/intuition";
import { formatTxError } from "../utils/txErrors";
import { STORAGE_KEYS } from "../config/constants";
import type { WalletConnection } from "../services/intuition";

export function useOnboardingPublish() {
  const [txState, setTxState] = useState<"idle" | "signing" | "done">("idle");
  const [txHash, setTxHash] = useState("");

  const publish = useCallback(async (
    effectiveWallet: WalletConnection,
    selectedTracks: Set<string>,
    selectedSessions: Set<string>,
    nickname: string,
    callbacks: {
      setTxError: (e: string) => void;
      setTxStatus: (s: string) => void;
      refreshBalance: () => void;
      onSuccess: () => void;
    }
  ) => {
    const { setTxError, setTxStatus, refreshBalance, onSuccess } = callbacks;
    setTxState("signing");
    setTxError("");
    try {
      // Step 0: Approve proxy ONCE for all operations (before any transactions)
      setTxStatus("Approving proxy...");
      try {
        await approveProxy(effectiveWallet.multiVault, effectiveWallet);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);

        // Check if network changed during approval
        const { NetworkGuard } = await import('../services/NetworkGuard');
        if (NetworkGuard.isNetworkChangeError(err)) {
          // Network changed error - throw with clear message
          throw err;
        }

        // Only re-throw if user explicitly rejected
        if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('user denied')) {
          throw new Error('You must approve the proxy to continue. Please accept the approval request in your wallet.');
        }
        // Continue if already approved or other non-blocking errors
        console.log('[useOnboardingPublish] Proxy approval check completed (may already be approved)');
      }

      // Step 1: Ensure user atom exists (with nickname pinned to IPFS if provided)
      setTxStatus(nickname.trim() ? "Pinning nickname to IPFS & creating atom..." : "Creating your atom...");
      const atomId = await ensureUserAtom(
        effectiveWallet.multiVault, effectiveWallet.proxy,
        effectiveWallet.address, effectiveWallet.ethers,
        nickname.trim() || undefined
      );

      let lastHash = "";

      // Step 2: Deposit on track atoms for interests - SKIP approval (already done above)
      const { TRACK_ATOM_IDS: trackMap, depositOnAtoms } = await import("../services/intuition");
      const resolvedTrackAtomIds = [...selectedTracks].map((t) => trackMap[t]).filter(Boolean);

      if (resolvedTrackAtomIds.length > 0) {
        setTxStatus(`Depositing on ${resolvedTrackAtomIds.length} interests...`);
        const depositResult = await depositOnAtoms(effectiveWallet, resolvedTrackAtomIds, undefined, setTxStatus, true); // skipApproval=true
        lastHash = depositResult.hash;
      }

      // Step 3: Create attending triples for sessions
      const sessionTriples = buildProfileTriples(atomId, [], [...selectedSessions]);
      if (sessionTriples.length > 0) {
        setTxStatus(`Publishing ${sessionTriples.length} session triples...`);
        const tripleResult = await createProfileTriples(
          effectiveWallet, sessionTriples, undefined, setTxStatus
        );
        lastHash = tripleResult.hash;
        const published: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]");
        for (const sid of selectedSessions) {
          if (!published.includes(sid)) published.push(sid);
        }
        localStorage.setItem(STORAGE_KEYS.PUBLISHED_SESSIONS, JSON.stringify(published));
      }

      if (!lastHash) {
        setTxError("No interests or sessions selected.");
        setTxState("idle");
        return;
      }

      // Onboarding complete - no need to persist interests separately
      // They will be synced from on-chain positions via profileSync

      setTxHash(lastHash);
      setTxState("done");
      setTimeout(onSuccess, 1000);
    } catch (e: unknown) {
      setTxError(formatTxError(e));
      setTxState("idle");
      refreshBalance();
    }
  }, []);

  return { txState, txHash, publish };
}
