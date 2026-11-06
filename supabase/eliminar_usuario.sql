-- =====================================================================
--  v88 · ELIMINAR USUARIOS (solo el propietario)
--  Borra definitivamente el usuario de acceso (Authentication) y su perfil.
--  No permite borrar al propietario ni al usuario con el que se está trabajando.
--  Queda registrado en la auditoría (el borrado del perfil lo registra el disparador de auditoría). Ejecutar una vez en Supabase > SQL Editor.
-- =====================================================================
create or replace function public.eliminar_usuario(p_user uuid) returns void
  language plpgsql security definer set search_path = public, auth as $$
declare v_usuario text;
begin
  if not es_propietario() then raise exception 'Solo el propietario puede eliminar usuarios'; end if;
  if p_user = auth.uid() then raise exception 'No puede eliminar el usuario con el que está trabajando'; end if;
  if exists (select 1 from perfiles where id = p_user and rol = 'propietario') then raise exception 'No se puede eliminar un usuario propietario'; end if;
  select usuario into v_usuario from perfiles where id = p_user;
  begin
    delete from perfiles where id = p_user;
    delete from auth.users where id = p_user;
  exception when others then
    -- si algún registro histórico (auditoría) depende del usuario, no se borra la fila:
    -- se bloquea el acceso para siempre y se libera el nombre de usuario
    update perfiles set activo = false, usuario = coalesce(usuario, '') || '.eliminado.' || left(p_user::text, 8), entidad_id = null where id = p_user;
    update auth.users set email = 'eliminado.' || p_user::text || '@eliminado.invalid', banned_until = 'infinity' where id = p_user;
  end;
end $$;
revoke execute on function public.eliminar_usuario(uuid) from public, anon;
grant execute on function public.eliminar_usuario(uuid) to authenticated;
notify pgrst, 'reload schema';
select 'eliminar usuarios listo' as resultado;
