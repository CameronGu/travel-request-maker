# **Product Requirements Document – Travel‑Request Platform Rebuild**

v3.1.2

> **Status (2025‑05‑28):** This file merges all prior content with the final decisions from the *Big‑Picture Expansion Pack* and *admin‑ui‑wireframes‑v3.1‑mvp*.  Includes traveler chips + inline data-quality warnings pattern.  Phase‑2+ scope remains at the end.

---

## 0  Purpose & Ownership

* **Goal:** Ship a production‑ready Next.js 15 app backed by Supabase that replaces the legacy prototype, delivers Request Queue, share links, dynamic forms, and admin dashboards.
* **Success metrics:** `pnpm build && pnpm test` green; Lighthouse ≥ 90; demo submits hotel/flight/car via share‑link; RLS blocks unauthorized access.

---

## 1  Current Codebase Snapshot (May 28 2025)

| Path                               | Exists | State                                                       |
| ---------------------------------- | ------ | ----------------------------------------------------------- |
| `src/app/`                         | ✅      | Layout, Tailwind, claymorphism tokens.                      |
| `src/components/DynamicForm.tsx`   | ✅      | **Empty stub** (renamed section in docs).                   |
| `src/components/RequestQueue.tsx`  | ⬜      | **TODO**.                                                   |
| `src/components/TravelerModal.tsx` | ✅      | **Empty stub**.                                             |
| `src/form-fields/*.json`           | ✅      | Authoritative specs (v 2.3.3 pending phone/email required). |
| `src/lib/link/linkCodec.ts`        | ✅      | Stubs JWE helpers; will switch to *link‑object* lookup.     |
| `src/lib/supabase/*`               | ✅      | Client bootstrap but not wired.                             |
| `legacy/**`                        | ✅      | Frozen read‑only.                                           |
| `docs/`                            | ✅      | Full spec tree.                                             |

> **TaskMaster must treat any file marked ***stub*** or ***TODO*** as work.**

Reference docs tree:
All living spec documents reside under docs/latest.  Always import from this path when generating tasks or code.
```
docs/latest
  ├─ admin-ui-wireframes.md
  ├─ form-specs.md
  ├─ jwe-link-spec.md
  ├─ legacy-mapping.m
  └─ roles-permissions.md
```
---

## 2  Core Features (MVP)

1. **Project‑based Request Flow** – each Request row references a Project row (budget defaults, client context).
2. **Link‑Object Share Links** – token = `link_id`; server‑side `links` row stores snapshot traveller IDs, role, expiry, and flag `allow_add_travelers` (default *false*).  No live editing in MVP. ↗︎ Full spec: docs/latest/jwe-link-spec.md.
3. **DynamicForm (Declarative) Engine** – renders forms from JSON specs with RHF + Zod. ↗︎ Field definitions: docs/latest/form-spec.md.
4. **Traveler Management** – per‑client CRUD with placeholder toggle; required `phone`, `primaryEmail`; duplicate hash `sha256(E164(phone)+lower(email))`.
5. **Request Queue & Batch Submission** – save drafts, multi‑select, single payload submission to ATT.
6. **Summary Generation** – human‑readable export plus link to Supabase row for audit/export; no separate JSON payload required in MVP since data is stored and retrievable live.
7. **Admin Dashboards** – ATT & Client Admin UIs; admins can *also* create requests and push them into queue. ↗︎ Wireframes: docs/latest/admin-ui-wireframes.md.
8. **Real‑time Sync** – subscription events via Supabase channel (Phase 2 switch).
9. Claymorphism Theme – shadcn/ui + claymorphism token file.
10. **Accessibility First** – WCAG 2.1 AA; CI axe tests.

---

## 3  Technical Constraints & Stack

| Area         | Constraint                                                    |
| ------------ | ------------------------------------------------------------- |
| Framework    | **Next.js 15.3 (App Router)**, React 19.                      |
| Lang / Build | TypeScript 5, pnpm.                                           |
| State        | TanStack Query 5 (+ offlineDrafts flag) + Zustand for UI.     |
| Backend      | Supabase 2.49 (`@supabase/supabase-js`) + Row‑Level Security. |
| Styling      | Tailwind 3 + shadcn/ui tokens; claymorphism palette.          |
| Crypto       | `@noble/ciphers` + WebCrypto; static 256‑bit key.             |
| Testing      | Vitest + vitest‑axe + Testing‑Library.                        |
| CI           | GitHub Actions; bundle ≤ 250 kB; every file ≤ 300 LOC.        |

---

## 4  Data Model (Supabase)

| Table         | Columns                                                                                                                                                                              | Notes                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `clients`     | `id uuid` PK, `name`                                                                                                                                                                 | Seed via ATT UI.         |
| `projects`    | `id uuid`, `client_id` FK, `name`, `budget_guidance` jsonb, `clientReferenceLock` bool                                                                                               |                          |
| `travelers`   | `id uuid`, `client_id` FK, `firstName`, `lastName`, `phone`, `primaryEmail`, `isPlaceholder` bool, `traveler_hash` text, timestamps                                                  | RLS isolates by client.  |
| `requests`    | `id uuid`, `project_id` FK, `type` enum, `blob` jsonb, `created_via_link_id` uuid                                                                                                    | Stores request JSON.     |
| `links`       | `id uuid` PK, `client_id` FK, `project_id` FK, `role` text, `allow_add_travelers` bool default false, `traveler_ids uuid[]`, `expires_at` timestamptz, `created_by` uuid, timestamps | Snapshot traveller list. |
| `access_logs` | `id`, `link_id`, `traveler_id`, `ts`                                                                                                                                                 | **Phase 2** optional.    |

---

## 5  Roles & Permissions (Supabase RLS)

| Role          | Scope            | Abilities                                                                                 |
| ------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `attAdmin`    | Global           | CRUD all rows, create links, create requests.                                             |
| `clientAdmin` | client           | CRUD travelers & projects inside client; create links & requests.                         |
| `requester`   | project via link | Read own travelers list (snapshot); create drafts/requests; cannot edit travelers in MVP. |

Policy snippets live in docs/latest/roles-permissions.md.

---

## 6  Link Codec & Share‑Link Flow

* \*\*Token → \*\***`{ link_id, exp }`** (JWE v 2.2 header unchanged).
* Front‑end decodes, fetches row `links.id`, verifies expiry.
* Micro‑copy on modal: *“Link will include the **static list** of travelers selected above.”*
* `allow_add_travelers` flag reserved for Phase 2 (checkbox disabled in UI).
* Full encryption & size benchmarks: docs/latest/jwe-link-spec.md.

---

## 7  DynamicForm Specs

* Field dictionary is maintained in docs/latest/form-spec.md (currently v 2.3.4).  These JSON specs drive the React engine, Zod validation, and Supabase migrations.
* Engine must expose util `isTravelerComplete()` used by Request Queue before submission.

---

### 7.5 Traveler Selector (UI Pattern)

> **Purpose** — Attach one or more saved Travelers to a request while giving immediate feedback on data completeness.

| Piece                     | Spec                                                                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Control**               | `<TravelerSelector formType="hotel" value={ids} onChange={…} editable={boolean} />`                                                                            |
| **Internals**             | Combines `@headlessui/react` `<Combobox>` with a chip row.                                                                                                     |
| **Chip states**           | `default` (all required fields present) ▪ `warning` (incomplete but non‑blocking) ▪ `error` (blocks submit).                                                   |
| **Edit / Remove actions** | Shown only when `editable=true` **and** user has `role ∈ {admin, coordinator}` **OR** link flag `allow_add_travelers`.                                         |
| **Validation util**       | `isTravelerComplete(traveler, formType)` exported by `src/lib/travelers/rules.ts`.`REQUIREMENTS_BY_TYPE` centralises the per‑form field lists.                 |
| **Accessibility**         | Each chip is a `button role="button"` with `aria-pressed="true"`, `aria-description` = “Missing : phone, passport expiry”. Combobox complies with WCAG 2.1 AA. |
| **Mobile overflow**       | If > 4 chips or viewport `< sm`, chips collapse into `[ + N selected ]` pill; tapping opens `TravelerListSheet`.                                               |

* **Traveler Edit Rights (chip pencil icon)**  Default **off** for link‑based requesters. Enabled when link JWT flag `allow_add_travelers = true` *or* role ∈ `admin, coordinator`.

---

## 8  Admin UI Wireframes Reference

* Component blueprints are captured in docs/latest/admin-ui-wireframes.md.  TaskMaster must translate those wireframes into Next.js pages/components and connect them to Supabase tables plus the link‑generator utilities.

---

## 9  Implementation Milestones & Exit Criteria

| ID     | Milestone                        | Exit Criteria                                                                           |
| ------ | -------------------------------- | --------------------------------------------------------------------------------------- |
| **M1** | **Supabase Core**                | Schema + RLS compile; `features.supabase` true; tests prove role isolation.             |
| **M2** | **DynamicForm Engine**           | Hotel/Flight/Car forms render; invalid submits blocked; unit tests snapshot validated.  |
| **M3** | **Link Codec v4**                | Encode/Decode link\_id tokens; DB lookup passes; link copy UI.                          |
| **M4** | **Admin UI & Links Tab**         | ATT admin can create client/project + link; Client admin dashboard; Request Queue stub. |
| **M5** | **Request Queue & Batch Submit** | Draft save, multi‑select, submit; Summary card output.                                  |
| **M6** | **QA & Accessibility**           | Vitest ≥ 70 %; axe tests zero violations; CI green.                                     |
| **M7** | **Legacy cleanup & bundle**      | No `/legacy` imports; JS bundle < 250 kB.                                               |

---

## 10  CI & Tooling

* ESLint flat config; 300 LOC file limit enforced.
* GitHub Action runs lint → test → a11y → build → bundle analyse.

---

## 11  Environment & Feature Flags

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_JWE_KEY` (256‑bit) – required before E2E tests.

```ts
export const features = {
  /** Enables client‑side caching of drafts when offline. */
  offlineDrafts: false,

  /** Switches persistence layer to Supabase when both env vars are set. */
  supabase:
    typeof process !== 'undefined' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;
```

---

## 12  Design System

* Claymorphism token file + shadcn/ui, Tailwind semantic classes.
* `@headlessui/react` for combobox/listbox components.

#### New semantic tokens (traveler chips)

| Token          | Fallback                    | Usage                          |
|----------------|-----------------------------|--------------------------------|
| `bg-chip`      | `colors.surface.200`        | Chip background                |
| `ring-warning` | `colors.amber.500 / 40%`    | Incomplete but non-blocking    |
| `ring-error`   | `colors.rose.500 / 40%`     | Blocks submission / hard error |

- All design tokens live in `styles/tokens.ts` and are typed for use across Tailwind, runtime TS, and CSS variable theming.  
- The generated CSS variables are defined in `styles/theme.css` for runtime theming.  
- Themes are hot-swappable via `next-themes` (`.theme-claymorphism`, `.dark`, etc.).

---

## 13  Legacy Code Guidelines

1. `/legacy/**` is read‑only. 2. Do **not** revive full‑payload JWE. 3. Remove legacy code by M7.

---

## 14  Manual‑Evaluation / Open‑Decision Items

| Item                                     | Owner    | Notes                           |
| ---------------------------------------- | -------- | ------------------------------- |
| Flip `features.supabase` to true post‑M1 | Dev Lead |                                 |
| Offline Drafts feature                   | Product  | Remains false; revisit post‑M6. |
| OTP‑protected links                      | Security | Phase 2.                        |
| Column encryption                        | DevOps   | Phase 2.                        |
| Bulk traveler import                     | Product  | Phase 2.                        |
| Live link editing                        | Product  | Phase 2.                        |

---

## 15  Change Log

| Ver             | Date       | Notes                                                                                                                        |
| --------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **3.1.2‑patch** | 2025‑05‑29 | Added explicit `docs/latest/{file}` prefixes to every cross‑document reference; no functional changes.                       |
| **3.1.2**       | 2025‑05‑28 | Consolidated final Expansion Pack decisions and traveler chips pattern.                                                      |
| 3.1.1           | 2025‑05‑28 | Added traveler chips + inline data‑quality warnings pattern.                                                                 |
| 3.1.0‑rev3      | 2025‑05‑28 | Added `links` table, Request Queue, traveler placeholders, hash duplicate detection, admin request path, DynamicForm rename. |
| 3.1             | 2025‑05‑26 | Previous snapshot.         

---

## 16  Phase 2 & Phase 3 Backlog (non‑MVP)

* Column‑level PII encryption via pgcrypto + key rotation.
* Traveler Pools & Tags; allow requester add travelers when flag true.
* Live link editing (update traveler\_ids / expiry without new token).
* Access‑log trigger & anomaly alerts.
* Bulk CSV traveler import.
* OTP‑protected links or full authentication; time‑boxed roles.
* Real‑time sync (TanStack Query subscriptions) upgrade.

---