/**
 * Queries GraphQL pour récupérer les positions d'un utilisateur EthCC
 * sur les atoms de l'app (topics, tracks, sessions).
 *
 * Usage: passer l'adresse wallet de l'utilisateur (depuis ethcc-wallet-address
 * ou saisie manuelle). Aucune signature requise — lecture seule.
 *
 * GraphQL endpoint: https://mainnet.intuition.sh/v1/graphql
 */

const GQL_URL = "https://mainnet.intuition.sh/v1/graphql";

// ─── Atom IDs hardcodés (extraits de l'app EthCC) ────────────────

/** Atom "I" — sujet de tous les vote triples */
const I_ATOM = "0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b";

/** Predicate "supports" — utilisé pour les votes */
const SUPPORTS_PREDICATE = "0x01b226872092606d8e7fcdc72b29ca7efc6bc4aa628b2d4502851150616358a0";

/** Predicate "are interested by" — utilisé pour les interests (onboarding) */
const ARE_INTERESTED_PREDICATE = "0x0cdf92bb37466e0954a7ce69e39e5ead44b901cf0d889eeb20ec0f1f2da697e1";

/** Predicate "attending" — utilisé pour les sessions (onboarding) */
const ATTENDING_PREDICATE = "0x8e03485341c3e557be0bf07dcbc9170add35fd436024cf280329c5ceb5a65863";

/** 100 topic atom IDs (votes) — clé = topic slug, valeur = atom term_id */
const TOPIC_ATOM_IDS: Record<string, string> = {
  "defi-lending": "0xa73e666ee018e88bb11ad7a81dfe03c43da2f4e7a72466e95a14b60a535235df",
  "defi-amm": "0x578221761aee4f56e472122cd44b1c01a0b850ec636833c0faf2dc45bad9b7c2",
  "defi-mev": "0xf13d664552b7f6e9c8f3db0b2366568a5e990cbea49db3358c7d9d2d422f52e8",
  "defi-uniswap": "0x0ea2e2a113d91a6aa5eb90b8ba4137ff3c46f39c3a3edf6c315d61be489d46c6",
  "defi-aave": "0x7bb2848247435773fa184bd8003297c68bf18340ec2f8ad2fcd4846a240e8617",
  "nfts-generative-art": "0x87caf521d67575b5cdf5407b10a9c828a0dbd765a5c8148b183206d02627a9de",
  "nfts-soulbound": "0xf43e755bdd8b4bdec7ea0240fedad2606bffe08339a680b86c1007c823ed899e",
  "nfts-music": "0xfb8250d5bdc06b5037aa79590fbfad61e7d5a4734857603c4afbaf586f85ded2",
  "nfts-zora": "0x0de9c4742d253b3baf80440b291ab4d961acf52e58c88e06a72874056f2d2de5",
  "nfts-art-blocks": "0xfe3849273b17739d5b24aa270bb4ff6854245489e0af1fc1a2e8baeee557a7f5",
  "l2-zk-rollups": "0x73168a0b0901de13e534b718afa373ac30368760b1ae318984f3e81aea4682a4",
  "l2-based-rollups": "0x5c8a39390112c6b912c27f09781e1f74efaa9e2efdd48bee0846379205b5c560",
  "l2-danksharding": "0x23cd2c0141ba9bfa2f372b459f66af4b1e3d0d1c8ea2a10c4f0d8ebb6e155208",
  "l2-arbitrum": "0xf538e67d0c442849dce684c6376c72b61789126f7d6fbc2c32c34192d6601ece",
  "l2-starknet": "0x1d7b294962fe2ce4289f2ab0239a3f8559dd2424e80037578721fb27e521b79b",
  "privacy-fhe": "0x01e505e647a7071c3d687e04cddf7c5306ddf76eb287425bff7a490d8274a175",
  "privacy-stealth-addresses": "0xbe27d74ccb9b7cad107a6d7d25e420f1266f2d06f8360c4bf1dd2993ca3f4d30",
  "privacy-mpc": "0x9f2fe8bb5e8bc217740c32bbcfde0291653e10c22fa726f1cfef53a0dca081a1",
  "privacy-aztec": "0x992df6119394de124a3ee7cf36efebee48941bc4915e156a0bd05c4b4fdb7523",
  "privacy-zama": "0xfa4c4fb96c068541aa8425d6e7054ab32e8d219112d93bdf94b05c5227433d92",
  "ai-agents-onchain": "0x6d880ee63164dc7ecc375d480516d6b81fd866dfc5723211bffb0ed26e202b98",
  "ai-proof-of-inference": "0xcfa9d4a0f18aadd5457bf798213bdd0011187578917aa7afe2d01726916195a6",
  "ai-bittensor": "0x15c76a25905c4e8674da49f30a67caaa67d2f25ccbe5c3bc3a0992bbaee8be30",
  "ai-ritual": "0xb402b76b29758eb2d15a228f26316a2a3f8b85917a8d1648895e93dbf95f32f8",
  "ai-depin-gpu": "0x95453d501928dde98ff6bdb6179e8e5df13676c3f2721aba8c0246f910cce2d4",
  "eth-verkle-trees": "0x086026a763f78763ea916e187b4f46d44f3fb6904b36d2cd81dd12273ca2886c",
  "eth-pectra": "0xe408a66e012f119c872c6a7353f560760c6495a6310f108d728f50e9ed80504a",
  "eth-pbs": "0x61565f842a4edb75e00fac43db194a637a44815b914716072533e105e7e2b993",
  "eth-preconfirmations": "0x883bb764f5a2ccc1760fd548fc47410b6ee4c964b6cc491abbec9558fd8494c6",
  "eth-reth": "0x4b3f9305308e52f6a1cff7a194022891993594f5f0c6d84b3885e85685d138a2",
  "infra-indexing": "0xea6bfbf3e3e1f17e4b0e3ab5a5ea94b5c5e1f2b3d4e5f6a7b8c9d0e1f2a3b4c5",
  "cross-bridges": "0xc8e33f1d38636c839fe4f7ddcd6cdc1f74cb0d594dad8cc66bc91ccbad02a5af",
  "cross-chain-abstraction": "0xc1e5b5a40a0b83e749bdcb916ee7560ca973208898ad3d782fd87a6422381646",
  "cross-intents": "0x695ace568b7c4da97db0e1a96ca777d35f7fe8d55ddeb367d88682456d354788",
  "cross-layerzero": "0x37fdfea55fec13588e09f9b9cdd07e08b631ce25ea7c7be929c21f2fc88d0308",
  "cross-wormhole": "0x58415b2868c262437ab5812553b1eae445172bcd745a378dd3b35419b93e9fd4",
  "culture-cypherpunk": "0xed3a4a7270b992e3a4eea2ab27b44e76a90e65bf9e0d06768dfda4af0c62389f",
  "culture-memecoins": "0x754fe3104ebeded8ea867c4cb6e0fbaa292708db52a07c9530791a1b36e5aae5",
  "culture-network-states": "0x62917e6d5543d8158b6f326bd981934daabbbb0177ea502d10bca057fb385092",
  "culture-public-goods": "0x5b1a104f9f38d66f43cd1516984911f3ac00b92ae10e7b574081a642786fa981",
  "culture-pump-fun": "0x85757142995b5ecd3e94383bf7676cbe8c70286db24b88dc9963800291aba924",
  "data-dune": "0xa31735983bfe10720570059099959302b625f333ff3ed6e7191023c645ca0141",
  "data-onchain-analytics": "0xb87d5b5b5403b618143059b763ded1e5ff31403929131b1bd277bad9f869622d",
  "data-oracles": "0x5f5e8a6a28e0155257c7d85437c5c41140c0cb5e27985b998a0fbc508dbdbc36",
  "data-polymarket": "0xb169397d4369454586609498e30ae8586935c68f7d9008febf2b06d2e95a4f95",
  "data-prediction-markets": "0xf35fee4ba72207479b0e7eab7a39a85dcbb0cfa8f8a5f85569cef3001bf230f6",
};

/** 17 track atom IDs (onboarding interests) — clé = track name, valeur = atom term_id */
const TRACK_ATOM_IDS: Record<string, string> = {
  "AI Agents and Automation": "0xf3cc343ac2af82d0490e23e39e2e1fc29f279e26aee49bd95914260720e6d671",
  "Applied cryptography": "0xa294407354c71d4ad9fd5088726a36a6e3bebc3be70f2b968cec0d601e9a8a7f",
  "Block Fighters": "0x87a08a709d41f43a242db8db9e1f7c4956d58688a6d5d07f85b3adc4eaf1fe5e",
  "Breakout sessions": "0x47ba370df0bca8846e101c4ec5b7695921e1d3ecb31c0d3374a0845a8c172a2b",
  "Built on Ethereum": "0x2dde4c9f1365a17450ca4d651a7c3d3752ccc63ed6e9f4492b8a635c06dbc985",
  "Core Protocol": "0x24a3480abc66ae94bba8bf4b8952ac6784a7e539ed440ac3901cb3142e9108bf",
  "Cypherpunk & Privacy": "0x6bbbb75ab72b3be504b59c7c5728bbf0212368a5456249843cd11ce1e124a019",
  "DeFi": "0x31d170b3efaa2820d0d6b0c53c7232618ec74495871ed32907a1c9028ce78a8c",
  "EthStaker": "0x60792f8e7c11bf88b026587c24ee338f02f883a306d947a0448b998e966f1d93",
  "Layer 2s": "0x77c6ad9f79a11f242cf7a8d6f4a3e5f8e9c35cab04708198a4c2af1ab71da98a",
  "Product & Marketers": "0xd3b79740eb2ab4ba95dd6145aa303196ed89cca32a89f88361938de6f962c81f",
  "RWA Tokenisation": "0xdf1b7a70c58270ea101372e5026a6c483b20c8be7bb80684fd5b6c832c510eeb",
  "Research": "0xe164fa08db1c673380211f9e2afb036b4ecc019b96c3a0d2cb82679aa83723dc",
  "Security": "0x44f497066d7ade71154420d3cd075c3a2b02b9f2446301cbf154cdd5f9c5d50f",
  "Stablecoins & Global Payments": "0x3192914ddee59330c9b4f453efb940d407578859cb87feb585d4062ac10f89c7",
  "The Unexpected": "0x5e6f3a9bb00b0dc14be9a358dd1f107895392c5767b50225c6b4f3f4b8e73367",
  "Zero Tech & TEE": "0xa1ace10f77b5b560038429d8012862db14a5664bcd53f0b55da75f4cb99ac29d",
};

// ─── Helper ──────────────────────────────────────────────────────

async function gql<T = unknown>(query: string): Promise<T> {
  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ─── Queries ─────────────────────────────────────────────────────

/**
 * Récupère les topics sur lesquels l'utilisateur a voté (position sur atom vault).
 * Retourne un Map<topicSlug, shares>.
 */
export async function getUserVotedTopics(
  address: string
): Promise<Map<string, bigint>> {
  const result = new Map<string, bigint>();
  const atomToSlug = new Map(
    Object.entries(TOPIC_ATOM_IDS).map(([k, v]) => [v, k])
  );
  const allIds = Object.values(TOPIC_ATOM_IDS);

  for (let i = 0; i < allIds.length; i += 50) {
    const batch = allIds.slice(i, i + 50);
    const idsStr = batch.map((id) => `"${id}"`).join(",");

    const data = await gql<{
      positions: { term_id: string; shares: string }[];
    }>(`{
      positions(where: {
        account_id: { _ilike: "${address.toLowerCase()}" }
        term_id: { _in: [${idsStr}] }
        shares: { _gt: "0" }
      }) { term_id shares }
    }`);

    for (const pos of data.positions) {
      const slug = atomToSlug.get(pos.term_id);
      if (slug) result.set(slug, BigInt(pos.shares));
    }
  }

  return result;
}

/**
 * Récupère les tracks (interests) de l'utilisateur.
 * Cherche les positions directes sur les track atom vaults.
 * Retourne un Map<trackName, shares>.
 */
export async function getUserTracks(
  address: string
): Promise<Map<string, bigint>> {
  const result = new Map<string, bigint>();
  const atomToName = new Map(
    Object.entries(TRACK_ATOM_IDS).map(([k, v]) => [v, k])
  );
  const idsStr = Object.values(TRACK_ATOM_IDS)
    .map((id) => `"${id}"`)
    .join(",");

  const data = await gql<{
    positions: { term_id: string; shares: string }[];
  }>(`{
    positions(where: {
      account_id: { _ilike: "${address.toLowerCase()}" }
      term_id: { _in: [${idsStr}] }
      shares: { _gt: "0" }
    }) { term_id shares }
  }`);

  for (const pos of data.positions) {
    const name = atomToName.get(pos.term_id);
    if (name) result.set(name, BigInt(pos.shares));
  }

  return result;
}

/**
 * Récupère les sessions que l'utilisateur "attends" (triples on-chain).
 * Cherche les triples: User --attending--> Session où l'user a une position.
 * Retourne un array de { sessionId, sessionTitle }.
 */
export async function getUserAttendingSessions(
  address: string
): Promise<{ sessionId: string; title: string }[]> {
  const data = await gql<{
    triples: {
      object: { label: string; term_id: string };
      term: { positions: { shares: string }[] };
    }[];
  }>(`{
    triples(where: {
      predicate: { term_id: { _eq: "${ATTENDING_PREDICATE}" } }
      subject: { label: { _ilike: "${address.toLowerCase()}" } }
    }) {
      object { label term_id }
      term {
        positions(where: {
          account_id: { _ilike: "${address.toLowerCase()}" }
          shares: { _gt: "0" }
        }) { shares }
      }
    }
  }`);

  // Reverse lookup session atom → session id
  // (not included here — use sessionIdToAtomId from the app data)
  return data.triples
    .filter((t) => t.term.positions.length > 0)
    .map((t) => ({
      sessionId: t.object.term_id,
      title: t.object.label,
    }));
}

// ─── Example usage ───────────────────────────────────────────────

/*
const address = "0x077b59a3751Cd6682534C8203aAb29113876af01";

// Topics votés
const votes = await getUserVotedTopics(address);
// Map { "defi-aave" => 98250000000000000n, ... }

// Tracks / interests
const tracks = await getUserTracks(address);
// Map { "Product & Marketers" => 884250000000000000n, "DeFi" => 98250000000000000n, ... }

// Sessions attending
const sessions = await getUserAttendingSessions(address);
// [{ sessionId: "0xb1e076...", title: "Credit for the Machine Age..." }]
*/
