# Supabase Schema, RLS Policies, and Triggers Documentation (v6.0.0)

> **Authoritative for PRD v6.0.0 – Travel Request Management System**
> 
> This document provides a comprehensive overview of the database schema, Row-Level Security (RLS) policies, triggers, and usage/testing guidelines for the Supabase backend. It is intended for developers, DBAs, and auditors working on or reviewing the project.

---

## 1. Introduction & Scope

This document details the production schema, RLS policies, and triggers for the Travel Request Management System, as defined in [prd.md](./prd.md) (v6.0.0). It is the single source of truth for backend data access and security logic. All changes must be reflected here and in the PRD.

---

## 2. Database Schema Overview

### 2.1 Core Tables
- **clients**: Tenant organizations
- **projects**: Projects under each client
- **travelers**: Individuals associated with requests
- **requests**: Travel requests (linked to projects, travelers)
- **links**: Magic link invitations and access
- **access_logs**: Audit of user access
- **traveler_contacts**: Contact info for travelers
- **dup_findings**: Duplicate detection results
- **tenant_peppers**: Per-client deduplication salts
- **audit_log**: Audit trail for sensitive operations
- **request_status_log**: Tracks status changes for requests

All tables have RLS enabled and forced. See PRD §4 for full details.

### 2.2 Schema Deltas
- **users**: Adds `can_invite_peer_admin` and `can_invite_requesters` boolean columns (default `false`).
- **requests**: Adds `status` (enum) and `request_id` (generated column).
- **request_status_log**: Tracks status transitions with triggers.

#### Example SQL (from migrations):
```sql
-- users
grant execute on function auth.jwt() to "app_att_admin";
add column can_invite_peer_admin  boolean not null default false;
add column can_invite_requesters  boolean not null default false;

-- requests
create type request_status as enum (
  'draft','submitted','accepted','assigned',
  'in_progress','pending_client','on_hold',
  'completed','cancelled','rejected'
);
alter table requests add column status request_status not null default 'draft';
alter table requests add column request_id text generated always as (lpad(id::text, 8, '0')) stored;

-- request_status_log
create table request_status_log (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id),
  from_status request_status,
  to_status   request_status,
  changed_by  uuid references users(id),
  changed_at  timestamptz default now()
);
```

---

## 3. Roles & Permissions

### 3.1 Application Roles
- `app_att_admin`: Full access to all tables
- `app_client_admin`: CRUD on own client data
- `app_requester`: Limited to own requests/links

Roles are created as NOLOGIN users in Postgres. Example:
```sql
create role "app_att_admin" nologin;
create role "app_client_admin" nologin;
create role "app_requester" nologin;
```

### 3.2 Grants
```sql
grant usage on schema public to "app_att_admin", "app_client_admin", "app_requester";
grant all privileges on all tables in schema public to "app_att_admin";
grant select, insert, update, delete on all tables in schema public to "app_client_admin";
grant select, insert on all tables in schema public to "app_requester";
-- ...see migration files for full details
```

---

## 4. JWT Claims & Helper Functions

### 4.1 Required Claims
- `role`: User's application role (e.g., `app_att_admin`)
- `client_id`: UUID for tenant scoping (for client_admin/requester)
- `link_ids`: Comma-separated UUIDs (for requester)

See [jwt-claims.md](./jwt-claims.md) for full structure and examples.

### 4.2 Helper Functions
Defined in SQL as SECURITY DEFINER functions:
```sql
create or replace function role() returns text as $$ select auth.jwt() ->> 'role' $$;
create or replace function client_id() returns uuid as $$ select (auth.jwt() ->> 'client_id')::uuid $$;
create or replace function link_ids() returns uuid[] as $$ select string_to_array(auth.jwt() ->> 'link_ids', ',')::uuid[] $$;
```

---

## 5. Row-Level Security (RLS) Policies

### 5.1 RLS Enablement
All core tables have RLS enabled and forced:
```sql
alter table public.clients    enable row level security;
alter table public.projects   enable row level security;
alter table public.travelers  enable row level security;
alter table public.links      enable row level security;
alter table public.requests   enable row level security;

alter table public.clients    force row level security;
alter table public.projects   force row level security;
alter table public.travelers  force row level security;
alter table public.links      force row level security;
alter table public.requests   force row level security;
```

### 5.2 Blanket Deny & Permissive Policies
- **Blanket deny**: All access denied by default
- **Permissive**: ATT Admins have full access

### 5.3 Policy Logic by Role & Table
#### ATT Admin (permissive):
```sql
create policy att_admin_clients on public.clients as permissive using (role() = 'app_att_admin') with check (role() = 'app_att_admin');
-- Repeat for all core tables
```
#### Client Admin (scoped):
```sql
-- clients: SELECT/UPDATE own row
create policy clients_client_admin_select on public.clients for select using (role() = 'app_client_admin' and id = client_id());
create policy clients_client_admin_update on public.clients for update using (role() = 'app_client_admin' and id = client_id()) with check (role() = 'app_client_admin' and id = client_id());
-- projects/travelers/links: ALL on own client
create policy projects_client_admin_all on public.projects for all using (role() = 'app_client_admin' and client_id = client_id()) with check (role() = 'app_client_admin' and client_id = client_id());
-- requests: ALL for projects they own
create policy requests_client_admin_all on public.requests for all using (
  role() = 'app_client_admin'
  and exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.client_id = client_id()))
with check (
  role() = 'app_client_admin'
  and exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.client_id = client_id()));
```
#### Requester (scoped):
```sql
-- links: read only their links
create policy links_requester_select on public.links for select using (role() = 'app_requester' and id = any(link_ids()));
-- travelers: read only, flag for future insert control
create policy travelers_requester_select on public.travelers for select using (
  role() = 'app_requester'
  and client_id = client_id()
  and (
    exists (select 1 from public.links l
            where l.client_id = client_id()
              and l.id = any(link_ids()))
    or coalesce(
         (select bool_or(allow_add_travelers)
            from public.links l
            where l.client_id = client_id()
              and l.id = any(link_ids())), false)
  ));
-- requests: select/update/delete on rows tied to link
create policy requests_requester_all on public.requests for all using (role() = 'app_requester' and created_via_link_id = any(link_ids())) with check (role() = 'app_requester' and created_via_link_id = any(link_ids()));
```

---

## 6. Triggers

### 6.1 Audit Log Triggers
- Triggers on sensitive tables (e.g., users) write to `audit_log` on flag modifications and sensitive operations.

### 6.2 Request Status Log Triggers
- Trigger on `requests` table writes to `request_status_log` on every status change.

#### Example SQL:
```sql
-- Trigger function
create or replace function public.log_request_status_change() returns trigger as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.request_status_log (request_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, current_user);
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger
create trigger trg_log_request_status_change
  after update of status on public.requests
  for each row
  execute function public.log_request_status_change();
```

---

## 7. Testing & Usage Guidelines

### 7.1 Manual RLS Testing (Supabase Studio)
- Use the SQL Editor to set local role and JWT claims for testing.
- See [supabase-studio-rls-testing.md](./supabase-studio-rls-testing.md) for step-by-step instructions and example queries.

### 7.2 Automated Testing
- Use pgTAP or custom scripts to verify RLS, triggers, and constraints.
- Ensure all code changes are test-covered (see PRD and test scripts).

### 7.3 Best Practices & Troubleshooting
- Always match claims and flags to the latest PRD.
- Test all edge cases and negative scenarios.
- Document any deviations or additional requirements in this file and the PRD.

---

## 8. References
- [Product Requirements Document (PRD)](./prd.md)
- [JWT Claims Structure](./jwt-claims.md)
- [Manual RLS Testing Guide](./supabase-studio-rls-testing.md)
- Migration files in `supabase/migrations/` 