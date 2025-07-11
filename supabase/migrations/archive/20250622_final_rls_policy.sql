begin;

-- helper functions
create or replace function role() returns text
  language sql
  stable
  security definer
  set search_path = public, extensions
  as $$ select auth.jwt() ->> 'role' $$;

create or replace function client_id() returns uuid
  language sql
  stable
  security definer
  set search_path = public, extensions
  as $$ select (auth.jwt() ->> 'client_id')::uuid $$;

create or replace function link_ids() returns uuid[]
  language sql
  stable
  security definer
  set search_path = public, extensions
  as $$ select string_to_array(auth.jwt() ->> 'link_ids', ',')::uuid[] $$;

-- drop every policy on target tables
do $$
declare
  tbl text;
  pol record;
begin
  foreach tbl in array array['clients','projects','travelers','links','requests'] loop
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = tbl
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, tbl);
    end loop;
  end loop;
end $$;

-- enable + force RLS
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

-- restrictive blanket deny
drop policy if exists deny_all on public.clients;
drop policy if exists deny_all on public.projects;
drop policy if exists deny_all on public.travelers;
drop policy if exists deny_all on public.links;
drop policy if exists deny_all on public.requests;

-- attAdmin blanket (permissive)
do $$
declare
  tbl text;
begin
  foreach tbl in array array['clients','projects','travelers','links','requests'] loop
    execute format('create policy att_admin_%I on public.%I as permissive using (role() = ''app_att_admin'') with check (role() = ''app_att_admin'');', tbl, tbl);
  end loop;
end $$;

-- clientAdmin: scoped to their client row
-----------------------------------------------------------------
-- clients: SELECT + UPDATE
create policy clients_client_admin_select on public.clients
  for select
  using (role() = 'app_client_admin' and id = client_id());

create policy clients_client_admin_update on public.clients
  for update
  using (role() = 'app_client_admin' and id = client_id())
  with check (role() = 'app_client_admin' and id = client_id());
-----------------------------------------------------------------
-- projects: ALL on their client projects
create policy projects_client_admin_all on public.projects
  for all
  using (role() = 'app_client_admin' and client_id = client_id())
  with check (role() = 'app_client_admin' and client_id = client_id());
-----------------------------------------------------------------
-- travelers: ALL on their client travelers
create policy travelers_client_admin_all on public.travelers
  for all
  using (role() = 'app_client_admin' and client_id = client_id())
  with check (role() = 'app_client_admin' and client_id = client_id());
-----------------------------------------------------------------
-- links: ALL on their client links
create policy links_client_admin_all on public.links
  for all
  using (role() = 'app_client_admin' and client_id = client_id())
  with check (role() = 'app_client_admin' and client_id = client_id());
-----------------------------------------------------------------
-- requests: ALL but only for projects they own
create policy requests_client_admin_all on public.requests
  for all
  using (
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

-- requester policies
-----------------------------------------------------------------
-- links: read only their links
create policy links_requester_select on public.links
  for select
  using (role() = 'app_requester' and id = any(link_ids()));
-----------------------------------------------------------------
-- travelers: read only, flag for future insert control
create policy travelers_requester_select on public.travelers
  for select
  using (
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
-----------------------------------------------------------------
-- requests: select / update / delete on rows tied to link
create policy requests_requester_all on public.requests
  for all
  using (role() = 'app_requester' and created_via_link_id = any(link_ids()))
  with check (role() = 'app_requester' and created_via_link_id = any(link_ids()));

commit; 