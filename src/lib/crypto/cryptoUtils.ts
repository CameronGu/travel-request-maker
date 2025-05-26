// src/lib/crypto/cryptoUtils.ts
// ----------------------------------------
// Lightweight helpers for JWE‑style link encryption / decryption.
// ⚠️  These are **NOT** production‑grade yet: they skip
//      * key rotation
//      * real error handling
//      * sophisticated base64‑url helpers
// but they compile and allow round‑trip tests in Vitest.
// ----------------------------------------

// eslint-disable @typescript-eslint/ban-types

import pako from 'pako';

// --- Constants -------------------------------------------------------------
// const AES_ALGO: AesGcmParams = { name: 'AES-GCM', iv: new Uint8Array(12) };
const TAG_LENGTH_BITS = 128;
const JWE_HEADER = { alg: 'dir', enc: 'A256GCM', zip: 'DEF', v: 1 } as const;

// --- Small helpers ---------------------------------------------------------
const toUint8 = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), c => c.charCodeAt(0));

const toB64Url = (bytes: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const fromB64Url = (str: string): Uint8Array =>
  toUint8(str.replace(/-/g, '+').replace(/_/g, '/'));

// Generates a random 96‑bit IV each time we encrypt
const randomIv = (): Uint8Array => crypto.getRandomValues(new Uint8Array(12));

// --- Key handling ----------------------------------------------------------
export async function importKeyFromEnv(): Promise<CryptoKey> {
  const envB64 = process.env.NEXT_PUBLIC_JWE_KEY || '';
  if (!envB64) throw new Error('NEXT_PUBLIC_JWE_KEY missing');
  return crypto.subtle.importKey('raw', fromB64Url(envB64), 'AES-GCM', false, [
    'encrypt',
    'decrypt'
  ]);
}

// --- Public API ------------------------------------------------------------

/**
 * Compress ➜ Encrypt ➜ JWE compact string
 */
export async function encryptPayload<T extends object>(payload: T, key: CryptoKey): Promise<string> {
  const compressed = pako.deflateRaw(JSON.stringify(payload));
  const iv = randomIv();
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: TAG_LENGTH_BITS }, key, compressed);

  const view = new Uint8Array(cipher);
  const tag = view.slice(-16); // 128‑bit tag
  const ct = view.slice(0, -16);

  const headerB64 = toB64Url(new TextEncoder().encode(JSON.stringify(JWE_HEADER)));
  return `${headerB64}..${toB64Url(iv)}.${toB64Url(ct)}.${toB64Url(tag)}`;
}

/**
 * Decode compact JWE ➜ Decrypt ➜ Inflate ➜ JSON.parse
 */
export async function decryptPayload<T = unknown>(token: string, key: CryptoKey): Promise<T | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 5) return null;
    const [, , ivB64, ctB64, tagB64] = parts;
    const iv = fromB64Url(ivB64);
    const cipher = new Uint8Array([...fromB64Url(ctB64), ...fromB64Url(tagB64)]);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: TAG_LENGTH_BITS }, key, cipher);
    const inflated = pako.inflateRaw(new Uint8Array(decrypted), { to: 'string' });
    return JSON.parse(inflated) as T;
  } catch {
    return null;
  }
}
