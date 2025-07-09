# Product Requirements Document – Travel Request Management System (AI-Optimized)

> **This is the authoritative PRD for Taskmaster and AI agents. All implementation and planning must reference this document.**

**Version:** v6.0.0 (AI-Optimized, Lean-Pepper, RLS, JWT, State Management)  
**Status:** Authoritative, up-to-date, and ready for Taskmaster parsing.

---

## 0 Glossary

| Term                 | Definition                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Drafts Workspace** | Personal area where users build or edit requests before submission. When a request is submitted it disappears from Drafts and re-appears in History.                              |
| **History**          | Read-only table of requests already submitted. In MVP it shows only the *Submitted* status plus the unique *Request ID*.                                                          |
| **Roles**            | **Super Admin**, **ATT Admin**, **ATT Staff**, **Client Super Admin**, **Client Admin**, **Requester**.                                                                           |
| **Flags**            | Per-user booleans set by Super Admin:<br>• `can_invite_peer_admin` – may invite admins of the same rank.<br>• `can_invite_requesters` – may invite Requesters within their scope. |
| **Preview & Submit** | A modal that shows all multi-selected drafts side-by-side for final review before confirming submission.                                                                          |

---

## 0  Purpose & Ownership

* **Goal:** Ship a production-ready Next.js 15 app backed by Supabase, replacing the legacy prototype, with robust duplicate detection, RLS, magic link authentication, dynamic forms, and admin dashboards.
* **Success metrics:** `pnpm build && pnpm test` green; Lighthouse ≥ 90; demo submits hotel/flight/car via magic link; RLS blocks unauthorized access; duplicate detection meets p95 ≤ 100ms.

---

## 1  Current Codebase Snapshot (as of July 2025)

| Path                               | Exists | State                                                       |
| ---------------------------------- | ------ | ----------------------------------------------------------- |
| `src/app/`                         | ✅      | Layout, Tailwind, claymorphism tokens.                      |
| `src/components/DynamicForm.tsx`   | ✅      | **Implemented; core functionality present. May need further modularization/enhancements.** |
| `src/components/RequestQueue.tsx`  | ⬜      | **TODO**                                                    |
| `src/components/TravelerModal.tsx` | ✅      | **Implemented; functional for local storage. Supabase integration and further enhancements may be needed.** |
| `src/components/LinksTab.tsx`      | ⬜      | **TODO**                                                    |
| `src/components/AdminDashboard.tsx`| ⬜      | **TODO**                                                    |
| `src/components/TravelerDirectory.tsx` | ⬜  | **TODO**                                                    |
| `src/form-fields/*.json`           | ✅      | Authoritative specs (v2.3.4, phone/email required).         |
| `src/lib/supabase/*`               | ✅      | Client bootstrap, not fully wired.                          |
| `src/lib/validation/phone.ts`      | ⬜      | **TODO** – E.164 normalization and validation.              |
| `src/lib/contacts.ts`              | ⬜      | **TODO** – JS normalizers for phone/email.                  |
| `legacy/**`                        | ✅      | Frozen read-only.                                           |
| `docs/`                            | ✅      | This document and supporting specs.                         |

> **TaskMaster must treat any file marked _TODO_ as work.**

---

## 2  Core Features (MVP)

1. **User & Role Management** – invite, promote, deactivate users (permission-flag driven).
2. **Requester Drafts Dashboard** – create or edit drafts, multi-select, then *Preview & Submit*.
3. **Submitted Requests History** – read-only list (shows *Request ID*, *Submitted* status, submitted date).
4. **Project-based Request Flow** – Each request references a project (budget defaults, client context).
5. **Magic Link Authentication** – Email-based identity with Supabase Auth; time-limited, revocable access.
6. **DynamicForm Engine** – Renders forms from JSON specs with RHF + Zod.
7. **Traveler Management** – Per-client CRUD, placeholder toggle, required phone/email, duplicate detection (Lean-Pepper).
8. **Request Queue & Batch Submission** – Save drafts, multi-select, single payload submission to ATT.
9. **Summary Generation** – Human-readable export plus link to Supabase row for audit/export.
10. **Admin Dashboards** – ATT & Client Admin UIs; admins can create requests and push to queue.
11. **Real-time Sync** – Live updates via Supabase subscriptions.
12. **Claymorphism Theme** – shadcn/ui + claymorphism token file.
13. **Accessibility First** – WCAG 2.1 AA; CI axe tests.
14. **Lean-Pepper Duplicate Detection** – Multi-tier contact-hash checks (EXACT/STRONG/SOFT) with ≤ 100 ms p95 SLA.

> **Definition:** *The **Drafts Workspace** is a per-user draft area; once an item is submitted it vanishes from the Drafts Workspace and appears in **History***.

---

## 3  Technical Constraints & Stack

| Area         | Constraint                                                    |
| ------------ | ------------------------------------------------------------- |
| Framework    | **Next.js 15.3 (App Router)**, React 19.                      |
| Lang / Build | TypeScript 5, pnpm.                                           |
| State        | TanStack Query 5 (server state) + Zustand (UI state only).    |
| Backend      | Supabase 2.49 (`@supabase/supabase-js`) + Row-Level Security. |
| Styling      | Tailwind 3 + shadcn/ui tokens; claymorphism palette.          |
| Auth         | Supabase Auth with magic links; no client-side encryption.    |
| Testing      | Vitest + vitest-axe + Testing-Library.                        |
| CI           | GitHub Actions; bundle ≤ 300 kB; every file ≤ 300 LOC.        |

---

## 4  Data Model & Schema (Supabase)

### 4.1 Core Tables

(See full DDL in migration files. Key tables: `clients`, `projects`, `travelers`, `requests`, `links`, `access_logs`, `traveler_contacts`, `dup_findings`, `tenant_peppers`, `audit_log`.)

- **All tables have RLS enabled.**
- **Duplicate detection uses `traveler_contacts` and `dup_findings` (see §7).**
- **Audit logging via `audit_log` and triggers.**

---

### 4.2 Schema Deltas

#### `users`

```sql
add column can_invite_peer_admin  boolean not null default false;
add column can_invite_requesters  boolean not null default false;
```

#### `requests`

```sql
create type request_status as enum (
  'draft','submitted','accepted','assigned',
  'in_progress','pending_client','on_hold',
  'completed','cancelled','rejected'
);
alter table requests add column status request_status not null default 'draft';
alter table requests add column request_id text generated always as (lpad(id::text, 8, '0')) stored;
```

#### `request_status_log`

```sql
create table request_status_log (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id),
  from_status request_status,
  to_status   request_status,
  changed_by  uuid references users(id),
  changed_at  timestamptz default now()
);
```

*Add trigger on `requests` that writes to `request_status_log` for every status change.*

---

## 5  Authentication & Authorization System

### 5.1 Magic Link Authentication Flow

1. Client admin creates link in UI with target email
2. System creates link record in database
3. System sends magic link email via Supabase Auth
4. User clicks magic link → auto-login with scoped JWT
5. User lands on request form with proper permissions
6. JWT contains `link_ids` and `client_id` for RLS enforcement

### 5.2 JWT Claims Structure (see also §20)

- Claims are stored in `raw_app_meta_data` in `auth.users`.
- **Required claims:**
  - `role`: `app_att_admin` | `app_client_admin` | `app_requester`
  - `client_id`: UUID (for client_admin/requester)
  - `link_ids`: comma-separated UUIDs (for requester)

**Example payloads:**
```json
// app_att_admin
{ "role": "app_att_admin" }
// app_client_admin
{ "role": "app_client_admin", "client_id": "83081349-bc63-4ca3-9e4b-d8611deefdc7" }
// app_requester
{ "role": "app_requester", "client_id": "83081349-bc63-4ca3-9e4b-d8611deefdc7", "link_ids": "a1b2c3d4-e5f6-7890-1234-567890abcdef,b2c3d4e5-f6a7-8901-2345-67890abcdef0" }
```

- **Populate claims** via encrypted link/invitation system and backend logic (triggers/functions) on user creation or role change.

### 5.3 Roles, Flags, and RLS Invitation Policy

| Role                   | Scope                  | Default Flags                                                     | May invite / create                                |
| ---------------------- | ---------------------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| **Super Admin**        | Entire platform        | —                                                                 | Super Admin, ATT Admin                             |
| **ATT Admin**          | All ATT + all clients  | `can_invite_peer_admin = FALSE`<br>`can_invite_requesters = TRUE` | ATT Staff; Requester; **ATT Admin** if flag = TRUE |
| **ATT Staff**          | ATT internal workspace | `can_invite_requesters = FALSE`                                   | Requester if flag = TRUE                           |
| **Client Super Admin** | Single client tenant   | `can_invite_peer_admin = FALSE`                                   | Client Admin; Requester                            |
| **Client Admin**       | Same tenant            | `can_invite_peer_admin = FALSE`                                   | Requester; **Client Admin** if flag = TRUE         |
| **Requester**          | Own drafts & history   | —                                                                 | none                                               |

**Propagation rule:** Newly-invited admins inherit `can_invite_peer_admin = FALSE` by default. The inviter must explicitly tick a check-box to grant the flag.

**RLS invitation policy (pseudo-sql)**

```
-- peer-admin
INSERT users WHEN new.app_role = current_user.app_role
              AND current_user.can_invite_peer_admin
-- requester
OR (new.app_role = 'requester' AND current_user.can_invite_requesters)
-- super override
OR current_user.role = 'super_admin';
```

---

## 6  State Management & Supabase Integration

### 6.1 Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
- Required for Supabase features.
- Validate with `pnpm exec tsx scripts/validate-env.ts`.

### 6.2 Provider Setup (React/Next.js)

- SSR-safe: `src/app/layout.tsx` is a Server Component.
- Client-only providers (React Query, Theme) in `src/app/ClientProviders.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "next-themes";
export function ClientProviders({ children }) {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 2, refetchOnWindowFocus: true, staleTime: 60 * 1000, gcTime: 5 * 60 * 1000 },
      mutations: { retry: 1 },
    },
  }));
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
```

- Usage in layout.tsx:
```tsx
import { ClientProviders } from "./ClientProviders";
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
```

### 6.3 Supabase Client & Storage Driver

- Supabase client:
```ts
import { getSupabaseClient } from '@/lib/supabase/client';
const supabase = getSupabaseClient();
```
- Storage driver:
```ts
import { getActiveDriver } from '@/lib/storage';
const driver = getActiveDriver();
```
- Feature flag: `features.supabase` (from `src/config.ts`) controls Supabase/LocalDriver.

### 6.4 Test & Mock Patterns

- Mock `getActiveDriver` in unit tests.
- No global side effects; drivers/clients are memoized.
- No env vars needed for tests unless testing Supabase integration directly.

### 6.5 Real-time & Tree-shake

- Real-time hooks (`useRequestsRealtime`, `useTravelersRealtime`) are no-ops if `features.supabase` is false.
- When `features.supabase=false`, no `@supabase` code is included in the client bundle.

### 6.6 E2E/Integration Mock Patterns

- Use Playwright or Cypress for UI/real-time simulation.
- For local Supabase, use the Supabase CLI to spin up a test instance.

### 6.7 Troubleshooting

- SSR errors: ensure hooks/providers are only in Client Components.
- Build errors about Deno/Edge functions: ensure excluded from main app's `tsconfig.json`.

---

## 7  Lean-Pepper Duplicate-Traveler Detection (Spec v1.1)

### 7.1 Business Context

- Multitenant SaaS for corporate-travel management
- Core table: `travelers(id uuid PK, client_id uuid, first_name, last_name, created_by, created_at, traveler_hash text **DEPRECATED**)`
- Tenancy isolation: PostgreSQL RLS keyed on Supabase JWT claims (`client_id`, `role`)
- Roles: `attAdmin`, `clientAdmin`, `requester` (magic-link)
- Flag: `allow_add_travelers` (Boolean returned to the RPC)
- SLA: Insert + duplicate-check ≤ 100 ms @ 95th percentile
- Scale: ≤ 100k travelers, ≤ 300k contacts

### 7.2 Functional Goals

- **G1:** Block insert when *both* phone *and* email match an existing traveler (EXACT)
- **G2:** Popup "Confirm?" when a single contact matches (STRONG)
- **G3:** Show non-blocking banner when only fuzzy name matches (SOFT)
- **G4:** Never leak PII across tenant or role boundaries
- **G5:** Pure SQL/JS implementation — no external queues, workers, or triggers

### 7.3 Normalization & Hashing Helpers (SQL + JS)

- See `/lib/contacts.ts` for JS twins of SQL functions.
- SQL:
```sql
CREATE OR REPLACE FUNCTION normalise_phone(raw text) RETURNS text ...
CREATE OR REPLACE FUNCTION normalise_email(raw text) RETURNS text ...
CREATE TABLE IF NOT EXISTS tenant_peppers (...);
CREATE OR REPLACE FUNCTION get_tenant_pepper(p_client uuid) RETURNS bytea ...;
```

### 7.4 Schema Additions

- `traveler_contacts` (many-to-one, per-contact normalization + HMAC hash)
- `dup_findings` (audit trail of detected duplicates)
- `tenant_peppers` (per-tenant pepper for hashing)
- `dup_collect()` (central SQL collector)
- `create_traveler()` (primary RPC wrapper)
- `merge_travelers()` (admin-only stub)

### 7.5 RLS Policies (see §5.3)

- RLS enabled on all tables; policies enforce client/role isolation.

### 7.6 Duplicate Collector Logic (SQL)

- See full SQL in migration files. Key logic:
  - EXACT: both phone + email match same candidate
  - STRONG: any single contact hash clash
  - SOFT: fuzzy first & last name similarity

### 7.7 Pepper Rotation SOP

1. Add `next_pepper` column to `tenant_peppers`
2. Off-peak: batch re-hash `contact_hash` with `next_pepper`
3. Swap `pepper ← next_pepper`, drop temp column, commit

### 7.8 Front-end Integration Rules

- Call `create_traveler()` with full contact JSON
- Parse returned `findings[]`:
  - Requester UI: block on EXACT, confirm modal on STRONG, toast on SOFT
  - Admin UI: always show merge modal; on "Merge" call `merge_travelers(src,dst)`
- React code must read from `dup_findings` (ANY confidence); keep legacy column until refactor complete
- JS normalizers for phone/email must match SQL logic

### 7.9 Testing & CI

- **Unit SQL:** pgTAP (normalization, hash repeatability, threshold, RLS isolation)
- **API:** Supabase JS + Vitest (block/confirm/toast paths)
- **Browser:** Playwright (UI modals, merge removes dup chip)
- **Load:** k6 or pgbench (10k inserts ≤ 100 ms @ p95)
- CI matrix: Vitest + Playwright + pgTAP

### 7.10 Deliverables

1. SQL migration file(s) for §7.3–§7.7
2. Supabase TypeScript service layer for `create_traveler`, `merge_travelers`
3. JS normalizer helpers in `/lib/contacts.ts`
4. React updates: modal, toast, chip source change
5. README: pepper-rotation guide, test instructions
6. Tests/CI: pgTAP, Vitest, Playwright

---

## 8  Implementation Milestones & Exit Criteria

| ID     | Milestone                        | Exit Criteria                                                                           |
| ------ | -------------------------------- | --------------------------------------------------------------------------------------- |
| **M1** | **Supabase Core & Auth**         | Schema + RLS compile; magic link auth flow works; tests prove role isolation.           |
| **M2** | **DynamicForm Engine**           | Hotel/Flight/Car forms render; invalid submits blocked; unit tests snapshot validated.  |
| **M2a**| **Duplicate-Detection Layer**    | `traveler_contacts` + `dup_findings` migrations applied; `create_traveler()` returns `findings[]`; front-end shows block/confirm/toast flow. p95 insert ≤ 100 ms on 10k-row bench. |
| **M3** | **Magic Link System**            | Email-based links generate properly; DB lookup passes; link copy UI works.              |
| **M4** | **Admin UI & Links Tab**         | ATT admin can create client/project + link; Client admin dashboard; Request Queue stub. |
| **M5** | **Request Queue & Batch Submit** | Draft save, multi-select, submit; Summary card output; real-time sync.                 |
| **M6** | **QA & Accessibility**           | Vitest ≥ 70 %; axe tests zero violations; CI green.                                     |
| **M7** | **Bundle optimization**          | No `/legacy` imports; JS bundle < 300 kB; performance targets met.                      |

---

## 9  Change Log & Version History

| Ver     | Date       | Notes                                                                                   |
| ------- | ---------- | ------------------------------------------------------------------------------------- |
| **6.0.0** | 2025‑07‑01 | AI-optimized PRD: merged Lean-Pepper, RLS, JWT, state management, and test strategies. |
| **5.1.1** | 2025‑06‑28 | PRD conformed to Lean-Pepper Build Spec v1.1.                                         |
| ...     | ...        | ...                                                                                   |

---

## 10  References & Dependencies

- HERE Maps API, Supabase, ATT Booking System
- Next.js 15.3, TanStack Query 5, Zustand, React Hook Form, Zod, @headlessui/react, libphonenumber-js, sonner

---

> Any deviation from this spec must be reflected by editing the prompt and re-running Taskmaster. 

---

## Status-Label System

| Code             | Display badge    | Visible to requester   | Notes                                 |
| ---------------- | ---------------- | ---------------------- | ------------------------------------- |
| `draft`          | *Draft*          | Drafts only            |                                       |
| `submitted`      | *Submitted*      | History                | MVP badge                             |
| `accepted`       | *Accepted*       | Internal               | Item passed validation & got ticket # |
| `assigned`       | *Assigned*       | Optional future expose | Shows assignee                        |
| `in_progress`    | *In Progress*    | Phase 2                | Booker actively working               |
| `pending_client` | *Waiting on You* | Phase 2                | Info requested from requester         |
| `on_hold`        | *On Hold*        | Internal               | External dependency                   |
| `completed`      | *Completed*      | Phase 1                | Booking confirmed                     |
| `cancelled`      | *Cancelled*      | Phase 1                | Stopped before completion             |
| `rejected`       | *Rejected*       | Phase 2                | Out of policy / duplicate             |

**State Machine**

```
draft → submitted → accepted → assigned → in_progress
         ↘ cancelled      ↘ pending_client ↘ on_hold
pending_client / on_hold / in_progress → completed | cancelled
```

---

## 9.5 Preview & Submit

* Front-end only; no schema change.
* Calls batch RPC `submit_requests(ids[])` which sets `status='submitted'`, `submitted_at=now()`.
* Empty selection disables **Submit**.

---

## Invite Flow

1. Authorized user opens **Invite User** modal.
2. Inputs *Email*, *Role*; optional check-boxes: “Can invite peer admins”, “Can invite requesters”.
3. API `invite_user()` writes to `auth.users`, sets flags, sends magic link.
4. Super Admin can later toggle flags in **Users** tab; each change logs to `audit_user_flags`.

---

## Road-map staging note

| Phase       | Requester-visible statuses        |
| ----------- | --------------------------------- |
| **MVP**     | *Draft*, *Submitted*              |
| **Phase 1** | + *Completed*, *Cancelled*        |
| **Phase 2** | + *In Progress*, *Waiting on You* |

--- 