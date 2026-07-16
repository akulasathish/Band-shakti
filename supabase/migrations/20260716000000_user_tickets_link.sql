-- Migration: Add user_id referencing auth.users to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create an index to optimize user profile lookups
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
