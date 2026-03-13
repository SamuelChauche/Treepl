# EthCC[9] Agenda & On-Chain Profile

> **Cannes, March 30 – April 2, 2026**

A conference companion app for [EthCC\[9\]](https://ethcc.io) that lets attendees browse the full agenda, pick sessions, select topics of interest, and publish their profile on-chain via the [Intuition Protocol](https://intuition.systems).

---

## What it does

1. **Browse** — Explore 83 sessions across 17 tracks, filter by day / topic / type, search by keyword or speaker
2. **Curate** — Add sessions to your personal cart and pick topics that match your interests
3. **Commit on-chain** — One-click MetaMask flow creates your profile as triples on Intuition's knowledge graph (L3, Chain 1155)
4. **Discover** — See how many other attendees share your interests in real-time via Intuition's GraphQL API

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Routing | react-router-dom v7 |
| On-chain | ethers.js v6, Intuition MultiVault (Chain 1155) |
| Data | Static JSON dataset (83 sessions, 278 speakers, 17 tracks, 8 stages) |
| Style | Dark "Riviera Crypto Festival" theme, glass-morphism, Sora + DM Sans |

---

## Quick start

```bash
# Prerequisites: Node.js 18+, pnpm

cd web
pnpm install
pnpm dev        # http://localhost:5173
```

Production build:

```bash
pnpm build      # type-check + bundle
pnpm preview    # serve the build locally
```

---

## Project structure

```
ethccagenda/
├── bdd/                          # Static data layer
│   ├── sessions.json             # 83 sessions
│   ├── speakers.json             # 278 speakers
│   ├── stages.json               # 8 stages
│   ├── tracks.json               # 17 tracks
│   ├── daily_schedule.json       # Sessions grouped by day
│   ├── intuition_graph.json      # On-chain atom & triple IDs
│   └── schema.graphql            # Canonical data model
│
├── web/                          # React SPA
│   └── src/
│       ├── App.tsx               # Main layout, day tabs, filters, session grid
│       ├── App.css               # Full theme & animations
│       ├── SessionCard.tsx       # Glass card with type-colored accent
│       ├── FilterBar.tsx         # Horizontal pill-chip filters
│       ├── SpeakerPage.tsx       # Speaker profile & talk timeline
│       ├── ProfilePage.tsx       # Cart recap, tx preview, MetaMask flow
│       ├── intuition.ts          # Intuition SDK (wallet, atoms, triples)
│       ├── data.ts               # JSON imports & derived lists
│       └── types.ts              # TypeScript interfaces
│
└── Triples/                      # On-chain seeding tools (browser + MetaMask)
    ├── seed.html                 # Batch-create all atoms & triples
    └── fix_missing.html          # Patch missing speaker triples
```

---

## Intuition integration

All conference data lives on-chain as **atoms** and **triples** on the Intuition knowledge graph.

| Concept | Count |
|---|---|
| Atoms (sessions, speakers, tracks, predicates) | 173 |
| `has tag` triples (session → track) | 83 |
| `presented at` triples (speaker → session) | 83 |
| `speaking at` triples (speaker → session) | 73 |

**User profile flow:**

```
[Your wallet] ──are interested by──▶ [DeFi]
[Your wallet] ──are interested by──▶ [AI & Crypto]
[Your wallet] ──attending──▶ [Session: "ZK Proofs in Practice"]
[Your wallet] ──attending──▶ [Session: "MEV Panel"]
```

All triples are created in a single batch transaction on Chain 1155 ($TRUST).

| Key | Value |
|---|---|
| Contract | `0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e` |
| Chain ID | 1155 |
| Native token | $TRUST |
| GraphQL | `https://mainnet.intuition.sh/v1/graphql` |

---

## License

MIT
