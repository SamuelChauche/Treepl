/**
 * All state + logic for VotePage, extracted for maintainability.
 * The VotePage component becomes a pure render layer.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useWalletConnection } from "./useWalletConnection";
import { useCart } from "./useCart";
import { allTopics, categories } from "../data/topics";
import { CHAIN_CONFIG, STORAGE_KEYS } from "../config/constants";
import { fetchTrendingTopics, fetchAllTopicEvents, type TopicVaultData } from "../services/trendingService";
import { fetchUserVotedTopics, resolveTopicAtomIds } from "../services/voteService";
import type { Web3Category } from "../types";

function loadVotes(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOTES);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveVotes(votes: Set<string>) {
  localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify([...votes]));
}

function loadPublishedVotes(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PUBLISHED_VOTES);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

export type Tab = "trending" | "myvotes" | "discover";
export type VoteState = "support" | "pending" | "supported" | "redeemed";

export function useVoteLogic() {
  const { wallet, connect: openWalletModal } = useWalletConnection();
  const { cart, addToCart, removeFromCart } = useCart();

  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("discover");
  const [userVotes, setUserVotes] = useState<Set<string>>(() => loadVotes());
  const [publishedVotes, setPublishedVotes] = useState<Set<string>>(() => loadPublishedVotes());
  const [discoverIdx, setDiscoverIdx] = useState(0);

  // Sync userVotes with cart
  useEffect(() => {
    setUserVotes((prev) => {
      const cleaned = new Set<string>();
      for (const id of prev) { if (cart.has(id)) cleaned.add(id); }
      if (cleaned.size !== prev.size) { saveVotes(cleaned); return cleaned; }
      return prev;
    });
  }, [cart]);

  // Reload published votes on focus
  useEffect(() => {
    const handleFocus = () => setPublishedVotes(loadPublishedVotes());
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Hydrate from chain
  useEffect(() => {
    const addr = wallet?.address ?? localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
    if (!addr) return;
    fetchUserVotedTopics(addr).then((onChain) => {
      if (onChain.size === 0) return;
      setPublishedVotes((prev) => {
        const merged = new Set([...prev, ...onChain]);
        localStorage.setItem(STORAGE_KEYS.PUBLISHED_VOTES, JSON.stringify([...merged]));
        return merged;
      });
    }).catch(() => {});
  }, [wallet?.address]);

  // Trending data
  const [realTrending, setRealTrending] = useState<TopicVaultData[]>([]);
  const [realChartData, setRealChartData] = useState<Map<string, number[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const hasRealData = realTrending.length > 0;

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTrendingTopics(), fetchAllTopicEvents()])
      .then(([trending, charts]) => { setRealTrending(trending); setRealChartData(charts); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const realDataMap = useMemo(() => {
    const m = new Map<string, TopicVaultData>();
    for (const t of realTrending) m.set(t.topicId, t);
    return m;
  }, [realTrending]);

  // Persist votes
  useEffect(() => { saveVotes(userVotes); }, [userVotes]);

  const categoryMap = useMemo(() => {
    const m = new Map<string, Web3Category>();
    categories.forEach((c) => c.topics.forEach((t) => m.set(t.id, c)));
    return m;
  }, []);

  const trendingTopics = useMemo(() => {
    if (hasRealData) {
      return [...allTopics].sort((a, b) => {
        const aAssets = realDataMap.has(a.id) ? BigInt(realDataMap.get(a.id)!.supportAssets) : 0n;
        const bAssets = realDataMap.has(b.id) ? BigInt(realDataMap.get(b.id)!.supportAssets) : 0n;
        return Number(bAssets - aAssets);
      });
    }
    return [...allTopics];
  }, [hasRealData, realDataMap]);

  const myVotedTopics = useMemo(
    () => allTopics.filter((t) => (userVotes.has(t.id) && cart.has(t.id)) || publishedVotes.has(t.id)),
    [userVotes, publishedVotes, cart]
  );

  const unvotedTopics = useMemo(
    () => allTopics.filter((t) => !publishedVotes.has(t.id) && !(userVotes.has(t.id) && cart.has(t.id))),
    [userVotes, publishedVotes, cart]
  );

  // Redeem
  const [redeemState, setRedeemState] = useState<Set<string>>(new Set());
  const [redeemingTopic, setRedeemingTopic] = useState<string | null>(null);

  const removeVoteLocally = useCallback((topicId: string) => {
    setUserVotes((prev) => { const next = new Set(prev); next.delete(topicId); return next; });
    setPublishedVotes((prev) => {
      const next = new Set(prev); next.delete(topicId);
      localStorage.setItem(STORAGE_KEYS.PUBLISHED_VOTES, JSON.stringify([...next]));
      return next;
    });
    removeFromCart(topicId);
    setRedeemState((prev) => { const next = new Set(prev); next.delete(topicId); return next; });
  }, [removeFromCart]);

  const handleRedeem = useCallback(async (topicId: string) => {
    if (!wallet) { openWalletModal(); return; }
    const { resolved } = resolveTopicAtomIds([topicId]);
    if (resolved.length === 0) { removeVoteLocally(topicId); return; }
    const atomId = resolved[0].atomId;
    setRedeemingTopic(topicId);
    try {
      const shares: bigint = await wallet.multiVault.maxRedeem(wallet.address, atomId, CHAIN_CONFIG.CURVE_ID);
      if (shares === 0n) { removeVoteLocally(topicId); return; }
      const [expectedAssets] = await wallet.multiVault.previewRedeem(atomId, CHAIN_CONFIG.CURVE_ID, shares);
      const minAssets = (expectedAssets * 95n) / 100n;
      const tx = await wallet.multiVault.redeem(wallet.address, atomId, CHAIN_CONFIG.CURVE_ID, shares, minAssets);
      await tx.wait();
      removeVoteLocally(topicId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (!msg.includes("user rejected")) console.warn("[Redeem] Failed:", msg);
    } finally {
      setRedeemingTopic(null);
    }
  }, [wallet, openWalletModal, removeVoteLocally]);

  const getVoteState = useCallback((topicId: string): VoteState => {
    if (redeemState.has(topicId)) return "redeemed";
    if (publishedVotes.has(topicId)) return "supported";
    if (userVotes.has(topicId) && cart.has(topicId)) return "pending";
    return "support";
  }, [userVotes, publishedVotes, cart, redeemState]);

  const handleVoteClick = useCallback((topicId: string) => {
    const state = getVoteState(topicId);
    switch (state) {
      case "support":
        setUserVotes((prev) => { const next = new Set(prev); next.add(topicId); return next; });
        addToCart(topicId);
        break;
      case "pending":
        setUserVotes((prev) => { const next = new Set(prev); next.delete(topicId); return next; });
        removeFromCart(topicId);
        break;
      case "supported":
        setRedeemState((prev) => { const next = new Set(prev); next.add(topicId); return next; });
        break;
      case "redeemed":
        handleRedeem(topicId);
        break;
    }
  }, [getVoteState, addToCart, removeFromCart, handleRedeem]);

  return {
    wallet, openWalletModal, cart, tab, setTab,
    discoverIdx, setDiscoverIdx,
    withdrawing, setWithdrawing,
    userVotes, publishedVotes,
    loading, hasRealData, realDataMap, realChartData,
    categoryMap, trendingTopics, myVotedTopics, unvotedTopics,
    redeemingTopic, getVoteState, handleVoteClick, handleRedeem,
    removeVoteLocally, redeemState,
  };
}
