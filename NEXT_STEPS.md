# EthCC App - Next Steps

> Mis à jour le 19 mars 2026.

---

## AUDIT — État actuel

### ✅ Complété (session du 19 mars — bugfix & features)

| Feature | Fichiers clés | Details |
|---|---|---|
| Fix MetaMask popup loop onboarding | `useWalletConnection.ts` | Guard sessionStorage pour éviter chain-switch en boucle sur mobile |
| Balance polling auto | `useWalletConnection.ts` | Refresh toutes les 5s quand solde = 0, arrête quand > 0 |
| Fix modal Add Interest | `AgendaPage.tsx` | position: absolute, fontFamily, scroll uniquement sur la liste, + → ✓ toggle, modal reste ouvert |
| Support button states (Vote) | `VotePage.tsx` | + (rond) → In cart → Supported (vert, après tx) → Redeem (ouvre MetaMask) |
| Redeem on-chain | `VotePage.tsx` | multiVault.redeem() via MetaMask, Withdraw renommé Redeem |
| Scrollbar masquée | `globals.css` | display:none + scrollbar-width:none global |
| Charts réels (GraphQL) | `VotePage.tsx`, `TopicDetailPage.tsx`, `Spark.tsx` | Sparklines connectées aux events on-chain, "No activity yet" si vide |
| Notification améliorée | `App.tsx` | Durée 5s → 15s, clic navigue vers /rate/:sessionId |
| Fix "In cart" fantôme | `VotePage.tsx` | Sync userVotes avec le vrai cart, nettoyage auto |
| Hydratation positions on-chain | `voteService.ts`, `VotePage.tsx` | fetchUserVotedTopics() query GraphQL → publishedVotes |
| Vibe matches + votes | `useVibeMatches.ts` | Inclut maintenant les positions sur topic atoms (votes) en plus des tracks et sessions |
| Want to watch replay bg opaque | `SessionDetailPage.tsx` | Background opaque au lieu de semi-transparent |
| Export atom IDs | `bdd/atom_ids_export.json` | Tous les atom IDs dans un fichier pour l'équipe |
| Queries pour autre app | `queries_for_other_app.ts` | Fonctions prêtes pour récupérer positions/tracks/sessions depuis Privy |

### ✅ Complété (session du 18 mars)

| Feature | Fichiers clés | Details |
|---|---|---|
| Supprimer géolocalisation live | `InvitePage.tsx` | Radar map + watchPosition supprimés |
| Meeting points (remplace InvitePage) | `InvitePage.tsx` | 6 points du Palais des Festivals, sélection personne, envoi notif |
| Toast notifications (App.tsx) | `App.tsx` | Toast local via sessionNotifService scheduler |
| Transfert $TRUST réel | `SendPage.tsx` | `signer.sendTransaction()`, validation solde, gestion erreurs |
| QR scan caméra | `SendPage.tsx` | `html5-qrcode`, getUserMedia, extraction auto adresse 0x |
| PWA Install prompt | `usePwaInstall.ts`, `OnboardingPage.tsx` | Capture `beforeinstallprompt`, bouton dans step 7 |
| Embedded wallet | `embeddedWallet.ts`, `OnboardingPage.tsx` | `Wallet.createRandom()`, AES-GCM chiffrement, backup private key |
| Wallet picker modal | `OnboardingPage.tsx` | Bottom-sheet avec "External Wallet" / "Create Embedded Wallet" |
| Rating sessions (front) | `RateSessionPage.tsx` | Étoiles 1-5, ajout au cart, labels contextuels |
| Rating on-chain (seeding) | `seed_ratings.html`, `session_ratings_graph.json` | 5 atoms schema.org/Rating (IPFS pinned), 415 triples seedés |
| Rating dans le cart | `CartPage.tsx` | Section ratings visible, depositBatch au checkout |
| Rating dans session detail | `SessionDetailPage.tsx` | Section ratings + "Want to watch replay" toggle |
| Leaderboard données réelles | `leaderboardService.ts`, `LeaderboardPage.tsx` | Blockscout API, PnL = $TRUST envoyé, fallback mock |
| Affinités améliorées | `useVibeMatches.ts` | Score Jaccard normalisé (0-100%), inclut tracks + votes + sessions |
| CartPage `estimateFees()` | `CartPage.tsx` | Appel proxy fee calculator avec ratings count |
| Sessions published permanentes | `CartPage.tsx` | Sessions publiées on-chain permanentes |

### ✅ Complété (sessions précédentes)

| Feature | Status |
|---|---|
| Onboarding flow (8 étapes) | DONE |
| Agenda browsable (83 sessions, filtres) | DONE |
| Détail session + speakers | DONE |
| Cart system (localStorage) | DONE |
| Vote topics (100 topics, positions on atom vaults) | DONE |
| Topic detail + vault data | DONE |
| Profil utilisateur + stats + vibe matches | DONE |
| Wallet connect (MetaMask / AppKit / WalletConnect) | DONE |
| On-chain profile (atoms + triples) | DONE |
| Portfolio service (positions, PnL) | DONE |
| Trending topics (GraphQL) | DONE |
| PWA manifest + service worker | DONE |
| Design system (glassmorphism, dark theme) | DONE |

---

## RESTE À FAIRE

### Priorité haute

| # | Feature | Effort | Details |
|---|---------|--------|---------|
| 1 | **Replays** — notif quand dispo | Moyen | Bloqué par les liens YouTube (pas encore publiés). Polling `replays.json` prêt côté code. À faire plus tard. |
| 2 | **Push notifications (app fermée)** | Moyen | Les notifications locales (toast + Notification API) fonctionnent. Il faut implémenter VAPID/FCM pour que ça marche quand l'app est fermée. Garder le faux event de test pour valider. |
| ~~3~~ | ~~**Vérifier PWA install post-tx**~~ | DONE | Flow vérifié : `usePwaInstall` capture `beforeinstallprompt` au mount (step 0), bouton "Install App" affiché en step 7 après tx. OK. |
| 4 | **MAJ données EthCC** | Moyen | Scrape fait le 19/03 : **333 sessions** (vs 83), **345 speakers** (vs 278), **2 nouveaux tracks** (TERSE, Regulation & Compliance). Données dans `bdd/ethcc_scraped_sessions.json` et `bdd/ethcc_scraped_speakers.json`. **BLOQUÉ** : il faut d'abord créer les atoms et triples on-chain pour les ~250 nouvelles sessions + speakers + 2 tracks avant de remplacer `sessions.json` et `speakers.json`. Script de seeding à écrire (type `Triples/seed.html`). |

### Bugs UI / UX

| # | Bug | Page | Details |
|---|-----|------|---------|
| 5 | **Opacité bg events onboarding** | `OnboardingPage.tsx` | Le background des cards d'events dans l'onboarding doit être opaque |
| 6 | **Notif réception trust token onboarding** | `OnboardingPage.tsx` | Afficher une notification quand l'utilisateur reçoit du $TRUST pendant l'onboarding (step 6 wallet) |
| 7 | **Supprimer "My Wallet" dans Invite** | `InvitePage.tsx` | La section My Wallet QR doit être supprimée |
| 8 | **HomePage bouton state "In cart"** | `HomePage.tsx` | Le bouton de session doit afficher "In cart" (même comportement que Agenda/Vote) |
| 9 | **Add Interest ajoute sessions au panier** | `AgendaPage.tsx` | Quand on ajoute un interest, ça met les sessions dans le panier alors que ça devrait ajouter l'interest seulement |
| 10 | **Profile ne récupère pas l'ENS** | `ProfilePage.tsx` | L'ENS n'est pas résolu alors que l'utilisateur en a un |
| 11 | **Bg opaque "Find your people"** | `HomePage.tsx` ou `VibesListPage.tsx` | Le background de la section "Find your people" doit être opaque |

### Priorité moyenne

| # | Feature | Effort | Details |
|---|---------|--------|---------|
| 12 | ~~**Embedded wallet reconnexion auto**~~ | RÉSOLU | Password à chaque fois, pas de session token. |

### Questions ouvertes

| # | Question | Contexte |
|---|----------|----------|
| ~~Q2~~ | ~~**Embedded wallet + reconnexion**~~ | RÉSOLU — password à chaque fois, pas de session token. |
| Q3 | **Embedded wallet + backup** — Si l'utilisateur ferme l'app avant de backup sa clé ? | `OnboardingPage.tsx` |

### Tests & QA

| # | Tâche | Effort | Details |
|---|-------|--------|---------|
| 13 | **Tests E2E** | Long | Playwright/Cypress pour les flows complets |

---

## DONNÉES

### Réelles (prêtes)
- 83 sessions, 278 speakers, 17 tracks (`bdd/`)
- 173 atoms, 239 triples on-chain (`intuition_graph.json`)
- 100 web3 topics, 20 catégories (`web3_topics.json`, `web3_topics_graph.json`)
- **5 rating atoms** (schema.org/Rating, IPFS pinned) + **415 rating triples** (`session_ratings_graph.json`)
- Atom IDs exportés (`bdd/atom_ids_export.json`) pour l'équipe

### Mock (à remplacer)
- VIBES array (7 users fictifs) → fallback, données réelles via `useVibeMatches` (branché)
- LEADERBOARD (10 users fictifs) → fallback, données réelles via Blockscout API (branché)

### Supprimé
- ~~BuyTrustPage~~ — plus de page achat. Distribution manuelle de $TRUST aux users qui redistribuent.

---

## ARCHITECTURE

### Services

| Service | Source de données | Status |
|---|---|---|
| `intuition.ts` | MultiVault + Sofia Proxy (Chain 1155) | DONE |
| `embeddedWallet.ts` | localStorage (AES-GCM chiffré) | DONE |
| `sessionNotifService.ts` | Session end toast scheduler | DONE |
| `notificationService.ts` | Notification API (local) | DONE |
| `leaderboardService.ts` | Blockscout API | DONE |
| `ensService.ts` | ENS text records resolution | DONE |
| `voteService.ts` | MultiVault vaults + GraphQL positions | DONE |
| `portfolioService.ts` | GraphQL positions | DONE |
| `trendingService.ts` | GraphQL trending + events | DONE |
| `replayService.ts` | Polling `replays.json` | DONE (en attente des liens YouTube) |
| `StorageService.ts` | localStorage | DONE |

### On-chain

| Composant | Adresse | Usage |
|---|---|---|
| MultiVault | `0x6E35cF57...` | Reads + approve + redeem |
| Sofia Fee Proxy | `0x26F81d72...` | Writes (createAtoms, createTriples, deposit, depositBatch) |

### Vote system
- Pas de triples — positions directes sur les atom vaults des 100 topics
- User identifié par sa position (shares) dans le vault de l'atom
- Atom "I" (`0x7ab197b...`) non utilisé pour les votes (pattern abandonné)
- Matches vibes : basés sur tracks (positions) + topics (positions) + sessions (triples attending)

### Rating on-chain
- 5 atoms : `1/5` à `5/5` (context: schema.org, type: Rating, pinned IPFS)
- Prédicat : `has tag` (`0x7ec36d...`)
- Triples : `[Session] --has tag--> [N/5]` (415 triples, seedés via `seed_ratings.html`)
- Rating = deposit dans le vault du triple correspondant
- User identifié par sa position dans le vault
