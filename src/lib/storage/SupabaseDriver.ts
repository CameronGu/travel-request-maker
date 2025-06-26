// TODO: Replace with actual Supabase client once configured.

/**
 * SupabaseDriver (stub)
 * ---------------------------------------------------------------------------
 * Placeholder implementation that satisfies the StorageDriver interface until
 * Supabase integration details are finalized. All methods currently resolve to
 * fallback values so that callers can safely depend on the driver without
 * runtime errors.
 */

import { getSupabaseClient } from '../supabase/client';

import { StorageDriver } from './StorageDriver';

export class SupabaseDriver implements StorageDriver {
  private readonly client = getSupabaseClient();

  async get<T>(key: string) {
    const { data, error } = await this.client.from(key).select('*');
    if (error) throw error;
    return data as T;
  }
  async set<T>(key: string, value: T) {
    const { error } = await this.client.from(key).upsert(value);
    if (error) throw error;
  }
}