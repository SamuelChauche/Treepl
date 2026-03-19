import { useState, useEffect, useRef } from "react";
import { GQL_URL } from "../config/constants";
import { TRACK_ATOM_IDS, SESSION_ATOM_IDS, PREDICATES } from "../services/intuition";
import topicGraph from "../../../bdd/web3_topics_graph.json";

const TOPIC_ATOM_IDS = topicGraph.topicAtomIds as Record<string, string>;

export interface VibeMatch {
  subjectTermId: string;
  label: string; // wallet address
  sharedTopics: string[];   // tracks + votes combined
  sharedSessions: string[];
  matchScore: number;        // 0-100 combined score
  trackScore: number;        // 0-100 track match
  voteScore: number;         // 0-100 vote match
  sessionScore: number;      // 0-100 session match
}

/**
 * Find other users who share interests, votes, and sessions.
 * - Interests: read positions on track atom vaults (position-based)
 * - Votes: read positions on topic atom vaults (position-based)
 * - Sessions: read "attending" triples (triple-based)
 */
export function useVibeMatches(
  topics: Set<string>,
  sessionIds: string[],
  walletAddress: string,
  votedTopicIds?: string[]
): { matches: VibeMatch[]; loading: boolean } {
  const [matches, setMatches] = useState<VibeMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const topicsKey = [...topics].sort().join(",");
  const sessionsKey = sessionIds.sort().join(",");
  const votesKey = (votedTopicIds ?? []).sort().join(",");

  useEffect(() => {
    if (fetchedRef.current) return;

    const trackIds = [...topics].map((t) => TRACK_ATOM_IDS[t]).filter(Boolean);
    const voteAtomIds = (votedTopicIds ?? []).map((t) => TOPIC_ATOM_IDS[t]).filter(Boolean);
    const sessAtomIds = sessionIds.map((id) => SESSION_ATOM_IDS[id]).filter(Boolean);

    if (trackIds.length === 0 && voteAtomIds.length === 0 && sessAtomIds.length === 0) return;
    if (!walletAddress) return;

    fetchedRef.current = true;
    setLoading(true);

    // Query positions on track atoms (interests)
    const trackAliases = trackIds
      .map(
        (id, i) => `
        p${i}: positions(where: {
          term_id: { _eq: "${id}" }
          shares: { _gt: "0" }
        }) { account_id shares }`
      )
      .join("");

    // Query positions on topic atoms (votes)
    const voteAliases = voteAtomIds
      .map(
        (id, i) => `
        v${i}: positions(where: {
          term_id: { _eq: "${id}" }
          shares: { _gt: "0" }
        }) { account_id shares }`
      )
      .join("");

    // Query attending triples (sessions)
    const sessionAliases = sessAtomIds
      .map(
        (id, i) => `
        s${i}: triples(where: {
          predicate: { term_id: { _eq: "${PREDICATES["attending"]}" } }
          object: { term_id: { _eq: "${id}" } }
        }) { subject { term_id label } }`
      )
      .join("");

    const query = `{ ${trackAliases} ${voteAliases} ${sessionAliases} }`;

    fetch(GQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((r) => r.json())
      .then((res) => {
        const data = res.data ?? {};
        const topicList = [...topics];
        const voteTopicList = votedTopicIds ?? [];
        const addr = walletAddress.toLowerCase();

        const userMap = new Map<
          string,
          { label: string; tracks: Set<string>; votes: Set<string>; sessions: Set<string> }
        >();

        function ensureUser(id: string, label: string) {
          if (!userMap.has(id)) {
            userMap.set(id, { label, tracks: new Set(), votes: new Set(), sessions: new Set() });
          }
          return userMap.get(id)!;
        }

        // Process positions on track atoms (interests)
        trackIds.forEach((id, i) => {
          const positions = data[`p${i}`] ?? [];
          const topicName = topicList.find((t) => TRACK_ATOM_IDS[t] === id) ?? "";
          for (const pos of positions) {
            const accountId = pos.account_id ?? "";
            if (!accountId) continue;
            const u = ensureUser(accountId.toLowerCase(), accountId);
            u.tracks.add(topicName);
          }
        });

        // Process positions on topic atoms (votes)
        voteAtomIds.forEach((id, i) => {
          const positions = data[`v${i}`] ?? [];
          const topicSlug = voteTopicList.find((t) => TOPIC_ATOM_IDS[t] === id) ?? "";
          for (const pos of positions) {
            const accountId = pos.account_id ?? "";
            if (!accountId) continue;
            const u = ensureUser(accountId.toLowerCase(), accountId);
            u.votes.add(topicSlug);
          }
        });

        // Process attending triples (sessions)
        sessAtomIds.forEach((id, i) => {
          const triples = data[`s${i}`] ?? [];
          const sessId = sessionIds.find((sid) => SESSION_ATOM_IDS[sid] === id) ?? "";
          for (const triple of triples) {
            const u = ensureUser(triple.subject.term_id, triple.subject.label);
            u.sessions.add(sessId);
          }
        });

        // Score per category (0-100), then weighted average
        const totalTracks = topicList.length;
        const totalVotes = voteTopicList.length;
        const totalSessions = sessionIds.length;

        const result: VibeMatch[] = [];
        for (const [id, info] of userMap) {
          if (info.label.toLowerCase() === addr) continue;

          const trackScore = totalTracks > 0
            ? Math.round((info.tracks.size / totalTracks) * 100) : 0;
          const voteScore = totalVotes > 0
            ? Math.round((info.votes.size / totalVotes) * 100) : 0;
          const sessionScore = totalSessions > 0
            ? Math.round((info.sessions.size / totalSessions) * 100) : 0;

          // Weighted average: tracks 40%, votes 35%, sessions 25%
          const weights = { tracks: 0.4, votes: 0.35, sessions: 0.25 };
          // Only count categories that the user actually has items in
          let totalWeight = 0;
          let weightedSum = 0;
          if (totalTracks > 0) { weightedSum += trackScore * weights.tracks; totalWeight += weights.tracks; }
          if (totalVotes > 0) { weightedSum += voteScore * weights.votes; totalWeight += weights.votes; }
          if (totalSessions > 0) { weightedSum += sessionScore * weights.sessions; totalWeight += weights.sessions; }
          const matchScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

          // Skip users with 0 match
          if (matchScore === 0) continue;

          result.push({
            subjectTermId: id,
            label: info.label,
            sharedTopics: [...info.tracks, ...info.votes],
            sharedSessions: [...info.sessions],
            matchScore,
            trackScore,
            voteScore,
            sessionScore,
          });
        }

        result.sort((a, b) => b.matchScore - a.matchScore);
        setMatches(result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsKey, sessionsKey, votesKey, walletAddress]);

  return { matches, loading };
}
