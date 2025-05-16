import { StorageDriver } from "./StorageDriver";

// TODO: Replace with actual Supabase client once configured.
// import { createClient } from "@supabase/supabase-js";

/**
 * SupabaseDriver (stub)
 * ---------------------------------------------------------------------------
 * Placeholder implementation that satisfies the StorageDriver interface until
 * Supabase integration details are finalized. All methods currently resolve to
 * fallback values so that callers can safely depend on the driver without
 * runtime errors.
 */
export class SupabaseDriver implements StorageDriver {
  // private readonly supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async get<T = unknown>(_key: string): Promise<T | null> {
    // TODO: Query Supabase KV/storage table once schema is defined.
    return null;
  }

  async set<T = unknown>(_key: string, _value: T): Promise<void> {
    // TODO: Persist data to Supabase once schema is defined.
  }
}
