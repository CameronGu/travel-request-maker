import { createHook } from "@/hooks/factory";

/**
 * Request model placeholder.
 * TODO: Replace with concrete Request interface once domain types exist.
 * Using a type alias now keeps lint happy without inventing fields.
 */
export type Request = Record<string, unknown>;

/**
 * useRequests
 * ----------------------------------------------------------------------------
 * Returns the list of saved travel requests.
 */
export const useRequests = createHook<Request[]>("requests");
