-- =====================================================================
--  COMITÉS: actas de reunión (formato FAR-013). Ejecutar una vez en
--  Supabase > SQL Editor. Mismas reglas que el resto de tablas:
--  el propietario crea y modifica; el cliente solo ve las de su entidad.
-- =====================================================================
create table if not exists public.actas_comite (
  id uuid primary key default gen_random_uuid(),
  entidad_id uuid not null references public.entidades(id) on delete cascade,
  numero text,
  fecha date,
  tema text,
  datos jsonb not null default '{}'::jsonb,
  documento_id uuid,
  archivo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists actas_comite_entidad on public.actas_comite (entidad_id, fecha desc);
alter table public.actas_comite enable row level security;
drop policy if exists p_escribir on public.actas_comite;
create policy p_escribir on public.actas_comite for all to authenticated using (es_propietario()) with check (es_propietario());
drop policy if exists p_leer on public.actas_comite;
create policy p_leer on public.actas_comite for select to authenticated using ((entidad_id is not null) and (entidad_id = mi_entidad()));
drop trigger if exists trg_audit on public.actas_comite;
create trigger trg_audit after insert or delete or update on public.actas_comite for each row execute function fn_auditoria();
drop trigger if exists trg_upd on public.actas_comite;
create trigger trg_upd before update on public.actas_comite for each row execute function fn_updated_at();
select 'actas_comite lista' as resultado;
