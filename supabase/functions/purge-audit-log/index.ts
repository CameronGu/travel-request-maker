import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

Deno.serve(async () => {
  const client = createClient(
    Deno.env.get("PUBLIC_SUPABASE_URL")!,
    Deno.env.get("SERVICE_ROLE_KEY")!
  );

  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString();
  const { error } = await client
    .from("audit_log")
    .delete()
    .lt("changed_at", cutoff);

  return new Response(
    error ? `❌ ${error.message}` : "✅ Audit logs older than 90 days purged.",
    { status: error ? 500 : 200 }
  );
});
