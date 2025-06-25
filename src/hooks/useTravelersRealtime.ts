import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

/**
 * useTravelersRealtime
 * ---------------------------------------------------------------------------
 * Subscribes to Supabase real-time changes on the 'travelers' table.
 * On insert, update, or delete, invalidates the relevant TanStack Query.
 * PRD section 6 and 8.
 */
export function useTravelersRealtime(clientId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabaseClient.channel('travelers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'travelers' },
        (payload) => {
          // Invalidate the travelers query for the relevant client
          queryClient.invalidateQueries({ queryKey: queryKeys.travelers(clientId) });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [clientId, queryClient]);
} 