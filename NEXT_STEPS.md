# EthCC App - Next Steps

> Mis à jour le 20 mars 2026.

---

## SEEDING ON-CHAIN — TERMINÉ ✓

| Donnée | On-chain | Status |
|---|---|---|
| Atoms | 513+ (497 + 16 speakers) | ✓ |
| presented at → EthCC[9] | 395 | ✓ |
| has tag | 502+ | ✓ |
| speaking at | 384 (352 + 32) | ✓ |
| Side events | 78 atoms + has tag | ✓ |

---

## RESTE À FAIRE

### Priorité haute — Données

| # | Feature | Effort | Details |
|---|---------|--------|---------|
| 1 | **MAJ sessions.json + speakers.json** | Court | Les atoms et triples sont on-chain. Il faut maintenant remplacer `sessions.json` (83 → 310) et `speakers.json` (278 → 345+) avec les données scrapées. Mettre à jour `intuition_graph.json` avec les nouveaux atom IDs et triples. |
| 2 | **Replays** — notif quand dispo | Moyen | Bloqué par les liens YouTube. Polling `replays.json` prêt côté code. À faire plus tard. |

### Priorité haute — Fonctionnalités

| # | Feature | Effort | Details |
|---|---------|--------|---------|
| 3 | **Push notifications (app fermée)** | Moyen | Notifications locales marchent (toast + Notification API). Implémenter VAPID/FCM pour quand l'app est fermée. Garder le faux event de test. |
| 4 | **Reward program countdown** | Court | Countdown vers le 15 avril sous le titre, s'arrête quand atteint. |

### Bugs UI / UX

| # | Bug | Page | Status |
|---|-----|------|--------|
| ~~5~~ | ~~Opacité bg events onboarding~~ | `OnboardingPage.tsx` | ✓ FIXÉ — `C.surfaceGray` au lieu de `C.surface` |
| ~~6~~ | ~~Notif réception trust token onboarding~~ | `OnboardingPage.tsx` | ✓ FIXÉ — notification quand balance passe de 0 à > 0 |
| ~~7~~ | ~~Supprimer "My Wallet" dans Invite~~ | `InvitePage.tsx` | ✓ FIXÉ — section supprimée |
| ~~8~~ | ~~HomePage bouton state "In cart"~~ | `HomePage.tsx` | ✓ FIXÉ — +, In cart, Published comme Agenda |
| ~~9~~ | ~~Add Interest ajoute sessions au panier~~ | `AgendaPage.tsx` | ✓ FIXÉ — ajoute seulement l'interest |
| ~~10~~ | ~~Profile ne récupère pas l'ENS~~ | `ProfilePage.tsx` | ✓ FIXÉ — lookup toujours tenté, pas bloqué par embedded wallet |
| ~~11~~ | ~~Bg opaque "Find your people"~~ | `VibesListPage.tsx` | ✓ FIXÉ — background opaque `#1a1520` |
| 12 | **SessionDetailPage bell notification** | `SessionDetailPage.tsx` | À TESTER — bouton bell remplace coeur, bulle "replay notification" |

### Questions ouvertes

| # | Question | Contexte |
|---|----------|----------|
| Q3 | **Embedded wallet + backup** — Si l'utilisateur ferme l'app avant de backup sa clé ? | `OnboardingPage.tsx` |

### Tests & QA

| # | Tâche | Effort | Details |
|---|-------|--------|---------|
| 13 | **Tests E2E** | Long | Playwright/Cypress pour les flows complets |
| 14 | **Tester PWA install post-tx** | Court | Vérifier sur mobile Chrome + Safari |
| 15 | **Re-scraper le site EthCC** | Court | Vérifier régulièrement que les 310 sessions sont à jour |

---

## DONNÉES

### On-chain (Intuition Protocol)
- **513+ atoms** : 310 sessions, 345+ speakers, 19 tracks, predicates, event
- **1280+ triples** : 395 presented at, 502+ has tag, 384 speaking at
- **100 topic atoms** pour les votes (web3_topics_graph.json)
- **5 rating atoms** + 415 rating triples (session_ratings_graph.json)
- **78 side events** avec catégories (side_events.json)

### Fichiers locaux (à MAJ)
- `sessions.json` : **83 sessions** → doit passer à **310** (ethcc_scraped_sessions.json prêt)
- `speakers.json` : **278 speakers** → doit passer à **345+** (ethcc_scraped_speakers.json prêt)
- `intuition_graph.json` : **173 atoms, 239 triples** → doit être regénéré avec les nouveaux IDs

### Mock (à remplacer)
- VIBES array (7 users fictifs) → fallback, données réelles via `useVibeMatches` (branché)
- LEADERBOARD (10 users fictifs) → fallback, données réelles via Blockscout API (branché)

---

## ARCHITECTURE

### Services

| Service | Status |
|---|---|
| `intuition.ts` | ✓ MultiVault + Sofia Proxy |
| `embeddedWallet.ts` | ✓ Password à chaque fois |
| `sessionNotifService.ts` | ✓ Toast local + faux event test |
| `notificationService.ts` | ✓ Notification API locale |
| `leaderboardService.ts` | ✓ Blockscout API |
| `ensService.ts` | ✓ ENS text records |
| `voteService.ts` | ✓ + fetchUserVotedTopics (GraphQL) |
| `portfolioService.ts` | ✓ GraphQL positions |
| `trendingService.ts` | ✓ GraphQL trending + events |
| `replayService.ts` | ✓ Polling replays.json (en attente YouTube) |

### On-chain

| Composant | Adresse | Usage |
|---|---|---|
| MultiVault | `0x6E35cF57...` | Reads + approve + redeem |
| Sofia Fee Proxy | `0x26F81d72...` | Writes (createAtoms, createTriples, deposit, depositBatch) |

### Seeding tools
- `Triples/seed.html` — original (83 sessions, MultiVault direct)
- `Triples/seed_new.html` — 310 sessions + side events via Sofia Proxy
- `Triples/seed_final32.html` — 32 derniers speaking at
- `seed_new_data.mjs` — CLI alternative (Node.js)
