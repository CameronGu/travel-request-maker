require('dotenv').config(); // loads .env into process.env
const secret = process.env.SUPABASE_JWT_SECRET;

const jwt = require('jsonwebtoken');

const payload = {
  sub: 'test-clientadmin-id',
  email: 'clientadmin@example.com',
  app_role: 'clientAdmin',
  client_id: '83081349-bc63-4ca3-9e4b-d8611deefdc7',
  aud: 'authenticated',
  iss: 'https://cqavkotsnpnzjyewwpgi.supabase.co/auth/v1',
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30)
};

const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
console.log('clientAdmin JWT:', token);