-- Fix locations sequence
-- Run this in Supabase SQL Editor

-- Synchronize the locations primary key sequence with current data.
SELECT setval(
  pg_get_serial_sequence('locations', 'location_id'),
  COALESCE((SELECT MAX(location_id) FROM locations), 0) + 1,
  false
);

-- Verify resolved sequence name.
SELECT pg_get_serial_sequence('locations', 'location_id') AS sequence_name;
