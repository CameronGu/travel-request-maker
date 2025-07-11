begin;

-- Drop default privileges if they exist, to avoid conflicts
do $$
begin
  if exists (select 1 from pg_default_acl where defaclobjtype = 'r' and defaclacl is not null) then
    alter default privileges in schema public revoke all on tables from "app_att_admin", "app_client_admin", "app_requester";
    alter default privileges in schema auth revoke all on tables from "app_att_admin";
  end if;
  if exists (select 1 from pg_default_acl where defaclobjtype = 'f' and defaclacl is not null) then
    alter default privileges in schema auth revoke all on functions from "app_att_admin";
  end if;
  if exists (select 1 from pg_default_acl where defaclobjtype = 'S' and defaclacl is not null) then
     alter default privileges in schema public revoke all on sequences from "app_att_admin", "app_client_admin", "app_requester";
     alter default privileges in schema auth revoke all on sequences from "app_att_admin";
  end if;
end $$;


-- Create application roles if they don't exist
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_att_admin') then
    create role "app_att_admin" nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'app_client_admin') then
    create role "app_client_admin" nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'app_requester') then
    create role "app_requester" nologin;
  end if;
end $$;

-- Grant usage on schemas
grant usage on schema public to "app_att_admin", "app_client_admin", "app_requester";
grant usage on schema auth to "app_att_admin", "app_client_admin", "app_requester";

-- Grant table-specific privileges for public schema
grant all privileges on all tables in schema public to "app_att_admin";
grant select, insert, update, delete on all tables in schema public to "app_client_admin";
grant select, insert on all tables in schema public to "app_requester";

-- Grant sequence usage
grant usage on all sequences in schema public to "app_att_admin", "app_client_admin", "app_requester";

-- Ensure new tables get the same grants
alter default privileges in schema public grant all on tables to "app_att_admin";
alter default privileges in schema public grant select, insert, update, delete on tables to "app_client_admin";
alter default privileges in schema public grant select, insert on tables to "app_requester";
alter default privileges in schema public grant usage on sequences to "app_att_admin", "app_client_admin", "app_requester";

-- Grant permissions on auth schema
grant all on all tables in schema auth to "app_att_admin";
grant all on all functions in schema auth to "app_att_admin";
grant all on all sequences in schema auth to "app_att_admin";
alter default privileges in schema auth grant all on tables to "app_att_admin";
alter default privileges in schema auth grant all on functions to "app_att_admin";
alter default privileges in schema auth grant all on sequences to "app_att_admin";

-- Grant role switching ability to authenticator
grant "app_att_admin" to authenticator;
grant "app_client_admin" to authenticator;
grant "app_requester" to authenticator;

commit; 