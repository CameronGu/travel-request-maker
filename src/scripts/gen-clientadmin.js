require('dotenv').config(); // loads .env into process.env
const secret = process.env.SUPABASE_JWT_SECRET;

const jwt = require('jsonwebtoken');

const payload = {
  sub: 'test-clientadmin-id',
  email: 'clientadmin@example.com',
  app_role: 'clientAdmin',
  client_id: 'f798432d-715c-4235-a33b-efbc5b15daec',
  aud: 'authenticated',
  iss: 'https://cqavkotsnpnzjyewwpgi.supabase.co/auth/v1',
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30)
};

const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
console.log('clientAdmin JWT:', token);