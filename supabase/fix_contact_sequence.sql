-- Fix contact sequence
-- Run this in Supabase SQL Editor

-- Reset the sequence to start from 1 and set it to the max existing ID + 1
SELECT setval('contact_contact_id_seq', COALESCE((SELECT MAX(contact_id) FROM contact), 0) + 1, false);

-- Verify the sequence
SELECT last_value FROM contact_contact_id_seq;