import { createHook } from "@/hooks/factory";
import { queryKeys } from "@/lib/queryKeys";

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
 * projectId is optional; if omitted, returns all requests (if permitted by RLS).
 * Returns a TanStack Query result.
 *
 * Usage example:
 * const { data, isLoading } = useRequests(projectId);
 * useRequestsRealtime(projectId); // for real-time sync
 */
export const useRequests = (projectId?: string) =>
  createHook<Request[]>(queryKeys.requests(projectId) as readonly unknown[])();
