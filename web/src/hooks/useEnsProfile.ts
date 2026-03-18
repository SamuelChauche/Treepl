import { useState, useEffect } from "react";
import { resolveEnsProfile, type EnsProfile } from "../services/ensService";

/**
 * Hook to resolve an Ethereum address to its ENS profile.
 * Caches results internally (via the service).
 */
export function useEnsProfile(address: string | null) {
  const [profile, setProfile] = useState<EnsProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    resolveEnsProfile(address)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [address]);

  return { profile, loading };
}
