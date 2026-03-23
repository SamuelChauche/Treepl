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
| Frontend | React 19, TypeScript 5.8, Vite 6 |
| Routing | react-router-dom v7 |
| On-chain | ethers.js v6, Intuition MultiVault (Chain 1155) |
| Data | Static JSON dataset (83 sessions, 278 speakers, 17 tracks, 8 stages) |
| Style | Dark "Riviera Crypto Festival" theme, glass-morphism, Sora + DM Sans |
| Deployment | GitHub Pages via GitHub Actions |

---

## Quick start

```bash
# Prerequisites: Node.js 18+, bun

cd web
bun install
bun dev         # http://localhost:5173
```

Production build:

```bash
bun run build   # type-check + bundle
bun run preview # serve the build locally
```

---

## Project structure

```
Treepl/
├── bdd/                              # Static data layer
│   ├── sessions.json                 # 83 sessions
│   ├── speakers.json                 # 278 speakers
│   ├── stages.json                   # 8 stages
│   ├── tracks.json                   # 17 tracks
│   ├── daily_schedule.json           # Sessions grouped by day
│   ├── intuition_graph.json          # On-chain atom & triple IDs
│   └── schema.graphql                # Canonical data model
│
├── web/                              # React SPA
│   └── src/
│       ├── main.tsx                  # Router + ErrorBoundary
│       │
│       ├── config/
│       │   └── constants.ts          # Storage keys, colors, chain config, URLs
│       │
│       ├── types/
│       │   └── index.ts              # Session, Speaker, Track interfaces
│       │
│       ├── data/
│       │   └── index.ts              # JSON imports + derived lists
│       │
│       ├── utils/
│       │   ├── date.utils.ts         # Date formatting helpers
│       │   └── session.utils.ts      # Grouping, set toggle helpers
│       │
│       ├── services/
│       │   ├── StorageService.ts     # localStorage abstraction (OOP)
│       │   └── intuition.ts          # Intuition SDK (wallet, atoms, triples)
│       │
│       ├── hooks/
│       │   ├── useCart.ts            # Cart state + persistence
│       │   ├── useSessionFilter.ts   # Filter state + derived data
│       │   ├── useInterestCounts.ts  # GraphQL interest polling
│       │   └── useWallet.ts          # Wallet connection + tx flow
│       │
│       ├── components/
│       │   ├── ui/
│       │   │   └── ErrorBoundary.tsx
│       │   ├── session/
│       │   │   └── SessionCard.tsx   # Glass card with type-colored accent
│       │   ├── toolbar/
│       │   │   └── Toolbar.tsx       # Search + day/type/topic filter pills
│       │   └── profile/
│       │       ├── RecapStep.tsx     # Interests + sessions recap
│       │       ├── WalletStep.tsx    # QR code + wallet connect
│       │       ├── SuccessStep.tsx   # On-chain success view
│       │       └── TransactionSummary.tsx
│       │
│       ├── pages/
│       │   ├── AgendaPage.tsx        # Main layout, session grid
│       │   ├── SpeakerPage.tsx       # Speaker profile & talk timeline
│       │   └── ProfilePage.tsx       # Cart recap, tx preview, MetaMask flow
│       │
│       └── styles/
│           ├── index.css             # Barrel import
│           ├── globals.css           # Tokens, reset, keyframes
│           ├── hero.css              # Hero header
│           ├── toolbar.css           # Toolbar + pills
│           ├── session.css           # Cards + grid
│           ├── speaker.css           # Speaker profile
│           ├── profile.css           # Profile + wallet + tx
│           └── responsive.css        # Media queries
│
└── Triples/                          # On-chain seeding tools (browser + MetaMask)
    ├── seed.html                     # Batch-create all atoms & triples
    ├── fix_missing.html              # Patch missing speaker triples
    └── create_predicates.html        # Create interest/attending predicates
```

---

## Architecture

The app follows a **layered architecture** with clear separation of concerns:

- **Config** — Centralized constants (no magic strings scattered in components)
- **Services** — Business logic classes (`StorageService` for persistence, `intuition.ts` for Web3)
- **Hooks** — State management encapsulated in custom hooks (`useCart`, `useWallet`, `useSessionFilter`, `useInterestCounts`)
- **Components** — Presentational components receiving data via props
- **Pages** — Thin orchestrators that compose hooks + components

---

## User flow

```
┌──────────┐   filter/search   ┌──────────────┐  select sessions  ┌──────────┐
│  Agenda  │ ─────────────────►│ Session Grid │ ──────────────────►│  Cart    │
│  Page    │  day/type/topic   │  (cards)     │   click card       │(localStorage)
└──────────┘                   └──────────────┘                    └────┬─────┘
                                                                        │ "Validate"
     ┌───────────────┐   sign tx    ┌──────────┐   connect    ┌────────▼────┐
     │   Success     │◄────────────│  Wallet  │◄─────────────│   Profile   │
     │  (on-chain!)  │  MetaMask   │  QR/$TRUST│             │   Recap     │
     └───────────────┘             └──────────┘              └─────────────┘
```

---

## Intuition integration

All conference data lives on-chain as **atoms** and **triples** on the Intuition knowledge graph.

| Concept | Count |
|---|---|
| Atoms (sessions, speakers, tracks, predicates) | 173 |
| `has tag` triples (session -> track) | 83 |
| `presented at` triples (speaker -> session) | 83 |
| `speaking at` triples (speaker -> session) | 73 |

**User profile flow:**

```
[Your wallet] ──are interested by──► [DeFi]
[Your wallet] ──are interested by──► [AI & Crypto]
[Your wallet] ──attending──► [Session: "ZK Proofs in Practice"]
[Your wallet] ──attending──► [Session: "MEV Panel"]
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
