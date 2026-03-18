# EthCC App — Test Cases

> Checklist des scénarios à tester. Chaque section correspond à une feature.

## Tests manuels prioritaires (pour toi)

### Aujourd'hui
1. [ ] **Notification de fin de session** — Lance l'app, attends 3 min, vérifie le toast "Rate this session"
2. [ ] **Onboarding complet** — Refais tout le flow splash → wallet → publish on-chain
3. [ ] **Wallet picker modal** — Step 6 → "Connect Wallet" → vérifie le bottom-sheet (External / Embedded)
4. [ ] **Rating flow** — Session detail → Rate → choisis note → "Add to Cart" → Cart → Publish
5. [ ] **Send $TRUST** — Scan & Send → entre une adresse → envoie un petit montant
6. [ ] **QR scan** — Teste le scan caméra sur mobile si possible

### Quand Push Protocol est en prod
7. [ ] **Meeting point Push** — InvitePage → sélectionne point + personne → "Notify" → vérifie que la notif arrive sur l'autre device
8. [ ] **Session end Push** — Vérifie que la notif "Rate this session" arrive via Push (pas juste le toast local)
9. [ ] **Replay Push** — (quand les liens YouTube seront dispos) Envoyer une notif broadcast avec le lien replay

### Edge cases
10. [ ] **Embedded wallet** — Crée un embedded wallet, rate une session, vérifie la tx
11. [ ] **ENS profile** — Connecte un wallet avec ENS, vérifie GitHub/X sur ProfilePage
12. [ ] **Hard refresh** — Ctrl+Shift+R sur `/home`, `/agenda`, `/vote`, `/profile`, `/send`, `/invite` — aucun crash
13. [ ] **Cart vide** — Vérifie l'affichage "Cart is empty"

---

---

## 1. Onboarding

- [ ] **Splash screen** — L'app démarre sur l'écran splash avec le logo
- [ ] **Slides** — Swipe/next à travers les 3 slides (interests, sessions, vibes)
- [ ] **Sélection interests** — Les tracks sont cliquables, au moins 1 doit être sélectionné pour continuer
- [ ] **Sélection sessions** — Les sessions filtrées par tracks sélectionnés apparaissent, toggle add/remove
- [ ] **Wallet connect** — Le bouton "Connect Wallet" ouvre le wallet picker modal
- [ ] **External wallet** — Clic "External Wallet" ouvre AppKit (MetaMask, WalletConnect, Coinbase)
- [ ] **Embedded wallet — création** — Clic "Create Embedded Wallet", entrer password, wallet généré, écran backup private key affiché
- [ ] **Embedded wallet — backup** — Le bouton "Copy Private Key" copie dans le clipboard
- [ ] **Embedded wallet — continue** — Clic "I've saved it — Continue" connecte le wallet
- [ ] **Embedded wallet — unlock** — Si un embedded wallet existe déjà, le modal propose "Unlock" avec password
- [ ] **QR code** — Après connexion, le QR code affiche l'adresse wallet
- [ ] **Balance** — Le solde $TRUST s'affiche (ou "Waiting for $TRUST...")
- [ ] **Publish on-chain** — Quand solde > 0, le bouton "Publish On-Chain" est actif
- [ ] **Transaction** — La tx crée l'atom utilisateur + dépose sur les interests + crée les triples sessions
- [ ] **PWA Install** — Si le browser supporte `beforeinstallprompt`, le bouton "Install App on Home Screen" apparaît sur l'écran de succès
- [ ] **Success** — L'écran de succès affiche les interests, vibe matches, et lien vers la tx
- [ ] **Enter the App** — Redirige vers `/home`

## 2. Agenda

- [ ] **Affichage** — Les 83 sessions sont affichées, groupées par jour
- [ ] **Filtre par jour** — Les tabs de date filtrent les sessions
- [ ] **Filtre par type** — Les pills Talk/Workshop/Panel/Demo filtrent
- [ ] **Recherche** — La barre de recherche filtre par titre, description, speaker
- [ ] **Session card** — Chaque card affiche : titre, speaker, track, type, horaire
- [ ] **Add to cart** — Clic sur une session l'ajoute au cart (badge Nav5 se met à jour)
- [ ] **Navigation** — Clic sur une card navigue vers `/session/:id`

## 3. Session Detail

- [ ] **Infos** — Titre, speakers, horaire, stage, description, track affichés
- [ ] **Sparkline** — Le graphique de trend s'affiche
- [ ] **Speakers** — Les speakers sont cliquables → `/speaker/:slug`
- [ ] **Add to Cart** — Le bouton bottom bar ajoute/retire du cart
- [ ] **Share** — Le bouton share fonctionne (Web Share API ou clipboard)
- [ ] **Rating section** — Si pas encore noté : CTA "Attended? Tap to rate" cliquable → `/rate/:id`
- [ ] **Rating affiché** — Si déjà noté : affiche la note avec les étoiles + bouton "Edit"
- [ ] **Want replay** — Le toggle "Want to watch the replay?" fonctionne, sauvegarde en localStorage

## 4. Rate Session

- [ ] **Navigation** — Accessible via `/rate/:id` ou depuis SessionDetailPage
- [ ] **Session info** — Titre, speakers, horaire affichés en haut
- [ ] **Étoiles** — Clic sur une étoile sélectionne la note (1-5), clic sur la même déselectionne
- [ ] **Labels** — Le label contextuel change (Not great → Outstanding!)
- [ ] **Résumé** — Le card résumé affiche session, note, "Deposit into N/5 vault (at checkout)"
- [ ] **Add to Cart** — Clic "Add N/5 Rating to Cart" sauvegarde la note dans `ethcc-ratings-pending` + ajoute au cart
- [ ] **Success** — L'écran de succès affiche l'emoji, la note, les boutons "Go to Cart" et "Back to Session"
- [ ] **Session not found** — Si l'ID n'existe pas, message d'erreur affiché

## 5. Cart & Checkout

- [ ] **Sections** — Le cart affiche séparément : Interests, Supported Topics, Sessions, Ratings
- [ ] **Ratings** — Chaque rating affiche la session + la note (N/5) + bouton supprimer
- [ ] **Supprimer rating** — Le bouton trash supprime le rating du pending + retire du cart
- [ ] **Summary** — Le résumé affiche le nombre d'items par catégorie + le coût estimé
- [ ] **Coût réel** — Le coût inclut les fees du proxy Sofia (calculé via `getTotalCreationCost` et `calculateDepositFee`)
- [ ] **Connect wallet** — Si pas connecté, bouton "Connect Wallet to Publish"
- [ ] **Publish** — Le bouton "Validate & Publish On-Chain" exécute dans l'ordre :
  1. Deposit sur les track atoms (interests)
  2. Deposit sur les topic atoms (votes)
  3. Create triples attending (sessions)
  4. DepositBatch sur les rating triple vaults
- [ ] **Ratings on-chain** — Les ratings déposent 0.001 TRUST dans le vault du triple `[Session] --has tag--> [N/5]`
- [ ] **Clear** — Après publish réussi, le cart est vidé + ratings pending supprimés
- [ ] **Cart vide** — Affiche "Cart is empty" avec le message d'aide

## 6. Vote Topics

- [ ] **Trending** — Les topics sont affichés triés par TRUST déposé (données réelles via GraphQL)
- [ ] **My Votes** — Les topics votés sont affichés avec les positions
- [ ] **Discover** — Affiche "[Topic] is [Category]" avec boutons Support/Oppose
- [ ] **Support** — Clic Support connecte MetaMask + stake on-chain
- [ ] **Sparklines** — Les mini-graphiques s'affichent par topic
- [ ] **Navigation** — Clic sur un topic navigue vers `/topic/:id`

## 7. Send $TRUST

- [ ] **Tab QR Code** — Affiche le QR code avec l'adresse wallet
- [ ] **Tab Scan & Send** — Affiche le bouton "Start Camera"
- [ ] **Camera** — Clic "Start Camera" demande l'accès caméra, active le scanner QR
- [ ] **Scan QR** — Scanner un QR code contenant une adresse 0x... la détecte et remplit le champ
- [ ] **Scan again** — Le bouton "Scan again" relance le scanner
- [ ] **Adresse manuelle** — L'input adresse accepte une adresse 0x valide
- [ ] **Validation** — Adresse invalide → message d'erreur rouge
- [ ] **Presets** — Les boutons 5, 10, 50 TRUST fonctionnent
- [ ] **Solde** — Le solde s'affiche après connexion wallet
- [ ] **Solde insuffisant** — Message d'erreur si montant > solde
- [ ] **Envoi** — Clic "Send X TRUST" connecte le wallet, envoie `signer.sendTransaction()`
- [ ] **Succès** — Message vert + tx hash affiché
- [ ] **Tracking** — Le transfer est sauvegardé dans localStorage pour le leaderboard
- [ ] **Annulation** — Si l'utilisateur refuse la tx dans MetaMask → message "Transaction cancelled"

## 8. Meet Up (InvitePage)

- [ ] **Meeting points** — Les 6 points du Palais des Festivals s'affichent
- [ ] **Sélection point** — Clic sur un point le sélectionne (border highlight + check)
- [ ] **Sélection personne** — Les 3 membres de l'équipe s'affichent avec avatars
- [ ] **Bouton** — Le bouton affiche le message dynamique : `Notify {person}: "{point}"`
- [ ] **Envoi** — Clic connecte le wallet, init Push Protocol, envoie la notification
- [ ] **Confirmation** — Banner vert "Notification sent via Push Protocol"
- [ ] **Erreur** — Si pas de wallet → message "Connect a wallet first"
- [ ] **QR code** — Le QR code d'invitation s'affiche en bas

## 9. Notifications (Push Protocol)

- [ ] **Initialisation** — Push s'initialise au chargement si un wallet est en localStorage
- [ ] **Stream** — Les notifications entrantes déclenchent un toast en haut de l'écran
- [ ] **Toast** — Le toast affiche titre + body, auto-dismiss après 5s
- [ ] **Clic toast** — Clic sur le toast le ferme
- [ ] **Meeting point reçu** — Quand quelqu'un envoie "Meet me at...", le toast s'affiche

## 10. Leaderboard

- [ ] **Podium** — Le top 3 s'affiche avec les médailles (or, argent, bronze)
- [ ] **Liste** — Les rangs 4+ s'affichent en liste
- [ ] **Données réelles** — Si des adresses connues existent (via localStorage transfers), le leaderboard fetch les données depuis Blockscout API
- [ ] **Fallback mock** — Si pas de données réelles, le mock s'affiche
- [ ] **PnL** — Le PnL affiché = total $TRUST envoyé (pas financier)
- [ ] **"You" tag** — L'utilisateur connecté a le badge "You"

## 11. Profile

- [ ] **Stats** — Interests, Sessions, Votes, Matches affichés en haut
- [ ] **ENS** — Si l'adresse a un ENS, le nom + liens sociaux s'affichent
- [ ] **Social links** — GitHub (🐙), X (𝕏), Discord (💬), Website (🌐) cliquables
- [ ] **Pas d'ENS** — Message "No ENS profile found"
- [ ] **Embedded wallet** — Bouton "Connect with ENS wallet" visible si embedded wallet
- [ ] **Reconnect ENS** — Clic connecte MetaMask, résout l'ENS de cette adresse
- [ ] **Vibe matches** — La section vibe matches affiche les utilisateurs similaires
- [ ] **Invite** — Le bouton "Invite Nearby Participants" navigue vers `/invite`

## 12. Vibe Profile

- [ ] **Avatar** — Initiales dans le cercle gradient
- [ ] **Nom ENS** — Si l'adresse a un ENS, le nom ENS s'affiche au lieu du mock name
- [ ] **Liens sociaux ENS** — Si l'adresse a des ENS records, les liens s'affichent (GitHub, X, etc.)
- [ ] **Pas d'ENS** — "No ENS socials" affiché
- [ ] **Stats** — Match %, Shared count, Distance affichés
- [ ] **Shared interests** — Les pills d'intérêts partagés s'affichent
- [ ] **Follow on Sofia** — Le bouton ouvre le profil Intuition

## 13. Session End Notifications (scheduling)

> Une session de test est automatiquement créée avec un `endTime` 3 minutes dans le futur.
> Pour changer la date de test : modifier `createTestSession()` dans `sessionNotifService.ts`.

- [ ] **Test session** — Au lancement de l'app, la session test "[TEST] Notification Test Session" est schedulée
- [ ] **Toast local** — ~3 minutes après le lancement, un toast apparaît : "How was [TEST] Notification Test Session?"
- [ ] **Push notification** — Si Push Protocol est initialisé (wallet connecté), une notif Push est aussi envoyée en broadcast
- [ ] **Lien CTA** — La notif Push contient un lien vers `/rate/__test_session__`
- [ ] **Vrais sessions** — Les sessions du jour (si la date match) sont aussi schedulées
- [ ] **Re-check** — Le scheduler re-vérifie toutes les 5 minutes pour les nouvelles sessions
- [ ] **Pas de doublon** — Une session déjà schedulée n'est pas re-schedulée

### Comment tester les notifications quotidiennement

1. Lance l'app (`pnpm dev`)
2. Attends 3 minutes → le toast "Rate this session" doit apparaître
3. Si connecté avec un wallet → vérifie que la notif Push arrive aussi
4. Pour tester avec un endTime différent : modifie `const endMinutes = now.getMinutes() + 3` dans `sessionNotifService.ts`

## 14. PWA

- [ ] **Manifest** — L'app est installable (icône, nom "Sofia", standalone)
- [ ] **Service worker** — Les assets sont cachés pour usage offline
- [ ] **Install prompt** — Sur mobile, le navigateur propose l'installation

## 14. Embedded Wallet

- [ ] **Création** — `ethers.Wallet.createRandom()` génère une paire de clés
- [ ] **Chiffrement** — La private key est chiffrée avec AES-GCM (PBKDF2)
- [ ] **Stockage** — Le wallet chiffré est sauvegardé dans localStorage
- [ ] **Unlock** — Entrer le bon password déchiffre et connecte le wallet
- [ ] **Mauvais password** — Message d'erreur "Wrong password"
- [ ] **Compatibilité** — Le wallet embedded produit un `WalletConnection` compatible avec tous les services
- [ ] **Transactions** — L'embedded wallet peut signer des transactions (deposit, send, etc.)
- [ ] **Fallback dans connectWallet()** — Si pas de `window.ethereum`, l'embedded wallet est proposé via `prompt()`
