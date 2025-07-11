-- 20250712_baseline_schema.sql
-- NEW BASELINE MIGRATION AFTER FULL RESET
-- All previous migrations are deprecated and archived in supabase/legacy_migrations/.
-- Do not apply any files from the archive to the current database.
-- Baseline schema for Travel Request Management System (PRD v6, July 2025)
-- This file creates all core tables, relationships, and constraints for a fresh Supabase instance.

-- 1. clients
CREATE TABLE clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 2. users (with flags)
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    role text NOT NULL,
    client_id uuid REFERENCES clients(id),
    can_invite_peer_admin boolean NOT NULL DEFAULT false,
    can_invite_requesters boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 3. projects
CREATE TABLE projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id),
    name text NOT NULL,
    budget numeric,
    created_at timestamptz DEFAULT now()
);

-- 4. travelers
CREATE TABLE travelers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id),
    first_name text NOT NULL,
    last_name text NOT NULL,
    created_by uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now()
);

-- 5. links (created before requests, request_id is nullable, no FK yet)
CREATE TABLE links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid, -- FK added after both tables exist
    user_id uuid REFERENCES users(id),
    client_id uuid NOT NULL REFERENCES clients(id),
    allow_add_travelers boolean NOT NULL DEFAULT false,
    email text,
    expires_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 6. requests
CREATE TYPE request_status AS ENUM (
  'draft','submitted','accepted','assigned','in_progress','pending_client','on_hold','completed','cancelled','rejected'
);
CREATE TABLE requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id),
    traveler_id uuid NOT NULL REFERENCES travelers(id),
    status request_status NOT NULL DEFAULT 'draft',
    request_id text GENERATED ALWAYS AS (lpad((id::text), 8, '0')) STORED,
    created_via_link_id uuid REFERENCES links(id),
    submitted_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Add FK from links.request_id to requests(id) after both tables exist
ALTER TABLE links ADD CONSTRAINT links_request_id_fkey FOREIGN KEY (request_id) REFERENCES requests(id);

-- 7. request_status_log
CREATE TABLE request_status_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid REFERENCES requests(id),
    from_status request_status,
    to_status request_status,
    changed_by uuid REFERENCES users(id),
    changed_at timestamptz DEFAULT now()
);

-- 8. traveler_contacts
CREATE TABLE traveler_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    traveler_id uuid NOT NULL REFERENCES travelers(id),
    type text NOT NULL, -- 'email' or 'phone'
    value text NOT NULL,
    normalized text,
    contact_hash text,
    created_at timestamptz DEFAULT now()
);

-- 9. dup_findings
CREATE TABLE dup_findings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    traveler_id uuid NOT NULL REFERENCES travelers(id),
    contact_id uuid REFERENCES traveler_contacts(id),
    confidence text NOT NULL, -- 'EXACT', 'STRONG', 'SOFT'
    finding_at timestamptz DEFAULT now()
);

-- 10. tenant_peppers
CREATE TABLE tenant_peppers (
    client_id uuid PRIMARY KEY REFERENCES clients(id),
    pepper bytea NOT NULL,
    next_pepper bytea
);

-- 11. access_logs
CREATE TABLE access_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id),
    action text NOT NULL,
    context text,
    created_at timestamptz DEFAULT now()
);

-- 12. audit_log
CREATE TABLE audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id),
    action text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_travelers_client_id ON travelers(client_id);
CREATE INDEX idx_traveler_contacts_traveler_id ON traveler_contacts(traveler_id);
CREATE INDEX idx_traveler_contacts_normalized ON traveler_contacts(normalized);
CREATE INDEX idx_requests_project_id ON requests(project_id);
CREATE INDEX idx_requests_traveler_id ON requests(traveler_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_dup_findings_traveler_id ON dup_findings(traveler_id);
CREATE INDEX idx_dup_findings_confidence ON dup_findings(confidence);

-- End baseline schema 