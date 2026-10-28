# Gestor Biomédico IBCOL — Guía de instalación gratuita en la nube

> **Estado actual (27/10/2026):** ya instalado. Página: **https://gestor-ibcol.netlify.app** · Base de datos Supabase: proyecto `gestor-ibcol` (organización IBCOL). Para actualizar la app: Netlify → proyecto gestor-ibcol → Deploys → arrastrar el .zip.

**IBCOL Ingeniería Biomédica de Colombia** · Carrera 39 No. 6B-22 B/ Colombia II Etapa · Popayán - Cauca · Contacto: 3146872775 · ibcolgerencia@gmail.com

Esta aplicación funciona como **página web** (desde cualquier navegador) y como **aplicación instalable** en celular, tableta o computador (PWA). Todo con servicios gratuitos:

| Pieza | Servicio gratis | Para qué |
|---|---|---|
| Base de datos, usuarios y archivos | **Supabase** (plan Free) | Guarda equipos, reportes, PDF y contraseñas de forma segura |
| Página web | **Netlify** (o GitHub Pages / Cloudflare Pages) | Publica la app con una dirección `https://...` |

Sin configurar nada, la app abre en **modo demostración** (datos solo en ese navegador) para que la pruebe:
- Propietario: `ibcol` / `ibcol2026`
- Cliente: `ips.demo` / `demo2026`

---

## Paso 1 — Crear la base de datos (Supabase) · 10 minutos

1. Entre a **https://supabase.com** → *Start your project* → regístrese con el correo `ibcolgerencia@gmail.com`.
2. *New project* → Nombre: `gestor-ibcol` → escriba una contraseña de base de datos (guárdela) → Región: **East US** (la más cercana) → *Create*.
3. Cuando termine de crearse, vaya a **SQL Editor** → *New query* → abra el archivo `supabase/schema.sql`, copie TODO su contenido, péguelo y presione **Run**. Debe decir *Success*.
4. Vaya a **Authentication → Sign In / Providers → Email** y **desactive "Confirm email"** → *Save*. (Los clientes entran con usuario, no con correo real).
5. Vaya a **Authentication → Users → Add user → Create new user**:
   - Email: `ibcolgerencia@gmail.com`
   - Password: su contraseña de propietario
   - Marque *Auto Confirm User* → *Create*.
   Este usuario queda automáticamente como **PROPIETARIO** (puede crear, modificar, firmar y eliminar).
6. Vaya a **Project Settings → API** y copie:
   - **Project URL** (ej. `https://abcdxyz.supabase.co`)
   - **anon public key** (texto largo que empieza por `eyJ...`)

## Paso 2 — Conectar la app · 2 minutos

Abra el archivo `js/config.js` con el Bloc de notas y pegue los dos valores:

```js
SUPABASE_URL: 'https://abcdxyz.supabase.co',
SUPABASE_ANON_KEY: 'eyJhbGciOi....',
```

Guarde. (La *anon key* es pública por diseño; la seguridad la dan las reglas de la base de datos que creó el script).

## Paso 3 — Publicar la página web · 3 minutos

**Opción más fácil: Netlify Drop**
1. Entre a **https://app.netlify.com/drop** (cree cuenta gratis con su correo).
2. Arrastre la **carpeta completa** `gestor-ibcol` a la página.
3. Netlify le da una dirección como `https://ibcol-gestor.netlify.app`. En *Site configuration → Change site name* puede ponerle `gestor-ibcol`.

Para actualizar la app más adelante, vuelva a arrastrar la carpeta en *Deploys*.

*(Alternativas igual de gratuitas: GitHub Pages o Cloudflare Pages — solo hay que subir la carpeta.)*

## Paso 4 — Instalar como aplicación

- **Android (Chrome):** abra la dirección → menú ⋮ → *Instalar aplicación*.
- **iPhone (Safari):** abra la dirección → botón Compartir → *Agregar a pantalla de inicio*.
- **Computador (Chrome/Edge):** ícono de instalar en la barra de direcciones.

## Paso 5 — Crear la carpeta y el usuario de cada cliente

1. Ingrese como propietario → **Entidades y equipos → Nueva entidad** (razón social, NIT, REPS, logo).
2. **Usuarios y accesos → Nuevo usuario de cliente**: elija la entidad, escriba un usuario (ej. `clinica.sanjose`) y una contraseña.
3. Entregue usuario y contraseña al cliente. Él solo verá **su** carpeta y podrá **ver y descargar en PDF**; no puede modificar nada.
4. Puede crear varios usuarios por entidad, cambiarles la contraseña o desactivarlos.

---

## Estructura documental (por entidad)

1. INVENTARIOS · 2. CRONOGRAMAS (subcarpetas: MANTENIMIENTOS PREVENTIVOS, CRONOGRAMA METROLOGÍA, CRONOGRAMA CAPACITACIÓN) · 3. INFORMACIÓN DEL EQUIPO (Servicio o consultorio → cada equipo: 1. Hoja de vida, 2. Mantenimientos preventivos, 3. Mantenimientos correctivos, 4. Metrología, 5. Registro sanitario, 6. Facturas, 7. Manual o ficha técnica, 8. Certificado importación, 9. Acta baja, 10. Acta entrega) · 4. PROTOCOLOS Y PROGRAMAS · 5. ALERTAS SANITARIAS · 6. PLAN DE CAPACITACIÓN · 7. LISTA CHEQUEO LIMPIEZA Y DESINFECCIÓN · 8. GESTIÓN DE INDICADORES · 9. CONTROL CALIDAD GLUCÓMETRO · 10. ACTAS REVISIÓN SEDES · 11. HOJAS DE VIDA INGENIEROS BIOMÉDICOS. Aparte: Programa de tecnovigilancia, contratos, archivo, cotizaciones, facturas y cuentas de cobro. Toda carpeta admite subcarpetas.

**El inventario manda (orden recomendado):**
1. Carpeta **1. INVENTARIOS** → *Cargar inventario (PDF o Excel)*, o en un archivo de inventario ya subido → *Crear servicios y equipos*. La app lee el formato FMB-001, muestra una vista previa y crea los **servicios** (columna Ubicación/Servicio) con sus **equipos** (código, marca, modelo, serie, riesgo, registro). Esta carpeta guarda solo los archivos del inventario.
2. **3. INFORMACIÓN DEL EQUIPO** muestra Servicio → equipos de ese servicio → las 10 carpetas de cada equipo.
3. Al importar carpetas, cada documento se asigna al equipo por el código en el nombre (ej. `ODFM-AUT-009`, `PAT 003`, `A.F. 002`). Si hay equipos con el mismo nombre, también se usa el modelo o la serie. Los cronogramas se ubican solos en su subcarpeta (mantenimiento, metrología o capacitación) según el nombre.

**Importar desde el computador o Drive:** abrir la entidad → "Importar carpeta de la entidad" → elegir la carpeta descomprimida → revisar → Importar.

**Revisar documentos (IA):** en "3. Información del equipo" → *Revisar documentos (IA)*. Lee el contenido de cada PDF (código, serie, activo fijo, modelo, marca) y propone mover los que están en el equipo equivocado; nada se mueve sin confirmar.

**Hoja de vida con IA:** en un equipo → *Redactar con IA* → "Hoja de vida del equipo (FHVEB-001)". En *Fuentes del equipo* aparecen sus manuales, fichas técnicas, registro sanitario y hoja de vida anterior (marque los que la IA debe leer). La IA devuelve los datos encontrados (fabricante, registro y vencimiento, riesgo, datos técnicos, fuentes de alimentación, accesorios, recomendaciones…) en una tabla; se marcan los que se quieren pasar y *Pasar a la hoja de vida*. Las demás plantillas del equipo (guía rápida, protocolo, recomendaciones) también leen esos documentos.
Si el modelo de Gemini está saturado, la función `asistente-ia` prueba sola con otros modelos Gemini disponibles.

## Formatos exactos

Hoja de vida (FHVEB-001), reporte de mantenimiento preventivo (FMB-004), cronogramas (FMB-002), inventario (FMB-001) y bitácora de alertas (FT-PGTV-015) salen **idénticos a las plantillas Excel originales**: la app usa la plantilla como fondo y solo escribe los datos en sus celdas. Al editar un reporte o una hoja de vida se vuelve a generar en el mismo formato. Código, versión y fecha del formato se cambian en *Formatos*.
También salen sobre plantilla: mantenimiento correctivo (FMB-005) y metrología (FMB-006), creados con el mismo diseño del FMB-004, y la cuenta de cobro (el Word original de IBCOL, con la firma). Actas, cotizaciones, tecnovigilancia, indicadores y documentos de la IA usan el mismo encabezado de los formatos: logo de la entidad, datos de la entidad, código/versión/fecha y pie de IBCOL con su logo.
**Logos de las entidades:** al cargar un inventario en PDF, la app toma el logo de la entidad del recuadro superior izquierdo si la entidad aún no tiene uno (se puede cambiar en la ficha de la entidad).
Para cambiar el diseño de una plantilla: reemplazar el Excel en `tools/plantillas/` y ejecutar `python3 tools/build_formatos.py` (genera `formatos/*.pdf` y `formatos/*.json`).

## Consecutivos

Menú **Consecutivos**: cada reporte preventivo, correctivo, acta (baja y entrega comparten numeración) y cuenta de cobro toma el siguiente número y queda registrado con entidad, equipo, fecha y observación. Desde ahí se ajusta el último número usado, se registran números usados fuera de la app y se exporta a Excel.
Números de partida (27/10/2026): preventivo 06669 → sigue 06670 · actas 0082 → sigue 0083 · correctivo 0021-26 → sigue 0022-26 · cuentas de cobro 00306-2026 → sigue 00307-2026. La base de datos se crea con `supabase/consecutivos.sql` (ya ejecutado).

## Asistente de IA

Redacta documentos con los datos reales de la entidad (menú "Asistente IA" o botón "Redactar con IA" en las carpetas 4 a 10 y en cada equipo) y los guarda como PDF con formato IBCOL. Funciona con la función `asistente-ia` de Supabase (ya instalada).
Para activarlo: Supabase → Edge Functions → Secrets → Add new secret:
- `ANTHROPIC_API_KEY` = clave de https://console.anthropic.com (Claude, pago por uso), **o**
- `GEMINI_API_KEY` = clave de https://aistudio.google.com/apikey (Google Gemini, tiene nivel gratuito).
Opcional `IA_MODELO` para cambiar el modelo. Solo el propietario puede usar el asistente.

## Qué incluye

**Carpeta de cada entidad:** Inventarios (FMB-001, PDF y Excel) · Cronogramas de mantenimiento, metrología y capacitación (FMB-002, por semanas) · Lista de chequeo limpieza y desinfección · Control de calidad glucómetro · Programa de tecnovigilancia (eventos adversos con bloqueo automático y plazo de 72 h) · Protocolos y programas · Alertas sanitarias (FT-PGTV-015) · Actas de revisión de sedes y equipos · Hojas de vida ingenieros biomédicos · Contratos · Gestión de indicadores · Carpeta de archivo · Cotizaciones · Facturas · Cuentas de cobro.

**Agrupado por consultorio → carpeta por equipo:** Hoja de vida (FHVEB-001) · Mantenimientos preventivos (FMB-004) · Correctivos · Metrología · Registro sanitario · Factura · Manual y ficha técnica · Acta de baja (FT-AB-033) · Acta de entrega (FT-AE-032) · Certificado de importación.

**Funciones:** subir, ver, descargar, modificar (con versiones), eliminar y firmar documentos PDF · firma dibujada o cargada como imagen · formatos editables solo por el propietario (código, versión, fecha, listas de chequeo) · biblioteca de plantillas Excel/Word · alertas de vencimiento (mantenimiento, calibración, garantía, registro sanitario, documentos) · indicadores (cumplimiento preventivo, metrología, capacitación, calibración vigente, disponibilidad, MTTR, tecnovigilancia, alertas) · pista de auditoría inalterable (quién ingresó, consultó, descargó, creó, modificó, firmó o eliminó) · cierre de sesión por inactividad (30 min).

## Límites del plan gratuito y recomendaciones

- Supabase Free: 500 MB de base de datos y **1 GB de archivos**, suficiente para cientos de equipos. Si crece, el plan Pro cuesta USD 25/mes.
- **Un proyecto Free se pausa si pasa 7 días sin uso.** Se reactiva con un clic en supabase.com (los datos no se pierden). Con uso semanal normal no ocurre.
- Copia de seguridad: en Supabase, *Database → Backups* (o descargue tablas en *Table Editor → Export CSV*) una vez al mes.
- La cuenta de cobro incluye la declaración de no responsable de IVA; revise con su contador que el texto corresponda a su situación tributaria. Complete cédula y cuenta bancaria en **Mi empresa y firma**.
