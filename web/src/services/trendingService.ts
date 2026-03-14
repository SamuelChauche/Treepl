import { GQL_URL } from "../config/constants";
import topicGraph from "../../../bdd/web3_topics_graph.json";

const TOPIC_ATOM_IDS = topicGraph.topicAtomIds as Record<string, string>;
const SUPPORTS_PREDICATE = topicGraph.predicates.supports;

// ─── Types ───────────────────────────────────────────

export interface TopicVaultData {
  topicId: string;
  atomId: string;
  label: string;
  /** Support vault (for) — total TRUST deposited */
  supportAssets: string;
  supportCount: number;
  /** Oppose vault (against) — total TRUST deposited */
  opposeAssets: string;
  opposeCount: number;
  /** Net sentiment: support - oppose */
  netAssets: string;
}

export interface TopicPosition {
  address: string;
  shares: string;
  depositedAt: string;
}

export interface TopicEvent {
  type: "deposit" | "redemption";
  amount: string;
  timestamp: string;
  sender: string;
}

// ─── Fetch trending data for all topics ──────────────

export async function fetchTrendingTopics(): Promise<TopicVaultData[]> {
  const atomIds = Object.values(TOPIC_ATOM_IDS);
  if (atomIds.length === 0) return [];

  // Query triples where predicate = "supports" and object = topic atom
  // Get vault data for each triple
  const query = `{
    triples(
      where: {
        predicate: { term_id: { _eq: "${SUPPORTS_PREDICATE}" } }
        object: { term_id: { _in: [${atomIds.map((id) => `"${id}"`).join(",")}] } }
      }
    ) {
      object {
        term_id
        label
      }
      term {
        vaults {
          total_assets
          position_count
        }
      }
      counter_term {
        vaults {
          total_assets
          position_count
        }
      }
    }
  }`;

  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  const triples = json.data?.triples ?? [];

  // Map atom IDs back to topic IDs
  const atomToTopic = new Map(
    Object.entries(TOPIC_ATOM_IDS).map(([k, v]) => [v, k])
  );

  // Aggregate by topic (multiple triples per topic = multiple voters)
  const aggregated = new Map<string, TopicVaultData>();

  for (const t of triples) {
    const atomId = t.object.term_id;
    const topicId = atomToTopic.get(atomId);
    if (!topicId) continue;

    const existing = aggregated.get(topicId);
    const vault = t.term?.vaults?.[0];
    const counterVault = t.counter_term?.vaults?.[0];
    const support = vault?.total_assets ?? "0";
    const supportCount = vault?.position_count ?? 0;
    const oppose = counterVault?.total_assets ?? "0";
    const opposeCount = counterVault?.position_count ?? 0;

    if (existing) {
      existing.supportAssets = (BigInt(existing.supportAssets) + BigInt(support)).toString();
      existing.supportCount += supportCount;
      existing.opposeAssets = (BigInt(existing.opposeAssets) + BigInt(oppose)).toString();
      existing.opposeCount += opposeCount;
      existing.netAssets = (BigInt(existing.supportAssets) - BigInt(existing.opposeAssets)).toString();
    } else {
      aggregated.set(topicId, {
        topicId,
        atomId,
        label: t.object.label,
        supportAssets: support,
        supportCount,
        opposeAssets: oppose,
        opposeCount,
        netAssets: (BigInt(support) - BigInt(oppose)).toString(),
      });
    }
  }

  return Array.from(aggregated.values()).sort(
    (a, b) => Number(BigInt(b.supportAssets) - BigInt(a.supportAssets))
  );
}

// ─── Fetch voters for a specific topic ───────────────

export async function fetchTopicVoters(
  topicId: string
): Promise<TopicPosition[]> {
  const atomId = TOPIC_ATOM_IDS[topicId];
  if (!atomId) return [];

  const query = `{
    triples(
      where: {
        predicate: { term_id: { _eq: "${SUPPORTS_PREDICATE}" } }
        object: { term_id: { _eq: "${atomId}" } }
      }
    ) {
      subject {
        label
      }
      positions(order_by: { shares: desc }) {
        account {
          id
          label
        }
        shares
      }
    }
  }`;

  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  const triples = json.data?.triples ?? [];

  const positions: TopicPosition[] = [];
  for (const t of triples) {
    for (const p of t.positions ?? []) {
      positions.push({
        address: p.account?.id ?? p.account?.label ?? "unknown",
        shares: p.shares ?? "0",
        depositedAt: "",
      });
    }
  }

  return positions;
}

// ─── Fetch deposit events for a topic (chart data) ───

export async function fetchTopicEvents(
  topicId: string
): Promise<TopicEvent[]> {
  const atomId = TOPIC_ATOM_IDS[topicId];
  if (!atomId) return [];

  const query = `{
    triples(
      where: {
        predicate: { term_id: { _eq: "${SUPPORTS_PREDICATE}" } }
        object: { term_id: { _eq: "${atomId}" } }
      }
    ) {
      term {
        vaults {
          events(order_by: { block_timestamp: asc }) {
            type
            sender {
              id
            }
            assets
            block_timestamp
          }
        }
      }
    }
  }`;

  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  const triples = json.data?.triples ?? [];

  const events: TopicEvent[] = [];
  for (const t of triples) {
    for (const e of t.term?.vaults?.[0]?.events ?? []) {
      events.push({
        type: e.type === "Deposited" ? "deposit" : "redemption",
        amount: e.assets ?? "0",
        timestamp: e.block_timestamp ?? "",
        sender: e.sender?.id ?? "",
      });
    }
  }

  return events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

// ─── Convert events to cumulative chart data ─────────

/**
 * Convert raw events into a cumulative total-assets series for sparklines.
 * Returns an array of numbers representing the running total over time.
 */
export function eventsToChartData(events: TopicEvent[]): number[] {
  if (events.length === 0) return [];
  let cumulative = 0;
  const data: number[] = [];
  for (const e of events) {
    const amt = Number(e.amount) / 1e18;
    if (e.type === "deposit") cumulative += amt;
    else cumulative -= amt;
    if (cumulative < 0) cumulative = 0;
    data.push(cumulative);
  }
  return data;
}

// ─── Batch fetch events for multiple topics ──────────

export async function fetchAllTopicEvents(): Promise<Map<string, number[]>> {
  const atomIds = Object.values(TOPIC_ATOM_IDS);
  if (atomIds.length === 0) return new Map();

  const query = `{
    triples(
      where: {
        predicate: { term_id: { _eq: "${SUPPORTS_PREDICATE}" } }
        object: { term_id: { _in: [${atomIds.map((id) => `"${id}"`).join(",")}] } }
      }
    ) {
      object { term_id }
      term {
        vaults {
          events(order_by: { block_timestamp: asc }) {
            type
            assets
            block_timestamp
          }
        }
      }
    }
  }`;

  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  const triples = json.data?.triples ?? [];

  const atomToTopic = new Map(
    Object.entries(TOPIC_ATOM_IDS).map(([k, v]) => [v, k])
  );

  const eventsMap = new Map<string, TopicEvent[]>();
  for (const t of triples) {
    const atomId = t.object?.term_id;
    const topicId = atomToTopic.get(atomId);
    if (!topicId) continue;

    const existing = eventsMap.get(topicId) ?? [];
    for (const e of t.term?.vaults?.[0]?.events ?? []) {
      existing.push({
        type: e.type === "Deposited" ? "deposit" : "redemption",
        amount: e.assets ?? "0",
        timestamp: e.block_timestamp ?? "",
        sender: "",
      });
    }
    eventsMap.set(topicId, existing);
  }

  // Sort and convert to chart data
  const chartMap = new Map<string, number[]>();
  for (const [topicId, events] of eventsMap) {
    events.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    chartMap.set(topicId, eventsToChartData(events));
  }

  return chartMap;
}

// ─── Fetch "like-minded" — users who voted on same topics ──

export async function fetchLikeMinded(
  userAddress: string
): Promise<{ address: string; commonTopics: string[]; count: number }[]> {
  // Sanitize address — must be a valid hex address
  const sanitized = userAddress.replace(/[^a-fA-F0-9x]/g, "").toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(sanitized)) return [];

  // First get all topics this user voted on
  const query = `{
    triples(
      where: {
        predicate: { term_id: { _eq: "${SUPPORTS_PREDICATE}" } }
        subject: { label: { _ilike: "${sanitized}" } }
      }
    ) {
      object {
        term_id
        label
      }
    }
  }`;

  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  const userTopics = (json.data?.triples ?? []).map(
    (t: { object: { term_id: string } }) => t.object.term_id
  );

  if (userTopics.length === 0) return [];

  // Then find other users who voted on any of these topics
  const query2 = `{
    triples(
      where: {
        predicate: { term_id: { _eq: "${SUPPORTS_PREDICATE}" } }
        object: { term_id: { _in: [${userTopics.map((id: string) => `"${id}"`).join(",")}] } }
        subject: { label: { _nilike: "${sanitized}" } }
      }
    ) {
      subject {
        label
      }
      object {
        label
      }
    }
  }`;

  const res2 = await fetch(GQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: query2 }),
  });
  const json2 = await res2.json();
  const otherVotes = json2.data?.triples ?? [];

  // Aggregate by user
  const byUser = new Map<string, string[]>();
  for (const t of otherVotes) {
    const addr = t.subject?.label ?? "";
    if (!addr) continue;
    const topics = byUser.get(addr) ?? [];
    topics.push(t.object?.label ?? "");
    byUser.set(addr, topics);
  }

  return Array.from(byUser.entries())
    .map(([address, commonTopics]) => ({
      address,
      commonTopics,
      count: commonTopics.length,
    }))
    .sort((a, b) => b.count - a.count);
}
