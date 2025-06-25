import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

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
    const channel = supabaseClient.channel('requests-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload) => {
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