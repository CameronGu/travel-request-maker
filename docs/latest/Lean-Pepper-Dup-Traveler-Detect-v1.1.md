## Duplicate-Traveller Detection — **Lean-Pepper** Build Spec (v 1.1)

### 0 ▪ Business context

| Item              | Value                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Platform          | Multitenant SaaS for corporate-travel management                                                                          |
| Core table        | `travelers(id uuid PK, client_id uuid, first_name, last_name, created_by, created_at, traveler_hash text **DEPRECATED**)` |
| Tenancy isolation | PostgreSQL RLS keyed on **Supabase JWT** claims (`client_id`, `role`)                                                     |
| Roles             | `attAdmin`, `clientAdmin`, `requester` (magic-link)                                                                       |
| Flag              | `allow_add_travelers` (Boolean returned to the RPC, see §6)                                                               |
| SLA               | Insert + duplicate-check ≤ 100 ms @ 95-th percentile                                                                      |
| Scale target      | ≤ 100 k travelers, ≤ 300 k contacts                                                                                       |

### 1 ▪ Functional goals

* **G1** Block insert when *both* phone *and* email match an existing traveller (EXACT).
* **G2** Popup “Confirm?” when a single contact matches (STRONG).
* **G3** Show non-blocking banner when only fuzzy name matches (SOFT).
* **G4** Never leak PII across tenant or role boundaries.
* **G5** Pure SQL/JS implementation — no external queues, workers, or triggers.

### 2 ▪ Normalisation & hashing helpers (SQL + identical JS)

```sql
-- ---------- phone ----------
-- libphonenumber may be absent on Supabase Cloud; fallback to regex
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

-- ---------- email ----------
CREATE OR REPLACE FUNCTION normalise_email(raw text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE e text := lower(trim(raw));
BEGIN
  -- Gmail “dots & plus” normalisation
  IF e ~* '@(gmail|googlemail)\.' THEN
     e := regexp_replace(split_part(e,'@',1), '\+.*$', '');
     e := replace(e, '.', '') || '@' || split_part(e,'@',2);
  END IF;
  RETURN e;
END $$;
```

#### Pepper storage

```sql
CREATE TABLE IF NOT EXISTS tenant_peppers (
  client_id uuid PRIMARY KEY,
  pepper    bytea NOT NULL
);

CREATE OR REPLACE FUNCTION get_tenant_pepper(p_client uuid)
RETURNS bytea
LANGUAGE sql
SECURITY DEFINER
SET search_path = public      -- harden against path spoofing
AS $$ SELECT pepper FROM tenant_peppers WHERE client_id = p_client $$;
```

### 3 ▪ Schema additions

```sql
-- 3.1  contacts (many-to-one)
CREATE TABLE traveler_contacts (
  contact_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_id  uuid REFERENCES travelers ON DELETE CASCADE,
  client_id    uuid NOT NULL,
  contact_type text CHECK (contact_type IN ('PHONE','EMAIL')),
  contact_raw  text NOT NULL,
  contact_norm text GENERATED ALWAYS AS (
    CASE WHEN contact_type='PHONE'
         THEN normalise_phone(contact_raw)
         ELSE normalise_email(contact_raw)
    END
  ) STORED,
  contact_hash bytea GENERATED ALWAYS AS (
    hmac_sha256(contact_norm::bytea,
                get_tenant_pepper(client_id))
  ) STORED
);
CREATE UNIQUE INDEX uniq_contact_hash
  ON traveler_contacts(client_id, contact_type, contact_hash);

-- 3.2  duplicate findings / audit trail
CREATE TABLE dup_findings (
  finding_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_id  uuid REFERENCES travelers ON DELETE CASCADE,
  cand_id      uuid,                            -- nullable for EXACT
  client_id    uuid NOT NULL,
  confidence   text CHECK (confidence IN ('EXACT','STRONG','SOFT')),
  src          text,                            -- 'CONTACTS'|'PHONE'|'EMAIL'|'FUZZY'
  created_at   timestamptz DEFAULT now(),
  reviewed     boolean DEFAULT false
);

-- 3.3  fuzzy-match support on names
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX trgm_travelers_name
  ON travelers USING gin (lower(first_name||' '||last_name) gin_trgm_ops);
```

### 4 ▪ Row-level security (Supabase JWT style)

Supabase injects JWT claims into `auth.jwt()`.
Assumed payload shape: `{ "client_id": "...", "role": "..." }`.

```sql
-- Enable RLS
ALTER TABLE travelers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE traveler_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dup_findings      ENABLE ROW LEVEL SECURITY;

-- ---------- travelers & contacts ----------
CREATE POLICY p_trav_iso ON travelers
  USING (client_id = (auth.jwt() ->> 'client_id')::uuid);

CREATE POLICY p_contacts_iso ON traveler_contacts
  USING (client_id = (auth.jwt() ->> 'client_id')::uuid)
  WITH CHECK (client_id = (auth.jwt() ->> 'client_id')::uuid);

-- ---------- findings ----------
CREATE POLICY p_findings_requester ON dup_findings
  FOR SELECT USING (
    client_id = (auth.jwt() ->> 'client_id')::uuid
    AND confidence <> 'EXACT'
    AND auth.jwt() ->> 'role'  = 'requester'
);

CREATE POLICY p_findings_admin ON dup_findings
  FOR ALL USING (
    client_id = (auth.jwt() ->> 'client_id')::uuid
    AND auth.jwt() ->> 'role'  IN ('attAdmin','clientAdmin')
);
```

### 5 ▪ Duplicate collector (`dup_collect`) — pure SQL

```sql
CREATE OR REPLACE FUNCTION dup_collect(p_traveler uuid, p_client uuid)
RETURNS TABLE(confidence text, cand_id uuid, src text) LANGUAGE plpgsql AS $$
DECLARE
  cand  record;
  THRESHOLD constant numeric := 0.85;          -- expose for tests / tuning
BEGIN
  -- ----- EXACT: both phone + email match same candidate -----
  IF EXISTS (
    SELECT 1
    FROM traveler_contacts c1
    JOIN traveler_contacts c2
      ON (c1.contact_hash = c2.contact_hash
          AND c1.contact_type = c2.contact_type
          AND c1.traveler_id <> c2.traveler_id)
    WHERE c1.traveler_id = p_traveler
      AND c1.client_id   = p_client
    GROUP BY c2.traveler_id
    HAVING COUNT(DISTINCT c2.contact_type) = 2      -- both kinds
  ) THEN
    RETURN QUERY
    INSERT INTO dup_findings(traveler_id, client_id, confidence, src)
    VALUES (p_traveler, p_client, 'EXACT', 'CONTACTS')
    ON CONFLICT DO NOTHING
    RETURNING confidence, NULL::uuid, src;
    RETURN;
  END IF;

  -- ----- STRONG: any single contact hash clash -----
  FOR cand IN
    SELECT DISTINCT c2.traveler_id AS cand_id, c2.contact_type AS src
    FROM traveler_contacts c1
    JOIN traveler_contacts c2
      ON c1.contact_hash = c2.contact_hash
     AND c1.contact_type = c2.contact_type
    WHERE c1.traveler_id = p_traveler
      AND c1.client_id   = p_client
      AND c1.traveler_id <> c2.traveler_id
  LOOP
    RETURN QUERY
    INSERT INTO dup_findings(traveler_id, cand_id, client_id,
                             confidence, src)
    VALUES (p_traveler, cand.cand_id, p_client, 'STRONG', cand.src)
    ON CONFLICT DO NOTHING
    RETURNING confidence, cand_id, src;
  END LOOP;

  -- ----- SOFT: fuzzy first & last name similarity -----
  RETURN QUERY
  INSERT INTO dup_findings(traveler_id, cand_id, client_id,
                           confidence, src)
  SELECT p_traveler, id, p_client, 'SOFT', 'FUZZY'
  FROM travelers
  WHERE client_id = p_client
    AND id <> p_traveler
    AND similarity(lower(first_name),
                   (SELECT lower(first_name)
                      FROM travelers WHERE id = p_traveler))
        > THRESHOLD
    AND similarity(lower(last_name),
                   (SELECT lower(last_name)
                      FROM travelers WHERE id = p_traveler))
        > THRESHOLD
  LIMIT 1
  ON CONFLICT DO NOTHING
  RETURNING confidence, cand_id, src;
END $$;
```

### 6 ▪ Primary RPC — `create_traveler`

```sql
CREATE OR REPLACE FUNCTION create_traveler(
  p_client   uuid,
  p_first    text,
  p_last     text,
  p_contacts jsonb,     -- array [{type:'PHONE',value:'…'}, {...}]
  p_actor    uuid,
  p_role     text,      -- 'attAdmin'|'clientAdmin'|'requester'
  p_allow_add boolean   -- comes from magic-link or admin UI
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tr_id uuid := gen_random_uuid();
  res   jsonb := '[]'::jsonb;
  dup   record;
BEGIN
  -- ---------- permission check ----------
  IF p_role = 'requester' AND NOT p_allow_add THEN
      RAISE EXCEPTION 'Traveler self-add disabled';
  END IF;

  -- ---------- insert traveller ----------
  INSERT INTO travelers(id, client_id, first_name, last_name, created_by)
  VALUES (tr_id, p_client, p_first, p_last, p_actor);

  -- ---------- insert all contacts ----------
  INSERT INTO traveler_contacts(traveler_id, client_id,
                                contact_type, contact_raw)
  SELECT tr_id, p_client, c->>'type', c->>'value'
  FROM jsonb_array_elements(p_contacts) AS c
  ON CONFLICT DO NOTHING;      -- duplicates of same traveller OK

  -- ---------- collect duplicates ----------
  FOR dup IN SELECT * FROM dup_collect(tr_id, p_client) LOOP
    res := res || jsonb_build_object(
      'confidence', dup.confidence,
      'cand_id',    dup.cand_id,
      'src',        dup.src
    );
  END LOOP;

  -- ---------- hard block for requester on EXACT ----------
  IF res @> '[{"confidence":"EXACT"}]'::jsonb AND p_role='requester' THEN
      RAISE EXCEPTION 'Duplicate traveler blocked';
  END IF;

  RETURN jsonb_build_object('traveler_id', tr_id, 'findings', res);
END $$;
```

### 7 ▪ Stub RPC — `merge_travelers` (admin only)

```sql
CREATE OR REPLACE FUNCTION merge_travelers(src uuid, dst uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- TODO: re-point child FK rows, copy null fields, etc.
  -- For now: simply delete source row to unblock UI
  DELETE FROM travelers WHERE id = src;
END $$;
```

### 8 ▪ Front-end integration rules

1. **Call** `create_traveler()` with full contact JSON (include secondary e-mails and extra phones).
2. Parse returned `findings[]`.

   * Requester UI → block on `EXACT`, confirm modal on `STRONG`, toast on `SOFT`.
   * Admin UI → always show merge modal listing candidates; on “Merge” call `merge_travelers(src,dst)`.
3. Existing React code already shows a “Dup?” chip based on `traveler_hash`.

   * **Update**: read from `dup_findings` (ANY confidence) instead; keep the legacy column until the refactor is complete.
4. Include the JS twins of `normalise_phone` & `normalise_email` to give instant client-side hints, but always treat server result as source of truth.

### 9 ▪ Pepper-rotation SOP

1. **Add** `next_pepper` column to `tenant_peppers`.
2. Off-peak **Edge Function** (or psql job):

```sql
UPDATE traveler_contacts
SET contact_hash =
    hmac_sha256(contact_norm::bytea,
                tenant_peppers.next_pepper)
FROM tenant_peppers
WHERE traveler_contacts.client_id = tenant_peppers.client_id;
```

*Use `WHERE client_id = :tenant_id` batches or a partial index to keep locks small.*
3\. Swap `pepper ← next_pepper`, drop the temp column, commit.

### 10 ▪ Testing & CI

| Layer    | Tooling                  | Key assertions                                                       |
| -------- | ------------------------ | -------------------------------------------------------------------- |
| Unit SQL | **pgTAP**                | Normalisation, hash repeatability, threshold constant, RLS isolation |
| API      | Supabase JS + **Vitest** | Requester block / confirm / toast paths                              |
| Browser  | **Playwright**           | UI modals render & merge removes dup chip                            |
| Load     | k6 or pgbench            | 10 k inserts ≤ 100 ms @ p95                                          |

CI matrix already runs Vitest + Playwright; add pgTAP stage (budget ≤ 300 s).

### 11 ▪ Deliverables expected from Cursor AI

1. **SQL migration file(s)** containing §2-§8.
2. Supabase **TypeScript service layer** exposing `create_traveler`, `merge_travelers`.
3. **JS normaliser helpers** (phone + email) shared via `/lib/contacts.ts`.
4. **React updates**: modal, toast, chip source change.
5. **README**: pepper-rotation guide, test instructions.
6. **Tests/CI**: pgTAP, Vitest, Playwright.

---

### Begin implementation immediately.

Any deviation from this spec must be reflected by editing the prompt and re-running.