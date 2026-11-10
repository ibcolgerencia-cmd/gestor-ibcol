-- =====================================================================
--  v96 · INVENTARIO DE PRECIOS Y DETALLE PRIVADO DE COTIZACIONES
--  · catalogo_cotizacion: equipos biomédicos, mantenimiento, calibración,
--    repuestos y otros servicios con su valor unitario. SOLO propietario.
--  · cotizaciones_detalle: la tabla de ítems y valores de cada cotización.
--    SOLO propietario. El cliente final solo ve en "cotizaciones" el objeto,
--    el subtotal, el IVA y el valor total.
--  · Las cotizaciones existentes: su tabla de ítems se COPIA al detalle
--    privado y luego se retira de la fila que ve el cliente (no se pierde).
--  Ejecutar una vez en Supabase > SQL Editor (se puede volver a ejecutar).
-- =====================================================================
create table if not exists public.catalogo_cotizacion (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'Mantenimiento preventivo',
  codigo text,
  descripcion text not null,
  marca text,
  modelo text,
  unidad text default 'Unidad',
  valor numeric not null default 0,
  notas text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.catalogo_cotizacion enable row level security;
drop policy if exists p_propietario on public.catalogo_cotizacion;
create policy p_propietario on public.catalogo_cotizacion for all to authenticated
  using (es_propietario()) with check (es_propietario());

create table if not exists public.cotizaciones_detalle (
  id uuid primary key references public.cotizaciones(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cotizaciones_detalle enable row level security;
drop policy if exists p_propietario on public.cotizaciones_detalle;
create policy p_propietario on public.cotizaciones_detalle for all to authenticated
  using (es_propietario()) with check (es_propietario());

revoke all on public.catalogo_cotizacion, public.cotizaciones_detalle from anon;
grant select, insert, update, delete on public.catalogo_cotizacion, public.cotizaciones_detalle to authenticated;

drop trigger if exists trg_updated_catalogo_cotizacion on public.catalogo_cotizacion;
create trigger trg_updated_catalogo_cotizacion before update on public.catalogo_cotizacion for each row execute function public.fn_updated_at();
drop trigger if exists trg_updated_cotizaciones_detalle on public.cotizaciones_detalle;
create trigger trg_updated_cotizaciones_detalle before update on public.cotizaciones_detalle for each row execute function public.fn_updated_at();

-- columnas que ve el cliente
alter table public.cotizaciones add column if not exists descripcion text;
alter table public.cotizaciones add column if not exists subtotal numeric;
alter table public.cotizaciones add column if not exists total numeric;

-- 1) copiar la tabla de ítems de las cotizaciones existentes al detalle privado
insert into public.cotizaciones_detalle (id, items)
select c.id, c.items::jsonb from public.cotizaciones c
 where c.items is not null and jsonb_typeof(c.items::jsonb) = 'array' and jsonb_array_length(c.items::jsonb) > 0
on conflict (id) do nothing;

-- 2) calcular subtotal y total a partir del detalle
update public.cotizaciones c set
  subtotal = s.sub,
  total = round(s.sub * (1 + coalesce(c.iva, 0)::numeric / 100))
from (
  select d.id, coalesce(sum(coalesce(nullif(regexp_replace(i->>'cantidad', '[^0-9.]', '', 'g'), '')::numeric, 0)
                          * coalesce(nullif(regexp_replace(i->>'valor', '[^0-9.]', '', 'g'), '')::numeric, 0)), 0) as sub
    from public.cotizaciones_detalle d left join lateral jsonb_array_elements(d.items) i on true
   group by d.id
) s
where s.id = c.id and c.total is null;

-- 3) retirar la tabla de ítems de la fila que ve el cliente (ya quedó copiada en el detalle)
update public.cotizaciones c set items = '[]'
 where exists (select 1 from public.cotizaciones_detalle d where d.id = c.id)
   and c.items is not null and jsonb_typeof(c.items::jsonb) = 'array' and jsonb_array_length(c.items::jsonb) > 0;

notify pgrst, 'reload schema';
select 'inventario de cotizaciones listo' as resultado,
       (select count(*) from public.cotizaciones_detalle) as cotizaciones_con_detalle;
