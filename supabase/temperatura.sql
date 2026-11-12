-- =====================================================================
--  v136 · REGISTRO DE TEMPERATURA Y HUMEDAD (ambiente, refrigeración y
--  congelación) + REPORTE DE EVENTOS DESDE EL PORTAL DE CALIDAD
--  · temp_humedad: una fila por lectura (punto de control, fecha, turno,
--    temperatura / humedad, responsable, acción si estuvo fuera de rango).
--  · Propietario (IBCOL): crea, corrige y borra.
--  · Usuario de la entidad y usuario de calidad (de su sede): ven y AGREGAN
--    lecturas; no pueden modificar ni borrar.
--  · eventos: el usuario de calidad puede reportar eventos / incidentes
--    adversos (FT-PGTV-016) y ver los de su entidad.
--  Ejecutar una vez en Supabase > SQL Editor (se puede volver a ejecutar).
-- =====================================================================
create table if not exists public.temp_humedad (
  id uuid primary key default gen_random_uuid(),
  entidad_id uuid not null references public.entidades(id) on delete cascade,
  sede text,
  punto text not null,
  fecha date not null,
  turno text not null default 'M',
  datos jsonb not null default '{}'::jsonb,
  creado_por uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists temp_humedad_ent_punto_fecha on public.temp_humedad (entidad_id, punto, fecha);
alter table public.temp_humedad enable row level security;

drop policy if exists p_escribir on public.temp_humedad;
create policy p_escribir on public.temp_humedad for all to authenticated using (es_propietario()) with check (es_propietario());
drop policy if exists p_leer on public.temp_humedad;
create policy p_leer on public.temp_humedad for select to authenticated using (entidad_id is not null and entidad_id = mi_entidad());
drop policy if exists p_cliente_crear on public.temp_humedad;
create policy p_cliente_crear on public.temp_humedad for insert to authenticated with check (entidad_id is not null and entidad_id = mi_entidad());
drop policy if exists p_calidad_leer on public.temp_humedad;
create policy p_calidad_leer on public.temp_humedad for select to authenticated using (entidad_id = mi_entidad_calidad() and (mi_sede_calidad() is null or coalesce(nullif(trim(sede), ''), 'Sede principal') = mi_sede_calidad()));
drop policy if exists p_calidad_crear on public.temp_humedad;
create policy p_calidad_crear on public.temp_humedad for insert to authenticated with check (entidad_id = mi_entidad_calidad() and (mi_sede_calidad() is null or coalesce(nullif(trim(sede), ''), 'Sede principal') = mi_sede_calidad()));

drop trigger if exists trg_audit on public.temp_humedad;
create trigger trg_audit after insert or delete or update on public.temp_humedad for each row execute function fn_auditoria();
drop trigger if exists trg_upd on public.temp_humedad;
create trigger trg_upd before update on public.temp_humedad for each row execute function fn_updated_at();

-- eventos / incidentes adversos reportados por el usuario de calidad
drop policy if exists p_calidad_leer on public.eventos;
create policy p_calidad_leer on public.eventos for select to authenticated using (entidad_id = mi_entidad_calidad());
drop policy if exists p_calidad_crear on public.eventos;
create policy p_calidad_crear on public.eventos for insert to authenticated with check (entidad_id = mi_entidad_calidad());

select 'temperatura y humedad listo' as resultado;
