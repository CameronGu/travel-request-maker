import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

Deno.serve(async () => {
  const client = createClient(
    Deno.env.get("PUBLIC_SUPABASE_URL")!,
    Deno.env.get("SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString();
  const { error } = await client
    .from("links")
    .delete()
    .lt("expires_at", now);

  return new Response(
    error ? `❌ ${error.message}` : "✅ Expired links purged.",
    { status: error ? 500 : 200 }
  );
}); 