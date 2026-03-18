import { useState, useEffect, useRef } from "react";
import { GQL_URL } from "../config/constants";
import { TRACK_ATOM_IDS, SESSION_ATOM_IDS, PREDICATES } from "../services/intuition";

export interface VibeMatch {
  subjectTermId: string;
  label: string; // wallet address
  sharedTopics: string[];
  sharedSessions: string[];
  matchScore: number;
}

/**
 * Find other users who share interests and sessions.
 * - Interests: read positions on track atom vaults (position-based)
 * - Sessions: read "attending" triples (triple-based, kept as-is)
 */
export function useVibeMatches(
  topics: Set<string>,
  sessionIds: string[],
  walletAddress: string
): { matches: VibeMatch[]; loading: boolean } {
  const [matches, setMatches] = useState<VibeMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const topicsKey = [...topics].sort().join(",");
  const sessionsKey = sessionIds.sort().join(",");

  useEffect(() => {
    if (fetchedRef.current) return;

    const trackIds = [...topics].map((t) => TRACK_ATOM_IDS[t]).filter(Boolean);
    const sessAtomIds = sessionIds.map((id) => SESSION_ATOM_IDS[id]).filter(Boolean);

    if ((trackIds.length === 0 && sessAtomIds.length === 0) || !walletAddress) return;

    fetchedRef.current = true;
    setLoading(true);

    // Query positions on track atoms (interests = who deposited on this atom)
    const positionAliases = trackIds
      .map(
        (id, i) => `
        p${i}: positions(where: {
          atom: { term_id: { _eq: "${id}" } }
          shares: { _gt: "0" }
        }) { account { id } shares }`
      )
      .join("");

    // Query attending triples (sessions = kept as triples)
    const sessionAliases = sessAtomIds
      .map(
        (id, i) => `
        s${i}: triples(where: {
          predicate: { term_id: { _eq: "${PREDICATES["attending"]}" } }
          object: { term_id: { _eq: "${id}" } }
        }) { subject { term_id label } }`
      )
      .join("");

    const query = `{ ${positionAliases} ${sessionAliases} }`;

    fetch(GQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((r) => r.json())
      .then((res) => {
        const data = res.data ?? {};
        const topicList = [...topics];
        const addr = walletAddress.toLowerCase();

        const userMap = new Map<
          string,
          { label: string; topics: Set<string>; sessions: Set<string> }
        >();

        function ensureUser(id: string, label: string) {
          if (!userMap.has(id)) {
            userMap.set(id, { label, topics: new Set(), sessions: new Set() });
          }
          return userMap.get(id)!;
        }

        // Process positions on track atoms (interests)
        trackIds.forEach((id, i) => {
          const positions = data[`p${i}`] ?? [];
          const topicName = topicList.find((t) => TRACK_ATOM_IDS[t] === id) ?? "";
          for (const pos of positions) {
            const accountId = pos.account?.id ?? "";
            if (!accountId) continue;
            const u = ensureUser(accountId.toLowerCase(), accountId);
            u.topics.add(topicName);
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

        // Convert to array, exclude current user, sort by similarity score
        const totalUserTopics = topicList.length;
        const totalUserSessions = sessionIds.length;
        const totalItems = totalUserTopics + totalUserSessions;

        const result: VibeMatch[] = [];
        for (const [id, info] of userMap) {
          if (info.label.toLowerCase() === addr) continue;
          // Jaccard-like similarity: shared / union
          const shared = info.topics.size + info.sessions.size;
          const otherTotal = info.topics.size + info.sessions.size; // what we know about them
          const union = totalItems + otherTotal - shared;
          const similarity = union > 0 ? Math.round((shared / union) * 100) : 0;
          result.push({
            subjectTermId: id,
            label: info.label,
            sharedTopics: [...info.topics],
            sharedSessions: [...info.sessions],
            matchScore: similarity, // now 0-100 percentage
          });
        }

        result.sort((a, b) => b.matchScore - a.matchScore);
        setMatches(result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsKey, sessionsKey, walletAddress]);

  return { matches, loading };
}
