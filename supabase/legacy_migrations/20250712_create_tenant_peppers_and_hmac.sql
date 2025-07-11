-- Migration: Create tenant_peppers table and HMAC logic for Lean-Pepper duplicate detection
-- Implements: tenant_peppers, get_tenant_pepper, next_pepper (for rotation)

BEGIN;

-- 1. Create tenant_peppers table (with next_pepper for rotation)
CREATE TABLE IF NOT EXISTS tenant_peppers (
  client_id   uuid PRIMARY KEY,
  pepper      bytea NOT NULL,
  next_pepper bytea
);

-- 2. Function to fetch the current tenant pepper (SECURITY DEFINER, hardened search_path)
CREATE OR REPLACE FUNCTION get_tenant_pepper(p_client uuid)
RETURNS bytea
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pepper FROM tenant_peppers WHERE client_id = p_client
$$;

-- 3. (Optional) Note: Use built-in hmac_sha256 for hashing in table definitions and logic.
-- Example usage (in other migrations or table definitions):
--   hmac_sha256(contact_norm::bytea, get_tenant_pepper(client_id))

COMMIT; 