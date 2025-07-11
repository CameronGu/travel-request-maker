/*
 * Trigger & Constraint Test Script (Schema-Driven)
 *
 * - Tests triggers and constraints for the current schema (requests table, etc.).
 * - Only uses columns present in the current schema. Update payloads and queries as schema evolves.
 * - For new columns/features, add or uncomment relevant test logic.
 * - For future stages, add new constraint/trigger scenarios as needed.
 * - If schema changes, update payloads and queries accordingly.
 * - Optimized for Cursor AI: always check the current schema and update this script for full coverage of all implemented and prior features.
 * - Leave TODOs for any not-yet-implemented features or columns.
 */
/* eslint-disable no-console */
import "./bootstrap-env.js";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Environment variables not found.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testTriggersAndConstraints() {
  let allPassed = true;
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
  let testRequestId = null;
  let testUserId = null;

  // 1. Insert into requests (should fire status trigger)
  try {
    const { data, error } = await supabase.from('requests').insert({
      project_id: 'cfbcabd5-0d53-49f2-97ae-e017e3e0add9', // Use a valid project_id from your seed data
      traveler_id: '00000000-0000-0000-0000-000000000000', // TODO: Use a valid traveler_id
      created_via_link_id: '04fb00c1-8082-42be-a951-4d2888b05537', // Use a valid link_id from your seed data
      // status: 'draft', // optional
    }).select().single();
    if (error || !data) throw new Error(error?.message || 'No data returned');
    testRequestId = data.id;
    console.log('✅ Inserted request:', testRequestId);
  } catch (e) {
    allPassed = false;
    console.error('❌ Failed to insert request:', e.message);
  }

  // 2. Check request_status_log for trigger
  // (Removed: do not check after insert, as trigger only fires on update)

  // 3. Update request status (should fire trigger again)
  if (testRequestId) {
    try {
      const { error } = await supabase.from('requests').update({ status: 'completed' }).eq('id', testRequestId);
      if (error) throw new Error(error.message);
      const { data, error: logError } = await supabase.from('request_status_log').select('*').eq('request_id', testRequestId).eq('new_status', 'completed');
      if (logError || !data || data.length === 0) throw new Error(logError?.message || 'No status log entry for completed');
      console.log('✅ Status trigger fired for status change to completed');
    } catch (e) {
      allPassed = false;
      console.error('❌ Status trigger did not fire on update:', e.message);
    }
  }

  // 4. Attempt constraint violation (missing NOT NULL field)
  try {
    const { error } = await supabase.from('requests').insert({
      // missing required fields like project_id, traveler_id
      created_via_link_id: '00000000-0000-0000-0000-000000000000',
    });
    if (!error) throw new Error('Constraint violation not detected');
    console.log('✅ Constraint violation detected (NOT NULL)');
  } catch (e) {
    allPassed = false;
    console.error('❌ Constraint violation test failed:', e.message);
  }

  // 5. Attempt FK violation
  try {
    const { error } = await supabase.from('requests').insert({
      project_id: '00000000-0000-0000-0000-000000000000', // invalid FK
      traveler_id: '00000000-0000-0000-0000-000000000000', // invalid FK
      created_via_link_id: '00000000-0000-0000-0000-000000000000',
    });
    if (!error) throw new Error('FK constraint violation not detected');
    console.log('✅ FK constraint violation detected');
  } catch (e) {
    allPassed = false;
    console.error('❌ FK constraint violation test failed:', e.message);
  }

  // 6. Delete test request (should cascade or be blocked by constraints)
  if (testRequestId) {
    try {
      const { error } = await supabase.from('requests').delete().eq('id', testRequestId);
      if (error) throw new Error(error.message);
      console.log('✅ Deleted test request:', testRequestId);
    } catch (e) {
      allPassed = false;
      console.error('❌ Failed to delete test request:', e.message);
    }
  }

  // 7. (Optional) Test audit_log trigger on users table if implemented
  // Add similar logic for users table if audit triggers exist

  if (allPassed) {
    console.log('\n🎉 All trigger and constraint tests passed!');
    process.exit(0);
  } else {
    console.error('\n🚨 Some trigger or constraint tests failed.');
    process.exit(1);
  }
}

testTriggersAndConstraints(); 