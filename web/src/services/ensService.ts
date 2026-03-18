/**
 * ENS resolution service — reads ENS names and text records (social profiles)
 * from Ethereum mainnet.
 */

// Public Ethereum mainnet RPC for ENS lookups
const ETH_MAINNET_RPC = "https://eth.llamarpc.com";

export interface EnsProfile {
  name: string | null;          // ENS name (e.g., "samuel.eth")
  avatar: string | null;        // avatar URL
  github: string | null;        // GitHub username
  twitter: string | null;       // X/Twitter handle
  discord: string | null;       // Discord handle
  url: string | null;           // website URL
  description: string | null;   // bio/description
  email: string | null;
}

const TEXT_RECORDS = [
  "com.github",
  "com.twitter",
  "com.discord",
  "url",
  "avatar",
  "description",
  "email",
] as const;

// Cache to avoid repeated lookups
const cache = new Map<string, { profile: EnsProfile; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Resolve an Ethereum address to its ENS profile (name + text records).
 * Returns null fields for addresses without ENS.
 */
export async function resolveEnsProfile(address: string): Promise<EnsProfile> {
  const key = address.toLowerCase();

  // Check cache
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.profile;
  }

  const profile: EnsProfile = {
    name: null,
    avatar: null,
    github: null,
    twitter: null,
    discord: null,
    url: null,
    description: null,
    email: null,
  };

  try {
    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider(ETH_MAINNET_RPC);

    // Reverse lookup: address → ENS name
    const ensName = await provider.lookupAddress(address);
    if (!ensName) {
      cache.set(key, { profile, timestamp: Date.now() });
      return profile;
    }

    profile.name = ensName;

    // Get the resolver for this name
    const resolver = await provider.getResolver(ensName);
    if (!resolver) {
      cache.set(key, { profile, timestamp: Date.now() });
      return profile;
    }

    // Read all text records in parallel
    const results = await Promise.allSettled(
      TEXT_RECORDS.map((record) => resolver.getText(record))
    );

    for (let i = 0; i < TEXT_RECORDS.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled" && result.value) {
        const key = TEXT_RECORDS[i];
        switch (key) {
          case "com.github": profile.github = result.value; break;
          case "com.twitter": profile.twitter = result.value; break;
          case "com.discord": profile.discord = result.value; break;
          case "url": profile.url = result.value; break;
          case "avatar": profile.avatar = result.value; break;
          case "description": profile.description = result.value; break;
          case "email": profile.email = result.value; break;
        }
      }
    }
  } catch {
    // ENS resolution failed — return empty profile
  }

  cache.set(key.toLowerCase(), { profile, timestamp: Date.now() });
  return profile;
}

/**
 * Batch resolve multiple addresses. Returns a map of address → EnsProfile.
 */
export async function resolveEnsProfiles(
  addresses: string[]
): Promise<Map<string, EnsProfile>> {
  const results = new Map<string, EnsProfile>();
  // Process sequentially to avoid rate limiting the RPC
  for (const addr of addresses) {
    const profile = await resolveEnsProfile(addr);
    results.set(addr.toLowerCase(), profile);
    // Small delay between lookups
    await new Promise((r) => setTimeout(r, 200));
  }
  return results;
}

/**
 * Build social links from an ENS profile.
 */
export function getSocialLinks(profile: EnsProfile): { label: string; url: string; icon: string }[] {
  const links: { label: string; url: string; icon: string }[] = [];
  if (profile.github) {
    links.push({ label: profile.github, url: `https://github.com/${profile.github}`, icon: "🐙" });
  }
  if (profile.twitter) {
    const handle = profile.twitter.startsWith("@") ? profile.twitter.slice(1) : profile.twitter;
    links.push({ label: `@${handle}`, url: `https://x.com/${handle}`, icon: "𝕏" });
  }
  if (profile.discord) {
    links.push({ label: profile.discord, url: "#", icon: "💬" });
  }
  if (profile.url) {
    links.push({ label: profile.url.replace(/^https?:\/\//, ""), url: profile.url, icon: "🌐" });
  }
  return links;
}
