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
    const ses = rr.filter((r) => r.tipo === 'sesion' && r.anio === anioAct), ej = ses.filter((s) => s.datos?.estado === 'Ejecutada').length;
    const trimOk = rr.filter((r) => r.tipo === 'trimestral' && r.anio === anioAct && r.datos?.fecha_envio).length;
    const tActual = trimDe(UI.hoy()), trimDebidos = tActual - 1;
    const item = (ok, t, det) => `<li style="display:flex;gap:10px;align-items:flex-start;padding:6px 0;border-bottom:1px solid var(--line)">${pill(ok ? 'Cumple' : 'Pendiente', ok ? 'ok' : 'warn')}<div><b>${h(t)}</b><div class="muted" style="font-size:.85rem">${h(det)}</div></div></li>`;
    box.innerHTML = `<section class="panel"><header><div><h2>Documento del programa · ${h(fmt.codigo)} v${h(fmt.version)}</h2><span class="muted" style="font-size:.85rem">Programa institucional adaptado a ${h(ent.razon_social)}, basado en el documento de referencia de IBCOL. ${cfg.texto ? 'Esta entidad tiene un texto personalizado.' : plantilla ? 'Usa el texto de referencia.' : 'Aún no hay texto de referencia cargado.'}</span></div>
        <div class="actions">${esProp() ? `<button class="btn" data-act="tvDatos">${I.edit} Datos del programa</button><button class="btn" data-act="tvTexto">${I.edit} Personalizar texto</button>${!cfg.texto ? '' : `<button class="btn" data-act="tvTextoRef">Volver al de referencia</button>`}<button class="btn" data-act="tvPlantilla">Plantilla de referencia</button>` : ''}<button class="btn pri" data-act="tvGenerar" ${textoDe(ent) ? '' : 'disabled'}>${I.pdf} ${esProp() ? 'Generar documento (PDF)' : 'Ver documento (PDF)'}</button></div></header>
      <div class="fields" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
        ${[['Referente del programa', [cfg.referente, cfg.cargo].filter(Boolean).join(' · ')], ['Delegado', [cfg.delegado, cfg.cargo_delegado].filter(Boolean).join(' · ')], ['Código inscripción Red Nacional (RNT)', cfg.codigo_rnt], ['Usuario aplicativo INVIMA', cfg.usuario_invima], ['Correo de notificaciones', cfg.correo], ['Fecha del documento', cfg.fecha ? UI.fecha(cfg.fecha) : UI.fecha(fmt.fecha)]].map(([l, v]) => `<div><span class="muted" style="font-size:.8rem">${h(l)}</span><div><b>${v ? h(v) : '<span class="muted">Sin registrar</span>'}</b></div></div>`).join('')}
      </div></section>
      <section class="panel"><header><h2>Estado del programa ${anioAct}</h2></header><ul style="list-style:none;margin:0;padding:0">
        ${item(!!cfg.fecha_generado, 'Documento del programa institucional', cfg.fecha_generado ? `Generado el ${UI.fecha(cfg.fecha_generado)}` : 'Genere el documento y guárdelo en "1. PROGRAMA DE TECNOVIGILANCIA".')}
        ${item(!!cfg.referente, 'Referente y delegado designados', cfg.referente ? `${cfg.referente}${cfg.delegado ? ' · delegado ' + cfg.delegado : ''}` : 'Registre el referente inscrito ante el INVIMA en "Datos del programa".')}
        ${item(!!cfg.codigo_rnt, 'Inscripción en la Red Nacional de Tecnovigilancia', cfg.codigo_rnt ? `Código ${cfg.codigo_rnt}` : 'Registre el código de inscripción (tecnoyreactivo@invima.gov.co).')}
        ${item(trimDebidos <= 0 || trimOk >= trimDebidos, 'Reportes trimestrales al INVIMA', `${trimOk} de ${Math.max(0, trimDebidos)} trimestres cerrados con reporte (incluye reportes en cero).`)}
        ${item(actas.some((a) => String(a.fecha || '').startsWith(String(anioAct))), 'Comité de tecnovigilancia', `${actas.filter((a) => String(a.fecha || '').startsWith(String(anioAct))).length} acta(s) en ${anioAct}.`)}
        ${item(ses.length && ej >= ses.filter((s) => s.fecha && s.fecha <= UI.hoy()).length, 'Plan de capacitación semestral', ses.length ? `${ej} de ${ses.length} sesiones ejecutadas.` : 'Cree el plan en la pestaña Capacitaciones.')}
        ${item(!evs.filter((e) => TV.esSerio(e) && e.estado === 'Abierto').length, 'Eventos serios notificados', `${evs.filter((e) => TV.esSerio(e)).length} serio(s) registrados; ${evs.filter((e) => TV.esSerio(e) && e.estado === 'Abierto').length} abierto(s).`)}
      </ul></section>`;
    A.acts({
      tvDatos: () => formDatos(ent),
      tvTexto: () => formTexto(ent),
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
    const c = TV.cfg(ent), fmt = TV.fmtDe('programa_tv');
    const cambios = (c.cambios || []).map((x) => [x.version, x.fecha, x.desc, x.resp].join(' | ')).join('\n');
    modal({ titulo: 'Datos del programa de tecnovigilancia', size: 'wide', cuerpo: `<form class="form" onsubmit="return false">
      <fieldset><legend>Responsables (Resolución 4816 de 2008)</legend><div class="fields">${f.input('referente', 'Referente del programa (inscrito ante el INVIMA)', c.referente)}${f.input('cargo', 'Cargo del referente', c.cargo)}${f.input('delegado', 'Delegado del referente', c.delegado)}${f.input('cargo_delegado', 'Cargo del delegado', c.cargo_delegado)}</div></fieldset>
      <fieldset><legend>Inscripción y aplicativo web del INVIMA</legend><div class="fields">${f.input('codigo_rnt', 'Código de inscripción a la Red Nacional de Tecnovigilancia', c.codigo_rnt)}${f.input('usuario_invima', 'Usuario del aplicativo web', c.usuario_invima)}${f.input('correo', 'Correo de notificaciones', c.correo, { type: 'email' })}
        ${f.input('departamento', 'Departamento (RETEIM A2)', c.departamento)}${f.sel('nivel', 'Nivel de complejidad (RETEIM A5)', ['1', '2', '3'], c.nivel || '1')}${f.sel('naturaleza', 'Naturaleza (RETEIM A6)', ['Privada', 'Pública', 'Mixta'], c.naturaleza || 'Privada')}
        <p class="muted full" style="font-size:.82rem">Por seguridad, la contraseña del aplicativo web del INVIMA no se guarda en el gestor ni se imprime en el documento.</p></div></fieldset>
      <fieldset><legend>Control documental</legend><div class="fields">${f.input('codigo', 'Código del documento', c.codigo || fmt.codigo)}${f.input('version', 'Versión', c.version || fmt.version)}${f.input('fecha', 'Fecha de aprobación', c.fecha || fmt.fecha, { type: 'date' })}${f.input('meta_eventos', 'Meta índice de eventos (trimestral)', c.meta_eventos || '3%')}
        ${f.input('elaboro', 'Elaboró (nombre | cargo)', c.elaboro || `${st.emp.responsable || ''}|${st.emp.cargo || 'Ingeniera Biomédica'}`)}${f.input('reviso', 'Revisó (nombre | cargo)', c.reviso)}${f.input('aprobo', 'Aprobó (nombre | cargo)', c.aprobo)}
        ${f.area('cambios', 'Control de cambios (una línea por versión: versión | fecha AAAA-MM-DD | descripción | responsable)', cambios, { rows: 3 })}</div></fieldset></form>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
        const v = leer(m.body);
        v.cambios = String(v.cambios || '').split('\n').map((l) => l.split('|').map((x) => x.trim())).filter((x) => x[0]).map(([version, fecha, desc, resp]) => ({ version, fecha, desc, resp }));
        await guardarCfg(ent, v); toast('Datos del programa guardados'); A.recargar();
      } }] });
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
  TV.formEvento = async (ent, ev = null, { serio = null } = {}) => {
    const [eqs, cons] = await Promise.all([S.list('equipos', { entidad_id: ent.id }), S.list('consultorios', { entidad_id: ent.id })]);
    const cfg = TV.cfg(ent), d = ev?.datos || {}, sedes = A.sedesDe(cons, ent);
    const x = (k) => `d_${k}`, D = (k, def = '') => d[k] ?? def;
    const sn = (k, l, v) => f.sel(x(k), l, [['', '—'], 'SI', 'NO'], v);
    const clasDef = ev?.clasificacion || (serio === true ? 'Evento adverso serio' : serio === false ? 'Evento adverso no serio' : '');
    const fLocal = (iso) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16));
    modal({ titulo: ev ? `Reporte ${d.codigo || ''} · FT-PGTV-016` : 'Reporte voluntario de evento / incidente adverso (FT-PGTV-016)', size: 'wide', cuerpo: `<form class="form" onsubmit="return false">
      <fieldset><legend>Clasificación</legend><div class="fields">${f.sel('clasificacion', 'Clasificación (Res. 4816 de 2008, art. 5) *', [['', '— Seleccione —'], ...TV.CLASIF], clasDef)}${f.input(x('codigo'), 'Código interno del reporte', D('codigo'))}
        <p class="muted full" style="font-size:.82rem;margin:0">Serio: muerte o deterioro serio de la salud (o pudo causarlo, si es incidente) → reporte al INVIMA dentro de 72 horas. No serio → consolidado trimestral RETEIM-002.</p></div></fieldset>
      <fieldset><legend>A. Lugar de ocurrencia</legend><div class="fields">${f.input(x('institucion'), 'Nombre de la institución', D('institucion', ent.razon_social))}${f.sel(x('sede'), 'Sede', sedes, D('sede', sedes[0]))}${f.input(x('nit'), 'NIT', D('nit', ent.nit))}${f.input(x('departamento'), 'Departamento', D('departamento', cfg.departamento || ''))}${f.input(x('ciudad'), 'Ciudad', D('ciudad', ent.ciudad))}</div></fieldset>
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
    const estado = (a, t) => { const r = regT(a, t), n = delTrim(a, t).length; if (r?.datos?.fecha_envio) return pill(n ? `Reportado ${UI.fecha(r.datos.fecha_envio)}` : `En cero reportado ${UI.fecha(r.datos.fecha_envio)}`, 'ok'); if (a * 10 + t === hoyT) return pill('En curso', ''); if (a * 10 + t > hoyT) return pill('Por venir', ''); return pill(n ? 'Pendiente de reporte' : 'Pendiente reporte en cero', 'bad'); };
    const lista = delTrim(sel.anio, sel.t), r = regT(sel.anio, sel.t);
    box.innerHTML = `<section class="panel"><header><div><h2>Reporte trimestral · eventos e incidentes adversos NO serios (RETEIM-002)</h2><span class="muted" style="font-size:.85rem">Cada trimestre se reportan al INVIMA los eventos e incidentes no serios en el consolidado RETEIM-002. Si no hubo casos, se envía el <b>reporte trimestral en cero</b>. Los soportes se guardan en “4. REPORTES TRIMESTRALES”.</span></div>
        <div class="actions"><select data-tv-anio aria-label="Año">${[anioAct, anioAct - 1, anioAct - 2].map((a) => `<option ${a === sel.anio ? 'selected' : ''}>${a}</option>`).join('')}</select></div></header>
      <div class="kpis">${[1, 2, 3, 4].map((t) => `<button type="button" class="kpi ${t === sel.t ? 'ok' : ''}" data-act="tvSelT" data-t="${t}" style="text-align:left;cursor:pointer;${t === sel.t ? 'outline:2px solid var(--accent)' : ''}"><span class="l">${TV.TRIM[t - 1]}</span><span class="v">${delTrim(sel.anio, t).length}</span><span class="meta">no serios · ${serTrim(sel.anio, t).length} serios</span><div style="margin-top:6px">${estado(sel.anio, t)}</div></button>`).join('')}</div></section>
      <section class="panel"><header><div><h2>${TV.TRIM[sel.t - 1]} ${sel.anio} <span class="muted" style="font-size:.85rem">(${TV.mesesTrim(sel.t)})</span></h2>${r?.datos?.fecha_envio ? `<span class="muted" style="font-size:.85rem">Reportado al INVIMA el ${UI.fecha(r.datos.fecha_envio)}${r.datos.radicado ? ' · radicado ' + h(r.datos.radicado) : ''}</span>` : ''}</div>
        <div class="actions"><button class="btn" data-act="tvTrimPDF">${I.pdf} ${lista.length ? 'Consolidado (PDF)' : 'Reporte en cero (PDF)'}</button>${esProp() ? `${lista.length ? `<button class="btn" data-act="tvReteim">${I.bajar} Plantilla RETEIM-002 (Excel)</button>` : ''}<button class="btn" data-act="tvEnvio">${I.cal} Registrar reporte al INVIMA</button><button class="btn pri" data-act="tvNuevoNoSerio">${I.mas} Evento / incidente no serio</button>` : ''}</div></header>
        ${tablaEventos(lista, eqs, { trimestral: true }) || `<div class="empty">Sin eventos ni incidentes adversos no serios en este trimestre.${esProp() ? ' Si el trimestre terminó sin casos, genere el reporte en cero y regístrelo como enviado.' : ''}</div>`}</section>`;
    box.querySelector('[data-tv-anio]').onchange = (e) => { st.tvTrim[ent.id] = { ...sel, anio: +e.target.value }; A.recargar(); };
    A.acts({
      ...accionesEventos(ent, evs, eqs, 3),
      tvSelT: (d) => { st.tvTrim[ent.id] = { ...sel, t: +d.t }; A.recargar(); },
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
    const ses = regs.filter((r) => r.tipo === 'sesion' && r.anio === anio).sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    const tests = regs.filter((r) => r.tipo === 'test');
    const tDe = (s, fase) => tests.filter((t) => t.datos.sesion_id === s.id && t.datos.fase === fase);
    ses.forEach((s) => { const a = prom(tDe(s, 'pre')), b = prom(tDe(s, 'post')); s._pre = a === null ? '' : a + '%'; s._post = b === null ? '' : b + '%'; });
    const ej = ses.filter((s) => s.datos?.estado === 'Ejecutada').length;
    const fila = (s) => { const d = s.datos || {}, nA = (d.asistentes || []).filter((x) => x.nombre).length; return `<tr><td class="num">${UI.fecha(s.fecha)}</td><td><b>${h(d.tema || '')}</b><div class="muted" style="font-size:.8rem">${h(d.dirigido || '')}${d.capacitador ? ' · ' + h(d.capacitador) : ''}</div></td>
      <td>${pill(d.estado || 'Programada', d.estado === 'Ejecutada' ? 'ok' : d.estado === 'Cancelada' ? 'bad' : s.fecha < UI.hoy() ? 'warn' : '')}</td><td class="num">${nA}</td><td class="num">${h(s._pre)}</td><td class="num">${h(s._post)}</td>
      <td><div class="row-actions" style="flex-wrap:wrap"><button class="btn sm" data-act="tvPres" data-id="${s.id}" title="Presentación de la capacitación">${I.pdf} Presentación</button>${esProp() ? `<button class="btn sm" data-act="tvAplicar" data-id="${s.id}" title="Aplicar pre o post test en pantalla">Aplicar test</button>` : ''}<button class="btn sm" data-act="tvRes" data-id="${s.id}">Resultados</button><button class="btn sm" data-act="tvAsis" data-id="${s.id}">${I.pdf} Asistencia</button>
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
      tvPresGen: async () => { const evs = (await S.list('eventos', { entidad_id: ent.id }, '-fecha_evento')).slice(0, 4); verDoc(ent, TV.pdfPresentacion(ent, { casosEnt: evs }), 'Presentación · Programa de tecnovigilancia', `Presentacion_Tecnovigilancia_${slug(ent.razon_social)}.pdf`, 5); },
      tvPres: async (d) => { const s = S_(d.id); const evs = (await S.list('eventos', { entidad_id: ent.id }, '-fecha_evento')).slice(0, 4); verDoc(ent, TV.pdfPresentacion(ent, { ses: s, casosEnt: s.datos?.casos_ent === false ? [] : evs }), `Presentación · ${s.datos?.tema}`, `Presentacion_${slug(s.datos?.tema)}_${s.fecha}.pdf`, 5); },
      tvTestBlanco: () => modal({ titulo: 'Test en blanco', cuerpo: '<p>¿Qué desea generar?</p>', acciones: [{ t: 'Pre-test', fn: () => verDoc(ent, TV.pdfTest(ent, { ses: null, preguntas: preguntasDe(ent), fase: 'pre' }), 'Pre-test en blanco', 'Pre_test_en_blanco.pdf', 5) }, { t: 'Post-test', fn: () => verDoc(ent, TV.pdfTest(ent, { ses: null, preguntas: preguntasDe(ent), fase: 'post' }), 'Post-test en blanco', 'Post_test_en_blanco.pdf', 5) }, ...(esProp() ? [{ t: 'Clave de respuestas', cls: 'pri', fn: () => verDoc(ent, TV.pdfClave(ent, { ses: null, preguntas: preguntasDe(ent) }), 'Clave de respuestas', 'Clave_respuestas_test.pdf', null) }] : [])] }),
      tvAplicar: (d) => aplicarTest(ent, S_(d.id)),
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
  const resultados = (ent, s, ts) => {
    const preg = s.datos?.preguntas?.length ? s.datos.preguntas : preguntasDe(ent);
    const per = {}; ts.forEach((t) => { const k = t.datos.cedula || t.datos.nombre; per[k] = per[k] || { n: t.datos.nombre, c: t.datos.cedula }; per[k][t.datos.fase] = t; });
    const pr = prom(ts.filter((t) => t.datos.fase === 'pre')), po = prom(ts.filter((t) => t.datos.fase === 'post'));
    const m = modal({ titulo: `Resultados · ${s.datos?.tema || ''}`, size: 'wide', cuerpo: `<div class="kpis"><div class="kpi"><span class="l">Promedio pre-test</span><span class="v">${pr ?? '—'}${pr === null ? '' : '%'}</span></div><div class="kpi ${po === null ? '' : po >= 80 ? 'ok' : 'bad'}"><span class="l">Promedio post-test</span><span class="v">${po ?? '—'}${po === null ? '' : '%'}</span><span class="meta">Meta ≥ 80%</span></div><div class="kpi"><span class="l">Participantes</span><span class="v">${Object.keys(per).length}</span></div></div>
      ${Object.keys(per).length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Participante</th><th>Cédula</th><th class="r">Pre</th><th class="r">Post</th><th class="r">Mejora</th><th></th></tr></thead><tbody>${Object.values(per).map((x) => `<tr><td>${h(x.n)}</td><td class="mono">${h(x.c || '')}</td><td class="r num">${x.pre ? x.pre.datos.puntaje + '%' : '—'}</td><td class="r num">${x.post ? x.post.datos.puntaje + '%' : '—'}</td><td class="r num">${x.pre && x.post ? (x.post.datos.puntaje - x.pre.datos.puntaje >= 0 ? '+' : '') + (x.post.datos.puntaje - x.pre.datos.puntaje) + ' pts' : ''}</td>
        <td><div class="row-actions">${['pre', 'post'].filter((fz) => x[fz]).map((fz) => `<button class="btn sm" data-ver="${x[fz].id}">${I.pdf} ${fz === 'pre' ? 'Pre' : 'Post'}</button>${esProp() ? `<button class="icon-btn bad" data-del="${x[fz].id}" aria-label="Eliminar ${fz}">${I.del}</button>` : ''}`).join('')}</div></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Aún no hay test presentados.</div>'}`,
      alAbrir: (mm) => mm.body.addEventListener('click', async (e) => {
        const v = e.target.closest('[data-ver]'), dl = e.target.closest('[data-del]');
        if (v) { const t = ts.find((x) => x.id === v.dataset.ver); verDoc(ent, TV.pdfTest(ent, { ses: s, preguntas: preg, t: { ...t, fase: t.datos.fase } }), `${t.datos.fase === 'pre' ? 'Pre' : 'Post'}-test · ${t.datos.nombre}`, `${t.datos.fase === 'pre' ? 'Pre' : 'Post'}_test_${slug(t.datos.nombre)}.pdf`, 5); }
        if (dl && await confirmar('¿Eliminar este test?')) { await S.remove(TB, dl.dataset.del); m.cerrar(); A.recargar(); }
      }),
      acciones: [{ t: 'Cerrar' }] });
  };
  const txtBanco = (l) => l.map((q, i) => `${i + 1}. ${q.p}\n${q.o.map((o, j) => `${q.c.includes(j) ? '*' : ''}${'abcdefg'[j]}) ${o}`).join('\n')}`).join('\n\n');
  const leerBanco = (t) => { const out = []; let q = null; String(t).split('\n').forEach((raw) => { const l = raw.trim(); if (!l) return; const mo = l.match(/^(\*?)\s*([a-g])\)\s*(.+)$/i); if (mo && q) { if (mo[1]) q.c.push(q.o.length); q.o.push(mo[3].trim()); return; } const mp = l.match(/^\d+[.)]\s*(.+)$/); if (mp) { q = { p: mp[1].trim(), o: [], c: [] }; out.push(q); } }); return out.filter((x) => x.o.length >= 2 && x.c.length); };
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
    const ses = (regs || []).filter((r) => r.tipo === 'sesion' && r.anio === anio && r.datos?.estado !== 'Cancelada');
    const tests = (regs || []).filter((r) => r.tipo === 'test' && r.anio === anio && r.datos?.fase === 'post');
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
