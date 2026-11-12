-- =====================================================================
--  v127 · PROGRAMA DE TECNOVIGILANCIA (independiente por entidad)
--  1) eventos: datos completos del formato FT-PGTV-016 / RETEIM-002 y la
--     clasificación (EA serio, IA serio, EA no serio, IA no serio).
--  2) tv_registros: plan semestral de capacitación, sesiones, pre y post
--     test, listas de asistencia, reportes trimestrales (incluido "en cero")
--     y datos de indicadores (pacientes atendidos por trimestre).
--  · Propietario (IBCOL): crea, corrige y borra.
--  · Usuario de la entidad: solo ve lo de su entidad.
--  Ejecutar una vez en Supabase > SQL Editor (se puede volver a ejecutar).
-- =====================================================================
alter table public.eventos add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.eventos add column if not exists clasificacion text;

create table if not exists public.tv_registros (
  id uuid primary key default gen_random_uuid(),
  entidad_id uuid not null references public.entidades(id) on delete cascade,
  tipo text not null,            -- plan | sesion | test | trimestral | indicadores
  anio int,
  periodo text,                  -- S1 / S2 / T1..T4
  fecha date,
  datos jsonb not null default '{}'::jsonb,
  archivo text,
  creado_por uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tv_registros_ent_tipo on public.tv_registros (entidad_id, tipo, anio);
alter table public.tv_registros enable row level security;

drop policy if exists p_escribir on public.tv_registros;
create policy p_escribir on public.tv_registros for all to authenticated using (es_propietario()) with check (es_propietario());
drop policy if exists p_leer on public.tv_registros;
create policy p_leer on public.tv_registros for select to authenticated using (entidad_id is not null and entidad_id = mi_entidad());

drop trigger if exists trg_audit on public.tv_registros;
create trigger trg_audit after insert or delete or update on public.tv_registros for each row execute function fn_auditoria();
drop trigger if exists trg_upd on public.tv_registros;
create trigger trg_upd before update on public.tv_registros for each row execute function fn_updated_at();

select 'programa de tecnovigilancia listo' as resultado;
