-- =====================================================================
--  v88 · ELIMINAR USUARIOS (solo el propietario)
--  Borra definitivamente el usuario de acceso (Authentication) y su perfil.
--  No permite borrar al propietario ni al usuario con el que se está trabajando.
--  Queda registrado en la auditoría. Ejecutar una vez en Supabase > SQL Editor.
-- =====================================================================
create or replace function public.eliminar_usuario(p_user uuid) returns void
  language plpgsql security definer set search_path = public, auth as $$
declare v_usuario text;
begin
  if not es_propietario() then raise exception 'Solo el propietario puede eliminar usuarios'; end if;
  if p_user = auth.uid() then raise exception 'No puede eliminar el usuario con el que está trabajando'; end if;
  if exists (select 1 from perfiles where id = p_user and rol = 'propietario') then raise exception 'No se puede eliminar un usuario propietario'; end if;
  select usuario into v_usuario from perfiles where id = p_user;
  perform registrar_evento('ELIMINAR', 'perfiles', p_user::text, 'Usuario eliminado: ' || coalesce(v_usuario, p_user::text));
  delete from perfiles where id = p_user;
  delete from auth.users where id = p_user;
end $$;
revoke execute on function public.eliminar_usuario(uuid) from public, anon;
grant execute on function public.eliminar_usuario(uuid) to authenticated;
notify pgrst, 'reload schema';
select 'eliminar usuarios listo' as resultado;
