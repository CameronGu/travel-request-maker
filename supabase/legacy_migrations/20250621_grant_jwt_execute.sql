begin;

-- Grant EXECUTE on the jwt function to application roles
grant execute on function auth.jwt() to "app_att_admin";
grant execute on function auth.jwt() to "app_client_admin";
grant execute on function auth.jwt() to "app_requester";

commit; 