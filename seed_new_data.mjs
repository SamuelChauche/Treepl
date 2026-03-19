#!/usr/bin/env node
/**
 * Seed new EthCC[9] sessions, speakers, and tracks to Intuition Protocol.
 *
 * Steps:
 *   1. Diff scraped data vs existing data to find new entities
 *   2. Pin new entities to IPFS via Intuition GraphQL
 *   3. Create atoms on-chain via MultiVault.createAtoms()
 *   4. Create triples on-chain via MultiVault.createTriples()
 *
 * Usage:
 *   node seed_new_data.mjs --private-key 0x... [--dry-run] [--skip-pin] [--skip-atoms] [--skip-triples]
 *
 * RPC: https://rpc.intuition.box/ (no rate limit)
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BDD = path.join(__dirname, "bdd");

// ─── Config ───────────────────────────────────────────────────────

const RPC_URL = "https://rpc.intuition.box/http";
const CHAIN_ID = 1155;
const MULTIVAULT = "0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e";
const GQL_URL = "https://mainnet.intuition.sh/v1/graphql";
const EXPLORER = "https://explorer.intuition.systems";

const EXISTING_PREDICATES = {
  "has tag": "0x7ec36d201c842dc787b45cb5bb753bea4cf849be3908fb1b0a7d067c3c3cc1f5",
  "speaking at": "0xddbdcf95cfac2135b0dfbfa055952b839ce5ee0467a5729eb15f9df250d3cf37",
  "presented at": "0xd565b68b86bbca8c77bfac6c6947ce96046ecf6d23c997c04cb10af7638ac6b6",
  "are interested by": "0x0cdf92bb37466e0954a7ce69e39e5ead44b901cf0d889eeb20ec0f1f2da697e1",
  "attending": "0x8e03485341c3e557be0bf07dcbc9170add35fd436024cf280329c5ceb5a65863",
};

const ABI = [
  "function getAtomCost() view returns (uint256)",
  "function getTripleCost() view returns (uint256)",
  "function calculateAtomId(bytes data) pure returns (bytes32)",
  "function isTermCreated(bytes32 id) view returns (bool)",
  "function createAtoms(bytes[] atomDatas, uint256[] assets) payable returns (bytes32[])",
  "function createTriples(bytes32[] subjectIds, bytes32[] predicateIds, bytes32[] objectIds, uint256[] assets) payable returns (bytes32[])",
];

const ATOM_BATCH_SIZE = 20;
const TRIPLE_BATCH_SIZE = 15;
const PIN_DELAY_MS = 300;
const TX_POLL_MS = 3000;

const STATE_FILE = path.join(BDD, "seed_state.json");

// ─── Helpers ──────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(BDD, file), "utf-8"));
}

// ─── State ────────────────────────────────────────────────────────

let state = {
  pinState: { tracks: {}, sessions: {}, speakers: {} },
  atomIds: { tracks: {}, sessions: {}, speakers: {} },
  tripleIds: [],
};

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    for (const sub of ["tracks", "sessions", "speakers"]) {
      state.pinState[sub] ??= {};
      state.atomIds[sub] ??= {};
    }
    state.tripleIds ??= [];
    const pins = Object.values(state.pinState).reduce((a, v) => a + Object.keys(v).length, 0);
    const atoms = Object.values(state.atomIds).reduce((a, v) => a + Object.keys(v).length, 0);
    console.log(`  Loaded state: ${pins} pins, ${atoms} atoms, ${state.tripleIds.length} triples`);
  }
}

function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Data diffing ─────────────────────────────────────────────────

function loadDiff() {
  const scraped = loadJson("ethcc_scraped_sessions.json");
  const existing = loadJson("sessions.json");
  const graph = loadJson("intuition_graph.json");
  const speakers = loadJson("speakers.json");
  const sideEvents = loadJson("side_events.json");
  const spkData = Array.isArray(speakers) ? speakers : (speakers.speakers || []);

  // What's already on-chain (from intuition_graph.json atoms)
  const atomLabels = new Set(Object.values(graph.atoms || {}));
  const existingTitles = new Set(existing.sessions.map((s) => s.title));
  const existingTracks = new Set(Object.keys(graph.trackAtomIds || {}));

  // Speaker names already in speakers.json OR already on-chain as atoms
  const existingSpeakerNames = new Set(spkData.map((s) => s.name));
  for (const label of atomLabels) {
    existingSpeakerNames.add(label);
  }

  const newSessions = [];
  const newTracks = new Set();
  const newSpeakers = {};

  // New EthCC sessions
  for (const s of scraped.sessions) {
    if (!s.title || existingTitles.has(s.title) || atomLabels.has(s.title)) continue;
    newSessions.push(s);
    const track = s.track || "";
    if (track && !existingTracks.has(track) && !atomLabels.has(track)) newTracks.add(track);
    for (const sp of s.speakers || []) {
      if (!sp.name || existingSpeakerNames.has(sp.name)) continue;
      newSpeakers[sp.name] = sp;
    }
  }

  // Side events
  for (const ev of (sideEvents.events || [])) {
    if (!ev.title || atomLabels.has(ev.title)) continue;
    newSessions.push({ ...ev, isSideEvent: true });
    const track = ev.track || "";
    if (track && !existingTracks.has(track) && !atomLabels.has(track)) newTracks.add(track);
  }

  return { newSessions, newTracks: [...newTracks].sort(), newSpeakers };
}

// ─── IPFS Pinning ─────────────────────────────────────────────────

async function gqlMutation(query) {
  const resp = await fetch(GQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await resp.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function pinThing(name, description = "", image = "", url = "") {
  const q = `mutation { pinThing(thing: { name: ${JSON.stringify(name)}, description: ${JSON.stringify(description)}, image: ${JSON.stringify(image)}, url: ${JSON.stringify(url)} }) { uri } }`;
  const data = await gqlMutation(q);
  return data.pinThing.uri;
}

async function pinPerson(name, description = "", image = "", url = "", email = "", identifier = "") {
  const q = `mutation { pinPerson(person: { name: ${JSON.stringify(name)}, description: ${JSON.stringify(description)}, image: ${JSON.stringify(image)}, url: ${JSON.stringify(url)}, email: ${JSON.stringify(email)}, identifier: ${JSON.stringify(identifier)} }) { uri } }`;
  const data = await gqlMutation(q);
  return data.pinPerson.uri;
}

async function pinAll(newSessions, newTracks, newSpeakers) {
  const total = newTracks.length + newSessions.length + Object.keys(newSpeakers).length;
  let done = 0;

  // Tracks
  for (const track of newTracks) {
    if (state.pinState.tracks[track]) { done++; continue; }
    try {
      const uri = await pinThing(track, `EthCC[9] track: ${track}`);
      state.pinState.tracks[track] = uri;
      done++;
      console.log(`  [${done}/${total}] Pinned track: ${track} -> ${uri}`);
      saveState();
      await sleep(PIN_DELAY_MS);
    } catch (e) {
      console.log(`  ERROR pinning track ${track}: ${e.message}`);
    }
  }

  // Sessions
  for (const s of newSessions) {
    const key = s.id || s.title;
    if (state.pinState.sessions[key]) { done++; continue; }
    try {
      const uri = await pinThing(s.title, s.description || "");
      state.pinState.sessions[key] = uri;
      done++;
      console.log(`  [${done}/${total}] Pinned session: ${s.title.slice(0, 50)}...`);
      saveState();
      await sleep(PIN_DELAY_MS);
    } catch (e) {
      console.log(`  ERROR pinning session: ${e.message}`);
    }
  }

  // Speakers (keyed by name)
  for (const [name, sp] of Object.entries(newSpeakers)) {
    if (state.pinState.speakers[name]) { done++; continue; }
    try {
      const slug = sp.slug || name.toLowerCase().replace(/ /g, "-");
      const uri = await pinPerson(name, sp.organization || "", "", "", "", slug);
      state.pinState.speakers[name] = uri;
      done++;
      console.log(`  [${done}/${total}] Pinned speaker: ${name}`);
      saveState();
      await sleep(PIN_DELAY_MS);
    } catch (e) {
      console.log(`  ERROR pinning speaker ${name}: ${e.message}`);
    }
  }

  console.log(`\n  Pinning complete: ${done}/${total}`);
}

// ─── On-chain operations ──────────────────────────────────────────

async function waitForReceipt(provider, txHash, timeout = 300000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt && receipt.blockNumber) return receipt;
    } catch { /* ignore */ }
    await sleep(TX_POLL_MS);
  }
  throw new Error(`TX ${txHash} not confirmed after ${timeout / 1000}s`);
}

async function createAtomsBatch(wallet, contract, atomCost, entries, dryRun) {
  const toCreate = [];

  for (const entry of entries) {
    const hexData = ethers.hexlify(ethers.toUtf8Bytes(entry.uri));
    const atomId = await contract.calculateAtomId(hexData);
    state.atomIds[entry.category][entry.key] = atomId;

    const exists = await contract.isTermCreated(atomId);
    if (!exists) {
      toCreate.push({ hexData, entry });
    }
  }

  if (toCreate.length === 0) {
    console.log(`    All ${entries.length} atoms already exist — skipped`);
    saveState();
    return;
  }

  const atomDatas = toCreate.map((x) => x.hexData);
  const assets = toCreate.map(() => atomCost);
  const totalValue = atomCost * BigInt(toCreate.length);
  const skipped = entries.length - toCreate.length;

  console.log(`    Creating ${toCreate.length} atoms (${skipped} already exist)...`);
  console.log(`    Cost: ${ethers.formatEther(totalValue)} TRUST`);

  if (dryRun) {
    console.log(`    [DRY RUN] Would create ${toCreate.length} atoms`);
    saveState();
    return;
  }

  const tx = await contract.createAtoms(atomDatas, assets, { value: totalValue });
  console.log(`    TX sent: ${EXPLORER}/tx/${tx.hash}`);
  const receipt = await waitForReceipt(wallet.provider, tx.hash);
  console.log(`    Confirmed block ${receipt.blockNumber}, gas: ${receipt.gasUsed}`);
  saveState();
}

async function createTriplesBatch(wallet, contract, tripleCost, triples, dryRun) {
  const subjectIds = triples.map((t) => t.subjectId);
  const predicateIds = triples.map((t) => t.predicateId);
  const objectIds = triples.map((t) => t.objectId);
  const assets = triples.map(() => tripleCost);
  const totalValue = tripleCost * BigInt(triples.length);

  console.log(`    Creating ${triples.length} triples, cost: ${ethers.formatEther(totalValue)} TRUST`);

  if (dryRun) {
    console.log(`    [DRY RUN] Would create ${triples.length} triples`);
    return;
  }

  const tx = await contract.createTriples(subjectIds, predicateIds, objectIds, assets, { value: totalValue });
  console.log(`    TX sent: ${EXPLORER}/tx/${tx.hash}`);
  const receipt = await waitForReceipt(wallet.provider, tx.hash);
  console.log(`    Confirmed block ${receipt.blockNumber}, gas: ${receipt.gasUsed}`);

  for (const t of triples) {
    state.tripleIds.push({
      subject: t.subjectLabel || t.subjectId,
      predicate: t.predicateLabel || t.predicateId,
      object: t.objectLabel || t.objectId,
      txHash: tx.hash,
    });
  }
  saveState();
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const idx = args.indexOf(name);
    return idx !== -1 ? args[idx + 1] : null;
  };
  const hasFlag = (name) => args.includes(name);

  const privateKey = getArg("--private-key");
  const dryRun = hasFlag("--dry-run");
  const skipPin = hasFlag("--skip-pin");
  const skipAtoms = hasFlag("--skip-atoms");
  const skipTriples = hasFlag("--skip-triples");

  if (!privateKey) {
    console.log("Usage: node seed_new_data.mjs --private-key 0x... [--dry-run] [--skip-pin] [--skip-atoms] [--skip-triples]");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("EthCC[9] Intuition Seeder");
  console.log("=".repeat(60));

  // Load state
  console.log("\n[1] Loading state...");
  loadState();

  // Diff
  console.log("\n[2] Diffing scraped vs existing data...");
  const { newSessions, newTracks, newSpeakers } = loadDiff();
  console.log(`  New sessions: ${newSessions.length}`);
  console.log(`  New tracks: ${newTracks.length} (${newTracks.join(", ")})`);
  console.log(`  New speakers: ${Object.keys(newSpeakers).length}`);

  if (!newSessions.length && !newTracks.length && !Object.keys(newSpeakers).length) {
    console.log("\n  Nothing new to seed!");
    return;
  }

  const totalAtoms = newTracks.length + newSessions.length + Object.keys(newSpeakers).length;
  const totalTriples = newSessions.length * 2 + newSessions.reduce((a, s) => a + (s.speakers?.length || 0), 0);
  console.log(`\n  Estimated: ${totalAtoms} atoms + ${totalTriples} triples`);

  // Pin
  if (!skipPin) {
    console.log("\n[3] Pinning to IPFS...");
    await pinAll(newSessions, newTracks, newSpeakers);
  } else {
    console.log("\n[3] Skipping IPFS pinning");
  }

  // Connect
  console.log("\n[4] Connecting to chain...");
  const provider = new ethers.JsonRpcProvider(RPC_URL, { chainId: CHAIN_ID, name: "Intuition" });
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(MULTIVAULT, ABI, wallet);

  const balance = await provider.getBalance(wallet.address);
  const atomCost = await contract.getAtomCost();
  const tripleCost = await contract.getTripleCost();

  console.log(`  Address: ${wallet.address}`);
  console.log(`  Balance: ${parseFloat(ethers.formatEther(balance)).toFixed(4)} TRUST`);
  console.log(`  Atom cost: ${ethers.formatEther(atomCost)} TRUST`);
  console.log(`  Triple cost: ${ethers.formatEther(tripleCost)} TRUST`);

  const totalCost = atomCost * BigInt(totalAtoms) + tripleCost * BigInt(totalTriples);
  console.log(`  Estimated total cost: ${parseFloat(ethers.formatEther(totalCost)).toFixed(2)} TRUST`);
  if (totalCost > balance) {
    console.log(`  ⚠ WARNING: Insufficient balance! Need ${ethers.formatEther(totalCost)} TRUST`);
  }

  // Create atoms
  if (!skipAtoms) {
    console.log("\n[5] Creating atoms...");
    const entries = [];

    for (const track of newTracks) {
      const uri = state.pinState.tracks[track];
      if (uri) entries.push({ uri, category: "tracks", key: track });
    }
    for (const s of newSessions) {
      const key = s.id || s.title;
      const uri = state.pinState.sessions[key];
      if (uri) entries.push({ uri, category: "sessions", key });
    }
    for (const [name, sp] of Object.entries(newSpeakers)) {
      const uri = state.pinState.speakers[name];
      if (uri) entries.push({ uri, category: "speakers", key: name });
    }

    console.log(`  Total atoms to process: ${entries.length}`);

    for (let i = 0; i < entries.length; i += ATOM_BATCH_SIZE) {
      const batch = entries.slice(i, i + ATOM_BATCH_SIZE);
      const batchNum = Math.floor(i / ATOM_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(entries.length / ATOM_BATCH_SIZE);
      console.log(`\n  Batch ${batchNum}/${totalBatches} (${batch.length} atoms)`);
      await createAtomsBatch(wallet, contract, atomCost, batch, dryRun);
      if (i + ATOM_BATCH_SIZE < entries.length) await sleep(2000);
    }
  } else {
    console.log("\n[5] Skipping atom creation");
  }

  // Create triples
  if (!skipTriples) {
    console.log("\n[6] Creating triples...");

    const graph = loadJson("intuition_graph.json");
    const existingTrackAtoms = graph.trackAtomIds || {};

    // Find event atom
    let eventAtomId = null;
    for (const [tid, label] of Object.entries(graph.atoms || {})) {
      if (label === "EthCC[9]") { eventAtomId = tid; break; }
    }

    const triples = [];

    for (const s of newSessions) {
      const key = s.id || s.title;
      const sessAtomId = state.atomIds.sessions[key];
      if (!sessAtomId) continue;

      const track = s.track || "";
      const trackAtomId = state.atomIds.tracks[track] || existingTrackAtoms[track];

      // Session -> presented at -> EthCC[9]
      if (eventAtomId) {
        triples.push({
          subjectId: sessAtomId, predicateId: EXISTING_PREDICATES["presented at"], objectId: eventAtomId,
          subjectLabel: s.title.slice(0, 40), predicateLabel: "presented at", objectLabel: "EthCC[9]",
        });
      }

      // Session -> has tag -> Track
      if (trackAtomId) {
        triples.push({
          subjectId: sessAtomId, predicateId: EXISTING_PREDICATES["has tag"], objectId: trackAtomId,
          subjectLabel: s.title.slice(0, 40), predicateLabel: "has tag", objectLabel: track,
        });
      }

      // Speaker -> speaking at -> Session
      for (const sp of s.speakers || []) {
        // Lookup by name in state, then in on-chain atoms
        let spkAtomId = state.atomIds.speakers[sp.name];
        if (!spkAtomId) {
          for (const [tid, label] of Object.entries(graph.atoms || {})) {
            if (label === sp.name) { spkAtomId = tid; break; }
          }
        }
        if (spkAtomId) {
          triples.push({
            subjectId: spkAtomId, predicateId: EXISTING_PREDICATES["speaking at"], objectId: sessAtomId,
            subjectLabel: sp.name, predicateLabel: "speaking at", objectLabel: s.title.slice(0, 35),
          });
        }
      }
    }

    const presented = triples.filter((t) => t.predicateLabel === "presented at").length;
    const tagged = triples.filter((t) => t.predicateLabel === "has tag").length;
    const speaking = triples.filter((t) => t.predicateLabel === "speaking at").length;
    console.log(`  Total triples: ${triples.length} (${presented} presented at, ${tagged} has tag, ${speaking} speaking at)`);

    for (let i = 0; i < triples.length; i += TRIPLE_BATCH_SIZE) {
      const batch = triples.slice(i, i + TRIPLE_BATCH_SIZE);
      const batchNum = Math.floor(i / TRIPLE_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(triples.length / TRIPLE_BATCH_SIZE);
      console.log(`\n  Batch ${batchNum}/${totalBatches} (${batch.length} triples)`);
      await createTriplesBatch(wallet, contract, tripleCost, batch, dryRun);
      if (i + TRIPLE_BATCH_SIZE < triples.length) await sleep(2000);
    }
  } else {
    console.log("\n[6] Skipping triple creation");
  }

  console.log("\n" + "=".repeat(60));
  console.log("Done! State saved to", STATE_FILE);
  console.log("=".repeat(60));
}

main().catch((e) => { console.error(e); process.exit(1); });
