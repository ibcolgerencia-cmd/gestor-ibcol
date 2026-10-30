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

- **Importación por sedes (v33):** *Importar carpeta de la entidad* reconoce las carpetas de cada sede (ej. "A1. SIEMPREE SEDE II") y crea sus servicios con el nombre de la sede. Los documentos generales de cada sede quedan en una subcarpeta con ese nombre. Los mantenimientos correctivos sueltos se asignan al equipo por el código del archivo. Una carpeta como "HOME CARE" se importa como sede propia. Si se importa la misma carpeta otra vez, no se repiten los archivos. En *3. Información del equipo* hay botones por sede; el inventario tiene filtro por sede.
- **Menú en el celular (v34):** franja de íconos siempre visible a la izquierda; se despliega con ☰ o deslizando desde el borde.
- **Cambio de usuario en otra pestaña (v35):** si en el mismo navegador se entra con otro usuario (p. ej. el cliente), las demás pestañas se recargan. Así se evita el aviso "No tiene permiso para esta acción". Para ver al cliente y trabajar como propietario a la vez, use una ventana de incógnito.
- **Cronograma entre dos años (v36):** *Generar desde periodicidad* tiene mes y año de inicio y alcance de 12 o 24 meses. Ejemplo: semestral desde octubre de 2026 → octubre 2026 y abril 2027. Puede completar los equipos ya programados sin borrar lo existente.
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
