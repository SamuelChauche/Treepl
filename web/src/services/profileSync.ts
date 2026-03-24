/**
 * Sync on-chain positions back to localStorage.
 *
 * Queries GraphQL for all positions held by a wallet address,
 * then maps them to app-level interests (track names), sessions (session IDs),
 * and votes (topic IDs) using the reverse lookup from local data.
 *
 * This ensures the Profile page shows correct data even if localStorage
 * was cleared or the user published before the persistence fix.
 */

import graphData from "../../../bdd/intuition_graph.json";
import topicGraph from "../../../bdd/web3_topics_graph.json";
import { STORAGE_KEYS } from "../config/constants";
import { GraphQLClient, GET_ACCOUNT_POSITIONS, type GetAccountPositionsQuery } from "@ethcc/graphql";
import { GQL_URL } from "../config/constants";
import { StorageService } from "./StorageService";

const TRACK_ATOM_IDS = graphData.trackAtomIds as Record<string, string>;
const SESSION_ATOM_IDS = graphData.sessionIdToAtomId as Record<string, string>;
const PREDICATES = graphData.predicates as Record<string, string>;
const TOPIC_ATOM_IDS = (topicGraph as { topicAtomIds: Record<string, string> }).topicAtomIds;

// Reverse lookups: atomId → app-level name/id
const ATOM_TO_TRACK = new Map(
  Object.entries(TRACK_ATOM_IDS).map(([name, atomId]) => [atomId, name])
);
const ATOM_TO_SESSION = new Map(
  Object.entries(SESSION_ATOM_IDS).map(([sessionId, atomId]) => [atomId, sessionId])
);
const ATOM_TO_TOPIC = new Map(
  Object.entries(TOPIC_ATOM_IDS).map(([topicId, atomId]) => [atomId, topicId])
);

const ATTENDING_PREDICATE = PREDICATES["attending"];

interface SyncResult {
  interests: string[];
  sessions: string[];
  votes: string[];
}

/**
 * Fetch all on-chain positions for a wallet and map them to app data.
 * Updates localStorage with the results.
 */
export async function syncProfileFromChain(address: string): Promise<SyncResult> {
  if (!address) return { interests: [], sessions: [], votes: [] };

  const client = new GraphQLClient({ endpoint: GQL_URL });
  const data = await client.request<GetAccountPositionsQuery>(
    GET_ACCOUNT_POSITIONS,
    { address: address.toLowerCase(), limit: 200 }
  );
  const positions = data.positions ?? [];

  const interests = new Set<string>();
  const sessionIds = new Set<string>();
  const votes = new Set<string>();
  const publishedSessions: string[] = [];

  for (const pos of positions) {
    const term = pos.vault?.term;
    if (!term) continue;

    if (term.atom) {
      // Atom position — could be interest (track) or vote (topic)
      const atomId = term.atom.term_id;
      const trackName = ATOM_TO_TRACK.get(atomId);
      if (trackName) {
        interests.add(trackName);
        continue;
      }
      const topicId = ATOM_TO_TOPIC.get(atomId);
      if (topicId) {
        votes.add(topicId);
      }
    }

    if (term.triple) {
      const { predicate, object } = term.triple;
      // "attending" triple → session
      if (predicate?.term_id === ATTENDING_PREDICATE && object?.term_id) {
        const sessionId = ATOM_TO_SESSION.get(object.term_id);
        if (sessionId) {
          sessionIds.add(sessionId);
          publishedSessions.push(sessionId);
        }
      }
    }
  }

  // Merge into localStorage (don't overwrite, only add)
  const existingTopics = StorageService.loadTopics();
  for (const t of interests) existingTopics.add(t);
  StorageService.saveTopics(existingTopics);

  // Sessions from chain go to PUBLISHED_SESSIONS only, NOT cart

  // Published sessions
  const existingPublished: string[] = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]"); }
    catch { return []; }
  })();
  for (const s of publishedSessions) {
    if (!existingPublished.includes(s)) existingPublished.push(s);
  }
  localStorage.setItem(STORAGE_KEYS.PUBLISHED_SESSIONS, JSON.stringify(existingPublished));

  // Published votes
  const existingVotes: string[] = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_VOTES) ?? "[]"); }
    catch { return []; }
  })();
  for (const v of votes) {
    if (!existingVotes.includes(v)) existingVotes.push(v);
  }
  localStorage.setItem(STORAGE_KEYS.PUBLISHED_VOTES, JSON.stringify(existingVotes));

  // Remove synced interests from pending topics (they're now published)
  try {
    const pending: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_TOPICS) ?? "[]");
    const stillPending = pending.filter((t) => !interests.has(t));
    if (stillPending.length !== pending.length) {
      localStorage.setItem(STORAGE_KEYS.PENDING_TOPICS, JSON.stringify(stillPending));
    }
  } catch { /* ignore */ }

  return {
    interests: [...interests],
    sessions: [...sessionIds],
    votes: [...votes],
  };
}
