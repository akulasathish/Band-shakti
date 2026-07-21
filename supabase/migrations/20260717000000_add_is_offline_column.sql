-- Migration: Add is_offline column to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS is_offline BOOLEAN DEFAULT false;
