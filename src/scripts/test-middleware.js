/* eslint-disable no-console */
import "./bootstrap-env.js";
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = 'http://localhost:3000';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Role Key is not defined. Make sure .env.local is configured.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const testUsers = {
  admin: {
    email: `test-admin-${Date.now()}@example.com`,
    password: 'password123',
    metadata: { role: 'app_att_admin' },
    tests: [
      { path: '/admin', expect: 200 },
      { path: '/dashboard', expect: 307 }, // Redirect
      { path: '/debug', expect: 200 },
      { path: '/', expect: 200 },
    ],
  },
  clientAdmin: {
    email: `test-client-admin-${Date.now()}@example.com`,
    password: 'password123',
    metadata: { role: 'app_client_admin', client_id: '83081349-bc63-4ca3-9e4b-d8611deefdc7' },
    tests: [
      { path: '/admin', expect: 307 },
      { path: '/dashboard', expect: 200 },
      { path: '/debug', expect: 200 },
      { path: '/', expect: 200 },
    ],
  },
  requester: {
    email: `test-requester-${Date.now()}@example.com`,
    password: 'password123',
    metadata: {
      role: 'app_requester',
      client_id: '83081349-bc63-4ca3-9e4b-d8611deefdc7',
      link_ids: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    },
    tests: [
      { path: '/admin', expect: 307 },
      { path: '/dashboard', expect: 307 },
      { path: '/debug', expect: 307 },
      { path: '/', expect: 200 },
    ],
  },
  unauthenticated: {
    tests: [
      { path: '/admin', expect: 307 },
      { path: '/dashboard', expect: 307 },
      { path: '/debug', expect: 307 },
      { path: '/', expect: 200 },
    ],
  },
};

async function runTest(userConfig, session) {
  const { tests } = userConfig;
  for (const test of tests) {
    const headers = {};
    if (session) {
      const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
      const baseName = `sb-${projectRef}-auth-token`;
      // The format Supabase writes on the client: URI-encoded JSON array
      const rawValue = encodeURIComponent(
        JSON.stringify([session.access_token, session.refresh_token]),
      );
      const CHUNK_SIZE = 4000; // keep below browser 4 096-byte limit
      const parts = [];
      if (rawValue.length <= CHUNK_SIZE) {
        // single-chunk still gets the "0" suffix
        parts.push(`${baseName}.0=${rawValue}`);
      } else {
        for (let i = 0; i < rawValue.length; i += CHUNK_SIZE) {
          const chunkName = `${baseName}.${parts.length}`;
          parts.push(`${chunkName}=${rawValue.slice(i, i + CHUNK_SIZE)}`);
        }
      }
      headers['Cookie'] = parts.join('; ');
      headers['Authorization'] = `Bearer ${session.access_token}`; // optional
    }
    const response = await fetch(`${appUrl}${test.path}`, { headers, redirect: 'manual' });
    if (response.status !== test.expect) {
      console.error(`❌ FAIL: [${userConfig.email || 'unauthenticated'}] ${test.path} -> Expected ${test.expect}, got ${response.status}`);
    } else {
      console.log(`✅ PASS: [${userConfig.email || 'unauthenticated'}] ${test.path} -> Got ${response.status}`);
    }
    // Log debug headers
    if (response.headers.get('x-debug-user')) {
      console.log(`  [DEBUG] User: ${response.headers.get('x-debug-user')}`);
      console.log(`  [DEBUG] Cookie Sent: ${session ? 'Yes' : 'No'}`);
      console.log(`  [DEBUG] Cookie Value: ${response.headers.get('x-debug-cookie-value')}`);
      console.log(`  [DEBUG] Auth Error: ${response.headers.get('x-debug-error')}`);
    }
  }
}

async function main() {
  const createdUserIds = [];
  try {
    for (const role in testUsers) {
      if (role === 'unauthenticated') continue;
      const config = testUsers[role];
      console.log(`\n--- Setting up user: ${config.email} ---`);
      // Create user
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: config.email,
        password: config.password,
        email_confirm: true,
        app_metadata: config.metadata,
      });
      if (userError) throw new Error(`Error creating user ${config.email}: ${userError.message}`);
      const userId = user.id;
      createdUserIds.push(userId);
      console.log(`User ${userId} created.`);
      // Sign in and get session
      const { data: { session }, error: sessionError } = await createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).auth.signInWithPassword({
        email: config.email,
        password: config.password,
      });
      if (sessionError) throw new Error(`Error signing in ${config.email}: ${sessionError.message}`);
      if (!session) throw new Error('Session not found after sign-in.');
      await runTest(config, session);
    }
    console.log('\n--- Testing unauthenticated user ---');
    await runTest(testUsers.unauthenticated);
  } catch (error) {
    console.error('\n🚨 Test run failed:', error.message);
  } finally {
    if (createdUserIds.length > 0) {
      console.log('\n--- Cleaning up created users ---');
      for(const id of createdUserIds) {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) {
          console.error(`Failed to delete user ${id}: ${error.message}`);
        } else {
          console.log(`User ${id} deleted.`);
        }
      }
    }
  }
}

main();