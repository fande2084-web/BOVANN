-- =====================================================================
-- OCD Live — Phase 1 : schéma de réservation (specs/reservation.json → database)
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller → Run.
-- Remplace l'ancienne table packages (supabase/schema.sql, supprimé).
-- Rejouable : relancer le script ne supprime ni les réservations ni les prix modifiés.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Packages : catalogue de la réservation (fait foi pour tout le site)
--    Les colonnes « detail », « price » et « position » sont générées pour
--    que la page d'accueil (lib/packages.ts) continue de fonctionner sans
--    modification : l'admin ne modifie que description, price_fcfa et sort.
-- ---------------------------------------------------------------------
-- Supprime seulement l'ANCIENNE table (format de l'accueil, sans colonne « code »)
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'packages')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'packages' and column_name = 'code') then
    drop table public.packages cascade;
  end if;
end $$;

create table if not exists public.packages (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  name         text not null,
  description  text,
  sessions     int  not null default 1 check (sessions between 1 and 31),
  price_fcfa   int  not null check (price_fcfa >= 0),
  perks        text[] default '{}',
  active       boolean default true,
  sort         int default 0,
  -- affichage sur l'accueil
  show_on_home boolean default false,
  highlight    boolean default false,
  badge        text,
  note         text,
  currency     text default 'FCFA',
  -- colonnes lues par l'accueil (générées, ne pas modifier)
  detail       text generated always as (description) stored,
  price        int  generated always as (price_fcfa) stored,
  position     int  generated always as (sort) stored,
  updated_at   timestamptz default now()
);

insert into public.packages (code, name, description, sessions, price_fcfa, perks, sort, show_on_home, highlight, badge, note) values
  ('essai',   'Essai',   '1 direct de 1 h 30',               1, 15000, '{"1 h 30 de direct sur House of Challenge"}', 1, true,  true,  'Le plus choisi', null),
  ('duo',     'Duo',     '2 directs de 1 h 30',              2, 28000, '{"2 directs aux dates que tu choisis","Le deuxième direct annoncé pendant le premier","Ton numéro et ton adresse annoncés à l''antenne"}', 2, true, false, null, '14 000 FCFA le direct'),
  ('pack4',   'Pack 4',  '4 directs de 1 h 30',              4, 52000, '{}', 3, false, false, null, '13 000 FCFA le direct'),
  ('annonce', 'Annonce', '1 direct de 1 h 30 avec annonce',  1, 45000, '{"Bovann publie ta vidéo sur son compte","Ton direct annoncé avant le passage","1 h 30 de direct sur House of Challenge"}', 4, true, false, null, 'Visibilité maximale'),
  ('mois',    'Le Mois', '8 directs de 1 h 30',              8, 95000, '{}', 5, false, false, null, '11 875 FCFA le direct')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- 2. Réglages des créneaux (une seule ligne, id = 1)
--    Heures de Lomé (Africa/Lome = GMT, sans heure d'été).
--    closed_weekdays : 1 = lundi … 7 = dimanche (ISO).
-- ---------------------------------------------------------------------
create table if not exists public.slots_config (
  id              int primary key default 1 check (id = 1),
  start_times     text[] default '{10:00,12:00,14:00,16:00,18:00}',
  duration_min    int default 90,
  closed_weekdays int[] default '{}',
  closed_dates    date[] default '{}',
  opening_date    date default '2026-12-01'
);
insert into public.slots_config (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. Réservations et créneaux réservés
-- ---------------------------------------------------------------------
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  reference       text unique not null,
  mode            text not null check (mode in ('presentiel','distance')),
  category        text not null,
  category_detail text,
  full_name       text not null,
  business_name   text not null,
  whatsapp        text not null,
  country         text not null,
  address         text,
  package_id      uuid references public.packages(id),
  amount_fcfa     int not null,
  payment_method  text,
  payment_status  text default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  status          text default 'en_attente_paiement' check (status in ('en_attente_paiement','confirmée','terminée','annulée','reportée')),
  created_at      timestamptz default now()
);

-- Un créneau = un seul direct (unique starts_at) : deux personnes ne peuvent
-- jamais réserver le même créneau.
create table if not exists public.booking_sessions (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid references public.bookings(id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  hold_until  timestamptz,           -- non nul tant que le paiement n'est pas confirmé
  unique (starts_at)
);
create index if not exists booking_sessions_booking_idx on public.booking_sessions (booking_id);

-- ---------------------------------------------------------------------
-- 4. Candidatures hôtesse (phase 7)
-- ---------------------------------------------------------------------
create table if not exists public.applications (
  id          uuid primary key default gen_random_uuid(),
  full_name   text,
  city        text,
  whatsapp    text,
  age         int,
  motivation  text,
  video_path  text,
  status      text default 'nouvelle' check (status in ('nouvelle','contactée','retenue','refusée')),
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 5. Sécurité (RLS partout)
--    Public : lit les packages actifs et les réglages de créneaux.
--    Réservations / créneaux / candidatures : aucune lecture publique ;
--    accès uniquement via les fonctions ci-dessous (et l'admin en phase 6).
-- ---------------------------------------------------------------------
alter table public.packages         enable row level security;
alter table public.slots_config     enable row level security;
alter table public.bookings         enable row level security;
alter table public.booking_sessions enable row level security;
alter table public.applications     enable row level security;

drop policy if exists "packages lisibles" on public.packages;
create policy "packages lisibles" on public.packages for select using (active);

drop policy if exists "réglages créneaux lisibles" on public.slots_config;
create policy "réglages créneaux lisibles" on public.slots_config for select using (true);

-- Mise à jour des prix en direct sur l'accueil
do $$ begin
  alter publication supabase_realtime add table public.packages;
exception when duplicate_object or undefined_object then null; end $$;

-- ---------------------------------------------------------------------
-- 6. Fonctions publiques (security definer : n'exposent que le strict nécessaire)
-- ---------------------------------------------------------------------

-- Créneaux occupés entre deux dates (payés, ou bloqués moins de 15 min)
create or replace function public.get_busy_slots(p_from timestamptz, p_to timestamptz)
returns setof timestamptz
language sql stable security definer set search_path = public as $$
  select bs.starts_at
  from booking_sessions bs
  join bookings b on b.id = bs.booking_id
  where bs.starts_at >= p_from and bs.starts_at < p_to
    and b.status <> 'annulée'
    and (bs.hold_until is null or bs.hold_until > now());
$$;

-- Référence OCD-JJMM-XXXX (date du premier direct, heure de Lomé ;
-- 4 lettres sans caractères ambigus : pas de O/0 ni I/1)
create or replace function public.generate_booking_reference(p_first timestamptz)
returns text
language plpgsql volatile security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  ref text;
begin
  loop
    ref := 'OCD-' || to_char(p_first at time zone 'Africa/Lome', 'DDMM') || '-';
    for i in 1..4 loop
      ref := ref || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from bookings where reference = ref);
  end loop;
  return ref;
end $$;

-- Création d'une réservation + blocage des créneaux, dans une seule transaction.
-- Revérifie tout côté serveur : package, nombre de créneaux, horaires valides,
-- jours fermés, date d'ouverture, créneaux libres.
create or replace function public.create_booking(p_booking jsonb, p_starts timestamptz[], p_hold_minutes int default 15)
returns table (booking_id uuid, reference text)
language plpgsql volatile security definer set search_path = public as $$
declare
  v_pkg   packages;
  v_cfg   slots_config;
  v_id    uuid;
  v_ref   text;
  v_start timestamptz;
  v_local timestamp;
begin
  select * into v_pkg from packages where code = p_booking->>'package_code' and active;
  if not found then raise exception 'package_inconnu'; end if;

  if coalesce(array_length(p_starts, 1), 0) <> v_pkg.sessions then
    raise exception 'nombre_creneaux';
  end if;
  if (select count(distinct s) from unnest(p_starts) s) <> v_pkg.sessions then
    raise exception 'creneaux_en_double';
  end if;

  select * into v_cfg from slots_config where id = 1;

  foreach v_start in array p_starts loop
    v_local := v_start at time zone 'Africa/Lome';
    if v_start <= now() then raise exception 'creneau_passe'; end if;
    if v_local::date < v_cfg.opening_date then raise exception 'avant_ouverture'; end if;
    if not (to_char(v_local, 'HH24:MI') = any (v_cfg.start_times)) then raise exception 'horaire_invalide'; end if;
    if extract(isodow from v_local)::int = any (v_cfg.closed_weekdays) then raise exception 'jour_ferme'; end if;
    if v_local::date = any (v_cfg.closed_dates) then raise exception 'jour_ferme'; end if;
  end loop;

  if coalesce(p_booking->>'mode', '') not in ('presentiel', 'distance') then raise exception 'mode_invalide'; end if;
  if coalesce(trim(p_booking->>'full_name'), '') = ''
     or coalesce(trim(p_booking->>'business_name'), '') = ''
     or coalesce(trim(p_booking->>'whatsapp'), '') = ''
     or coalesce(trim(p_booking->>'category'), '') = ''
     or coalesce(trim(p_booking->>'country'), '') = '' then
    raise exception 'champs_manquants';
  end if;

  -- Libère les blocages expirés et les créneaux de réservations annulées
  delete from booking_sessions bs
  using bookings b
  where bs.booking_id = b.id
    and bs.starts_at = any (p_starts)
    and (b.status = 'annulée' or (bs.hold_until is not null and bs.hold_until <= now()));

  v_ref := generate_booking_reference((select min(s) from unnest(p_starts) s));

  insert into bookings (reference, mode, category, category_detail, full_name, business_name,
                        whatsapp, country, address, package_id, amount_fcfa)
  values (v_ref, p_booking->>'mode', p_booking->>'category', nullif(p_booking->>'category_detail', ''),
          p_booking->>'full_name', p_booking->>'business_name', p_booking->>'whatsapp',
          p_booking->>'country', nullif(p_booking->>'address', ''), v_pkg.id, v_pkg.price_fcfa)
  returning id into v_id;

  begin
    insert into booking_sessions (booking_id, starts_at, ends_at, hold_until)
    select v_id, s, s + make_interval(mins => v_cfg.duration_min), now() + make_interval(mins => p_hold_minutes)
    from unnest(p_starts) s;
  exception when unique_violation then
    raise exception 'creneau_pris';
  end;

  return query select v_id, v_ref;
end $$;

-- Lecture d'une réservation par sa référence (page de confirmation, reçu)
create or replace function public.get_booking_by_reference(p_reference text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'reference', b.reference, 'mode', b.mode, 'category', b.category, 'category_detail', b.category_detail,
    'full_name', b.full_name, 'business_name', b.business_name, 'whatsapp', b.whatsapp,
    'country', b.country, 'address', b.address, 'amount_fcfa', b.amount_fcfa,
    'payment_method', b.payment_method, 'payment_status', b.payment_status, 'status', b.status,
    'created_at', b.created_at,
    'package', jsonb_build_object('code', p.code, 'name', p.name, 'description', p.description, 'sessions', p.sessions),
    'sessions', coalesce((select jsonb_agg(jsonb_build_object('starts_at', s.starts_at, 'ends_at', s.ends_at) order by s.starts_at)
                          from booking_sessions s where s.booking_id = b.id), '[]'::jsonb)
  )
  from bookings b
  left join packages p on p.id = b.package_id
  where b.reference = upper(trim(p_reference));
$$;

revoke all on function public.generate_booking_reference(timestamptz) from public, anon, authenticated;
grant execute on function public.get_busy_slots(timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.create_booking(jsonb, timestamptz[], int) to anon, authenticated;
grant execute on function public.get_booking_by_reference(text) to anon, authenticated;
