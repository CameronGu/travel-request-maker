import { createHook } from "@/hooks/factory";

/**
 * Traveler model placeholder.
 * TODO: Replace with concrete Traveler interface once domain types exist.
 * Using a type alias now keeps lint happy without inventing fields.
 */
export type Traveler = Record<string, unknown>;

/**
 * useTravelers
 * ----------------------------------------------------------------------------
 * Fetches cached travelers list via TanStack Query.
 */
export const useTravelers = createHook<Traveler[]>("travelers");
