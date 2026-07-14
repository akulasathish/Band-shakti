-- Migration: Add event_id column to gallery_assets to link assets to events
ALTER TABLE public.gallery_assets ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
