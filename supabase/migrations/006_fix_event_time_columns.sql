alter table if exists public.events
  alter column start_time type timestamp without time zone
  using start_time at time zone 'Europe/Copenhagen';

alter table if exists public.events
  alter column end_time type timestamp without time zone
  using end_time at time zone 'Europe/Copenhagen';

alter table if exists public.event_locations
  alter column start_time type timestamp without time zone
  using start_time at time zone 'Europe/Copenhagen';

alter table if exists public.event_locations
  alter column end_time type timestamp without time zone
  using end_time at time zone 'Europe/Copenhagen';

alter table if exists public.events
  alter column date type date
  using coalesce(date::date, start_time::date);

alter table if exists public.event_locations
  alter column date type date
  using coalesce(date::date, start_time::date);