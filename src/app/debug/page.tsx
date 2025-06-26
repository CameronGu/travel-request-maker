// DEBUG PAGE: Uses Supabase service role key for local/server-only debugging.
// NEVER enable this in production or expose the service role key to the client.
// This page is automatically disabled in production. See README for details.
import { createServiceClient } from '@/lib/supabase/server'

export default async function Debug() {
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div style={{ color: 'red', fontWeight: 'bold', padding: 16 }}>
        Debug page is <b>disabled</b> in production.
      </div>
    );
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('requests').select('*').limit(10);
  return (
    <div>
      <div className="bg-yellow-50 text-yellow-800 p-2 mb-2 rounded">
        <b>Warning:</b> This page uses the Supabase service role key and is for <b>local development only</b>.
        Never enable in production.
      </div>
      <pre>
        {error ? `Error: ${error.message}\n` : ''}
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
