# Custom JWT Claims Structure

This document outlines the custom claims required in the JSON Web Token (JWT) for this application's authentication and authorization system, managed by Supabase. These claims are used by the Row Level Security (RLS) policies in the database to control data access.

The custom claims must be stored in the `raw_app_meta_data` field of a user's record in the `auth.users` table. Supabase will then automatically include them in the JWT payload issued upon successful authentication.

## Claims

The following claims are required:

### `role`

-   **Type**: `string`
-   **Description**: Specifies the user's role within the application. This is the primary claim used to determine permissions.
-   **Possible Values**:
    -   `app_att_admin`: Application Super Administrator. Has unrestricted access to all data.
    -   `app_client_admin`: Client Administrator. Manages data for a specific client, including projects, travelers, and links.
    -   `app_requester`: A traveler or other user who is submitting a request. Their access is typically limited to specific links and the data they create.

### `client_id`

-   **Type**: `string` (UUID format)
-   **Description**: The unique identifier for the client entity that the user belongs to. This is used to scope data access for `app_client_admin` and `app_requester` roles.
-   **Required for roles**: `app_client_admin`, `app_requester`.

### `link_ids`

-   **Type**: `string`
-   **Description**: A comma-separated list of UUIDs representing the `link` records a requester is permitted to access. The RLS policies parse this string into an array of UUIDs.
-   **Required for roles**: `app_requester`.

## Example `raw_app_meta_data`

Here are examples of how the `raw_app_meta_data` field should be structured for each role in the `auth.users` table.

### `app_att_admin`

```json
{
  "role": "app_att_admin"
}
```

### `app_client_admin`

```json
{
  "role": "app_client_admin",
  "client_id": "83081349-bc63-4ca3-9e4b-d8611deefdc7"
}
```

### `app_requester`

```json
{
  "role": "app_requester",
  "client_id": "83081349-bc63-4ca3-9e4b-d8611deefdc7",
  "link_ids": "a1b2c3d4-e5f6-7890-1234-567890abcdef,b2c3d4e5-f6a7-8901-2345-67890abcdef0"
}
```

## Implementation Notes

The logic for populating these claims needs to be implemented. This will likely involve:
-   A mechanism (e.g., an encrypted link or an invitation system) to pass the required claims when a user signs up.
-   Backend logic, possibly Supabase database functions and triggers, to set the `raw_app_meta_data` on new user creation or when user roles/permissions change. 