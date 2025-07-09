# Custom JWT Claims Structure (v6.0.0 – Update)

> **This document supersedes `jwt-claims.md` as of PRD v6.0.0.**

This document outlines the custom claims required in the JSON Web Token (JWT) for this application's authentication and authorization system, managed by Supabase. These claims are used by the Row Level Security (RLS) policies in the database to control data access.

The custom claims must be stored in the `raw_app_meta_data` field of a user's record in the `auth.users` table. Supabase will then automatically include them in the JWT payload issued upon successful authentication.

## Claims

The following claims are required:

### `role`

-   **Type**: `string`
-   **Description**: Specifies the user's role within the application. This is the primary claim used to determine permissions.
-   **Possible Values** (as of PRD v6.0.0):
    -   `super_admin`: Platform Super Administrator. Full access to all data and user management.
    -   `att_admin`: ATT Administrator. Manages all ATT and client data, can invite ATT Staff and Requesters.
    -   `att_staff`: ATT Staff. Internal workspace, limited invitation rights.
    -   `client_super_admin`: Client Super Admin. Manages a single client tenant, can invite Client Admins and Requesters.
    -   `client_admin`: Client Admin. Manages data for a client, can invite Requesters and (optionally) peer Client Admins.
    -   `requester`: End user who creates and submits requests. Access limited to own drafts/history.

### `client_id`

-   **Type**: `string` (UUID format)
-   **Description**: The unique identifier for the client entity that the user belongs to. This is used to scope data access for client and requester roles.
-   **Required for roles**: `client_super_admin`, `client_admin`, `requester`.

### `link_ids`

-   **Type**: `string`
-   **Description**: A comma-separated list of UUIDs representing the `link` records a requester is permitted to access. The RLS policies parse this string into an array of UUIDs.
-   **Required for roles**: `requester`.

### Per-User Flags (User Metadata)

-   **Flags:**
    -   `can_invite_peer_admin` (boolean): May invite admins of the same rank (e.g., ATT Admins, Client Admins).
    -   `can_invite_requesters` (boolean): May invite Requesters within their scope.
-   **Storage:** These flags are typically stored in the user metadata in the database (e.g., as columns in the `users` table), not directly in the JWT claims. However, if your RLS or application logic requires, you may include them in the JWT payload as custom claims.
-   **Propagation:** Newly-invited admins inherit `can_invite_peer_admin = false` by default. The inviter must explicitly grant the flag.

## Example `raw_app_meta_data`

Here are examples of how the `raw_app_meta_data` field should be structured for each role in the `auth.users` table. (Flags shown as part of user metadata, not always present in JWT claims.)

### `super_admin`
```json
{
  "role": "super_admin"
}
```

### `att_admin`
```json
{
  "role": "att_admin",
  "can_invite_peer_admin": false,
  "can_invite_requesters": true
}
```

### `att_staff`
```json
{
  "role": "att_staff",
  "can_invite_requesters": false
}
```

### `client_super_admin`
```json
{
  "role": "client_super_admin",
  "client_id": "83081349-bc63-4ca3-9e4b-d8611deefdc7",
  "can_invite_peer_admin": false
}
```

### `client_admin`
```json
{
  "role": "client_admin",
  "client_id": "83081349-bc63-4ca3-9e4b-d8611deefdc7",
  "can_invite_peer_admin": false,
  "can_invite_requesters": true
}
```

### `requester`
```json
{
  "role": "requester",
  "client_id": "83081349-bc63-4ca3-9e4b-d8611deefdc7",
  "link_ids": "a1b2c3d4-e5f6-7890-1234-567890abcdef,b2c3d4e5-f6a7-8901-2345-67890abcdef0"
}
```

## Implementation Notes

-   The logic for populating these claims and flags needs to be implemented in your backend and/or Supabase triggers.
-   Use the invitation system and admin UI to set flags as described in the PRD.
-   RLS policies should reference these claims and flags as needed for access control.
-   See the PRD for the full invitation and propagation logic.

---

*This document supersedes `jwt-claims.md` as of PRD v6.0.0. Refer to `prd-update.md` for the authoritative requirements.* 