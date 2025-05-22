// src/lib/link/linkCodec.ts
// ------------------------------------------------------------
// Thin façade so the rest of the app can simply call
//   encodeBookingLink(payload) → "#TR?jwe=..."
//   decodeBookingLink(fragment) → JWEClaimSet | null
// without worrying about prefixes, tokens, or crypto.
// ------------------------------------------------------------

import type { JWEClaimSet } from '@/types/jwe';
import {
  JWE_PREFIX,
  buildFragment as buildShareFragment,
  parseFragment as parseShareFragment,
} from '@/lib/link/jweLink';

/**
 * Public encoder – returns the complete share‑link fragment (including prefix).
 */
export async function encodeBookingLink(payload: JWEClaimSet): Promise<string> {
  return buildShareFragment(payload);
}

/**
 * Public decoder – accepts either a full URL, a hash fragment, or just the token.
 * Returns `null` on failure / bad prefix / corrupted JWE.
 */
export async function decodeBookingLink<T = JWEClaimSet>(input: string): Promise<T | null> {
  // Strip leading URL parts if present
  const idx = input.indexOf(JWE_PREFIX);
  const tokenOrFragment = idx >= 0 ? input.slice(idx) : input;
  return parseShareFragment<T>(tokenOrFragment);
}