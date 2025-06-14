require('dotenv').config(); // loads .env into process.env
const secret = process.env.SUPABASE_JWT_SECRET;

console.log([...secret]);
console.log(secret.length);

const jwt = require('jsonwebtoken');

const payload = {
  sub: 'test-attadmin-id',
  email: 'admin@example.com',
  app_role: 'attAdmin',
  aud: 'authenticated',
  iss: 'https://cqavkotsnpnzjyewwpgi.supabase.co/auth/v1',
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) // 30 days
};

const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
console.log('attAdmin JWT:', token);