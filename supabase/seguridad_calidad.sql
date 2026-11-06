-- =====================================================================
--  v86 · SEGURIDAD DE LA BASE DE DATOS + PORTAL DEL ÁREA DE CALIDAD
--  Ejecutar una vez en Supabase > SQL Editor (se puede volver a ejecutar sin daño).
--
--  A. Portal de calidad: nuevo rol "calidad" (usuario y contraseña propios por
--     entidad). Solo puede leer la entidad, sus servicios y equipos, y crear o
--     marcar listas de chequeo de limpieza y reportes de daño. No ve documentos,
--     hojas de vida, cronogramas, auditoría ni archivos.
--  B. Endurecimiento recomendado por el Security Advisor de Supabase:
--     search_path fijo en funciones y sin ejecución pública (anon) de funciones
--     SECURITY DEFINER.
-- =====================================================================

-- ---------------------------------------------------------------- A. rol "calidad"
do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.perfiles'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%rol%'
  loop execute format('alter table public.perfiles drop constraint %I', c.conname); end loop;
end $$;
alter table public.perfiles add constraint perfiles_rol_check check (rol in ('propietario', 'cliente', 'calidad')) not valid;

-- el usuario de calidad NO obtiene la entidad por mi_entidad(): así no ve el resto de la carpeta
create or replace function public.mi_entidad() returns uuid
  language sql stable security definer set search_path = public as $$
  select entidad_id from perfiles where id = auth.uid() and activo and coalesce(rol, 'cliente') <> 'calidad';
$$;

create or replace function public.mi_entidad_calidad() returns uuid
  language sql stable security definer set search_path = public as $$
  select entidad_id from perfiles where id = auth.uid() and activo and rol = 'calidad';
$$;

create or replace function public.asignar_perfil_calidad(p_user uuid, p_entidad uuid, p_nombre text, p_usuario text) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not es_propietario() then raise exception 'Solo el propietario puede asignar perfiles'; end if;
  if p_entidad is null then raise exception 'Seleccione la entidad'; end if;
  update perfiles set entidad_id = p_entidad, nombre = p_nombre, usuario = p_usuario, rol = 'calidad', activo = true
   where id = p_user and rol <> 'propietario';
end $$;

-- lectura mínima para diligenciar: entidad, servicios y equipos (sin documentos)
drop policy if exists p_calidad_leer on public.entidades;
create policy p_calidad_leer on public.entidades for select to authenticated using (id = mi_entidad_calidad());
drop policy if exists p_calidad_leer on public.consultorios;
create policy p_calidad_leer on public.consultorios for select to authenticated using (entidad_id = mi_entidad_calidad());
drop policy if exists p_calidad_leer on public.equipos;
create policy p_calidad_leer on public.equipos for select to authenticated using (entidad_id = mi_entidad_calidad());
drop policy if exists p_calidad_leer on public.empresa;
create policy p_calidad_leer on public.empresa for select to authenticated using (mi_entidad_calidad() is not null);
drop policy if exists p_calidad_leer on public.formatos;
create policy p_calidad_leer on public.formatos for select to authenticated using (mi_entidad_calidad() is not null);

-- lista de chequeo de limpieza y desinfección
drop policy if exists p_calidad_leer on public.listas_limpieza;
create policy p_calidad_leer on public.listas_limpieza for select to authenticated using (entidad_id = mi_entidad_calidad());
drop policy if exists p_calidad_crear on public.listas_limpieza;
create policy p_calidad_crear on public.listas_limpieza for insert to authenticated with check (entidad_id = mi_entidad_calidad());
drop policy if exists p_calidad_marcar on public.listas_limpieza;
create policy p_calidad_marcar on public.listas_limpieza for update to authenticated using (entidad_id = mi_entidad_calidad()) with check (entidad_id = mi_entidad_calidad());

-- reporte de daño de equipos
drop policy if exists p_calidad_leer on public.reportes_dano;
create policy p_calidad_leer on public.reportes_dano for select to authenticated using (entidad_id = mi_entidad_calidad());
drop policy if exists p_calidad_crear on public.reportes_dano;
create policy p_calidad_crear on public.reportes_dano for insert to authenticated with check (entidad_id = mi_entidad_calidad() and estado = 'Nuevo');

-- ---------------------------------------------------------------- B. endurecimiento
alter function public.fmt_consecutivo(text, integer, date) set search_path = public;
alter function public.fn_updated_at() set search_path = public;
alter function public.fn_bloquear_auditoria() set search_path = public;

-- funciones que la app llama o que usan las reglas de acceso: solo usuarios con sesión
revoke execute on function public.asignar_perfil(uuid, uuid, text, text) from public, anon;
revoke execute on function public.asignar_perfil_calidad(uuid, uuid, text, text) from public, anon;
revoke execute on function public.cambiar_clave(uuid, text) from public, anon;
revoke execute on function public.registrar_evento(text, text, text, text) from public, anon;
revoke execute on function public.es_propietario() from public, anon;
revoke execute on function public.mi_entidad() from public, anon;
revoke execute on function public.mi_entidad_calidad() from public, anon;
grant execute on function public.asignar_perfil(uuid, uuid, text, text) to authenticated;
grant execute on function public.asignar_perfil_calidad(uuid, uuid, text, text) to authenticated;
grant execute on function public.cambiar_clave(uuid, text) to authenticated;
grant execute on function public.registrar_evento(text, text, text, text) to authenticated;
grant execute on function public.es_propietario() to authenticated;
grant execute on function public.mi_entidad() to authenticated;
grant execute on function public.mi_entidad_calidad() to authenticated;

-- funciones de disparadores (triggers): nadie las llama directamente
revoke execute on function public.crear_perfil() from public, anon, authenticated;
revoke execute on function public.fn_auditoria() from public, anon, authenticated;
revoke execute on function public.fn_evento_grave() from public, anon, authenticated;

notify pgrst, 'reload schema';
select 'seguridad y portal de calidad listos' as resultado;
