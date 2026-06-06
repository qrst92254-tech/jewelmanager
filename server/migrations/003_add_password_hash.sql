-- Migration: add password_hash column to users table for direct auth
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text;

-- Also add a unique index on email for login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
