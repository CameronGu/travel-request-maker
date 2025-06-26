import type { StorageDriver } from './StorageDriver';

import { features } from '@/config';

import { LocalDriver } from './LocalDriver';
import { SupabaseDriver } from './SupabaseDriver';

let cached: StorageDriver | undefined;

export function getActiveDriver(): StorageDriver {
  if (cached) return cached;
  cached = features.supabase ? new SupabaseDriver() : new LocalDriver();
  return cached;
}
