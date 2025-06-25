import { features } from '@/config';
import { LocalDriver } from './LocalDriver';
import { SupabaseDriver } from './SupabaseDriver';
import type { StorageDriver } from './StorageDriver';

let cached: StorageDriver | undefined;

export function getActiveDriver(): StorageDriver {
  if (cached) return cached;
  cached = features.supabase ? new SupabaseDriver() : new LocalDriver();
  return cached;
}
