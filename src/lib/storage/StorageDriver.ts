// Base interface for storage drivers in the system (LocalDriver, SupabaseDriver, etc.)
// Used by consumers via `getActiveDriver` to persist/retrieve data in a consistent way.

export interface StorageDriver {
  /**
   * Retrieve a value by key.
   * @param key Unique identifier.
   */
  get<T = unknown>(key: string): Promise<T | null>;

  /**
   * Persist a value by key.
   * @param key Unique identifier.
   * @param value Data to store.
   */
  set<T = unknown>(key: string, value: T): Promise<void>;
}