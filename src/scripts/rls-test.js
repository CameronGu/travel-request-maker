require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const VALID_PROJECT_ID = '34f52be0-36a2-4b32-8d27-bb79252e4f59';

const roles = [
  {
    name: 'attAdmin',
    jwt: process.env.TEST_JWT_ATTADMIN,
    expect: { select: true, insert: true, update: true, delete: true },
  },
  {
    name: 'clientAdmin',
    jwt: process.env.TEST_JWT_CLIENTADMIN,
    expect: { select: true, insert: true, update: true, delete: true }, // adjust as per policy
  },
  {
    name: 'requester',
    jwt: process.env.TEST_JWT_REQUESTER,
    expect: { select: true, insert: false, update: false, delete: false }, // adjust as per policy
  },
];

const TABLE = 'requests'; // Change as needed

async function testRole(role) {
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
    const { data, error } = await client.from(TABLE).select('*').limit(1);
    results.select = !error;
  } catch {
    results.select = false;
  }
  // INSERT
  try {
    const { error } = await client.from(TABLE).insert([{ type: 'hotel', blob: { test: true }, project_id: VALID_PROJECT_ID }]);
    results.insert = !error;
  } catch {
    results.insert = false;
  }
  // UPDATE
  try {
    const { error } = await client.from(TABLE).update({ blob: { updated: true } }).eq('type', 'hotel');
    results.update = !error;
  } catch {
    results.update = false;
  }
  // DELETE
  try {
    const { error } = await client.from(TABLE).delete().eq('type', 'hotel');
    results.delete = !error;
  } catch {
    results.delete = false;
  }
  return results;
}

(async () => {
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
})();
