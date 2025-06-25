import { useQuery, UseQueryResult } from "@tanstack/react-query";

import { activeDriver } from "@/lib/storage";


/**
 * Singleton instance of whichever driver is active for this build.
 * TODO: Replace with a proper dependency-injection pattern if/when needed.
 */
// const driver = activeDriver;

/**
 * createHook
 * ---------------------------------------------------------------------------
 * Generates a typed React hook that queries the storage driver via TanStack
 * Query. Accepts a string or array for queryKey (PRD section 6.2).
 */
export function createHook<T = unknown>(key: string | readonly unknown[]): () => UseQueryResult<T | null> {
  return () =>
    useQuery<T | null, Error>({
      queryKey: typeof key === 'string' ? [key] : key,
      queryFn: () => {
        // Use the first string element as the storage key
        let storageKey: string = '';
        if (Array.isArray(key)) {
          storageKey = typeof key[0] === 'string' ? key[0] as string : '';
        } else if (typeof key === 'string') {
          storageKey = key;
        }
        return activeDriver.get<T>(storageKey);
      },
    });
}
