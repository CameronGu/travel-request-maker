require('dotenv').config(); // loads .env into process.env
const jwt = require('jsonwebtoken');

const secret = process.env.SUPABASE_JWT_SECRET;
if (!secret) {
  console.error('Missing SUPABASE_JWT_SECRET in .env');
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const exp = now + 60 * 60 * 24 * 30; // 30 days

const tokens = {
  TEST_JWT_ATTADMIN: jwt.sign({
    sub: 'test-attadmin-id',
    email: 'admin@example.com',
    app_role: 'attAdmin',
    aud: 'authenticated',
    iss: 'https://cqavkotsnpnzjyewwpgi.supabase.co/auth/v1',
    exp
  }, secret, { algorithm: 'HS256' }),

  TEST_JWT_CLIENTADMIN: jwt.sign({
    sub: 'test-clientadmin-id',
    email: 'clientadmin@example.com',
    app_role: 'clientAdmin',
    client_id: '83081349-bc63-4ca3-9e4b-d8611deefdc7',
    aud: 'authenticated',
    iss: 'https://cqavkotsnpnzjyewwpgi.supabase.co/auth/v1',
    exp
  }, secret, { algorithm: 'HS256' }),

  TEST_JWT_REQUESTER: jwt.sign({
    sub: 'test-requester-id',
    email: 'requester@example.com',
    app_role: 'requester',
    client_id: '83081349-bc63-4ca3-9e4b-d8611deefdc7',
    link_ids: '88589edc-5759-4b64-b128-5c1c37fc91e3',
    aud: 'authenticated',
    iss: 'https://cqavkotsnpnzjyewwpgi.supabase.co/auth/v1',
    exp
  }, secret, { algorithm: 'HS256' })
};

console.log('\nPaste the following into your `.env` file:\n');
for (const [key, value] of Object.entries(tokens)) {
  console.log(`${key}=${value}\n`);
}
