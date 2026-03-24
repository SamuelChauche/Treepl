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
import { depositOnAtoms, ensureUserAtom, buildProfileTriples, createProfileTriples, TRACK_ATOM_IDS } from "../services/intuition";
import { resolveTopicAtomIds } from "../services/voteService";
import { StorageService } from "../services/StorageService";
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
    setPendingTopics: (v: string[]) => void,
  ) => {
    setPublishing(true);
    setPublishError("");
    try {
      // 1. Deposit on track atoms (interests)
      const trackAtomIds = topicList.map((t) => TRACK_ATOM_IDS[t]).filter(Boolean);
      if (trackAtomIds.length > 0) {
        setPublishStatus(`Depositing on ${trackAtomIds.length} interests...`);
        await depositOnAtoms(wallet, trackAtomIds);
      }

      // 2. Deposit on topic atoms (votes)
      if (cartTopics.length > 0) {
        const { resolved } = resolveTopicAtomIds(cartTopics.map((t) => t.id));
        if (resolved.length > 0) {
          setPublishStatus(`Depositing on ${resolved.length} topics...`);
          await depositOnAtoms(wallet, resolved.map((r) => r.atomId));
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
          await createProfileTriples(wallet.multiVault, wallet.proxy, wallet.address, triples);
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

      // Move pending topics to published
      try {
        const pending: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_TOPICS) ?? "[]");
        if (pending.length > 0) {
          const existingTopics = StorageService.loadTopics();
          for (const t of pending) existingTopics.add(t);
          StorageService.saveTopics(existingTopics);
          localStorage.removeItem(STORAGE_KEYS.PENDING_TOPICS);
        }
      } catch { /* ignore */ }

      // Clear cart
      clearCart();
      setPendingTopics([]);
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
