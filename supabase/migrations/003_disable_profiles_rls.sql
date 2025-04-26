-- Migration 003: Disable RLS on profiles and drop auto-policy function

-- Disable row-level security on profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Remove the automatic RLS policy function so it won't recreate policies
DROP FUNCTION IF EXISTS public.create_profiles_rls_policy();
