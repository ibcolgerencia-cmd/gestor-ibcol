-- =====================================================================
--  v179 · CONTROL DE ESTERILIZACIÓN (bitácora de cargas CE-FO-02)
--  Cada fila es una carga o prueba del esterilizador (equipo, carga, ciclo,
--  indicadores con fotos, liberación de la carga, responsable).
--  · Propietario (IBCOL): crea, corrige y borra.
--  · Usuario de la entidad: ve y AGREGA registros de su entidad.
--  · Usuario de calidad / auxiliar: ve y AGREGA registros de su entidad y sede.
--    Ninguno de los dos puede modificar ni borrar.
--  Ejecutar una vez en Supabase > SQL Editor (se puede volver a ejecutar).
-- =====================================================================
create table if not exists public.control_esterilizacion (
  id uuid primary key default gen_random_uuid(),
  entidad_id uuid not null references public.entidades(id) on delete cascade,
  sede text,
  fecha date not null,
  datos jsonb not null default '{}'::jsonb,
  creado_por uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists control_esterilizacion_ent_fecha on public.control_esterilizacion (entidad_id, fecha);
alter table public.control_esterilizacion enable row level security;

drop policy if exists p_escribir on public.control_esterilizacion;
create policy p_escribir on public.control_esterilizacion for all to authenticated using (es_propietario()) with check (es_propietario());
drop policy if exists p_leer on public.control_esterilizacion;
create policy p_leer on public.control_esterilizacion for select to authenticated using (entidad_id is not null and entidad_id = mi_entidad());
drop policy if exists p_cliente_crear on public.control_esterilizacion;
create policy p_cliente_crear on public.control_esterilizacion for insert to authenticated with check (entidad_id is not null and entidad_id = mi_entidad());
drop policy if exists p_calidad_leer on public.control_esterilizacion;
create policy p_calidad_leer on public.control_esterilizacion for select to authenticated using (entidad_id = mi_entidad_calidad() and (mi_sede_calidad() is null or coalesce(nullif(trim(sede), ''), 'Sede principal') = mi_sede_calidad()));
drop policy if exists p_calidad_crear on public.control_esterilizacion;
create policy p_calidad_crear on public.control_esterilizacion for insert to authenticated with check (entidad_id = mi_entidad_calidad() and (mi_sede_calidad() is null or coalesce(nullif(trim(sede), ''), 'Sede principal') = mi_sede_calidad()));

drop trigger if exists trg_audit on public.control_esterilizacion;
create trigger trg_audit after insert or delete or update on public.control_esterilizacion for each row execute function fn_auditoria();
drop trigger if exists trg_upd on public.control_esterilizacion;
create trigger trg_upd before update on public.control_esterilizacion for each row execute function fn_updated_at();

select 'control de esterilización listo' as resultado;
