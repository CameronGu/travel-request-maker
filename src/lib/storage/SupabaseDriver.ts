// TODO: Replace with actual Supabase client once configured.

/**
 * SupabaseDriver (stub)
 * ---------------------------------------------------------------------------
 * Placeholder implementation that satisfies the StorageDriver interface until
 * Supabase integration details are finalized. All methods currently resolve to
 * fallback values so that callers can safely depend on the driver without
 * runtime errors.
 */

import { StorageDriver } from './StorageDriver'

import { createClient as createBrowserClient } from '@/lib/supabase/client'

const supabase = createBrowserClient()

export const SupabaseDriver: StorageDriver = {
  async get<T>(key: string) {
    const { data, error } = await supabase.from(key).select('*')
    if (error) throw error
    return data as T
  },
  async set<T>(key: string, value: T) {
    const { error } = await supabase.from(key).upsert(value)
    if (error) throw error
  },
}