-- =====================================================================
-- TradeFlow – Kernschema (Sprint 2)
-- Tabellen: profiles, companies, company_memberships, company_jobs,
--           job_notes, customer_requests, request_attachments, audit_events
-- Grundsätze:
--   * Row Level Security (RLS) auf allen Tabellen.
--   * Kein Zugriff für "anon". Tabellenrechte explizit und so knapp wie möglich.
--   * Kundenanfragen und Firmenaufträge sind getrennt (ADR-006).
--   * Hilfsfunktionen im Schema "private" (nicht über die API erreichbar).
-- =====================================================================

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------- Aufzählungstypen ----------
create type public.account_type as enum ('kunde', 'betrieb');
create type public.company_role as enum ('inhaber', 'buero', 'mitarbeiter');
create type public.verification_status as enum ('unverifiziert', 'in_pruefung', 'verifiziert', 'abgelehnt');
create type public.job_status as enum ('neu', 'geplant', 'in_arbeit', 'erledigt', 'storniert');
create type public.request_status as enum (
  'entwurf', 'eingereicht', 'pruefung', 'sichtbar', 'angebote',
  'vergeben', 'in_arbeit', 'abgeschlossen', 'storniert'
);
create type public.urgency as enum ('dringend', 'in_2_wochen', 'in_4_wochen', 'flexibel');

-- ---------- Allgemeine Trigger-Funktionen ----------
create function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =====================================================================
-- profiles – 1:1 zu auth.users, wird beim Registrieren automatisch angelegt
-- =====================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  account_type public.account_type not null,
  display_name text not null check (char_length(display_name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_type public.account_type;
  v_name text;
begin
  v_type := case new.raw_user_meta_data ->> 'account_type'
              when 'betrieb' then 'betrieb'::public.account_type
              else 'kunde'::public.account_type
            end;
  v_name := left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 120);
  if v_name = '' then
    v_name := split_part(coalesce(new.email, 'Nutzer'), '@', 1);
  end if;
  insert into public.profiles (id, account_type, display_name) values (new.id, v_type, v_name);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- =====================================================================
-- companies + company_memberships
-- =====================================================================
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  postal_code text not null check (postal_code ~ '^[0-9]{5}$'),
  city text not null check (char_length(btrim(city)) between 2 and 80),
  country_code char(2) not null default 'DE',
  service_radius_km integer not null default 30 check (service_radius_km between 1 and 300),
  trade_ids text[] not null default '{}'
    check (cardinality(trade_ids) <= 40 and array_position(trade_ids, null) is null),
  verification_status public.verification_status not null default 'unverifiziert',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger companies_updated_at before update on public.companies
  for each row execute function private.set_updated_at();

create table public.company_memberships (
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.company_role not null,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);
create index company_memberships_user_idx on public.company_memberships (user_id);

-- ---------- Rechte-Hilfsfunktionen (security definer → keine RLS-Rekursion) ----------
create function private.company_role_of(p_company uuid) returns public.company_role
language sql stable security definer set search_path = '' as $$
  select m.role from public.company_memberships m
  where m.company_id = p_company and m.user_id = auth.uid()
$$;

create function private.is_company_member(p_company uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.company_memberships m
    where m.company_id = p_company and m.user_id = auth.uid()
  )
$$;

create function private.can_manage_jobs(p_company uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.company_role_of(p_company) in ('inhaber', 'buero'), false)
$$;

create function private.my_account_type() returns public.account_type
language sql stable security definer set search_path = '' as $$
  select p.account_type from public.profiles p where p.id = auth.uid()
$$;

grant execute on all functions in schema private to authenticated;

-- ---------- Firma anlegen: nur über diese Funktion (Firma + Inhaber-Mitgliedschaft atomar) ----------
create function public.create_company(
  p_name text,
  p_postal_code text,
  p_city text,
  p_service_radius_km integer,
  p_trade_ids text[]
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_company uuid;
begin
  if v_uid is null then
    raise exception 'Nicht angemeldet' using errcode = '42501';
  end if;
  if private.my_account_type() is distinct from 'betrieb' then
    raise exception 'Nur Betriebskonten können eine Firma anlegen' using errcode = '42501';
  end if;
  if exists (select 1 from public.company_memberships where user_id = v_uid) then
    raise exception 'Dieses Konto gehört bereits zu einer Firma' using errcode = '23505';
  end if;

  insert into public.companies (name, postal_code, city, service_radius_km, trade_ids, created_by)
  values (btrim(p_name), btrim(p_postal_code), btrim(p_city), p_service_radius_km,
          coalesce(p_trade_ids, '{}'), v_uid)
  returning id into v_company;

  insert into public.company_memberships (company_id, user_id, role)
  values (v_company, v_uid, 'inhaber');

  insert into public.audit_events (actor_id, company_id, entity_type, entity_id, action)
  values (v_uid, v_company, 'company', v_company, 'created');

  return v_company;
end;
$$;

-- =====================================================================
-- customer_requests – Anfragen von Auftraggebern (Marktplatz)
-- =====================================================================
create table public.customer_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Vom Formular erzeugte ID: verhindert doppelte Anfragen bei Doppelklick/Wiederholung.
  client_request_id uuid not null,
  category_id text not null check (category_id ~ '^[a-z_]{2,40}$'),
  title text not null check (char_length(btrim(title)) between 5 and 100),
  description text not null check (char_length(btrim(description)) between 20 and 2000),
  postal_code text not null check (postal_code ~ '^[0-9]{5}$'),
  city text not null check (char_length(btrim(city)) between 2 and 80),
  country_code char(2) not null default 'DE',
  urgency public.urgency not null,
  budget_eur integer check (budget_eur between 0 and 1000000),
  details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(details) = 'object' and pg_column_size(details) < 8000),
  status public.request_status not null default 'eingereicht',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, client_request_id)
);
create index customer_requests_customer_idx on public.customer_requests (customer_id, created_at desc);
create index customer_requests_region_idx on public.customer_requests (country_code, postal_code, status);
create trigger customer_requests_updated_at before update on public.customer_requests
  for each row execute function private.set_updated_at();

-- Missbrauchsschutz + erlaubte Änderungen durch Kunden
create function private.guard_customer_request() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_recent integer;
begin
  -- Systemprozesse (service_role / Admin) sind nicht eingeschränkt.
  if auth.role() is distinct from 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.customer_id is distinct from auth.uid() then
      raise exception 'Ungültiger Auftraggeber' using errcode = '42501';
    end if;
    if new.status <> 'eingereicht' then
      raise exception 'Neue Anfragen starten als eingereicht' using errcode = '42501';
    end if;
    select count(*) into v_recent from public.customer_requests
      where customer_id = new.customer_id and created_at > now() - interval '24 hours';
    if v_recent >= 10 then
      raise exception 'Zu viele Anfragen in 24 Stunden' using errcode = 'P0001', hint = 'rate_limit';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.customer_id <> old.customer_id or new.client_request_id <> old.client_request_id
     or new.created_at <> old.created_at or new.country_code <> old.country_code then
    raise exception 'Diese Felder dürfen nicht geändert werden' using errcode = '42501';
  end if;
  if new.status <> old.status then
    if new.status <> 'storniert'
       or old.status not in ('entwurf', 'eingereicht', 'pruefung', 'sichtbar', 'angebote') then
      raise exception 'Statuswechsel nicht erlaubt' using errcode = '42501';
    end if;
  end if;
  if (new.title, new.description, new.category_id, new.postal_code, new.city,
      new.urgency, new.budget_eur, new.details)
     is distinct from
     (old.title, old.description, old.category_id, old.postal_code, old.city,
      old.urgency, old.budget_eur, old.details)
     and old.status not in ('entwurf', 'eingereicht', 'pruefung') then
    raise exception 'Anfrage kann in diesem Status nicht mehr bearbeitet werden' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger customer_requests_guard before insert or update on public.customer_requests
  for each row execute function private.guard_customer_request();

-- =====================================================================
-- request_attachments – Metadaten privater Fotos (Datei liegt im Storage)
-- =====================================================================
create table public.request_attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.customer_requests (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_file_id uuid not null,
  storage_path text not null unique check (char_length(storage_path) <= 300),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now(),
  unique (request_id, client_file_id)
);
create index request_attachments_request_idx on public.request_attachments (request_id);

create function private.guard_request_attachment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() is distinct from 'authenticated' then
    return new;
  end if;
  if new.owner_id is distinct from auth.uid()
     or not exists (select 1 from public.customer_requests r
                    where r.id = new.request_id and r.customer_id = auth.uid()) then
    raise exception 'Keine Berechtigung für diese Anfrage' using errcode = '42501';
  end if;
  if new.storage_path not like (auth.uid()::text || '/' || new.request_id::text || '/%') then
    raise exception 'Ungültiger Speicherpfad' using errcode = '42501';
  end if;
  if (select count(*) from public.request_attachments a where a.request_id = new.request_id) >= 6 then
    raise exception 'Maximal 6 Fotos pro Anfrage' using errcode = 'P0001', hint = 'too_many_files';
  end if;
  return new;
end;
$$;
create trigger request_attachments_guard before insert on public.request_attachments
  for each row execute function private.guard_request_attachment();

-- =====================================================================
-- company_jobs – interne Aufträge eines Betriebs (nie automatisch öffentlich)
-- =====================================================================
create table public.company_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 120),
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 120),
  location text not null check (char_length(btrim(location)) between 2 and 120),
  category_id text not null check (category_id ~ '^[a-z_]{2,40}$'),
  status public.job_status not null default 'neu',
  scheduled_date date,
  scheduled_time time,
  source_request_id uuid references public.customer_requests (id) on delete set null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_time is null or scheduled_date is not null)
);
create index company_jobs_company_idx on public.company_jobs (company_id, status, scheduled_date);
create trigger company_jobs_updated_at before update on public.company_jobs
  for each row execute function private.set_updated_at();

create function private.guard_company_job() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() is distinct from 'authenticated' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    if new.source_request_id is not null then
      raise exception 'Verknüpfung mit Anfragen erst ab Vergabe-Funktion' using errcode = '42501';
    end if;
  elsif new.company_id <> old.company_id
     or new.created_by is distinct from old.created_by
     or new.source_request_id is distinct from old.source_request_id
     or new.created_at <> old.created_at then
    raise exception 'Diese Felder dürfen nicht geändert werden' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger company_jobs_guard before insert or update on public.company_jobs
  for each row execute function private.guard_company_job();

-- =====================================================================
-- job_notes – Notizen zu Firmenaufträgen (nur anhängen, nicht ändern)
-- =====================================================================
create table public.job_notes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.company_jobs (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  author_id uuid default auth.uid() references auth.users (id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index job_notes_job_idx on public.job_notes (job_id, created_at);

create function private.guard_job_note() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- company_id muss zur Firma des Auftrags passen (für RLS denormalisiert).
  select j.company_id into new.company_id from public.company_jobs j where j.id = new.job_id;
  if new.company_id is null then
    raise exception 'Auftrag nicht gefunden' using errcode = '23503';
  end if;
  if auth.role() = 'authenticated' then
    new.author_id := auth.uid();
  end if;
  return new;
end;
$$;
create trigger job_notes_guard before insert on public.job_notes
  for each row execute function private.guard_job_note();

-- =====================================================================
-- audit_events – Protokoll (nur lesbar, Schreiben nur über Trigger)
-- =====================================================================
create table public.audit_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  company_id uuid references public.companies (id) on delete cascade,
  customer_id uuid references auth.users (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  old_status text,
  new_status text
);
create index audit_events_company_idx on public.audit_events (company_id, occurred_at desc);
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id);

create function private.audit_job() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_events (actor_id, company_id, entity_type, entity_id, action, new_status)
    values (auth.uid(), new.company_id, 'company_job', new.id, 'created', new.status::text);
  elsif new.status <> old.status then
    insert into public.audit_events (actor_id, company_id, entity_type, entity_id, action, old_status, new_status)
    values (auth.uid(), new.company_id, 'company_job', new.id, 'status_changed', old.status::text, new.status::text);
  elsif row(new.*) is distinct from row(old.*) then
    insert into public.audit_events (actor_id, company_id, entity_type, entity_id, action)
    values (auth.uid(), new.company_id, 'company_job', new.id, 'updated');
  end if;
  return null;
end;
$$;
create trigger company_jobs_audit after insert or update on public.company_jobs
  for each row execute function private.audit_job();

create function private.audit_request() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_events (actor_id, customer_id, entity_type, entity_id, action, new_status)
    values (auth.uid(), new.customer_id, 'customer_request', new.id, 'created', new.status::text);
  elsif new.status <> old.status then
    insert into public.audit_events (actor_id, customer_id, entity_type, entity_id, action, old_status, new_status)
    values (auth.uid(), new.customer_id, 'customer_request', new.id, 'status_changed', old.status::text, new.status::text);
  end if;
  return null;
end;
$$;
create trigger customer_requests_audit after insert or update on public.customer_requests
  for each row execute function private.audit_request();

-- =====================================================================
-- Rechte: erst alles entziehen, dann gezielt erlauben
-- =====================================================================
revoke all on public.profiles, public.companies, public.company_memberships,
  public.customer_requests, public.request_attachments, public.company_jobs,
  public.job_notes, public.audit_events from anon, authenticated;
revoke execute on function public.create_company(text, text, text, integer, text[]) from public, anon;
grant execute on function public.create_company(text, text, text, integer, text[]) to authenticated;

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

grant select on public.companies to authenticated;
grant update (name, postal_code, city, service_radius_km, trade_ids) on public.companies to authenticated;

grant select on public.company_memberships to authenticated;

grant select, insert on public.customer_requests to authenticated;
grant update (title, description, category_id, postal_code, city, urgency, budget_eur, details, status)
  on public.customer_requests to authenticated;

grant select, insert on public.request_attachments to authenticated;

grant select, insert on public.company_jobs to authenticated;
grant update (title, customer_name, location, category_id, status, scheduled_date, scheduled_time)
  on public.company_jobs to authenticated;

grant select, insert on public.job_notes to authenticated;

grant select on public.audit_events to authenticated;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.customer_requests enable row level security;
alter table public.request_attachments enable row level security;
alter table public.company_jobs enable row level security;
alter table public.job_notes enable row level security;
alter table public.audit_events enable row level security;

-- profiles: nur das eigene Profil
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- companies: Mitglieder sehen, Inhaber ändern
create policy companies_select_member on public.companies for select to authenticated
  using (private.is_company_member(id));
create policy companies_update_owner on public.companies for update to authenticated
  using (private.company_role_of(id) = 'inhaber')
  with check (private.company_role_of(id) = 'inhaber');

-- memberships: Mitglieder sehen die Mitglieder der eigenen Firma
create policy memberships_select_member on public.company_memberships for select to authenticated
  using (private.is_company_member(company_id));

-- customer_requests: Auftraggeber sehen und ändern nur eigene Anfragen
create policy requests_select_own on public.customer_requests for select to authenticated
  using (customer_id = (select auth.uid()));
create policy requests_insert_own on public.customer_requests for insert to authenticated
  with check (customer_id = (select auth.uid()) and private.my_account_type() = 'kunde');
create policy requests_update_own on public.customer_requests for update to authenticated
  using (customer_id = (select auth.uid())) with check (customer_id = (select auth.uid()));

-- request_attachments: nur eigene
create policy attachments_select_own on public.request_attachments for select to authenticated
  using (owner_id = (select auth.uid()));
create policy attachments_insert_own on public.request_attachments for insert to authenticated
  with check (owner_id = (select auth.uid()));

-- company_jobs: Inhaber und Büro der eigenen Firma.
-- Ausführende Mitarbeiter sehen ab Sprint 3 nur zugewiesene Aufträge (job_assignments).
create policy jobs_select_manager on public.company_jobs for select to authenticated
  using (private.can_manage_jobs(company_id));
create policy jobs_insert_manager on public.company_jobs for insert to authenticated
  with check (private.can_manage_jobs(company_id));
create policy jobs_update_manager on public.company_jobs for update to authenticated
  using (private.can_manage_jobs(company_id)) with check (private.can_manage_jobs(company_id));

-- job_notes
create policy notes_select_manager on public.job_notes for select to authenticated
  using (private.can_manage_jobs(company_id));
create policy notes_insert_manager on public.job_notes for insert to authenticated
  with check (private.can_manage_jobs(company_id));

-- audit_events: Firmenmitglieder (Inhaber/Büro) für Firmendaten, Kunden für eigene Anfragen
create policy audit_select on public.audit_events for select to authenticated
  using (
    (company_id is not null and private.can_manage_jobs(company_id))
    or (customer_id is not null and customer_id = (select auth.uid()))
  );
