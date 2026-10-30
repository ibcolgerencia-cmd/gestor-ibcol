-- v37 · Carpetas por entidad: cada entidad puede quitar las carpetas que no necesita.
-- entidades.config = { "ocultas_ent": ["glucometro", ...], "ocultas_eq": ["importacion", ...] }
-- Solo agrega una columna (no borra ni cambia datos). Las reglas RLS existentes de "entidades" la cubren.
alter table public.entidades add column if not exists config jsonb not null default '{}'::jsonb;
notify pgrst, 'reload schema';
