# JSON Web Encryption **Share‑Link** Spec 
version 2.3 (Minimal‑Token Only)

> **Status (2025‑05‑28):** Streamlined for the MVP. The token now carries **only** `{ link_id, exp }`. All other state is persisted in Supabase (`links`, `requests`, etc.).  The former “full‑payload” concept is removed; if ever needed it will be re‑introduced under a new major version.

---

## 0  Purpose

Share links are bearer tokens that gate access to the Request Maker without requiring an account.  They must:

1. Be short enough for email & SMS.
2. Provide an expiry.
3. Identify the server‑side `links` row that holds role, traveler snapshot, and permissions.
4. Be tamper‑evident.

---

## 1  Claim Schema (MVP)

```jsonc
{
  "link_id": "uuid",   // Supabase public.links.id
  "exp":     "ISO"     // RFC3339 expiry timestamp
}
```

*No other claims are allowed in v 2.3.*

---

## 2  Encoding Pipeline

1. **Serialize** → JSON string.
2. **Encrypt** → AES‑256‑GCM using `NEXT_PUBLIC_JWE_KEY`.
3. **Compact JWE** → base64url header.`..`.ciphertext.tag

No DEFLATE step; typical token length ≈ 88 bytes (≈ 120 chars when URL‑encoded).

---

## 3  API Contract

```ts
/**
 *  Encode a link token.
 */
export function encodeLinkToken(linkId: string, exp: Date): string;

/**
 *  Decode or return null if expired / invalid.
 */
export function decodeLinkToken(token: string): { link_id: string; exp: string } | null;
```

---

## 4  Security Notes

* **Key storage** – 32‑byte hex in env var `NEXT_PUBLIC_JWE_KEY`.
* **Replay** – Expiry is enforced server‑side after `exp`.
* **Bearer model** – Anyone with the token gains requester permissions defined by the `links` row.

---

## 5  Size Benchmarks

| Scenario | Token bytes | URL chars |
| -------- | ----------- | --------- |
| Typical  | 88 B        | ≈ 120     |

---

## 6  Change Log

|  Ver | Date       | Notes                                           |
| ---- | ---------- | ----------------------------------------------- |
|  2.3 | 2025‑05‑28 | Stripped full‑payload mode; minimal token only. |
|  2.2 | 2025‑03‑12 | Original full‑payload spec (deprecated).        |

---

> **Deprecated**: The `v` / `request` claims defined in v 2.2 are no longer valid.  Any legacy links must be regenerated.
