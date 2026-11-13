// =====================================================================
//  PROGRAMA DE TECNOVIGILANCIA (independiente por entidad)
//  Pestañas: Programa (documento PG-TV-001 adaptable) · Reportes serios
//  72 h (FT-PGTV-016) · Trimestral RETEIM-002 (no serios / en cero) ·
//  Comités (FAR-013) · Capacitaciones (plan semestral, presentación,
//  pre y post test FMB-008, lista de asistencia) · Indicadores ·
//  Alertas e informes de seguridad.
//  Tablas: eventos (columnas datos, clasificacion) y tv_registros.
//  Solo el propietario crea o modifica; la entidad consulta y descarga PDF.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const TV = (A.TV = A.TV || {});
  const { h, I, toast, modal, confirmar, leer, f } = UI;
  const esProp = A.esProp;
  const TB = 'tv_registros';
  const anioAct = new Date().getFullYear();

  // ------------------------------------------------------------------ catálogos
  TV.TRIM = ['Primer trimestre', 'Segundo trimestre', 'Tercer trimestre', 'Cuarto trimestre'];
  TV.mesesTrim = (t) => CAT.MESES.slice((t - 1) * 3, t * 3).map((m) => m.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' y $1');
  TV.CLASIF = ['Evento adverso serio', 'Incidente adverso serio', 'Evento adverso no serio', 'Incidente adverso no serio'];
  TV.DESENLACES = ['Muerte', 'Enfermedad o daño que amenace la vida', 'No hubo daño', 'Requiere intervención médica o quirúrgica', 'Daño de una función o estructura corporal', 'Hospitalización inicial o prolongada', 'Otro'];
  TV.CAUSAS = [[500, 'Uso anormal'], [510, 'Respuesta fisiológica anormal o inexplicable'], [520, 'Falla en la alarma'], [530, 'Uso de material biológico'], [540, 'Calibración'], [550, 'Hardware de computador'], [560, 'Contaminación durante la producción'], [570, 'Contaminación post-producción'], [580, 'Diseño'], [590, 'Desconexión'], [600, 'Componente eléctrico'], [610, 'Circuito eléctrico'], [620, 'Contacto eléctrico'], [630, 'Interferencia electromagnética EIM'], [640, 'Fecha de expiración'], [650, 'Falso negativo'], [670, 'Falso positivo'], [680, 'Resultado falso de la prueba'], [690, 'Ambiente inapropiado'], [700, 'Incompatibilidad'], [710, 'Instrucciones para uso y rotulado'], [720, 'Escape / sellado'], [730, 'Mantenimiento'], [740, 'Fabricación'], [750, 'Material'], [760, 'Componentes mecánicos'], [770, 'Condiciones no higiénicas'], [780, 'No relacionado con el dispositivo'], [790, 'Otros'], [800, 'Empaque'], [810, 'Anatomía / fisiología del paciente'], [820, 'Condiciones del paciente'], [830, 'Fuente de energía'], [840, 'Medida de protección'], [850, 'Aseguramiento de la calidad en la institución para la atención de salud'], [860, 'Radiación'], [870, 'Software'], [880, 'Esterilización / desinfección / limpieza'], [890, 'Condiciones de almacenamiento'], [900, 'Manipulación, falsificación, sabotaje'], [910, 'Entrenamiento'], [920, 'Transporte y entrega'], [930, 'Sin definir'], [950, 'Error de uso'], [960, 'Desgaste']];
  TV.causaTxt = (c) => { if (!c) return ''; const x = TV.CAUSAS.find((z) => String(z[0]) === String(c)); return x ? `${x[0]} - ${x[1]}` : String(c); };
  TV.estadoTxt = (e) => ({ A: 'Abierto', S: 'Seguimiento', C: 'Cerrado' }[e] || e || '');
  TV.cfg = (ent) => ent?.config?.programa_tv || {};
  TV.SUBS = ['1. PROGRAMA DE TECNOVIGILANCIA', '2. ANEXOS DEL PROGRAMA', '3. COMITÉS DE TECNOVIGILANCIA', '4. REPORTES TRIMESTRALES', '5. REPORTES SERIOS 72 HORAS', '6. CAPACITACIONES', '7. INDICADORES'];
  TV.esSerio = (ev) => (ev.clasificacion ? / serio$/i.test(ev.clasificacion) && !/no serio/i.test(ev.clasificacion) : ['Muerte', 'Deterioro grave'].includes(ev.consecuencia));
  const trimDe = (iso) => Math.floor(new Date(String(iso).length <= 10 ? iso + 'T12:00:00' : iso).getMonth() / 3) + 1;
  const anioDe = (iso) => new Date(String(iso).length <= 10 ? iso + 'T12:00:00' : iso).getFullYear();
  const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(0, 70);
  const eqv = (x) => String(x).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/^\s*\d+\s*[.\-)]\s*/, '').replace(/\b(DE|DEL|LA|LAS|LOS|Y|EL)\b/g, '').replace(/[^A-Z]/g, '');
  // subcarpeta destino: usa la existente equivalente (ej. "4. REPORTES TRIMESTRALES") o la estándar
  TV.subDestino = async (ent, i) => {
    const def = TV.SUBS[i], k = eqv(def);
    const docs = (await S.list('documentos', { entidad_id: ent.id })).filter((d) => d.carpeta === 'tecnovigilancia');
    const r = [...new Set(docs.map((d) => (d.subcarpeta || '').split('/')[0]).filter(Boolean))].find((x) => { const e = eqv(x); return e === k || (Math.min(e.length, k.length) >= 6 && (e.includes(k) || k.includes(e))); });
    return r || def;
  };
  const guardarEnCarpeta = async (ent, doc, nombre, i) => {
    const subcarpeta = await TV.subDestino(ent, i);
    await A.guardarPDF({ blob: doc.output('blob'), nombre, entidad_id: ent.id, equipo_id: null, carpeta: 'tecnovigilancia', subcarpeta });
    toast(`Guardado en ${subcarpeta}`);
  };
  const verDoc = (ent, doc, titulo, nombre, i = null) => UI.verPDF({ titulo, blob: doc.output('blob'), nombre,
    extras: esProp() && i !== null ? [{ t: `${I.carpeta || ''} Guardar en la carpeta`, fn: async () => { await guardarEnCarpeta(ent, doc, nombre, i); return false; } }] : [] });
  const guardarCfg = async (ent, o) => { const config = { ...(ent.config || {}), programa_tv: { ...TV.cfg(ent), ...o } }; await S.update('entidades', ent.id, { config }); ent.config = config; };
  const faltaSQL = (er) => /tv_registros|column .*datos|datos.*column|clasificacion|schema cache|does not exist|relation/i.test(er?.message || '');
  const avisoSQL = () => `<div class="empty">Falta actualizar la base de datos para el programa de tecnovigilancia.${esProp() ? ' En Supabase → SQL Editor ejecute una vez el archivo <span class="mono">supabase/tecnovigilancia.sql</span> del repositorio.' : ' Avise a IBCOL.'}</div>`;
  const regsDe = async (ent) => { try { return await S.list(TB, { entidad_id: ent.id }); } catch (er) { if (faltaSQL(er)) return null; throw er; } };
  const pill = (t, c = '') => `<span class="pill ${c}">${h(t)}</span>`;

  // ------------------------------------------------------------------ casos tipo (presentación) y banco de preguntas
  TV.CASOS = [
    { titulo: 'bomba de infusión con flujo libre', tipo: 'Evento adverso serio', que: 'Durante el cambio del equipo de venoclisis se abrió la puerta de la bomba sin cerrar la pinza del equipo; la solución con medicamento pasó por flujo libre y el paciente presentó hipotensión que requirió traslado a cuidado intermedio.', hacer: ['Atender al paciente y suspender la infusión.', 'Retirar la bomba y el equipo de venoclisis, rotular "NO USAR" y conservarlos.', 'Diligenciar FT-PGTV-016 y reportar al INVIMA dentro de 72 h.', 'Informar al importador; analizar en comité.'], leccion: 'Verificar el sistema anti flujo libre, capacitar en el cambio de equipos y revisar el mantenimiento de la puerta y sensores.' },
    { titulo: 'quemadura por placa de electrobisturí', tipo: 'Evento adverso serio', que: 'Al terminar una cirugía se encontró una quemadura de segundo grado en el muslo del paciente, en el sitio de la placa neutra (de retorno), que estaba parcialmente despegada.', hacer: ['Curación y valoración médica del paciente.', 'Conservar la placa, su lote y registro sanitario; retirar el electrobisturí para revisión.', 'Reporte inmediato (72 h) y análisis con el Protocolo de Londres.'], leccion: 'Lista de verificación de la placa neutra, uso de electrobisturí con monitoreo de contacto (REM) y mantenimiento preventivo al día.' },
    { titulo: 'desfibrilador que no descarga en la prueba diaria', tipo: 'Incidente adverso serio', que: 'En la verificación diaria del carro de paro el desfibrilador no entregó la descarga de prueba por falla de la batería. No se usó en ningún paciente porque la falla se detectó antes.', hacer: ['Retirar de inmediato el equipo y reemplazarlo por uno de respaldo.', 'Reportar como incidente serio (pudo causar la muerte) dentro de 72 h.', 'Solicitar el servicio técnico y revisar el plan de mantenimiento.'], leccion: 'La prueba diaria fue la barrera que funcionó: los incidentes también se reportan.' },
    { titulo: 'irritación por electrodos de monitoreo', tipo: 'Evento adverso no serio', que: 'Un paciente monitorizado por 48 horas presentó enrojecimiento y prurito leve en la piel bajo los electrodos de ECG, que mejoró al retirarlos sin requerir tratamiento adicional.', hacer: ['Retirar los electrodos y valorar la piel.', 'Registrar el lote y el fabricante.', 'Diligenciar FT-PGTV-016 y consolidar en el reporte trimestral RETEIM-002.'], leccion: 'Rotar los sitios de colocación y vigilar la piel en monitoreos prolongados.' },
    { titulo: 'glucómetro fuera de rango en el control de calidad', tipo: 'Incidente adverso no serio', que: 'En el control de calidad diario el glucómetro marcó un valor fuera del rango de la solución control. Se detectó antes de tomar muestras a pacientes.', hacer: ['No usar el glucómetro con pacientes y usar uno de respaldo.', 'Revisar tiras (lote y vencimiento) y repetir el control.', 'Registrar en el formato de control de glucometría y en FT-PGTV-016 (trimestral).'], leccion: 'El control de calidad diario y la metrología evitan resultados falsos que pueden cambiar el tratamiento.' },
    { titulo: 'jeringas con émbolo defectuoso de un mismo lote', tipo: 'Incidente adverso no serio', que: 'El personal de enfermería encontró varias jeringas del mismo lote con el émbolo trabado, antes de cargar medicamentos.', hacer: ['Separar todo el lote y rotularlo.', 'Informar al proveedor e importador; consultar si hay alerta del INVIMA.', 'Diligenciar FT-PGTV-016 (no serio) y hacer seguimiento a la respuesta del proveedor.'], leccion: 'Revisar los dispositivos antes de usarlos y conservar siempre el empaque con el lote.' },
  ];
  TV.PREGUNTAS = [
    { p: '¿Qué es la tecnovigilancia?', o: ['El conjunto de actividades para identificar, reportar y gestionar eventos e incidentes adversos asociados a dispositivos médicos', 'El programa de facturación de equipos biomédicos', 'El inventario anual de equipos', 'La auditoría de historias clínicas'], c: [0] },
    { p: '¿Qué norma reglamenta el Programa Nacional de Tecnovigilancia en Colombia?', o: ['Resolución 4816 de 2008', 'Ley 100 de 1993', 'Resolución 2003 de 2014', 'Decreto 1072 de 2015'], c: [0] },
    { p: '¿En qué plazo se reporta al INVIMA un evento o incidente adverso SERIO?', o: ['Dentro de las 72 horas siguientes a su conocimiento', 'Cada trimestre', 'Una vez al año', 'No se reporta'], c: [0] },
    { p: '¿Cómo se reportan los eventos e incidentes adversos NO serios?', o: ['En el reporte trimestral (consolidado RETEIM-002)', 'Dentro de las 24 horas por teléfono', 'Solo si el paciente pone una queja', 'No se reportan'], c: [0] },
    { p: 'Si en el trimestre no se presentó ningún evento ni incidente adverso:', o: ['Se envía el reporte trimestral en cero', 'No se hace nada', 'Se espera al siguiente trimestre', 'Se reporta al fabricante'], c: [0] },
    { p: 'Un incidente adverso es:', o: ['Un potencial daño que no ocurrió por causalidad o por una barrera de seguridad', 'Un daño que sí le ocurrió al paciente', 'Una falla en la facturación', 'Un cambio de turno'], c: [0] },
    { p: '¿Cuáles se consideran deterioro serio de la salud? (puede marcar varias)', o: ['Enfermedad o daño que amenace la vida', 'Evento que requiera hospitalización o la prolongue', 'Daño de una función o estructura corporal', 'Una molestia leve que no requiere atención'], c: [0, 1, 2] },
    { p: '¿Qué formato usa la institución para reportar un evento o incidente adverso?', o: ['FT-PGTV-016 Reporte voluntario de evento / incidente adverso', 'FAR-013 Acta de reunión', 'FMB-001 Inventario', 'FT-PGTV-015 Bitácora de alertas'], c: [0] },
    { p: 'Ante un evento con un dispositivo médico usted debe: (puede marcar varias)', o: ['Atender primero al paciente', 'Retirar, rotular y conservar el dispositivo (no desecharlo)', 'Avisar al delegado o referente de tecnovigilancia', 'Botar el dispositivo para que nadie más lo use'], c: [0, 1, 2] },
    { p: 'La cultura del reporte en tecnovigilancia es:', o: ['No punitiva, confidencial y orientada a aprender y mejorar', 'Una forma de sancionar al responsable', 'Opcional y solo para médicos', 'Pública, con el nombre del paciente'], c: [0] },
  ];

  // ------------------------------------------------------------------ casos de la presentación según los equipos y dispositivos de la institución
  // (casos tipo, basados en reportes frecuentes de tecnovigilancia, con los mismos equipos que maneja la entidad)
  const SE = 'Evento adverso serio', SI = 'Incidente adverso serio', NE = 'Evento adverso no serio', NI = 'Incidente adverso no serio';
  TV.CASOS_BIB = [
    { m: /electrobistur/, titulo: 'quemadura por placa neutra del electrobisturí', tipo: SE, que: 'Al finalizar un procedimiento se encontró una quemadura de segundo grado en el muslo del paciente, en el sitio de la placa neutra (de retorno), que estaba parcialmente despegada.', hacer: ['Curación y valoración médica del paciente.', 'Retirar el electrobisturí y conservar la placa con su lote.', 'Reporte al INVIMA dentro de 72 h y análisis en comité.'], leccion: 'Verificar la adherencia de la placa antes de activar, revisar cables y alarmas, y mantener el mantenimiento preventivo al día.' },
    { m: /autoclave|esteriliz/, titulo: 'ciclo de autoclave sin esterilizar', tipo: SI, que: 'El indicador químico / biológico de un ciclo de la autoclave no viró, pero el instrumental ya estaba empacado para usarse en pacientes. Se detectó antes de usarlo.', hacer: ['Retener todo el instrumental de ese ciclo y reprocesarlo.', 'Retirar la autoclave del servicio y solicitar revisión técnica.', 'Reportar como incidente serio (pudo causar infección grave) dentro de 72 h.'], leccion: 'Registrar cada ciclo con indicadores, no liberar carga sin verificar y cumplir la validación y el mantenimiento del equipo.' },
    { m: /parafina/, titulo: 'quemadura por tanque de parafina', tipo: SE, que: 'Durante una terapia, la parafina estaba a una temperatura mayor a la indicada por falla del termostato y el paciente presentó una quemadura con ampollas en la mano que requirió atención médica.', hacer: ['Retirar la mano, enfriar y remitir a valoración médica.', 'Desconectar el tanque y rotularlo "NO USAR".', 'Reporte al INVIMA dentro de 72 h.'], leccion: 'Verificar la temperatura con termómetro antes de cada uso y calibrar el termostato en el mantenimiento.' },
    { m: /tens|electroestim|ems\b/, titulo: 'quemadura por electrodos del electroestimulador', tipo: SE, que: 'Un paciente en fisioterapia presentó quemadura en la piel bajo un electrodo del TENS / electroestimulador, que estaba reseco y deteriorado; requirió curaciones.', hacer: ['Suspender la terapia y valorar la lesión.', 'Conservar los electrodos y retirar el equipo para revisión.', 'Reportar dentro de 72 h si requirió intervención médica.'], leccion: 'Cambiar electrodos deteriorados, revisar la piel antes y durante la terapia y controlar la intensidad.' },
    { m: /puls|ox[ií]metr/, titulo: 'pulsioxímetro con lectura falsa', tipo: SI, que: 'El pulsioxímetro marcaba 98 % en un paciente con dificultad respiratoria; al usar otro equipo la saturación real era 85 %. Se corrigió a tiempo.', hacer: ['Atender al paciente con el valor correcto.', 'Retirar el pulsioxímetro y enviarlo a verificación.', 'Reportar como incidente serio (pudo retrasar un tratamiento vital).'], leccion: 'Verificar la lectura cuando no coincide con el estado clínico y cumplir la metrología del equipo.' },
    { m: /doppler/, titulo: 'doppler fetal sin señal por batería', tipo: SI, que: 'El doppler fetal no detectaba la frecuencia cardiaca fetal; se comprobó que la batería estaba baja y el gel insuficiente. Con otro equipo la frecuencia era normal.', hacer: ['Confirmar con otro equipo o remitir.', 'Retirar el doppler y revisar baterías y transductor.', 'Reportar el incidente y consolidar el análisis.'], leccion: 'Revisar baterías y funcionamiento al iniciar el turno; un falso negativo puede llevar a decisiones equivocadas.' },
    { m: /electrocardi/, titulo: 'electrocardiógrafo con interferencia', tipo: NI, que: 'El trazo del electrocardiograma salió con interferencia por un cable de paciente deteriorado; se repitió el examen con otro cable antes de interpretarlo.', hacer: ['Repetir el examen con el cable en buen estado.', 'Retirar y rotular el cable dañado.', 'Diligenciar FT-PGTV-016 y consolidar en el reporte trimestral.'], leccion: 'Inspeccionar cables y electrodos antes de usar; un trazo erróneo puede llevar a un diagnóstico equivocado.' },
    { m: /unidad odont|pieza|scaler|odont/, titulo: 'fresa que se suelta de la pieza de mano', tipo: NE, que: 'Durante un procedimiento odontológico la fresa se soltó de la pieza de mano de alta velocidad y causó una pequeña laceración en la mucosa del paciente, que no requirió tratamiento adicional.', hacer: ['Atender la lesión y tranquilizar al paciente.', 'Retirar la pieza de mano para revisión del mandril.', 'Diligenciar FT-PGTV-016 (no serio, reporte trimestral).'], leccion: 'Verificar el ajuste de la fresa antes de cada uso y lubricar / mantener las piezas de mano según el fabricante.' },
    { m: /fotocur/, titulo: 'lámpara de fotocurado con baja potencia', tipo: NI, que: 'En la verificación con radiómetro la lámpara de fotocurado tenía una irradiancia muy baja; las restauraciones podían quedar mal polimerizadas. Se detectó antes de afectar pacientes.', hacer: ['Retirar la lámpara y usar una de respaldo.', 'Revisar batería, guía de luz y filtro.', 'Registrar el incidente no serio.'], leccion: 'Medir la potencia periódicamente y limpiar la guía de luz.' },
    { m: /amalgam/, titulo: 'cápsula del amalgamador que se abre', tipo: NI, que: 'La cápsula se abrió durante el mezclado en el amalgamador y se dispersó material, con riesgo de exposición a mercurio para el personal.', hacer: ['Aislar el área y recoger con el kit de derrames.', 'Revisar el brazo y la tapa del amalgamador.', 'Reportar el incidente no serio.'], leccion: 'Usar cápsulas en buen estado, cerrar la tapa y seguir el protocolo de manejo de mercurio.' },
    { m: /gluc/, titulo: 'glucómetro fuera de rango en el control de calidad', tipo: NI, que: 'En el control de calidad diario el glucómetro marcó un valor fuera del rango de la solución control. Se detectó antes de tomar muestras a pacientes.', hacer: ['No usar el glucómetro con pacientes y usar uno de respaldo.', 'Revisar tiras (lote y vencimiento) y repetir el control.', 'Registrar en el control de glucometría y en FT-PGTV-016.'], leccion: 'El control de calidad diario evita resultados falsos que pueden cambiar el tratamiento.' },
    { m: /tensi[oó]metro|esfigmo/, titulo: 'tensiómetro descalibrado', tipo: NI, que: 'En la verificación metrológica el tensiómetro marcaba 15 mmHg por debajo del patrón; pudo llevar a no detectar pacientes hipertensos.', hacer: ['Retirar el tensiómetro y usar uno verificado.', 'Enviarlo a calibración / ajuste.', 'Registrar el incidente no serio y revisar las tomas recientes si es necesario.'], leccion: 'Cumplir el cronograma de metrología y verificar el cero antes de usar.' },
    { m: /b[aá]scula|balanza/, titulo: 'báscula con peso erróneo', tipo: NI, que: 'La báscula pediátrica marcaba 300 g de más al verificarla con una pesa patrón; el peso se usa para calcular dosis de medicamentos.', hacer: ['Retirar la báscula y pesar con un equipo verificado.', 'Solicitar calibración.', 'Registrar el incidente no serio.'], leccion: 'Verificar la tara en cero y cumplir la metrología; un error de peso cambia las dosis.' },
    { m: /centr[ií]fug/, titulo: 'tubos rotos en la centrífuga', tipo: NI, que: 'Al abrir la centrífuga se encontraron tubos rotos y muestra derramada; la tapa permitió abrir antes de detenerse por completo.', hacer: ['Esperar, desinfectar con el protocolo de derrame biológico.', 'Retirar la centrífuga para revisar el seguro de la tapa y el balanceo.', 'Reportar el incidente no serio.'], leccion: 'Balancear los tubos, no abrir hasta que pare y revisar el seguro de tapa en el mantenimiento.' },
    { m: /hematolog|analizador|qu[ií]mica|microscop|micropipet/, titulo: 'resultado de laboratorio erróneo', tipo: NI, que: 'El control de calidad interno del equipo de laboratorio salió fuera de rango y se detectó que la calibración estaba vencida; los resultados del día se revisaron antes de entregarlos.', hacer: ['No entregar resultados hasta corregir.', 'Calibrar / verificar el equipo y repetir controles.', 'Registrar el incidente no serio.'], leccion: 'Sin control de calidad aprobado no se procesan muestras de pacientes.' },
    { m: /nevera|refriger|termohigr|term[oó]metro max/, titulo: 'nevera fuera del rango de temperatura', tipo: NI, que: 'El registro del termohigrómetro mostró que la nevera estuvo a 12 °C durante la noche; contenía reactivos y medicamentos que requieren 2 a 8 °C.', hacer: ['Separar y rotular los productos afectados y consultar al fabricante.', 'Revisar la nevera y el termómetro.', 'Registrar el incidente no serio.'], leccion: 'Registrar temperaturas dos veces al día y tener plan de contingencia de cadena de frío.' },
    { m: /term[oó]metro/, titulo: 'termómetro digital con lectura errónea', tipo: NI, que: 'El termómetro digital marcaba 36 °C en un paciente febril; con otro termómetro la temperatura era 38,9 °C.', hacer: ['Confirmar con otro termómetro.', 'Retirar el equipo y revisar la batería.', 'Registrar el incidente no serio.'], leccion: 'Verificar los termómetros contra un patrón y cambiar baterías a tiempo.' },
    { m: /caminadora|banda/, titulo: 'caminadora que se detiene bruscamente', tipo: NE, que: 'Durante la terapia la caminadora se detuvo de golpe; el paciente perdió el equilibrio y tuvo una contusión leve en la rodilla.', hacer: ['Valorar al paciente.', 'Retirar la caminadora y revisar la banda, el motor y la parada de emergencia.', 'Diligenciar FT-PGTV-016 (no serio).'], leccion: 'Usar siempre la llave de seguridad y revisar la banda en el mantenimiento preventivo.' },
    { m: /ultrasonido/, titulo: 'enrojecimiento por ultrasonido terapéutico', tipo: NE, que: 'Tras una sesión de ultrasonido terapéutico el paciente presentó enrojecimiento y ardor en la zona tratada; el cabezal se había usado con poco gel y sin movimiento.', hacer: ['Valorar la piel y suspender la sesión.', 'Verificar la potencia del equipo.', 'Registrar el evento no serio.'], leccion: 'Usar gel suficiente, mover el cabezal y verificar la salida de potencia periódicamente.' },
    { m: /guante/, titulo: 'reacción a guantes de látex', tipo: NE, que: 'Una auxiliar presentó enrojecimiento y prurito en las manos al usar guantes de látex de un nuevo lote.', hacer: ['Suspender el uso y valorar.', 'Registrar el lote y el fabricante.', 'Diligenciar FT-PGTV-016 y ofrecer guantes de nitrilo.'], leccion: 'Preguntar por alergias al látex y tener alternativas disponibles.' },
    { m: /jeringa/, titulo: 'jeringas con émbolo defectuoso', tipo: NI, que: 'Se encontraron varias jeringas del mismo lote con el émbolo trabado, antes de cargar medicamentos.', hacer: ['Separar todo el lote y rotularlo.', 'Informar al proveedor y consultar alertas del INVIMA.', 'Diligenciar FT-PGTV-016 (no serio).'], leccion: 'Revisar el dispositivo antes de usar y conservar el empaque con el lote.' },
    { m: /sonda|foley|nelaton/, titulo: 'balón de sonda Foley que no infla', tipo: NE, que: 'Al instalar una sonda Foley el balón no infló y la sonda se salió, por lo que hubo que repetir el procedimiento con molestia para el paciente.', hacer: ['Instalar una sonda nueva.', 'Conservar la sonda defectuosa con su empaque y lote.', 'Registrar el evento no serio e informar al proveedor.'], leccion: 'Probar el balón antes de insertar y reportar los lotes con fallas repetidas.' },
    { m: /tapabocas|bata|gorro|gasa|micropore|esparadrapo|ap[oó]sito/, titulo: 'insumo de un lote defectuoso', tipo: NI, que: 'Se encontraron tapabocas / gasas de un mismo lote con empaque roto o costuras abiertas, antes de usarlos con pacientes.', hacer: ['Separar el lote.', 'Informar al proveedor y consultar alertas.', 'Registrar el incidente no serio.'], leccion: 'Revisar empaques, fechas y lotes al recibir y antes de usar.' },
  ];
  const sinTilde = (x) => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // elige casos serios y no serios con los equipos / dispositivos de la entidad (si no hay coincidencias, usa los casos generales)
  TV.casosPara = (ent, eqs = []) => {
    const dv = TV.cfg(ent).dispositivos?.clases || [];
    const nombres = [...new Set([...eqs.filter((e) => e.estado !== 'Dado de baja').map((e) => e.nombre), ...dv.flatMap((c) => c.filas.flatMap((f) => [f[0], f[2]]))].filter(Boolean).map(sinTilde))];
    const ok = TV.CASOS_BIB.filter((c) => nombres.some((n) => c.m.test(n)));
    const serios = ok.filter((c) => !/no serio/.test(c.tipo)), noSer = ok.filter((c) => /no serio/.test(c.tipo));
    const sel = [...serios.slice(0, 3), ...noSer.slice(0, 8 - Math.min(3, serios.length))];
    return sel.length >= 3 ? sel : TV.CASOS;
  };
  const preguntasDe = (ent) => (TV.cfg(ent).preguntas?.length ? TV.cfg(ent).preguntas : TV.PREGUNTAS);
  const PLAN_BASE = [
    ['S1', 2, 'Programa de tecnovigilancia: normativa, responsabilidades y cultura del reporte', 'Dar a conocer el programa institucional, la Resolución 4816 de 2008, el referente y el delegado, y por qué reportar (no punitivo y confidencial).'],
    ['S1', 4, 'Identificación y clasificación de eventos e incidentes adversos (serios y no serios) con casos reales', 'Diferenciar evento / incidente, serio / no serio, con casos tipo y casos de la institución.'],
    ['S1', 6, 'Cómo reportar: formato FT-PGTV-016, reporte en 72 horas y reporte trimestral', 'Diligenciar el formato paso a paso; tiempos de reporte al INVIMA; reporte en cero.'],
    ['S2', 8, 'Alertas sanitarias, RISARH, retiros de producto e informes de seguridad', 'Consultar y gestionar alertas del INVIMA y agencias internacionales; bitácora FT-PGTV-015.'],
    ['S2', 10, 'Uso seguro de equipos biomédicos y errores de uso más frecuentes', 'Prevenir eventos por error de uso, falta de mantenimiento o calibración (NTC 5736).'],
    ['S2', 11, 'Análisis de casos (Protocolo de Londres) y lecciones aprendidas del año', 'Socializar los casos analizados en comité, planes de acción e incentivos al reporte.'],
  ];

  // ================================================================== VISTA PRINCIPAL
  st.tvTab = st.tvTab || {};
  const TABS = ['Programa', 'Reportes serios 72 h', 'Trimestral RETEIM-002', 'Comités', 'Capacitaciones', 'Indicadores', 'Alertas e informes'];
  A.G.tecnovigilancia = async (el, ctx) => {
    const { ent } = ctx; const tab = st.tvTab[ent.id] ?? 0;
    el.innerHTML = `<section class="panel tv-nav" style="padding-top:6px;padding-bottom:0"><div class="tabs" role="tablist" aria-label="Programa de tecnovigilancia">${TABS.map((t, i) => `<button type="button" role="tab" class="${i === tab ? 'on' : ''}" aria-selected="${i === tab}" data-act="tvTab" data-i="${i}">${h(t)}</button>`).join('')}</div></section><div data-tv style="display:grid;gap:18px"></div>`;
    A.acts({ tvTab: (d) => { st.tvTab[ent.id] = +d.i; A.G.tecnovigilancia(el, ctx); } });
    const box = el.querySelector('[data-tv]');
    try { await [vPrograma, vSerios, vTrimestral, (b) => A.G.comites(b, ctx), vCapacitacion, vIndicadores, vAlertas][tab](box, ctx); } catch (er) { console.error(er); box.innerHTML = `<section class="panel">${faltaSQL(er) ? avisoSQL() : `<div class="empty">${h(er.message)}</div>`}</section>`; }
  };

  // ================================================================== 1. PROGRAMA (documento adaptable por entidad)
  const textoDe = (ent) => TV.cfg(ent).texto || st.fmt.programa_tv_texto?.texto || '';
  const vPrograma = async (box, { ent }) => {
    const cfg = TV.cfg(ent), plantilla = st.fmt.programa_tv_texto?.texto || '', fmt = { ...TV.fmtDe('programa_tv'), ...(cfg.codigo ? { codigo: cfg.codigo } : {}), ...(cfg.version ? { version: cfg.version } : {}) };
    const [evs, regs, actas] = await Promise.all([S.list('eventos', { entidad_id: ent.id }), regsDe(ent), S.list('actas_comite', { entidad_id: ent.id }).catch(() => [])]);
    const rr = regs || [];
    const ses = rr.filter((r) => r.tipo === 'sesion' && r.datos?.programa !== 'equipos' && r.anio === anioAct), ej = ses.filter((s) => s.datos?.estado === 'Ejecutada').length;
    const trimOk = rr.filter((r) => r.tipo === 'trimestral' && r.anio === anioAct && r.datos?.fecha_envio).length;
    const tActual = trimDe(UI.hoy()), trimDebidos = tActual - 1;
    const item = (ok, t, det) => `<li style="display:flex;gap:10px;align-items:flex-start;padding:6px 0;border-bottom:1px solid var(--line)">${pill(ok ? 'Cumple' : 'Pendiente', ok ? 'ok' : 'warn')}<div><b>${h(t)}</b><div class="muted" style="font-size:.85rem">${h(det)}</div></div></li>`;
    box.innerHTML = `<section class="panel"><header><div><h2>Documento del programa · ${h(fmt.codigo)} v${h(fmt.version)}</h2><span class="muted" style="font-size:.85rem">Programa institucional adaptado a ${h(ent.razon_social)}, basado en el documento de referencia de IBCOL. ${cfg.texto ? 'Esta entidad tiene un texto personalizado.' : plantilla ? 'Usa el texto de referencia.' : 'Aún no hay texto de referencia cargado.'}</span></div>
        <div class="actions">${esProp() ? `<button class="btn" data-act="tvDatos">${I.edit} Datos del programa</button><button class="btn" data-act="tvTexto">${I.edit} Personalizar texto</button><button class="btn" data-act="tvActo">Acto administrativo (${h(TV.fmtDe('acto_tv').codigo)})</button><button class="btn" data-act="tvDispo">Dispositivos objeto de vigilancia${cfg.dispositivos?.clases?.length ? ' ✓' : ''}</button>${!cfg.texto ? '' : `<button class="btn" data-act="tvTextoRef">Volver al de referencia</button>`}<button class="btn" data-act="tvPlantilla">Plantilla de referencia</button>` : ''}<button class="btn pri" data-act="tvGenerar" ${textoDe(ent) ? '' : 'disabled'}>${I.pdf} ${esProp() ? 'Generar documento (PDF)' : 'Ver documento (PDF)'}</button></div></header>
      <div class="fields" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
        ${[['Referente del programa', [cfg.referente, cfg.cargo].filter(Boolean).join(' · ')], ['Delegado', [cfg.delegado, cfg.cargo_delegado].filter(Boolean).join(' · ')], ['Código inscripción Red Nacional (RNT)', cfg.codigo_rnt], ['Usuario aplicativo INVIMA', cfg.usuario_invima], ['Correo de notificaciones', cfg.correo], ['Fecha del documento', cfg.fecha ? UI.fecha(cfg.fecha) : UI.fecha(fmt.fecha)]].map(([l, v]) => `<div><span class="muted" style="font-size:.8rem">${h(l)}</span><div><b>${v ? h(v) : '<span class="muted">Sin registrar</span>'}</b></div></div>`).join('')}
      </div></section>
      <section class="panel" data-anexos></section>
      <section class="panel"><header><h2>Estado del programa ${anioAct}</h2></header><ul style="list-style:none;margin:0;padding:0">
        ${item(!!cfg.fecha_generado, 'Documento del programa institucional', cfg.fecha_generado ? `Generado el ${UI.fecha(cfg.fecha_generado)}` : 'Genere el documento y guárdelo en "1. PROGRAMA DE TECNOVIGILANCIA".')}
        ${item(!!cfg.referente, 'Referente y delegado designados', cfg.referente ? `${cfg.referente}${cfg.delegado ? ' · delegado ' + cfg.delegado : ''}` : 'Registre el referente inscrito ante el INVIMA en "Datos del programa".')}
        ${item(!!cfg.codigo_rnt, 'Inscripción en la Red Nacional de Tecnovigilancia', cfg.codigo_rnt ? `Código ${cfg.codigo_rnt}` : 'Registre el código de inscripción (tecnoyreactivo@invima.gov.co).')}
        ${item(trimDebidos <= 0 || trimOk >= trimDebidos, 'Reportes trimestrales al INVIMA', `${trimOk} de ${Math.max(0, trimDebidos)} trimestres cerrados con reporte (incluye reportes en cero).`)}
        ${item(actas.some((a) => String(a.fecha || '').startsWith(String(anioAct))), 'Comité de tecnovigilancia', `${actas.filter((a) => String(a.fecha || '').startsWith(String(anioAct))).length} acta(s) en ${anioAct}.`)}
        ${item(ses.length && ej >= ses.filter((s) => s.fecha && s.fecha <= UI.hoy()).length, 'Plan de capacitación semestral', ses.length ? `${ej} de ${ses.length} sesiones ejecutadas.` : 'Cree el plan en la pestaña Capacitaciones.')}
        ${item(!evs.filter((e) => TV.esSerio(e) && e.estado === 'Abierto').length, 'Eventos serios notificados', `${evs.filter((e) => TV.esSerio(e)).length} serio(s) registrados; ${evs.filter((e) => TV.esSerio(e) && e.estado === 'Abierto').length} abierto(s).`)}
      </ul></section>`;
    panelAnexos(box.querySelector('[data-anexos]'), ent);
    A.acts({
      tvDatos: () => formDatos(ent),
      tvActo: () => formActo(ent),
      tvTexto: () => formTexto(ent),
      tvDispo: () => formDispositivos(ent),
      tvTextoRef: async () => { if (!(await confirmar('¿Quitar el texto personalizado y usar otra vez el texto de referencia?', 'Usar referencia'))) return; await guardarCfg(ent, { texto: null }); toast('Se usará el texto de referencia'); A.recargar(); },
      tvPlantilla: () => formPlantilla(),
      tvGenerar: async () => {
        const eqs = await S.list('equipos', { entidad_id: ent.id });
        const doc = await TV.pdfPrograma(ent, { texto: textoDe(ent), cfg: TV.cfg(ent), eqs });
        if (esProp()) guardarCfg(ent, { fecha_generado: UI.hoy() }).catch(() => {});
        verDoc(ent, doc, 'Programa institucional de tecnovigilancia', `${fmt.codigo}_Programa_Tecnovigilancia_${slug(ent.razon_social)}.pdf`, 0);
      },
    });
  };
  const formDatos = (ent) => {
    const c = TV.cfg(ent), fmt = TV.fmtDe('programa_tv'); const firmas = { reviso: c.firma_reviso || null, aprobo: c.firma_aprobo || null };
    const cambios = (c.cambios || []).map((x) => [x.version, x.fecha, x.desc, x.resp].join(' | ')).join('\n');
    modal({ titulo: 'Datos del programa de tecnovigilancia', size: 'wide', cuerpo: `<form class="form" onsubmit="return false">
      <fieldset><legend>Responsables (Resolución 4816 de 2008)</legend><div class="fields">${f.input('referente', 'Referente del programa (inscrito ante el INVIMA)', c.referente)}${f.input('cargo', 'Cargo del referente', c.cargo)}${f.input('delegado', 'Delegado del referente', c.delegado)}${f.input('cargo_delegado', 'Cargo del delegado', c.cargo_delegado)}</div></fieldset>
      <fieldset><legend>Inscripción y aplicativo web del INVIMA</legend><div class="fields">${f.input('codigo_rnt', 'Código de inscripción a la Red Nacional de Tecnovigilancia', c.codigo_rnt)}${f.input('usuario_invima', 'Usuario del aplicativo web', c.usuario_invima)}${f.input('correo', 'Correo de notificaciones', c.correo, { type: 'email' })}
        ${f.input('departamento', 'Departamento (RETEIM A2)', c.departamento)}${f.sel('nivel', 'Nivel de complejidad (RETEIM A5)', ['1', '2', '3'], c.nivel || '1')}${f.sel('naturaleza', 'Naturaleza (RETEIM A6)', ['Privada', 'Pública', 'Mixta'], c.naturaleza || 'Privada')}
        <p class="muted full" style="font-size:.82rem">Por seguridad, la contraseña del aplicativo web del INVIMA no se guarda en el gestor ni se imprime en el documento.</p></div></fieldset>
      <fieldset><legend>Control documental</legend><div class="fields">${f.input('codigo', 'Código del documento', c.codigo || fmt.codigo)}${f.input('version', 'Versión', c.version || fmt.version)}${f.input('fecha', 'Fecha de aprobación', c.fecha || fmt.fecha, { type: 'date' })}${f.input('meta_eventos', 'Meta índice de eventos (trimestral)', c.meta_eventos || '3%')}
        ${f.input('elaboro', 'Elaboró (nombre | cargo)', c.elaboro || `${st.emp.responsable || ''}|${st.emp.cargo || 'Ingeniera Biomédica'}`)}${f.input('reviso', 'Revisó (nombre | cargo)', c.reviso)}${f.input('aprobo', 'Aprobó (nombre | cargo)', c.aprobo)}
        ${f.area('cambios', 'Control de cambios (una línea por versión: versión | fecha AAAA-MM-DD | descripción | responsable)', cambios, { rows: 3 })}</div></fieldset>
      <fieldset><legend>Firmas del documento</legend><p class="muted" style="font-size:.82rem;margin:0 0 6px">Elaboró usa la firma de "Mi empresa y firma". Revisó y Aprobó se firman aquí (dibujar en pantalla o cargar la imagen de la firma).</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">${[['reviso', 'Revisó'], ['aprobo', 'Aprobó']].map(([k, l]) => `<div class="field"><span class="lbl">Firma de quien ${l.toLowerCase()}</span><div style="display:flex;gap:8px;align-items:center"><span data-fprev="${k}" style="display:inline-flex;width:150px;height:48px;border:1px dashed var(--line);border-radius:8px;align-items:center;justify-content:center;overflow:hidden;font-size:.75rem">${c['firma_' + k] ? `<img src="${c['firma_' + k]}" alt="Firma" style="max-height:44px;max-width:146px">` : 'Sin firma'}</span><button type="button" class="btn sm" data-firmar="${k}">${I.firma} Firmar / cargar</button><button type="button" class="icon-btn bad" data-fquitar="${k}" aria-label="Quitar firma">${I.x}</button></div></div>`).join('')}</div></fieldset></form>`,
      alAbrir: (m) => m.body.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-firmar]'), q = e.target.closest('[data-fquitar]');
        if (b) { const k = b.dataset.firmar; const r = await UI.pedirFirma({ titulo: `Firma de quien ${k === 'reviso' ? 'revisó' : 'aprobó'} el programa`, actual: firmas[k] }); if (r) { firmas[k] = r; m.body.querySelector(`[data-fprev="${k}"]`).innerHTML = `<img src="${r}" alt="Firma" style="max-height:44px;max-width:146px">`; } }
        if (q) { const k = q.dataset.fquitar; firmas[k] = null; m.body.querySelector(`[data-fprev="${k}"]`).textContent = 'Sin firma'; }
      }),
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
        const v = leer(m.body); v.firma_reviso = firmas.reviso || null; v.firma_aprobo = firmas.aprobo || null;
        v.cambios = String(v.cambios || '').split('\n').map((l) => l.split('|').map((x) => x.trim())).filter((x) => x[0]).map(([version, fecha, desc, resp]) => ({ version, fecha, desc, resp }));
        await guardarCfg(ent, v); toast('Datos del programa guardados'); A.recargar();
      } }] });
  };


  // ------------------------------------------------------------------ anexos del programa (subcarpeta "2. ANEXOS DEL PROGRAMA")
  const panelAnexos = async (el, ent) => {
    if (!el) return;
    const sub = await TV.subDestino(ent, 1);
    const docs = (await S.list('documentos', { entidad_id: ent.id })).filter((d) => d.carpeta === 'tecnovigilancia' && (d.subcarpeta || '').split('/')[0] === sub).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es', { numeric: true }));
    let abierto = false; try { abierto = localStorage.getItem('ibcol.plegable.anexos_tv') === '1'; } catch {}
    el.classList.remove('panel'); el.classList.add('plegable-sec');
    el.innerHTML = `<details class="plegable" data-anx-wrap ${abierto ? 'open' : ''}><summary><span>Anexos del programa</span><span class="muted">${docs.length} documento${docs.length === 1 ? '' : 's'} · <span data-anx-lbl>${abierto ? 'ocultar' : 'ver'}</span></span></summary><div class="panel"><header><div><h2>Anexos del programa</h2><span class="muted" style="font-size:.85rem">Subcarpeta “${h(sub)}”: formatos y documentos que acompañan el programa (acto administrativo, FT-PGTV-016, FT-PGTV-015, FAR-013, RETEIM-002, NTC 5736…).</span></div>
      ${esProp() ? `<div class="actions"><label class="btn">${I.subir} Cargar anexos<input type="file" multiple hidden data-anx></label></div>` : ''}</header>
      ${docs.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Anexo</th><th>Fecha</th><th></th></tr></thead><tbody>${docs.map((d) => `<tr class="clic" data-act="tvAnxVer" data-id="${d.id}"><td>${h(d.nombre)}</td><td class="num">${UI.fecha(d.fecha_documento || d.created_at)}</td><td><div class="row-actions"><button class="icon-btn" data-act="tvAnxVer" data-id="${d.id}" aria-label="Abrir">${I.pdf}</button>${esProp() ? `<button class="icon-btn bad" data-act="tvAnxDel" data-id="${d.id}" aria-label="Eliminar">${I.del}</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Aún no hay anexos cargados.</div>'}</div></details>`;
    const dw = el.querySelector('[data-anx-wrap]'); dw.addEventListener('toggle', () => { try { localStorage.setItem('ibcol.plegable.anexos_tv', dw.open ? '1' : '0'); } catch {} el.querySelector('[data-anx-lbl]').textContent = dw.open ? 'ocultar' : 'ver'; });
    const inp = el.querySelector('[data-anx]');
    if (inp) inp.onchange = async () => {
      const fl = [...inp.files]; if (!fl.length) return; toast(`Cargando ${fl.length} anexo(s)…`);
      for (const x of fl) { const path = `${ent.id}/general/tecnovigilancia/${Date.now()}-${slug(x.name)}`; await S.upload(path, x); await S.insert('documentos', { entidad_id: ent.id, equipo_id: null, carpeta: 'tecnovigilancia', subcarpeta: sub, nombre: x.name, archivo: path, mime: x.type || null, tamano: x.size, fecha_documento: UI.hoy(), visible_cliente: true }); }
      toast('Anexos cargados'); panelAnexos(el, ent);
    };
    A.acts({
      tvAnxVer: async (d) => { const doc = docs.find((x) => x.id === d.id); if (doc) A.abrirDoc(doc); },
      tvAnxDel: async (d) => { const doc = docs.find((x) => x.id === d.id); if (!doc || !(await confirmar(`¿Eliminar el anexo “${doc.nombre}”?`))) return; try { await S.removeFile(doc.archivo); } catch {} await S.remove('documentos', doc.id); toast('Anexo eliminado'); panelAnexos(el, ent); },
    });
  };

  // ------------------------------------------------------------------ acto administrativo AA-PGTV-035 (datos y firma de cada entidad)
  const COMITE_BASE = ['Referente de Tecnovigilancia', 'Líder asistencial / profesional de la salud', 'Ingeniero Biomédico', 'Administrador'];
  const formActo = (ent) => {
    const c = TV.cfg(ent), a = c.acto || {}; let firma = a.firma || null;
    modal({ titulo: `Acto administrativo · ${TV.fmtDe('acto_tv').codigo}`, size: 'wide', cuerpo: `<form class="form" onsubmit="return false">
      <fieldset><legend>Referente delegado</legend><div class="fields">${f.input('ref_nombre', 'Nombre del referente', a.ref_nombre || c.referente)}${f.input('ref_cc', 'Cédula', a.ref_cc)}${f.input('ref_exp', 'Expedida en', a.ref_exp || ent.ciudad)}</div></fieldset>
      <fieldset><legend>Representante legal (firma el acto)</legend><div class="fields">${f.input('rep_nombre', 'Nombre', a.rep_nombre || (c.aprobo || '').split('|')[0])}${f.input('rep_cc', 'Cédula', a.rep_cc)}${f.input('rep_exp', 'Expedida en', a.rep_exp || ent.ciudad)}${f.input('rep_cargo', 'Cargo', a.rep_cargo || 'Representante legal')}
        <div class="field full"><span class="lbl">Firma</span><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span data-fprev style="display:inline-flex;width:170px;height:52px;border:1px dashed var(--line);border-radius:8px;align-items:center;justify-content:center;overflow:hidden;font-size:.75rem">${firma ? `<img src="${firma}" alt="Firma" style="max-height:48px;max-width:166px">` : 'Sin firma'}</span><button type="button" class="btn sm" data-firmar>${I.firma} Firmar / cargar</button>${c.firma_aprobo ? '<button type="button" class="btn sm" data-usar>Usar la firma de “Aprobó”</button>' : ''}</div></div></div></fieldset>
      <fieldset><legend>Comité de tecnovigilancia</legend><div class="fields">${f.area('comite', 'Integrantes del comité (uno por línea)', (a.comite || COMITE_BASE).join('\n'), { rows: 4 })}${f.sel('periodicidad', 'Periodicidad de reuniones', ['trimestral', 'bimestral', 'mensual', 'semestral'], a.periodicidad || 'trimestral')}${f.input('fecha', 'Fecha del acto', a.fecha || UI.hoy(), { type: 'date' })}</div></fieldset></form>`,
      alAbrir: (m) => m.body.addEventListener('click', async (e) => {
        const prev = m.body.querySelector('[data-fprev]');
        if (e.target.closest('[data-firmar]')) { const r = await UI.pedirFirma({ titulo: 'Firma del representante legal', actual: firma }); if (r) { firma = r; prev.innerHTML = `<img src="${r}" alt="Firma" style="max-height:48px;max-width:166px">`; } }
        if (e.target.closest('[data-usar]')) { firma = c.firma_aprobo; prev.innerHTML = `<img src="${firma}" alt="Firma" style="max-height:48px;max-width:166px">`; }
      }),
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar y generar PDF', cls: 'pri', fn: async (m) => {
        const v = leer(m.body); const acto = { ...v, comite: String(v.comite || '').split('\n').map((x) => x.trim()).filter(Boolean), firma };
        await guardarCfg(ent, { acto });
        const doc = TV.pdfActo(ent, { acto, cfg: TV.cfg(ent) });
        verDoc(ent, doc, 'Acto administrativo de tecnovigilancia', `${TV.fmtDe('acto_tv').codigo}_Acto_administrativo_${slug(ent.razon_social)}.pdf`, 1);
      } }] });
  };

  // ------------------------------------------------------------------ dispositivos médicos objeto de vigilancia (cuadro del formato Excel, por entidad / sede)
  const leerHojaDispo = (rows) => {
    const clases = []; let cur = null, titulo = '';
    const lim = (r) => (r || []).map((x) => (x === null || x === undefined ? '' : String(x).replace(/\s+/g, ' ').trim()));
    // columna donde está "RIESGO CLASE" (el rango de la hoja puede empezar en A o en B)
    let k = 1; for (const r of rows) { const i = lim(r).findIndex((x) => /RIESGO\s+CLASE/i.test(x)); if (i >= 0) { k = i; break; } }
    rows.forEach((r) => {
      const c0 = lim(r), c = [...Array(Math.max(0, 1 - k)).fill(''), ...c0.slice(Math.max(0, k - 1))];
      const b = c[1] || '';
      if (!titulo && c.some((x) => /OBJETO DE VIGILANCIA/i.test(x))) { titulo = c.find((x) => /OBJETO DE VIGILANCIA/i.test(x)); return; }
      const mc = b.match(/RIESGO\s+CLASE\s+(I{1,3}\s*[AB]?)/i);
      if (mc) { cur = { clase: mc[1].replace(/\s+/g, '').toUpperCase(), filas: [] }; clases.push(cur); return; }
      if (cur && (c[2] || c[4])) cur.filas.push([c[2] || '', c[3] || '', c[4] || '', c[5] || '']);
    });
    return { titulo, clases };
  };
  const tablaDispoHTML = (dv) => !dv?.clases?.length ? '<div class="empty">Sin cuadro cargado: el documento usa la lista del inventario de equipos.</div>' : `<div class="tbl-wrap"><table class="tbl" style="font-size:.8rem"><thead><tr><th colspan="5" style="text-align:center">${h(dv.titulo || '')}</th></tr></thead><tbody>${dv.clases.map((c) => `<tr><td rowspan="${c.filas.length + 1}" style="font-weight:700;vertical-align:middle;background:var(--panel-2,rgba(0,150,190,.08))">RIESGO CLASE ${h(c.clase)}</td><th>Dispositivo biomédico</th><th>Codificación evento adverso</th><th>Dispositivo biomédico</th><th>Codificación evento adverso</th></tr>${c.filas.map((f) => `<tr>${f.map((x, i) => `<td class="${i % 2 ? 'mono' : ''}">${h(x)}</td>`).join('')}</tr>`).join('')}`).join('')}</tbody></table></div>`;
  const formDispositivos = (ent) => {
    let dv = TV.cfg(ent).dispositivos || null, libro = null;
    modal({ titulo: `Dispositivos médicos objeto de vigilancia · ${ent.razon_social}`, size: 'wide', cuerpo: `<p class="muted" style="font-size:.85rem">Cargue el Excel del formato (una hoja por sede) y elija la hoja de esta entidad. El cuadro se imprime igual en el documento del programa (sección de dispositivos objeto de vigilancia) y sus equipos se usan para los casos de la presentación de capacitación.</p>
      <div class="actions"><label class="btn sm">${I.subir} Cargar Excel<input type="file" accept=".xlsx,.xls" hidden data-xl></label><select data-hoja aria-label="Hoja (sede)" hidden></select></div>
      <div class="field" style="margin-top:8px"><label for="dv_tit">Título del cuadro</label><input id="dv_tit" value="${h(dv?.titulo || `DISPOSITIVOS MÉDICOS OBJETO DE VIGILANCIA EN ${ent.razon_social}`)}"></div><div data-prev style="margin-top:8px">${tablaDispoHTML(dv)}</div>`,
      alAbrir: (m) => {
        const sel = m.body.querySelector('[data-hoja]'), prev = m.body.querySelector('[data-prev]'), tit = m.body.querySelector('#dv_tit');
        const usar = (n) => { const rows = XLSX.utils.sheet_to_json(libro.Sheets[n], { header: 1, defval: null }); dv = { ...leerHojaDispo(rows), hoja: n }; if (dv.titulo) tit.value = dv.titulo; prev.innerHTML = tablaDispoHTML(dv); };
        m.body.querySelector('[data-xl]').onchange = async (e) => {
          const fl = e.target.files[0]; if (!fl) return; libro = XLSX.read(await fl.arrayBuffer(), { type: 'array' });
          sel.innerHTML = libro.SheetNames.map((n) => `<option>${h(n)}</option>`).join(''); sel.hidden = false;
          const pref = libro.SheetNames.find((n) => /popay/i.test(n)) || libro.SheetNames.find((n) => sinTilde(ent.razon_social).split(/\s+/).some((w) => w.length > 4 && sinTilde(n).includes(w))) || libro.SheetNames[0];
          sel.value = pref; usar(pref);
        };
        sel.onchange = () => usar(sel.value);
      },
      acciones: [...(TV.cfg(ent).dispositivos ? [{ t: 'Quitar cuadro (usar inventario)', cls: 'danger', fn: async () => { await guardarCfg(ent, { dispositivos: null }); toast('Se usará la lista del inventario'); A.recargar(); } }] : []), { t: 'Cancelar' },
        { t: 'Guardar cuadro', cls: 'pri', fn: async (m) => { if (!dv?.clases?.length) { toast('Cargue el Excel y elija la hoja', true); return false; } dv.titulo = m.body.querySelector('#dv_tit').value.trim(); await guardarCfg(ent, { dispositivos: dv }); toast(`Cuadro guardado: ${dv.clases.reduce((a, c) => a + c.filas.length, 0)} filas`); A.recargar(); } }] });
  };
  const AYUDA = '<p class="muted" style="font-size:.82rem;margin:0 0 6px">Formato: <span class="mono"># TÍTULO</span> · <span class="mono">## Subtítulo</span> · <span class="mono">- viñeta</span> · <span class="mono">-- subviñeta</span>. Marcadores: <span class="mono">{ENTIDAD} {REFERENTE} {DELEGADO} {CODIGO_RNT} {USUARIO_INVIMA} {CORREO_TV}</span>. Bloques automáticos: <span class="mono">[[FLUJO]] [[FICHAS]] [[DISPOSITIVOS]] [[CAMBIOS]]</span>.</p>';
  const formTexto = (ent) => modal({ titulo: `Texto del programa · ${ent.razon_social}`, size: 'wide', cuerpo: `${AYUDA}<textarea data-tx rows="26" style="width:100%;font-family:ui-monospace,monospace;font-size:.8rem">${h(textoDe(ent))}</textarea>`,
    acciones: [{ t: 'Copiar el de referencia', fn: (m) => { m.body.querySelector('[data-tx]').value = st.fmt.programa_tv_texto?.texto || ''; return false; } }, { t: 'Cancelar' }, { t: 'Guardar para esta entidad', cls: 'pri', fn: async (m) => { await guardarCfg(ent, { texto: m.body.querySelector('[data-tx]').value }); toast('Texto guardado para esta entidad'); A.recargar(); } }] });
  const formPlantilla = () => modal({ titulo: 'Plantilla de referencia del programa (todas las entidades)', size: 'wide', cuerpo: `<p class="muted">Este texto es la base que se adapta a cada entidad con sus datos. Las entidades que tengan un texto personalizado no cambian.</p>${AYUDA}
      <label class="btn sm" style="margin-bottom:6px">${I.subir} Importar desde archivo .txt / .md<input type="file" accept=".txt,.md,text/plain" hidden data-imp></label><textarea data-tx rows="24" style="width:100%;font-family:ui-monospace,monospace;font-size:.8rem">${h(st.fmt.programa_tv_texto?.texto || '')}</textarea>`,
    alAbrir: (m) => { m.body.querySelector('[data-imp]').onchange = async (e) => { const fl = e.target.files[0]; if (fl) { m.body.querySelector('[data-tx]').value = await fl.text(); toast(`Texto importado (${fl.name})`); } }; },
    acciones: [{ t: 'Cancelar' }, { t: 'Guardar plantilla', cls: 'pri', fn: async (m) => { const texto = m.body.querySelector('[data-tx]').value; await S.upsert('formatos', { clave: 'programa_tv_texto', datos: { texto, actualizado: new Date().toISOString() } }); await A.cargarConfig(); toast('Plantilla de referencia guardada'); A.recargar(); } }] });

  // ================================================================== 2. EVENTOS / INCIDENTES · FORMULARIO FT-PGTV-016
  const consecuenciaDe = (des) => (des === 'Muerte' ? 'Muerte' : ['Enfermedad o daño que amenace la vida', 'Requiere intervención médica o quirúrgica', 'Daño de una función o estructura corporal', 'Hospitalización inicial o prolongada'].includes(des) ? 'Deterioro grave' : des === 'No hubo daño' ? 'Sin consecuencias' : 'Lesión temporal');
  TV.formEvento = async (ent, ev = null, { serio = null, sede: sedeFija = null } = {}) => {
    const [eqs, cons] = await Promise.all([S.list('equipos', { entidad_id: ent.id }), S.list('consultorios', { entidad_id: ent.id })]);
    const cfg = TV.cfg(ent), d = ev?.datos || {}, sedes = A.sedesDe(cons, ent);
    const x = (k) => `d_${k}`, D = (k, def = '') => d[k] ?? def;
    const sn = (k, l, v) => f.sel(x(k), l, [['', '—'], 'SI', 'NO'], v);
    const clasDef = ev?.clasificacion || (serio === true ? 'Evento adverso serio' : serio === false ? 'Evento adverso no serio' : '');
    const fLocal = (iso) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16));
    modal({ titulo: ev ? `Reporte ${d.codigo || ''} · FT-PGTV-016` : 'Reporte voluntario de evento / incidente adverso (FT-PGTV-016)', size: 'wide', cuerpo: `<form class="form" onsubmit="return false">
      <fieldset><legend>Clasificación</legend><div class="fields">${f.sel('clasificacion', 'Clasificación (Res. 4816 de 2008, art. 5) *', [['', '— Seleccione —'], ...TV.CLASIF], clasDef)}${f.input(x('codigo'), 'Código interno del reporte', D('codigo'))}
        <p class="muted full" style="font-size:.82rem;margin:0">Serio: muerte o deterioro serio de la salud (o pudo causarlo, si es incidente) → reporte al INVIMA dentro de 72 horas. No serio → consolidado trimestral RETEIM-002.</p></div></fieldset>
      <fieldset><legend>A. Lugar de ocurrencia</legend><div class="fields">${f.input(x('institucion'), 'Nombre de la institución', D('institucion', ent.razon_social))}${f.sel(x('sede'), 'Sede', sedeFija ? [sedeFija] : sedes, D('sede', sedeFija || sedes[0]))}${f.input(x('nit'), 'NIT', D('nit', ent.nit))}${f.input(x('departamento'), 'Departamento', D('departamento', cfg.departamento || ''))}${f.input(x('ciudad'), 'Ciudad', D('ciudad', ent.ciudad))}</div></fieldset>
      <fieldset><legend>B. Información del paciente</legend><div class="fields">${f.input(x('pac_nombre'), 'Nombre', D('pac_nombre'))}${f.sel(x('pac_tipo_id'), 'Tipo de identificación', ['CC', 'TI', 'RC', 'CE', 'PA', 'MS', 'AS', 'NU'], D('pac_tipo_id', 'CC'))}${f.input(x('pac_id'), 'Número de identificación', D('pac_id'))}
        ${f.sel(x('pac_sexo'), 'Sexo', [['', '—'], 'Femenino', 'Masculino'], D('pac_sexo'))}${f.input(x('pac_edad'), 'Edad', D('pac_edad'), { type: 'number' })}${f.sel(x('pac_edad_en'), 'Edad en', ['Años', 'Meses', 'Semanas', 'Días'], D('pac_edad_en', 'Años'))}${f.input(x('area'), 'Área o servicio', D('area', ev?.servicio || ''))}${f.area(x('pac_diagnostico'), 'Diagnóstico inicial del paciente', D('pac_diagnostico'), { rows: 2 })}</div></fieldset>
      <fieldset><legend>C. Dispositivo médico sospechoso</legend><div class="fields">${f.sel('equipo_id', 'Equipo del inventario (opcional: completa los datos)', [['', '— Dispositivo que no está en el inventario —'], ...eqs.map((e) => [e.id, `${e.codigo_inv} · ${e.nombre} · ${e.marca || ''} ${e.modelo || ''}`])], ev?.equipo_id, { full: true })}
        ${f.input(x('dm_generico'), 'Nombre genérico del DM', D('dm_generico'))}${f.input(x('dm_comercial'), 'Nombre comercial', D('dm_comercial'))}${f.input(x('dm_rs'), 'Registro sanitario / permiso (INVIMA …)', D('dm_rs'))}${f.input(x('dm_expediente'), 'Expediente del registro', D('dm_expediente'))}
        ${f.input(x('dm_ecri'), 'Tipo de DM (código ECRI / UMDNS)', D('dm_ecri'))}${f.input(x('dm_lote'), 'Lote', D('dm_lote'))}${f.input(x('dm_modelo'), 'Modelo', D('dm_modelo'))}${f.input(x('dm_referencia'), 'Referencia', D('dm_referencia'))}${f.input(x('dm_serie'), 'Serie', D('dm_serie'))}
        ${f.input(x('dm_fabricante'), 'Fabricante', D('dm_fabricante'))}${f.input(x('dm_importador'), 'Importador / distribuidor', D('dm_importador'))}${sn('dm_mas_vez', '¿Utilizado más de una vez?', D('dm_mas_vez'))}</div></fieldset>
      <fieldset><legend>D. Evento o incidente adverso</legend><div class="fields">${f.input('fecha_evento', 'Fecha y hora del evento *', fLocal(ev?.fecha_evento), { type: 'datetime-local' })}${f.input(x('fecha_reporte'), 'Fecha de elaboración del reporte', D('fecha_reporte', UI.hoy()), { type: 'date' })}${f.sel(x('deteccion'), 'Detección', [['', '—'], ['Antes', 'Antes del uso del DM'], ['Durante', 'Durante el uso del DM'], ['Después', 'Después del uso del DM']], D('deteccion'))}
        ${f.area('descripcion', 'Descripción del evento o incidente *', ev?.descripcion, { rows: 4 })}${f.sel(x('desenlace'), 'Desenlace', [['', '—'], ...TV.DESENLACES], D('desenlace'))}${f.input(x('desenlace_otro'), 'Otro ¿cuál?', D('desenlace_otro'))}</div></fieldset>
      <fieldset><legend>E. Gestión realizada</legend><div class="fields">${f.sel(x('causa'), 'Causa probable (NTC 5736:2009)', [['', '— En análisis —'], ...TV.CAUSAS.map(([c, t]) => [String(c), `${c} - ${t}`])], String(D('causa')))}${f.area(x('acciones'), 'Acciones correctivas y preventivas iniciadas', D('acciones'), { rows: 2 })}
        ${sn('reporto_fab', 'Reportó al fabricante / importador', D('reporto_fab'))}${f.input(x('fecha_fab'), 'Fecha de reporte al fabricante', D('fecha_fab'), { type: 'date' })}${sn('dm_disponible', 'DM disponible para evaluación', D('dm_disponible'))}${sn('dm_enviado', 'DM enviado al importador / distribuidor', D('dm_enviado'))}${f.input(x('fecha_envio'), 'Fecha de envío del DM', D('fecha_envio'), { type: 'date' })}
        ${f.sel('retiro_equipo', 'Retiro del equipo del servicio', [['true', 'Sí, fue retirado'], ['false', 'No']], String(ev ? !!ev.retiro_equipo : true))}${f.area('contingencia', 'Medidas de contingencia', ev?.contingencia, { rows: 2 })}</div></fieldset>
      <fieldset><legend>F. Información del reportante</legend><div class="fields">${f.input(x('rep_nombre'), 'Nombres y apellidos', D('rep_nombre', ev?.reportante || ''))}${f.input(x('rep_profesion'), 'Profesión', D('rep_profesion', ev?.cargo || ''))}${f.input(x('rep_organizacion'), 'Organización / área', D('rep_organizacion'))}${f.input(x('rep_direccion'), 'Dirección', D('rep_direccion', ent.direccion || ''))}
        ${f.input(x('rep_telefono'), 'Teléfono', D('rep_telefono', ent.telefono || ''))}${f.input(x('rep_correo'), 'Correo institucional', D('rep_correo', cfg.correo || ent.email || ''))}${sn('autoriza', 'Autoriza la divulgación del origen del reporte', D('autoriza'))}${f.sel(x('tipo_reportante'), 'Tipo de reportante', ['Prestador de servicios de salud', 'Profesional independiente', 'Fabricante', 'Importador'], D('tipo_reportante', 'Prestador de servicios de salud'))}
        ${f.input(x('fecha_notificacion'), 'Fecha de notificación al INVIMA', D('fecha_notificacion'), { type: 'date' })}${f.input(x('radicado'), 'Radicado / constancia INVIMA', D('radicado'))}${f.sel(x('estado_reporte'), 'Estado del reporte (F12)', [['A', 'Abierto'], ['S', 'Seguimiento'], ['C', 'Cerrado']], D('estado_reporte', 'A'))}</div></fieldset></form>`,
      alAbrir: (m) => {
        const sel = m.body.querySelector('[name=equipo_id]');
        sel.onchange = () => {
          const e = eqs.find((q) => q.id === sel.value); if (!e) return; const c = cons.find((q) => q.id === e.consultorio_id);
          const put = (k, v) => { const i = m.body.querySelector(`[name="d_${k}"]`); if (i && !i.value && v) i.value = v; };
          put('dm_generico', e.nombre); put('dm_comercial', [e.marca, e.modelo].filter(Boolean).join(' ')); put('dm_rs', e.registro_sanitario); put('dm_modelo', e.modelo); put('dm_serie', e.serie); put('dm_fabricante', e.fabricante || e.hv?.fab_nombre || e.marca);
          put('dm_importador', e.hv?.prov_nombre); put('dm_ecri', e.hv?.ecri); put('area', c?.nombre); put('dm_mas_vez', 'SI');
        };
      },
      acciones: [{ t: 'Cancelar' }, { t: ev ? 'Guardar' : 'Guardar reporte', cls: 'pri', fn: async (m) => {
        const v = leer(m.body);
        if (!v.clasificacion || !v.descripcion || !v.fecha_evento) { toast('Complete la clasificación, la fecha y la descripción', true); return false; }
        const datos = {}; Object.keys(v).filter((k) => k.startsWith('d_')).forEach((k) => { datos[k.slice(2)] = v[k]; });
        if (!datos.codigo) { const n = (await S.list('eventos', { entidad_id: ent.id })).filter((e) => anioDe(e.fecha_evento) === anioDe(v.fecha_evento)).length + (ev ? 0 : 1); datos.codigo = `TV-${anioDe(v.fecha_evento)}-${String(n).padStart(3, '0')}`; }
        const serioN = TV.esSerio({ clasificacion: v.clasificacion });
        const o = { entidad_id: ent.id, equipo_id: v.equipo_id || null, clasificacion: v.clasificacion, fecha_evento: new Date(v.fecha_evento).toISOString(), servicio: datos.area || null, reportante: datos.rep_nombre || null, cargo: datos.rep_profesion || null,
          descripcion: v.descripcion, afecto_paciente: /^evento/i.test(v.clasificacion), consecuencia: datos.desenlace ? consecuenciaDe(datos.desenlace) : serioN ? 'Deterioro grave' : 'Sin consecuencias',
          retiro_equipo: v.retiro_equipo === 'true', contingencia: v.contingencia || null, estado: datos.estado_reporte === 'C' ? 'Cerrado' : datos.fecha_notificacion ? 'Reportado INVIMA' : 'Abierto', datos };
        try { if (ev) await S.update('eventos', ev.id, o); else await S.insert('eventos', o); } catch (er) { if (faltaSQL(er)) { toast('Falta actualizar la base de datos: ejecute supabase/tecnovigilancia.sql en Supabase', true); return false; } throw er; }
        if (!ev && o.equipo_id && (serioN || o.retiro_equipo)) { try { await S.update('equipos', o.equipo_id, { estado: 'Fuera de servicio' }); } catch {} }
        toast(serioN && !datos.fecha_notificacion ? 'Reporte guardado. Evento SERIO: notifique al INVIMA dentro de las 72 horas.' : 'Reporte guardado', serioN && !datos.fecha_notificacion); A.recargar();
      } }] });
  };

  // ------------------------------------------------------------------ portal de calidad: reportar eventos / incidentes adversos (FT-PGTV-016)
  A.G.eventosCalidad = async (el, { ent, sede = null }) => {
    let evs = [], eqs = [];
    try { [evs, eqs] = await Promise.all([S.list('eventos', { entidad_id: ent.id }, '-fecha_evento'), S.list('equipos', { entidad_id: ent.id })]); } catch (er) { evs = []; }
    if (sede) evs = evs.filter((e) => !e.datos?.sede || e.datos.sede === sede);
    el.innerHTML = `<section class="panel"><header><div><h2>Reporte de eventos e incidentes adversos con dispositivos médicos</h2><span class="muted" style="font-size:.85rem">Formato FT-PGTV-016. Todo evento o incidente adverso <b>serio</b> (muerte o deterioro serio de la salud, o que pudo causarlo) debe reportarse de inmediato: IBCOL y el referente lo notifican al INVIMA dentro de las 72 horas. Los <b>no serios</b> se consolidan cada trimestre.</span></div>
      <div class="actions"><button class="btn" data-act="cqBlanco">${I.pdf} Formato en blanco</button><button class="btn pri" data-act="cqNuevo">${I.alerta} Reportar evento / incidente</button></div></header>
      ${evs.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Código</th><th>Fecha</th><th>Clasificación</th><th>Dispositivo</th><th>Servicio</th><th>Estado</th><th></th></tr></thead><tbody>${evs.map((ev) => { const d = ev.datos || {}; return `<tr><td class="mono">${h(d.codigo || '')}</td><td class="num">${UI.fechaHora(ev.fecha_evento)}</td><td>${pill(ev.clasificacion || 'Sin clasificar', TV.esSerio(ev) ? 'bad' : 'warn')}</td><td>${h(d.dm_generico || eqs.find((e) => e.id === ev.equipo_id)?.nombre || '')}</td><td>${h(d.area || ev.servicio || '')}</td><td>${h(ev.estado || '')}</td><td><button class="icon-btn" data-act="cqVer" data-id="${ev.id}" aria-label="Ver FT-PGTV-016">${I.pdf}</button></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">No hay reportes registrados.</div>'}</section>`;
    A.acts({
      cqNuevo: () => TV.formEvento(ent, null, { serio: true, sede }),
      cqBlanco: () => UI.verPDF({ titulo: 'FT-PGTV-016 en blanco', blob: TV.pdf016(ent, { datos: {}, descripcion: '' }).output('blob'), nombre: 'FT-PGTV-016_en_blanco.pdf' }),
      cqVer: (d) => { const ev = evs.find((x) => x.id === d.id); UI.verPDF({ titulo: `FT-PGTV-016 · ${ev.datos?.codigo || ''}`, blob: TV.pdf016(ent, ev, eqs.find((e) => e.id === ev.equipo_id)).output('blob'), nombre: `FT-PGTV-016_${slug(ev.datos?.codigo || 'reporte')}.pdf` }); },
    });
  };
  const plazo72 = (ev) => {
    const d = ev.datos || {}, ini = new Date(ev.fecha_evento).getTime();
    if (d.fecha_notificacion) { const hrs = Math.round((new Date(d.fecha_notificacion + 'T23:59:00').getTime() - ini) / 36e5); return hrs <= 72 ? pill(`Notificado ${UI.fecha(d.fecha_notificacion)}`, 'ok') : pill(`Notificado tarde (${hrs} h)`, 'bad'); }
    const resta = Math.round((ini + 72 * 36e5 - Date.now()) / 36e5); return resta > 0 ? pill(`Notificar en ${resta} h`, 'warn') : pill('Plazo de 72 h vencido', 'bad');
  };
  const tablaEventos = (evs, eqs, { trimestral = false } = {}) => {
    const eqd = (id) => eqs.find((e) => e.id === id);
    if (!evs.length) return '';
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Código</th><th>Fecha</th><th>Clasificación</th><th>Dispositivo médico</th><th>Servicio</th><th>${trimestral ? 'Desenlace' : 'Notificación INVIMA'}</th><th>Estado</th><th></th></tr></thead><tbody>
      ${evs.map((ev) => { const d = ev.datos || {}, e = eqd(ev.equipo_id); return `<tr class="clic" data-act="tvVerEv" data-id="${ev.id}"><td class="mono">${h(d.codigo || '')}</td><td class="num">${UI.fechaHora(ev.fecha_evento)}</td><td>${pill(ev.clasificacion || (TV.esSerio(ev) ? 'Serio (sin clasificar)' : 'Sin clasificar'), TV.esSerio(ev) ? 'bad' : 'warn')}</td>
        <td>${h(d.dm_generico || e?.nombre || '—')}${e ? ` <span class="mono muted">${h(e.codigo_inv)}</span>` : ''}</td><td>${h(d.area || ev.servicio || '')}</td><td>${trimestral ? h(d.desenlace || '') : plazo72(ev)}</td><td>${h(TV.estadoTxt(d.estado_reporte) || ev.estado || '')}</td>
        <td><div class="row-actions"><button class="icon-btn" data-act="tvVerEv" data-id="${ev.id}" aria-label="Ver FT-PGTV-016">${I.pdf}</button>${esProp() ? `<button class="icon-btn" data-act="tvEditEv" data-id="${ev.id}" aria-label="Editar">${I.edit}</button><button class="icon-btn bad" data-act="tvDelEv" data-id="${ev.id}" aria-label="Eliminar">${I.del}</button>` : ''}</div></td></tr>`; }).join('')}
    </tbody></table></div>`;
  };
  const accionesEventos = (ent, evs, eqs, sub) => ({
    tvVerEv: (d) => { const ev = evs.find((x) => x.id === d.id); const doc = TV.pdf016(ent, ev, eqs.find((e) => e.id === ev.equipo_id)); S.log?.('CONSULTA', 'eventos', ev.id, ev.datos?.codigo || 'FT-PGTV-016'); verDoc(ent, doc, `FT-PGTV-016 · ${ev.datos?.codigo || ''}`, `FT-PGTV-016_${slug(ev.datos?.codigo || UI.fecha(ev.fecha_evento))}.pdf`, TV.esSerio(ev) ? 4 : sub); },
    tvEditEv: (d) => TV.formEvento(ent, evs.find((x) => x.id === d.id)),
    tvDelEv: async (d) => { if (await confirmar('¿Eliminar este reporte de tecnovigilancia?')) { await S.remove('eventos', d.id); toast('Reporte eliminado'); A.recargar(); } },
    tvBlanco: () => verDoc(ent, TV.pdf016(ent, { datos: {}, descripcion: '' }), 'FT-PGTV-016 en blanco', 'FT-PGTV-016_en_blanco.pdf', 1),
  });

  // ------------------------------------------------------------------ 2. Reportes serios (72 h)
  const vSerios = async (box, { ent }) => {
    const [evs, eqs] = await Promise.all([S.list('eventos', { entidad_id: ent.id }, '-fecha_evento'), S.list('equipos', { entidad_id: ent.id })]);
    const serios = evs.filter(TV.esSerio);
    box.innerHTML = `<section class="panel"><header><div><h2>Eventos e incidentes adversos SERIOS · reporte inmediato (72 h)</h2><span class="muted" style="font-size:.85rem">Formato FT-PGTV-016. Todo evento o incidente adverso serio se notifica al INVIMA dentro de las 72 horas siguientes en el <a href="https://farmacoweb.invima.gov.co/TecnoVigilancia/" target="_blank" rel="noopener">aplicativo web de Tecnovigilancia</a>. El PDF se guarda en “5. REPORTES SERIOS 72 HORAS”.</span></div>
      <div class="actions"><button class="btn" data-act="tvBlanco">${I.pdf} Formato en blanco</button>${esProp() ? `<button class="btn pri" data-act="tvNuevoSerio">${I.alerta} Reportar evento / incidente serio</button>` : ''}</div></header>
      ${tablaEventos(serios, eqs) || '<div class="empty">No hay eventos ni incidentes adversos serios registrados.</div>'}</section>`;
    A.acts({ ...accionesEventos(ent, evs, eqs, 4), tvNuevoSerio: () => TV.formEvento(ent, null, { serio: true }) });
  };

  // ------------------------------------------------------------------ 3. Trimestral RETEIM-002 (no serios / en cero)
  st.tvTrim = st.tvTrim || {};
  const vTrimestral = async (box, { ent }) => {
    const sel = st.tvTrim[ent.id] || { anio: anioAct, t: Math.max(1, trimDe(UI.hoy()) - (new Date().getMonth() % 3 === 0 ? 1 : 0)) };
    const [evs, eqs, regs] = await Promise.all([S.list('eventos', { entidad_id: ent.id }, 'fecha_evento'), S.list('equipos', { entidad_id: ent.id }), regsDe(ent)]);
    const delTrim = (a, t) => evs.filter((e) => !TV.esSerio(e) && anioDe(e.fecha_evento) === a && trimDe(e.fecha_evento) === t);
    const serTrim = (a, t) => evs.filter((e) => TV.esSerio(e) && anioDe(e.fecha_evento) === a && trimDe(e.fecha_evento) === t);
    const regT = (a, t) => (regs || []).find((r) => r.tipo === 'trimestral' && r.anio === a && r.periodo === `T${t}`);
    const hoyT = anioDe(UI.hoy()) * 10 + trimDe(UI.hoy());
    const estado = (a, t) => { const r = regT(a, t), n = delTrim(a, t).length; if (r?.datos?.fecha_envio) return pill(n && !r.datos.en_cero ? `Reportado ${UI.fecha(r.datos.fecha_envio)}` : `En cero reportado ${UI.fecha(r.datos.fecha_envio)}`, 'ok'); if (a * 10 + t === hoyT) return pill('En curso', ''); if (a * 10 + t > hoyT) return pill('Por venir', ''); return pill(n ? 'Pendiente de reporte' : 'Pendiente reporte en cero', 'bad'); };
    const lista = delTrim(sel.anio, sel.t), r = regT(sel.anio, sel.t);
    box.innerHTML = `<section class="panel"><header><div><h2>Reporte trimestral · eventos e incidentes adversos NO serios (RETEIM-002)</h2><span class="muted" style="font-size:.85rem">Cada trimestre se reportan al INVIMA los eventos e incidentes no serios en el consolidado RETEIM-002. Si no hubo casos, se envía el <b>reporte trimestral en cero</b>. Plazo INVIMA: los primeros ocho (8) días calendario de abril, julio, octubre y enero. Los soportes se guardan en “4. REPORTES TRIMESTRALES”.</span></div>
        <div class="actions">${esProp() ? `<button class="btn" data-act="tvCargaTri">${I.subir} Cargar reportes realizados (PDF)</button><button class="btn" data-act="tvLeerTri" title="Lee los PDF que ya están en la subcarpeta de reportes trimestrales">Organizar los PDF de la carpeta</button>` : ''}<select data-tv-anio aria-label="Año">${[anioAct, anioAct - 1, anioAct - 2, anioAct - 3].map((a) => `<option ${a === sel.anio ? 'selected' : ''}>${a}</option>`).join('')}</select></div></header>
      <div class="kpis">${[1, 2, 3, 4].map((t) => `<button type="button" class="kpi ${t === sel.t ? 'ok' : ''}" data-act="tvSelT" data-t="${t}" style="text-align:left;cursor:pointer;${t === sel.t ? 'outline:2px solid var(--accent)' : ''}"><span class="l">${TV.TRIM[t - 1]}</span><span class="v">${delTrim(sel.anio, t).length}</span><span class="meta">no serios · ${serTrim(sel.anio, t).length} serios</span><div style="margin-top:6px">${estado(sel.anio, t)}</div></button>`).join('')}</div></section>
      <section class="panel"><header><div><h2>${TV.TRIM[sel.t - 1]} ${sel.anio} <span class="muted" style="font-size:.85rem">(${TV.mesesTrim(sel.t)})</span></h2>${r?.datos?.fecha_envio ? `<span class="muted" style="font-size:.85rem">${r.datos.en_cero ? 'Reporte en cero' : 'Reportado'} al INVIMA el ${UI.fecha(r.datos.fecha_envio)}${r.datos.radicado ? ' · radicado ' + h(r.datos.radicado) : ''}</span>${(r.datos.soportes || []).map((id, k) => ` <button class="btn sm" data-act="tvSoporte" data-id="${id}">${I.pdf} Soporte${r.datos.soportes.length > 1 ? ' ' + (k + 1) : ''}</button>`).join('')}` : ''}</div>
        <div class="actions"><button class="btn" data-act="tvTrimPDF">${I.pdf} ${lista.length ? 'Consolidado (PDF)' : 'Reporte en cero (PDF)'}</button>${esProp() ? `${lista.length ? `<button class="btn" data-act="tvReteim">${I.bajar} Plantilla RETEIM-002 (Excel)</button>` : ''}<button class="btn" data-act="tvEnvio">${I.cal} Registrar reporte al INVIMA</button><button class="btn pri" data-act="tvNuevoNoSerio">${I.mas} Evento / incidente no serio</button>` : ''}</div></header>
        ${tablaEventos(lista, eqs, { trimestral: true }) || `<div class="empty">Sin eventos ni incidentes adversos no serios en este trimestre.${esProp() ? ' Si el trimestre terminó sin casos, genere el reporte en cero y regístrelo como enviado.' : ''}</div>`}</section>`;
    box.querySelector('[data-tv-anio]').onchange = (e) => { st.tvTrim[ent.id] = { ...sel, anio: +e.target.value }; A.recargar(); };
    A.acts({
      ...accionesEventos(ent, evs, eqs, 3),
      tvSelT: (d) => { st.tvTrim[ent.id] = { ...sel, t: +d.t }; A.recargar(); },
      tvCargaTri: () => (regs === null ? toast('Falta actualizar la base de datos', true) : TV.cargarTrimestrales(ent)),
      tvLeerTri: () => (regs === null ? toast('Falta actualizar la base de datos', true) : TV.cargarTrimestrales(ent, { existentes: true })),
      tvSoporte: async (d) => { const doc = await S.get('documentos', d.id); if (doc) A.abrirDoc(doc); },
      tvNuevoNoSerio: () => TV.formEvento(ent, null, { serio: false }),
      tvTrimPDF: () => { const doc = TV.pdfTrimestral(ent, { anio: sel.anio, t: sel.t, evs: lista, reg: { ...(r?.datos || {}), serios: serTrim(sel.anio, sel.t).length } }); verDoc(ent, doc, `Reporte trimestral ${TV.TRIM[sel.t - 1]} ${sel.anio}`, `RETEIM-002_T${sel.t}_${sel.anio}_${lista.length ? 'consolidado' : 'en_cero'}_${slug(ent.razon_social)}.pdf`, 3); },
      tvReteim: () => exportarReteim(ent, lista, eqs, sel),
      tvEnvio: () => {
        if (regs === null) { toast('Falta actualizar la base de datos: ejecute supabase/tecnovigilancia.sql', true); return; }
        modal({ titulo: `Reporte al INVIMA · ${TV.TRIM[sel.t - 1]} ${sel.anio}`, cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('fecha_envio', 'Fecha de reporte en el aplicativo web *', r?.datos?.fecha_envio || UI.hoy(), { type: 'date' })}${f.input('radicado', 'Radicado / constancia', r?.datos?.radicado)}${f.area('obs', 'Observaciones', r?.datos?.obs, { rows: 2 })}
          <p class="muted full" style="font-size:.85rem">${lista.length ? `Se reportan ${lista.length} evento(s) / incidente(s) no serio(s).` : 'Se registra como <b>reporte trimestral en cero</b>.'}</p></div></form>`,
          acciones: [...(r ? [{ t: 'Quitar registro', cls: 'danger', fn: async () => { await S.remove(TB, r.id); A.recargar(); } }] : []), { t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
            const v = leer(m.body); if (!v.fecha_envio) { toast('Indique la fecha', true); return false; }
            const o = { entidad_id: ent.id, tipo: 'trimestral', anio: sel.anio, periodo: `T${sel.t}`, fecha: v.fecha_envio, datos: { ...v, n: lista.length, en_cero: !lista.length, serios: serTrim(sel.anio, sel.t).length } };
            r ? await S.update(TB, r.id, o) : await S.insert(TB, o); toast('Reporte trimestral registrado'); A.recargar();
          } }] });
      },
    });
  };
  // plantilla de cargue RETEIM-002 (mismas 54 columnas del formato del INVIMA)
  const RETEIM_H = ['# (numere cada reporte)', 'CÓDIGO INTERNO ASIGNADO POR LA ORGANIZACIÓN', 'A1. Nombre de la Institución', 'A2. Departamento', 'A3. Ciudad o municipio', 'A4. NIT (sin guion del dígito de verificación)', 'A5. Nivel de Complejidad', 'A6. Naturaleza (pública, mixta o privada)', 'B1.Tipo de Identificación', 'B1.1 Número de identificación', 'B2. Sexo (femenino o masculino)', 'B3. Edad', 'B3.1 Edad en (días, semanas, meses o años)', 'B4. Diagnóstico Inicial del Paciente', 'C1. Nombre Genérico del Dispositivo Médico', 'C2. Nombre Comercial del Dispositivo Médico', 'C3. Registro sanitario o permiso de comercialización', 'C4. Expediente asociado al Registro sanitario', 'C5. Código Único Dispositivo', 'C6.Tipo Dispositivo Médico (ECRI)', 'C7. Lote', 'C7.1 Modelo', 'C7.2 Referencia', 'C7.3 Serial', 'C5. Nombre o Razón social del Fabricante', 'C8. Nombre o razón social del importador y/o distribuidor', 'C9. Área de funcionamiento del dispositivo médico en el momento del evento/incidente', 'C10. Indique si el dispositivo médico ha sido utilizado más de una vez', 'D1. Fecha del evento/incidente adverso (dd/mm/aaaa)', 'D2. Fecha de elaboración del reporte (dd/mm/aaaa)', 'D3. Detección del evento/incidente adverso', 'D4. Clasificación', 'D5. Descripción del evento o incidente adverso', 'D6. Desenlace del evento o incidente adverso', 'D6.1 Otro ¿Cuál?', 'E1. Causa probable del evento/incidente (NTC 5736:2009)', 'E2.Acciones correctivas y preventivas iniciadas', 'E3.Reportó al Fabricante/Importador/Distribuidor', 'E3.1 Fecha Reporte al Fabricante/Importador/Distribuidor', 'E4. ¿Dispositivo médico disponible para evaluación?', 'E5.Se ha enviado el DM a Fabricante/Importador/Distribuidor', 'E5.1.Fecha de envío del DM', 'F1.Nombres y apellidos', 'F2.Profesión', 'F3. Organización', 'F4. Dirección', 'F5.Teléfono', 'F6.Departamento', 'F7.Ciudad o municipio', 'F8.Correo electrónico Institucional', 'F9.Fecha de notificación al INVIMA (dd/mm/aaaa)', 'F10. Autoriza la divulgación del origen del reporte', 'F11. Tipo de Reportante', 'F12.Estado del Reporte'];
  const SECC = [[2, 7, 'A. LUGAR DONDE OCURRIÓ EL EVENTO O INCIDENTE'], [8, 13, 'B. INFORMACIÓN PACIENTE'], [14, 27, 'C. IDENTIFICACIÓN DEL DISPOSITIVO MÉDICO SOSPECHOSO'], [28, 34, 'D. EVENTO O INCIDENTE ADVERSO'], [35, 41, 'E. GESTIÓN REALIZADA'], [42, 53, 'F. INFORMACIÓN DEL REPORTANTE']];
  const dmy = (s) => { if (!s) return ''; const d = new Date(String(s).length <= 10 ? s + 'T12:00:00' : s); return isNaN(d) ? '' : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
  const sinSalto = (t) => String(t || '').replace(/\s*\n+\s*/g, ' ').trim();
  const exportarReteim = (ent, lista, eqs, sel) => {
    if (!esProp()) return;
    const c = TV.cfg(ent), nit = String(ent.nit || '').split('-')[0].replace(/\D/g, '');
    const filas = lista.map((ev, i) => { const d = ev.datos || {}, e = eqs.find((q) => q.id === ev.equipo_id) || {}; return [i + 1, d.codigo || '', d.institucion || ent.razon_social || '', d.departamento || c.departamento || '', d.ciudad || ent.ciudad || '', nit, c.nivel || '1', c.naturaleza || 'Privada',
      d.pac_tipo_id || '', d.pac_id || '', d.pac_sexo || '', d.pac_edad || '', d.pac_edad_en || '', sinSalto(d.pac_diagnostico), d.dm_generico || e.nombre || '', d.dm_comercial || '', d.dm_rs || e.registro_sanitario || '', d.dm_expediente || '', '1', d.dm_ecri || e.hv?.ecri || '', d.dm_lote || '', d.dm_modelo || e.modelo || '', d.dm_referencia || '', d.dm_serie || e.serie || '', d.dm_fabricante || e.fabricante || '', d.dm_importador || '', d.area || ev.servicio || '', d.dm_mas_vez || '',
      dmy(ev.fecha_evento), dmy(d.fecha_reporte), d.deteccion ? `${d.deteccion} del uso del DM` : '', ev.clasificacion || '', sinSalto(ev.descripcion), d.desenlace || '', d.desenlace_otro || '', TV.causaTxt(d.causa), sinSalto(d.acciones), d.reporto_fab || '', dmy(d.fecha_fab), d.dm_disponible || '', d.dm_enviado || '', dmy(d.fecha_envio),
      d.rep_nombre || ev.reportante || '', d.rep_profesion || ev.cargo || '', d.rep_organizacion || '', d.rep_direccion || '', String(d.rep_telefono || '').replace(/\D/g, '').slice(0, 10), d.departamento || c.departamento || '', d.ciudad || ent.ciudad || '', d.rep_correo || '', dmy(d.fecha_notificacion), d.autoriza || '', d.tipo_reportante || 'Prestador de servicios de salud', d.estado_reporte || 'A']; });
    const r1 = Array(54).fill(''); SECC.forEach(([a, , t]) => { r1[a] = t; });
    const ws = XLSX.utils.aoa_to_sheet([r1, RETEIM_H, ...filas]);
    ws['!merges'] = SECC.map(([a, b]) => ({ s: { r: 0, c: a }, e: { r: 0, c: b } })); ws['!cols'] = RETEIM_H.map((x, i) => ({ wch: [32].includes(i) ? 60 : 22 }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Plantilla de Cargue');
    XLSX.writeFile(wb, `RETEIM-002_T${sel.t}_${sel.anio}_${slug(ent.razon_social)}.xlsx`);
    S.log?.('DESCARGA', 'eventos', null, `RETEIM-002 T${sel.t} ${sel.anio}`);
  };

  // ================================================================== 5. CAPACITACIONES (plan semestral, presentación, pre / post test, asistencia)
  st.tvCapAnio = st.tvCapAnio || {};
  const puntos = (preg, resp) => { let ok = 0; preg.forEach((q, i) => { const r = [...(resp[i] || [])].sort().join(','); if (r === [...q.c].sort().join(',')) ok++; }); return { correctas: ok, puntaje: preg.length ? Math.round((ok / preg.length) * 100) : 0 }; };
  const prom = (l) => (l.length ? Math.round(l.reduce((s, t) => s + (t.datos.puntaje || 0), 0) / l.length) : null);
  const vCapacitacion = async (box, { ent }) => {
    const anio = st.tvCapAnio[ent.id] || anioAct;
    const regs = await regsDe(ent); if (regs === null) { box.innerHTML = `<section class="panel"><header><h2>Capacitaciones</h2></header>${avisoSQL()}</section>`; return; }
    const ses = regs.filter((r) => r.tipo === 'sesion' && r.datos?.programa !== 'equipos' && r.anio === anio).sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    const tests = regs.filter((r) => r.tipo === 'test');
    const tDe = (s, fase) => tests.filter((t) => t.datos.sesion_id === s.id && t.datos.fase === fase);
    ses.forEach((s) => { const a = prom(tDe(s, 'pre')), b = prom(tDe(s, 'post')); s._pre = a === null ? '' : a + '%'; s._post = b === null ? '' : b + '%'; });
    const ej = ses.filter((s) => s.datos?.estado === 'Ejecutada').length;
    const fila = (s) => { const d = s.datos || {}, nA = (d.asistentes || []).filter((x) => x.nombre).length; return `<tr><td class="num">${UI.fecha(s.fecha)}</td><td><b>${h(d.tema || '')}</b><div class="muted" style="font-size:.8rem">${h(d.dirigido || '')}${d.capacitador ? ' · ' + h(d.capacitador) : ''}</div></td>
      <td>${pill(d.estado || 'Programada', d.estado === 'Ejecutada' ? 'ok' : d.estado === 'Cancelada' ? 'bad' : s.fecha < UI.hoy() ? 'warn' : '')}</td><td class="num">${nA}</td><td class="num">${h(s._pre)}</td><td class="num">${h(s._post)}</td>
      <td><div class="row-actions" style="flex-wrap:wrap"><button class="btn sm" data-act="tvPres" data-id="${s.id}" title="Presentación de la capacitación">${I.pdf} Presentación</button>${esProp() ? `<button class="btn sm ${d.enlace?.abierto ? 'pri' : ''}" data-act="tvEnlace" data-id="${s.id}" title="Enlace para que cada persona responda el test desde su celular">Enlace virtual${d.enlace?.abierto ? ' · abierto' : ''}</button><button class="btn sm" data-act="tvAplicar" data-id="${s.id}" title="Aplicar pre o post test en esta pantalla">Aplicar test</button>` : ''}<button class="btn sm" data-act="tvRes" data-id="${s.id}">Resultados</button><button class="btn sm" data-act="tvAsis" data-id="${s.id}">${I.pdf} Asistencia</button>
        ${esProp() ? `<button class="icon-btn" data-act="tvEditSes" data-id="${s.id}" aria-label="Editar">${I.edit}</button><button class="icon-btn bad" data-act="tvDelSes" data-id="${s.id}" aria-label="Eliminar">${I.del}</button>` : ''}</div></td></tr>`; };
    box.innerHTML = `<section class="panel"><header><div><h2>Plan de capacitación semestral en tecnovigilancia · ${anio}</h2><span class="muted" style="font-size:.85rem">Sesiones por semestre con presentación (casos reales serios y no serios, cómo reportar e incentivos al reporte), pre y post test (${h(TV.fmtDe('test_tv').codigo)}) y lista de asistencia (${h(TV.fmtDe('asistencia_tv').codigo)}). Adherencia: ${ej} de ${ses.length} ejecutadas${ses.length ? ` (${Math.round((ej / ses.length) * 100)}%)` : ''} · meta 95%.</span></div>
        <div class="actions"><select data-tv-anio aria-label="Año">${[anioAct + 1, anioAct, anioAct - 1, anioAct - 2].map((a) => `<option ${a === anio ? 'selected' : ''}>${a}</option>`).join('')}</select><button class="btn" data-act="tvPlanPDF">${I.pdf} Plan (PDF)</button><button class="btn" data-act="tvPresGen">${I.pdf} Presentación general</button><button class="btn" data-act="tvTestBlanco">${I.pdf} Test en blanco</button>
          ${esProp() ? `<button class="btn" data-act="tvBanco">Preguntas del test</button><button class="btn" data-act="tvCodif">Codificación de formatos</button>${ses.length ? '' : `<button class="btn" data-act="tvPlanBase">${I.ia} Crear plan sugerido ${anio}</button>`}<button class="btn pri" data-act="tvNuevaSes">${I.mas} Sesión</button>` : ''}</div></header>
      ${['S1', 'S2'].map((p) => { const l = ses.filter((s) => s.periodo === p); return `<h3 style="margin:14px 0 6px;font-size:.95rem">${p === 'S1' ? 'Primer semestre (enero – junio)' : 'Segundo semestre (julio – diciembre)'}</h3>${l.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Tema</th><th>Estado</th><th>Asist.</th><th>Pre</th><th>Post</th><th></th></tr></thead><tbody>${l.map(fila).join('')}</tbody></table></div>` : '<div class="empty">Sin sesiones programadas.</div>'}`; }).join('')}</section>`;
    box.querySelector('[data-tv-anio]').onchange = (e) => { st.tvCapAnio[ent.id] = +e.target.value; A.recargar(); };
    const S_ = (id) => ses.find((s) => s.id === id);
    A.acts({
      tvNuevaSes: () => formSesion(ent, null, anio), tvEditSes: (d) => formSesion(ent, S_(d.id), anio, tests),
      tvDelSes: async (d) => { const s = S_(d.id); const n = tests.filter((t) => t.datos.sesion_id === s.id).length; if (!(await confirmar(`¿Eliminar la sesión “${s.datos?.tema}”${n ? ` y sus ${n} test` : ''}?`))) return; for (const t of tests.filter((t) => t.datos.sesion_id === s.id)) await S.remove(TB, t.id); await S.remove(TB, s.id); A.recargar(); },
      tvPlanBase: async () => { for (const [p, mes, tema, objetivo] of PLAN_BASE) await S.insert(TB, { entidad_id: ent.id, tipo: 'sesion', anio, periodo: p, fecha: `${anio}-${String(mes).padStart(2, '0')}-15`, datos: { tema, objetivo, dirigido: 'Personal asistencial y administrativo', capacitador: st.emp.responsable || '', modalidad: 'Presencial', duracion: '1 hora', estado: 'Programada', asistentes: [] } }); toast('Plan semestral creado: ajuste fechas y capacitador'); A.recargar(); },
      tvPlanPDF: () => verDoc(ent, TV.pdfPlan(ent, { anio, sesiones: ses }), `Plan de capacitación ${anio}`, `Plan_capacitacion_TV_${anio}_${slug(ent.razon_social)}.pdf`, 5),
      tvPresGen: async () => { const evs = (await S.list('eventos', { entidad_id: ent.id }, '-fecha_evento')).slice(0, 4); const eqs = await S.list('equipos', { entidad_id: ent.id }); verDoc(ent, TV.pdfPresentacion(ent, { casosEnt: evs, casos: TV.casosPara(ent, eqs) }), 'Presentación · Programa de tecnovigilancia', `Presentacion_Tecnovigilancia_${slug(ent.razon_social)}.pdf`, 5); },
      tvPres: async (d) => { const s = S_(d.id); const evs = (await S.list('eventos', { entidad_id: ent.id }, '-fecha_evento')).slice(0, 4); const eqs = await S.list('equipos', { entidad_id: ent.id }); verDoc(ent, TV.pdfPresentacion(ent, { ses: s, casosEnt: s.datos?.casos_ent === false ? [] : evs, casos: TV.casosPara(ent, eqs) }), `Presentación · ${s.datos?.tema}`, `Presentacion_${slug(s.datos?.tema)}_${s.fecha}.pdf`, 5); },
      tvTestBlanco: () => modal({ titulo: 'Test en blanco', cuerpo: '<p>¿Qué desea generar?</p>', acciones: [{ t: 'Pre-test', fn: () => verDoc(ent, TV.pdfTest(ent, { ses: null, preguntas: preguntasDe(ent), fase: 'pre' }), 'Pre-test en blanco', 'Pre_test_en_blanco.pdf', 5) }, { t: 'Post-test', fn: () => verDoc(ent, TV.pdfTest(ent, { ses: null, preguntas: preguntasDe(ent), fase: 'post' }), 'Post-test en blanco', 'Post_test_en_blanco.pdf', 5) }, ...(esProp() ? [{ t: 'Clave de respuestas', cls: 'pri', fn: () => verDoc(ent, TV.pdfClave(ent, { ses: null, preguntas: preguntasDe(ent) }), 'Clave de respuestas', 'Clave_respuestas_test.pdf', null) }] : [])] }),
      tvAplicar: (d) => aplicarTest(ent, S_(d.id)),
      tvEnlace: (d) => enlaceVirtual(ent, S_(d.id), tests.filter((t) => t.datos.sesion_id === d.id)),
      tvRes: (d) => resultados(ent, S_(d.id), tests.filter((t) => t.datos.sesion_id === d.id)),
      tvAsis: async (d) => { const s = S_(d.id); const doc = await TV.pdfAsistencia(ent, { ses: s, asistentes: (s.datos?.asistentes || []).filter((a) => a.nombre), tests: tests.filter((t) => t.datos.sesion_id === s.id) }); verDoc(ent, doc, `Lista de asistencia · ${s.datos?.tema}`, `Asistencia_${slug(s.datos?.tema)}_${s.fecha}.pdf`, 5); },
      tvBanco: () => formBanco(ent),
      tvCodif: () => formCodificacion(),
    });
  };
  const filaAsis = (a = {}, i = 0) => `<div class="ac-asis tv-asis" style="display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr auto;gap:6px;align-items:center;margin-bottom:6px">
    <input data-k="nombre" placeholder="Nombres y apellidos" value="${h(a.nombre || '')}" aria-label="Nombre ${i + 1}"><input data-k="cedula" placeholder="Cédula" value="${h(a.cedula || '')}" aria-label="Cédula"><input data-k="cargo" placeholder="Cargo" value="${h(a.cargo || '')}" aria-label="Cargo"><input data-k="servicio" placeholder="Servicio" value="${h(a.servicio || '')}" aria-label="Servicio">
    <div style="display:flex;gap:4px;align-items:center"><span class="tv-firma" data-firma="${h(a.firma || '')}" style="display:inline-flex;width:70px;height:26px;border:1px dashed var(--line);border-radius:6px;align-items:center;justify-content:center;font-size:.7rem;overflow:hidden">${a.firma ? `<img src="${a.firma}" alt="Firma" style="max-height:24px">` : 'Sin firma'}</span><button type="button" class="btn sm" data-fdib>${I.firma}</button><button type="button" class="icon-btn bad" data-fdel aria-label="Quitar">${I.x}</button></div></div>`;
  const formSesion = (ent, s, anio, tests = []) => {
    const d = s?.datos || {};
    modal({ titulo: s ? 'Sesión de capacitación' : 'Nueva sesión de capacitación', size: 'wide', cuerpo: `<form class="form" onsubmit="return false">
      <fieldset><legend>Programación</legend><div class="fields">${f.input('tema', 'Tema *', d.tema, { full: true })}${f.area('objetivo', 'Objetivo / contenido', d.objetivo, { rows: 2 })}${f.input('dirigido', 'Dirigido a', d.dirigido || 'Personal asistencial y administrativo')}${f.input('capacitador', 'Capacitador', d.capacitador || st.emp.responsable || '')}
        ${f.input('fecha', 'Fecha programada *', s?.fecha || `${anio}-${String(new Date().getMonth() + 1).padStart(2, '0')}-15`, { type: 'date' })}${f.sel('modalidad', 'Modalidad', ['Presencial', 'Virtual', 'Mixta'], d.modalidad || 'Presencial')}${f.input('lugar', 'Lugar', d.lugar)}${f.input('duracion', 'Intensidad', d.duracion || '1 hora')}</div></fieldset>
      <fieldset><legend>Ejecución</legend><div class="fields">${f.sel('estado', 'Estado', ['Programada', 'Ejecutada', 'Reprogramada', 'Cancelada'], d.estado || 'Programada')}${f.input('fecha_ejec', 'Fecha de ejecución', d.fecha_ejec, { type: 'date' })}${f.input('hora_ini', 'Hora inicial', d.hora_ini, { type: 'time' })}${f.input('hora_fin', 'Hora final', d.hora_fin, { type: 'time' })}
        ${f.sel('casos_ent', 'Incluir en la presentación los casos registrados de la entidad (sin datos del paciente)', [['true', 'Sí'], ['false', 'No']], String(d.casos_ent !== false))}</div></fieldset>
      <fieldset><legend>Lista de asistencia</legend><p class="muted" style="font-size:.82rem;margin:0 0 6px">Los participantes que presentan el test en pantalla se agregan solos. Cada asistente puede firmar en la pantalla.</p><div data-asis>${(d.asistentes || []).map(filaAsis).join('')}</div>
        <div class="actions"><button type="button" class="btn sm" data-add>${I.mas} Asistente</button>${tests.length ? `<button type="button" class="btn sm" data-imp>Agregar los que presentaron el test</button>` : ''}</div></fieldset></form>`,
      alAbrir: (m) => {
        const cont = m.body.querySelector('[data-asis]');
        if (!cont.children.length) for (let i = 0; i < 3; i++) cont.insertAdjacentHTML('beforeend', filaAsis({}, i));
        m.body.querySelector('[data-add]').onclick = () => cont.insertAdjacentHTML('beforeend', filaAsis({}, cont.children.length));
        const imp = m.body.querySelector('[data-imp]'); if (imp) imp.onclick = () => { const ya = new Set([...cont.querySelectorAll('[data-k=cedula]')].map((i) => i.value.trim()).filter(Boolean)); tests.filter((t) => t.datos.sesion_id === s.id).forEach((t) => { if (!ya.has(t.datos.cedula)) { ya.add(t.datos.cedula); cont.insertAdjacentHTML('beforeend', filaAsis(t.datos, cont.children.length)); } }); };
        cont.addEventListener('click', async (e) => {
          const row = e.target.closest('.tv-asis'); if (!row) return;
          if (e.target.closest('[data-fdel]')) { row.remove(); return; }
          if (e.target.closest('[data-fdib]')) { const r = await UI.pedirFirma({ titulo: `Firma · ${row.querySelector('[data-k=nombre]').value}` }); if (r) { const c = row.querySelector('.tv-firma'); c.dataset.firma = r; c.innerHTML = `<img src="${r}" alt="Firma" style="max-height:24px">`; } }
        });
      },
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
        const v = leer(m.body); if (!v.tema || !v.fecha) { toast('Indique el tema y la fecha', true); return false; }
        const asistentes = [...m.body.querySelectorAll('.tv-asis')].map((r) => ({ nombre: r.querySelector('[data-k=nombre]').value.trim(), cedula: r.querySelector('[data-k=cedula]').value.trim(), cargo: r.querySelector('[data-k=cargo]').value.trim(), servicio: r.querySelector('[data-k=servicio]').value.trim(), firma: r.querySelector('.tv-firma').dataset.firma || null })).filter((a) => a.nombre);
        const { fecha, ...resto } = v; const mes = +fecha.slice(5, 7);
        const o = { entidad_id: ent.id, tipo: 'sesion', anio: +fecha.slice(0, 4), periodo: mes <= 6 ? 'S1' : 'S2', fecha, datos: { ...d, ...resto, casos_ent: v.casos_ent === 'true', asistentes } };
        if (o.datos.estado === 'Ejecutada' && !o.datos.fecha_ejec) o.datos.fecha_ejec = fecha;
        s ? await S.update(TB, s.id, o) : await S.insert(TB, o); toast('Sesión guardada'); A.recargar();
      } }] });
  };
  const aplicarTest = (ent, s, faseIni = 'pre') => {
    const preg = s.datos?.preguntas?.length ? s.datos.preguntas : preguntasDe(ent);
    let firma = null;
    modal({ titulo: `Pre / post test · ${s.datos?.tema || ''}`, size: 'wide', cuerpo: `<form class="form" onsubmit="return false">
      <div class="fields">${f.sel('fase', 'Tipo de test', [['pre', 'PRE-TEST (antes de la capacitación)'], ['post', 'POST-TEST (después de la capacitación)']], faseIni)}${f.input('nombre', 'Nombres y apellidos *', '')}${f.input('cedula', 'Cédula *', '')}${f.input('servicio', 'Servicio', '')}${f.input('cargo', 'Cargo', '')}</div>
      <p style="margin:10px 0 4px"><b>Marque la o las respuestas correctas.</b></p>
      ${preg.map((q, i) => `<fieldset style="margin-bottom:8px"><legend>${i + 1}. ${h(q.p)}</legend>${q.o.map((o, j) => `<label style="display:flex;gap:8px;align-items:flex-start;padding:3px 0"><input type="checkbox" name="q${i}" value="${j}"> <span>${'abcdefg'[j]}) ${h(o)}</span></label>`).join('')}</fieldset>`).join('')}
      <div class="actions"><button type="button" class="btn" data-firmar>${I.firma} Firmar</button><span data-fprev class="muted">Sin firma</span></div></form>`,
      alAbrir: (m) => { m.body.querySelector('[data-firmar]').onclick = async () => { const r = await UI.pedirFirma({ titulo: 'Firma del participante' }); if (r) { firma = r; m.body.querySelector('[data-fprev]').innerHTML = `<img src="${r}" alt="Firma" style="max-height:30px">`; } }; },
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar y siguiente', fn: (m) => guardar(m, true) }, { t: 'Guardar', cls: 'pri', fn: (m) => guardar(m, false) }] });
    async function guardar(m, otro) {
      const v = leer(m.body); if (!v.nombre || !v.cedula) { toast('Nombre y cédula son obligatorios', true); return false; }
      const resp = preg.map((q, i) => (v[`q${i}`] || []).map(Number));
      const p = puntos(preg, resp);
      const datos = { sesion_id: s.id, fase: v.fase, nombre: v.nombre.trim(), cedula: v.cedula.trim(), servicio: v.servicio, cargo: v.cargo, resp, ...p, firma };
      await S.insert(TB, { entidad_id: ent.id, tipo: 'test', anio: s.anio, periodo: s.periodo, fecha: UI.hoy(), datos });
      // queda en la lista de asistencia de la sesión
      const sd = { ...(s.datos || {}) }; sd.asistentes = sd.asistentes || []; if (!sd.preguntas?.length) sd.preguntas = preg;
      const ya = sd.asistentes.find((a) => (a.cedula && a.cedula === datos.cedula) || a.nombre.toLowerCase() === datos.nombre.toLowerCase());
      if (ya) { if (!ya.firma && firma) ya.firma = firma; } else sd.asistentes.push({ nombre: datos.nombre, cedula: datos.cedula, cargo: datos.cargo, servicio: datos.servicio, firma });
      await S.update(TB, s.id, { datos: sd }); s.datos = sd;
      toast(`${datos.nombre}: ${p.correctas} de ${preg.length} (${p.puntaje}%)`);
      if (otro) { setTimeout(() => aplicarTest(ent, s, v.fase), 60); return true; }
      A.recargar();
    }
  };
  // ------------------------------------------------------------------ enlace virtual (cada persona responde desde su celular, sin usuario)
  const nuevoToken = () => { const b = new Uint8Array(24); crypto.getRandomValues(b); return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const urlTest = (tk) => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}test.html?t=${encodeURIComponent(tk)}`;
  const enlaceVirtual = (ent, s, ts) => {
    const en = s.datos?.enlace || {}; const preg = s.datos?.preguntas?.length ? s.datos.preguntas : preguntasDe(ent);
    const url = en.token ? urlTest(en.token) : '';
    const fases = en.fases || ['pre'];
    const nPre = ts.filter((t) => t.datos.fase === 'pre').length, nPost = ts.filter((t) => t.datos.fase === 'post').length;
    const texto = `${ent.razon_social} · Capacitación: ${s.datos?.tema || ''}. Responda el ${fases.length > 1 ? 'pre y post test' : fases[0] === 'post' ? 'post-test' : 'pre-test'} en este enlace (no necesita usuario): ${url}`;
    modal({ titulo: `Enlace virtual del test · ${s.datos?.tema || ''}`, size: 'wide', cuerpo: `<form class="form" onsubmit="return false">
      <p class="muted" style="font-size:.88rem">Cada persona abre el enlace en su celular o computador, escribe su nombre y cédula, responde y firma. La calificación se hace en el servidor (las respuestas correctas no se envían al celular), cada cédula responde una sola vez cada test y queda sola en la lista de asistencia. El enlace no da acceso a ningún otro documento de la entidad.</p>
      <div class="fields">${f.sel('abierto', 'Estado del enlace', [['true', 'Abierto (se puede responder)'], ['false', 'Cerrado']], String(en.token ? !!en.abierto : true))}
        <div class="field"><span class="lbl">Tests habilitados</span><div class="checks"><label><input type="checkbox" name="fases" value="pre" ${fases.includes('pre') ? 'checked' : ''}> Pre-test</label><label><input type="checkbox" name="fases" value="post" ${fases.includes('post') ? 'checked' : ''}> Post-test</label></div></div>
        ${f.sel('mostrar', 'Al enviar, mostrar la calificación a la persona', [['true', 'Sí'], ['false', 'No']], String(en.mostrar !== false))}${f.sel('firma', 'Pedir firma', [['true', 'Sí'], ['false', 'No']], String(en.firma !== false))}</div>
      ${url ? `<div class="field full" style="margin-top:10px"><label for="tv_url">Enlace para enviar</label><div style="display:flex;gap:6px"><input id="tv_url" value="${h(url)}" readonly style="flex:1" onclick="this.select()"><button type="button" class="btn" data-copiar>Copiar</button></div></div>
        <div class="actions" style="margin-top:8px"><a class="btn" href="https://wa.me/?text=${encodeURIComponent(texto)}" target="_blank" rel="noopener">WhatsApp</a><a class="btn" href="mailto:?subject=${encodeURIComponent('Pre y post test · ' + (s.datos?.tema || ''))}&body=${encodeURIComponent(texto)}">Correo</a><a class="btn" href="${h(url)}" target="_blank" rel="noopener">Probar el enlace</a></div>
        <p class="muted" style="font-size:.85rem">Respuestas recibidas: ${nPre} pre-test · ${nPost} post-test. Las preguntas del enlace son las ${preg.length} guardadas para esta sesión.</p>` : '<p class="muted">Al guardar se crea el enlace.</p>'}</form>`,
      alAbrir: (m) => { const c = m.body.querySelector('[data-copiar]'); if (c) c.onclick = async () => { try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); } catch { m.body.querySelector('#tv_url').select(); document.execCommand('copy'); toast('Enlace copiado'); } }; },
      acciones: [...(en.token ? [{ t: 'Cambiar enlace', fn: async (m) => { if (!(await confirmar('El enlace anterior dejará de funcionar. ¿Crear uno nuevo?', 'Cambiar'))) return false; await guardarEnlace(m, true); } }] : []), { t: 'Cancelar' }, { t: en.token ? 'Guardar' : 'Crear enlace', cls: 'pri', fn: (m) => guardarEnlace(m, false) }] });
    async function guardarEnlace(m, renovar) {
      const v = leer(m.body); if (!(v.fases || []).length) { toast('Habilite al menos un test', true); return false; }
      const sd = { ...(s.datos || {}), preguntas: preg, enlace: { token: renovar || !en.token ? nuevoToken() : en.token, abierto: v.abierto === 'true', fases: v.fases, mostrar: v.mostrar === 'true', firma: v.firma === 'true', creado: en.creado || new Date().toISOString() } };
      await S.update(TB, s.id, { datos: sd }); s.datos = sd; toast(renovar ? 'Enlace nuevo creado' : 'Enlace guardado');
      A.recargar(); setTimeout(() => enlaceVirtual(ent, s, ts), 400);
    }
  };
  const resultados = (ent, s, ts) => {
    const preg = s.datos?.preguntas?.length ? s.datos.preguntas : preguntasDe(ent);
    const per = {}; ts.forEach((t) => { const k = t.datos.cedula || t.datos.nombre; per[k] = per[k] || { n: t.datos.nombre, c: t.datos.cedula }; per[k][t.datos.fase] = t; });
    const pr = prom(ts.filter((t) => t.datos.fase === 'pre')), po = prom(ts.filter((t) => t.datos.fase === 'post'));
    const m = modal({ titulo: `Resultados · ${s.datos?.tema || ''}`, size: 'wide', cuerpo: `<div class="kpis"><div class="kpi"><span class="l">Promedio pre-test</span><span class="v">${pr ?? '—'}${pr === null ? '' : '%'}</span></div><div class="kpi ${po === null ? '' : po >= 80 ? 'ok' : 'bad'}"><span class="l">Promedio post-test</span><span class="v">${po ?? '—'}${po === null ? '' : '%'}</span><span class="meta">Meta ≥ 80%</span></div><div class="kpi"><span class="l">Participantes</span><span class="v">${Object.keys(per).length}</span></div></div>
      ${Object.keys(per).length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Participante</th><th>Cédula</th><th class="r">Pre</th><th class="r">Post</th><th class="r">Mejora</th><th></th></tr></thead><tbody>${Object.values(per).map((x) => `<tr><td>${h(x.n)}${(x.pre || x.post)?.datos?.virtual ? ' <span class="pill">virtual</span>' : ''}</td><td class="mono">${h(x.c || '')}</td><td class="r num">${x.pre ? x.pre.datos.puntaje + '%' : '—'}</td><td class="r num">${x.post ? x.post.datos.puntaje + '%' : '—'}</td><td class="r num">${x.pre && x.post ? (x.post.datos.puntaje - x.pre.datos.puntaje >= 0 ? '+' : '') + (x.post.datos.puntaje - x.pre.datos.puntaje) + ' pts' : ''}</td>
        <td><div class="row-actions">${['pre', 'post'].filter((fz) => x[fz]).map((fz) => `<button class="btn sm" data-ver="${x[fz].id}">${I.pdf} ${fz === 'pre' ? 'Pre' : 'Post'}</button>${esProp() ? `<button class="icon-btn bad" data-del="${x[fz].id}" aria-label="Eliminar ${fz}">${I.del}</button>` : ''}`).join('')}</div></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Aún no hay test presentados.</div>'}`,
      alAbrir: (mm) => mm.body.addEventListener('click', async (e) => {
        const v = e.target.closest('[data-ver]'), dl = e.target.closest('[data-del]');
        if (v) { const t = ts.find((x) => x.id === v.dataset.ver); verDoc(ent, TV.pdfTest(ent, { ses: s, preguntas: preg, t: { ...t, fase: t.datos.fase } }), `${t.datos.fase === 'pre' ? 'Pre' : 'Post'}-test · ${t.datos.nombre}`, `${t.datos.fase === 'pre' ? 'Pre' : 'Post'}_test_${slug(t.datos.nombre)}.pdf`, 5); }
        if (dl && await confirmar('¿Eliminar este test?')) { await S.remove(TB, dl.dataset.del); m.cerrar(); A.recargar(); }
      }),
      acciones: [{ t: 'Cerrar' }] });
  };
  TV.aplicarTest = (...a) => aplicarTest(...a); TV.enlaceVirtual = (...a) => enlaceVirtual(...a); TV.resultados = (...a) => resultados(...a); TV.puntos = puntos; TV.prom = prom;
  const txtBanco = (l) => l.map((q, i) => `${i + 1}. ${q.p}\n${q.o.map((o, j) => `${q.c.includes(j) ? '*' : ''}${'abcdefg'[j]}) ${o}`).join('\n')}`).join('\n\n');
  const leerBanco = (t) => { const out = []; let q = null; String(t).split('\n').forEach((raw) => { const l = raw.trim(); if (!l) return; const mo = l.match(/^(\*?)\s*([a-g])\)\s*(.+)$/i); if (mo && q) { if (mo[1]) q.c.push(q.o.length); q.o.push(mo[3].trim()); return; } const mp = l.match(/^\d+[.)]\s*(.+)$/); if (mp) { q = { p: mp[1].trim(), o: [], c: [] }; out.push(q); } }); return out.filter((x) => x.o.length >= 2 && x.c.length); };
  TV.txtBanco = txtBanco; TV.leerBanco = leerBanco;
  const formBanco = (ent) => modal({ titulo: `Preguntas del pre y post test · ${ent.razon_social}`, size: 'wide', cuerpo: `<p class="muted" style="font-size:.85rem">Una pregunta por bloque: <span class="mono">1. Pregunta</span> y debajo las opciones <span class="mono">a) …</span>. Marque con <span class="mono">*</span> la(s) correcta(s), ej. <span class="mono">*b) opción correcta</span>. Las sesiones que ya tienen test conservan sus preguntas.</p><textarea data-tx rows="26" style="width:100%;font-family:ui-monospace,monospace;font-size:.8rem">${h(txtBanco(preguntasDe(ent)))}</textarea>`,
    acciones: [{ t: 'Restablecer preguntas base', fn: (m) => { m.body.querySelector('[data-tx]').value = txtBanco(TV.PREGUNTAS); return false; } }, { t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => { const l = leerBanco(m.body.querySelector('[data-tx]').value); if (l.length < 3) { toast('Revise el formato: se necesitan al menos 3 preguntas con su respuesta marcada con *', true); return false; } await guardarCfg(ent, { preguntas: l }); toast(`${l.length} preguntas guardadas para esta entidad`); A.recargar(); } }] });
  const formCodificacion = () => {
    const ks = [['test_tv', 'Pre y post test'], ['asistencia_tv', 'Lista de asistencia'], ['plan_cap_tv', 'Plan de capacitación'], ['indicadores_tv', 'Gestión de indicadores'], ['evento', 'Reporte FT-PGTV-016'], ['programa_tv', 'Documento del programa']];
    modal({ titulo: 'Codificación de los formatos de tecnovigilancia', size: 'wide', cuerpo: `<p class="muted" style="font-size:.85rem">Título, código, versión y fecha que se imprimen en el encabezado de cada formato (aplica a todas las entidades; también se editan en Administración → Formatos).</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Formato</th><th>Título</th><th>Código</th><th>Versión</th><th>Fecha</th></tr></thead><tbody>${ks.map(([k, n]) => { const x = TV.fmtDe(k); return `<tr data-k="${k}"><td><b>${h(n)}</b></td><td><input data-c="titulo" value="${h(x.titulo || '')}" aria-label="Título ${h(n)}" style="width:100%"></td><td><input data-c="codigo" value="${h(x.codigo || '')}" aria-label="Código" style="width:110px"></td><td><input data-c="version" value="${h(x.version || '')}" aria-label="Versión" style="width:60px"></td><td><input type="date" data-c="fecha" value="${h(x.fecha || '')}" aria-label="Fecha"></td></tr>`; }).join('')}</tbody></table></div>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar codificación', cls: 'pri', fn: async (m) => { for (const tr of m.body.querySelectorAll('tr[data-k]')) { const k = tr.dataset.k, v = {}; tr.querySelectorAll('[data-c]').forEach((i) => { v[i.dataset.c] = i.value.trim(); }); await S.upsert('formatos', { clave: k, datos: { ...TV.fmtDe(k), ...v } }); } await A.cargarConfig(); toast('Codificación actualizada'); A.recargar(); } }] });
  };

  // ================================================================== 6. INDICADORES DEL PROGRAMA (parametrizados)
  st.tvIndAnio = st.tvIndAnio || {};
  TV.calcIndicadores = ({ ent, anio, evs, regs, cronos, alertas, docs }) => {
    const ind = (regs || []).find((r) => r.tipo === 'indicadores' && r.anio === anio)?.datos || {};
    const pac = ind.pac || {}, meta = parseFloat(String(TV.cfg(ent).meta_eventos || '3').replace(',', '.')) || 3;
    const hoy = new Date(), mesLim = hoy.getFullYear() === anio ? hoy.getMonth() + 1 : hoy.getFullYear() > anio ? 12 : 0;
    const enT = (iso, t) => anioDe(iso) === anio && trimDe(iso) === t;
    const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
    const cel = (v, ok, txt) => ({ v, ok: v === null ? null : ok, txt: txt ?? (v === null ? '—' : `${v}%`) });
    const mp = (t) => { let p = 0, e = 0; (cronos || []).filter((c) => c.tipo === 'mantenimiento' && c.anio === anio).forEach((c) => Object.entries(c.plan || {}).forEach(([k, val]) => { const mm = +k.split('-')[0]; if ((t ? Math.ceil(mm / 3) === t : true) && mm <= mesLim && ['P', 'E', 'N'].includes(val)) { p++; if (val === 'E') e++; } })); return { p, e }; };
    const ses = (regs || []).filter((r) => r.tipo === 'sesion' && r.datos?.programa !== 'equipos' && r.anio === anio && r.datos?.estado !== 'Cancelada');
    const idsSes = new Set(ses.map((x) => x.id));
    const tests = (regs || []).filter((r) => r.tipo === 'test' && r.anio === anio && r.datos?.fase === 'post' && idsSes.has(r.datos?.sesion_id));
    const mesesAl = new Set(); (alertas || []).forEach((a) => { const tx = String(a.mes_consulta || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); const y = (tx.match(/20\d\d/) || [])[0]; if (y && +y !== anio) return; const i = CAT.MESES.findIndex((m) => tx.includes(m.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase())); if (i >= 0) mesesAl.add(i + 1); }); (A.mesesAlertasDocs?.(docs || [], anio) || []).forEach((m) => mesesAl.add(m));
    const T = [1, 2, 3, 4];
    const fila = (nombre, formula, metaTxt, fn) => { const v = T.map((t) => fn(t)); return { nombre, formula, meta: metaTxt, v, anual: fn(0) }; };
    const filas = [
      fila('Índice de eventos o incidentes adversos', '(NEAD / NTPA) × 100 · NEAD: eventos e incidentes con DM detectados; NTPA: pacientes atendidos', `≤ ${meta}%`, (t) => { const n = evs.filter((e) => (t ? enT(e.fecha_evento, t) : anioDe(e.fecha_evento) === anio)).length; const p = t ? +pac[`T${t}`] || 0 : T.reduce((s, x) => s + (+pac[`T${x}`] || 0), 0); const v = pct(n, p); return cel(v, v !== null && v <= meta, v === null ? (n ? `${n} / sin NTPA` : '—') : `${v}% (${n}/${p})`); }),
      fila('Oportunidad del reporte de eventos serios (≤ 72 h)', 'Serios notificados al INVIMA en ≤ 72 h / total de serios × 100', '100%', (t) => { const l = evs.filter((e) => TV.esSerio(e) && (t ? enT(e.fecha_evento, t) : anioDe(e.fecha_evento) === anio)); const ok = l.filter((e) => e.datos?.fecha_notificacion && new Date(e.datos.fecha_notificacion + 'T23:59:00') - new Date(e.fecha_evento) <= 72 * 36e5).length; const v = pct(ok, l.length); return cel(v, v === 100, l.length ? `${v}% (${ok}/${l.length})` : 'Sin serios'); }),
      fila('Reporte trimestral al INVIMA (incluye en cero)', 'Trimestres reportados / trimestres cerrados', '100%', (t) => { const cerrado = (x) => anio < hoy.getFullYear() || (anio === hoy.getFullYear() && x < trimDe(UI.hoy())); const rep = (x) => (regs || []).some((r) => r.tipo === 'trimestral' && r.anio === anio && r.periodo === `T${x}` && r.datos?.fecha_envio); if (t) { if (rep(t)) return cel(100, true, 'Reportado'); return cerrado(t) ? cel(0, false, 'Pendiente') : cel(null, null, '—'); } const c = T.filter(cerrado), r = c.filter(rep).length; const v = pct(r, c.length); return cel(v, v === 100, c.length ? `${v}% (${r}/${c.length})` : '—'); }),
      fila('Cumplimiento de mantenimiento preventivo', '(AMPR / AMPP) × 100', '≥ 95%', (t) => { const { p, e } = mp(t); const v = pct(e, p); return cel(v, v !== null && v >= 95, p ? `${v}% (${e}/${p})` : '—'); }),
      fila('Adherencia al programa (plan de capacitación)', '(NCR / NCP) × 100 · capacitaciones realizadas / programadas', '≥ 95%', (t) => { const l = ses.filter((s) => (t ? trimDe(s.fecha) === t : true) && (s.fecha <= UI.hoy() || s.datos?.estado === 'Ejecutada')); const r = l.filter((s) => s.datos?.estado === 'Ejecutada').length; const v = pct(r, l.length); return cel(v, v !== null && v >= 95, l.length ? `${v}% (${r}/${l.length})` : '—'); }),
      fila('Eficacia de la capacitación (post test)', 'Promedio de calificación del post test', '≥ 80%', (t) => { const l = tests.filter((x) => (t ? trimDe(x.fecha) === t : true)); const v = prom(l); return cel(v, v !== null && v >= 80, v === null ? '—' : `${v}% (${l.length})`); }),
      fila('Consulta de alertas sanitarias', 'Meses con consulta registrada / meses transcurridos × 100', '100%', (t) => { const ms = (t ? [1, 2, 3].map((i) => (t - 1) * 3 + i) : [...Array(12)].map((_, i) => i + 1)).filter((mm) => mm <= mesLim); const c = ms.filter((mm) => mesesAl.has(mm)).length; const v = pct(c, ms.length); return cel(v, v === 100, ms.length ? `${v}% (${c}/${ms.length})` : '—'); }),
    ];
    return { filas, ind };
  };
  const vIndicadores = async (box, { ent }) => {
    const anio = st.tvIndAnio[ent.id] || anioAct;
    const [evs, regs, cronos, alertas, docs] = await Promise.all([S.list('eventos', { entidad_id: ent.id }), regsDe(ent), S.list('cronogramas', { entidad_id: ent.id }), S.list('alertas', { entidad_id: ent.id }), S.list('documentos', { entidad_id: ent.id }).catch(() => [])]);
    const { filas, ind } = TV.calcIndicadores({ ent, anio, evs, regs, cronos, alertas, docs });
    const fmt = TV.fmtDe('indicadores_tv');
    const col = (c) => `<td class="r num" style="${c.ok === null || c.ok === undefined ? '' : c.ok ? 'background:rgba(40,167,69,.12)' : 'background:rgba(220,53,69,.12)'}">${h(c.txt)}</td>`;
    box.innerHTML = `<section class="panel"><header><div><h2>Indicadores del programa de tecnovigilancia · ${anio}</h2><span class="muted" style="font-size:.85rem">Formato ${h(fmt.codigo)}. Se calculan solos con los reportes, el cronograma de mantenimiento, el plan de capacitación, los test y la bitácora de alertas. Para el índice de eventos registre los pacientes atendidos (NTPA) de cada trimestre.</span></div>
        <div class="actions"><select data-tv-anio aria-label="Año">${[anioAct, anioAct - 1, anioAct - 2].map((a) => `<option ${a === anio ? 'selected' : ''}>${a}</option>`).join('')}</select>${esProp() ? `<button class="btn" data-act="tvPac">${I.edit} Pacientes atendidos y análisis</button>` : ''}<button class="btn pri" data-act="tvIndPDF">${I.pdf} ${h(fmt.codigo)} (PDF)</button></div></header>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Indicador</th><th>Meta</th><th class="r">I trim.</th><th class="r">II trim.</th><th class="r">III trim.</th><th class="r">IV trim.</th><th class="r">Año</th></tr></thead><tbody>
        ${filas.map((x) => `<tr><td><b>${h(x.nombre)}</b><div class="muted" style="font-size:.78rem">${h(x.formula)}</div></td><td style="white-space:nowrap">${h(x.meta)}</td>${x.v.map(col).join('')}${col(x.anual)}</tr>`).join('')}</tbody></table></div>
      ${['T1', 'T2', 'T3', 'T4'].some((t) => ind.analisis?.[t]) ? `<h3 style="font-size:.95rem;margin:14px 0 6px">Análisis</h3>${['T1', 'T2', 'T3', 'T4'].filter((t) => ind.analisis?.[t]).map((t) => `<p><b>${TV.TRIM[+t[1] - 1]}:</b> ${h(ind.analisis[t])}</p>`).join('')}` : ''}</section>`;
    box.querySelector('[data-tv-anio]').onchange = (e) => { st.tvIndAnio[ent.id] = +e.target.value; A.recargar(); };
    const reg = (regs || []).find((r) => r.tipo === 'indicadores' && r.anio === anio);
    A.acts({
      tvIndPDF: () => verDoc(ent, TV.pdfIndicadores(ent, { anio, filas, analisis: ind.analisis || {} }), `Indicadores de tecnovigilancia ${anio}`, `${fmt.codigo}_Indicadores_TV_${anio}_${slug(ent.razon_social)}.pdf`, 6),
      tvPac: () => {
        if (regs === null) { toast('Falta actualizar la base de datos: ejecute supabase/tecnovigilancia.sql', true); return; }
        modal({ titulo: `Pacientes atendidos y análisis · ${anio}`, size: 'wide', cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${[1, 2, 3, 4].map((t) => f.input(`pac_T${t}`, `Pacientes atendidos ${TV.TRIM[t - 1].toLowerCase()} (NTPA)`, ind.pac?.[`T${t}`] ?? '', { type: 'number' })).join('')}
          ${[1, 2, 3, 4].map((t) => f.area(`an_T${t}`, `Análisis y acciones de mejora · ${TV.TRIM[t - 1].toLowerCase()}`, ind.analisis?.[`T${t}`] || '', { rows: 2 })).join('')}</div></form>`,
          acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => { const v = leer(m.body); const datos = { pac: {}, analisis: {} }; [1, 2, 3, 4].forEach((t) => { datos.pac[`T${t}`] = v[`pac_T${t}`] === '' ? null : +v[`pac_T${t}`]; datos.analisis[`T${t}`] = v[`an_T${t}`] || ''; }); const o = { entidad_id: ent.id, tipo: 'indicadores', anio, periodo: 'A', datos }; reg ? await S.update(TB, reg.id, o) : await S.insert(TB, o); toast('Datos de indicadores guardados'); A.recargar(); } }] });
      },
    });
  };

  // ================================================================== 7. ALERTAS E INFORMES DE SEGURIDAD (enlace a la carpeta 5. ALERTAS SANITARIAS)
  const vAlertas = async (box, ctx) => {
    const { ent } = ctx;
    box.innerHTML = `<section class="panel"><header><div><h2>Alertas sanitarias e informes de seguridad</h2><span class="muted" style="font-size:.85rem">Consulta mensual de alertas, retiros de producto (recall) e informes de seguridad del INVIMA y agencias internacionales (RISARH). Esta información está enlazada con la carpeta “ALERTAS SANITARIAS” de la entidad y con el anexo de las actas de comité.</span></div>
      <div class="actions"><a class="btn" href="https://app.invima.gov.co/alertas/" target="_blank" rel="noopener">Consultar alertas INVIMA</a><button class="btn pri" data-act="tvIrAlertas">${I.carpeta || ''} Abrir carpeta de alertas e informes</button></div></header></section><div data-al></div>`;
    A.acts({ tvIrAlertas: () => A.go('carpeta', { ent: ent.id, k: 'alertas' }) });
    await A.G.alertas(box.querySelector('[data-al]'), ctx);
  };
})();
