import { createHook } from "@/hooks/factory";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Traveler model placeholder.
 * TODO: Replace with concrete Traveler interface once domain types exist.
 * Using a type alias now keeps lint happy without inventing fields.
 */
export type Traveler = Record<string, unknown>;

/**
 * useTravelers
 * ----------------------------------------------------------------------------
 * Returns the list of travelers for a given client.
 * clientId is optional; if omitted, returns all travelers (if permitted by RLS).
 * Returns a TanStack Query result.
 */
export const useTravelers = (clientId?: string) =>
  createHook<Traveler[]>(queryKeys.travelers(clientId))();

/**
 * Usage example:
 * const { data, isLoading } = useTravelers(clientId);
 * useTravelersRealtime(clientId); // for real-time sync
 */
