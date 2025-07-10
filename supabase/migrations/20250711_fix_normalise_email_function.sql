-- Migration: Fix normalise_email to preserve domain for Gmail addresses

CREATE OR REPLACE FUNCTION normalise_email(raw text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  e text := lower(trim(raw));
  local_part text;
  domain_part text;
BEGIN
  -- Split into local and domain parts
  local_part := split_part(e, '@', 1);
  domain_part := split_part(e, '@', 2);

  -- Gmail/Googlemail normalization: remove dots and plus part from local part
  IF domain_part ~* '^(gmail|googlemail)\.' THEN
    local_part := regexp_replace(local_part, '\+.*$', '');
    local_part := replace(local_part, '.', '');
    RETURN local_part || '@' || domain_part;
  END IF;

  -- For all emails: remove plus part from local part
  local_part := regexp_replace(local_part, '\+.*$', '');
  RETURN local_part || '@' || domain_part;
END $$; 