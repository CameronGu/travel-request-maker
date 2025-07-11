import "./bootstrap-env.js";

console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("TEST_JWT_ATTADMIN:", process.env.TEST_JWT_ATTADMIN);
console.log("TEST_JWT_CLIENTADMIN:", process.env.TEST_JWT_CLIENTADMIN);
console.log("TEST_JWT_REQUESTER:", process.env.TEST_JWT_REQUESTER);
console.log("SERVICE_ROLE_KEY (functions):", process.env.SERVICE_ROLE_KEY);
console.log("PUBLIC_SUPABASE_URL (functions):", process.env.PUBLIC_SUPABASE_URL);
console.log("ANON_KEY (functions):", process.env.ANON_KEY);
console.log("DB_URL (functions):", process.env.DB_URL); 