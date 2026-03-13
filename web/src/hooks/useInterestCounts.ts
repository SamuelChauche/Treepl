import { useState, useEffect } from "react";
import { GQL_URL } from "../config/constants";
import { TRACK_ATOM_IDS, PREDICATES } from "../intuition";

export function useInterestCounts(topics: Set<string>): Record<string, number> {
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (topics.size === 0) return;
    const trackIds = [...topics]
      .map((t) => TRACK_ATOM_IDS[t])
      .filter(Boolean);
    if (trackIds.length === 0) return;

    const query = `{
      ${trackIds.map((id, i) => `
        t${i}: triples_aggregate(where: {
          predicate: { term_id: { _eq: "${PREDICATES["are interested by"]}" } }
          object: { term_id: { _eq: "${id}" } }
        }) { aggregate { count } }
      `).join("")}
    }`;

    fetch(GQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((r) => r.json())
      .then((res) => {
        const counts: Record<string, number> = {};
        const topicList = [...topics];
        trackIds.forEach((id, i) => {
          const c = res.data?.[`t${i}`]?.aggregate?.count ?? 0;
          const name = topicList.find((t) => TRACK_ATOM_IDS[t] === id);
          if (name) counts[name] = c;
        });
        setInterestCounts(counts);
      })
      .catch(() => {});
  }, [topics]);

  return interestCounts;
}
