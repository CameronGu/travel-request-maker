import dotenv from "dotenv";
dotenv.config(); // Loads .env
// Loads .env.local and overrides any variables from .env
dotenv.config({ path: ".env.local", override: true });
// Loads supabase/functions/.env and overrides any variables from above
dotenv.config({ path: "supabase/functions/.env", override: true }); 