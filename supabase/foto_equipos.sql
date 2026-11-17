-- =====================================================================
--  v153 · Foto del equipo en su propia columna (ahorro de transferencia)
--  La foto (imagen en base64) estaba dentro de equipos.hv y viajaba en TODAS
--  las listas de equipos (≈3,4 MB cada vez). Se pasa a la columna equipos.foto,
--  que las listas no descargan; solo se trae al ver o imprimir la hoja de vida.
--  Se puede ejecutar varias veces sin problema.
-- =====================================================================
alter table public.equipos add column if not exists foto text;

update public.equipos
   set foto = hv->>'foto',
       hv   = hv - 'foto'
 where hv ? 'foto';

select count(*) filter (where foto is not null) as equipos_con_foto,
       count(*) filter (where hv ? 'foto')      as fotos_pendientes
  from public.equipos;
