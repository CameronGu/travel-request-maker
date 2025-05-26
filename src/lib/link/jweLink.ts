// src/lib/link/jweLink.ts
// ---------------------------------------------------------
// Thin wrapper around crypto helpers that builds **compact JWE tokens**
// and helpers for turning them into shareable link fragments.
// ---------------------------------------------------------

import type { JWEClaimSet } from '@/types/jwe';

import { encryptPayload, decryptPayload } from '@/lib/crypto/cryptoUtils';

/**
 * Link prefix inserted **after** the hash (#) when copying to clipboard.
 * We keep it short so the full link remains under e‑mail wrap limits.
 * Example final link:  https://app.att/#TR?jwe=<token>
 */
export const JWE_PREFIX = 'TR?jwe=';

/**
 * NEXT_PUBLIC_JWE_KEY must be **base64‑encoded raw bytes** (32‑bytes after decode).
 */
const sharedKeyPromise: Promise<CryptoKey> = (async () => {
  const base64 = process.env.NEXT_PUBLIC_JWE_KEY ?? '';
  if (!base64) throw new Error('NEXT_PUBLIC_JWE_KEY env var missing');
  const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', binary, 'AES-GCM', false, [
    'encrypt',
    'decrypt'
  ]);
})();

/* ------------------------------------------------------------------
 * Low‑level helpers (token only)
 * ---------------------------------------------------------------- */

export async function encodeToken(payload: JWEClaimSet): Promise<string> {
  const key = await sharedKeyPromise;
  return encryptPayload(payload, key);
}

export async function decodeToken<T = JWEClaimSet>(token: string): Promise<T | null> {
  const key = await sharedKeyPromise;
  return decryptPayload<T>(token, key);
}

/* ------------------------------------------------------------------
 * Link helpers (token + prefix)
 * ---------------------------------------------------------------- */

/**
 * Returns a fragment string ready to append after `#`, e.g.
 *   window.location.origin + '#' + buildFragment(payload)
 */
export async function buildFragment(payload: JWEClaimSet): Promise<string> {
  return JWE_PREFIX + (await encodeToken(payload));
}

/**
 * Accepts either a raw compact‑JWE string **or** a full fragment that starts
 * with our prefix.  Returns the decoded payload or `null` on failure.
 */
export async function parseFragment<T = JWEClaimSet>(fragment: string): Promise<T | null> {
  const token = fragment.startsWith(JWE_PREFIX)
    ? fragment.slice(JWE_PREFIX.length)
    : fragment;
  return decodeToken<T>(token);
}