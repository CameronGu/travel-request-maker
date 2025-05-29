/**
 * Global feature flags for Travel Request Generator.
 * Toggle at build-time (env injection) or during runtime as needed.
 */
export const features = {
  /** Enables client-side caching of in-progress requests when offline. */
  offlineDrafts: false,

  /** Switches persistence layer to Supabase. */
  supabase: 
    typeof process !== "undefined" &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;
