-- Fix shifts sequence
-- Run this in Supabase SQL Editor

-- Synchronize the shifts primary key sequence with current data.
SELECT setval(
  pg_get_serial_sequence('shifts', 'shift_id'),
  COALESCE((SELECT MAX(shift_id) FROM shifts), 0) + 1,
  false
);

-- Verify resolved sequence name.
SELECT pg_get_serial_sequence('shifts', 'shift_id') AS sequence_name;
