require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

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
    expect: { select: true, insert: false, update: false, delete: false },
  },
];

const TABLE = 'requests';

function decodeJWT(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    return decoded || {};
  } catch (err) {
    return { error: err.message };
  }
}

async function testRole(role) {
  const { jwt: token, name } = role;

  if (!token) {
    console.warn(`JWT for role ${name} is missing. Skipping.`);
    return null;
  }

  const decoded = decodeJWT(token);
  console.log(`\nRole: ${name}`);
  console.log('  JWT payload:', JSON.stringify(decoded.payload, null, 2));

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const results = {};

  // SELECT
  try {
    const { data, error } = await client.from(TABLE).select('*').limit(1);
    results.select = !error;
    if (error) console.error('  SELECT error:', error.message);
    else console.log('  SELECT OK:', data);
  } catch (err) {
    console.error('  SELECT exception:', err.message);
    results.select = false;
  }

  // INSERT
  try {
    const { error } = await client.from(TABLE).insert([
      { type: 'hotel', blob: { test: true }, project_id: '00000000-0000-0000-0000-000000000000' }
    ]);
    results.insert = !error;
    if (error) console.error('  INSERT error:', error.message);
    else console.log('  INSERT OK');
  } catch (err) {
    console.error('  INSERT exception:', err.message);
    results.insert = false;
  }

  // UPDATE
  try {
    const { error } = await client.from(TABLE)
      .update({ blob: { updated: true } })
      .eq('type', 'hotel');
    results.update = !error;
    if (error) console.error('  UPDATE error:', error.message);
    else console.log('  UPDATE OK');
  } catch (err) {
    console.error('  UPDATE exception:', err.message);
    results.update = false;
  }

  // DELETE
  try {
    const { error } = await client.from(TABLE)
      .delete()
      .eq('type', 'hotel');
    results.delete = !error;
    if (error) console.error('  DELETE error:', error.message);
    else console.log('  DELETE OK');
  } catch (err) {
    console.error('  DELETE exception:', err.message);
    results.delete = false;
  }

  return results;
}

(async () => {
  console.log('🔍 Testing RLS enforcement for roles on table:', TABLE);

  for (const role of roles) {
    const results = await testRole(role);
    if (!results) continue;

    for (const op of ['select', 'insert', 'update', 'delete']) {
      const expected = role.expect[op];
      const actual = results[op];
      const status = actual ? 'ALLOWED' : 'DENIED';
      const expectStatus = expected ? 'ALLOWED' : 'DENIED';
      console.log(`  ${op.toUpperCase()}: ${status} (expected: ${expectStatus})`);
    }
  }

  console.log('\n✅ RLS debug test complete.');
})();
