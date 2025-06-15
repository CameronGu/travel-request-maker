begin;

-- helper functions
create or replace function role() returns text  stable language sql
as $$ select auth.jwt() ->> 'role' $$;

create or replace function client_id() returns uuid  stable language sql
as $$ select (auth.jwt() ->> 'client_id')::uuid $$;

create or replace function link_ids() returns uuid[] stable language sql
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
create policy deny_all on public.clients    as restrictive using (false);
create policy deny_all on public.projects   as restrictive using (false);
create policy deny_all on public.travelers  as restrictive using (false);
create policy deny_all on public.links      as restrictive using (false);
create policy deny_all on public.requests   as restrictive using (false);

-- attAdmin blanket (permissive)
do $$
declare
  tbl text;
begin
  foreach tbl in array array['clients','projects','travelers','links','requests'] loop
    execute format($$create policy %I_att_admin
      on public.%I
      for all as permissive
      using (role() = 'attAdmin')
      with check (role() = 'attAdmin');$$, tbl, tbl);
  end loop;
end $$;

-- clientAdmin: scoped to their client row
-----------------------------------------------------------------
-- clients: SELECT + UPDATE
create policy clients_client_admin_select on public.clients
  for select as restrictive
  using (role() = 'clientAdmin' and id = client_id());

create policy clients_client_admin_update on public.clients
  for update as restrictive
  using (role() = 'clientAdmin' and id = client_id())
  with check (role() = 'clientAdmin' and id = client_id());
-----------------------------------------------------------------
-- projects: ALL on their client projects
create policy projects_client_admin_all on public.projects
  for all as restrictive
  using (role() = 'clientAdmin' and client_id = client_id())
  with check (role() = 'clientAdmin' and client_id = client_id());
-----------------------------------------------------------------
-- travelers: ALL on their client travelers
create policy travelers_client_admin_all on public.travelers
  for all as restrictive
  using (role() = 'clientAdmin' and client_id = client_id())
  with check (role() = 'clientAdmin' and client_id = client_id());
-----------------------------------------------------------------
-- links: ALL on their client links
create policy links_client_admin_all on public.links
  for all as restrictive
  using (role() = 'clientAdmin' and client_id = client_id())
  with check (role() = 'clientAdmin' and client_id = client_id());
-----------------------------------------------------------------
-- requests: ALL but only for projects they own
create policy requests_client_admin_all on public.requests
  for all as restrictive
  using (
    role() = 'clientAdmin'
    and exists (
        select 1 from public.projects p
        where p.id = project_id
          and p.client_id = client_id()))
  with check (
    role() = 'clientAdmin'
    and exists (
        select 1 from public.projects p
        where p.id = project_id
          and p.client_id = client_id()));

-- requester policies
-----------------------------------------------------------------
-- links: read only their links
create policy links_requester_select on public.links
  for select as restrictive
  using (role() = 'requester' and id = any(link_ids()));
-----------------------------------------------------------------
-- travelers: read only, flag for future insert control
create policy travelers_requester_select on public.travelers
  for select as restrictive
  using (
    role() = 'requester'
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
create policy requests_requester_sud on public.requests
  for select as restrictive
  using (role() = 'requester'
         and created_via_link_id = any(link_ids()));

create policy requests_requester_update on public.requests
  for update as restrictive
  using (role() = 'requester'
         and created_via_link_id = any(link_ids()))
  with check (role() = 'requester'
              and created_via_link_id = any(link_ids()));

create policy requests_requester_delete on public.requests
  for delete as restrictive
  using (role() = 'requester'
         and created_via_link_id = any(link_ids()));

create policy requests_requester_insert on public.requests
  for insert as restrictive
  with check (role() = 'requester'
              and created_via_link_id = any(link_ids()));

commit;
