/**
 * Hook for the on-chain publish flow during onboarding.
 * Handles atom creation, interest deposits, session triples.
 */

import { useState, useCallback } from "react";
import {
  ensureUserAtom,
  buildProfileTriples,
  createProfileTriples,
} from "../services/intuition";
import { formatTxError } from "../utils/txErrors";
import { StorageService } from "../services/StorageService";
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
      // Step 1: Ensure user atom exists (with nickname pinned to IPFS if provided)
      setTxStatus(nickname.trim() ? "Pinning nickname to IPFS & creating atom..." : "Creating your atom...");
      const atomId = await ensureUserAtom(
        effectiveWallet.multiVault, effectiveWallet.proxy,
        effectiveWallet.address, effectiveWallet.ethers,
        nickname.trim() || undefined
      );

      let lastHash = "";

      // Step 2: Deposit on track atoms for interests
      const { TRACK_ATOM_IDS: trackMap, depositOnAtoms } = await import("../services/intuition");
      const resolvedTrackAtomIds = [...selectedTracks].map((t) => trackMap[t]).filter(Boolean);

      if (resolvedTrackAtomIds.length > 0) {
        setTxStatus(`Depositing on ${resolvedTrackAtomIds.length} interests...`);
        const depositResult = await depositOnAtoms(effectiveWallet, resolvedTrackAtomIds, undefined, setTxStatus);
        lastHash = depositResult.hash;
      }

      // Step 3: Create attending triples for sessions
      const sessionTriples = buildProfileTriples(atomId, [], [...selectedSessions]);
      if (sessionTriples.length > 0) {
        setTxStatus(`Publishing ${sessionTriples.length} session triples...`);
        const tripleResult = await createProfileTriples(
          effectiveWallet.multiVault, effectiveWallet.proxy,
          effectiveWallet.address, sessionTriples, undefined, setTxStatus
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

      // Persist topics — sessions are already in PUBLISHED_SESSIONS, NOT in cart
      StorageService.saveTopics(selectedTracks);

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
