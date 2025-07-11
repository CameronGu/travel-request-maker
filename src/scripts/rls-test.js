/*
 * RLS Test Script (Schema-Driven)
 *
 * - Tests Row Level Security for all implemented roles (attAdmin, clientAdmin, requester) on the 'requests' table.
 * - Only uses columns present in the current schema. Update payloads and queries as the schema evolves.
 * - For new columns/features, add or uncomment relevant test logic and payload fields.
 * - For future stages, add new role scenarios, edge cases, or table coverage as needed.
 * - If schema changes, update payloads and queries accordingly.
 * - Optimized for Cursor AI: always check the current schema and update this script for full coverage of all implemented and prior features.
 * - Leave TODOs for any not-yet-implemented features or columns.
 */
/* eslint-disable no-console */
import "./bootstrap-env.js";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const roles = [
  {
    name: 'attAdmin',
    jwt: process.env.TEST_JWT_ATTADMIN,
    expect: { select: true, insert: true, update: true, delete: true },
  },
  {
    name: 'clientAdmin',
    jwt: process.env.TEST_JWT_CLIENTADMIN,
    expect: { select: true, insert: true, update: true, delete: true },
  },
  {
    name: 'requester',
    jwt: process.env.TEST_JWT_REQUESTER,
    expect: { select: true, insert: true, update: false, delete: false },
  },
];

const TABLE = 'requests';

export async function testRole(role) {
  if (!role.jwt) {
    console.warn(`JWT for role ${role.name} is missing. Skipping.`);
    return null;
  }
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${role.jwt}` } },
  });
  const results = {};
  // SELECT
  try {
    const { error } = await client.from(TABLE).select('*').limit(1);
    results.select = !error;
  } catch {
    results.select = false;
  }
  // INSERT
  try {
    const claims = JSON.parse(Buffer.from(role.jwt.split('.')[1], 'base64').toString());
    // You must provide valid project_id, traveler_id, and created_via_link_id for the test
    // For demo, use dummy UUIDs or fetch from the DB as needed
    const payload = {
      project_id: claims.project_id || '00000000-0000-0000-0000-000000000000',
      traveler_id: claims.traveler_id || '00000000-0000-0000-0000-000000000000',
      created_via_link_id: claims.link_ids || null,
      // status: 'draft', // optional, defaults to 'draft'
    };
    const { error } = await client.from(TABLE).insert([payload]);
    results.insert = !error;
    if(error) console.log(`   INSERT error for ${role.name}: ${error.message}`);
  } catch(e) {
    console.error(`   INSERT exception for ${role.name}:`, e);
    results.insert = false;
  }
  // UPDATE
  try {
    // Update status to 'completed' for a request (use a dummy UUID or fetch a real one in a real test)
    const { error } = await client.from(TABLE).update({ status: 'completed' }).limit(1);
    results.update = !error;
  } catch {
    results.update = false;
  }
  // DELETE
  try {
    // Delete by id (use a dummy UUID or fetch a real one in a real test)
    const { error } = await client.from(TABLE).delete().limit(1);
    results.delete = !error;
  } catch {
    results.delete = false;
  }
  return results;
}

export async function runTests() {
  console.log('Testing RLS enforcement for roles on table:', TABLE);
  for (const role of roles) {
    if (!role.jwt) {
      console.warn(`JWT for role ${role.name} is missing. Skipping.`);
      continue;
    }
    console.log(`\nRole: ${role.name}`);
    const results = await testRole(role);
    if (!results) continue;
    for (const op of ['select', 'insert', 'update', 'delete']) {
      const expected = role.expect[op];
      const actual = results[op];
      console.log(`  ${op.toUpperCase()}: ${actual ? 'ALLOWED' : 'DENIED'} (expected: ${expected ? 'ALLOWED' : 'DENIED'})`);
    }
  }
  console.log('\nRLS test complete. Review output for any unexpected access.');
}

export { roles };

// TODO: Add more granular tests for edge cases and future columns as implemented.
