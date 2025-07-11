begin;

-- Redefine helper functions with SECURITY DEFINER
create or replace function role() returns text
  language sql
  stable
  security definer
  -- Set a search path to prevent hijacking
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

commit; 