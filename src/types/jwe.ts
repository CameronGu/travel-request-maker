// src/types/jwe.ts
// ----------------------------------------
// Shared TypeScript definitions for the JWE claim‑set that travels inside
// every compact link.  Two flavours are provided:
//  • `JWEClaimSet` – canonical, verbose keys used across the app.
//  • `ShortClaimSet` – minified version actually serialized before gzip; keys
//    match the mapping table in `docs/jwe-link-spec.md`.
// ----------------------------------------

/**
 * Full (readable) claim set as consumed by React components.  When generating
 * a link we convert this to the ShortClaimSet via `fieldMap` helpers, deflate,
 * then encrypt.
 */
export interface JWEClaimSet {
  /** Schema version */
  v: number;
  /** UI scope / privileges */
  role: 'attAdmin' | 'clientAdmin' | 'requester';
  /** Expiry ISO timestamp (optional) */
  exp?: string;

  // —— Hierarchical IDs ——
  client: string; // UUID
  project?: string; // UUID — absent on client‑level links

  // —— Request data ——
  /**
   * Full request object, OR — when `isChg` is true — the *proposed* delta.
   */
  request?: Record<string, unknown>;

  /** Original requestId (guid) */
  rid?: string;
  /** Change‑request flag */
  isChg?: boolean;

  /** Miscellaneous metadata: budget, ccEmails, branding, etc. */
  meta?: Record<string, unknown>;
}

/**
 * Minified representation used for on‑the‑wire JWE payload. Field names are
 * intentionally 1–2 characters to reduce size before gzip.
 */
export interface ShortClaimSet {
  v: number;
  r: 'a' | 'c' | 'q'; // roles → a = attAdmin, c = clientAdmin, q = requester
  e?: string; // exp
  c: string; // client id
  p?: string; // project id
  d?: Record<string, unknown>; // request data (d = data)
  i?: string; // requestId
  g?: 1; // isChg flag, 1 = true
  m?: Record<string, unknown>; // meta
}
