import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Magic Link Lifecycle:
// - Expiry: Each link has an 'expires_at' timestamp stored in the 'links' table.
// - Renewal: When a user requests a new link after expiry, a new row is created and a new email is sent.
// - Cleanup: Expired links are deleted by a scheduled Supabase edge function (purge-expired-links).
// No manual intervention is required; the system is self-maintaining.

// POST /api/magic-link
export async function POST(request: NextRequest) {
  // Parse and validate input (email, client_id)
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { email, client_id, role, expires_at, traveler_ids, meta } = body || {};
  if (!email || typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid or missing email' }, { status: 400 });
  }
  if (!client_id || typeof client_id !== 'string') {
    return NextResponse.json({ error: 'Invalid or missing client_id' }, { status: 400 });
  }

  // Optional: Add rate limiting here if desired (see previous implementation)

  // Insert a row into the links table for tracking (if needed)
  try {
    const supabase = createServiceClient();
    const insertResult = await supabase
      .from('links')
      .insert({
        client_id,
        role,
        target_email: email,
        expires_at,
        traveler_ids,
        meta,
      })
      .select()
      .single();
    if (!insertResult || insertResult.error || !insertResult.data) {
      return NextResponse.json({ error: 'Failed to create link record', details: insertResult?.error?.message }, { status: 500 });
    }
    const link = insertResult.data;

    // Send the magic link using Supabase Auth
    const inviteResult = await supabase.auth.admin.inviteUserByEmail(email);
    if (!inviteResult || inviteResult.error) {
      return NextResponse.json({ error: 'Failed to send magic link', details: inviteResult?.error?.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Magic link sent successfully', link_id: link.id }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected server error', details: (err as Error).message }, { status: 500 });
  }
} 