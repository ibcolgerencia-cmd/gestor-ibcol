// =====================================================================
//  PROTOCOLOS Y PROGRAMAS · plantillas de referencia (texto base de IBCOL)
//  Cada documento se adapta a la entidad con marcadores {ENTIDAD}, {NIT}…
//  y bloques [[…]] que se llenan con su inventario, sedes y datos propios.
//  El propietario puede cambiar la plantilla de referencia (Formatos) y el
//  texto de cada entidad (pestañas del documento).
// =====================================================================
(() => {
  const A = window.APP;
  const P = (A.PROT = A.PROT || {});

  // ------------------------------------------------------------------ conocimiento por tipo de equipo
  // limpieza y desinfección: [patrón, procedimiento, frecuencia]
  P.KB_LIMPIEZA = [
    [/bal[aá]nza|b[aá]scula|pesa\b|pesabeb/i, 'Retirar el polvo con paño húmedo. Aplicar el desinfectante sobre el paño (no directamente sobre el equipo) y pasar por plataforma, bandeja, display y estructura, de lo más limpio a lo más sucio. Dejar actuar el tiempo de contacto indicado por el fabricante del producto.', 'Diario y después de cada paciente (plataforma / bandeja)'],
    [/tall[ií]metro|infant[oó]metro/i, 'Pasar paño humedecido con el desinfectante por la superficie de contacto y la regla, de lo más limpio a lo más sucio; dejar secar al aire.', 'Diario y después de cada paciente'],
    [/tensi[oó]metro|esfigmo/i, 'Desinfectar brazalete, mangueras, pera y carcasa del manómetro con paño humedecido. No humedecer el interior del manómetro ni de la pera. El brazalete de tela se lava según el fabricante.', 'Diario y después de cada paciente con precauciones de aislamiento'],
    [/pulsiox|ox[ií]metro/i, 'Limpiar el sensor (zona de contacto con el dedo) y la carcasa con paño humedecido en el desinfectante; no sumergir. Retirar baterías si se va a guardar.', 'Después de cada paciente'],
    [/fonendo|estetosc/i, 'Pasar paño humedecido en el desinfectante por diafragma, campana, tubo y olivas; retirar y limpiar las olivas por separado.', 'Después de cada paciente'],
    [/[oó]rganos|otoscop|oftalmosc/i, 'Desinfectar mangos y cabezales con paño humedecido. Los espéculos reutilizables se lavan y desinfectan (o se usan desechables). No aplicar líquido sobre lentes ni bombillo.', 'Después de cada paciente'],
    [/term[oó]metro(?!.*never)/i, 'Limpiar la punta y el cuerpo con paño o torunda humedecida en el desinfectante, de la punta hacia el cuerpo; usar fundas desechables si aplica.', 'Después de cada paciente'],
    [/l[aá]mpara.*(fotocur|curado)/i, 'Limpiar la guía de luz y el cuerpo con paño humedecido, con el equipo apagado; usar barrera protectora desechable por paciente.', 'Después de cada paciente'],
    [/l[aá]mpara|cuello de cisne/i, 'Con el equipo apagado y frío, retirar el polvo y desinfectar brazo, cabezal y base con paño humedecido. No aplicar líquido sobre el bombillo.', 'Diario'],
    [/gluc[oó]metro/i, 'Limpiar la carcasa y la pantalla con paño humedecido en el desinfectante, sin introducir líquido en el puerto de la tira reactiva.', 'Después de cada paciente'],
    [/term[oó]higr|higr[oó]metro|datalogger/i, 'Retirar el polvo y desinfectar la carcasa con paño apenas humedecido; no mojar el sensor.', 'Semanal'],
    [/electrocardi|ecg\b|ekg\b/i, 'Desinfectar cables de paciente, pinzas, peras/electrodos reutilizables y carcasa con paño humedecido; retirar restos de gel.', 'Después de cada paciente; equipo diario'],
    [/monitor/i, 'Desinfectar carcasa, pantalla (con paño apenas humedecido), cables, sensores y brazalete de presión.', 'Diario y después de cada paciente'],
    [/desfibril|\bdea\b/i, 'Limpiar palas y carcasa con paño humedecido; verificar que no queden restos de gel. No mojar conectores.', 'Después de cada uso y en la verificación diaria'],
    [/never.*(transporte|muestra)|cava|termo para/i, 'Vaciar, limpiar el interior y el exterior con paño humedecido en el desinfectante y dejar secar abierta.', 'Después de cada transporte'],
    [/never|refriger|congel|freezer/i, 'Exterior y manijas con paño humedecido. Interior: retirar el contenido a otra nevera, limpiar bandejas y paredes, secar y verificar la temperatura antes de volver a cargar.', 'Exterior diario; interior mensual o ante derrames'],
    [/centr[ií]fug/i, 'Con el equipo apagado y desconectado, limpiar la cámara, el rotor y los portatubos con el desinfectante; secar antes de cerrar. Ante ruptura de tubos, limpiar de inmediato.', 'Diario y ante derrames'],
    [/autoclave|esteriliz/i, 'Exterior con paño humedecido. Cámara y bandejas según el fabricante (agua destilada, sin productos abrasivos); revisar el empaque de la puerta.', 'Exterior diario; cámara semanal'],
    [/incubadora/i, 'Desinfectar el interior y el exterior con el equipo apagado y frío; secar antes de encender.', 'Semanal o ante derrames'],
    [/electrobist|electrocaut|electroquir/i, 'Desinfectar carcasa, cables y lápiz reutilizable con paño humedecido; el electrodo activo se esteriliza o desecha según el fabricante.', 'Después de cada procedimiento'],
    [/negatosc/i, 'Con el equipo apagado, limpiar la pantalla y la carcasa con paño humedecido.', 'Semanal'],
    [/doppler/i, 'Retirar el gel del transductor con paño seco y desinfectar transductor y carcasa con paño humedecido.', 'Después de cada paciente'],
    [/amalgam/i, 'Limpiar la carcasa y la tapa con paño humedecido en el desinfectante.', 'Diario'],
    [/compresor/i, 'Retirar el polvo de la carcasa; purgar el tanque según el fabricante.', 'Semanal (purga diaria si aplica)'],
    [/unidad odont|pieza de mano|piezas de alta|micromotor/i, 'Desinfectar sillón, bandeja, mangueras y escupidera con el desinfectante; piezas de mano: limpieza, lubricación y esterilización según el fabricante; purgar las mangueras.', 'Después de cada paciente'],
    [/scaler|ultras[oó]nic|cavitron/i, 'Desinfectar la pieza de mano y la carcasa; las puntas se esterilizan según el fabricante.', 'Después de cada paciente'],
    [/analizador|hematolog|qu[ií]mica|coagul|ionograma|gases/i, 'Exterior con paño humedecido; limpieza interna y del sistema de muestreo con las soluciones y la rutina del fabricante.', 'Diario o después de cada proceso'],
    [/desionizador|destilador/i, 'Limpiar la carcasa y los recipientes; cambiar filtros según el fabricante.', 'Semanal'],
    [/microscopio/i, 'Retirar el polvo; limpiar oculares y objetivos solo con papel para lentes; la platina y el cuerpo con paño humedecido. Cubrir al terminar.', 'Diario o después de cada proceso'],
    [/micropipet/i, 'Limpiar el cuerpo y el expulsor con paño humedecido en el desinfectante; no sumergir.', 'Diario o después de cada proceso'],
    [/agitador|rotador|mazzini|v[oó]rtex|mezclador/i, 'Limpiar la plataforma y la carcasa con paño humedecido, con el equipo apagado.', 'Diario o después de cada proceso'],
    [/cuenta ?c[eé]lulas|contador/i, 'Limpiar teclas y carcasa con paño humedecido.', 'Diario'],
    [/succion|aspirador/i, 'Desechar el contenido según el manejo de residuos; lavar y desinfectar el frasco, el tapón y las mangueras reutilizables; carcasa con paño humedecido.', 'Después de cada uso'],
    [/nebuliz/i, 'Accesorios de uso individual o desechables; carcasa con paño humedecido.', 'Después de cada paciente'],
    [/camilla|mesa de exam|silla de toma/i, 'Desinfectar la superficie de contacto con el paciente y la estructura con paño humedecido.', 'Después de cada paciente'],
    [/cron[oó]metro|reloj|timer/i, 'Limpiar la carcasa con paño humedecido.', 'Semanal'],
    [/flux[oó]metro|flujometro|man[oó]metro|regulador/i, 'Limpiar el exterior con paño humedecido; el vaso humidificador se lava y desinfecta.', 'Diario'],
  ];
  P.KB_LIMPIEZA_DEF = ['Retirar el polvo y aplicar el desinfectante en el paño (no directamente sobre el equipo); limpiar de lo más limpio a lo más sucio y dejar actuar el tiempo de contacto indicado.', 'Diario'];

  // aseguramiento metrológico: [patrón, magnitudes, tipo (CAL calibración / CLF calificación / VER verificación)]
  P.KB_METRO = [
    [/bal[aá]nza|b[aá]scula|pesa\b|pesabeb/i, 'Masa', 'CAL'],
    [/tall[ií]metro|infant[oó]metro/i, 'Longitud', 'CAL'],
    [/tensi[oó]metro|esfigmo/i, 'Presión', 'CAL'],
    [/pulsiox|ox[ií]metro/i, 'Saturación de oxígeno, frecuencia cardiaca', 'CAL'],
    [/term[oó]higr|higr[oó]metro|datalogger/i, 'Temperatura, humedad relativa', 'CAL'],
    [/term[oó]metro/i, 'Temperatura', 'CAL'],
    [/electrocardi|ecg\b|ekg\b/i, 'Amplitud, frecuencia cardiaca (simulador de ECG)', 'CAL'],
    [/monitor/i, 'ECG, SpO2, presión no invasiva, temperatura', 'CAL'],
    [/desfibril|\bdea\b/i, 'Energía entregada, tiempo de carga', 'CAL'],
    [/doppler/i, 'Frecuencia cardiaca fetal', 'CAL'],
    [/never|refriger|congel|freezer|cava/i, 'Temperatura, tiempo (mapeo térmico)', 'CLF'],
    [/incubadora/i, 'Temperatura, tiempo', 'CLF'],
    [/autoclave|esteriliz/i, 'Temperatura, presión, tiempo', 'CLF'],
    [/centr[ií]fug/i, 'Velocidad (rpm), tiempo', 'CAL'],
    [/micropipet/i, 'Volumen', 'CAL'],
    [/agitador|rotador|mazzini|v[oó]rtex/i, 'Velocidad, tiempo', 'CAL'],
    [/electrobist|electrocaut|electroquir/i, 'Potencia de salida', 'CAL'],
    [/l[aá]mpara.*(fotocur|curado)/i, 'Irradiancia', 'CAL'],
    [/gluc[oó]metro/i, 'Concentración de glucosa (solución control)', 'VER'],
    [/analizador|hematolog|qu[ií]mica|coagul/i, 'Evaluación de desempeño (control interno y externo)', 'VER'],
    [/cron[oó]metro|reloj|timer/i, 'Tiempo', 'CAL'],
    [/flux[oó]metro|flujometro/i, 'Flujo', 'CAL'],
    [/man[oó]metro|vacu[oó]metro|succion|aspirador/i, 'Presión / vacío', 'CAL'],
  ];
  P.TIPO_METRO = { CAL: 'Calibración', CLF: 'Calificación', VER: 'Verificación' };

  // ------------------------------------------------------------------ marcadores y bloques
  P.MARCADORES = [['{ENTIDAD}', 'Razón social'], ['{NIT}', 'NIT'], ['{CIUDAD}', 'Ciudad'], ['{DIRECCION}', 'Dirección'], ['{REPRESENTANTE}', 'Representante legal'], ['{SEDES}', 'Sedes de la entidad'], ['{SERVICIOS}', 'Servicios / áreas'], ['{N_EQUIPOS}', 'Equipos activos'], ['{DESINFECTANTE}', 'Desinfectante principal'], ['{RESPONSABLE}', 'Ingeniero(a) biomédico(a) de IBCOL'], ['{EMPRESA}', 'IBCOL'], ['{TELEFONO_IBCOL}', 'Teléfonos de IBCOL'], ['{CORREO_IBCOL}', 'Correo de IBCOL'], ['{ANIO}', 'Año vigente']];
  P.BLOQUES = {
    INVENTARIO: 'Resumen del inventario por sede y servicio',
    EQUIPOS_RIESGO: 'Equipos por tipo y clasificación de riesgo',
    PERIODICIDAD: 'Periodicidad de mantenimiento y metrología por tipo de equipo',
    CONDICIONES: 'Condiciones ambientales controladas (puntos de temperatura y humedad)',
    LIMPIEZA_EQUIPOS: 'Tabla de limpieza y desinfección por equipo de la entidad',
    DESINFECTANTES: 'Productos de limpieza y desinfección (registro sanitario, uso)',
    METROLOGIA_EQUIPOS: 'Equipos que aplican aseguramiento metrológico y magnitudes',
    GLUCOMETROS: 'Glucómetros de la entidad',
    RANGOS_GLUCO: 'Rangos de las soluciones control',
    PASOS_GLUCO: 'Tabla qué / quién / cómo / cuándo / dónde del control de calidad',
    TEMAS_CAPACITACION: 'Temas de capacitación según la tecnología de la entidad',
    CRONOGRAMA_CAP: 'Cronograma anual de capacitación (FT-CCC-012)',
    INDICADORES_MTTO: 'Fichas de indicadores de mantenimiento',
    INDICADORES_CAP: 'Fichas de indicadores de capacitación',
    PASOS_ADQ: 'Flujo de adquisición: qué / quién / cómo / cuándo',
    MATRIZ_PRIORIDAD: 'Matriz de priorización de compra',
    SUFICIENCIA: 'Cálculo de suficiencia por servicio y equipo',
    CRITERIOS_SUFICIENCIA: 'Criterios de interpretación de la suficiencia',
    CICLO: 'Diagrama del ciclo de gestión de la tecnología',
    FLUJO_CORRECTIVO: 'Flujograma del mantenimiento correctivo',
    CAMBIOS: 'Control de cambios y firmas (elaboró, revisó, aprobó)',
  };

  const NORMAS_BASE = `- Ley 9 de 1979 (Código Sanitario Nacional): medidas sanitarias sobre la dotación y los dispositivos de uso en salud.
- Ley 100 de 1993, artículo 189: las instituciones hospitalarias destinan recursos al mantenimiento de la infraestructura y la dotación.
- Decreto 1769 de 1994 y Decreto 1617 de 1995: mantenimiento hospitalario, alcance y destinación de recursos.
- Resolución 4445 de 1996: condiciones sanitarias de los establecimientos hospitalarios.
- Circular Externa 029 de 1997 de la Superintendencia Nacional de Salud: inspección, vigilancia y control del mantenimiento hospitalario.
- Decreto 4725 de 2005: régimen de registros sanitarios, permiso de comercialización y vigilancia sanitaria de los dispositivos médicos.
- Resolución 4816 de 2008: Programa Nacional de Tecnovigilancia.
- Decreto 780 de 2016: Decreto Único Reglamentario del Sector Salud (Sistema Obligatorio de Garantía de Calidad).
- Resolución 3100 de 2019: procedimientos y condiciones de inscripción y habilitación de los prestadores de servicios de salud (estándar de dotación).`;

  const CAMBIOS = { t: 'CONTROL DE CAMBIOS', x: '[[CAMBIOS]]' };

  // ------------------------------------------------------------------ documentos
  P.DOCS = [
    // ---------------------------------------------------------------- 1. LIMPIEZA Y DESINFECCIÓN
    { k: 'limpieza', n: 'Limpieza y desinfección', sub: '1. LIMPIEZA Y DESINFECCIÓN', tipo: 'PROTOCOLO', titulo: 'PROTOCOLO DE LIMPIEZA Y DESINFECCIÓN DE EQUIPOS BIOMÉDICOS', codigo: 'PMB-001', version: '01', fecha: '2022-08-01', datos: ['desinfectantes', 'limpieza'],
      secciones: [
        { t: 'INTRODUCCIÓN', x: `El ambiente de atención en salud es un reservorio y fuente de microorganismos, tanto para el personal como para los pacientes. Los equipos biomédicos que se usan con varios pacientes pueden convertirse en un vehículo de contaminación cruzada si no se limpian y desinfectan de forma adecuada.

Entre los factores que favorecen la contaminación cruzada están las manos del personal en contacto con superficies o pacientes contaminados, el uso de un mismo equipo entre pacientes sin desinfección intermedia y el inadecuado manejo de los productos de limpieza.

Por esto {ENTIDAD} adopta el presente protocolo, que estandariza la técnica, los productos y la frecuencia de limpieza y desinfección de cada uno de sus equipos biomédicos, de acuerdo con las recomendaciones de los fabricantes y la normatividad vigente.` },
        { t: 'OBJETIVOS', x: `## Objetivo general
Reducir el riesgo de contaminación cruzada e infecciones asociadas a la atención en salud, estableciendo y estandarizando el proceso de limpieza y desinfección de los equipos biomédicos de {ENTIDAD}.
## Objetivos específicos
- Estandarizar la técnica de limpieza y desinfección para cada tipo de equipo biomédico.
- Definir los productos, el tiempo de contacto y la frecuencia de aplicación.
- Prolongar la vida útil de los equipos y reducir la probabilidad de daños por el uso inadecuado de productos químicos.
- Optimizar los recursos destinados a la limpieza y desinfección.
- Sensibilizar al personal sobre la importancia de las conductas básicas de bioseguridad.` },
        { t: 'ALCANCE', x: `Aplica a todos los equipos biomédicos de {ENTIDAD} en sus sedes ({SEDES}) y a todo el personal asistencial que los utiliza. Se realiza limpieza y desinfección en los siguientes casos:
- Cuando el equipo se va a utilizar con un nuevo paciente.
- Cuando el equipo sale o ingresa a un servicio.
- Antes de un mantenimiento preventivo o correctivo, o de la entrega a un proveedor.
- Cada vez que se observe suciedad visible o derrame de fluidos.` },
        { t: 'RESPONSABLES', x: `- Personal asistencial que usa el equipo: realiza la limpieza y la desinfección y la registra en el formato FMB-006 (Lista de chequeo limpieza y desinfección equipo biomédico).
- Líder o coordinador del servicio: verifica el cumplimiento y la disponibilidad de los insumos.
- Ingeniería biomédica ({EMPRESA}): actualiza el protocolo, capacita al personal y verifica el estado de los equipos en las visitas.` },
        { t: 'DEFINICIONES', x: `- Limpieza: remoción de la materia orgánica e inorgánica visible de una superficie, por acción mecánica con agua y detergente. Es un paso previo indispensable para la desinfección.
- Desinfección: proceso que elimina la mayoría de los microorganismos patógenos de objetos inanimados, con excepción de las esporas bacterianas.
- Desinfección de bajo nivel: elimina bacterias vegetativas, algunos hongos y virus; se usa en superficies y equipos que tienen contacto con piel intacta (no críticos).
- Desinfección de nivel intermedio y alto nivel: eliminan además micobacterias y, en el alto nivel, todos los microorganismos excepto un alto número de esporas; se usan en elementos semicríticos.
- Esterilización: eliminación de toda forma de vida microbiana, incluidas las esporas.
- Contaminación cruzada: transmisión de microorganismos de un paciente, superficie u objeto a otro.
- Tiempo de contacto: tiempo que el desinfectante debe permanecer húmedo sobre la superficie para lograr su efecto.
- Elementos de protección personal (EPP): bata, guantes, tapabocas y gafas que protegen al trabajador durante el proceso.` },
        { t: 'MARCO LEGAL', x: `${NORMAS_BASE}
- Resolución 2183 de 2004: Manual de buenas prácticas de esterilización para prestadores de servicios de salud.
- Decreto 780 de 2016 y manual vigente para la gestión integral de residuos generados en la atención en salud.` },
        { t: 'PRODUCTOS DE LIMPIEZA Y DESINFECCIÓN', x: `Para la limpieza y desinfección de los equipos biomédicos {ENTIDAD} utiliza los siguientes productos, con registro sanitario vigente, ficha técnica y hoja de seguridad disponibles en el servicio:

[[DESINFECTANTES]]

Antes de cambiar de producto se debe verificar con la ficha técnica y el manual del fabricante del equipo que sea compatible con sus materiales (plásticos, pantallas, cauchos y metales).` },
        { t: 'DESARROLLO O PROCEDIMIENTO', x: `## Elementos para la limpieza y desinfección
- Paños de tela no tejida o toallas de celulosa de un solo uso.
- Detergente y desinfectante de dispositivos médicos y superficies ({DESINFECTANTE}).
- Bolsa para residuos según el código de colores vigente.
## Elementos de protección personal
- Bata o delantal, guantes limpios, tapabocas y gafas de protección.
## Técnica
Previo lavado de manos y colocación de los elementos de protección personal:
1. Apague y desconecte el equipo de la red eléctrica; retire baterías cuando el fabricante lo indique.
2. Retire la suciedad visible y el polvo con un paño húmedo.
3. Aplique el desinfectante sobre el paño, nunca directamente sobre el equipo, pantallas, teclados o conectores.
4. Pase el paño en una sola dirección, sin repasar, de lo más limpio a lo más sucio y de arriba hacia abajo.
5. Deje actuar el producto durante el tiempo de contacto indicado en su ficha técnica; no enjuague si el producto no lo requiere.
6. Deseche el paño al terminar y retírese los guantes; realice higiene de manos.
7. Registre la actividad en el formato FMB-006.
## Limpieza y desinfección por equipo
La limpieza se realiza a diario y la desinfección con la frecuencia que se indica a continuación para cada equipo biomédico de {ENTIDAD}:

[[LIMPIEZA_EQUIPOS]]` },
        { t: 'RECOMENDACIONES GENERALES', x: `- Antes de iniciar, desconecte los equipos que funcionan con red eléctrica y retire las baterías cuando aplique.
- No rocíe ni sumerja equipos eléctricos o electrónicos; no deje líquido en los conectores.
- Durante la limpieza evite levantar polvo y deje las superficies lo más secas posible.
- No mezcle productos químicos ni los trasvase a envases sin rotular.
- Respete la fecha de vencimiento del producto y la vida útil después de abierto.
- Al terminar, lave y guarde los elementos utilizados y deseche los paños como residuo según su uso.
- Reporte al servicio de ingeniería biomédica cualquier daño observado durante la limpieza.` },
        { t: 'BIBLIOGRAFÍA', x: `- Secretaría Distrital de Salud de Bogotá. Limpieza y desinfección de equipos y superficies ambientales en instituciones prestadoras de servicios de salud. 2011.
- Organización Mundial de la Salud. Prevención de las infecciones nosocomiales. Guía práctica, 2.ª edición. 2003.
- Fichas técnicas y hojas de seguridad de los productos de limpieza y desinfección utilizados.
- Manuales de usuario de los equipos biomédicos de la institución.` },
        { t: 'ANEXOS', x: `- Anexo 1. Ficha técnica de los productos de limpieza y desinfección.
- Anexo 2. Hoja de seguridad de los productos.
- Anexo 3. Registro sanitario de los productos.
- Anexo 4. Formato FMB-006 Lista de chequeo limpieza y desinfección equipo biomédico.` },
        CAMBIOS,
      ] },

    // ---------------------------------------------------------------- 2. MANTENIMIENTO BIOMÉDICO
    { k: 'mantenimiento', n: 'Mantenimiento biomédico', sub: '2. MANTENIMIENTO BIOMÉDICO', tipo: 'PROGRAMA', titulo: 'PROGRAMA DE MANTENIMIENTO BIOMÉDICO', codigo: 'PG-MB-001', version: '002', fecha: '2022-08-01', datos: [],
      secciones: [
        { t: 'INTRODUCCIÓN', x: `El sector salud depende cada vez más de la tecnología biomédica para garantizar una atención segura, eficiente y de calidad. El funcionamiento confiable de esta tecnología depende de una gestión de mantenimiento planificada, ejecutada y evaluada de forma sistemática.

{ENTIDAD} desarrolla e implementa el presente programa de mantenimiento biomédico, basado en actividades de planificación, ejecución, registro y seguimiento, con el acompañamiento de {EMPRESA}.

Mientras el mantenimiento correctivo se centra en reparar equipos que fallan, el mantenimiento preventivo busca evitar las fallas y prolongar la vida útil, mediante inspecciones, limpieza, ajustes, cambio de partes y verificaciones de funcionamiento y seguridad programadas según las recomendaciones del fabricante.` },
        { t: 'OBJETIVOS', x: `## Objetivo general
Garantizar el adecuado funcionamiento, la conservación y la operación segura y eficiente de los equipos biomédicos de {ENTIDAD}, mediante la planificación, ejecución y seguimiento de un programa de mantenimiento preventivo y correctivo.
## Objetivos específicos
- Mantener actualizado el inventario físico y funcional de los equipos biomédicos.
- Programar y ejecutar el mantenimiento preventivo según las recomendaciones del fabricante y la clasificación de riesgo.
- Atender oportunamente las solicitudes de mantenimiento correctivo.
- Mantener la trazabilidad de cada equipo mediante la hoja de vida y los reportes de servicio.
- Medir la gestión con indicadores y definir acciones de mejora.` },
        { t: 'ALCANCE', x: `Aplica a todos los equipos biomédicos y de apoyo clínico de {ENTIDAD}, propios, en comodato o en alquiler, ubicados en sus sedes: {SEDES}. Inicia con el ingreso del equipo al inventario y termina con su baja y disposición final.` },
        { t: 'RESPONSABLES', x: `- Ingeniero(a) biomédico(a) ({EMPRESA}): elabora, implementa y actualiza el programa; ejecuta los mantenimientos y diligencia los registros.
- Representante legal de {ENTIDAD}: garantiza los recursos para el mantenimiento.
- Líderes de servicio: reportan las fallas, facilitan el acceso a los equipos y reciben los equipos intervenidos.
- Personal asistencial: usa los equipos según el manual y reporta cualquier anomalía.` },
        { t: 'MARCO LEGAL', x: NORMAS_BASE },
        { t: 'DOCUMENTOS RELACIONADOS', x: `- FMB-001 Formato inventario de equipos biomédicos.
- FMB-002 Formato cronograma de mantenimiento preventivo.
- FHVEB-001 Formato hoja de vida de equipo biomédico.
- FMB-004 Formato reporte de mantenimiento preventivo (lista de chequeo por tipo de equipo).
- FMB-005 Formato reporte de mantenimiento correctivo.
- FT-AB-033 Formato acta de baja.
- FT-AE-032 Formato acta de entrega.
- PMB-001 Protocolo de limpieza y desinfección de equipos biomédicos.
- PGAM-028 Programa de aseguramiento metrológico.` },
        { t: 'DEFINICIONES', x: `- Mantenimiento preventivo: conjunto de actividades programadas (inspección, limpieza, lubricación, ajuste, cambio de partes, pruebas de funcionamiento y seguridad) que se realizan según el fabricante para prevenir fallas.
- Mantenimiento correctivo: actividades para restablecer el funcionamiento de un equipo que presenta una falla.
- Mantenimiento predictivo: seguimiento de variables de funcionamiento para anticipar fallas.
- Calibración: operaciones que establecen la relación entre los valores indicados por un instrumento y los valores conocidos de un patrón.
- Hoja de vida: registro de la información técnica y del historial de mantenimiento, calibración y novedades de cada equipo.
- Cronograma: planeación de las fechas de mantenimiento preventivo y metrología de cada equipo.
- Baja: retiro administrativo y físico de un equipo que no cumple las condiciones técnicas, de seguridad o económicas para seguir en servicio.` },
        { t: 'PLANIFICACIÓN', x: `## Inspección y funcionamiento al ingreso
Todo equipo biomédico nuevo que ingresa a {ENTIDAD} se inspecciona antes de su uso: estado físico, accesorios, documentos (registro sanitario, manuales, garantía, certificado de calibración si aplica) y pruebas de funcionamiento. El resultado se registra y el equipo se entrega al servicio con acta de entrega.
## Inventario
Los equipos se registran en el formato FMB-001 con su código de inventario, nombre, marca, modelo, serie, ubicación, clasificación de riesgo y registro sanitario. El inventario se verifica al menos una vez al año en cada servicio.

[[INVENTARIO]]

## Clasificación de riesgo
[[EQUIPOS_RIESGO]]

## Condiciones ambientales
Para los equipos y áreas que lo requieren se controlan las variables ambientales, con registro diario en el formato de temperatura y humedad:

[[CONDICIONES]]` },
        { t: 'ESTRATEGIAS Y PERIODICIDAD DEL MANTENIMIENTO', x: `El mantenimiento se divide en inspección y mantenimiento preventivo, y mantenimiento correctivo. La periodicidad del preventivo la define el fabricante en sus manuales; en su ausencia se establece según el riesgo, el uso y el historial de fallas. Para los equipos de riesgo IIb y III se programan mínimo dos mantenimientos preventivos al año.

[[PERIODICIDAD]]

El cronograma anual (FMB-002) se elabora a partir de esta periodicidad, se entrega a los líderes de servicio y se publica en el gestor documental de la entidad. Cuando un equipo de tecnología especializada es atendido por un tercero, este entrega su programación y los reportes de cada servicio.
## Recursos
- Herramientas de trabajo para desarme y rearme, instrumentos de medición (multímetro, analizador de seguridad eléctrica y simuladores cuando aplique).
- Repuestos e insumos solicitados con anticipación según el consumo y la prioridad.
- Lugar de trabajo limpio, iluminado y con las condiciones de bioseguridad necesarias.` },
        { t: 'EJECUCIÓN', x: `## Mantenimiento preventivo
Se ejecuta según el cronograma, previa limpieza y desinfección del equipo por el servicio. Se aplica la lista de chequeo del tipo de equipo (FMB-004): inspección física, limpieza interna, ajustes, cambio de partes, pruebas de funcionamiento y de seguridad. Si el equipo pasa las pruebas se entrega al servicio; si no, se inicia el mantenimiento correctivo.
## Mantenimiento correctivo
La falla se reporta por los canales de {EMPRESA} ({TELEFONO_IBCOL} · {CORREO_IBCOL}) o en el gestor biomédico (reporte de daño de equipos). Se identifica si el equipo es propio, en comodato o en alquiler (en estos dos casos se reporta al proveedor). Se diagnostica, se repara y se prueba; si la reparación no es viable técnica o económicamente se evalúa la baja.

[[FLUJO_CORRECTIVO]]

## Registros
Cada intervención se documenta en el reporte de servicio (FMB-004 o FMB-005) firmado por quien ejecuta y quien recibe, y se archiva en la carpeta del equipo junto con su hoja de vida (FHVEB-001).
## Baja de equipos
Un equipo se da de baja cuando: no tiene reparación o su costo supera el 50 % de su valor; ha cumplido su vida útil; no hay repuestos ni soporte del fabricante; representa un riesgo para el paciente o el operador; o es obsoleto frente a la normatividad. Se diligencia el formato FT-AB-033 y se dispone según la gestión de residuos.
## Calibración y validación
Los equipos que miden, pesan o cuentan, y los que tienen subsistemas de medición, se incluyen en el Programa de aseguramiento metrológico (PGAM-028), con calibración por laboratorios acreditados. Los procesos que lo requieren (por ejemplo esterilización o cadena de frío) se califican o validan.
## Capacitación
Se capacita al personal en el uso seguro, la limpieza y los cuidados de los equipos según el programa de capacitación – educación continua, y se realiza inducción al personal nuevo.` },
        { t: 'INDICADORES', x: `La gestión del mantenimiento se mide con los siguientes indicadores, calculados en el gestor biomédico con los cronogramas y reportes de cada periodo:

[[INDICADORES_MTTO]]` },
        { t: 'BENEFICIOS DEL MANTENIMIENTO PREVENTIVO PLANIFICADO', x: `- Prevención de fallas y de paros en la prestación del servicio.
- Reducción de gastos imprevistos y del reemplazo de equipos durante su vida útil.
- Mayor seguridad para pacientes y operadores.
- Información confiable para la toma de decisiones de renovación tecnológica.` },
        { t: 'RECOMENDACIONES', x: `- Realizar el mantenimiento con las medidas de bioseguridad y los elementos de protección personal necesarios.
- Verificar las condiciones de seguridad eléctrica antes de entregar un equipo.
- Cumplir el protocolo de limpieza y desinfección antes de cualquier intervención.
- Las recomendaciones del fabricante de cada equipo se consignan en su hoja de vida.` },
        { t: 'BIBLIOGRAFÍA', x: `- Organización Mundial de la Salud. Introducción al programa de mantenimiento de equipos médicos. Serie de documentos técnicos de la OMS sobre dispositivos médicos. 2012.
- Resolución 3100 de 2019. Ministerio de Salud y Protección Social.
- Manuales de operación y servicio de los equipos de la institución.` },
        { t: 'ANEXOS', x: `- Anexo 1. FMB-001 Inventario de equipos biomédicos.
- Anexo 2. FHVEB-001 Hoja de vida.
- Anexo 3. FMB-002 Cronograma de mantenimiento preventivo.
- Anexo 4. FMB-004 Reporte de mantenimiento preventivo.
- Anexo 5. FMB-005 Reporte de mantenimiento correctivo.
- Anexo 6. FT-AB-033 Acta de baja.` },
        CAMBIOS,
      ] },

    // ---------------------------------------------------------------- 3. CONTROL DE CALIDAD GLUCÓMETRO
    { k: 'glucometro', n: 'Control glucómetro', sub: '3. CONTROL DE CALIDAD GLUCÓMETRO', tipo: 'PROCEDIMIENTO', titulo: 'PROCEDIMIENTO CONTROL DE CALIDAD GLUCÓMETRO', codigo: 'PRMB-001', version: '01', fecha: '2022-08-01', datos: ['gluco'],
      secciones: [
        { t: 'INTRODUCCIÓN', x: `El control de calidad del glucómetro permite verificar que el medidor y las tiras reactivas funcionan correctamente en conjunto, usando soluciones de control con concentración conocida. Esta medida asegura la precisión y confiabilidad de los resultados de glucometría que se entregan a los pacientes de {ENTIDAD}.

[[GLUCOMETROS]]` },
        { t: 'OBJETIVO', x: `Verificar el adecuado funcionamiento de los sistemas de monitoreo de glucosa en sangre (glucómetros) de {ENTIDAD} mediante pruebas periódicas con solución de control.` },
        { t: 'ALCANCE', x: `Aplica a todos los glucómetros de {ENTIDAD} en sus sedes y servicios ({SEDES}).` },
        { t: 'RESPONSABLES', x: `- Personal asistencial que realiza glucometrías: ejecuta la prueba y registra el resultado en el formato FMB-007.
- Líder del servicio: verifica el registro y la vigencia de tiras y soluciones.
- Ingeniería biomédica ({EMPRESA}): verifica el procedimiento en la visita de mantenimiento preventivo.` },
        { t: 'DEFINICIONES', x: `- Glucosa: concentración de azúcar en la sangre.
- Glucómetro: instrumento que mide la concentración de glucosa en sangre capilar por medio de tiras reactivas.
- Solución de control: solución con concentración conocida de glucosa para comprobar que el medidor y las tiras funcionan correctamente.
- Tira reactiva: elemento donde se coloca la muestra para que el glucómetro realice la medición.` },
        { t: 'CUÁNDO REALIZAR LA PRUEBA', x: `- Antes del primer uso del medidor.
- Al abrir una nueva caja o lote de tiras reactivas.
- Cuando se sospeche que el medidor o las tiras no funcionan correctamente o los resultados son inexactos.
- Cuando el equipo haya sufrido golpes, caídas o se haya mojado.
- Una vez al mes, según el cronograma del servicio.
- En la visita de mantenimiento preventivo del servicio biomédico.` },
        { t: 'DESARROLLO O PROCEDIMIENTO', x: `## Pasos
1. Inserte una tira reactiva en el puerto del medidor con las barras de contacto hacia arriba; el medidor enciende y muestra todos los segmentos de la pantalla.
2. Verifique que todos los segmentos de la pantalla se encienden.
3. Marque la prueba como solución de control según el manual del medidor (por ejemplo, botón M).
4. Agite el gotero de solución de control, destápelo y deseche la primera gota.
5. Aplique la siguiente gota en la punta de la tira reactiva.
6. Espere el conteo y lea el resultado.
7. Compare el resultado con el rango impreso en el envase de las tiras reactivas del lote en uso.
8. Registre el resultado en el formato FMB-007 y deseche la tira en el recipiente adecuado.
## Rangos de las soluciones de control
[[RANGOS_GLUCO]]
## Flujograma
[[PASOS_GLUCO]]
## Información importante de la solución de control
- Verifique la fecha de vencimiento del frasco; no lo use si ha expirado.
- Escriba en el frasco la fecha de apertura y de descarte (según el fabricante, generalmente 90 días después de abierto).
- Agite el gotero antes de usarlo y deseche siempre la primera gota.` },
        { t: 'ACCIONES SEGURAS E INSEGURAS', x: `## Seguras
- Registrar la fecha de apertura y descarte en la etiqueta de la solución de control.
- Mantener limpio el puerto de la tira reactiva y el medidor seco.
- Evitar exponer el medidor a temperaturas o humedad extremas.
- Si el resultado está fuera de rango, repetir la prueba; si persiste, no usar el equipo y reportarlo a ingeniería biomédica.
## Inseguras
- Usar tiras o soluciones de control vencidas o fuera del tiempo de descarte.
- Usar el glucómetro con pacientes cuando el control está fuera de rango.
- Dejar caer el medidor o introducir líquidos en él.` },
        { t: 'ANEXOS Y BIBLIOGRAFÍA', x: `- FMB-007 Formato control de calidad para glucómetro.
- Manual de usuario del glucómetro y de las tiras reactivas en uso.` },
        CAMBIOS,
      ] },

    // ---------------------------------------------------------------- 4. PROGRAMA DE CAPACITACIÓN – EDUCACIÓN CONTINUA
    { k: 'capacitacion', n: 'Programa de capacitación', sub: '4. CAPACITACIÓN - EDUCACIÓN CONTINUA', tipo: 'PROGRAMA', titulo: 'PROGRAMA DE CAPACITACIÓN – EDUCACIÓN CONTINUA', codigo: 'PCEC-019', version: '002', fecha: '2022-09-01', datos: ['cap'],
      secciones: [
        { t: 'JUSTIFICACIÓN', x: `El objetivo de la capacitación es fortalecer las competencias del personal mediante actividades organizadas de forma sistemática, que proporcionen conocimientos y habilidades para el uso seguro de la tecnología biomédica y el mejoramiento del desempeño.

La Resolución 3100 de 2019 exige a los prestadores de servicios de salud la formación continua del talento humano en los procesos prioritarios asistenciales, entre ellos el uso adecuado de los equipos biomédicos. Con este programa {ENTIDAD} da respuesta a dicho requerimiento.` },
        { t: 'OBJETIVOS', x: `## Objetivo general
Contribuir al mejoramiento institucional fortaleciendo las competencias del personal de {ENTIDAD} en el uso seguro, la limpieza y el cuidado de la tecnología biomédica.
## Objetivos específicos
- Diseñar el material de capacitación de los equipos biomédicos de la institución.
- Evaluar los conocimientos del personal antes y después de cada capacitación (pre y post test).
- Programar y ejecutar las capacitaciones según el cronograma anual.
- Analizar los resultados y definir acciones de mejora.
- Realizar inducción en el uso de los equipos al personal nuevo.` },
        { t: 'ALCANCE', x: `Inicia con el diagnóstico de necesidades de capacitación y termina con el análisis de resultados. Va dirigido al personal asistencial y administrativo de {ENTIDAD} que usa equipos biomédicos, en sus sedes: {SEDES}.` },
        { t: 'RESPONSABLE', x: `El responsable de implementar el presente programa es el área de ingeniería biomédica ({EMPRESA}), con el apoyo de los líderes de servicio para la convocatoria del personal.` },
        { t: 'MARCO LEGAL', x: `- Ley 1164 de 2007: disposiciones en materia de talento humano en salud.
- Decreto 4725 de 2005: dispositivos médicos.
- Resolución 4816 de 2008: Programa Nacional de Tecnovigilancia.
- Resolución 3100 de 2019: estándar de talento humano y dotación para la habilitación de servicios.
- Decreto 1072 de 2015: Decreto Único Reglamentario del Sector Trabajo (capacitación en seguridad y salud en el trabajo).` },
        { t: 'DOCUMENTOS RELACIONADOS', x: `- FMB-008 Formato pre y post test.
- FT-CCC-012 Formato cronograma de capacitación continua.
- Formato acta / lista de asistencia a capacitaciones.
- Manuales de usuario y guías rápidas de los equipos biomédicos.` },
        { t: 'DEFINICIONES', x: `- Capacitación: conjunto de procesos orientados a reforzar y complementar la formación del personal para el mejor desempeño de sus funciones.
- Competencia: capacidad de una persona para desempeñar sus funciones con la calidad y los resultados esperados.
- Educación continua: actividades de actualización permanente del talento humano.
- Pre test / post test: evaluaciones aplicadas antes y después de la capacitación para medir el conocimiento adquirido.` },
        { t: 'DESARROLLO O PROCEDIMIENTO', x: `## Diagnóstico de necesidades
Se tienen en cuenta: los requisitos de formación continua de la Resolución 3100 de 2019; los equipos nuevos o actualizados; los resultados de las rondas, mantenimientos y reportes de tecnovigilancia (fallas por mal uso); y las solicitudes de los líderes de servicio.
## Temas por capacitar
[[TEMAS_CAPACITACION]]
## Revisión de literatura
Se prepara el material con base en los manuales de usuario, guías rápidas y fichas técnicas entregadas por los proveedores, y la normatividad vigente.
## Evaluación, medición y seguimiento
Al inicio de cada capacitación se aplica el pre test y al final el post test (FMB-008), que pueden diligenciarse de forma virtual por enlace. Se registra la asistencia con firma.
## Estrategias
Las capacitaciones se programan teniendo en cuenta la rutina de trabajo y los turnos, en sesiones cortas, prácticas y con los equipos del servicio.
## Ejecución
Las capacitaciones se programan en el cronograma de capacitación continua FT-CCC-012 y se realizan como mínimo de forma semestral. Además, se realiza inducción al personal nuevo en el uso de los equipos de su servicio.
## Análisis de resultados
Después de cada capacitación se elabora el informe con: fecha y hora, tema, capacitador, asistentes, resultados del pre y post test, evidencia fotográfica y conclusiones.` },
        { t: 'INDICADORES', x: `[[INDICADORES_CAP]]` },
        { t: 'BIBLIOGRAFÍA Y ANEXOS', x: `- Resolución 3100 de 2019. Ministerio de Salud y Protección Social.
- Anexo 1. FMB-008 Formato pre y post test.
- Anexo 2. FT-CCC-012 Formato cronograma de capacitación continua.
- Anexo 3. Lista de asistencia.` },
        CAMBIOS,
      ] },

    // ---------------------------------------------------------------- 4b. PLAN DE CAPACITACIÓN
    { k: 'plan_cap', n: 'Plan de capacitación', sub: '4. CAPACITACIÓN - EDUCACIÓN CONTINUA', tipo: 'PLAN', titulo: 'PLAN DE CAPACITACIÓN – EDUCACIÓN CONTINUA', codigo: 'PCEC-019', version: '002', fecha: '2022-09-01', datos: ['cap'],
      secciones: [
        { t: 'JUSTIFICACIÓN', x: `El Plan de Capacitación es el instrumento con el que {ENTIDAD} organiza para la vigencia {ANIO} las actividades de formación continua de su talento humano, en respuesta a los requisitos de habilitación de servicios de salud y a las necesidades identificadas en el uso de la tecnología biomédica.` },
        { t: 'DIAGNÓSTICO DE NECESIDADES DE CAPACITACIÓN', x: `- Requerimiento de formación continua de la Resolución 3100 de 2019 para el personal de los procesos prioritarios.
- Necesidades institucionales producidas por cambios tecnológicos, nuevos servicios o equipos.
- Hallazgos de mantenimientos, rondas biomédicas y reportes de tecnovigilancia.
- Solicitudes de los líderes de los servicios.` },
        { t: 'OBJETIVOS', x: `## Objetivo general
Fortalecer las competencias del personal de {ENTIDAD} mediante la ejecución de un plan anual de capacitación en el uso seguro de la tecnología biomédica y los programas institucionales.
## Objetivos específicos
- Desarrollar acciones de formación continua en los procesos prioritarios asistenciales.
- Fortalecer los programas institucionales (seguridad del paciente, tecnovigilancia, limpieza y desinfección).
- Medir la cobertura y efectividad de las capacitaciones.` },
        { t: 'PRINCIPIOS', x: `- Complementariedad: la capacitación acompaña la planeación institucional.
- Integralidad: contribuye al desarrollo de competencias técnicas y humanas.
- Objetividad: responde a necesidades identificadas en el diagnóstico.
- Participación: involucra a líderes y colaboradores.
- Continuidad: se realiza de forma permanente y planificada.` },
        { t: 'MODALIDADES Y HERRAMIENTAS', x: `- Capacitación o actualización presencial con práctica en los equipos del servicio.
- Inducción y reinducción al personal nuevo.
- Material virtual: presentaciones, guías rápidas y evaluación por enlace (pre y post test).` },
        { t: 'PRESUPUESTO', x: `Los recursos para la ejecución del presente plan están sujetos a la disponibilidad presupuestal de la vigencia; las capacitaciones en tecnología biomédica se incluyen en el contrato de ingeniería biomédica con {EMPRESA}.` },
        { t: 'CRONOGRAMA', x: `[[CRONOGRAMA_CAP]]` },
        { t: 'EVALUACIÓN, MEDICIÓN Y SEGUIMIENTO', x: `Cada capacitación se evalúa con pre y post test (FMB-008) y se registra la asistencia. Los resultados se consolidan en los indicadores del plan:

[[INDICADORES_CAP]]` },
        CAMBIOS,
      ] },

    // ---------------------------------------------------------------- 5. ADQUISICIÓN DE NUEVAS TECNOLOGÍAS
    { k: 'adquisicion', n: 'Adquisición de tecnología', sub: '5. ADQUISICIÓN DE NUEVAS TECNOLOGÍAS', tipo: 'PROCEDIMIENTO', titulo: 'PROCEDIMIENTO PARA LA ADQUISICIÓN DE NUEVAS TECNOLOGÍAS', codigo: 'PR-ANT-023', version: '01', fecha: '2022-09-01', datos: [],
      secciones: [
        { t: 'INTRODUCCIÓN', x: `Al adquirir tecnología biomédica las instituciones suelen enfocarse en su costo inicial, sin incluir los costos de instalación, capacitación, mantenimiento, metrología, consumibles y disposición final, que pueden superar el valor de compra durante la vida útil del equipo.

Este procedimiento establece cómo {ENTIDAD} identifica, evalúa, selecciona, adquiere, recibe e instala la nueva tecnología biomédica, garantizando que cumpla los requisitos técnicos, normativos y de seguridad.` },
        { t: 'OBJETIVOS', x: `## Objetivo general
Establecer los mecanismos de evaluación para la adquisición de nuevas tecnologías biomédicas para los servicios de {ENTIDAD}.
## Objetivos específicos
- Identificar y priorizar las necesidades de tecnología biomédica según los servicios habilitados.
- Evaluar técnica, clínica y económicamente las alternativas del mercado.
- Verificar el cumplimiento normativo (registro sanitario, clasificación de riesgo, soporte técnico).
- Asegurar la correcta recepción, instalación, capacitación y registro del equipo.` },
        { t: 'ALCANCE', x: `Aplica a toda adquisición de equipos biomédicos y de apoyo clínico de {ENTIDAD} por compra, arriendo, comodato o leasing, desde la identificación de la necesidad hasta la puesta en funcionamiento.` },
        { t: 'RESPONSABLES', x: `- Representante legal: aprueba la adquisición y los recursos.
- Ingeniería biomédica ({EMPRESA}): emite el concepto técnico, evalúa las cotizaciones y realiza la recepción técnica.
- Líder del servicio solicitante: identifica la necesidad y participa en la evaluación clínica.
- Compras / administración: gestiona las cotizaciones y la orden de compra.` },
        { t: 'MARCO LEGAL', x: `${NORMAS_BASE}
- Decreto 1595 de 2015: Subsistema Nacional de la Calidad (metrología legal).` },
        { t: 'DEFINICIONES', x: `- Tecnología biomédica: equipos, dispositivos y sistemas utilizados en la prestación de servicios de salud.
- Registro sanitario: permiso del INVIMA para fabricar, importar o comercializar un dispositivo médico en Colombia.
- Comodato: préstamo de uso de un equipo, generalmente asociado al consumo de insumos.
- Evaluación de tecnología: análisis técnico, clínico y económico de las alternativas.
- Costo total de propiedad: suma de los costos de adquisición, operación, mantenimiento y disposición final.` },
        { t: 'DESARROLLO O PROCEDIMIENTO', x: `## Planeación
La necesidad de tecnología surge por apertura o ampliación de servicios, reposición por baja, obsolescencia, insuficiencia (ver Programa de suficiencia) o cambios normativos. Se prioriza con la siguiente matriz:

[[MATRIZ_PRIORIDAD]]

## Flujo de adquisición
[[PASOS_ADQ]]

## Requisitos mínimos que debe entregar el proveedor
- Registro sanitario INVIMA vigente y clasificación de riesgo.
- Manual de usuario en español y manual de servicio (cuando aplique).
- Garantía mínima de un año y soporte técnico en el país; disponibilidad de repuestos.
- Certificado de calibración (equipos de medición) emitido por laboratorio acreditado.
- Capacitación al personal usuario y técnico.
- Protocolo de mantenimiento preventivo y periodicidad recomendada.
- Factura, certificado de importación cuando aplique y acta de entrega.

## Recepción e instalación
Se realiza la inspección inicial, se verifica el cumplimiento de lo ofertado, se instala en el servicio, se realizan las pruebas de funcionamiento, se registra en el inventario FMB-001, se abre la hoja de vida FHVEB-001, se incluye en los cronogramas de mantenimiento y metrología, se capacita al personal y se firma el acta de entrega FT-AE-032.` },
        { t: 'SEGURIDAD EN EQUIPOS BIOMÉDICOS', x: `- No se pone en servicio ningún equipo sin registro sanitario vigente ni sin la inspección inicial de ingeniería biomédica.
- Los equipos donados, en comodato o en alquiler cumplen los mismos requisitos que los comprados.
- Toda tecnología nueva se incluye en el Programa institucional de tecnovigilancia.` },
        CAMBIOS,
      ] },

    // ---------------------------------------------------------------- 6. ASEGURAMIENTO METROLÓGICO
    { k: 'metrologia', n: 'Aseguramiento metrológico', sub: '6. ASEGURAMIENTO METROLÓGICO', tipo: 'PROGRAMA', titulo: 'PROGRAMA DE ASEGURAMIENTO METROLÓGICO PARA EQUIPOS BIOMÉDICOS Y DE APOYO CLÍNICO', codigo: 'PGAM-028', version: '01', fecha: '2023-02-01', datos: ['metro'],
      secciones: [
        { t: 'INTRODUCCIÓN', x: `Las instituciones prestadoras de servicios de salud deben asegurar que las mediciones de sus equipos sean confiables, porque de ellas dependen diagnósticos y tratamientos. El aseguramiento metrológico es el conjunto de actividades (calibración, calificación, verificación y control) que garantiza la trazabilidad y exactitud de las mediciones.

Este programa establece cómo {ENTIDAD} identifica los equipos que requieren control metrológico, define sus magnitudes y frecuencias, programa y ejecuta la metrología y verifica los resultados de los certificados.` },
        { t: 'OBJETIVOS', x: `## Objetivo general
Establecer los lineamientos del aseguramiento metrológico de los equipos biomédicos y de apoyo clínico de {ENTIDAD}.
## Objetivos específicos
- Identificar los equipos que requieren calibración, calificación o verificación.
- Definir las magnitudes a controlar y la frecuencia de cada equipo.
- Elaborar y ejecutar el cronograma anual de aseguramiento metrológico.
- Verificar que los resultados de los certificados cumplan los límites aceptables y tomar acciones cuando no los cumplan.` },
        { t: 'ALCANCE', x: `Aplica a los equipos biomédicos y de apoyo clínico de {ENTIDAD} que miden, pesan o cuentan, o que tienen subsistemas de medición, en todas sus sedes ({SEDES}).` },
        { t: 'AUTORIDAD Y RESPONSABLES', x: `- Autoridad: ingeniero(a) biomédico(a) ({EMPRESA}).
- Responsables: ingeniería biomédica y el personal a cargo de los equipos en cada servicio, quien facilita el acceso y conserva los certificados e identificaciones.` },
        { t: 'MARCO LEGAL', x: `- Decreto 4725 de 2005: dispositivos médicos.
- Decreto 1074 de 2015 y Decreto 1595 de 2015: Subsistema Nacional de la Calidad y metrología legal.
- Resolución 3100 de 2019: estándar de dotación (equipos con calibración vigente).
- NTC-ISO/IEC 17025:2017: requisitos generales para la competencia de los laboratorios de ensayo y calibración.
- NTC-ISO 10012:2003: sistemas de gestión de las mediciones.
- ILAC-G24 / OIML D 10: lineamientos para la determinación de intervalos de calibración.` },
        { t: 'DOCUMENTOS RELACIONADOS', x: `- FMB-001 Inventario de equipos biomédicos.
- FMB-003 Cronograma de aseguramiento metrológico.
- FT-MEB-029 Formato de verificación metrológica de equipos biomédicos y de apoyo clínico.
- FHVEB-001 Hoja de vida de equipo biomédico.` },
        { t: 'DEFINICIONES', x: `- Calibración: operación que establece la relación entre los valores indicados por un instrumento y los valores de un patrón, con sus incertidumbres.
- Calificación: verificación documentada de que un equipo (por ejemplo, nevera o autoclave) mantiene las condiciones requeridas en todo su volumen útil.
- Verificación: confirmación de que un equipo cumple los requisitos especificados (por ejemplo, con solución de control).
- Error máximo permitido: diferencia máxima aceptable entre la indicación del equipo y el valor de referencia.
- Incertidumbre de medición: parámetro que caracteriza la dispersión de los valores atribuidos a una medición.
- Trazabilidad metrológica: propiedad de una medición de relacionarse con una referencia mediante una cadena documentada de calibraciones.
- Ajuste: operaciones sobre un sistema de medición para que sus indicaciones correspondan a valores dados; no debe confundirse con la calibración.` },
        { t: 'DESARROLLO O PROCEDIMIENTO', x: `## Inventario y clasificación
A partir del inventario se identifican los equipos que aplican aseguramiento metrológico, sus magnitudes y el tipo de actividad: CAL (calibración), CLF (calificación) o VER (verificación).

[[METROLOGIA_EQUIPOS]]

## Frecuencia
El intervalo inicial es anual, salvo que el fabricante, la normatividad o el uso indiquen otro. El intervalo se ajusta según el historial de resultados (método de ajuste automático o «escalera» de la guía ILAC-G24): si el equipo está dentro de tolerancia de forma repetida, el intervalo puede ampliarse; si está fuera, se reduce.
## Cronograma y selección del proveedor
Con los equipos, magnitudes y frecuencias se elabora el cronograma anual (FMB-003). La calibración se contrata con laboratorios acreditados ante el ONAC para la magnitud requerida; cuando no exista laboratorio acreditado se usa un proveedor con trazabilidad demostrada.
## Notificación y ejecución
Se notifica a los servicios la fecha programada. El día de la metrología el equipo debe estar limpio y disponible; el ingeniero biomédico acompaña el proceso y verifica las pruebas iniciales.
## Revisión del certificado
El certificado debe cumplir el numeral 7.8 de la NTC-ISO/IEC 17025: identificación del equipo y del laboratorio, método, condiciones ambientales, resultados con su incertidumbre, trazabilidad y firma.
## Verificación metrológica
Con el formato FT-MEB-029 se compara el error más la incertidumbre de cada punto con el error máximo permitido. Si el equipo es conforme se identifica con la etiqueta de calibración vigente; si no lo es, se retira del servicio.
## Acciones ante no conformidad
El equipo fuera de tolerancia entra a mantenimiento correctivo y ajuste, y se calibra de nuevo antes de volver al servicio. Se evalúa el impacto en los resultados emitidos desde la última calibración conforme y, si afectó a pacientes, se reporta al programa de tecnovigilancia.` },
        { t: 'BIBLIOGRAFÍA', x: `- Decreto 4725 de 2005. Ministerio de la Protección Social.
- ILAC-G24 / OIML D 10:2007. Guía para la determinación de los intervalos de calibración de los instrumentos de medición.
- NTC-ISO/IEC 17025:2017.` },
        { t: 'ANEXOS', x: `- FMB-003 Cronograma de aseguramiento metrológico.
- FT-MEB-029 Formato de verificación metrológica.` },
        CAMBIOS,
      ] },

    // ---------------------------------------------------------------- 8. SUFICIENCIA
    { k: 'suficiencia', n: 'Suficiencia de equipos', sub: '8. SUFICIENCIA DE EQUIPOS BIOMÉDICOS', tipo: 'PROGRAMA', titulo: 'SUFICIENCIA DE TECNOLOGÍA DE EQUIPOS BIOMÉDICOS Y DE APOYO CLÍNICO', codigo: 'PSFEB-018', version: '01', fecha: '2023-02-01', datos: ['suf'],
      secciones: [
        { t: 'INTRODUCCIÓN', x: `Las instituciones prestadoras de servicios de salud deben contar con la dotación suficiente para atender la demanda de sus servicios con oportunidad y seguridad, según el estándar de dotación de la Resolución 3100 de 2019. La suficiencia se determina comparando la capacidad máxima de atención de los equipos disponibles con los usuarios atendidos en cada servicio.` },
        { t: 'OBJETIVO', x: `Evaluar el cumplimiento de la capacidad tecnológica de los servicios de {ENTIDAD} e identificar las necesidades de adquisición de equipos biomédicos.` },
        { t: 'MARCO TEÓRICO', x: `- Resolución 3100 de 2019: manual de inscripción de prestadores y habilitación de servicios de salud; el estándar de dotación exige los equipos necesarios según la complejidad y la demanda del servicio.
- Gestión de tecnología biomédica: la suficiencia es un insumo para la planeación y adquisición de tecnología.` },
        { t: 'METODOLOGÍA', x: `1. Se identifican los servicios habilitados y los equipos biomédicos de cada uno a partir del inventario.
2. Se establecen los días y horas de funcionamiento del servicio en el mes.
3. Se estima el tiempo de uso del equipo por paciente o procedimiento y el tiempo de reposo o preparación entre pacientes.
4. Se descuenta el tiempo dedicado a limpieza, desinfección o esterilización en el mes.
5. Se calcula la capacidad máxima de atención por equipo y del total de equipos disponibles.
6. Se compara con los usuarios atendidos en el servicio (promedio mensual) y se calcula la suficiencia, su porcentaje y los equipos requeridos.

## Cálculos
- Disponibilidad del equipo (horas/mes) = días de funcionamiento en el mes × horas diarias de atención.
- Tiempo por paciente (horas) = (minutos de uso por procedimiento + minutos de reposo) ÷ 60.
- Tiempo de trabajo real (horas/mes) = disponibilidad − horas de limpieza, desinfección o esterilización en el mes.
- Capacidad máxima por equipo (usuarios/mes) = tiempo de trabajo real ÷ tiempo por paciente.
- Capacidad total = capacidad por equipo × número de equipos disponibles.
- Suficiencia estimada = capacidad total − usuarios atendidos.
- Porcentaje de suficiencia = suficiencia estimada ÷ usuarios atendidos × 100.
- Equipos requeridos = (usuarios atendidos − capacidad total) ÷ capacidad por equipo.

[[CRITERIOS_SUFICIENCIA]]` },
        { t: 'ANÁLISIS DE SERVICIOS', x: `[[SUFICIENCIA]]` },
        { t: 'CONCLUSIÓN', x: `De acuerdo con los resultados, se identifican los servicios con suficiencia óptima, los que tienen riesgo de insuficiencia ante un aumento del flujo de pacientes y los que requieren adquirir equipos. Las necesidades identificadas se incluyen en la planeación de adquisición de tecnología (procedimiento PR-ANT-023). Este análisis se actualiza como mínimo una vez al año o cuando cambie la oferta de servicios.` },
        CAMBIOS,
      ] },

    // ---------------------------------------------------------------- 9. SEGURIDAD Y MANEJO DE TECNOLOGÍA
    { k: 'seguridad', n: 'Seguridad y manejo de tecnología', sub: '9. SEGURIDAD Y MANEJO DE TECNOLOGÍA BIOMÉDICA', tipo: 'PROTOCOLO', titulo: 'PROTOCOLO DE SEGURIDAD Y MANEJO DE TECNOLOGÍA BIOMÉDICA', codigo: 'PT-SMTB-001', version: '001', fecha: '2025-04-01', datos: [],
      secciones: [
        { t: 'INTRODUCCIÓN', x: `La evolución tecnológica en salud ha traído nuevos dispositivos médicos que facilitan el diagnóstico y el tratamiento, pero también nuevos riesgos para pacientes y operadores. Una proporción importante de los eventos adversos con dispositivos médicos se relaciona con el uso inadecuado, la falta de mantenimiento o la selección inapropiada de la tecnología.

Este protocolo define cómo {ENTIDAD} gestiona su tecnología biomédica de forma segura a lo largo de todo su ciclo de vida: planeación, selección, adquisición, instalación, uso, mantenimiento y calibración, seguimiento, traslados, evaluación, baja, disposición final y renovación.` },
        { t: 'OBJETIVOS', x: `## Objetivo general
Implementar un protocolo para la seguridad y el manejo adecuado de la tecnología biomédica de {ENTIDAD} en todas las etapas de su ciclo de vida.
## Objetivos específicos
- Garantizar el uso seguro de la tecnología, minimizando los riesgos de la atención.
- Evitar el uso de tecnología defectuosa o en malas condiciones.
- Asegurar la trazabilidad de cada equipo desde su ingreso hasta su disposición final.
- Articular la gestión de la tecnología con los programas de mantenimiento, metrología y tecnovigilancia.` },
        { t: 'ALCANCE', x: `Aplica a toda la tecnología biomédica de {ENTIDAD} y al personal de compras, almacén, servicios asistenciales e ingeniería biomédica, en sus sedes: {SEDES}.` },
        { t: 'RESPONSABLE', x: `El responsable de implementar el presente protocolo es el ingeniero(a) biomédico(a) ({EMPRESA}), con el apoyo del representante legal y los líderes de servicio.` },
        { t: 'MARCO LEGAL', x: NORMAS_BASE },
        { t: 'DOCUMENTOS RELACIONADOS', x: `- FMB-001 Inventario · FHVEB-001 Hoja de vida · FMB-002 Cronograma de mantenimiento.
- FMB-004 / FMB-005 Reportes de mantenimiento preventivo y correctivo.
- FT-AE-032 Acta de entrega · FT-AB-033 Acta de baja.
- PG-MB-001 Programa de mantenimiento · PGAM-028 Aseguramiento metrológico.
- PR-ANT-023 Adquisición de nuevas tecnologías · Programa institucional de tecnovigilancia.` },
        { t: 'DEFINICIONES', x: `- Dispositivo médico: instrumento, aparato, máquina o software destinado a la prevención, diagnóstico, tratamiento o rehabilitación (Decreto 4725 de 2005).
- Accesorio: elemento destinado por el fabricante a usarse junto con un dispositivo médico.
- Equipo biomédico: dispositivo médico operacional y funcional que reúne sistemas y subsistemas eléctricos, electrónicos o mecánicos.
- Evento adverso: daño no intencionado al paciente, operador o medio ambiente asociado al uso de un dispositivo médico.
- Incidente adverso: daño potencial que no llegó a ocurrir por una intervención oportuna o por azar.
- Gestión de tecnología: conjunto de procesos para la incorporación, uso seguro y renovación de la tecnología.` },
        { t: 'CICLO DE LA GESTIÓN TECNOLÓGICA', x: `[[CICLO]]

## Planeación
{ENTIDAD} identifica sus necesidades de tecnología según los servicios habilitados, la suficiencia y el estado de su dotación, cumpliendo el estándar de dotación de la Resolución 3100 de 2019.
## Selección
Se tienen en cuenta: características técnicas y clínicas; registro sanitario y clasificación de riesgo; soporte técnico, repuestos y garantía; costos de operación y mantenimiento; y capacitación ofrecida por el proveedor.
## Adquisición
Se realiza según el procedimiento PR-ANT-023, con concepto técnico de ingeniería biomédica.
## Instalación
Todo equipo nuevo se inspecciona, se instala en las condiciones eléctricas y ambientales requeridas, se prueba, se registra en el inventario, se abre su hoja de vida y se entrega con acta y capacitación al personal.
## Uso
El equipo se usa solo por personal capacitado, según el manual del fabricante y para el fin previsto; se aplica el protocolo de limpieza y desinfección.
## Mantenimiento y calibración
Se ejecutan según el programa de mantenimiento (PG-MB-001) y el de aseguramiento metrológico (PGAM-028), con sus cronogramas.
## Seguimiento
Se realiza mediante las hojas de vida, los reportes de servicio, las rondas biomédicas, los indicadores y el Programa institucional de tecnovigilancia.
## Traslados
Todo traslado de un equipo entre servicios o sedes se informa a ingeniería biomédica para actualizar el inventario y verificar su funcionamiento en el nuevo lugar.
## Evaluación
Se evalúa periódicamente el desempeño de la tecnología: fallas, costos de mantenimiento, obsolescencia y satisfacción de los usuarios.
## Baja y disposición final
Los equipos que cumplen los criterios de baja se retiran con el acta FT-AB-033 y se disponen como residuo de aparatos eléctricos y electrónicos con un gestor autorizado.
## Renovación
La información de evaluación y baja alimenta la planeación de la renovación tecnológica.` },
        { t: 'INDICADORES', x: `[[INDICADORES_MTTO]]` },
        { t: 'ACCIONES SEGURAS', x: `- Verificar el estado del equipo y sus accesorios antes de usarlo con el paciente.
- Usar el equipo solo para el fin previsto y según el manual del fabricante.
- Reportar inmediatamente cualquier falla, daño o evento adverso.
- Mantener los equipos conectados a tomas con polo a tierra y sin extensiones improvisadas.
- Respetar las fechas de mantenimiento y calibración y las etiquetas de estado.` },
        { t: 'ACCIONES INSEGURAS', x: `- Usar equipos con etiqueta de fuera de servicio, calibración vencida o daños visibles.
- Desactivar o ignorar alarmas.
- Intervenir o abrir equipos sin autorización de ingeniería biomédica.
- Usar accesorios no compatibles o no autorizados por el fabricante.
- Aplicar productos de limpieza no compatibles directamente sobre el equipo.` },
        { t: 'BIBLIOGRAFÍA', x: `- Decreto 4725 de 2005 y Resolución 4816 de 2008.
- Organización Mundial de la Salud. Serie de documentos técnicos sobre dispositivos médicos.
- Resolución 3100 de 2019.` },
        CAMBIOS,
      ] },
  ];
})();
