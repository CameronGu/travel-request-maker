import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { features } from '@/config';
import { queryKeys } from '@/lib/queryKeys';
import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * useRequestsRealtime
 * ---------------------------------------------------------------------------
 * Subscribes to Supabase real-time changes on the 'requests' table.
 * On insert, update, or delete, invalidates the relevant TanStack Query.
 * PRD section 6 and 8.
 */
export function useRequestsRealtime(projectId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!features.supabase) return;
    const channel = getSupabaseClient()
      .channel('requests-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (_payload) => {
          // Invalidate the requests query for the relevant project
          queryClient.invalidateQueries({ queryKey: queryKeys.requests(projectId) });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, queryClient]);
} 