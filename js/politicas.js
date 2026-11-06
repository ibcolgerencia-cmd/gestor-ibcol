// =====================================================================
//  POLÍTICAS DE PRIVACIDAD DE DATOS Y DE SEGURIDAD DE LA INFORMACIÓN / ELECTRÓNICA
//  - Política de Tratamiento de Datos Personales (Ley 1581 de 2012, Decreto 1074 de 2015)
//  - Aviso de privacidad
//  - Política de Seguridad de la Información y Seguridad Electrónica
//  Se usa dentro del gestor (vista "Privacidad y seguridad" + aceptación al ingresar)
//  y en la página pública politicas.html (enlace en la pantalla de ingreso).
// =====================================================================
(() => {
  const VERSION = '1.0';
  const FECHA = '2026-11-05';
  const FECHA_TXT = '5 de noviembre de 2026';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const datosResp = (e) => {
    e = { ...(window.CAT?.EMPRESA || {}), ...(e || {}) };
    return {
      nombre: e.razon_social || e.nombre || 'IBCOL Ingeniería Biomédica de Colombia',
      nit: e.nit || '',
      dir: [e.direccion, e.ciudad].filter(Boolean).join(', ') || 'Carrera 39 # 6B-22, Popayán - Cauca',
      tel: [e.telefono, e.telefono2].filter(Boolean).join(' - ') || '3146872775',
      correo: e.correo || e.email || 'ibcolgerencia@gmail.com',
    };
  };

  const encabezado = (titulo, codigo, r) => `<header class="pol-head"><h2>${titulo}</h2>
    <p class="pol-meta"><b>${esc(r.nombre)}</b>${r.nit ? ` · NIT ${esc(r.nit)}` : ''} · Código ${codigo} · Versión ${VERSION} · Vigente desde el ${FECHA_TXT}</p></header>`;

  // ------------------------------------------------------------------ 1. POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES
  const tratamiento = (r) => `${encabezado('Política de Tratamiento de Datos Personales', 'PL-PDP-001', r)}
  <h3>1. Identificación del responsable</h3>
  <table class="pol-t"><tr><th>Responsable</th><td>${esc(r.nombre)}${r.nit ? ` · NIT ${esc(r.nit)}` : ''}</td></tr><tr><th>Domicilio y dirección</th><td>${esc(r.dir)}</td></tr>
  <tr><th>Correo electrónico</th><td>${esc(r.correo)}</td></tr><tr><th>Teléfonos</th><td>${esc(r.tel)}</td></tr>
  <tr><th>Área responsable de peticiones, consultas y reclamos</th><td>Gerencia de ${esc(r.nombre)} (canal: ${esc(r.correo)})</td></tr></table>

  <h3>2. Objeto y alcance</h3>
  <p>Esta política establece cómo ${esc(r.nombre)} (en adelante <b>IBCOL</b>) recolecta, almacena, usa, circula, suprime y en general trata los datos personales que conoce en desarrollo de sus servicios de ingeniería biomédica y por medio del <b>Gestor Biomédico IBCOL</b> (aplicación web y su base de datos). Aplica a todas las bases de datos y archivos, físicos y digitales, que contengan datos personales tratados por IBCOL, sea como Responsable o como Encargado del tratamiento.</p>

  <h3>3. Marco normativo</h3>
  <ul>
    <li><b>Colombia:</b> artículos 15 y 20 de la Constitución Política; Ley Estatutaria 1581 de 2012 (régimen general de protección de datos personales); Decreto Único Reglamentario 1074 de 2015, Parte 2, Título 2, Capítulos 25 y 26 (compila los Decretos 1377 de 2013 y 886 de 2014); Decreto 090 de 2018 (Registro Nacional de Bases de Datos); Circular Única de la Superintendencia de Industria y Comercio (SIC), Título V; Ley 527 de 1999 (mensajes de datos y comercio electrónico); Ley 1273 de 2009 (delitos informáticos); Ley 962 de 2005, art. 28 (conservación de documentos); Resolución 3100 de 2019 del Ministerio de Salud (estándar de dotación de la habilitación) y Resolución 4816 de 2008 (Programa Nacional de Tecnovigilancia).</li>
    <li><b>Referentes internacionales</b> que IBCOL adopta como buenas prácticas: Reglamento General de Protección de Datos de la Unión Europea (RGPD, Reglamento (UE) 2016/679), normas ISO/IEC 27001 y 27002 (seguridad de la información), ISO/IEC 27701 (gestión de la privacidad), ISO 27799 (seguridad de la información en salud) e ISO 13485 (registros y trazabilidad de dispositivos médicos).</li>
  </ul>
  <p class="pol-nota">En el Congreso de la República cursan iniciativas para actualizar la Ley 1581 de 2012. Si se aprueba una reforma, esta política se ajustará y se informará a los titulares.</p>

  <h3>4. Definiciones (art. 3 de la Ley 1581 de 2012 y Decreto 1074 de 2015)</h3>
  <ul>
    <li><b>Titular:</b> persona natural cuyos datos personales son objeto de tratamiento.</li>
    <li><b>Dato personal:</b> cualquier información vinculada o que pueda asociarse a una o varias personas naturales determinadas o determinables.</li>
    <li><b>Dato sensible:</b> el que afecta la intimidad del titular o cuyo uso indebido puede generar discriminación, como los datos relativos a la salud y los datos biométricos.</li>
    <li><b>Autorización:</b> consentimiento previo, expreso e informado del titular para el tratamiento de sus datos.</li>
    <li><b>Base de datos:</b> conjunto organizado de datos personales objeto de tratamiento.</li>
    <li><b>Responsable del tratamiento:</b> quien decide sobre la base de datos y/o el tratamiento de los datos.</li>
    <li><b>Encargado del tratamiento:</b> quien realiza el tratamiento por cuenta del Responsable.</li>
    <li><b>Tratamiento:</b> cualquier operación sobre datos personales: recolección, almacenamiento, uso, circulación o supresión.</li>
    <li><b>Transferencia:</b> envío de datos a un receptor que es Responsable, dentro o fuera del país. <b>Transmisión:</b> comunicación de datos a un Encargado para que los trate por cuenta del Responsable.</li>
    <li><b>Aviso de privacidad:</b> comunicación que informa al titular sobre la existencia de esta política, la forma de acceder a ella y las finalidades del tratamiento.</li>
  </ul>

  <h3>5. Principios</h3>
  <p>IBCOL aplica los principios del artículo 4 de la Ley 1581 de 2012: <b>legalidad</b>, <b>finalidad</b> (solo para fines legítimos informados al titular), <b>libertad</b> (solo con autorización o por mandato legal), <b>veracidad o calidad</b>, <b>transparencia</b>, <b>acceso y circulación restringida</b> (solo personas autorizadas), <b>seguridad</b> (medidas técnicas, humanas y administrativas) y <b>confidencialidad</b> (reserva aun después de terminada la relación). Adicionalmente aplica los principios de <b>minimización</b> de datos y <b>responsabilidad demostrada</b> (accountability).</p>

  <h3>6. Calidad en la que actúa IBCOL</h3>
  <ul>
    <li><b>Como Responsable:</b> datos de sus clientes y contactos comerciales, de los usuarios del gestor, de su personal, contratistas e ingenieros biomédicos (hojas de vida profesionales), y de las personas que reportan daños de equipos.</li>
    <li><b>Como Encargado:</b> datos personales que las entidades de salud clientes (IPS, consultorios y demás prestadores) registran o entregan a IBCOL para la gestión de su tecnología biomédica: nombres, cargos y firmas de su personal en actas, capacitaciones, listas de chequeo, reportes de mantenimiento y de tecnovigilancia. En este caso la entidad cliente es la Responsable y le corresponde obtener la autorización de sus trabajadores y colaboradores; IBCOL trata esos datos solo conforme a sus instrucciones y al contrato de prestación de servicios.</li>
  </ul>

  <h3>7. Datos personales que se tratan</h3>
  <ul>
    <li>Identificación y contacto: nombres, número de identificación, cargo, entidad, sede, servicio, teléfono, correo y dirección.</li>
    <li>Credenciales de acceso: usuario y contraseña. La contraseña se almacena cifrada de forma irreversible por el proveedor de autenticación; IBCOL no la conoce ni la puede ver.</li>
    <li>Firmas manuscritas digitalizadas (trazadas en pantalla o cargadas como imagen) para firmar documentos.</li>
    <li>Datos de formación: asistencia a capacitaciones, resultados de pre-test y pos-test.</li>
    <li>Datos profesionales de ingenieros y técnicos: formación, matrícula profesional, inscripción INVIMA, experiencia.</li>
    <li>Registros de uso y auditoría: usuario, fecha y hora, acción realizada y documento o registro afectado.</li>
    <li>Datos de quien reporta un daño: nombre, celular y descripción del evento.</li>
  </ul>
  <p><b>Datos sensibles y datos de pacientes.</b> El gestor <b>no es una historia clínica</b> ni está destinado a almacenar datos de salud de pacientes. Cuando un reporte de tecnovigilancia o de evento adverso requiera referirse a un paciente, se usarán únicamente datos codificados o seudonimizados (por ejemplo, iniciales, edad y sexo), sin documento de identidad, de acuerdo con los formatos del Programa Nacional de Tecnovigilancia. El titular no está obligado a autorizar el tratamiento de datos sensibles. IBCOL no trata de manera intencional datos de niños, niñas y adolescentes.</p>

  <h3>8. Finalidades del tratamiento</h3>
  <ol>
    <li>Prestar los servicios de ingeniería biomédica contratados: inventarios, hojas de vida de equipos, cronogramas, mantenimientos preventivos y correctivos, metrología, capacitación, tecnovigilancia, alertas sanitarias, indicadores y documentación del estándar de dotación de la Resolución 3100 de 2019.</li>
    <li>Crear, administrar y proteger las cuentas de usuario del gestor y controlar el acceso de cada entidad a su propia carpeta.</li>
    <li>Firmar electrónicamente y dejar trazabilidad de los documentos generados (actas, reportes, listas de chequeo, capacitaciones).</li>
    <li>Atender reportes de daño, solicitudes de soporte, peticiones, quejas y reclamos, y comunicarse con los usuarios por teléfono, mensaje de texto, WhatsApp o correo electrónico.</li>
    <li>Elaborar cotizaciones, facturas y cuentas de cobro, y cumplir obligaciones contables, tributarias y legales.</li>
    <li>Atender requerimientos de autoridades sanitarias (secretarías de salud, INVIMA, Superintendencia Nacional de Salud) y de auditorías y visitas de habilitación.</li>
    <li>Mantener registros de auditoría y seguridad, prevenir fraudes y accesos no autorizados, y gestionar incidentes.</li>
    <li>Elaborar estadísticas e indicadores de gestión, preferiblemente con datos agregados o anonimizados.</li>
  </ol>

  <h3>9. Derechos de los titulares (art. 8 de la Ley 1581 de 2012)</h3>
  <ul>
    <li>Conocer, actualizar y rectificar sus datos personales.</li>
    <li>Solicitar prueba de la autorización otorgada, salvo cuando no se requiera.</li>
    <li>Ser informado, previa solicitud, del uso que se ha dado a sus datos.</li>
    <li>Presentar quejas ante la Superintendencia de Industria y Comercio, una vez agotado el trámite de consulta o reclamo ante IBCOL.</li>
    <li>Revocar la autorización y/o solicitar la supresión de sus datos, cuando no exista un deber legal o contractual de conservarlos.</li>
    <li>Acceder en forma gratuita a sus datos, al menos una vez cada mes calendario y cada vez que existan modificaciones sustanciales de esta política.</li>
  </ul>

  <h3>10. Deberes de IBCOL</h3>
  <p>Como Responsable, IBCOL cumple los deberes del artículo 17 de la Ley 1581 de 2012; como Encargado, los del artículo 18. Entre ellos: garantizar el ejercicio del derecho de hábeas data, conservar la prueba de la autorización, informar la finalidad, conservar la información con las condiciones de seguridad necesarias, actualizar y rectificar los datos, tramitar consultas y reclamos en los términos legales, informar a la SIC cuando se presenten violaciones a los códigos de seguridad y existan riesgos en la administración de la información, y cumplir las instrucciones de la SIC.</p>

  <h3>11. Autorización</h3>
  <p>La autorización se obtiene de forma previa, expresa e informada por medios que permitan su consulta posterior: la casilla de aceptación al ingresar al gestor, la casilla del formulario de reporte de daño, formatos físicos o digitales firmados, o conductas inequívocas del titular. El sistema registra la aceptación con usuario, fecha, hora y versión de la política. No se requiere autorización en los casos del artículo 10 de la Ley 1581 de 2012 (por ejemplo, información requerida por una entidad pública en ejercicio de sus funciones legales, datos de naturaleza pública o urgencia médica o sanitaria).</p>

  <h3>12. Procedimiento para consultas y reclamos</h3>
  <p><b>Canal:</b> correo electrónico <b>${esc(r.correo)}</b>, teléfono ${esc(r.tel)} o comunicación escrita en ${esc(r.dir)}. La solicitud debe incluir la identificación del titular (o de su representante o causahabiente), la descripción de lo solicitado, la dirección o correo para la respuesta y los documentos que se quieran hacer valer.</p>
  <ul>
    <li><b>Consultas</b> (art. 14): se responden en un máximo de <b>diez (10) días hábiles</b> desde su recibo. Si no es posible, se informan los motivos y se responde a más tardar dentro de los <b>cinco (5) días hábiles</b> siguientes al vencimiento del primer término.</li>
    <li><b>Reclamos</b> de corrección, actualización, supresión o por incumplimiento (art. 15): se atienden en un máximo de <b>quince (15) días hábiles</b>, prorrogables hasta por <b>ocho (8) días hábiles</b> más, informando los motivos. Si el reclamo está incompleto, se pide subsanarlo dentro de los cinco (5) días siguientes; si pasan dos (2) meses sin que se subsane, se entiende desistido. Dentro de los dos (2) días hábiles siguientes al recibo del reclamo completo, se marca el dato con la leyenda «reclamo en trámite» hasta que se decida.</li>
    <li>Cuando IBCOL actúa como Encargado, trasladará la solicitud a la entidad Responsable y apoyará su respuesta.</li>
  </ul>

  <h3>13. Transmisión y transferencia de datos, incluida la internacional</h3>
  <p>Para operar el gestor, IBCOL usa proveedores tecnológicos que actúan como Encargados y pueden alojar o procesar los datos fuera de Colombia: servicios en la nube de base de datos, autenticación y almacenamiento de archivos (Supabase), alojamiento de la aplicación web (GitHub Pages) y servicios de inteligencia artificial y búsqueda de Google (Gemini), además de los servicios de mensajería y correo que el usuario decida utilizar para enviar documentos. Estas transmisiones se realizan conforme al artículo 26 de la Ley 1581 de 2012 y al artículo 2.2.2.25.5.2 del Decreto 1074 de 2015, bajo los términos contractuales y acuerdos de tratamiento de datos de dichos proveedores, que los obligan a usar los datos solo para prestar el servicio y a protegerlos. IBCOL no vende ni cede datos personales a terceros con fines comerciales.</p>

  <h3>14. Seguridad de la información</h3>
  <p>IBCOL aplica las medidas descritas en su <b>Política de Seguridad de la Información y Seguridad Electrónica (PL-SI-002)</b>, que hace parte integral de esta política.</p>

  <h3>15. Conservación de los datos</h3>
  <p>Los datos se conservan durante la relación con el titular o con la entidad cliente y por el tiempo adicional que exijan las finalidades y las normas aplicables: por ejemplo, la documentación de cada equipo biomédico durante toda su vida útil y la que se requiera para la habilitación del servicio, y los soportes contables y comerciales durante diez (10) años (art. 28 de la Ley 962 de 2005). Cumplidos esos plazos, los datos se suprimen o se anonimizan. Al terminar el contrato, la entidad cliente puede descargar su carpeta completa y solicitar la supresión de su información.</p>

  <h3>16. Registro Nacional de Bases de Datos</h3>
  <p>IBCOL inscribirá sus bases de datos en el Registro Nacional de Bases de Datos (RNBD) administrado por la SIC cuando le sea exigible según el Decreto 090 de 2018 (sociedades y entidades sin ánimo de lucro con activos totales superiores a 100.000 UVT y personas jurídicas de naturaleza pública), y lo mantendrá actualizado.</p>

  <h3>17. Vigencia y modificaciones</h3>
  <p>Esta política rige desde el ${FECHA_TXT} (versión ${VERSION}). Las bases de datos tendrán la vigencia de las finalidades descritas. Cualquier cambio sustancial se comunicará a los titulares en el gestor y por los canales de contacto antes de su aplicación, y cuando afecte la finalidad del tratamiento se solicitará una nueva autorización.</p>`;

  // ------------------------------------------------------------------ 2. AVISO DE PRIVACIDAD
  const aviso = (r) => `${encabezado('Aviso de privacidad', 'AV-PDP-001', r)}
  <p><b>${esc(r.nombre)}</b>${r.nit ? `, NIT ${esc(r.nit)}` : ''}, con domicilio en ${esc(r.dir)}, correo ${esc(r.correo)} y teléfono ${esc(r.tel)}, es <b>Responsable</b> del tratamiento de los datos personales que usted suministra al usar el Gestor Biomédico IBCOL, y <b>Encargado</b> de los datos que las entidades de salud clientes registran en él.</p>
  <p><b>Finalidades:</b> prestar los servicios de ingeniería biomédica y de gestión documental del estándar de dotación; administrar su cuenta y su acceso a la carpeta de su entidad; firmar electrónicamente y dar trazabilidad a los documentos; atender reportes de daño, solicitudes y reclamos; comunicarnos con usted; cumplir obligaciones legales y requerimientos de autoridades; y mantener la seguridad del sistema.</p>
  <p><b>Sus derechos:</b> conocer, actualizar, rectificar y suprimir sus datos, solicitar prueba de la autorización, ser informado del uso de sus datos, revocar la autorización y presentar quejas ante la Superintendencia de Industria y Comercio (art. 8 de la Ley 1581 de 2012). Las respuestas a preguntas sobre datos sensibles son facultativas.</p>
  <p><b>Cómo ejercerlos:</b> escriba a <b>${esc(r.correo)}</b>. Consultas: respuesta en máximo 10 días hábiles; reclamos: máximo 15 días hábiles.</p>
  <p><b>Transmisión internacional:</b> los datos se alojan y procesan en servicios en la nube de proveedores que pueden estar fuera de Colombia, bajo acuerdos que los obligan a protegerlos.</p>
  <p>Puede consultar la <b>Política de Tratamiento de Datos Personales (PL-PDP-001)</b> y la <b>Política de Seguridad de la Información y Seguridad Electrónica (PL-SI-002)</b> en el menú «Privacidad y seguridad» del gestor o en la página de políticas enlazada en la pantalla de ingreso.</p>`;

  // ------------------------------------------------------------------ 3. POLÍTICA DE SEGURIDAD DE LA INFORMACIÓN Y SEGURIDAD ELECTRÓNICA
  const seguridad = (r) => `${encabezado('Política de Seguridad de la Información y Seguridad Electrónica', 'PL-SI-002', r)}
  <h3>1. Objetivo</h3>
  <p>Proteger la <b>confidencialidad</b>, <b>integridad</b>, <b>disponibilidad</b> y <b>trazabilidad</b> de la información que IBCOL gestiona en el Gestor Biomédico IBCOL —documentación de la tecnología biomédica de las entidades de salud y datos personales—, y establecer las reglas para el uso seguro de los medios electrónicos, los mensajes de datos y las firmas electrónicas.</p>

  <h3>2. Alcance</h3>
  <p>Aplica a la aplicación web, su base de datos y almacenamiento de archivos, los documentos que se generan, cargan, firman, descargan o comparten desde ella, y a todas las personas que la usan: personal y contratistas de IBCOL (usuario propietario o administrador) y usuarios de las entidades cliente.</p>

  <h3>3. Marco de referencia</h3>
  <ul>
    <li><b>Colombia:</b> Ley 1581 de 2012 (principio de seguridad y deberes de los arts. 17 y 18); Circular Única de la SIC, Título V (reporte de incidentes de seguridad); Ley 527 de 1999 (validez de los mensajes de datos y de la firma electrónica); Decreto 1074 de 2015, que compila el Decreto 2364 de 2012 (firma electrónica); Ley 1273 de 2009 (delitos informáticos); Política Nacional de Confianza y Seguridad Digital (CONPES 3995 de 2020); Modelo de Seguridad y Privacidad de la Información (MSPI) de MinTIC como guía.</li>
    <li><b>Internacional:</b> ISO/IEC 27001 y 27002 (sistema de gestión y controles de seguridad de la información), ISO 27799 (seguridad de la información en salud), ISO/IEC 27701 (privacidad), ISO 13485 (control de registros de dispositivos médicos) y, como referencia de buenas prácticas para registros y firmas electrónicas, el Título 21 CFR Parte 11 de la FDA.</li>
  </ul>

  <h3>4. Roles y responsabilidades</h3>
  <ul>
    <li><b>Usuario propietario (administrador IBCOL):</b> único perfil que crea, modifica y elimina entidades, equipos, documentos y formatos; gestiona usuarios y permisos; firma documentos como prestador; descarga la carpeta completa de una entidad; consulta la auditoría.</li>
    <li><b>Usuario cliente (entidad):</b> consulta y descarga únicamente la documentación de su propia entidad, reporta daños de equipos y diligencia los formularios que IBCOL habilite. No puede modificar formatos ni documentos de IBCOL.</li>
    <li><b>Usuario de calidad (portal del área de calidad):</b> acceso independiente por entidad, con usuario y contraseña propios, que solo permite diligenciar la lista de chequeo de limpieza y desinfección y reportar daños de equipos. No puede ver documentos, hojas de vida ni el resto de la carpeta de la entidad.</li>
    <li><b>Todos los usuarios:</b> custodian sus credenciales, usan la información solo para los fines autorizados y reportan de inmediato cualquier incidente o sospecha.</li>
  </ul>

  <h3>5. Control de acceso</h3>
  <ul>
    <li>Cada persona tiene un <b>usuario y una contraseña personales e intransferibles</b>. Está prohibido compartir cuentas.</li>
    <li>Las contraseñas se almacenan cifradas de forma irreversible (función hash) por el servicio de autenticación; nadie en IBCOL puede verlas. Si se olvidan, se asigna una nueva.</li>
    <li><b>Aislamiento por entidad:</b> la base de datos aplica reglas de seguridad a nivel de fila (Row Level Security), de modo que cada usuario cliente solo puede leer la información de su entidad, aunque intente acceder a otra.</li>
    <li><b>Mínimo privilegio:</b> cada perfil tiene solo los permisos necesarios para su función.</li>
    <li><b>Cierre automático de sesión</b> tras 30 minutos de inactividad.</li>
    <li>Los accesos se revocan cuando termina la relación con el usuario o con la entidad.</li>
    <li><b>Contraseñas:</b> el gestor exige mínimo 8 caracteres combinando letras y números, y rechaza contraseñas fáciles de adivinar. Tras 5 intentos fallidos de ingreso, el acceso se bloquea temporalmente por 5 minutos en ese dispositivo.</li>
    <li>Contraseñas recomendadas: mínimo 10 caracteres, con mayúsculas, minúsculas, números y símbolos; no reutilizar contraseñas de otros servicios; cambiarla de inmediato si se sospecha que fue conocida por otra persona.</li>
  </ul>

  <h3>6. Protección de la información en tránsito y almacenada</h3>
  <ul>
    <li>Toda la comunicación entre el navegador y los servidores viaja cifrada mediante <b>HTTPS (TLS)</b>.</li>
    <li>La información se almacena en infraestructura en la nube del proveedor, con cifrado en reposo y controles de acceso físico y lógico del proveedor.</li>
    <li>Los documentos compartidos por WhatsApp o correo se envían mediante <b>enlaces seguros y temporales</b> que vencen (1, 7 o 30 días), en lugar de dejar los archivos públicos.</li>
    <li>Las entidades no tienen acceso a los formatos editables (Excel) de IBCOL; solo a los documentos finales en PDF.</li>
    <li><b>Protección contra virus y archivos maliciosos:</b> el gestor rechaza programas, scripts, páginas web, archivos comprimidos y documentos de Office con macros; verifica que el contenido de cada PDF, imagen o documento de Office corresponda realmente a su tipo; y limita el tamaño de cada archivo a 60 MB.</li>
    <li><b>Protección de la aplicación web:</b> política de seguridad de contenido (CSP) que solo permite cargar código desde los orígenes autorizados, protección contra la inserción del gestor en páginas de terceros (clickjacking), escape de todo texto ingresado por los usuarios para evitar inyección de código, y reglas de acceso en la base de datos que se aplican en el servidor aunque alguien manipule el navegador.</li>
  </ul>

  <h3>7. Trazabilidad y auditoría</h3>
  <p>El gestor registra de forma automática quién creó, modificó, eliminó, firmó o descargó un registro o documento, con fecha y hora y, en las modificaciones, el valor anterior y el nuevo. Los usuarios cliente no pueden alterar este registro. El propietario lo consulta en el módulo «Auditoría», y los datos anteriores permiten recuperar información borrada por error.</p>

  <h3>8. Firma electrónica y mensajes de datos</h3>
  <ul>
    <li>El gestor permite firmar documentos con <b>firma electrónica</b>: la firma manuscrita trazada en pantalla o cargada como imagen se vincula al usuario autenticado, al documento y a la fecha, y queda registrada en la auditoría.</li>
    <li>De acuerdo con la Ley 527 de 1999 y el Decreto 1074 de 2015, los mensajes de datos y documentos electrónicos tienen validez y fuerza probatoria, y la firma electrónica tiene los mismos efectos de la firma manuscrita cuando el método usado es confiable y apropiado para el fin. La confiabilidad se apoya en la autenticación individual, el control de acceso y la trazabilidad descritos en esta política.</li>
    <li>La firma electrónica del gestor <b>no es una firma digital certificada</b> (art. 28 de la Ley 527 de 1999). Cuando una norma o una autoridad exija firma digital, se usará un certificado expedido por una entidad de certificación acreditada ante el ONAC.</li>
    <li>Cada usuario es responsable del uso de su firma; está prohibido usar la firma de otra persona.</li>
  </ul>

  <h3>9. Integridad y control de documentos</h3>
  <ul>
    <li>Los documentos se generan sobre formatos controlados de IBCOL (código, versión y fecha) y con consecutivos únicos; solo el propietario puede modificar los formatos.</li>
    <li>Los documentos y registros se organizan por entidad, sede, servicio y equipo, y se ordenan por fecha para conservar la historia de cada equipo (hoja de vida, mantenimientos, metrología, tecnovigilancia).</li>
    <li>Los registros históricos de equipos no se eliminan sin dejar rastro: las eliminaciones quedan en la auditoría con los datos anteriores.</li>
  </ul>

  <h3>10. Copias de respaldo y continuidad</h3>
  <ul>
    <li>IBCOL realiza copias de respaldo periódicas de la información de cada entidad con la función «Descargar carpeta» (recomendado al menos mensualmente y antes de cambios importantes), y las guarda en un medio seguro y separado.</li>
    <li>Cuando el plan del proveedor de nube lo incluya, se usan además sus copias automáticas de la base de datos.</li>
    <li>Ante una falla del servicio, IBCOL restablece la información desde la última copia disponible e informa a las entidades afectadas.</li>
  </ul>

  <h3>11. Gestión de incidentes de seguridad</h3>
  <ol>
    <li>Cualquier usuario que detecte o sospeche un incidente (acceso no autorizado, pérdida de información, contraseña expuesta, documento enviado por error) debe reportarlo de inmediato a <b>${esc(r.correo)}</b> o al ${esc(r.tel)}.</li>
    <li>IBCOL contiene el incidente: bloquea o cambia credenciales, revoca enlaces compartidos y revisa la auditoría.</li>
    <li>Evalúa el impacto e informa sin demora a las entidades cliente afectadas (cuando actúa como Encargado) y a los titulares cuando exista riesgo para sus derechos.</li>
    <li>Cuando el incidente afecte datos personales, lo reporta a la Superintendencia de Industria y Comercio dentro de los <b>quince (15) días hábiles</b> siguientes a su detección, por el Registro Nacional de Bases de Datos o el canal que la SIC disponga, según la Circular Única de la SIC.</li>
    <li>Documenta las causas y las acciones correctivas para evitar que se repita.</li>
  </ol>

  <h3>12. Uso aceptable</h3>
  <p>Está prohibido: compartir credenciales o dejar la sesión abierta en equipos de uso público; intentar acceder a carpetas o información de otras entidades; cargar archivos con virus o software malicioso; registrar datos personales innecesarios, en especial datos de salud de pacientes identificables; alterar, falsificar o suplantar documentos o firmas; y usar la información para fines distintos de los autorizados. Estas conductas pueden constituir delitos según la Ley 1273 de 2009 (por ejemplo, acceso abusivo a un sistema informático, art. 269A, o violación de datos personales, art. 269F).</p>

  <h3>13. Proveedores tecnológicos e inteligencia artificial</h3>
  <ul>
    <li>Los proveedores de nube (base de datos, autenticación, almacenamiento y alojamiento web) se seleccionan considerando sus certificaciones y controles de seguridad, y tratan la información solo para prestar el servicio.</li>
    <li>Cuando el propietario usa las funciones de inteligencia artificial (redacción de documentos, lectura de manuales, facturas o fichas técnicas para completar hojas de vida), el contenido enviado lo procesa el servicio de IA de Google (Gemini) para producir el resultado. No se deben enviar a la IA datos personales sensibles, y todo lo generado debe ser revisado y aprobado por un profesional de IBCOL antes de usarse.</li>
  </ul>

  <h3>14. Seguridad en los dispositivos de los usuarios</h3>
  <p>Use navegadores y sistemas operativos actualizados, con antivirus. No guarde la contraseña en equipos compartidos, cierre la sesión al terminar y no descargue documentos de la entidad en equipos que no sean de confianza. Las carpetas descargadas deben guardarse en lugares con acceso restringido.</p>

  <h3>15. Cumplimiento, revisión y vigencia</h3>
  <p>El incumplimiento de esta política puede dar lugar a la suspensión del acceso y a las acciones contractuales, disciplinarias o legales que correspondan. La política se revisa al menos una vez al año o cuando cambien la normativa, los servicios o la tecnología. Rige desde el ${FECHA_TXT} (versión ${VERSION}).</p>`;

  const DOCS = [
    { k: 'tratamiento', titulo: 'Política de tratamiento de datos personales', html: tratamiento },
    { k: 'seguridad', titulo: 'Política de seguridad de la información y electrónica', html: seguridad },
    { k: 'aviso', titulo: 'Aviso de privacidad', html: aviso },
  ];
  const CSS = `.pol{max-width:900px;line-height:1.55;font-size:.95rem}.pol h2{margin:0 0 4px;font-size:1.35rem}.pol h3{margin:20px 0 6px;font-size:1.02rem;color:var(--pri,#0a7c99)}
    .pol-meta{color:var(--muted,#666);font-size:.85rem;margin:0 0 10px}.pol ul,.pol ol{padding-left:22px}.pol li{margin:3px 0}.pol-nota{font-size:.85rem;color:var(--muted,#666);font-style:italic}
    .pol-t{border-collapse:collapse;width:100%;font-size:.9rem}.pol-t th,.pol-t td{border:1px solid var(--line,#ccc);padding:6px 8px;text-align:left;vertical-align:top}.pol-t th{width:36%;background:var(--soft,#f3f7f9)}`;
  window.POLITICAS = { VERSION, FECHA, DOCS, CSS, datosResp };

  // ------------------------------------------------------------------ impresión / PDF (documento completo)
  const imprimir = (emp, solo = null) => {
    const r = datosResp(emp);
    const docs = DOCS.filter((d) => !solo || d.k === solo);
    const w = window.open('', '_blank'); if (!w) return alert('Permita las ventanas emergentes para descargar el PDF.');
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Políticas de privacidad y seguridad - ${esc(r.nombre)}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;color:#222;margin:0;padding:24px}${CSS}.pol{max-width:none}.doc{page-break-after:always}.doc:last-child{page-break-after:auto}
      .logo{height:60px}@page{size:letter;margin:18mm 16mm}</style></head><body>
      ${docs.map((d) => `<section class="doc pol">${window.IBCOL_LOGO ? `<img class="logo" src="${window.IBCOL_LOGO}" alt="IBCOL">` : ''}${d.html(r)}</section>`).join('')}
      <script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`);
    w.document.close();
  };
  window.POLITICAS.imprimir = imprimir;

  // ------------------------------------------------------------------ dentro del gestor
  const A = window.APP; if (!A || !window.UI) return;
  const { h, toast, modal } = UI; const st = A.st, S = A.S;

  A.V.politicas = async () => {
    const c = A.content(); let tab = 'tratamiento';
    const pintar = () => {
      const r = datosResp(st.emp); const d = DOCS.find((x) => x.k === tab);
      c.innerHTML = `<style>${CSS}</style><div class="page-head"><div><span class="eyebrow">Privacidad y seguridad</span><h1>Políticas de privacidad de datos y seguridad electrónica</h1>
          <p class="muted">Versión ${VERSION} · vigente desde el ${FECHA_TXT}. Ley 1581 de 2012, Decreto 1074 de 2015, Ley 527 de 1999 e ISO/IEC 27001.</p></div>
          <div class="actions"><button class="btn" data-pol-pdf="${tab}">Descargar este documento (PDF)</button><button class="btn pri" data-pol-pdf="">Descargar todas (PDF)</button></div></div>
        <div class="tabs" role="tablist" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">${DOCS.map((x) => `<button class="btn ${x.k === tab ? 'pri' : ''}" data-pol-tab="${x.k}" role="tab" aria-selected="${x.k === tab}">${h(x.titulo)}</button>`).join('')}</div>
        <section class="panel pol">${d.html(r)}</section>
        ${aceptada(st.perfil) ? `<p class="muted" style="margin-top:10px">Usted aceptó estas políticas el ${h(new Date(aceptada(st.perfil)).toLocaleString('es-CO'))} en este dispositivo.</p>` : ''}`;
      c.querySelectorAll('[data-pol-tab]').forEach((b) => (b.onclick = () => { tab = b.dataset.polTab; pintar(); }));
      c.querySelectorAll('[data-pol-pdf]').forEach((b) => (b.onclick = () => imprimir(st.emp, b.dataset.polPdf || null)));
    };
    pintar();
  };

  // aceptación al ingresar (se registra en la auditoría con la versión)
  const clave = (p) => `ibcol_politicas_${VERSION}_${p?.id || p?.usuario || ''}`;
  const aceptada = (p) => { try { return localStorage.getItem(clave(p)); } catch { return null; } };
  A.verificarPoliticas = (p) => {
    if (!p || aceptada(p)) return;
    const r = datosResp(st.emp);
    const m = modal({ titulo: 'Privacidad de datos y seguridad', size: 'wide',
      cuerpo: `<style>${CSS}</style><div class="pol" style="max-height:52vh;overflow:auto;border:1px solid var(--line,#ddd);border-radius:8px;padding:12px 16px">${aviso(r)}</div>
        <p style="margin-top:12px">Para usar el Gestor Biomédico IBCOL lea y acepte la <a href="#" data-pol-ver="tratamiento">Política de Tratamiento de Datos Personales</a> y la <a href="#" data-pol-ver="seguridad">Política de Seguridad de la Información y Seguridad Electrónica</a>.</p>
        <label class="checks radio-line"><input type="checkbox" name="acepto"> <span>He leído y <b>acepto</b> las políticas, y <b>autorizo</b> a ${h(r.nombre)} el tratamiento de mis datos personales para las finalidades informadas.</span></label>`,
      alAbrir: (mm) => mm.body.querySelectorAll('[data-pol-ver]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); imprimir(st.emp, a.dataset.polVer); })),
      acciones: [{ t: 'No acepto', fn: async () => { await S.logout(); st.perfil = null; location.reload(); } },
        { t: 'Aceptar y continuar', cls: 'pri', fn: async (mm) => {
          if (!mm.body.querySelector('[name=acepto]').checked) { toast('Marque la casilla para aceptar las políticas.', true); return false; }
          try { localStorage.setItem(clave(p), new Date().toISOString()); } catch { /* sin almacenamiento local */ }
          try { await S.log('ACEPTA', 'politicas', null, `Aceptó la Política de Tratamiento de Datos (PL-PDP-001) y de Seguridad (PL-SI-002) v${VERSION} – ${p.usuario || p.nombre || ''}`); } catch (e) { console.warn(e); }
          toast('Gracias. Su aceptación quedó registrada.');
        } }] });
    return m;
  };
})();
