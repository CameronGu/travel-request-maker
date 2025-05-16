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
 * Query. Example usage:
 *
 * ```ts
 * const useDraftRequest = createHook<DraftRequest>("draft-request");
 * const { data, isLoading } = useDraftRequest();
 * ```
 */
export function createHook<T = unknown>(key: string): () => UseQueryResult<T | null> {
  return () =>
    useQuery<T | null, Error>({
      queryKey: [key],
      queryFn: () => activeDriver.get<T>(key),
    });
}
