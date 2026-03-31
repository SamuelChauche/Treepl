/**
 * Cart publish logic — extracted from CartPage.
 * Handles the 4-step on-chain publish flow:
 * 1. Deposit on interests (tracks)
 * 2. Deposit on votes (topics)
 * 3. Create session triples
 * 4. Deposit on rating triples
 */

import { useState, useCallback } from "react";
import { CHAIN_CONFIG, STORAGE_KEYS } from "../config/constants";
import { depositOnAtoms, ensureUserAtom, buildProfileTriples, createProfileTriples, TRACK_ATOM_IDS, approveProxy } from "../services/intuition";
import { resolveTopicAtomIds } from "../services/voteService";
import { formatTxError } from "../utils/txErrors";
import type { WalletConnection } from "../services/intuition";
import type { Session } from "../types";

interface RatingEntry {
  session: Session;
  rating: number;
}

export function useCartPublish() {
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState("");
  const [publishDone, setPublishDone] = useState(false);
  const [publishError, setPublishError] = useState("");

  const publish = useCallback(async (
    wallet: WalletConnection,
    topicList: string[],
    cartTopics: { id: string }[],
    cartSessions: Session[],
    cartRatings: RatingEntry[],
    ratingsGraph: { sessionRatingTriples: Record<string, Record<string, { subjectId: string; predicateId: string; objectId: string }>> },
    clearCart: () => void,
  ) => {
    setPublishing(true);
    setPublishError("");
    try {
      // 0. Approve proxy ONCE for all operations (before any transactions)
      setPublishStatus("Approving proxy...");
      try {
        await approveProxy(wallet.multiVault, wallet);
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
        console.log('[useCartPublish] Proxy approval check completed (may already be approved)');
      }

      // 1. Deposit on track atoms (interests) - SKIP approval (already done above)
      const trackAtomIds = topicList.map((t) => TRACK_ATOM_IDS[t]).filter(Boolean);
      if (trackAtomIds.length > 0) {
        setPublishStatus(`Depositing on ${trackAtomIds.length} interests...`);
        await depositOnAtoms(wallet, trackAtomIds, undefined, undefined, true); // skipApproval=true
      }

      // 2. Deposit on topic atoms (votes) - SKIP approval (already done above)
      if (cartTopics.length > 0) {
        const { resolved } = resolveTopicAtomIds(cartTopics.map((t) => t.id));
        if (resolved.length > 0) {
          setPublishStatus(`Depositing on ${resolved.length} topics...`);
          await depositOnAtoms(wallet, resolved.map((r) => r.atomId), undefined, undefined, true); // skipApproval=true
        }
        const pubVotes: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_VOTES) ?? "[]");
        for (const t of cartTopics) { if (!pubVotes.includes(t.id)) pubVotes.push(t.id); }
        localStorage.setItem(STORAGE_KEYS.PUBLISHED_VOTES, JSON.stringify(pubVotes));
      }

      // 3. Create attending triples (sessions)
      if (cartSessions.length > 0) {
        setPublishStatus(`Creating ${cartSessions.length} session triples...`);
        const userAtomId = await ensureUserAtom(wallet.multiVault, wallet.proxy, wallet.address, wallet.ethers);
        const triples = buildProfileTriples(userAtomId, [], cartSessions.map((s) => s.id));
        if (triples.length > 0) {
          await createProfileTriples(wallet, triples);
        }
        const published: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]");
        for (const s of cartSessions) { if (!published.includes(s.id)) published.push(s.id); }
        localStorage.setItem(STORAGE_KEYS.PUBLISHED_SESSIONS, JSON.stringify(published));
      }

      // 4. Deposit on rating triple vaults
      if (cartRatings.length > 0) {
        setPublishStatus(`Depositing ${cartRatings.length} ratings...`);
        const ratingTripleIds: string[] = [];
        for (const { session: s, rating: r } of cartRatings) {
          const tripleData = ratingsGraph.sessionRatingTriples[s.id]?.[String(r)];
          if (tripleData) {
            const tripleId = await wallet.multiVault.calculateTripleId(
              tripleData.subjectId, tripleData.predicateId, tripleData.objectId
            );
            ratingTripleIds.push(tripleId);
          }
        }
        if (ratingTripleIds.length > 0) {
          const depositPerRating = wallet.ethers.parseEther("0.001");
          const n = BigInt(ratingTripleIds.length);
          const totalDeposit = depositPerRating * n;
          const fee: bigint = await wallet.proxy.calculateDepositFee(n, totalDeposit);
          const curveIds = ratingTripleIds.map(() => CHAIN_CONFIG.CURVE_ID);
          const assets = ratingTripleIds.map(() => depositPerRating);
          const minShares = ratingTripleIds.map(() => 0n);
          const tx = await wallet.proxy.depositBatch(
            wallet.address, ratingTripleIds, curveIds, assets, minShares,
            { value: totalDeposit + fee }
          );
          await tx.wait();
        }
      }

      // Clear cart and temporary storage
      clearCart();
      localStorage.removeItem(STORAGE_KEYS.VOTES);
      localStorage.removeItem(STORAGE_KEYS.RATINGS_PENDING);

      setPublishDone(true);
      setPublishStatus("");
    } catch (e: unknown) {
      setPublishError(formatTxError(e));
    } finally {
      setPublishing(false);
    }
  }, []);

  return { publishing, publishStatus, publishDone, publishError, publish };
}
