# EthCC App - Next Steps

> Mis à jour le 18 mars 2026 — audit post-implémentation.

---

## AUDIT — État actuel

### ✅ Complété (session du 18 mars)

| Feature | Fichiers clés | Details |
|---|---|---|
| Supprimer géolocalisation live | `InvitePage.tsx` | Radar map + watchPosition supprimés |
| Meeting points (remplace InvitePage) | `InvitePage.tsx` | 6 points du Palais des Festivals, sélection personne, envoi notif |
| Toast notifications (App.tsx) | `App.tsx` | Toast local via sessionNotifService scheduler, auto-dismiss 5s |
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
| Affinités améliorées | `useVibeMatches.ts` | Score Jaccard normalisé (0-100%) au lieu de count brut |
| Tracking transfers | `SendPage.tsx` | Sauvegarde dans localStorage pour leaderboard |
| CartPage `estimateFees()` | `CartPage.tsx` | DONE — Appel proxy fee calculator avec ratings count |
| Sessions published permanentes | `CartPage.tsx` | Sessions publiées on-chain sont permanentes (ethcc-published-sessions dans localStorage). Impossible de décocher. |
| Socials on mock vibes | `VibeProfilePage.tsx` | DONE — Socials affichés sur les profils vibes mock |
| VibeProfilePage refonte | `VibeProfilePage.tsx` | DONE — Follow/Share supprimés, remplacés par "Send $TRUST" |
| Opaque backgrounds | Composants divers | DONE — Backgrounds opaques pour les éléments texte |

### ✅ Complété (sessions précédentes)

| Feature | Status |
|---|---|
| Onboarding flow (8 étapes) | DONE |
| Agenda browsable (83 sessions, filtres) | DONE |
| Détail session + speakers | DONE |
| Cart system (localStorage) | DONE |
| Vote topics (100+ topics, Support/Oppose on-chain) | DONE |
| Topic detail + vault data | DONE |
| Profil utilisateur + stats + vibe matches | DONE |
| Wallet connect (MetaMask / AppKit / WalletConnect) | DONE |
| On-chain profile (atoms + triples) | DONE |
| Portfolio service (positions, PnL) | DONE (service prêt) |
| Trending topics (GraphQL) | DONE |
| PWA manifest + service worker | DONE |
| Design system (glassmorphism, dark theme) | DONE |

---

## RESTE À FAIRE

### Priorité haute

| # | Feature | Effort | Details |
|---|---------|--------|---------|
| 1 | **Replays** — notif quand dispo | Moyen | Les replays seront publiés sur YouTube ~5 jours après l'événement. On n'a pas encore les liens. Quand les liens seront dispos : ajouter `replayUrl` aux sessions, notifier les users qui avaient cliqué "Want to watch replay", avec le lien YouTube. Bloqué par les liens YouTube. Polling `replays.json`. |
| 2 | **Service Worker native notifs** | Moyen | Notifications natives via Service Worker pour les sessions à venir |

### Priorité moyenne

| # | Feature | Effort | Details |
|---|---------|--------|---------|
| ~~4~~ | ~~**ProfilePage OAuth**~~ | DONE | Remplacé par ENS text records (GitHub, X, Discord, Website). Résolution auto sur ProfilePage + VibeProfilePage. Bouton "Connect with ENS wallet" pour embedded wallet users. |

### Questions ouvertes

| # | Question | Contexte |
|---|----------|----------|
| ~~Q1~~ | ~~**Skip onboarding**~~ | RÉSOLU — `handleComplete` set maintenant le flag `ethcc-onboarded`. |
| Q2 | **Embedded wallet + reconnexion** — Quand l'utilisateur relance l'app avec un embedded wallet, comment le reconnecter automatiquement ? Demander le password à chaque lancement ? Ou garder une session ? | `embeddedWallet.ts`, `App.tsx` |
| Q3 | **Embedded wallet + onboarding** — Si l'utilisateur crée un embedded wallet pendant l'onboarding, que se passe-t-il s'il ferme l'app avant de backup sa clé ? | `OnboardingPage.tsx` |
| ~~Q4~~ | ~~**PWA Install**~~ — RÉSOLU : le bouton dans step 7 suffit, avec explication. | `OnboardingPage.tsx` |

### Tests & QA

| # | Tâche | Effort | Details |
|---|-------|--------|---------|
| ~~7~~ | ~~**Setup Vitest**~~ | DONE | Vitest + @testing-library/react configurés |
| ~~8~~ | ~~**Tests unitaires services**~~ | DONE | embeddedWallet, leaderboardService, voteService, portfolioService |
| ~~9~~ | ~~**Tests unitaires hooks**~~ | DONE | useCart, usePwaInstall, useVibeMatches |
| ~~10~~ | ~~**Use cases manuels (.md)**~~ | DONE | Checklist des scénarios à tester manuellement (onboarding, rating, send, meeting points) |
| 11 | **Tests E2E** | Long | Playwright/Cypress pour les flows complets |

---

## DONNÉES

### Réelles (prêtes)
- 83 sessions, 278 speakers, 17 tracks (`bdd/`)
- 173 atoms, 239 triples on-chain (`intuition_graph.json`)
- 100+ web3 topics, 20 catégories (`web3_topics.json`)
- 32+ topic atom IDs on-chain (`web3_topics_graph.json`)
- **5 rating atoms** (schema.org/Rating, IPFS pinned) + **415 rating triples** (`session_ratings_graph.json`)

### Mock (à remplacer)
- VIBES array (7 users fictifs) → utilisé en fallback, données réelles via `useVibeMatches`
- LEADERBOARD (10 users fictifs) → utilisé en fallback, données réelles via Blockscout API
- BuyTrustPage prix "$0.42" → API prix réel

---

## ARCHITECTURE

### Services

| Service | Source de données | Status |
|---|---|---|
| `intuition.ts` | MultiVault + Sofia Proxy (Chain 1155) | DONE |
| `embeddedWallet.ts` | localStorage (AES-GCM chiffré) | DONE |
| `sessionNotifService.ts` | Session end toast scheduler | DONE |
| `leaderboardService.ts` | Blockscout API | DONE |
| `ensService.ts` | ENS text records resolution | DONE |
| `voteService.ts` | MultiVault vaults | DONE |
| `portfolioService.ts` | GraphQL positions | DONE |
| `trendingService.ts` | GraphQL trending | DONE |
| `StorageService.ts` | localStorage | DONE |

### On-chain

| Composant | Adresse | Usage |
|---|---|---|
| MultiVault | `0x6E35cF57...` | Reads + existence checks |
| Sofia Fee Proxy | `0x26F81d72...` | Writes (createAtoms, createTriples, deposit, depositBatch) |

### Rating on-chain
- 5 atoms : `1/5` à `5/5` (context: schema.org, type: Rating, pinned IPFS)
- Prédicat : `has tag` (`0x7ec36d...`)
- Triples : `[Session] --has tag--> [N/5]` (415 triples, seedés via `seed_ratings.html`)
- Rating = deposit dans le vault du triple correspondant
- User identifié par sa position dans le vault
