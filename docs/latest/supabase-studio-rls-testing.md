# Manual RLS Policy Testing in Supabase Studio

This document outlines the procedure for manually testing Row-Level Security (RLS) policies using the Supabase Studio SQL Editor. This method is useful for debugging specific policies or as a backup to automated testing.

## Prerequisites

1.  **Valid JWTs**: You must have valid JSON Web Tokens (JWTs) for each user role you intend to test (e.g., `attAdmin`, `clientAdmin`, `requester`). These can be generated using the `src/scripts/gen-*.js` scripts in this project.

2.  **Supabase Studio Access**: You need access to the SQL Editor for your project in the Supabase Studio.

## Testing Procedure

The core of the testing process involves two steps within a single transaction:
1.  Setting the local session's role to `authenticated`.
2.  Setting a local configuration variable `request.jwt.claims` to the claims from your test JWT.

This simulates a request from an authenticated user with a specific role, allowing you to test how your RLS policies behave.

### Step-by-Step Guide

1.  **Navigate to SQL Editor**: Open the Supabase Studio and go to the "SQL Editor" section.

2.  **Prepare the SQL Transaction**: Create a new query and structure it as a transaction block (`BEGIN; ... COMMIT;`). This ensures your settings are temporary and only apply to the queries within the block.

3.  **Set Role and JWT Claims**: Inside the transaction, use the following commands. Replace `'<your_jwt_here>'` with the actual JWT string for the role you are testing.

    ```sql
    BEGIN;

    -- Set the role to 'authenticated' for the current transaction
    SET LOCAL ROLE authenticated;

    -- Set the JWT claims for the current transaction
    -- Replace '<your_jwt_here>' with the actual token
    SELECT set_config('request.jwt.claims', (
      SELECT value FROM json_each((auth.jwt() ->> 'user_metadata')::json) WHERE value::jsonb ? 'role'
    )::text, true)
    WHERE auth.jwt() ->> 'user_metadata' IS NOT NULL;


    -- Your test query goes here. For example:
    -- SELECT * FROM public.requests;

    COMMIT;
    ```

4.  **Add Your Test Query**: Replace the comment `-- SELECT * FROM public.requests;` with the actual query you want to test. You can test `SELECT`, `INSERT`, `UPDATE`, or `DELETE` statements.

5.  **Execute and Verify**: Run the query. The results will reflect how your RLS policies are applied for the user role embedded in the JWT you provided.
    *   **Verify Data Visibility**: Check if you can only see the rows you're supposed to.
    *   **Verify Actions**: Check if you can perform the actions (INSERT, UPDATE, DELETE) that the role should be allowed to perform, and are blocked from those it shouldn't.

### Example: Testing `clientAdmin` Role

Suppose you have a JWT for a `clientAdmin`. You can test their ability to see `projects` for their specific `client_id` as follows:

```sql
BEGIN;

-- Set the role to 'authenticated' for the current transaction
SET LOCAL ROLE authenticated;

-- Set the JWT for the clientAdmin role
SELECT set_config('request.jwt.claims', (
  SELECT value FROM json_each((auth.jwt() ->> 'user_metadata')::json) WHERE value::jsonb ? 'role'
)::text, true)
WHERE auth.jwt() ->> 'user_metadata' IS NOT NULL;


-- Test if the clientAdmin can see only their projects
SELECT * FROM public.projects;

COMMIT;
```

By changing the JWT and the test query, you can manually verify the complete RLS matrix for all roles and operations. 