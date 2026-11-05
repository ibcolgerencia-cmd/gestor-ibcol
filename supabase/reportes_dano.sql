-- =====================================================================
--  REPORTES DE DAÑO DE EQUIPOS BIOMÉDICOS (trazabilidad)
--  El usuario de la entidad crea y ve los reportes de su entidad;
--  solo el propietario (IBCOL) los cambia de estado o los lleva al equipo.
--  Ejecutar una vez en Supabase > SQL Editor.
-- =====================================================================
create table if not exists public.reportes_dano (
  id uuid primary key default gen_random_uuid(),
  numero text,
  entidad_id uuid not null references public.entidades(id) on delete cascade,
  consultorio_id uuid references public.consultorios(id) on delete set null,
  equipo_id uuid references public.equipos(id) on delete set null,
  sede text,
  nombre text not null,
  celular text not null,
  descripcion text not null,
  fuera_servicio boolean not null default false,
  estado text not null default 'Nuevo',
  documento_id uuid references public.documentos(id) on delete set null,
  datos jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ix_reportes_dano_ent on public.reportes_dano(entidad_id, created_at desc);
alter table public.reportes_dano enable row level security;
drop policy if exists p_escribir on public.reportes_dano;
create policy p_escribir on public.reportes_dano for all to authenticated using (es_propietario()) with check (es_propietario());
drop policy if exists p_leer on public.reportes_dano;
create policy p_leer on public.reportes_dano for select to authenticated using ((entidad_id is not null) and (entidad_id = mi_entidad()));
drop policy if exists p_cliente_crear on public.reportes_dano;
create policy p_cliente_crear on public.reportes_dano for insert to authenticated with check ((entidad_id is not null) and (entidad_id = mi_entidad()) and estado = 'Nuevo');
drop trigger if exists trg_audit on public.reportes_dano;
create trigger trg_audit after insert or delete or update on public.reportes_dano for each row execute function fn_auditoria();
drop trigger if exists trg_upd on public.reportes_dano;
create trigger trg_upd before update on public.reportes_dano for each row execute function fn_updated_at();
notify pgrst, 'reload schema';
select 'reportes_dano lista' as resultado;
