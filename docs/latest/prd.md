# **Product Requirements Document – Travel Request Management System**

**Version:** v5.0.0 (Final Consolidated)  
**Status:** Production-ready specification with authentication architecture, complete schemas, and implementation details.

---

## 0  Purpose & Ownership

* **Goal:** Ship a production‑ready Next.js 15 app backed by Supabase that replaces the legacy prototype, delivers Request Queue, magic link authentication, dynamic forms, and admin dashboards.
* **Success metrics:** `pnpm build && pnpm test` green; Lighthouse ≥ 90; demo submits hotel/flight/car via magic link; RLS blocks unauthorized access.

---

## 1  Current Codebase Snapshot (May 28 2025)

| Path                               | Exists | State                                                       |
| ---------------------------------- | ------ | ----------------------------------------------------------- |
| `src/app/`                         | ✅      | Layout, Tailwind, claymorphism tokens.                      |
| `src/components/DynamicForm.tsx`   | ✅      | **Empty stub** (to be built).                               |
| `src/components/RequestQueue.tsx`  | ⬜      | **TODO**.                                                   |
| `src/components/TravelerModal.tsx` | ✅      | **Empty stub**.                                             |
| `src/form-fields/*.json`           | ✅      | Authoritative specs (v 2.3.4 with phone/email required).   |
| `src/lib/supabase/*`               | ✅      | Client bootstrap but not wired.                             |
| `src/lib/validation/phone.ts`      | ⬜      | **TODO** - E.164 normalization and validation.              |
| `legacy/**`                        | ✅      | Frozen read‑only.                                           |
| `docs/`                            | ✅      | Consolidated into this document.                             |

> **TaskMaster must treat any file marked ***stub*** or ***TODO*** as work.**

---

## 2  Core Features (MVP)

1. **Project‑based Request Flow** – each Request row references a Project row (budget defaults, client context).
2. **Magic Link Authentication** – email-based identity with Supabase Auth integration; time-limited, revocable access.
3. **DynamicForm (Declarative) Engine** – renders forms from JSON specs with RHF + Zod.
4. **Traveler Management** – per‑client CRUD with placeholder toggle; required `phone`, `primaryEmail`; duplicate hash `sha256(E164(phone)+lower(email))`.
5. **Request Queue & Batch Submission** – save drafts, multi‑select, single payload submission to ATT.
6. **Summary Generation** – human‑readable export plus link to Supabase row for audit/export.
7. **Admin Dashboards** – ATT & Client Admin UIs; admins can *also* create requests and push them into queue.
8. **Real‑time Sync** – Live updates via Supabase realtime subscriptions (MVP feature).
9. **Claymorphism Theme** – shadcn/ui + claymorphism token file.
10. **Accessibility First** – WCAG 2.1 AA; CI axe tests.

---

## 3  Technical Constraints & Stack

| Area         | Constraint                                                    |
| ------------ | ------------------------------------------------------------- |
| Framework    | **Next.js 15.3 (App Router)**, React 19.                      |
| Lang / Build | TypeScript 5, pnpm.                                           |
| State        | TanStack Query 5 (server state) + Zustand (UI state only).    |
| Backend      | Supabase 2.49 (`@supabase/supabase-js`) + Row‑Level Security. |
| Styling      | Tailwind 3 + shadcn/ui tokens; claymorphism palette.          |
| Auth         | Supabase Auth with magic links; no client-side encryption.    |
| Testing      | Vitest + vitest‑axe + Testing‑Library.                        |
| CI           | GitHub Actions; bundle ≤ 300 kB; every file ≤ 300 LOC.        |

---

## 4  Data Model & Schema (Supabase)

### 4.1 Core Tables

| Table         | Columns                                                                                                                                                                              | Notes                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `clients`     | `id uuid` PK, `name text`                                                                                                                                                            | Seed via ATT UI.         |
| `projects`    | `id uuid` PK, `client_id uuid` FK, `name text`, `budget_guidance jsonb`, `clientReferenceLock bool`                                                                                  | Budget defaults, client context |
| `travelers`   | `id uuid` PK, `client_id uuid` FK, `firstName text`, `lastName text`, `phone text`, `primaryEmail text`, `isPlaceholder bool`, `traveler_hash text`, `created_at timestamptz`, `updated_at timestamptz` | RLS isolates by client.  |
| `requests`    | `id uuid` PK, `project_id uuid` FK, `type text` enum, `blob jsonb`, `created_via_link_id uuid`, `created_at timestamptz`                                                            | Stores request JSON.     |
| `links`       | `id uuid` PK, `client_id uuid` FK, `project_id uuid` FK, `role text`, `target_email text`, `allow_add_travelers bool` default false, `traveler_ids uuid[]`, `expires_at timestamptz`, `created_by uuid`, `created_at timestamptz` | Email-based magic links. |
| `access_logs` | `id uuid` PK, `link_id uuid` FK, `traveler_id uuid`, `ts timestamptz`                                                                                                               | **Phase 2** optional.    |

### 4.2 JSON Schema Definitions

**Budget Guidance Schema:**
```typescript
interface BudgetGuidance {
  hotel?: {
    preference?: 'optimize' | 'mid-range' | 'premium';
    hardCapUSD?: number; // e.g., 200
  };
  flight?: {
    preference?: 'lowest-logical-fare' | 'flexible' | 'premium';
    hardCapUSD?: number; // e.g., 500
  };
  car?: {
    preference?: 'economy' | 'mid-size' | 'suv' | 'truck' | 'premium';
    hardCapUSD?: number; // e.g., 100
  };
}
```

**Request Blob Schema:**
```typescript
interface RequestBlob {
  formType: 'hotel' | 'flight' | 'car';
  travelerIds: string[];
  formData: Record<string, any>; // specific to form type based on JSON specs
  budgetOverride?: {
    preference?: string;
    hardCapUSD?: number;  
  metadata: {
    submittedAt: string;
    linkId: string;
    clientId: string;
    projectId: string;
  };
}
```

### 4.3 Extended Traveler Schema

| Column         | Type    | Required | Notes                                               |
| -------------- | ------- | -------- | --------------------------------------------------- |
| `firstName`    | text    | ✅        | Must match travel document (given name)             |
| `middleName`   | text    | ⬜        | Optional middle name                                |
| `lastName`     | text    | ✅        | Must match travel document (surname)                |
| `preferredName`| text    | ⬜        | Name used in communications                         |
| `primaryEmail` | text    | ✅        | Deliverable address, validated with Zod email()     |
| `secondaryEmail`| text   | ⬜        | Backup contact email                                |
| `phone`        | text    | ✅        | E.164 format only, validated with `normalizeAndValidatePhone()` |
| `dob`          | date    | ⬜        | Required for flight and car bookings                |
| `gender`       | text    | ⬜        | Options: M/F/X/Unspecified (as on travel document) |
| `isPlaceholder`| boolean | ⬜        | Blocks submission if true                           |
| `traveler_hash`| text    | ⬜        | SHA-256(E164(phone)+lower(email)) for duplicate detection |

### 4.4 Phone Number Validation Pipeline

```typescript
// Implementation location: src/lib/validation/phone.ts

/**
 * Phone validation pipeline:
 * 1. Input: User types phone in any format
 * 2. Normalize: Use libphonenumber-js to convert to E.164
 * 3. Validate: Ensure result is valid E.164 format  
 * 4. Store: Save normalized E.164 in database
 * 5. Hash: Generate traveler_hash from normalized phone
 */
export function normalizeAndValidatePhone(input: string, defaultCountry?: string): string | null;
```

### 4.5 Schema Creation Script

```sql
-- Core schema for Travel Request Management System
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  name text not null,
  budget_guidance jsonb,
  clientReferenceLock boolean default false,
  created_at timestamptz default now()
);

create table public.travelers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  firstName text not null,
  middleName text,
  lastName text not null,
  preferredName text,
  primaryEmail text not null,
  secondaryEmail text,
  phone text not null,
  dob date,
  gender text check (gender in ('M', 'F', 'X', 'Unspecified')),
  isPlaceholder boolean default false,
  traveler_hash text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  type text not null check (type in ('hotel', 'flight', 'car')),
  blob jsonb not null,
  created_via_link_id uuid,
  created_at timestamptz default now()
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  project_id uuid references projects(id),
  role text not null,
  target_email text not null,
  allow_add_travelers boolean not null default false,
  traveler_ids uuid[] not null,
  expires_at timestamptz not null,
  created_by uuid,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_travelers_client_id on travelers(client_id);
create index idx_travelers_hash on travelers(traveler_hash);
create index idx_requests_project_id on requests(project_id);
create index idx_links_client_id on links(client_id);
create index idx_links_email on links(target_email);
create index idx_links_expires_at on links(expires_at);
```

---

## 5  Authentication & Authorization System

### 5.1 Magic Link Authentication Flow

```
1. Client admin creates link in UI with target email
2. System creates link record in database  
3. System sends magic link email via Supabase Auth
4. User clicks magic link → auto-login with scoped JWT
5. User lands on request form with proper permissions
6. JWT contains link_ids and client_id for RLS enforcement
```

### 5.2 JWT Claims Structure

```typescript
interface AuthClaims {
  sub: string;           // user ID
  email: string;         // identity anchor  
  role: 'attAdmin' | 'clientAdmin' | 'requester';
  link_ids?: string[];   // accessible links (for requesters)
  client_id?: string;    // for data isolation
  exp: number;           // expiry
}
```

### 5.3 Role Definitions

| Role            | Scope   | Can Create Links | Can Edit Travelers | Can Add Travelers via Link   | Can View All Requests | Can Approve |
| --------------- | ------- | ---------------- | ------------------ | ---------------------------- | --------------------- | ----------- |
| **attAdmin**    | Global  | ✅ any            | ✅ any              | N/A                          | ✅ all clients         | ✅           |
| **clientAdmin** | Client  | ✅ own client     | ✅ own client       | N/A                          | ✅ own client          | ⬜ Phase 2   |
| **requester**   | Project | ❌                | ❌                  | ⬜ (if `allow_add_travelers`) | Only assigned links   | ❌           |

### 5.4 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
alter table clients enable row level security;
alter table projects enable row level security;
alter table travelers enable row level security;
alter table requests enable row level security;
alter table links enable row level security;

-- Client policies
create policy "Clients: att_admin full access" on clients
for all using (auth.jwt() ->> 'role' = 'attAdmin');

create policy "Clients: client_admin own client" on clients
for select using (
  id = (auth.jwt() ->> 'client_id')::uuid
);

-- Projects policies  
create policy "Projects: client isolation" on projects
for all using (
  auth.jwt() ->> 'role' = 'attAdmin'
  or client_id = (auth.jwt() ->> 'client_id')::uuid
);

-- Travelers policies
create policy "Travelers: client isolation" on travelers
for all using (
  auth.jwt() ->> 'role' = 'attAdmin'
  or client_id = (auth.jwt() ->> 'client_id')::uuid
);

-- Links policies
create policy "Links: user can access assigned links" on links
for select using (
  auth.jwt() ->> 'role' = 'attAdmin'
  or client_id = (auth.jwt() ->> 'client_id')::uuid
  or id = any(string_to_array(auth.jwt() ->> 'link_ids', ',')::uuid[])
);

-- Requests policies
create policy "Requests: project access" on requests
for select using (
  exists (
    select 1 from projects p
    where p.id = project_id
    and (
      auth.jwt() ->> 'role' = 'attAdmin'
      or p.client_id = (auth.jwt() ->> 'client_id')::uuid
    )
  )
);
```

---

## 6  State Management Strategy

### 6.1 Clear Separation of Concerns

**TanStack Query: Server State Only**
- API calls (travelers, requests, links)
- Caching and synchronization  
- Background refetching
- Real-time subscriptions

**Zustand: UI State Only**  
- Form draft state (offline)
- Modal open/closed states
- Selected travelers in multi-select
- Current form step/page
- Loading indicators

### 6.2 Implementation Pattern

```typescript
// Server state via TanStack Query
const { data: travelers } = useQuery({
  queryKey: ['travelers', clientId],
  queryFn: () => fetchTravelers(clientId)
});

// UI state via Zustand
const { selectedTravelers, setSelectedTravelers } = useUIStore();
```

---

## 7  Link Expiry User Experience

### 7.1 Expiry Warning System

| Time Remaining | UI Treatment | User Action |
|---------------|--------------|-------------|
| **>48 hours** | No warning | Normal usage |
| **24-48 hours** | Yellow banner: "Link expires in X hours" | Optional renewal request |
| **<24 hours** | Red banner: "Link expires soon! Contact your project manager to extend." | Urgent renewal needed |
| **Expired** | Block form access, show "Link expired" message with contact info | Must request new link |
| **Mid-form expiry** | Auto-save draft, show renewal request message | Contact admin for extension |

---

## 8  Form Specifications & Dynamic Form Engine

### 8.1 Form Engine Implementation

- **JSON field specs** in `src/form-fields/*.json` define field metadata
- **`<DynamicForm formType="hotel" />`** reads hotel.json and renders fields
- **React Hook Form + Zod** handle validation and submission  
- **Component mapping**: field.type → appropriate input component (text → `<Input>`, date → `<DatePicker>`, etc.)

### 8.2 Form Field Schema

All form fields are defined with the following structure:

| Column       | Purpose                                                                           |
| ------------ | --------------------------------------------------------------------------------- |
| **id**       | Stable, camelCase identifier (dot‑notation allowed for sub‑fields)                |
| **label**    | User‑facing copy (i18n‑ready)                                                     |
| **type**     | Input component (*text*, *date*, *radio*, *map*, *object*, etc.)                  |
| **required** | `✅` if always required  •  `✅*cond*` if required **only when Logic is true**      |
| **tooltip**  | Context help (optional)                                                           |
| **notes**    | Misc. display or validation info                                                  |
| **logic**    | Concise behaviour / dependency rules                                              |

### 8.3 Shared Metadata Fields

| id                               | label                    | type   | required | tooltip                                      | notes                                                     | logic                                   |
| -------------------------------- | ------------------------ | ------ | -------- | -------------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| client                           | Client                   | text   | ✅        | Client code or ID                            | populated from Admin link                                 | *claim* (not in `blob` if from link)    |
| project                          | Project                  | text   | ✅        | Project code or ID                           | populated from Admin link                                 | *claim*                                 |
| clientReference                  | Client Reference         | text   | ⬜        | Free text (team / PO #)                      | may be **read‑only** if Admin link locked                 | read‑only flag derived from link claims |
| budgetGuidance.hotel.preference  | Hotel Budget Preference  | select | ⬜        | Prefill guidance for hotel requests          | dropdown presets (Optimize, Mid‑range, Premium)           | editable unless locked by link          |
| budgetGuidance.hotel.hardCapUSD  | Hotel Budget Cap (USD)   | number | ⬜        | Optional max hotel budget per night (USD)    | pulled from project settings, editable per request        | override allowed                        |
| budgetGuidance.flight.preference | Flight Budget Preference | select | ⬜        | Prefill guidance for flight requests         | dropdown presets (Lowest Logical Fare, Flexible, Premium) | editable unless locked by link          |
| budgetGuidance.flight.hardCapUSD | Flight Budget Cap (USD)  | number | ⬜        | Optional max flight budget per segment (USD) | pulled from project settings, editable per request        | override allowed                        |
| budgetGuidance.car.preference    | Car Budget Preference    | select | ⬜        | Prefill guidance for car rental requests     | dropdown presets (Economy, Mid‑size, SUV, Truck, Premium) | editable unless locked by link          |
| budgetGuidance.car.hardCapUSD    | Car Budget Cap (USD)     | number | ⬜        | Optional max car rental budget per day (USD) | pulled from project settings, editable per request        | override allowed                        |


### 8.4 Hotel Request Fields

| id | label | type | required | tooltip | notes | logic |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| targetLocationType | Target Location Type | radio | ✅ | Specific / General | drives Map Input mode | shows/hides radius |
| location.text | Location Input | map | ✅ | HERE Places autocomplete | populates lat/lng | always visible |
| location.lat | Latitude | hidden | ✅ | resolved coord | hidden | auto‑set by map |
| location.lng | Longitude | hidden | ✅ | resolved coord | hidden | auto‑set by map |
| location.radius | Search Radius (mi) | slider | ⬜ | 1‑50 (default 10) | – | visible when `targetLocationType = general` |
| checkInDate | Check‑In Date | date | ✅ | Planned arrival | min ≥ today | – |
| checkOutDate | Check‑Out Date | date | ✅ | Planned departure | – | must be `> checkInDate` |
| room.group\[\].roomType | Room Type | select | ⬜ | King/Double/Suite | per‑room sub‑field | inside expandable room list |
| room.group\[\].travelerIds | Room Assignment | array | ⬜ | traveller IDs | JSON | defaults: 1 traveller per room |
| notes | Notes | textarea | ⬜ | Special needs / preferences | multiline | – |
| budgetGuidance | Budget Guidance | select | ⬜ | May prefill default | – | editable if no lock |

### 8.5 Flight Request Fields

| id | label | type | required | tooltip | notes | logic |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| departureAirport | Departure Airport | airportPicker | ✅ | IATA / name | – | – |
| arrivalAirport | Arrival Airport | airportPicker | ✅ | IATA / name | – | – |
| tripType | Trip Type | select | ✅ | One‑Way / Round‑Trip | – | if `oneWay` hide all *Return* fields |
| flightDate | Departure Date | date | ✅ | – | – | – |
| returnDate | Return Date | date | ✅*cond* | Round‑trip only | – | shown when `tripType = roundTrip` |
| flightTimePrefDepart | Time Pref – Departure | select | ⬜ | Optimise / Morning … | default Optimise | drives departure custom/specific fields |
| flightTimePrefReturn | Time Pref – Return | select | ⬜*cond* | Optimise / Morning … | only round‑trip | visible when `tripType = roundTrip`; drives return custom fields |
| flightTimeDepart.range.start | Depart Time Start | time | ⬜ | custom range | – | visible when `flightTimePrefDepart = custom` |
| flightTimeDepart.range.end | Depart Time End | time | ⬜ | custom range | – | – |
| flightTimeDepart.type | Depart Time Type | select | ⬜ | Departure vs Arrival | indicates whether range refers to take‑off or landing | pairs with depart range |
| flightTimeReturn.range.start | Return Time Start | time | ⬜*cond* | custom range | – | visible when `flightTimePrefReturn = custom` |
| flightTimeReturn.range.end | Return Time End | time | ⬜*cond* | custom range | – | – |
| flightTimeReturn.type | Return Time Type | select | ⬜*cond* | Departure vs Arrival | indicates whether range refers to take‑off or landing | pairs with return range |
| specificFlightInfo | Specific Flight Info | textarea | ⬜ | Airline / flight \# | multiline | visible when any *Time Pref* \= specific |
| notes | Notes | textarea | ⬜ | Alternate requests, split travellers | multiline | – |
| budgetGuidance | Budget Guidance | select | ⬜ | May prefill default | – | editable if no lock |

### 8.6 Rental Car Request Fields

| id | label | type | required | tooltip | notes | logic |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| pickupType | Pickup Location Type | select | ✅ | Airport / Specific / General | controls map vs airport | – |
| pickup.location.text | Pickup Location | map/airportPicker | ✅ | dynamic component | map if specific/general, airport picker if airport | – |
| pickup.location.lat | Pickup Lat | hidden | ✅ | – | – | auto via component |
| pickup.location.lng | Pickup Lng | hidden | ✅ | – | – | – |
| pickup.location.radius | Pickup Search Radius | slider | ⬜ | general only | – | shown when `pickupType = general` |
| rentalStart | Pickup Date | date | ✅ | – | – | – |
| pickupTime | Pickup Time | time | ⬜ | – | note if non‑airport | – |
| sameDropoff | Drop‑Off = Pickup? | checkbox | ✅ | toggle | default checked | – |
| dropoffType | Drop‑Off Location Type | select | ✅*cond* | when different | – | shown when `sameDropoff = false` |
| dropoff.location.text | Drop‑Off Location | map/airportPicker | ✅*cond* | dynamic component | follows rules of pickup | – |
| dropoff.location.lat | Drop‑Off Lat | hidden | ✅*cond* | – | – | – |
| dropoff.location.lng | Drop‑Off Lng | hidden | ✅*cond* | – | – | – |
| dropoff.location.radius | Drop‑Off Radius | slider | ⬜ | general only | – | shown when `dropoffType = general` |
| rentalEnd | Drop‑Off Date | date | ✅ | – | – | – |
| dropoffTime | Drop‑Off Time | time | ⬜ | – | – | shown when `pickupTime` present |
| vehicle.group\[\].travelerIds | Vehicle Assignment | array | ⬜ | traveller IDs | hidden section | expands to configure cars |
| vehicle.group\[\].primaryDriver | Primary Driver | select | ✅*cond* | inside block | – | required per vehicle |
| notes | Notes | textarea | ⬜ | requests like 4WD | multiline | – |
| budgetGuidance | Budget Guidance | select | ⬜ | May prefill default | – | editable if no lock |

### 8.7 Traveler Selector Component

The traveler selector is a key UI pattern used across all forms:

| Component Spec        | Implementation Details                                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Control**               | `<TravelerSelector formType="hotel" value={ids} onChange={…} editable={boolean} />`                                                                                            |
| **Internals**             | Combines `@headlessui/react` `<Combobox>` with a chip row.                                                                                                     |
| **Chip states**           | `default` (all required fields present) ▪ `warning` (incomplete but non‑blocking) ▪ `error` (blocks submit).                                                   |
| **Edit / Remove actions** | Shown only when `editable=true` **and** user has `role ∈ {admin, coordinator}` **OR** link flag `allow_add_travelers`.                                         |
| **Validation util**       | `isTravelerComplete(traveler, formType)` exported by `src/lib/travelers/rules.ts`.`REQUIREMENTS_BY_TYPE` centralises the per‑form field lists.                 |
| **Accessibility**         | Each chip is a `button role="button"` with `aria-pressed="true"`, `aria-description` = "Missing : phone, passport expiry". Combobox complies with WCAG 2.1 AA. |
| **Mobile overflow**       | If > 4 chips or viewport `< sm`, chips collapse into `[ + N selected ]` pill; tapping opens `TravelerListSheet`.                                               |

---

## 9  Admin User Interface Specifications

### 9.1 Screen Map

```
ATT Admin
│
├── Dashboard
│   ├── Clients Table ─┐
│   └── Projects Table │
│       └── Generate Link ➜ Magic Link Modal
│   └── **Create Request** ➜ Admin Request Maker
│
├── Links Tab  (table view)
│
└── Traveler Directory  (client‑scoped)

Client Admin
│
├── Dashboard (Projects list)
│   ├── Edit Project Modal
│   └── **Create Request** ➜ Admin Request Maker
│
├── Links Tab
└── Traveler Directory

Requester (via Magic Link)
│
├── Request Queue
│   ├── Drafts Table
│   │   | □ | Dest./Dates | Travelers | Status |  ⋯ |
│   │   | ☑ | SJO → MIA 5‑8 Aug | 3 trav | draft | ▶ |
│   │   | □ | SJO → BOG 12 Aug | 1 trav | draft | ▶ |
│   └── **Submit Selected**  (disabled until ≥1 checked)
│
└── Request Maker  (opens from +New Request or editing a draft)
```

### 9.2 ATT Admin Dashboard

```
┌ Admin Dashboard ───────────────────────────────┐
│ + New Client  + New Project                    │
│                                               │
│ Clients                                       │
│ ───────────────────────────────────────────── │
│ |  ACME Corp          | 4 projects | 12 links | ▶ |         │
│ |  Beta Ltd.          | 1 project  |  3 links | ▶ |         │
│                                               │
│ Projects (selected client)                                  │
│ ───────────────────────────────────────────── │
│ |  2025 Rollout       | 6 links     | Link ▶  |             │
│ |  Pilot Phase        | 2 links     | Link ▶  |             │
└────────────────────────────────────────────────┘
```

### 9.3 Magic Link Generation Modal

```
Generate Magic Link
──────────────────────────────
Send to Email    [ user@company.com ]
Role             [ requester ▾ ]
Travelers        [ multi‑select list ]
Expiry           [ 30 days ▾ ]
Allow add travelers [ ] (disabled — Phase 2)
──────────────────────────────
» Magic link will be sent to the specified email address.
» Recipients can access other links sent to the same email.

          [ Send Link ] [ Cancel ]
```

### 9.4 Links Management Tab

```
┌ Links ─────────────────────────────────────────────────────┐   
│ ⍈ filter by email/status                                   │
│ | Email           | Role | Travelers | Expires  | Status | ⋯ |
│ | user@acme.com   | req  | 3         | Jun 30   | active | ▾ |
│ | mgr@acme.com    | req  | 2         | May 15   | expired| ▾ |
│ | team@beta.com   | req  | 5         | Jul 10   | active | ▾ |
└──────────────────────────────────────────────────────────────┘
```

### 9.5 Traveler Directory

```
┌ Traveler Directory (client) ─────────────────────────────┐
│ + Add Traveler   + Quick Placeholder                     │
│                                                          │
│ | Name          | Phone      | Email           | ✔Dup? | P? | ⋯ |
│ | Ana Ramírez   | +506 …     | ana@acme.com    |       |   | ▶ |
│ | Bob Jones     | —          | —               |       | • | ▶ |
│ | Carol Smith   | +1 555 …   | carol@acme.com  | ⚠     |   | ▶ |
└──────────────────────────────────────────────────────────┘
Legend: P? • = Placeholder (incomplete)  • Dup? ⚠ = hash match detected
```

### 9.6 Request Queue

```
┌ Request Queue ────────────────────────────────────────┐
│ + New Request                                           │
│                                                       │
│ | □ | Type  | Dest./Dates | Travelers | Status | ⋯ |   │
│ | ☑ | Hotel | SJO→MIA 5‑8 Aug | 3 | draft | ▶ |        │
│ | □ | Flight| SJO→BOG 12 Aug | 1 | draft | ▶ |         │
│ | ☑ | Car   | MIA 5‑10 Aug | 2 | draft | ▶ |           │
│                                                       │
│       [ Submit Selected (2) ]  [ Delete ]               │
└─────────────────────────────────────────────────────────┘
```

### 9.7 Request Maker Interface

```
┌ (if expiry ≤ 72 h) Yellow Banner                     ┐
│ This link expires on Jun 30, 23:59.                  │
└──────────────────────────────────────────────────────┘

Request Type: [ Hotel ▾ ]  [ Flight ]  [ Car ]

 ┌─────────────────── Request Maker ────────────────────┐
 │ Traveler(s)                                          │
 │ ┌──────────────────────────────────────────────────┐ │
 │ │  ⌄  Ana Ramírez                             ✎  × │ │
 │ │  ⌄  Bob Jones •missing phone                ✎  × │ │
 │ │  +  Add Traveler (if allowed)                   │ │
 │ └──────────────────────────────────────────────────┘ │
 │                                                     │
 │ [DynamicForm renders here based on selected type]   │
 │                                                     │
 │ [ Save Draft ]                            [ Submit ]│
 └─────────────────────────────────────────────────────┘
  legend: red ring = blocking error • amber ring = warning
```

---

## 10  Component Implementation Mapping

### 10.1 Core Components to Build

| Component                 | File Path                                       | Status              | Purpose |
| ------------------------- | ----------------------------------------------- | ------------------- | ------- |
| `<DynamicForm />`         | `src/components/DynamicForm.tsx`                | **stub – to build** | Form engine that renders from JSON specs |
| `<RequestQueue />`        | `src/components/RequestQueue.tsx`               | **stub – to build** | Draft management and batch submission |  
| `<MagicLinkModal />`      | `src/components/MagicLinkModal.tsx`             | **stub – to build** | Link generation interface |
| `<LinksTab />`            | `src/components/LinksTab.tsx`                   | **stub – to build** | Link management table |
| `<TravelerDirectory />`   | `src/components/TravelerDirectory.tsx`          | **stub – to build** | Traveler CRUD interface |
| `<AdminDashboard />`      | `src/components/AdminDashboard.tsx`             | **stub – to build** | ATT/Client admin landing |
| `<TravelerModal />`       | `src/components/TravelerModal.tsx`              | **stub created**    | Add/edit traveler form |
| `<TravelerSelector />`    | `src/components/TravelerSelector.tsx`           | **planned**         | Multi-select with chips |
| `<SummaryCard />`         | `src/components/SummaryCard.tsx`                | **planned**         | Request submission summary |

### 10.2 Route Mapping

| Legacy Path       | New Route                           | Notes                        |
| ----------------- | ----------------------------------- | ---------------------------- |
| `/travelers`      | `/traveler-directory`               | ATT & Client scoped          |
| `/link-generator` | `/admin/projects/[id]/link` (modal) | Magic link generation        |
| *(none)*          | `/admin`                            | ATT admin landing            |
| *(none)*          | `/client`                           | Client admin landing         |
| *(none)*          | `/requests`                         | Request Queue for requesters |
| *(none)*          | `/magic/[token]`                    | Magic link landing page      |

---

## 11  Design System & Theming

### 11.1 Core Design Tokens

* **Base System:** shadcn/ui + Tailwind semantic classes
* **Theme:** Claymorphism token file
* **Components:** `@headlessui/react` for advanced interactions

### 11.2 Semantic Tokens (Traveler Chips)

| Token          | Fallback                    | Usage                          |
|----------------|-----------------------------|--------------------------------|
| `bg-chip`      | `colors.surface.200`        | Chip background                |
| `ring-warning` | `colors.amber.500 / 40%`    | Incomplete but non-blocking    |
| `ring-error`   | `colors.rose.500 / 40%`     | Blocks submission / hard error |

### 11.3 Design System Implementation

- All design tokens live in `styles/tokens.ts` and are typed for use across Tailwind, runtime TS, and CSS variable theming.  
- The generated CSS variables are defined in `styles/theme.css` for runtime theming.  
- Themes are hot-swappable via `next-themes` (`.theme-claymorphism`, `.dark`, etc.).

---

## 12  Error Handling & User Experience

### 12.1 Error Handling Strategy

- **Error Boundaries**: Wrap each major component (DynamicForm, RequestQueue, etc.)  
- **Toast System**: Use sonner for user notifications
- **Retry Logic**: TanStack Query automatic retries for network errors
- **Validation Errors**: Inline form errors with clear messaging

### 12.2 Loading States  

- **Skeleton Screens**: For data tables and cards
- **Spinner Pattern**: Small actions (save draft, submit)
- **Progressive Loading**: Load form structure first, then populate data

### 12.3 Form Validation Timing

- **Real-time**: Field-level validation on blur
- **Submit-time**: Full form validation before submission  
- **Server-side**: Final validation in API routes
- **Draft Save**: Validate only completed fields

### 12.4 Offline Behavior (if enabled)

- **Draft Storage**: IndexedDB via TanStack Query persistence
- **Sync Detection**: Show offline indicator  
- **Conflict Resolution**: Last-write-wins for drafts

---

## 13  Implementation Milestones & Exit Criteria

| ID     | Milestone                        | Exit Criteria                                                                           |
| ------ | -------------------------------- | --------------------------------------------------------------------------------------- |
| **M1** | **Supabase Core & Auth**         | Schema + RLS compile; magic link auth flow works; tests prove role isolation.           |
| **M2** | **DynamicForm Engine**           | Hotel/Flight/Car forms render; invalid submits blocked; unit tests snapshot validated.  |
| **M3** | **Magic Link System**            | Email-based links generate properly; DB lookup passes; link copy UI works.              |
| **M4** | **Admin UI & Links Tab**         | ATT admin can create client/project + link; Client admin dashboard; Request Queue stub. |
| **M5** | **Request Queue & Batch Submit** | Draft save, multi‑select, submit; Summary card output; real-time sync.                 |
| **M6** | **QA & Accessibility**           | Vitest ≥ 70 %; axe tests zero violations; CI green.                                     |
| **M7** | **Bundle optimization**          | No `/legacy` imports; JS bundle < 300 kB; performance targets met.                      |

---

## 14  Environment & Configuration

### 14.1 Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# Note: No JWE key needed - Supabase handles all JWT signing
```

### 14.2 Feature Flags

```typescript
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

## 15  Testing & Quality Assurance

### 15.1 Testing Strategy

* **Unit Tests:** Vitest + Testing Library for all components
* **Accessibility:** vitest-axe for WCAG 2.1 AA compliance
* **E2E Tests:** Playwright for critical user journeys
* **Bundle Analysis:** Automated size checking in CI

### 15.2 RLS Testing Strategy  

- **Development**: Use Supabase local development with test JWT tokens
- **Test Users**: Create fixtures with different roles/clients
- **Automated Tests**: Verify data isolation in integration tests

### 15.3 CI Pipeline

* ESLint flat config with 300 LOC file limit enforced
* GitHub Action sequence: lint → test → a11y → build → bundle analyze
* All tests must pass before deployment

### 15.4 Performance Targets

* Lighthouse score ≥ 90
* JavaScript bundle ≤ 300 kB (updated from 250kB)
* Individual file limit ≤ 300 LOC

---

## 16  Security Considerations

### 16.1 Data Protection

* **Row Level Security (RLS)** enforces data isolation by client
* **Magic link authentication** with Supabase Auth JWT tokens
* **Input validation** via Zod schemas
* **Hash-based duplicate detection** for traveler data
* **Phone number normalization** to E.164 format

### 16.2 Authentication & Authorization

* **JWT-based roles** for admin interfaces
* **Magic link access** for requesters via Supabase Auth
* **Permission matrices** enforced at database level
* **Email-based identity aggregation** for link management

---

## 17  Phase 2+ Roadmap (Post-MVP)

### 17.1 Phase 2 Features

* **Column‑level PII encryption** via pgcrypto + key rotation
* **Traveler Pools & Tags** for rapid assignment
* **Live link editing** (update traveler\_ids / expiry without new token)
* **Enhanced real‑time sync** with conflict resolution
* **Allow add travelers** via link flag implementation

### 17.2 Phase 3+ Features

* **Access‑log analytics** & anomaly alerts
* **Bulk CSV traveler import**
* **Time‑boxed roles** with automatic expiry
* **Advanced reporting dashboard**
* **Mobile app** for on-the-go requests

---

## 18  Change Log & Version History

| Ver             | Date       | Notes                                                                                                                        |
| --------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **5.0.0**       | 2025‑05‑29 | **Final Consolidated PRD** - Added magic link auth, complete schemas, implementation details, removed legacy mappings      |
| **4.0.0**       | 2025‑05‑29 | **Consolidated PRD** - merged all supporting documentation into single definitive document                                   |
| **3.1.2‑patch** | 2025‑05‑29 | Added explicit `docs/latest/{file}` prefixes to every cross‑document reference; no functional changes.                       |
| **3.1.2**       | 2025‑05‑28 | Consolidated final Expansion Pack decisions and traveler chips pattern.                                                      |
| 3.1.1           | 2025‑05‑28 | Added traveler chips + inline data‑quality warnings pattern.                                                                 |
| 3.1.0‑rev3      | 2025‑05‑28 | Added `links` table, Request Queue, traveler placeholders, hash duplicate detection, admin request path, DynamicForm rename. |

---

## 19  References & Dependencies

### 19.1 External Services

* **HERE Maps API** for location/geocoding services
* **Supabase** for backend data persistence, auth, and real-time features
* **ATT Booking System** for final request submission

### 19.2 Key Libraries

* **Next.js 15.3** with App Router
* **TanStack Query 5** for server state management
* **Zustand** for UI state management
* **React Hook Form** + **Zod** for form validation
* **@headlessui/react** for accessible components
* **libphonenumber-js** for phone number validation
* **sonner** for toast notifications

### 19.3 Bundle Size Analysis

**Current Dependencies Estimate:**
- Next.js 15 + React 19: ~45kB
- TanStack Query: ~15kB  
- React Hook Form + Zod: ~25kB
- Headless UI: ~20kB
- Tailwind (runtime): ~5kB
- Supabase client: ~35kB
- Phone validation: ~15kB
- Form utilities: ~15kB
- UI components: ~25kB

**Total Estimated: ~200kB** (leaves 100kB buffer within 300kB limit)

---

This consolidated PRD serves as the complete, production-ready specification for building the Travel Request Management System. All authentication concerns have been resolved with magic link implementation, JSON schemas are defined, state management is clarified, and comprehensive implementation details are provided for successful development.