begin;

-- Create application roles as database users with NOLOGIN (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_att_admin') THEN
    CREATE ROLE "app_att_admin" NOLOGIN;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_client_admin') THEN
    CREATE ROLE "app_client_admin" NOLOGIN;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_requester') THEN
    CREATE ROLE "app_requester" NOLOGIN;
  END IF;
END $$;

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