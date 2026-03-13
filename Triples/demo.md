# EthCC[9] x Intuition — Démo Triples

## Atoms (entités créées sur Intuition)

Chaque atom est pinné sur IPFS via les mutations `pinThing`/`pinPerson`/`pinOrganization` et possède un `term_id` unique (bytes32).

### Event
| Atom | Type | Description |
|------|------|-------------|
| `EthCC[9]` | Thing | Ethereum Community Conference, Cannes, 30 mars - 2 avril 2026 |

### Tracks (topics)
| Atom | Type | Description |
|------|------|-------------|
| `DeFi` | Thing | Decentralized Finance |
| `AI Agents and Automation` | Thing | AI & Automation |
| `Core Protocol` | Thing | Ethereum Core Protocol |
| `Cypherpunk & Privacy` | Thing | Privacy / Cryptography |
| `Layer 2s` | Thing | Layer 2 Scaling |

### Sessions
| Atom | Type | Description |
|------|------|-------------|
| `DeFi's hidden risk stack` | Thing | Mapping real DeFi risk stack — 30 mars, Kelly Stage |
| `Building the Financial Layer 1 for Trillions Onchain` | Thing | Pharos bridging TradFi — 30 mars, Redford Stage |
| `The State of Ethereum L2s` | Thing | Ed Felten sur les L2s |
| `Privacy as a Public Good` | Thing | Adrian Brink, Cypherpunk track |
| `AI Agents in DeFi: Risks and Opportunities` | Thing | Devon Martens, AI Agents track |

### Speakers
| Atom | Type | Description |
|------|------|-------------|
| `Julien Bouteloup` | Person | Rekt — DeFi track |
| `Ed Felten` | Person | Offchain Labs — Layer 2s track |
| `Adrian Brink` | Person | Namada — Cypherpunk & Privacy track |
| `Justin Drake` | Person | Ethereum Foundation — Block Fighters |
| `Ambre Soubiran` | Person | Kaiko — DeFi track |

### Users (wallets connectés)
| Atom | Encoding |
|------|----------|
| `0xA1b2...C3d4` | Adresse directe |
| `0xE5f6...G7h8` | Adresse directe |

### Prédicats

| Atom | Type | term_id | Status | Usage |
|------|------|---------|--------|-------|
| `has tag` | Keywords | `0x7ec3...` | **Existe** (51 746 triples) | Lier une session/speaker à un tag |
| `attending` | Thing | `0x8e03...` | **Existe** (2 triples) | Lier un user à une session |
| `follow` | FollowAction | `0xffd0...` | **Existe** (1 225 triples) | Follow entre users |
| `is` | Thing | `0xdd43...` | **Existe** (432 triples) | Classification |
| `are interested by` | Thing | `0x0cdf...` | **Existe** (7 triples) | Lier un user à un topic |
| `speaking at` | Thing | — | **A créer** (pinThing) | Lier un speaker à une session |
| `presented at` | Thing | — | **A créer** (pinThing) | Lier une session à l'event EthCC[9] |

> **Note :** `is interested in` existe (56 triples) mais en TextObject (legacy, pas pinné IPFS).
> `are interested by` existe en Thing (canonique, 7 triples) — c'est le bon à réutiliser.
> Alternative : créer un nouveau prédicat pinné `interested in` (Thing) pour plus de clarté.

---

## Triples — Le graphe de connaissances

Un triple = `(Sujet, Prédicat, Objet)`. Chaque triple a un vault où on peut déposer du $TRUST pour signaler son accord.

---

### 1. Programme de l'événement — `(Session, scheduled at, EthCC[9])`

> - `presented at` — la session fait partie du programme de l'événement

| # | Sujet | Prédicat | Objet |
|---|-------|----------|-------|
| 1 | `DeFi's hidden risk stack` | **presented at** | `EthCC[9]` |
| 2 | `Building the Financial Layer 1 for Trillions Onchain` | **presented at** | `EthCC[9]` |
| 3 | `The State of Ethereum L2s` | **presented at** | `EthCC[9]` |
| 4 | `Privacy as a Public Good` | **presented at** | `EthCC[9]` |
| 5 | `AI Agents in DeFi: Risks and Opportunities` | **presented at** | `EthCC[9]` |

> Ces 83 triples forment une **liste Intuition** visible sur le portail :
> `https://portal.intuition.systems/explore/list/{scheduled_at_term_id}-{ethcc9_term_id}`

---

### 2. Catégorisation — `(Session, has tag, Track)`

On réutilise le prédicat canonique `has tag` (51 746 triples, term_id `0x7ec3...`).

| # | Sujet | Prédicat | Objet |
|---|-------|----------|-------|
| 1 | `DeFi's hidden risk stack` | **has tag** | `DeFi` |
| 2 | `Building the Financial Layer 1 for Trillions Onchain` | **has tag** | `DeFi` |
| 3 | `The State of Ethereum L2s` | **has tag** | `Layer 2s` |
| 4 | `Privacy as a Public Good` | **has tag** | `Cypherpunk & Privacy` |
| 5 | `AI Agents in DeFi: Risks and Opportunities` | **has tag** | `AI Agents and Automation` |

> Chaque combinaison `has tag` + Track crée aussi une **liste** :
> `https://portal.intuition.systems/explore/list/{has_tag_term_id}-{defi_term_id}`
> → Toutes les sessions taguées DeFi apparaissent dans cette liste !

---

### 3. Speakers — `(Speaker, speaking at, Session)`

Prédicat `speaking at` à créer (pinThing).

| # | Sujet | Prédicat | Objet |
|---|-------|----------|-------|
| 1 | `Julien Bouteloup` | **speaking at** | `DeFi's hidden risk stack` |
| 2 | `Ed Felten` | **speaking at** | `The State of Ethereum L2s` |
| 3 | `Adrian Brink` | **speaking at** | `Privacy as a Public Good` |
| 4 | `Justin Drake` | **speaking at** | `Block Fighters Round 1` |
| 5 | `Ambre Soubiran` | **speaking at** | `Institutional DeFi Adoption` |

> Déposer du $TRUST ici = renforcer la crédibilité d'un speaker sur ce sujet.

---

### 4. Intérêts utilisateur — `(User, are interested by, Track)`

**Le coeur du use case.** Quand un user sélectionne ses topics, on crée ces triples.
On réutilise le prédicat canonique `are interested by` (Thing, term_id `0x0cdf...`).

| # | Sujet | Prédicat | Objet |
|---|-------|----------|-------|
| 1 | `0xA1b2...C3d4` | **are interested by** | `DeFi` |
| 2 | `0xA1b2...C3d4` | **are interested by** | `AI Agents and Automation` |
| 3 | `0xA1b2...C3d4` | **are interested by** | `Layer 2s` |
| 4 | `0xE5f6...G7h8` | **are interested by** | `DeFi` |
| 5 | `0xE5f6...G7h8` | **are interested by** | `Cypherpunk & Privacy` |

> Déposer du $TRUST = quantifier la force de l'intérêt.
> Alice met 0.5 TRUST sur DeFi, 0.1 sur Layer 2s → elle est surtout DeFi.

---

### 5. Participation — `(User, attending, Session)`

On réutilise le prédicat canonique `attending` (Thing, term_id `0x8e03...`).

| # | Sujet | Prédicat | Objet |
|---|-------|----------|-------|
| 1 | `0xA1b2...C3d4` | **attending** | `DeFi's hidden risk stack` |
| 2 | `0xA1b2...C3d4` | **attending** | `AI Agents in DeFi: Risks and Opportunities` |
| 3 | `0xE5f6...G7h8` | **attending** | `DeFi's hidden risk stack` |
| 4 | `0xE5f6...G7h8` | **attending** | `Privacy as a Public Good` |
| 5 | `0xE5f6...G7h8` | **attending** | `The State of Ethereum L2s` |

> Alice et Bob vont tous les deux à "DeFi's hidden risk stack" → match !
> Le vault de cette session accumule du $TRUST → signal de popularité on-chain.

---

## Listes Intuition (le résultat final)

Chaque combinaison unique `(prédicat, objet)` crée automatiquement une **liste** sur le portail Intuition. L'URL est :
```
https://portal.intuition.systems/explore/list/{predicate_term_id}-{object_term_id}
```

Lists generated by the triples above:

### Lists by topic — "Who is interested in what?"

| List | Predicate | Object | Content | URL |
|------|-----------|--------|---------|-----|
| DeFi Enthusiasts | `are interested by` | `DeFi` | Alice, Bob | `.../list/{are_interested_by_id}-{defi_id}` |
| AI Agents Enthusiasts | `are interested by` | `AI Agents and Automation` | Alice | `.../list/{are_interested_by_id}-{ai_agents_id}` |
| Layer 2s Enthusiasts | `are interested by` | `Layer 2s` | Alice | `.../list/{are_interested_by_id}-{layer2s_id}` |
| Privacy Enthusiasts | `are interested by` | `Cypherpunk & Privacy` | Bob | `.../list/{are_interested_by_id}-{privacy_id}` |
| Core Protocol Enthusiasts | `are interested by` | `Core Protocol` | ... | `.../list/{are_interested_by_id}-{core_id}` |

> **This is where matching happens.**
> Open the "DeFi Enthusiasts" list → see all users who declared this interest.
> The more $TRUST a user deposited, the stronger their interest signal (economic signal).

### Lists by session — "Who is attending what?"

| List | Predicate | Object | Content |
|------|-----------|--------|---------|
| Attendees "DeFi's hidden risk stack" | `attending` | `DeFi's hidden risk stack` | Alice, Bob |
| Attendees "AI Agents in DeFi" | `attending` | `AI Agents in DeFi...` | Alice |
| Attendees "Privacy as a Public Good" | `attending` | `Privacy as a Public Good` | Bob |
| Attendees "State of Ethereum L2s" | `attending` | `The State of Ethereum L2s` | Bob |
| Attendees "Financial Layer 1" | `attending` | `Building the Financial...` | ... |

### Structural lists — EthCC program

| List | Predicate | Object | Content |
|------|-----------|--------|---------|
| EthCC[9] Program | `presented at` | `EthCC[9]` | 83 sessions |
| DeFi Sessions | `has tag` | `DeFi` | 14 sessions |
| AI Sessions | `has tag` | `AI Agents and Automation` | 5 sessions |
| Privacy Sessions | `has tag` | `Cypherpunk & Privacy` | 6 sessions |
| L2 Sessions | `has tag` | `Layer 2s` | 5 sessions |

---

## Le graphe complet

```
                         ┌──────────────┐
                         │   EthCC[9]   │
                         └──────▲───────┘
                                │
                          presented at
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │  Session A  │      │  Session B  │      │  Session C  │
   │  (DeFi risk)│      │  (L2 state) │      │  (Privacy)  │
   └──▲──────▲───┘      └──▲──────▲───┘      └──▲──────▲───┘
      │      │              │      │              │      │
  has tag  speaking at  has tag  speaking at  has tag  speaking at
      │      │              │      │              │      │
  ┌──────┐ ┌────────┐  ┌───────┐ ┌────────┐  ┌────────┐ ┌────────┐
  │ DeFi │ │Julien B│  │Layer2s│ │Ed Felt.│  │Privacy │ │Adrian B│
  └──▲───┘ └────────┘  └───▲───┘ └────────┘  └───▲────┘ └────────┘
     │                     │                      │
  are interested by     are interested by      are interested by
     │                     │                      │
  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │  LISTE DeFi      │  │  LISTE Layer2s   │  │  LISTE Privacy   │
  │  - 0xAlice ✓     │  │  - 0xAlice ✓     │  │  - 0xBob ✓       │
  │  - 0xBob ✓       │  │                  │  │                  │
  │  → MATCH !       │  │                  │  │                  │
  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Flow utilisateur complet

```
1. User connecte wallet → 0xA1b2...C3d4

2. Sélectionne topics :  ☑ DeFi  ☑ AI Agents  ☐ Layer 2s  ☐ Privacy ...
   → Crée triples : (0xA1b2, are interested by, DeFi)
                     (0xA1b2, are interested by, AI Agents)

3. Voit sessions filtrées, sélectionne :  ☑ DeFi's hidden risk stack  ☑ AI Agents in DeFi
   → Crée triples : (0xA1b2, attending, DeFi's hidden risk stack)
                     (0xA1b2, attending, AI Agents in DeFi)

4. Profil créé ! Visible sur les listes Intuition :
   → https://portal.intuition.systems/explore/list/{interested_by}-{defi_id}
   → https://portal.intuition.systems/explore/list/{attending}-{session_id}

5. Matching : "D'autres personnes intéressées par DeFi :"
   → Query la liste DeFi → Bob aussi !
   → Propose : "Bob partage 1 intérêt avec toi (DeFi) et va aussi à DeFi's hidden risk stack"

6. Follow : (0xA1b2, follow, 0xE5f6) — prédicat canonique existant (1225 triples)
```

---

## Coût estimé

| Opération | Quantité | Coût unitaire | Total |
|-----------|----------|---------------|-------|
| Atoms (seed) | ~380 (1 event + 17 tracks + 83 sessions + 278 speakers + 2 prédicats) | atomCost | ~0.19 TRUST |
| Triples (seed) | ~180 (83 presented at + 83 has tag + speakers) | tripleCost | ~0.18 TRUST |
| Triples (par user) | ~5-10 (intérêts + sessions) | tripleCost | ~0.01 TRUST/user |
| **Total seed** | | | **~0.4 TRUST** |

> Les coûts exacts dépendent de `getAtomCost()` et `getTripleCost()` au moment de l'exécution.
> Le gas sur L3 est negligeable (~0.0001 TRUST/tx).
