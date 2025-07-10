-- Migration: Add normalization functions for Lean-Pepper duplicate detection
-- Implements: normalise_phone, normalise_email, normalize_name

BEGIN;

-- Phone normalization (E.164 if possible, fallback to digits only)
CREATE OR REPLACE FUNCTION normalise_phone(raw text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE e164 text;
BEGIN
  BEGIN
    e164 := libphonenumber_to_e164(raw);
  EXCEPTION WHEN undefined_function THEN
    e164 := regexp_replace(raw, '[^0-9+]', '', 'g');
  END;
  RETURN e164;
END $$;

-- Email normalization (lowercase, trim, Gmail dot/plus rules)
CREATE OR REPLACE FUNCTION normalise_email(raw text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE e text := lower(trim(raw));
BEGIN
  -- Gmail “dots & plus” normalization
  IF e ~* '@(gmail|googlemail)\.' THEN
     e := regexp_replace(split_part(e,'@',1), '\+.*$', '');
     e := replace(e, '.', '') || '@' || split_part(e,'@',2);
  END IF;
  RETURN e;
END $$;

-- Name normalization (lowercase, trim, remove punctuation)
CREATE OR REPLACE FUNCTION normalize_name(raw text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(trim(regexp_replace($1, '[^a-z0-9 ]', '', 'gi')));
$$;

COMMIT; 