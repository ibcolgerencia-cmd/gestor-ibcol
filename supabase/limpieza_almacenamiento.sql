-- =====================================================================
--  v103 · LIMPIEZA DE ARCHIVOS HUÉRFANOS (solo propietario)
--  Un archivo es "huérfano" cuando está en el almacenamiento (bucket documentos)
--  pero NINGUNA tabla del gestor lo menciona (documentos, cobros, actas,
--  fotos/anexos, configuraciones…). Se revisan TODAS las tablas públicas
--  (menos la auditoría) para no borrar nada que se esté usando.
--  No se tocan: archivos de la última hora ni copias compartidas por enlace
--  de los últimos 8 días.
--  Estas funciones solo LISTAN; el borrado lo hace la app (Mi empresa ›
--  Almacenamiento) con la API de Storage, que es la forma correcta de liberar espacio.
--  Ejecutar una vez en Supabase > SQL Editor (se puede volver a ejecutar).
-- =====================================================================
create or replace function public.archivos_huerfanos(p_limite int default 1000)
returns table(nombre text, tamano bigint)
language plpgsql security definer set search_path = public, storage as $$
declare t record;
begin
  if not es_propietario() then raise exception 'Solo el propietario puede revisar el almacenamiento'; end if;
  create temp table if not exists _refs_ibcol(r text) on commit drop;
  truncate _refs_ibcol;
  for t in select table_name from information_schema.tables
            where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> 'auditoria' loop
    execute format('insert into _refs_ibcol select distinct m[1] from public.%I x, regexp_matches(x::text, %L, %L) m',
                   t.table_name, '([A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)+)', 'g');
  end loop;
  create index on _refs_ibcol(r);
  return query
    select o.name::text, coalesce((o.metadata->>'size')::bigint, 0)
      from storage.objects o
     where o.bucket_id = 'documentos'
       and o.created_at < now() - interval '1 hour'
       and not (o.name like '%/compartidos/%' and o.created_at > now() - interval '8 days')
       and not exists (select 1 from _refs_ibcol x where x.r = o.name)
     order by coalesce((o.metadata->>'size')::bigint, 0) desc
     limit greatest(1, least(coalesce(p_limite, 1000), 1000));
end $$;

create or replace function public.almacenamiento_resumen()
returns table(archivos bigint, bytes bigint, huerfanos bigint, bytes_huerfanos bigint)
language plpgsql security definer set search_path = public, storage as $$
declare n bigint; b bigint; hn bigint := 0; hb bigint := 0; lote bigint; lb bigint;
begin
  if not es_propietario() then raise exception 'Solo el propietario puede revisar el almacenamiento'; end if;
  select count(*), coalesce(sum((metadata->>'size')::bigint), 0) into n, b from storage.objects where bucket_id = 'documentos';
  -- conteo completo de huérfanos (sin el tope de 1000)
  create temp table if not exists _refs_ibcol(r text) on commit drop;
  truncate _refs_ibcol;
  declare t record; begin
    for t in select table_name from information_schema.tables
              where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> 'auditoria' loop
      execute format('insert into _refs_ibcol select distinct m[1] from public.%I x, regexp_matches(x::text, %L, %L) m',
                     t.table_name, '([A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)+)', 'g');
    end loop;
  end;
  select count(*), coalesce(sum((o.metadata->>'size')::bigint), 0) into hn, hb
    from storage.objects o
   where o.bucket_id = 'documentos'
     and o.created_at < now() - interval '1 hour'
     and not (o.name like '%/compartidos/%' and o.created_at > now() - interval '8 days')
     and not exists (select 1 from _refs_ibcol x where x.r = o.name);
  return query select n, b, hn, hb;
end $$;

revoke execute on function public.archivos_huerfanos(int) from public, anon;
revoke execute on function public.almacenamiento_resumen() from public, anon;
grant execute on function public.archivos_huerfanos(int) to authenticated;
grant execute on function public.almacenamiento_resumen() to authenticated;
notify pgrst, 'reload schema';
select 'limpieza de almacenamiento lista' as resultado;
