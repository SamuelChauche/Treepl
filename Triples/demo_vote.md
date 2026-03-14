# Web3 Vote — Demo Calldata Intuition

## Résumé

On étend le graphe Intuition existant (173 atoms, 239 triples) avec :
- **100 nouveaux atoms** (topics web3) à seeder
- **1 nouveau predicate** : `"supports"` pour le vote
- Des **triples de vote** créés par chaque utilisateur

---

## 1. Atoms à créer (topics web3)

Chaque topic devient un atom sur Intuition. L'atom est créé avec `createAtoms()` sur le MultiVault.

### Calldata : `createAtoms(bytes[] atomDatas, uint256[] assets)`

```
Batch 1 — DeFi (5 atoms)
─────────────────────────────────────────────────────────────────
atomDatas[0] = ethers.toUtf8Bytes("Lending & Borrowing")
atomDatas[1] = ethers.toUtf8Bytes("Automated Market Makers")
atomDatas[2] = ethers.toUtf8Bytes("MEV (Maximal Extractable Value)")
atomDatas[3] = ethers.toUtf8Bytes("Uniswap")
atomDatas[4] = ethers.toUtf8Bytes("Aave")

assets[0..4] = atomCost  (chacun)

→ TX: contract.createAtoms(atomDatas, assets, { value: atomCost * 5 })
→ Retourne: bytes32[5] (les 5 atom IDs déterministes)
```

```
Batch 2 — NFTs (5 atoms)
─────────────────────────────────────────────────────────────────
atomDatas[0] = ethers.toUtf8Bytes("Generative Art")
atomDatas[1] = ethers.toUtf8Bytes("Soulbound Tokens (SBTs)")
atomDatas[2] = ethers.toUtf8Bytes("Music NFTs")
atomDatas[3] = ethers.toUtf8Bytes("Zora")
atomDatas[4] = ethers.toUtf8Bytes("Art Blocks")

→ TX: contract.createAtoms(atomDatas, assets, { value: atomCost * 5 })
```

**Total : 20 batches × 5 atoms = 100 atoms = 20 transactions**

### Coût estimé

```
atomCost ≈ 0.0005 TRUST (varie selon le contrat)
100 atoms × 0.0005 = ~0.05 TRUST
Gas L3 ≈ negligible
```

---

## 2. Predicate à créer : `"supports"`

Un seul atom à créer pour le nouveau predicate de vote.

```javascript
// Calldata
const predicateData = ethers.toUtf8Bytes("supports");
const hexData = ethers.hexlify(predicateData);

// Vérifier s'il existe déjà
const atomId = await contract.calculateAtomId(hexData);
const exists = await contract.isTermCreated(atomId);

// Si non, créer
if (!exists) {
  const tx = await contract.createAtoms(
    [hexData],
    [atomCost],
    { value: atomCost }
  );
  await tx.wait();
}

// → supportsPredicateId = atomId
// Sauvegarder dans web3_topics_graph.json
```

---

## 3. Triples de vote (par utilisateur)

Quand un user vote sur un topic, on crée un triple :

```
Subject:   User Atom (0xWallet)
Predicate: "supports" (supportsPredicateId)
Object:    Topic Atom (ex: "Lending & Borrowing")
```

### Calldata : `createTriples()` via SofiaFeeProxy

```javascript
// User vote pour 3 topics d'un coup (batch)
const subjectIds   = [userAtomId, userAtomId, userAtomId];
const predicateIds = [supportsId, supportsId, supportsId];
const objectIds    = [lendingAtomId, mevAtomId, uniswapAtomId];
const assets       = [deposit, deposit, deposit]; // 0.001 TRUST chacun

// Calcul du coût total
const tripleCost = await multiVault.getTripleCost();
const n = 3n;
const totalDeposit = deposit * n;
const multiVaultCost = (tripleCost * n) + totalDeposit;
const totalCost = await proxy.getTotalCreationCost(n, totalDeposit, multiVaultCost);

// 1 seule transaction pour 3 votes
const tx = await proxy.createTriples(
  userAddress,     // receiver
  subjectIds,
  predicateIds,
  objectIds,
  assets,
  1,               // curveId (linear)
  { value: totalCost }
);
```

### Coût par vote

```
tripleCost  ≈ 0.001 TRUST  (protocol fee)
deposit     = 0.001 TRUST   (into vault — recoverable)
proxy fee   ≈ ~1-5%
─────────────────────────────
Total/vote  ≈ 0.002 TRUST + proxy fee

Batch 3 votes = ~0.006 TRUST + 1 gas fee
Batch 10 votes = ~0.02 TRUST + 1 gas fee
```

---

## 4. Amplifier un vote existant (deposit)

Si le triple existe déjà, on dépose plus de $TRUST dans son vault :

```javascript
// Le triple (user → supports → Uniswap) existe déjà
// Son termId = 0xabc123...

const tx = await proxy.deposit(
  userAddress,     // receiver
  0xabc123,        // triple termId (vault ID)
  depositAmount,   // ex: 0.01 TRUST pour un vote fort
  1,               // curveId
  { value: totalCost }
);
```

---

## 5. Lire les votes (GraphQL) — trending

### Top topics les plus votés

```graphql
{
  triples(
    where: {
      predicate: { term_id: { _eq: "<supports_predicate_id>" } }
    }
    order_by: { vault: { total_assets: desc } }
    limit: 20
  ) {
    term_id
    object {
      term_id
      label
    }
    vault {
      total_assets
      position_count
    }
  }
}
```

**Résultat attendu :**
```json
[
  { "object": { "label": "Uniswap" },       "vault": { "total_assets": "5200000000000000000", "position_count": 42 } },
  { "object": { "label": "ZK Rollups" },     "vault": { "total_assets": "3100000000000000000", "position_count": 28 } },
  { "object": { "label": "AI Agents On-chain" }, "vault": { "total_assets": "2800000000000000000", "position_count": 35 } },
  { "object": { "label": "DePIN" },          "vault": { "total_assets": "1500000000000000000", "position_count": 19 } },
  { "object": { "label": "Memecoins" },      "vault": { "total_assets": "1200000000000000000", "position_count": 67 } }
]
```

### Votes d'un utilisateur spécifique

```graphql
{
  triples(
    where: {
      predicate: { term_id: { _eq: "<supports_predicate_id>" } }
      subject: { term_id: { _eq: "<user_atom_id>" } }
    }
  ) {
    object {
      term_id
      label
    }
    vault {
      total_assets
      position_count
    }
  }
}
```

### Combien de personnes supportent un topic donné

```graphql
{
  triples_aggregate(
    where: {
      predicate: { term_id: { _eq: "<supports_predicate_id>" } }
      object: { term_id: { _eq: "<topic_atom_id>" } }
    }
  ) {
    aggregate {
      count
    }
  }
}
```

---

## 6. Le graphe résultant

```
                              ┌────────────────┐
                              │   EthCC[9]     │
                              └───────▲────────┘
                                      │ presented at
                 ┌────────────────────┼─────────────────────┐
                 │                    │                      │
          ┌──────────────┐    ┌──────────────┐     ┌──────────────┐
          │ Session DeFi │    │ Session L2s  │     │ Session AI   │
          └──▲───────▲───┘    └──▲───────▲───┘     └──▲───────▲───┘
             │       │           │       │            │       │
          has tag  speaking at  has tag  speaking at  has tag  speaking at
             │       │           │       │            │       │
          ┌──────┐ ┌────────┐ ┌──────┐ ┌────────┐ ┌──────┐ ┌────────┐
          │ DeFi │ │Speaker │ │ L2s  │ │Speaker │ │  AI  │ │Speaker │
          └──────┘ └────────┘ └──────┘ └────────┘ └──────┘ └────────┘

  ═══════════════════════════════════════════════════════════════════
  NOUVEAU : Topics web3 votables
  ═══════════════════════════════════════════════════════════════════

     ┌──────────────┐  supports  ┌──────────────────────────┐
     │  0xAlice     │──────────→ │ Lending & Borrowing      │ vault: 0.5 TRUST
     │  (user atom) │──────────→ │ ZK Rollups               │ vault: 0.3 TRUST
     │              │──────────→ │ AI Agents On-chain        │ vault: 0.1 TRUST
     └──────────────┘            └──────────────────────────┘

     ┌──────────────┐  supports  ┌──────────────────────────┐
     │  0xBob       │──────────→ │ Lending & Borrowing      │ vault: +0.2 TRUST (= 0.7 total)
     │  (user atom) │──────────→ │ Memecoins                │ vault: 0.5 TRUST
     │              │──────────→ │ DePIN                    │ vault: 0.1 TRUST
     └──────────────┘            └──────────────────────────┘

  TRENDING (par vault total):
  ━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. 🏆 Lending & Borrowing  — 0.7 TRUST (2 voters)
  2.    Memecoins            — 0.5 TRUST (1 voter)
  3.    ZK Rollups           — 0.3 TRUST (1 voter)
  4.    AI Agents On-chain   — 0.1 TRUST (1 voter)
  5.    DePIN                — 0.1 TRUST (1 voter)
```

---

## 7. Résumé des transactions

### Seeding (une seule fois, admin)

| Étape | Fonction | Quantité | Coût estimé |
|-------|----------|----------|-------------|
| Créer predicate `"supports"` | `createAtoms([...])` | 1 atom | ~0.0005 TRUST |
| Créer topics batch 1-20 | `createAtoms([...])` | 100 atoms (20 tx) | ~0.05 TRUST |
| **Total seeding** | | **101 atoms, 20 tx** | **~0.05 TRUST** |

### Par utilisateur (à chaque vote)

| Action | Fonction | Coût/vote |
|--------|----------|-----------|
| Premier vote sur un topic | `proxy.createTriples(...)` | ~0.002 TRUST |
| Amplifier un vote existant | `proxy.deposit(...)` | deposit amount + fee |
| Batch vote (N topics) | `proxy.createTriples(...)` | ~0.002 × N TRUST (1 tx) |

---

## 8. Fichiers à générer après seeding

### `bdd/web3_topics_graph.json`

```json
{
  "predicates": {
    "supports": "0x<supports_term_id>"
  },
  "topicAtomIds": {
    "defi-lending": "0x<atom_id>",
    "defi-amm": "0x<atom_id>",
    "defi-mev": "0x<atom_id>",
    "defi-uniswap": "0x<atom_id>",
    "defi-aave": "0x<atom_id>",
    "nfts-generative-art": "0x<atom_id>",
    "...": "..."
  }
}
```

Ce fichier est importé dans l'app React comme `intuition_graph.json` l'est aujourd'hui.
