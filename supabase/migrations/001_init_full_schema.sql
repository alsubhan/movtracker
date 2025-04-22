

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


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_profiles_rls_policy"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Enable RLS on profiles table if not already enabled
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Allow users to view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Allow all users to view profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Allow all users to insert profiles" ON public.profiles;

  -- Create policies for the profiles table
  CREATE POLICY "Allow admins to manage all profiles" 
    ON public.profiles 
    USING (public.is_admin());
    
  CREATE POLICY "Allow users to view own profile" 
    ON public.profiles 
    FOR SELECT 
    USING (auth.uid() = id);
    
  CREATE POLICY "Allow users to update own profile" 
    ON public.profiles 
    FOR UPDATE 
    USING (auth.uid() = id);
    
  -- Allow all authenticated users to view profiles (needed for UI functionality)
  CREATE POLICY "Allow all users to view profiles" 
    ON public.profiles 
    FOR SELECT 
    TO authenticated 
    USING (true);
    
  -- Allow all authenticated users to insert profiles
  CREATE POLICY "Allow all users to insert profiles" 
    ON public.profiles 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);
END;
$$;


ALTER FUNCTION "public"."create_profiles_rls_policy"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    'user'
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_customer_locations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."update_customer_locations_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."customer_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "location_id" "text" NOT NULL,
    "location_name" "text" NOT NULL,
    "rental_rates" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."customer_locations" REPLICA IDENTITY FULL;


ALTER TABLE "public"."customer_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "contact_person" "text",
    "phone" "text",
    "email" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gate_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "location_id" "uuid"
);

ALTER TABLE ONLY "public"."gate_types" REPLICA IDENTITY FULL;


ALTER TABLE "public"."gate_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "gate_location" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "gate_type_id" "uuid" NOT NULL,
    "location_id" "uuid"
);

ALTER TABLE ONLY "public"."gates" REPLICA IDENTITY FULL;


ALTER TABLE "public"."gates" OWNER TO "postgres";


COMMENT ON COLUMN "public"."gates"."gate_type_id" IS 'Reference to the gate type that defines this gate''s purpose';



CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rfid_tag" "text" NOT NULL,
    "code" "text" NOT NULL,
    "project" "text" NOT NULL,
    "partition" "text" NOT NULL,
    "serial_number" "text" NOT NULL,
    "status" "text" DEFAULT 'in-stock'::"text" NOT NULL,
    "last_scan_time" timestamp with time zone DEFAULT "now"(),
    "last_scan_gate" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "type_id" "uuid",
    "location_id" "uuid",
    CONSTRAINT "status_check" CHECK (("status" = ANY (ARRAY['In-Stock'::"text", 'In-Transit'::"text", 'Received'::"text", 'Returned'::"text"])))
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inventory_id" "uuid" NOT NULL,
    "gate_id" "text",
    "movement_type" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recorded_by" "uuid" NOT NULL,
    "customer_location_id" "uuid",
    "previous_location_id" "uuid",
    "remark" "text",
    "reference_id" "uuid",
    CONSTRAINT "bin_movements_movement_type_check" CHECK (("movement_type" = ANY (ARRAY['in'::"text", 'out'::"text"])))
);


ALTER TABLE "public"."inventory_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "movement_type" "text" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "notes" "text",
    "rental_rate" numeric(10,2),
    "rental_start_date" timestamp with time zone,
    "rental_end_date" timestamp with time zone,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movements_movement_type_check" CHECK (("movement_type" = ANY (ARRAY['IN'::"text", 'OUT'::"text"])))
);


ALTER TABLE "public"."movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "password" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "customer_location_id" "uuid"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."customer_location_id" IS 'Reference to the customer location that this user is assigned to';



CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_name" "text",
    "company_code" "text",
    "base_customer_id" "text",
    "base_location_id" "text",
    "default_code_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "address" "text",
    "phone" "text",
    "email" "text",
    "website" "text",
    "tax_id" "text",
    "header_text" "text",
    "footer_text" "text"
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "bin_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "bins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "bins_rfid_tag_key" UNIQUE ("rfid_tag");



ALTER TABLE ONLY "public"."customer_locations"
    ADD CONSTRAINT "customer_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gate_types"
    ADD CONSTRAINT "gate_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gates"
    ADD CONSTRAINT "gates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_types"
    ADD CONSTRAINT "inventory_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."movements"
    ADD CONSTRAINT "movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_gate_types_location_id" ON "public"."gate_types" USING "btree" ("location_id");



CREATE INDEX "idx_gates_gate_type_id" ON "public"."gates" USING "btree" ("gate_type_id");



CREATE INDEX "idx_inventory_movements_reference_id" ON "public"."inventory_movements" USING "btree" ("reference_id");



CREATE INDEX "idx_movements_customer" ON "public"."movements" USING "btree" ("customer_id");



CREATE INDEX "idx_movements_location" ON "public"."movements" USING "btree" ("location_id");



CREATE INDEX "idx_profiles_customer_location" ON "public"."profiles" USING "btree" ("customer_location_id");



CREATE OR REPLACE TRIGGER "update_customer_locations_updated_at" BEFORE UPDATE ON "public"."customer_locations" FOR EACH ROW EXECUTE FUNCTION "public"."update_customer_locations_updated_at"();



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "bins_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."customer_locations"
    ADD CONSTRAINT "customer_locations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gate_types"
    ADD CONSTRAINT "fk_location_id" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "fk_profiles_customer_location" FOREIGN KEY ("customer_location_id") REFERENCES "public"."customer_locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."gates"
    ADD CONSTRAINT "gates_gate_type_id_fkey" FOREIGN KEY ("gate_type_id") REFERENCES "public"."gate_types"("id");



ALTER TABLE ONLY "public"."gates"
    ADD CONSTRAINT "gates_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_location_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_customer_location_id_fkey" FOREIGN KEY ("customer_location_id") REFERENCES "public"."customer_locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_previous_location_id_fkey" FOREIGN KEY ("previous_location_id") REFERENCES "public"."customer_locations"("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_type_fk" FOREIGN KEY ("type_id") REFERENCES "public"."inventory_types"("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "public"."inventory_types"("id");



ALTER TABLE ONLY "public"."movements"
    ADD CONSTRAINT "movements_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."movements"
    ADD CONSTRAINT "movements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_customer_location_id_fkey" FOREIGN KEY ("customer_location_id") REFERENCES "public"."customer_locations"("id");



CREATE POLICY "Allow admins to manage all profiles" ON "public"."profiles" USING ("public"."is_admin"());



CREATE POLICY "Allow all users to insert profiles" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow all users to view profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow users to update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Allow users to view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Customer locations are viewable by authenticated users." ON "public"."customer_locations" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Customer locations can be deleted by authenticated users." ON "public"."customer_locations" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Customer locations can be inserted by authenticated users." ON "public"."customer_locations" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Customer locations can be updated by authenticated users." ON "public"."customer_locations" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Everyone can view bin movements" ON "public"."inventory_movements" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Everyone can view bins" ON "public"."inventory" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can insert bin movements" ON "public"."inventory_movements" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can insert bins" ON "public"."inventory" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can update bins" ON "public"."inventory" FOR UPDATE TO "authenticated" USING (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_admin_all" ON "public"."profiles" USING (("current_setting"('request.jwt.claim.role'::"text", true) = 'admin'::"text")) WITH CHECK (("current_setting"('request.jwt.claim.role'::"text", true) = 'admin'::"text"));



CREATE POLICY "profiles_user_insert" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_user_select" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_user_update" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."customer_locations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."gate_types";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."gates";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."inventory";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."inventory_movements";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."create_profiles_rls_policy"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profiles_rls_policy"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profiles_rls_policy"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_customer_locations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_customer_locations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_customer_locations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."customer_locations" TO "anon";
GRANT ALL ON TABLE "public"."customer_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_locations" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."gate_types" TO "anon";
GRANT ALL ON TABLE "public"."gate_types" TO "authenticated";
GRANT ALL ON TABLE "public"."gate_types" TO "service_role";



GRANT ALL ON TABLE "public"."gates" TO "anon";
GRANT ALL ON TABLE "public"."gates" TO "authenticated";
GRANT ALL ON TABLE "public"."gates" TO "service_role";



GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_movements" TO "anon";
GRANT ALL ON TABLE "public"."inventory_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_movements" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_types" TO "anon";
GRANT ALL ON TABLE "public"."inventory_types" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_types" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."movements" TO "anon";
GRANT ALL ON TABLE "public"."movements" TO "authenticated";
GRANT ALL ON TABLE "public"."movements" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
