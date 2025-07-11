

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."request_status" AS ENUM (
    'draft',
    'submitted',
    'accepted',
    'assigned',
    'in_progress',
    'pending_client',
    'on_hold',
    'completed',
    'cancelled',
    'rejected'
);


ALTER TYPE "public"."request_status" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."access_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "context" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."access_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dup_findings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "traveler_id" "uuid" NOT NULL,
    "contact_id" "uuid",
    "confidence" "text" NOT NULL,
    "finding_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dup_findings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid",
    "user_id" "uuid",
    "email" "text",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "budget" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."request_status_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid",
    "from_status" "public"."request_status",
    "to_status" "public"."request_status",
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."request_status_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "traveler_id" "uuid" NOT NULL,
    "status" "public"."request_status" DEFAULT 'draft'::"public"."request_status" NOT NULL,
    "request_id" "text" GENERATED ALWAYS AS ("lpad"(("id")::"text", 8, '0'::"text")) STORED,
    "submitted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_peppers" (
    "client_id" "uuid" NOT NULL,
    "pepper" "bytea" NOT NULL,
    "next_pepper" "bytea"
);


ALTER TABLE "public"."tenant_peppers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."traveler_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "traveler_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "value" "text" NOT NULL,
    "normalized" "text",
    "contact_hash" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."traveler_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."travelers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."travelers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "client_id" "uuid",
    "can_invite_peer_admin" boolean DEFAULT false NOT NULL,
    "can_invite_requesters" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."access_logs"
    ADD CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dup_findings"
    ADD CONSTRAINT "dup_findings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."links"
    ADD CONSTRAINT "links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."request_status_log"
    ADD CONSTRAINT "request_status_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_peppers"
    ADD CONSTRAINT "tenant_peppers_pkey" PRIMARY KEY ("client_id");



ALTER TABLE ONLY "public"."traveler_contacts"
    ADD CONSTRAINT "traveler_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."travelers"
    ADD CONSTRAINT "travelers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_dup_findings_confidence" ON "public"."dup_findings" USING "btree" ("confidence");



CREATE INDEX "idx_dup_findings_traveler_id" ON "public"."dup_findings" USING "btree" ("traveler_id");



CREATE INDEX "idx_projects_client_id" ON "public"."projects" USING "btree" ("client_id");



CREATE INDEX "idx_requests_project_id" ON "public"."requests" USING "btree" ("project_id");



CREATE INDEX "idx_requests_status" ON "public"."requests" USING "btree" ("status");



CREATE INDEX "idx_requests_traveler_id" ON "public"."requests" USING "btree" ("traveler_id");



CREATE INDEX "idx_traveler_contacts_normalized" ON "public"."traveler_contacts" USING "btree" ("normalized");



CREATE INDEX "idx_traveler_contacts_traveler_id" ON "public"."traveler_contacts" USING "btree" ("traveler_id");



CREATE INDEX "idx_travelers_client_id" ON "public"."travelers" USING "btree" ("client_id");



CREATE INDEX "idx_users_client_id" ON "public"."users" USING "btree" ("client_id");



ALTER TABLE ONLY "public"."access_logs"
    ADD CONSTRAINT "access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dup_findings"
    ADD CONSTRAINT "dup_findings_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."traveler_contacts"("id");



ALTER TABLE ONLY "public"."dup_findings"
    ADD CONSTRAINT "dup_findings_traveler_id_fkey" FOREIGN KEY ("traveler_id") REFERENCES "public"."travelers"("id");



ALTER TABLE ONLY "public"."links"
    ADD CONSTRAINT "links_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id");



ALTER TABLE ONLY "public"."links"
    ADD CONSTRAINT "links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."request_status_log"
    ADD CONSTRAINT "request_status_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."request_status_log"
    ADD CONSTRAINT "request_status_log_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_traveler_id_fkey" FOREIGN KEY ("traveler_id") REFERENCES "public"."travelers"("id");



ALTER TABLE ONLY "public"."tenant_peppers"
    ADD CONSTRAINT "tenant_peppers_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."traveler_contacts"
    ADD CONSTRAINT "traveler_contacts_traveler_id_fkey" FOREIGN KEY ("traveler_id") REFERENCES "public"."travelers"("id");



ALTER TABLE ONLY "public"."travelers"
    ADD CONSTRAINT "travelers_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."travelers"
    ADD CONSTRAINT "travelers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "app_att_admin";
GRANT USAGE ON SCHEMA "public" TO "app_client_admin";
GRANT USAGE ON SCHEMA "public" TO "app_requester";



GRANT ALL ON TABLE "public"."access_logs" TO "anon";
GRANT ALL ON TABLE "public"."access_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."access_logs" TO "service_role";
GRANT ALL ON TABLE "public"."access_logs" TO "app_att_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."access_logs" TO "app_client_admin";
GRANT SELECT,INSERT ON TABLE "public"."access_logs" TO "app_requester";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";
GRANT ALL ON TABLE "public"."audit_log" TO "app_att_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."audit_log" TO "app_client_admin";
GRANT SELECT,INSERT ON TABLE "public"."audit_log" TO "app_requester";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";
GRANT ALL ON TABLE "public"."clients" TO "app_att_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."clients" TO "app_client_admin";
GRANT SELECT,INSERT ON TABLE "public"."clients" TO "app_requester";



GRANT ALL ON TABLE "public"."dup_findings" TO "anon";
GRANT ALL ON TABLE "public"."dup_findings" TO "authenticated";
GRANT ALL ON TABLE "public"."dup_findings" TO "service_role";
GRANT ALL ON TABLE "public"."dup_findings" TO "app_att_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dup_findings" TO "app_client_admin";
GRANT SELECT,INSERT ON TABLE "public"."dup_findings" TO "app_requester";



GRANT ALL ON TABLE "public"."links" TO "anon";
GRANT ALL ON TABLE "public"."links" TO "authenticated";
GRANT ALL ON TABLE "public"."links" TO "service_role";
GRANT ALL ON TABLE "public"."links" TO "app_att_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."links" TO "app_client_admin";
GRANT SELECT,INSERT ON TABLE "public"."links" TO "app_requester";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";
GRANT ALL ON TABLE "public"."projects" TO "app_att_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."projects" TO "app_client_admin";
GRANT SELECT,INSERT ON TABLE "public"."projects" TO "app_requester";



GRANT ALL ON TABLE "public"."request_status_log" TO "anon";
GRANT ALL ON TABLE "public"."request_status_log" TO "authenticated";
GRANT ALL ON TABLE "public"."request_status_log" TO "service_role";
GRANT ALL ON TABLE "public"."request_status_log" TO "app_att_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."request_status_log" TO "app_client_admin";
GRANT SELECT,INSERT ON TABLE "public"."request_status_log" TO "app_requester";



GRANT ALL ON TABLE "public"."requests" TO "anon";
GRANT ALL ON TABLE "public"."requests" TO "authenticated";
GRANT ALL ON TABLE "public"."requests" TO "service_role";
GRANT ALL ON TABLE "public"."requests" TO "app_att_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."requests" TO "app_client_admin";
GRANT SELECT,INSERT ON TABLE "public"."requests" TO "app_requester";



GRANT ALL ON TABLE "public"."tenant_peppers" TO "anon";
GRANT ALL ON TABLE "public"."tenant_peppers" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_peppers" TO "service_role";
GRANT ALL ON TABLE "public"."tenant_peppers" TO "app_att_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."tenant_peppers" TO "app_client_admin";
GRANT SELECT,INSERT ON TABLE "public"."tenant_peppers" TO "app_requester";



GRANT ALL ON TABLE "public"."traveler_contacts" TO "anon";
GRANT ALL ON TABLE "public"."traveler_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."traveler_contacts" TO "service_role";
GRANT ALL ON TABLE "public"."traveler_contacts" TO "app_att_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."traveler_contacts" TO "app_client_admin";
GRANT SELECT,INSERT ON TABLE "public"."traveler_contacts" TO "app_requester";



GRANT ALL ON TABLE "public"."travelers" TO "anon";
GRANT ALL ON TABLE "public"."travelers" TO "authenticated";
GRANT ALL ON TABLE "public"."travelers" TO "service_role";
GRANT ALL ON TABLE "public"."travelers" TO "app_att_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."travelers" TO "app_client_admin";
GRANT SELECT,INSERT ON TABLE "public"."travelers" TO "app_requester";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";
GRANT ALL ON TABLE "public"."users" TO "app_att_admin";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."users" TO "app_client_admin";
GRANT SELECT,INSERT ON TABLE "public"."users" TO "app_requester";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT USAGE ON SEQUENCES  TO "app_att_admin";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT USAGE ON SEQUENCES  TO "app_client_admin";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT USAGE ON SEQUENCES  TO "app_requester";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "app_att_admin";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES  TO "app_client_admin";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT ON TABLES  TO "app_requester";






RESET ALL;
