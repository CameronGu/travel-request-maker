v1.0

# Manual RLS Policy Testing in Supabase Studio (v6.0.0 – Update)

> **This document supersedes `supabase-studio-rls-testing.md` as of PRD v6.0.0.**

This document outlines the procedure for manually testing Row-Level Security (RLS) policies using the Supabase Studio SQL Editor. This method is useful for debugging specific policies or as a backup to automated testing.

## Prerequisites

1.  **Valid JWTs**: You must have valid JSON Web Tokens (JWTs) for each user role you intend to test (e.g., `super_admin`, `att_admin`, `att_staff`, `client_super_admin`, `client_admin`, `requester`). These can be generated using the `src/scripts/gen-*.js` scripts in this project.

2.  **Supabase Studio Access**: You need access to the SQL Editor for your project in the Supabase Studio.

## Testing Procedure

The core of the testing process involves two steps within a single transaction:
1.  Setting the local session's role to `authenticated`.
2.  Setting a local configuration variable `request.jwt.claims` to the claims from your test JWT.

This simulates a request from an authenticated user with a specific role, allowing you to test how your RLS policies behave.

### Step-by-Step Guide

1.  **Navigate to SQL Editor**: Open the Supabase Studio and go to the "SQL Editor" section.

2.  **Prepare the SQL Transaction**: Create a new query and structure it as a transaction block (`BEGIN; ... COMMIT;`). This ensures your settings are temporary and only apply to the queries within the block.

3.  **Set Role and JWT Claims**: Inside the transaction, use the following commands. Replace `<claims_json>` with the actual claims JSON for the role and flags you are testing.

    ```sql
    BEGIN;
    SET LOCAL ROLE authenticated;
    SELECT set_config('request.jwt.claims', '<claims_json>', true);
    -- Your test query here
    COMMIT;
    ```

4.  **Add Your Test Query**: Replace the comment `-- Your test query here` with the actual query you want to test. You can test `SELECT`, `INSERT`, `UPDATE`, or `DELETE` statements.

5.  **Execute and Verify**: Run the query. The results will reflect how your RLS policies are applied for the user role and flags embedded in the JWT you provided.
    *   **Verify Data Visibility**: Check if you can only see the rows you're supposed to.
    *   **Verify Actions**: Check if you can perform the actions (INSERT, UPDATE, DELETE) that the role should be allowed to perform, and are blocked from those it shouldn't.

### Example: Testing New Roles and Flags

#### Example 1: `client_admin` with default flags

```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"role": "client_admin", "client_id": "...", "can_invite_peer_admin": false, "can_invite_requesters": true}', true);
-- Test if the client_admin can invite requesters and see their own projects
SELECT * FROM public.projects;
COMMIT;
```

#### Example 2: `att_admin` with peer admin invitation enabled

```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"role": "att_admin", "can_invite_peer_admin": true, "can_invite_requesters": true}', true);
-- Test if the att_admin can invite other att_admins and requesters
SELECT * FROM public.users WHERE role = 'att_admin';
COMMIT;
```

#### Example 3: `super_admin`

```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"role": "super_admin"}', true);
-- Test if the super_admin can see all data
SELECT * FROM public.users;
COMMIT;
```

#### Example 4: `requester` with link_ids

```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"role": "requester", "client_id": "...", "link_ids": "uuid1,uuid2"}', true);
-- Test if the requester can only see their own drafts and history
SELECT * FROM public.requests WHERE client_id = '...';
COMMIT;
```

### Testing Invitation/Propagation Logic

- When testing invitation flows, ensure that newly-invited admins have `can_invite_peer_admin = false` by default, and that only users with the flag set to true can invite peer admins.
- You can simulate toggling flags by changing the claims JSON in your test block.

### Notes

- Always match the claims structure to the latest PRD (`prd-update.md`).
- If your RLS policies reference flags, ensure they are present in the claims for your test.
- For more complex scenarios, test combinations of roles and flags as described in the PRD.

---

*This document supersedes `supabase-studio-rls-testing.md` as of PRD v6.0.0. Refer to `prd-update.md` for the authoritative requirements.* 