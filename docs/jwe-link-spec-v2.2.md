# **JWE Link Specification**

**Version:** **v2.2** — *merges all unique material from* **link-access-hierarchy-v2.1** *and deprecates that file*&#x20;

---

## 0 Purpose & Scope

Defines a tamper-evident, copy-and-paste-friendly link that embeds **all** state needed to reopen a Travel Request or Admin context on any device.
Field-to-short-key mapping now lives entirely in **form-specs-v 2.3 +**, so this spec focuses on encryption, compression, claims, size targets, and implementation guidance.

---

## 1 High-Level Flow

1. Authoring context builds a JSON payload = *claims (§2)* + optional **`request`** object.
2. `request` object is **short-keyed** via `/lib/fieldMap.ts` (auto-generated from *form-specs*). Dot-notation IDs (e.g. `pickup.location.lat`) flatten to unique keys (e.g. `pla`).
3. Payload → **DEFLATE** → **JWE Compact** (`alg:"dir"`, `enc:"A256GCM"`).
4. Final link:

```
https://travel.att.app/#TR?jwe=<compact-jwe>
```

Typical complex requests remain **< 700 chars**, worst-case < 2 024 chars (see §7).

---

## 2 Claim Schema

| Claim     | Type            | Req | Notes                                       |
| --------- | --------------- | --- | ------------------------------------------- |
| `v`       | number          | ✅   | Spec version (this doc = **2.2**).          |
| `role`    | string          | ✅   | `attAdmin` \| `clientAdmin` \| `requester`. |
| `client`  | string (UUID)   | ✅   | Client scope.                               |
| `project` | string (UUID)   | ⬜   | Optional — absent for client-level links.   |
| `exp`     | ISO 8601 string | ⬜   | Link invalid after timestamp.               |
| `request` | object          | ⬜   | **Short-keyed** payload or change-req diff  |

Validation is handled by `jweSchema.ts`, importing `fieldMap.ts` to ensure every key is recognised.

---

## 3 Encoding Pipeline

```
JSON  →  minify  →  DEFLATE  →  AES-256-GCM  →  JWE compact-serialisation
```

### 3.1 Header

```json
{ "alg":"dir", "enc":"A256GCM", "zip":"DEF", "v":2 }
```

*`v` mirrors the claim `v`.*

---

## 4 Crypto Details

* **Static key** (MVP) – 256-bit hex in `NEXT_PUBLIC_JWE_KEY`.
* **Rotation** – future `kid` header + multi-key resolver.
* Library – `@noble/ciphers/webcrypto` with SubtleCrypto fallback.

---

## 5 Request Object Encoding

* **Single Source of Truth** – *form-specs* tables.
* **Dot-notation** – each sub-field is its own map entry; dots become `/` during minify and are restored on decode.
* **Omit defaults** before compression to keep size small.

---

## 6 Key Management (merged from link-access-hierarchy)&#x20;

| Stage          | Current                                                         | Future                                   |
| -------------- | --------------------------------------------------------------- | ---------------------------------------- |
| Secret storage | 256-bit env var bundled at build                                | Supabase RLS endpoint                    |
| Rotation       | Bump env + publish SPA patch; keep old key array in `linkCodec` | Header `kid` + on-demand key fetch       |
| Revocation     | N/A                                                             | Token revocation list hosted in Supabase |

---

## 7 Size Benchmarks  (unchanged)&#x20;

| Scenario                  | Raw JSON | DEFLATE     | JWE token | Final URL     |
| ------------------------- | -------- | ----------- | --------- | ------------- |
| 1 hotel + 1 traveller     | 1 800 B  | **480 B**   | 612 B     | ≈ 690 chars   |
| 3 forms + 3 travellers    | 3 950 B  | **1 090 B** | 1 235 B   | ≈ 1 350 chars |
| “Max” synthetic (5 trav.) | 5 400 B  | **1 720 B** | 1 860 B   | ≈ 2 020 chars |

Unit test `linkCodec.test.ts` fails if URL > 2 024 chars.

---

## 8 `linkCodec` TypeScript API  (merged)&#x20;

```ts
// /lib/crypto/linkCodec.ts
export interface RequestBlobV2 { [k: string]: unknown }   // short-keyed

export function encodeBookingLink(blob: RequestBlobV2): string;
/** Returns null if token invalid or tampered */
export function decodeBookingLink(token: string): RequestBlobV2 | null;
```

*Round-trip, tamper, and size-limit tests live in `linkCodec.test.ts`.*

---

## 9 Change-Request Flow  (merged)&#x20;

1. Client creates new blob with same `rid` + `isChg:1`.
2. Decoder detects `isChg`, shows diff vs original embedded object.
3. Approval links always embed the **complete** latest state (no dependency chain).

---

## 10 Open Questions

* Per-client *ultra-short* overrides — worth complexity?
* Separate encryption key per `role`?

---

## 11 Changelog

| Ver     | Date (2025)                                                                                                                                      | Notes |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| 2.0     | Apr – initial compact-JWE spec                                                                                                                   |       |
| 2.1     | May – delegated field map to form-specs; dot-notation rules                                                                                      |       |
| **2.2** | May – **merged size benchmarks, key-management, API contract & change-request flow from *link-access-hierarchy-v2.1***; that file now deprecated |       |

---

### Deprecation notice

*link-access-hierarchy-v2.1.md* is obsolete. All future references must point to **JWE Link Specification v2.2**.
