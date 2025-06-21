begin;

-- Grant broad permissions on the auth schema to application roles
grant usage on schema auth to "app_att_admin", "app_client_admin", "app_requester";
grant execute on all functions in schema auth to "app_att_admin", "app_client_admin", "app_requester";

commit; 