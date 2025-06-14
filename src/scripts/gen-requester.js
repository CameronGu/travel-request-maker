require('dotenv').config(); // loads .env into process.env
const secret = process.env.SUPABASE_JWT_SECRET;

const jwt = require('jsonwebtoken');

const payload = {
  sub: 'test-requester-id',
  email: 'requester@example.com',
  app_role: 'requester',
  link_ids: ['829c23b2-eb86-4152-a17b-3ed23711e0ad'],
  client_id: 'f798432d-715c-4235-a33b-efbc5b15daec',
  aud: 'authenticated',
  iss: 'https://cqavkotsnpnzjyewwpgi.supabase.co/auth/v1',
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30)
};

const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
console.log('requester JWT:', token);