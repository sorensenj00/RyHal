-- Baseline RLS policies and lookup seed rows.

create or replace function public.current_employee_id()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
    select employee_id
    from public.employees
    where supabase_user_id = auth.uid()
    limit 1
$$;

create or replace function public.current_app_access()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select app_access
    from public.employees
    where supabase_user_id = auth.uid()
    limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(public.current_app_access() = 'admin', false)
$$;

alter table public.employees enable row level security;
alter table public.roles enable row level security;
alter table public.employee_roles enable row level security;
alter table public.qualifications enable row level security;
alter table public.employee_qualifications enable row level security;
alter table public.shift_categories enable row level security;
alter table public.locations enable row level security;
alter table public.shifts enable row level security;
alter table public.association enable row level security;
alter table public.event_series enable row level security;
alter table public.events enable row level security;
alter table public.event_locations enable row level security;
alter table public.contact enable row level security;
alter table public.association_contact enable row level security;
alter table public.event_contact enable row level security;
alter table public.swap_status enable row level security;
alter table public.swap_requests enable row level security;

do $$
declare
    table_name text;
begin
    foreach table_name in array array[
        'employees', 'roles', 'employee_roles', 'qualifications', 'employee_qualifications',
        'shift_categories', 'locations', 'shifts', 'association', 'event_series', 'events',
        'event_locations', 'contact', 'association_contact', 'event_contact', 'swap_status'
    ]
    loop
        execute format('drop policy if exists "authenticated can read %1$s" on public.%1$I', table_name);
        execute format('create policy "authenticated can read %1$s" on public.%1$I for select to authenticated using (true)', table_name);

        execute format('drop policy if exists "admins can write %1$s" on public.%1$I', table_name);
        execute format('create policy "admins can write %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', table_name);
    end loop;
end $$;

drop policy if exists "employees can read own row" on public.employees;
create policy "employees can read own row"
on public.employees for select to authenticated
using (supabase_user_id = auth.uid());

drop policy if exists "employees can create own swap requests" on public.swap_requests;
create policy "employees can create own swap requests"
on public.swap_requests for insert to authenticated
with check (requester_id = public.current_employee_id());

drop policy if exists "employees can update targeted swap requests" on public.swap_requests;
create policy "employees can update targeted swap requests"
on public.swap_requests for update to authenticated
using (target_employee_id = public.current_employee_id() or requester_id = public.current_employee_id())
with check (target_employee_id = public.current_employee_id() or requester_id = public.current_employee_id());

insert into public.shift_categories (name, color) values
    ('Administration', '#64748b'),
    ('Rengoring', '#22c55e'),
    ('Andet', '#94a3b8')
on conflict (name) do nothing;

insert into public.roles (name, color) values
    ('Admin', '--color-andet'),
    ('Medarbejder', '--color-andet')
on conflict (name) do nothing;

insert into public.swap_status (name) values
    ('Pending'),
    ('AwaitingApproval'),
    ('Completed'),
    ('Rejected'),
    ('Invalid')
on conflict (name) do nothing;
