/* eslint-disable no-console */
import 'dotenv/config';
import jwt from 'jsonwebtoken';

const base64Secret = process.env.SUPABASE_JWT_SECRET;
const rawSecret = Buffer.from(base64Secret, 'base64').toString('utf8');

console.log('Base64 Secret:', JSON.stringify(base64Secret));
console.log('Raw Secret:', JSON.stringify(rawSecret));

// Sign with base64 (as-is)
const tokenBase64 = jwt.sign({ sub: 'id' }, base64Secret, { algorithm: 'HS256' });
console.log('\nToken signed with base64 secret:\n', tokenBase64);

// Sign with raw (decoded)
const tokenRaw = jwt.sign({ sub: 'id' }, rawSecret, { algorithm: 'HS256' });
console.log('\nToken signed with raw secret:\n', tokenRaw);
