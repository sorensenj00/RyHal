-- Ensure association_id uses a sequence and is synchronized with existing rows
do $$
declare
    association_seq text;
begin
    association_seq := pg_get_serial_sequence('public.association', 'association_id');

    if association_seq is null then
        if not exists (
            select 1
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where c.relkind = 'S'
              and c.relname = 'association_association_id_seq'
              and n.nspname = 'public'
        ) then
            execute 'create sequence public.association_association_id_seq';
        end if;

        execute 'alter sequence public.association_association_id_seq owned by public.association.association_id';
        execute 'alter table public.association alter column association_id set default nextval(''public.association_association_id_seq'')';
        association_seq := 'public.association_association_id_seq';
    end if;

    execute format(
        'select setval(%L, coalesce((select max(association_id) from public.association), 0) + 1, false)',
        association_seq
    );
end $$;

-- Ensure contact_id uses a sequence and is synchronized with existing rows
do $$
declare
    contact_seq text;
begin
    contact_seq := pg_get_serial_sequence('public.contact', 'contact_id');

    if contact_seq is null then
        if not exists (
            select 1
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where c.relkind = 'S'
              and c.relname = 'contact_contact_id_seq'
              and n.nspname = 'public'
        ) then
            execute 'create sequence public.contact_contact_id_seq';
        end if;

        execute 'alter sequence public.contact_contact_id_seq owned by public.contact.contact_id';
        execute 'alter table public.contact alter column contact_id set default nextval(''public.contact_contact_id_seq'')';
        contact_seq := 'public.contact_contact_id_seq';
    end if;

    execute format(
        'select setval(%L, coalesce((select max(contact_id) from public.contact), 0) + 1, false)',
        contact_seq
    );
end $$;
