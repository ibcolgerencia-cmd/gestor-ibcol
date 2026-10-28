-- =====================================================================
--  LISTA DE CHEQUEO DE LIMPIEZA Y DESINFECCIÓN (FMB-006): planilla mensual
--  por servicio. El usuario de la entidad SÍ puede crear y marcar las de
--  su propia entidad (es la única tabla que el cliente puede escribir).
--  Ejecutar una vez en Supabase > SQL Editor.
-- =====================================================================
create table if not exists public.listas_limpieza (
  id uuid primary key default gen_random_uuid(),
  entidad_id uuid not null references public.entidades(id) on delete cascade,
  consultorio_id uuid references public.consultorios(id) on delete cascade,
  anio int not null,
  mes int not null check (mes between 1 and 12),
  datos jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entidad_id, consultorio_id, anio, mes)
);
alter table public.listas_limpieza enable row level security;
drop policy if exists p_escribir on public.listas_limpieza;
create policy p_escribir on public.listas_limpieza for all to authenticated using (es_propietario()) with check (es_propietario());
drop policy if exists p_leer on public.listas_limpieza;
create policy p_leer on public.listas_limpieza for select to authenticated using ((entidad_id is not null) and (entidad_id = mi_entidad()));
drop policy if exists p_cliente_crear on public.listas_limpieza;
create policy p_cliente_crear on public.listas_limpieza for insert to authenticated with check ((entidad_id is not null) and (entidad_id = mi_entidad()));
drop policy if exists p_cliente_marcar on public.listas_limpieza;
create policy p_cliente_marcar on public.listas_limpieza for update to authenticated using ((entidad_id is not null) and (entidad_id = mi_entidad())) with check ((entidad_id is not null) and (entidad_id = mi_entidad()));
drop trigger if exists trg_audit on public.listas_limpieza;
create trigger trg_audit after insert or delete or update on public.listas_limpieza for each row execute function fn_auditoria();
drop trigger if exists trg_upd on public.listas_limpieza;
create trigger trg_upd before update on public.listas_limpieza for each row execute function fn_updated_at();
select 'listas_limpieza lista' as resultado;
