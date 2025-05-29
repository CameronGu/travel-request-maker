# Admin UI Wireframes – Supabase MVP
version: 3.2
**Status (2025‑05‑28):** updated to include request maker with traveler chips

> **Scope** – reflects every decision locked through May 28 2025, including the new `links` table, traveler placeholders, hash‑based duplicate detection, and DynamicForm Engine naming. Pools, tags, encryption, bulk import, OTP, and live link editing are *Phase 2+* and are not shown here.

---

## 1  Key Entities (MVP)

| Table       | Purpose                               | Notes                                                                                                                                                                |
| ----------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clients`   | Tenant boundary                       | ❱ RLS: isolates data per client                                                                                                                                      |
| `projects`  | Budget defaults, clientReference lock | FK → `clients`                                                                                                                                                       |
| `travelers` | Traveler master records               | Mandatory ↓ phone, primaryEmail; `traveler_hash` = SHA‑256(E164(phone)+lower(email)) ; `isPlaceholder` bool                                                          |
| `links`     | Share‑link snapshot rows              | Columns: id (UUID PK), client\_id, project\_id, role, **allow\_add\_travelers bool (default false)**, traveler\_ids (UUID\[]), expires\_at, created\_by, created\_at |

---

## 2  Screen Map

```
ATT Admin
│
├── Dashboard
│   ├── Clients Table ─┐
│   └── Projects Table │
│       └── Generate Link ➜ Share‑Link Modal
│   └── **Create Request** ➜ Admin Request Maker
│
├── Links Tab  (table view)
│
└── Traveler Directory  (client‑scoped)

Client Admin
│
├── Dashboard (Projects list)
│   ├── Edit Project Modal
│   └── **Create Request** ➜ Admin Request Maker
│
├── Links Tab
└── Traveler Directory

Requester (via Link)
│
├── Request Queue
│   ├── Drafts Table
│   │   | □ | Dest./Dates | Travelers | Status |  ⋯ |
│   │   | ☑ | SJO → MIA 5‑8 Aug | 3 trav | draft | ▶ |
│   │   | □ | SJO → BOG 12 Aug | 1 trav | draft | ▶ |
│   └── **Submit Selected**  (disabled until ≥1 checked)
│
└── Request Maker  (opens from +New Request or editing a draft)
```

---

## 3  Wireframes & Behaviour

### 3.1  ATT Admin Dashboard (React component split ≤ 300 LOC)

```
┌ Admin Dashboard ───────────────────────────────┐
│ + New Client  + New Project                    │
│                                               │
│ Clients                                                     │
│ ───────────────────────────────────────────── │
│ |  ACME Corp          | 4 projects | 12 links | ▶ |         │
│ |  Beta Ltd.          | 1 project  |  3 links | ▶ |         │
│                                               │
│ Projects (selected client)                                   │
│ ───────────────────────────────────────────── │
│ |  2025 Rollout       | Budget $150 | Link ▶  |             │
│ |  Pilot Phase        | Budget $180 | Link ▶  |             │
└────────────────────────────────────────────────┘
```

* **Link ▶** opens Share‑Link Modal prefilled with project context.
* All creates/updates are optimistic (TanStack Query mutation + cache).

---

### 3.2  Share‑Link Modal

```
Generate Share Link
──────────────────────────────
Role          [ requester ▾ ]
Travelers     [ multi‑select list ]
Expiry        [ 30 days ▾ ]
Requester can add travelers [ ] (disabled — Phase 2)
──────────────────────────────
» Link will include the static list of travelers selected above.

          [ Copy Link ] [ Cancel ]
```

* On **Copy Link**:

  * POST `/rpc/create_link` → returns `{ link_id, shortUrl }`.
  * Snackbar “Link copied ✔”.
* Token = signed JWE containing only `link_id` & `exp`.

---

### 3.3  Links Tab (ATT & Client views identical, filtered)

```
┌ Links ───────────────┐   ⍈ filter                           
│ | Role | Travelers | Expires  | Status | ⋯ |               │
│ | req  | 3         | Jun 30   | active | ▾ |               │
│ | req  | 2         | May 15   | expired| ▾ |               │
└──────────────────────┘
```

* Phase 1 actions: **Copy**, **Extend 30 days** (creates *new* row & token).
* Edit travelers ⇢ hidden until Phase 2.

---

### 3.4  Traveler Directory

```
┌ Traveler Directory (client) ─────────────────────────────┐
│ + Add Traveler   + Quick Placeholder│
│                                                          │
│ | Name          | Phone      | Email           | ✔Dup? | P? | ⋯ |
│ | Ana Ramírez   | +506 …     | ana@acme.com    |       |   | ▶ |
│ | Bob Jones     | —          | —               |       | • | ▶ |
└──────────────────────────────────────────────────────────┘
Legend  P? • = Placeholder (incomplete)  • Dup? ✓ = hash match
```

* **Placeholder toggle** in Add/Edit modal.
* Duplicate banner shown if `traveler_hash` collision.

---

### 3.5  Request Queue

```
┌ Request Queue ────────────────────────────────────────┐
│ + New Request                                           │
│                                                       │
│ | □ | Dest./Dates | Travelers | Status | ⋯ |           │
│ | ☑ | SJO→MIA 5‑8 Aug | 3 | draft | ▶ |                │
│ | □ | SJO→BOG 12 Aug | 1 | draft | ▶ |                │
│                                                       │
│       [ Submit Selected ]  [ Delete ]                   │
└─────────────────────────────────────────────────────────┘
```

### 3.6  Request Maker (Form)

````
┌ (if expiry ≤ 72 h) Yellow Banner                     ┐
│ This link expires on Jun 30, 23:59.                  │
└──────────────────────────────────────────────────────┘

DynamicForm – Hotel / Flight / …
[ Add Traveler ]  (visible only if **allow_add_travelers = true**)
[ Save Draft ]

 ┌─────────────────── Request Maker ────────────────────┐
 │ Traveler(s)                                          │
 │ ┌──────────────────────────────────────────────────┐ │
 │ │  ⌄  Ana Ramírez                             ✎  × │ │
 │ │  ⌄  Bob Jones •missing phone                ✎  × │ │
 │ │  +  N more… (tap to view)                      │ │
 │ └──────────────────────────────────────────────────┘ │
 │                                                     │
 └─────────────────────────────────────────────────────┘
  legend: red ring = blocking error • amber ring = warning

(on save) Snackbar: “Request draft saved ✔”.
If any traveler isPlaceholder at *submission* time (i.e., from Queue):
Red modal: “Complete all traveler details before submitting.”
```---

## 4  API / Hooks

```ts
// hooks/useLink.ts
export const useLink = (id: string) =>
  useQuery({ queryKey: ['link', id], queryFn: fetchLink });

// rpc/create_link (Supabase edge)
-- expects clientId, projectId, role, travelerIds[]
-- inserts row and returns link_id + short url
````

---

## 5  Schema Snippet (migrations/20250528.sql)

```sql
create table public.links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  project_id uuid references projects(id),
  role text not null,
  allow_add_travelers boolean not null default false,
  traveler_ids uuid[] not null,
  expires_at timestamptz not null,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- RLS
alter table links enable row level security;
create policy "Links: client isolation" on links
for select using (
  auth.role() = 'attAdmin'
  or client_id = (current_setting('request.jwt.clientId', true))::uuid
);
```

---

## 6  Outstanding Phase 2 Placeholders (🟡 deferred)

* Edit traveler list inline (live links)
* Traveler Pools & Tags
* Column‑level PII encryption
* Soft‑delete & history table
* Bulk traveler CSV import
* OTP / light authentication

---

### Appendix A – Naming / LOC / Design tokens

* Every React file ≤ 300 LOC (PRD rule). Break out sub‑components as needed.
* Design system: shadcn/ui + Tailwind semantic tokens; no raw colour classes.
* Modal micro‑copy locked: “**Link will include the static list of travelers selected above.**”
