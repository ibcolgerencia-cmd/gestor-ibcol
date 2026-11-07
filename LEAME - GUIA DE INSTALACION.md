# Gestor Biomédico IBCOL — Guía de instalación gratuita en la nube

> **Estado actual (29/10/2026, versión 32):** la app se publica en **GitHub Pages: https://ibcolgerencia-cmd.github.io/gestor-ibcol/** (repositorio `ibcolgerencia-cmd/gestor-ibcol`, cuenta GitHub de IBCOL). Para actualizar: en el repositorio → carpeta correspondiente → *Add file → Upload files* → *Commit changes*; GitHub publica solo en 1-2 minutos y sin límite de publicaciones. Al cambiar archivos de `js/` o `css/`, subir también `index.html` con el número `?v=` aumentado (ej. v=21 → v=22) para que los navegadores tomen la versión nueva de inmediato. Base de datos: Supabase `gestor-ibcol`. La dirección anterior de Netlify (gestor-ibcol.netlify.app, cuenta de Diana Pistala) queda con la versión del 27/10 a las 7:28 p. m. y ya no se actualiza: el plan gratis agotó sus créditos.

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

**Hoja de vida: RS / PC / NA / NR y código ECRI.** En *Editar hoja de vida → Identificación* se marca a mano RS, PC, NA o NR (sale con X en el formato). La hoja de vida tiene la pestaña **Código ECRI**: muestra el código asignado, sugerencias según el nombre del equipo y un buscador en todo el listado; *Asignar* lo pone en la casilla 1.2 (luego *Guardar hoja de vida*). El campo *1.2 Código ECRI (UMDNS)* de la pestaña Identificación también tiene *Buscar en listado ECRI* (4.907 códigos del listado ECRI español-inglés, búsqueda por nombre o código) y sugerencias según el nombre del equipo.

## Versión 33-37 (29-30/10/2026): sedes · menú en celular · cambio de usuario · cronograma entre años · quitar carpetas

- **Alertas de vencimiento desplegables (v93):** en el Panel de control y en la carpeta de cada entidad, las alertas quedan en una pestaña plegable que muestra cuántas están vencidas y próximas; se abre con un clic y el gestor recuerda si se dejó abierta.
- **Crear carpetas (v92):** en la carpeta de un equipo, la tarjeta «+ Nueva carpeta» crea una carpeta solo en ese equipo o, marcando la casilla, en todos los equipos de la entidad; en la carpeta digital de la entidad también hay «+ Nueva carpeta». Las carpetas nuevas permiten subir archivos, subcarpetas, cambiar nombre y quitarlas, y se incluyen en «Descargar carpeta».
- **Nombre de carpetas por equipo (v91):** el lápiz de una carpeta dentro de un equipo cambia el nombre y número solo en ese equipo; para cambiarlo en todos los equipos de la entidad marque «Aplicar este nombre a todos los equipos». «Nombre general» vuelve al nombre común.
- **Sede obligatoria para usuarios de calidad (v90):** en entidades con varias sedes, cada usuario de calidad debe tener su sede (ya no existe la opción «Todas las sedes»); solo ve y diligencia los servicios de esa sede. La sede se cambia con el lápiz en Usuarios y accesos.
- **Eliminar usuarios (v88):** en Usuarios y accesos, el ícono de papelera elimina definitivamente un usuario cliente o de calidad (no el propietario); queda en Auditoría. Requiere ejecutar una vez supabase/eliminar_usuario.sql.
- **Usuarios de calidad por sede (v87):** al crear un usuario de calidad (Panel de control › Portal del área de calidad › + Usuario de calidad) se elige la sede: ese usuario solo ve los servicios y equipos de su sede y solo diligencia la lista de limpieza y reporta daños de esa sede (o «Todas las sedes»). Requiere ejecutar una vez supabase/calidad_sedes.sql.
- **Seguridad y portal de calidad (v86):** (1) Portal del área de calidad: en el Panel de control, sección «Portal del área de calidad» → por cada entidad «Copiar enlace» y «+ Usuario de calidad». Ese usuario (rol calidad, contraseña propia) entra por el enlace y solo ve la Lista de chequeo de limpieza y desinfección y el Reporte de daño de equipos de su entidad; también se puede crear en Usuarios y accesos eligiendo el tipo «Calidad». (2) Seguridad: política CSP y anti-clickjacking, bloqueo de archivos peligrosos (ejecutables, scripts, HTML/SVG, comprimidos, Office con macros) y verificación del contenido real de PDF/imágenes/Office, límite de 60 MB, contraseñas de mínimo 8 con letras y números, bloqueo de 5 minutos tras 5 intentos fallidos. (3) Base de datos: ejecutar una vez supabase/seguridad_calidad.sql (rol calidad con reglas propias, search_path fijo y sin ejecución pública de funciones SECURITY DEFINER, según el Security Advisor de Supabase).
- **Políticas de privacidad de datos y seguridad electrónica (v85):** menú «Privacidad y seguridad» (propietario y clientes) y página pública politicas.html enlazada en la pantalla de ingreso: Política de Tratamiento de Datos Personales PL-PDP-001 (Ley 1581 de 2012, Decreto 1074 de 2015), Política de Seguridad de la Información y Seguridad Electrónica PL-SI-002 (ISO/IEC 27001, Ley 527 de 1999, Ley 1273 de 2009) y Aviso de privacidad; se descargan en PDF. Cada usuario debe aceptarlas al ingresar (queda en Auditoría con la versión) y el reporte de daño pide autorización de datos. Si la empresa tiene NIT, regístrelo en Mi empresa y firma para que aparezca en las políticas.
- **Descargar carpeta completa (v84, solo administrador):** en la carpeta de la entidad (o de una sede) → “Descargar carpeta”. Opción “En carpetas”: descarga un .zip con la misma estructura del gestor (carpetas generales con sus subcarpetas y 3. Información del equipo › sede › servicio › equipo › 1. Hoja de vida … 10. Acta entrega), cada documento en PDF y los Excel/Word tal cual. Opción “Un solo PDF”: arma un solo PDF con portada, índice con número de página y todo el contenido: inventario, documentos de las carpetas generales (cronogramas guardados, protocolos, alertas, capacitación, indicadores, contratos…) y, por servicio, cada equipo con su hoja de vida, reportes de mantenimiento preventivo, correctivo y metrología y sus documentos. Opciones: incluir manuales/fichas técnicas y equipos dados de baja. Los archivos de Excel o Word se nombran en el índice pero no se pueden unir.
- **Actas de baja y de entrega con los formatos Excel de IBCOL (v79):** en cada equipo, carpetas 9. Acta baja y 10. Acta entrega → “Generar acta” llena el formato exacto FT-AB-033 / FT-AE-032 (fecha, número, datos de la entidad, texto con los equipos, tabla código/equipo/marca/modelo/serie, firma de la ingeniera y casilla Recibe con nombre, cargo, fecha y firma). Hasta 3 equipos usa el formato original; de 4 a 7 equipos, el mismo formato con 7 filas; más de 7, varias hojas. Los Excel originales quedan en Formatos › Biblioteca de formatos. Desde v80 el acta permite escribir Observaciones, que se imprimen debajo del párrafo de cierre.
- **Reportes de daño de equipos (v77):** en el panel de control (IBCOL) y en la carpeta de cada entidad (cliente) aparece “Reportar daño de un equipo”: nombre y apellido, celular, entidad, sede, servicio, equipo, descripción y si quedó fuera de servicio. Al enviarlo se abre el aviso ya escrito por WhatsApp, mensaje de texto (SMS) o correo a IBCOL (3146872775 · ibcolgerencia@gmail.com). IBCOL cambia el estado (Nuevo, En revisión, Atendido, Cerrado), “Llevar al equipo” guarda el PDF del reporte en 3. Mantenimientos correctivos del equipo y “Correctivo” abre el reporte de mantenimiento correctivo (FMB-005) con la falla ya escrita; al guardarlo el reporte queda Atendido (v78). Requiere ejecutar una vez supabase/reportes_dano.sql.
- **Quitar carpetas por equipo (v76):** al quitar una carpeta desde un equipo se elige: solo ese equipo, los equipos que no la requieren (para Metrología, los que no llevan calibración) o todos los equipos de la entidad. En el equipo aparece “Volver a mostrar” para las carpetas quitadas solo en él.
- **Archivos del más reciente al más antiguo según su fecha real (v73):** en todas las carpetas (hojas de vida, metrología, mantenimientos preventivos y correctivos, etc.) los archivos se ordenan por la fecha escrita en el nombre (ej. 24_04_2026, 23-10-2025, MAYO-2024, 2024-2025); si el nombre no tiene fecha, por la fecha del documento o la de carga. Con la misma fecha, el número inicial más alto va primero.
- **Formato Recomendaciones para mediciones (v72):** en *Formatos* está “Recomendaciones para mediciones (9.5)” con la tabla del Excel (equipo, magnitud, unidad, puntos de calibración y observaciones); se puede editar, cargar desde Excel o descargar. La casilla 9.5 de la hoja de vida se llena con ese formato solo en los equipos que llevan calibración (los que están en la tabla o tienen periodicidad de metrología); los demás quedan NO APLICA. *Aplicar a las hojas de vida…* lo hace para todos los equipos de una o todas las entidades.
- **Actualizar hoja de vida con IA (v70):** botón en el equipo y en su carpeta 1. Hoja de vida. La IA lee el manual, la ficha técnica, el registro sanitario, la factura, el certificado de importación, la hoja de vida anterior y la fila del equipo en el inventario cargado, y propone marca, modelo, serie, activo fijo, ubicación, datos técnicos, fabricante, proveedor, forma de adquisición, factura, costo, garantía y fechas. Se marcan los datos a pasar (los vacíos vienen marcados) y se revisa el PDF.
- **FMB-004 actualizado (v68):** en el reporte de mantenimiento preventivo, la fila 1.1 Entidad / 1.2 Sede quedó como el formato nuevo: casilla de Entidad más ancha y “1.2 Sede” junto a su casilla.
- **Pasar un equipo a otro cronograma (v67):** en los cronogramas de mantenimiento y metrología, el botón de carpeta de cada fila pasa el equipo a otro cronograma separado (ej. de GENERAL a EXTRAMURAL o CENTRÍFUGA ALMACÉN); sale del anterior y queda solo en el nuevo, en ambos tipos de cronograma, sin cambiar su servicio en el inventario. “Según su servicio” deshace el cambio.
- **Mover equipos (v66):** en el inventario, *Mover equipos* → marque equipos sueltos o un servicio completo → *Mover a otro servicio…* → elija sede y servicio de destino (o cree uno nuevo). El equipo sale de su inventario y queda solo en el nuevo, con su hoja de vida, documentos, mantenimientos y cronograma.
- **Subcarpetas de servicios desde el inventario (v64):** *Nueva subcarpeta de servicios* crea una carpeta (ej. CENTRÍFUGA ALMACÉN, HOME CARE) y permite marcar qué servicios van dentro; con una carpeta abierta, *Carpeta …* cambia su nombre, sus servicios o la quita (los servicios y equipos no se borran).
- **Inventario: servicios y extramural aparte (v62):** el inventario muestra primero los servicios (consultorios, toma de muestras, terapia física, área de residuos) y después, aparte, cada carpeta de servicios (ej. EXTRAMURAL con sus KIT). Botones *Ver: Todo / Servicios / EXTRAMURAL* (el PDF sale con lo que se ve), *+ Equipo* en cada servicio y *+ Servicio* para crear un servicio nuevo en los servicios o dentro de una carpeta.
- **Inventarios con varias hojas y kits (v61):** al cargar o llenar desde un inventario en Excel se leen todas sus hojas (ej. INV, Extramural, Centrífuga) sin repetir códigos; la columna combinada “KIT 1”, “KIT 2”… del extramural lleva cada equipo a su kit.
- **Inventario por servicios y borrar equipos (v59):** la tabla del inventario se agrupa por servicio (con el número de equipos de cada uno y el ítem que reinicia por servicio; botón *Por servicios* para quitar o poner la agrupación). *Borrar equipos* muestra casillas para marcar equipos sueltos o un servicio completo y eliminarlos con sus documentos (pide confirmación).
- **Orden y carga completa desde el inventario (v58):** al llenar desde los archivos cargados, los servicios y los equipos de cada sede quedan en el mismo orden del inventario en Excel (los servicios que el archivo no trae, como los KIT, quedan al final) y se crean los equipos del inventario que aún no existían. Lee también los títulos de servicio como “SERVICIO / TOMA MUESTRAS”.
- **Llenar todas las entidades (v55):** en *Entidades y equipos*, botón *Llenar inventarios y cronogramas (todas)*: recorre todas las entidades y sus sedes, lee los inventarios y cronogramas en Excel ya cargados (opcional PDF) y busca cada equipo por código, serie o servicio y nombre (v56; opción para tomar el código del archivo) y completa los datos vacíos de cada equipo y la programación marcada; al final muestra un resumen por entidad.
- **Anotaciones en el cronograma (v54):** en cada fila del cronograma de mantenimiento o metrología, botón de nota (📄) para escribir anotaciones por mes (hallazgos, repuestos pendientes…). Las semanas con nota muestran una esquina azul. Con *Pasar al reporte* se abre el reporte del equipo con la nota ya puesta en *Observaciones*; al crear cualquier reporte nuevo del equipo, la nota de ese mes se pasa sola y las demás se pueden agregar con un botón.
- **Llenar con archivos cargados (v53):** en el inventario y en el cronograma, *Llenar con archivos cargados* lee los inventarios y cronogramas (Excel o PDF) ya subidos a esas carpetas (de la sede abierta), busca cada equipo por código (o nombre y serie) y completa A.F., marca, modelo, serie, riesgo, registro sanitario y ubicación vacíos (opcional: reemplazar). De los cronogramas en Excel también pasa los meses y semanas marcados (por texto o color de la celda) al año del archivo, sin borrar lo ya programado.
- **Importación por sedes (v33):** *Importar carpeta de la entidad* reconoce las carpetas de cada sede (ej. "A1. SIEMPREE SEDE II") y crea sus servicios con el nombre de la sede. Los documentos generales de cada sede quedan en una subcarpeta con ese nombre. Los mantenimientos correctivos sueltos se asignan al equipo por el código del archivo. Una carpeta como "HOME CARE" se importa como sede propia. Si se importa la misma carpeta otra vez, no se repiten los archivos. En *3. Información del equipo* hay botones por sede; el inventario tiene filtro por sede.
- **Menú en el celular (v34):** franja de íconos siempre visible a la izquierda; se despliega con ☰ o deslizando desde el borde.
- **Cambio de usuario en otra pestaña (v35):** si en el mismo navegador se entra con otro usuario (p. ej. el cliente), las demás pestañas se recargan. Así se evita el aviso "No tiene permiso para esta acción". Para ver al cliente y trabajar como propietario a la vez, use una ventana de incógnito.
- **Cronograma entre dos años (v36):** *Generar desde periodicidad* tiene mes y año de inicio y alcance de 12 o 24 meses. Ejemplo: semestral desde octubre de 2026 → octubre 2026 y abril 2027. Puede completar los equipos ya programados sin borrar lo existente.
- **Carpetas de servicios (v51-52):** las carpetas se muestran al final de cada sede, debajo del último servicio. en *Información del equipo*, el botón *Carpeta de servicios* junto al nombre de cada sede agrupa servicios dentro de una carpeta (ej. EXTRAMURAL con KIT 1, KIT 2…). La carpeta se abre y se cierra, y desde ella se cambian sus servicios o el nombre, o se quita. Los servicios y equipos no se borran. En *Cronograma por servicios*, *Marcar carpeta EXTRAMURAL* marca todos sus servicios de una vez.
- **Editar equipos (v50):** el lápiz ✎ de cada equipo en la lista del servicio, o el que está junto al nombre en la página del equipo, cambia el nombre, código, A.F., marca, modelo, serie, ubicación y servicio.
- **Cronogramas por servicios (v49):** en cada cronograma (mantenimiento, metrología, capacitación), *+ Cronograma por servicios* crea cronogramas separados, por ejemplo GENERAL, EXTRAMURAL o CENTRÍFUGA ALMACÉN. En cada uno se marcan los servicios de cada sede que incluye; dentro de una sede solo aparecen sus servicios. Al elegirlo en la fila *Cronograma:*, la tabla, *Generar desde periodicidad* y el PDF quedan solo con esos servicios. *Guardar en su subcarpeta* deja el PDF en la subcarpeta del mismo nombre (ej. MANTENIMIENTOS PREVENTIVOS › EXTRAMURAL).
- **Eliminar equipos desde el servicio (v48):** en *Información del equipo*, cada equipo de cada servicio tiene una papelera a la derecha. Pide confirmación y borra el equipo con sus documentos. Para conservar el historial, es mejor marcarlo *Dado de baja*.
- **Subcarpetas dentro de subcarpetas (v47):** con una subcarpeta abierta (ej. MANTENIMIENTOS PREVENTIVOS), *+ Subcarpeta aquí* crea otra dentro (ej. 2026), y así sucesivamente. La fila de ruta permite subir y bajar de nivel. Renombrar y eliminar actúan sobre la subcarpeta abierta; al eliminar, los archivos pasan a la subcarpeta de arriba.
- **Eliminar subcarpetas (v46):** elija la subcarpeta y toque *Eliminar subcarpeta*. Puede conservar los archivos, que pasan a la carpeta principal, o eliminarlos escribiendo ELIMINAR. Una subcarpeta vacía se elimina de una vez.
- **Orden de los archivos (v45):** en todas las carpetas los archivos se muestran del más reciente al más antiguo, según la fecha del documento (o la de carga si no tiene). La bitácora de alertas muestra primero la última consulta; el PDF conserva el orden cronológico.
- **Botón Volver (v44):** en cada carpeta, arriba a la izquierda de la ruta, el botón *‹ Volver* regresa a la carpeta anterior (equipo → servicios → sede → entidad → entidades).
- **Eliminar sedes (v43):** la ✕ de la tarjeta de la sede o el botón *Eliminar sede* dentro de ella. Se puede pasar sus servicios, equipos y archivos a otra sede, o eliminarlo todo escribiendo ELIMINAR. Los documentos generales de la entidad no se tocan.
- **Entidad por sedes (v42):** si la entidad tiene dos o más sedes, al abrirla aparecen primero las carpetas de cada sede. Dentro de cada sede está toda la estructura: inventario, cronogramas, información del equipo, lista de chequeo, etc. Cada carpeta muestra solo los equipos y documentos de esa sede, más los documentos generales marcados *Toda la entidad*. Lo que se sube dentro de una sede queda guardado en esa sede. Abajo sigue la vista *Toda la entidad (todas las sedes)*. El botón *+ Sede* agrega una sede aunque aún no tenga servicios (ej. SIEMPREE SEDE TIMBÍO).
- **NO APLICA (v41):** en *Modificar datos* (inventario y cronogramas) el riesgo tiene la opción *NO APLICA* en la lista, y las demás casillas (registro sanitario, serie, etc.) la ofrecen junto a *NO REGISTRA*. Escribir "NA" también la marca. Se muestra igual en la hoja de vida y en los PDF.
- **Filas vacías en blanco (v40):** en los PDF con tabla (inventario FMB-001, cronogramas FMB-002 y bitácora de alertas FT-PGTV-015) las filas sin datos de la última hoja salen en blanco, sin cuadrícula.
- **Cronogramas entre dos años y por servicio (v39):** en mantenimiento, metrología y capacitación hay dos pestañas: *Año (ene – dic)* y *Entre dos años* (ej. oct 2026 – sep 2027, con selector *Desde*). En la segunda se ven y se marcan los meses de los dos años en la misma tabla, y el PDF FMB-002 sale con los meses en ese orden y las dos visitas. El selector *Todos los servicios* filtra por servicio o por sede, también en el PDF. Después de *Generar desde periodicidad* la vista queda en el periodo generado.
- **Cambiar nombres (v38):** el lápiz ✎ de cada carpeta cambia su nombre para la entidad o, si se marca la casilla, para todas las entidades. En las carpetas de equipo aplica a todos los equipos de la entidad. *Nombre original* lo restaura. También se pueden renombrar las subcarpetas (botón *Renombrar subcarpeta*, mueve sus archivos), las sedes (lápiz junto al nombre de la sede en *3. Información del equipo*) y los servicios o consultorios (lápiz de cada servicio).
- **Quitar carpetas por entidad (v37):** la ✕ de cada carpeta o el botón *Carpetas* de la entidad quita las carpetas que esa empresa no usa, de la entidad y de cada equipo. El cliente tampoco las ve. Los archivos no se borran y vuelven si se activa la carpeta. Base de datos: `supabase/carpetas.sql` (columna `entidades.config`, ejecutada el 30/10/2026).

## Versión 30-32 (28-29/10/2026): visor PDF con zoom · enviar por WhatsApp y correo

**Zoom en todos los PDF:** barra con − / +, *Ajustar al ancho*, *Página completa*, porcentajes de 50 % a 400 %, *Pantalla completa*; Ctrl + rueda del mouse, Ctrl + / Ctrl − / Ctrl 0, y pellizco con dos dedos en celular. La página se vuelve a dibujar en cada zoom para que el texto se vea nítido.

**Enviar documentos:** botón **Enviar** en el visor de todos los PDF (hojas de vida, reportes, cronogramas, inventarios, actas, listas de chequeo…) y en cada archivo de todas las carpetas (ícono de sobre).
- Correo y WhatsApp del destinatario se llenan con los datos de la entidad (y recuerdan el último usado); mensaje editable; el enlace vence en 1, 7 o 30 días.
- **WhatsApp**: abre wa.me con el número (agrega +57 a celulares de 10 dígitos) y el mensaje con el enlace.
- **Gmail**: abre la redacción desde **ibcolgerencia@gmail.com** (cuenta de *Mi empresa*) con destinatario, asunto y mensaje. **Programa de correo**: abre Outlook/Correo del equipo.
- **Compartir el PDF (celular)**: adjunta el archivo mismo a WhatsApp, correo, etc.
- **Copiar enlace**.
- El enlace es seguro y temporal (Supabase Storage): quien lo tenga puede abrir el documento sin usuario hasta que venza. Los PDF generados en pantalla se guardan en `entidad/compartidos/` para poder crear el enlace. Cada envío queda en la **auditoría** (acción ENVIO, canal y destinatario).

## Versión 29 (28/10/2026): Lista de chequeo diaria de limpieza y desinfección (FMB-006 v02)

En cada entidad, carpeta **7. LISTA CHEQUEO LIMPIEZA Y DESINFECCIÓN → Lista de chequeo diaria**:
- Se elige **servicio**, **año** y **mes**; se escribe el **responsable** y su **cargo**. Los **equipos salen del inventario** del servicio y cada día del mes es una columna.
- Se **toca la casilla del día para marcar X** (se guarda sola; tocar de nuevo la quita). Botón **“Marcar X hoy en todos los equipos”**. La tabla se abre en el día de hoy.
- Sábados y domingos en gris y **festivos de Colombia** en naranja (no marcar si no son laborales).
- **Procedimiento, agente recomendado y frecuencia** (diario, después de cada paciente, cada 8 días…) los define IBCOL; la entidad los ve pero no los cambia. Cada mes nuevo copia equipos, textos y responsable del mes anterior.
- **PDF FMB-006** con el diseño del formato; IBCOL puede *Guardar PDF en la carpeta* (subcarpeta del año).
- **La entidad SÍ puede diligenciarla** con su usuario: es la única tabla que el cliente puede escribir, y solo las listas de su propia entidad. Cada marca queda en la auditoría.
- Base de datos: tabla `listas_limpieza` (script `supabase/limpieza.sql`, ya ejecutado el 28/10/2026).

## Versión 28 (28/10/2026): FMB-004 en el asistente de IA · formatos Excel solo para IBCOL

- **Asistente de IA del equipo → “Reporte de mantenimiento preventivo (FMB-004)”**: lee los manuales, fichas técnicas y guías del equipo (y Google), propone pruebas cualitativas, actividades, herramientas y observaciones, y abre el reporte FMB-004 ya diligenciado para revisarlo, firmarlo y guardarlo. Lo propuesto queda como protocolo del equipo para los siguientes reportes.
- **Las entidades no tienen acceso a los formatos en Excel** (.xlsx, .xls, .xlsm, .csv…): todo Excel que se sube queda marcado “no visible para el cliente” (la regla de la base de datos lo bloquea), no aparece en sus carpetas ni en los documentos de la hoja de vida, y el botón *Excel* del inventario solo lo ve el propietario. Los 30 Excel que ya estaban cargados se ocultaron a los clientes el 28/10/2026. IBCOL los sigue viendo y descargando.

## Versión 23-24 (28/10/2026): Comité de tecnovigilancia · Formato acta de reunión FAR-013

En cada entidad: **PROGRAMA DE TECNOVIGILANCIA → panel “Comité de tecnovigilancia · Actas FAR-013” → Nueva acta de comité (FAR-013)**. El PDF se guarda en la subcarpeta de comités de esa carpeta (la que ya existe, ej. *3. COMITES*; si no hay, se crea *3. COMITES*). El formulario trae todas las indicaciones del formato:
- **1. Encuentro:** fecha, tipo (reunión / capacitación / comité, sale con X), hora inicial y final, metodología presencial o virtual, tema, coordinador (por defecto “Ingeniera biomédica - Referente de Tecnovigilancia”), empresa, área o servicio, pre-test y post-test (aplica / no aplica).
- **2. Desarrollo:** *Acta No.* sugerido y editable a mano; objetivo con los **meses** a elegir (el texto se arma solo y se puede editar); orden del día editable (trae los 7 puntos del formato); desarrollo de la reunión con *Traer datos de la app* (alertas sanitarias, eventos adversos y cumplimiento de mantenimiento del periodo) y *Redactar con IA*.
- **3. Asistentes:** nombre, cargo y **firma** (dibujarla en pantalla o cargarla como imagen). Los mismos asistentes salen en la tabla de asistentes y en la **lista de asistencia**.
- **4. Compromisos y cierre:** compromisos por **trimestre** y **año** (listas desplegables), con responsable, actividad y **fecha límite** (calendario); próxima reunión con **fecha y hora**; conclusiones generales.
- **5. Evidencia y anexos:** **fotos** de la reunión; **anexo de alertas sanitarias** del INVIMA por meses, con las consultas registradas en *5. Alertas sanitarias* y la opción de **cargar alertas e informes de seguridad** (PDF o imagen), que se anexan al final del acta.

*Guardar y ver PDF* genera el acta con el diseño del Word (logo IBCOL, “FORMATO ACTA DE REUNIÓN”, logo de la empresa, pie con FAR-013 – Versión 002 – F. ACT 09/01/2024; código, versión y fecha se cambian en *Formatos*) y la guarda en *PROGRAMA DE TECNOVIGILANCIA › 3. COMITES*. Cada acta se puede reabrir, editar (vuelve a generar el PDF), copiar como base de la siguiente o eliminar. El cliente ve y descarga las actas de su entidad.

**Instalación (una vez):** Supabase → *SQL Editor* → pegar y ejecutar `supabase/comites.sql` (crea la tabla `actas_comite` con las mismas reglas de acceso y auditoría que las demás).

## Versión 22 (28/10/2026): búsqueda con Google + IA de Google para cada equipo

**Qué hace.** Con los datos del inventario (equipo, marca, modelo, registro sanitario), la IA de Google (Gemini con *Búsqueda de Google*) busca en internet y prepara:
- **Ficha técnica** → PDF con formato IBCOL en *7. Manual o ficha técnica › FICHA TÉCNICA*.
- **Guía rápida de uso** → PDF en *7. › GUÍA RÁPIDA* (marca el anexo 8.7 de la hoja de vida).
- **Registro sanitario INVIMA** → número, titular, vencimiento y estado; PDF de la consulta en *5. Registro sanitario*. Siempre confirme en consultaregistro.invima.gov.co y guarde el soporte oficial.
- **Manuales del fabricante** → descarga los PDF públicos que encuentre a *7. › OPERACIÓN / MANTENIMIENTO*. Si un sitio no permite la descarga, la app muestra el enlace para bajarlo a mano.
- **Protocolo de mantenimiento preventivo** → pruebas cualitativas, actividades, herramientas y observaciones, guardado en el equipo.
- Opcional: **completa solo los datos vacíos** del inventario y la hoja de vida (fabricante, registro y vencimiento, riesgo, datos técnicos, accesorios, recomendaciones). Nunca reemplaza un dato que ya tenga valor.

**Dónde.** Por equipo: botón *Buscar con Google* en la página del equipo, en sus carpetas y en *Documentos consultables desde la hoja de vida* (se pueden corregir los datos de búsqueda y editar el texto antes de guardar). Para todo el inventario: *1. Inventarios → Buscar con Google*; los equipos con igual nombre, marca y modelo comparten una búsqueda; puede omitir los ya buscados y detener en cualquier momento.

**Reporte de mantenimiento preventivo (FMB-004).** Los reportes nuevos salen pre-llenados con el protocolo del equipo. El botón *Completar con IA (manuales + Google)* lee los manuales, fichas técnicas, guías y la hoja de vida cargados en el equipo (los mismos documentos que usa *Revisar documentos (IA)*), busca en Google y propone pruebas cualitativas, actividades (máx. 12, frases cortas que caben en el formato) y observaciones generales. Revise antes de guardar.

**Instalación (una vez).** Función de Supabase `buscar-equipo` (código en `supabase/functions/buscar-equipo/index.ts`): Supabase → *Edge Functions → Deploy a new function → Via Editor*, nombre `buscar-equipo`, pegar el código, *Deploy*. Usa el mismo secreto `GEMINI_API_KEY` del asistente. Opcional `IA_MODELO_BUSQUEDA` (por defecto `gemini-3.8-flash,gemini-3.6-flash,gemini-2.5-flash,gemini-2.0-flash`). Solo el propietario puede usarla.

**Costo y límites.** La Búsqueda de Google en Gemini tiene una cuota gratuita mensual (en los modelos Gemini 3 o superiores, las primeras 5.000 búsquedas al mes; luego tiene costo por búsqueda) y límites por minuto: la app espera y reintenta sola. Revise el uso en aistudio.google.com. Cada búsqueda tarda 20–60 segundos.

## Versión 21 (28/10/2026): datos editables, buscador de mes, 9.5, firma digital y documentos desde la hoja de vida

**Inventario y cronogramas: modificar datos o poner NO REGISTRA.** En *1. Inventarios* y en los cronogramas de mantenimiento y metrología: botón **Modificar datos** (solo el propietario). Las columnas Ítem, Código inv., N° A.F., Equipo, Marca, Modelo, Serie, Ubicación / área, Riesgo y Registro sanitario quedan como casillas: se cambia el dato y se guarda con Enter o al salir de la casilla. Escriba o elija **NO REGISTRA** (también acepta "NR") cuando el dato no exista; sale así en el inventario FMB-001, el cronograma FMB-002, la hoja de vida y los reportes. El botón **Completar vacíos con NO REGISTRA** llena de una vez las casillas vacías de las columnas elegidas. El cambio se guarda en el equipo, así que se ve igual en inventario, cronogramas y hoja de vida. Hay buscador por código, equipo, marca o serie.

**Cronograma de mantenimiento: buscar por mes y cambiar meses.** Lista *Buscar por mes* (o tocar el nombre del mes en la tabla): muestra solo los equipos con algo en ese mes y solo las semanas de ese mes, con el resumen de programados, ejecutados y no ejecutados. *Ver todo el año* vuelve a las 12 columnas. Se puede filtrar por estado y **Mover** lo programado (no ejecutado) de ese mes a otro mes y semana. El botón ✎ de cada fila abre **Cambiar meses**: se marcan los meses a mano o se calculan con una periodicidad (y se puede guardar esa periodicidad en el equipo). El PDF sale con el filtro aplicado.

**9.5 Recomendaciones para mediciones (cantidad / unidad).** En *Editar hoja de vida → 9.5 Mediciones y recomendaciones*: ¿Aplica / No aplica?, tabla Parámetro · Cantidad (valor o rango) · Unidad, botón *Sugerir según el equipo* (tensiómetro, termohigrómetro, glucómetro, oxímetro, monitor, ECG, desfibrilador, doppler, básculas, autoclave, nevera, incubadora, centrífuga, succión, concentrador, nebulizador, bomba de infusión, lámpara de fotocurado, micropipeta, electrobisturí, ventilador, compresor…) y vista previa de cómo sale en la casilla 9.5. Revise siempre las cantidades con el manual del equipo.

**Firma digital de reportes preventivos y correctivos.** Al guardar un reporte, la casilla *Firmar digitalmente* estampa la firma de quien realizó en la casilla REALIZÓ y escribe al pie: firmado por, fecha y hora, y un **código de verificación** calculado con el contenido del reporte. Si el reporte se modifica después, la lista de reportes muestra *Firma desactualizada* hasta que se vuelva a firmar. El botón de firma de cada reporte permite que quien recibe firme en la pantalla del celular o tableta. (Es una firma electrónica con verificación de integridad para el archivo interno; no equivale a firma digital certificada por una entidad de certificación.)

**Documentos consultables desde la hoja de vida.** La carpeta *1. Hoja de vida* de cada equipo y el visor del PDF (botón *Documentos de soporte*) muestran: **1.1 Registro sanitario**, **3.1/8.3 Factura o contrato**, **9.3 Metrología** (certificados y registros, si aplica), **6.5 Manuales** separados en Operación, Mantenimiento, Guía rápida y Ficha técnica (APLICA / NA) y **8.2 Certificado de importación**. Cada uno con *Consultar* y descargar; el propietario puede *Cargar* el documento ahí mismo y la hoja de vida queda marcada (anexo o manual que aplica). Los clientes solo consultan y descargan.

**Hoja de vida FHVEB-001 nueva.** Se reemplazó el fondo por la plantilla anexa del 28/10/2026 (6.5 Manuales: Operación, Mantenimiento, Guía rápida, Ficha técnica).

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
