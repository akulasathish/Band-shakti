-- Migration: Add scanned_pax column to track partial check-ins
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS scanned_pax INTEGER DEFAULT 0;
UPDATE tickets SET scanned_pax = pax WHERE scanned = true;
