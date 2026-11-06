-- =====================================================================
--  v87 · PORTAL DE CALIDAD POR SEDE
--  Un usuario de calidad puede quedar asignado a UNA sede de la entidad:
--  solo verá los servicios y equipos de esa sede, y solo podrá diligenciar
--  la lista de limpieza y reportar daños de esa sede.
--  Sin sede asignada (NULL) = todas las sedes de la entidad.
--  Requiere haber ejecutado antes supabase/seguridad_calidad.sql.
--  Ejecutar una vez en Supabase > SQL Editor (se puede volver a ejecutar).
-- =====================================================================
alter table public.perfiles add column if not exists sede text;

create or replace function public.mi_sede_calidad() returns text
  language sql stable security definer set search_path = public as $$
  select nullif(trim(sede), '') from perfiles where id = auth.uid() and activo and rol = 'calidad';
$$;

-- ¿el servicio (consultorio) pertenece a la entidad y a la sede del usuario de calidad?
create or replace function public.calidad_consultorio_ok(p_consultorio uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from consultorios c
     where c.id = p_consultorio
       and c.entidad_id = mi_entidad_calidad()
       and (mi_sede_calidad() is null or coalesce(nullif(trim(c.sede), ''), 'Sede principal') = mi_sede_calidad())
  );
$$;

drop function if exists public.asignar_perfil_calidad(uuid, uuid, text, text);
create or replace function public.asignar_perfil_calidad(p_user uuid, p_entidad uuid, p_nombre text, p_usuario text, p_sede text default null) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not es_propietario() then raise exception 'Solo el propietario puede asignar perfiles'; end if;
  if p_entidad is null then raise exception 'Seleccione la entidad'; end if;
  update perfiles set entidad_id = p_entidad, nombre = p_nombre, usuario = p_usuario, rol = 'calidad', activo = true, sede = nullif(trim(p_sede), '')
   where id = p_user and rol <> 'propietario';
end $$;

-- reglas de lectura y escritura del usuario de calidad, ahora limitadas a su sede
drop policy if exists p_calidad_leer on public.consultorios;
create policy p_calidad_leer on public.consultorios for select to authenticated
  using (entidad_id = mi_entidad_calidad() and (mi_sede_calidad() is null or coalesce(nullif(trim(sede), ''), 'Sede principal') = mi_sede_calidad()));
drop policy if exists p_calidad_leer on public.equipos;
create policy p_calidad_leer on public.equipos for select to authenticated
  using (entidad_id = mi_entidad_calidad() and (mi_sede_calidad() is null or calidad_consultorio_ok(consultorio_id)));

drop policy if exists p_calidad_leer on public.listas_limpieza;
create policy p_calidad_leer on public.listas_limpieza for select to authenticated
  using (entidad_id = mi_entidad_calidad() and (mi_sede_calidad() is null or calidad_consultorio_ok(consultorio_id)));
drop policy if exists p_calidad_crear on public.listas_limpieza;
create policy p_calidad_crear on public.listas_limpieza for insert to authenticated
  with check (entidad_id = mi_entidad_calidad() and calidad_consultorio_ok(consultorio_id));
drop policy if exists p_calidad_marcar on public.listas_limpieza;
create policy p_calidad_marcar on public.listas_limpieza for update to authenticated
  using (entidad_id = mi_entidad_calidad() and calidad_consultorio_ok(consultorio_id))
  with check (entidad_id = mi_entidad_calidad() and calidad_consultorio_ok(consultorio_id));

drop policy if exists p_calidad_leer on public.reportes_dano;
create policy p_calidad_leer on public.reportes_dano for select to authenticated
  using (entidad_id = mi_entidad_calidad() and (mi_sede_calidad() is null or calidad_consultorio_ok(consultorio_id) or sede = mi_sede_calidad()));
drop policy if exists p_calidad_crear on public.reportes_dano;
create policy p_calidad_crear on public.reportes_dano for insert to authenticated
  with check (entidad_id = mi_entidad_calidad() and estado = 'Nuevo' and (mi_sede_calidad() is null or calidad_consultorio_ok(consultorio_id)));

revoke execute on function public.mi_sede_calidad() from public, anon;
revoke execute on function public.calidad_consultorio_ok(uuid) from public, anon;
revoke execute on function public.asignar_perfil_calidad(uuid, uuid, text, text, text) from public, anon;
grant execute on function public.mi_sede_calidad() to authenticated;
grant execute on function public.calidad_consultorio_ok(uuid) to authenticated;
grant execute on function public.asignar_perfil_calidad(uuid, uuid, text, text, text) to authenticated;

notify pgrst, 'reload schema';
select 'portal de calidad por sede listo' as resultado;
