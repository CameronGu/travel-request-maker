import { StorageDriver } from "./StorageDriver";

/**
 * LocalDriver
 * ----------------------------------------------------------------------------
 * Simple browser-only implementation of {@link StorageDriver} backed by
 * `window.localStorage`.  All operations are wrapped in try/catch so that UI
 * logic never breaks on quota or serialization errors.
 *
 * NOTE: Falls back to no-op when executed in non-browser contexts (SSR/Node).
 * TODO: Provide an isomorphic driver (e.g. cookies, memory) for server use.
 */
export class LocalDriver implements StorageDriver {
  private readonly canUseStorage =
    typeof window !== "undefined" && typeof window.localStorage !== "undefined";

  async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.canUseStorage) return null;

    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      // Swallow JSON/parsing/quota errors; return null to caller.
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    if (!this.canUseStorage) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota or serialization errors.
    }
  }
}
