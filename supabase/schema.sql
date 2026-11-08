-- OCD Live — table des packages (lue par la page d'accueil : lib/packages.ts)
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller → Run.

create table if not exists public.packages (
  id           bigint generated always as identity primary key,
  name         text    not null,
  detail       text    not null,
  price        integer not null,               -- en FCFA, sans espace (15000)
  currency     text    default 'FCFA',
  highlight    boolean default false,          -- carte mise en avant (fond noir, prix orange)
  badge        text,                           -- ex. « Le plus choisi »
  note         text,                           -- ex. « 8 750 FCFA / heure »
  position     integer default 0,              -- ordre d'affichage
  show_on_home boolean default false,          -- les 3 premiers affichés sur l'accueil
  updated_at   timestamptz default now()
);

-- Lecture publique (clé « anon »), aucune écriture depuis le site
alter table public.packages enable row level security;
drop policy if exists "Lecture publique des packages" on public.packages;
create policy "Lecture publique des packages" on public.packages for select using (true);

-- Mise à jour des prix en direct sur la page (chiffres qui défilent)
alter publication supabase_realtime add table public.packages;

-- Les 3 packages de specs/accueil.json (les 3 autres sont à ajouter par l'admin)
insert into public.packages (name, detail, price, highlight, badge, note, position, show_on_home) values
  ('Standard',     '1 live de 1 h 30',                          15000, true,  'Le plus choisi', null,                 1, true),
  ('Long',         '1 live de 4 h',                             35000, false, null,             '8 750 FCFA / heure', 2, true),
  ('Annonce BOVA', '1 h 30 + vidéo d''annonce publiée par BOVA', 25000, false, null,             'Visibilité maximale', 3, true);
