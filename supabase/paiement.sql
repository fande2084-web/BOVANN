-- =====================================================================
-- OCD Live — Phase 3 : paiement SIMULÉ (aucun agrégateur)
-- specs/reservation.json → booking.steps[5]
-- À exécuter APRÈS supabase/reservation.sql : SQL Editor → New query → coller → Run.
-- Rejouable sans perte.
--
-- Moyens : Orange Money, MTN Mobile Money, Moov Money, carte bancaire (Visa / Mastercard).
-- En mode « test » (app_settings.payment_mode) : le paiement est confirmé par la base
-- 3 secondes après la demande. Aucun argent, aucune donnée bancaire.
-- Pour tester un échec : un numéro qui se termine par 0000 est refusé.
-- =====================================================================

-- Réglages généraux (une ligne). payment_mode passera à « live » avec un agrégateur (phase 8).
create table if not exists public.app_settings (
  id               int primary key default 1 check (id = 1),
  payment_mode     text not null default 'test' check (payment_mode in ('test', 'live')),
  deferred_payment boolean not null default false,
  updated_at       timestamptz default now()
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

alter table public.app_settings enable row level security;
drop policy if exists "réglages lisibles" on public.app_settings;
create policy "réglages lisibles" on public.app_settings for select using (true);

-- Suivi du paiement sur la réservation
alter table public.bookings add column if not exists payment_phone      text;
alter table public.bookings add column if not exists payment_started_at timestamptz;
alter table public.bookings add column if not exists paid_at            timestamptz;
alter table public.bookings add column if not exists payment_attempts   int not null default 0;

do $$ begin
  alter table public.bookings add constraint bookings_payment_method_check
    check (payment_method is null or payment_method in ('orange_money', 'mtn', 'moov', 'card'));
exception when duplicate_object then null; end $$;

-- Lance (ou relance) un paiement sur une réservation dont les créneaux sont encore retenus
create or replace function public.start_payment(p_reference text, p_method text, p_phone text default null)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  b bookings;
begin
  select * into b from bookings where reference = upper(trim(p_reference)) for update;
  if not found then raise exception 'reservation_introuvable'; end if;
  if b.payment_status = 'paid' then
    return jsonb_build_object('payment_status', 'paid', 'status', b.status);
  end if;
  if b.status = 'annulée' then raise exception 'reservation_annulee'; end if;
  if p_method is null or p_method not in ('orange_money', 'mtn', 'moov', 'card') then raise exception 'moyen_invalide'; end if;
  if p_method <> 'card' and coalesce(p_phone, '') !~ '^\+[0-9]{8,15}$' then raise exception 'numero_invalide'; end if;
  if exists (select 1 from booking_sessions where booking_id = b.id and hold_until is not null and hold_until <= now()) then
    raise exception 'blocage_expire';
  end if;

  update bookings
     set payment_method     = p_method,
         payment_phone      = case when p_method = 'card' then null else p_phone end,
         payment_status     = 'pending',
         payment_started_at = now(),
         payment_attempts   = payment_attempts + 1
   where id = b.id;

  return jsonb_build_object('payment_status', 'pending', 'status', b.status);
end $$;

-- État du paiement. En mode test, fait office de « webhook » : confirme ou refuse
-- 3 secondes après la demande. En mode live, se contente de lire l'état.
create or replace function public.check_payment(p_reference text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  b      bookings;
  v_mode text;
begin
  select * into b from bookings where reference = upper(trim(p_reference)) for update;
  if not found then raise exception 'reservation_introuvable'; end if;
  select payment_mode into v_mode from app_settings where id = 1;

  if b.payment_status = 'pending'
     and b.payment_started_at is not null
     and coalesce(v_mode, 'test') = 'test'
     and now() >= b.payment_started_at + interval '3 seconds' then

    if exists (select 1 from booking_sessions where booking_id = b.id and hold_until is not null and hold_until <= now()) then
      update bookings set payment_status = 'failed' where id = b.id;
      return jsonb_build_object('payment_status', 'failed', 'status', b.status, 'reason', 'blocage_expire');
    elsif coalesce(b.payment_phone, '') like '%0000' then
      update bookings set payment_status = 'failed' where id = b.id;
      return jsonb_build_object('payment_status', 'failed', 'status', b.status, 'reason', 'refuse');
    else
      update bookings set payment_status = 'paid', status = 'confirmée', paid_at = now() where id = b.id;
      -- Créneaux payés : retenus définitivement (invisibles pour tout le monde)
      update booking_sessions set hold_until = null where booking_id = b.id;
      return jsonb_build_object('payment_status', 'paid', 'status', 'confirmée');
    end if;
  end if;

  return jsonb_build_object('payment_status', b.payment_status, 'status', b.status);
end $$;

-- Lecture par référence : ajoute la date de paiement et le mode (test / live)
create or replace function public.get_booking_by_reference(p_reference text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'reference', b.reference, 'mode', b.mode, 'category', b.category, 'category_detail', b.category_detail,
    'full_name', b.full_name, 'business_name', b.business_name, 'whatsapp', b.whatsapp,
    'country', b.country, 'address', b.address, 'amount_fcfa', b.amount_fcfa,
    'payment_method', b.payment_method, 'payment_status', b.payment_status, 'status', b.status,
    'created_at', b.created_at, 'paid_at', b.paid_at,
    'payment_mode', (select payment_mode from app_settings where id = 1),
    'package', jsonb_build_object('code', p.code, 'name', p.name, 'description', p.description, 'sessions', p.sessions),
    'sessions', coalesce((select jsonb_agg(jsonb_build_object('starts_at', s.starts_at, 'ends_at', s.ends_at) order by s.starts_at)
                          from booking_sessions s where s.booking_id = b.id), '[]'::jsonb)
  )
  from bookings b
  left join packages p on p.id = b.package_id
  where b.reference = upper(trim(p_reference));
$$;

grant execute on function public.start_payment(text, text, text) to anon, authenticated;
grant execute on function public.check_payment(text) to anon, authenticated;
grant execute on function public.get_booking_by_reference(text) to anon, authenticated;
