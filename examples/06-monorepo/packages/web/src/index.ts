import { useState, useEffect } from "react";
import { createConfig, ok, err, type Config, type Result } from "@acme/core";

/**
 * Hook to manage Acme Platform configuration
 */
export function useAcmeConfig(initial?: Partial<Config>) {
  const [config, setConfig] = useState<Config>(() => createConfig(initial || {}));
  return { config, setConfig };
}

/**
 * Hook to fetch data from Acme API
 */
export function useAcmeQuery<T>(
  endpoint: string
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch implementation
    setLoading(false);
  }, [endpoint]);

  return { data, loading, error };
}

// Re-export types
export { Config, Result } from "@acme/core";
