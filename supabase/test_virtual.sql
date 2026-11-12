-- =====================================================================
--  v128 · PRE Y POST TEST VIRTUAL (enlace por sesión de capacitación)
--  El propietario crea un enlace secreto para cada sesión. Quien tenga el
--  enlace puede responder SIN usuario ni contraseña, pero:
--  · solo ve el tema y las preguntas (nunca las respuestas correctas);
--  · la calificación se hace aquí, en la base de datos;
--  · una cédula responde una sola vez cada test (pre / post);
--  · el enlace se puede cerrar o cambiar en cualquier momento.
--  No da acceso a ningún otro dato de la entidad.
--  Ejecutar una vez en Supabase > SQL Editor (se puede volver a ejecutar).
-- =====================================================================
create index if not exists tv_registros_token on public.tv_registros ((datos->'enlace'->>'token')) where tipo = 'sesion';

create or replace function public.tv_test_info(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare s record; e record; q jsonb;
begin
  if p_token is null or length(p_token) < 20 then return null; end if;
  select * into s from tv_registros where tipo = 'sesion' and datos->'enlace'->>'token' = p_token limit 1;
  if not found then return null; end if;
  select razon_social, logo into e from entidades where id = s.entidad_id;
  select coalesce(jsonb_agg(jsonb_build_object('p', x->'p', 'o', x->'o') order by n), '[]'::jsonb) into q
    from jsonb_array_elements(coalesce(s.datos->'preguntas', '[]'::jsonb)) with ordinality as t(x, n);
  return jsonb_build_object('tema', s.datos->>'tema', 'fecha', s.fecha, 'capacitador', s.datos->>'capacitador', 'entidad', e.razon_social, 'logo', e.logo,
    'fases', coalesce(s.datos->'enlace'->'fases', '[]'::jsonb), 'abierto', coalesce((s.datos->'enlace'->>'abierto')::boolean, false), 'firma', coalesce((s.datos->'enlace'->>'firma')::boolean, true), 'preguntas', q);
end $$;

create or replace function public.tv_test_responder(p_token text, p_fase text, p_nombre text, p_cedula text, p_servicio text, p_cargo text, p_resp jsonb, p_firma text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s record; preg jsonb; n int; ok int := 0; i int; corr int[]; dada int[]; resp_l jsonb := '[]'::jsonb; pts int; asis jsonb; hoy date := (now() at time zone 'America/Bogota')::date;
begin
  if p_token is null or length(p_token) < 20 then raise exception 'Enlace no válido'; end if;
  select * into s from tv_registros where tipo = 'sesion' and datos->'enlace'->>'token' = p_token limit 1 for update;
  if not found then raise exception 'Enlace no válido'; end if;
  if not coalesce((s.datos->'enlace'->>'abierto')::boolean, false) then raise exception 'Este test ya está cerrado. Comuníquese con el capacitador.'; end if;
  if p_fase not in ('pre', 'post') or not coalesce(s.datos->'enlace'->'fases', '[]'::jsonb) ? p_fase then raise exception 'Este test no está habilitado en este momento.'; end if;
  p_nombre := left(regexp_replace(trim(coalesce(p_nombre, '')), '\s+', ' ', 'g'), 120);
  p_cedula := left(regexp_replace(coalesce(p_cedula, ''), '[^0-9A-Za-z]', '', 'g'), 20);
  if length(p_nombre) < 3 or length(p_cedula) < 4 then raise exception 'Escriba su nombre completo y su número de cédula.'; end if;
  if p_firma is not null and (length(p_firma) > 150000 or p_firma not like 'data:image/png;base64,%') then p_firma := null; end if;
  if exists (select 1 from tv_registros where tipo = 'test' and datos->>'sesion_id' = s.id::text and datos->>'fase' = p_fase and datos->>'cedula' = p_cedula) then
    raise exception 'La cédula % ya respondió el %.', p_cedula, case when p_fase = 'pre' then 'pre-test' else 'post-test' end;
  end if;
  if p_resp is null or jsonb_typeof(p_resp) <> 'array' then raise exception 'Respuestas no válidas'; end if;
  preg := coalesce(s.datos->'preguntas', '[]'::jsonb); n := jsonb_array_length(preg);
  for i in 0 .. n - 1 loop
    corr := array(select (v #>> '{}')::int from jsonb_array_elements(coalesce(preg->i->'c', '[]'::jsonb)) v order by 1);
    dada := array(select distinct (v #>> '{}')::int from jsonb_array_elements(case when jsonb_typeof(p_resp->i) = 'array' then p_resp->i else '[]'::jsonb end) v where jsonb_typeof(v) = 'number' and (v #>> '{}')::numeric between 0 and 9 order by 1);
    if corr = dada then ok := ok + 1; end if;
    resp_l := resp_l || jsonb_build_array(to_jsonb(dada));
  end loop;
  pts := case when n > 0 then round(ok * 100.0 / n) else 0 end;
  insert into tv_registros (entidad_id, tipo, anio, periodo, fecha, datos, creado_por)
  values (s.entidad_id, 'test', s.anio, s.periodo, hoy, jsonb_build_object('sesion_id', s.id, 'fase', p_fase, 'nombre', p_nombre, 'cedula', p_cedula,
    'servicio', left(coalesce(p_servicio, ''), 80), 'cargo', left(coalesce(p_cargo, ''), 80), 'resp', resp_l, 'correctas', ok, 'puntaje', pts, 'firma', p_firma, 'virtual', true), null);
  -- queda en la lista de asistencia de la sesión
  asis := coalesce(s.datos->'asistentes', '[]'::jsonb);
  if not exists (select 1 from jsonb_array_elements(asis) a where a->>'cedula' = p_cedula) then
    asis := asis || jsonb_build_array(jsonb_build_object('nombre', p_nombre, 'cedula', p_cedula, 'cargo', left(coalesce(p_cargo, ''), 80), 'servicio', left(coalesce(p_servicio, ''), 80), 'firma', p_firma));
    update tv_registros set datos = jsonb_set(datos, '{asistentes}', asis) where id = s.id;
  end if;
  return jsonb_build_object('correctas', ok, 'total', n, 'puntaje', pts, 'mostrar', coalesce((s.datos->'enlace'->>'mostrar')::boolean, true));
end $$;

revoke all on function public.tv_test_info(text) from public;
revoke all on function public.tv_test_responder(text, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.tv_test_info(text) to anon, authenticated;
grant execute on function public.tv_test_responder(text, text, text, text, text, text, jsonb, text) to anon, authenticated;
notify pgrst, 'reload schema';
select 'test virtual listo' as resultado;
