import type { StorageDriver } from "./StorageDriver";

import { features } from "@/config";

import { LocalDriver } from "./LocalDriver";
import { SupabaseDriver } from "./SupabaseDriver";


// Determine the active storage implementation based on feature flags.
const local = new LocalDriver();
const supabase = new SupabaseDriver();

// Export the active driver instance based on config.
// TODO: Provide a driver factory/singleton once requirements are clear.

export const activeDriver: StorageDriver = features.supabase ? supabase : local;
