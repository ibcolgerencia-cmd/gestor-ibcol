-- =====================================================================
--  v102 · DESCUENTO EN COTIZACIONES
--  descuento: valor ingresado; descuento_tipo: '%' (porcentaje) o '$' (valor).
--  Se aplica sobre el subtotal, antes de IVA. El cliente ve el descuento y el total.
--  Ejecutar una vez en Supabase > SQL Editor (se puede volver a ejecutar).
-- =====================================================================
alter table public.cotizaciones add column if not exists descuento numeric default 0;
alter table public.cotizaciones add column if not exists descuento_tipo text default '%';
notify pgrst, 'reload schema';
select 'descuento de cotizaciones listo' as resultado;
