import type { StorageDriver } from "./StorageDriver";

import { features } from "@/config";

import { LocalDriver } from "./LocalDriver";
import { SupabaseDriver } from "./SupabaseDriver";


// instantiate the driver classes
const local = new LocalDriver();
const supabase = new SupabaseDriver();

/**
 * Feature toggle
 * ----------------------------------------------------------------------------
 * Supabase mode is enabled only when both public environment variables exist.
 * Adjust this logic if you introduce a proper feature-flag service later.
 */
// const features = {
//   supabase:
//     typeof process !== "undefined" &&
//     !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
//     !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
// } as const;

/**
 * activeDriver
 * ----------------------------------------------------------------------------
 * Exports the *class* (not an instance) that callers should instantiate:
 *
 * ```ts
 * import { activeDriver } from "@/lib/storage";
 * const driver = new activeDriver();
 * ```
 *
 * TODO: Provide a driver factory/singleton once requirements are clear.
 */
export const activeDriver: StorageDriver = features.supabase ? supabase : local;
