-- =====================================================================
--  v210 · COMITÉ VIRTUAL: lista de asistencia por enlace (asistencia.html)
--  El propietario crea un enlace secreto para cada acta de comité. Quien
--  tenga el enlace (mientras esté abierto) escribe su nombre, cédula y
--  cargo y firma desde el celular, SIN usuario ni contraseña:
--  · solo ve la entidad, el tema, la fecha y el enlace de Google Meet;
--  · su firma queda en la lista de asistentes del acta;
--  · una cédula firma una vez (si vuelve a firmar se actualiza);
--  · el enlace se puede cerrar o cambiar en cualquier momento.
--  No da acceso a ningún otro dato de la entidad.
--  Ejecutar una vez en Supabase > SQL Editor (se puede volver a ejecutar).
-- =====================================================================
create index if not exists actas_comite_token on public.actas_comite ((datos->'enlace'->>'token'));

create or replace function public.comite_asis_info(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare a record; e record;
begin
  if p_token is null or length(p_token) < 20 then return null; end if;
  select * into a from actas_comite where datos->'enlace'->>'token' = p_token limit 1;
  if not found then return null; end if;
  select razon_social, logo into e from entidades where id = a.entidad_id;
  return jsonb_build_object('tema', a.tema, 'numero', a.numero, 'fecha', a.fecha, 'tipo', a.datos->>'tipo', 'hora', a.datos->'virtual'->>'hora',
    'meet', a.datos->'virtual'->>'meet', 'coordinador', a.datos->>'coordinador', 'entidad', e.razon_social, 'logo', e.logo,
    'abierto', coalesce((a.datos->'enlace'->>'abierto')::boolean, false));
end $$;

create or replace function public.comite_asis_firmar(p_token text, p_nombre text, p_cedula text, p_cargo text, p_firma text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a record; asis jsonb; hay boolean := false; nuevo jsonb;
begin
  if p_token is null or length(p_token) < 20 then raise exception 'Enlace no válido'; end if;
  select * into a from actas_comite where datos->'enlace'->>'token' = p_token limit 1 for update;
  if not found then raise exception 'Enlace no válido'; end if;
  if not coalesce((a.datos->'enlace'->>'abierto')::boolean, false) then raise exception 'La lista de asistencia está cerrada. Comuníquese con quien coordina la reunión.'; end if;
  p_nombre := left(regexp_replace(trim(coalesce(p_nombre, '')), '\s+', ' ', 'g'), 120);
  p_cedula := left(regexp_replace(coalesce(p_cedula, ''), '[^0-9A-Za-z]', '', 'g'), 20);
  p_cargo := left(trim(coalesce(p_cargo, '')), 100);
  if length(p_nombre) < 3 or length(p_cedula) < 4 then raise exception 'Escriba su nombre completo y su número de cédula.'; end if;
  if p_firma is null or length(p_firma) > 150000 or p_firma not like 'data:image/png;base64,%' then raise exception 'Firme en el recuadro antes de enviar.'; end if;
  nuevo := jsonb_build_object('nombre', p_nombre, 'cedula', p_cedula, 'cargo', p_cargo, 'firma', p_firma, 'virtual', true, 'hora', to_char(now() at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI'));
  select coalesce(jsonb_agg(case when (x->>'cedula' = p_cedula) or (coalesce(x->>'cedula', '') = '' and lower(trim(x->>'nombre')) = lower(p_nombre))
           then x || jsonb_build_object('nombre', p_nombre, 'cedula', p_cedula, 'cargo', coalesce(nullif(p_cargo, ''), x->>'cargo', ''), 'firma', p_firma, 'virtual', true) else x end order by n), '[]'::jsonb),
         coalesce(bool_or((x->>'cedula' = p_cedula) or (coalesce(x->>'cedula', '') = '' and lower(trim(x->>'nombre')) = lower(p_nombre))), false)
    into asis, hay
    from jsonb_array_elements(coalesce(a.datos->'asistentes', '[]'::jsonb)) with ordinality as t(x, n)
    where coalesce(x->>'nombre', '') <> '' or coalesce(x->>'cargo', '') <> '' or x->>'firma' is not null;
  if not hay then asis := asis || jsonb_build_array(nuevo); end if;
  if jsonb_array_length(asis) > 150 then raise exception 'La lista de asistencia está completa.'; end if;
  update actas_comite set datos = jsonb_set(datos, '{asistentes}', asis) where id = a.id;
  return jsonb_build_object('ok', true, 'total', jsonb_array_length(asis), 'actualizado', hay);
end $$;

revoke all on function public.comite_asis_info(text) from public;
revoke all on function public.comite_asis_firmar(text, text, text, text, text) from public;
grant execute on function public.comite_asis_info(text) to anon, authenticated;
grant execute on function public.comite_asis_firmar(text, text, text, text, text) to anon, authenticated;
notify pgrst, 'reload schema';
select 'comité virtual listo' as resultado;
