/* eslint-disable no-console */
import 'dotenv/config'; // loads .env into process.env
import jwt from 'jsonwebtoken';

const secret = process.env.SUPABASE_JWT_SECRET;

const payload = {
  sub: 'test-requester-id',
  email: 'requester@example.com',
  app_role: 'requester',
  link_ids: '88589edc-5759-4b64-b128-5c1c37fc91e3',
  client_id: '83081349-bc63-4ca3-9e4b-d8611deefdc7',
  aud: 'authenticated',
  iss: 'https://cqavkotsnpnzjyewwpgi.supabase.co/auth/v1',
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30)
};

const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
console.log('requester JWT:', token);