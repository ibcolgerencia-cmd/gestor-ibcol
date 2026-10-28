// =====================================================================
//  Asistente de IA: redacta documentos con los datos reales de la entidad
//  y los guarda como PDF con el formato IBCOL en la carpeta que se elija.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, leer, f } = UI;

  const PLANTILLAS = {
    protocolos: [
      ['Programa de mantenimiento biomédico', 'Redacta el PROGRAMA DE MANTENIMIENTO DE EQUIPOS BIOMÉDICOS de la entidad: objetivo, alcance, responsables, definiciones, marco normativo, tipos de mantenimiento, frecuencias según la clasificación de riesgo del inventario, metodología, registros y formatos (hoja de vida FHVEB-001, cronograma FMB-002, reporte FMB-004), indicadores y anexos.'],
      ['Protocolo de limpieza y desinfección', 'Redacta el PROTOCOLO DE LIMPIEZA Y DESINFECCIÓN DE EQUIPOS BIOMÉDICOS: objetivo, alcance, responsables, elementos de protección, insumos y desinfectantes recomendados, procedimiento paso a paso por tipo de equipo del inventario (tabla), frecuencias y registro.'],
      ['Programa de aseguramiento metrológico', 'Redacta el PROGRAMA DE ASEGURAMIENTO METROLÓGICO: objetivo, alcance, equipos que requieren calibración o verificación (tabla con los equipos del inventario que tengan metrología), periodicidades, criterios de aceptación, laboratorios acreditados, trazabilidad de patrones y acciones ante equipos no conformes.'],
      ['Procedimiento de adquisición de nuevas tecnologías', 'Redacta el PROCEDIMIENTO DE ADQUISICIÓN DE NUEVAS TECNOLOGÍAS BIOMÉDICAS: necesidad, evaluación técnica, verificación de registro sanitario INVIMA, recepción técnica, acta de entrega, capacitación, inclusión en inventario, hoja de vida y cronogramas.'],
      ['Protocolo de seguridad y manejo de tecnología biomédica', 'Redacta el PROTOCOLO DE SEGURIDAD Y MANEJO DE TECNOLOGÍA BIOMÉDICA: uso seguro, verificación previa al uso, reporte de fallas, retiro de servicio, seguridad eléctrica, alarmas, almacenamiento y disposición final.'],
      ['Programa de tecnovigilancia', 'Redacta el PROGRAMA INSTITUCIONAL DE TECNOVIGILANCIA conforme a la Resolución 4816 de 2008: objetivo, responsable, definiciones (evento e incidente adverso serio y no serio), flujo de reporte, tiempos (inmediato 72 horas / periódico trimestral), consulta de alertas sanitarias y gestión del riesgo.'],
    ],
    capacitaciones: [
      ['Plan de capacitación anual', 'Redacta el PLAN DE CAPACITACIÓN (EDUCACIÓN CONTINUA) en uso seguro de equipos biomédicos para el año actual: objetivo, población, temas por equipo del inventario, metodología, cronograma mensual (tabla), evaluación con pre-test y pos-test e indicadores.'],
      ['Acta de capacitación con pre-test y pos-test', 'Redacta un ACTA DE CAPACITACIÓN sobre el tema que indico, con: datos de la actividad, objetivos, contenido, y una evaluación de 10 preguntas de selección múltiple para pre-test y pos-test con su hoja de respuestas. Deja una tabla de asistentes vacía (Nombre, Cargo, Firma).'],
    ],
    limpieza: [['Lista de chequeo de limpieza y desinfección', 'Elabora la LISTA DE CHEQUEO DE LIMPIEZA Y DESINFECCIÓN de los equipos biomédicos del inventario, agrupada por servicio, en tabla con columnas: Equipo, Código, Tipo de limpieza (rutinaria/terminal), Desinfectante, Frecuencia, Cumple (Sí/No), Responsable, Observaciones.']],
    glucometro: [
      ['Procedimiento de control de calidad del glucómetro', 'Redacta el PROCEDIMIENTO DE CONTROL DE CALIDAD DEL GLUCÓMETRO: objetivo, alcance, materiales (soluciones control nivel bajo/alto), frecuencia, paso a paso, criterios de aceptación según inserto del fabricante, acciones ante resultados fuera de rango y registro.'],
      ['Formato de registro de control de calidad', 'Elabora el FORMATO DE REGISTRO DE CONTROL DE CALIDAD DEL GLUCÓMETRO en tabla: Fecha, Equipo/serie, Lote tiras, Lote solución, Nivel, Rango esperado, Resultado, Cumple, Responsable.'],
    ],
    actas_revision: [['Acta de revisión de sede y equipos', 'Redacta un ACTA DE REVISIÓN DE SEDE Y EQUIPOS BIOMÉDICOS para la visita que describo: datos de la visita, servicios revisados, tabla de equipos revisados con su estado, hallazgos, recomendaciones, compromisos con responsable y fecha, y espacio de firmas.']],
    indicadores: [['Informe de análisis de indicadores', 'Redacta el INFORME DE GESTIÓN DE INDICADORES de tecnología biomédica con los resultados que te entrego: tabla de indicadores (fórmula, resultado, meta, cumplimiento), análisis de cada uno, causas de incumplimiento y plan de mejora.']],
    alertas: [['Análisis de alerta sanitaria', 'Analiza la siguiente alerta sanitaria y determina si aplica a los dispositivos del inventario (compara nombre, marca, modelo y registro sanitario). Entrega: resumen de la alerta, dispositivos del inventario relacionados (tabla), conclusión de aplicabilidad y acciones a seguir. TEXTO DE LA ALERTA: ']],
    tecnovigilancia: [
      ['Programa de tecnovigilancia', 'Redacta el PROGRAMA INSTITUCIONAL DE TECNOVIGILANCIA conforme a la Resolución 4816 de 2008, adaptado a la entidad.'],
      ['Análisis de evento adverso', 'Analiza el siguiente evento o incidente adverso con dispositivo médico: clasificación (serio/no serio), causas probables (equipo, usuario, entorno), acciones inmediatas, acciones correctivas y preventivas, y si debe reportarse al INVIMA y en qué plazo. EVENTO: '],
    ],
    equipo: [
      ['Hoja de vida del equipo (FHVEB-001)', 'Completa la HOJA DE VIDA de este equipo con la información de los documentos anexos (manual, ficha técnica, registro sanitario y hoja de vida anterior). Extrae solo datos que aparezcan en los documentos o en los datos del equipo; lo que no aparezca déjalo vacío para que IBCOL lo complete.', 'hv'],
      ['Recomendaciones del fabricante para la hoja de vida', 'Redacta las RECOMENDACIONES DEL FABRICANTE Y DE USO SEGURO para la sección 10 de la hoja de vida de este equipo (máximo 12 viñetas, sin títulos): verificación antes del uso, limpieza, almacenamiento, alimentación eléctrica y precauciones. Si no conoces el modelo exacto, usa recomendaciones generales del tipo de equipo.'],
      ['Guía rápida de operación', 'Redacta una GUÍA RÁPIDA DE OPERACIÓN de este equipo: encendido, verificación inicial, uso paso a paso, apagado, limpieza y qué hacer ante una falla.'],
      ['Protocolo de mantenimiento preventivo del equipo', 'Redacta el PROTOCOLO DE MANTENIMIENTO PREVENTIVO de este equipo: frecuencia, herramientas e insumos, pruebas cualitativas (tabla Pasa/No pasa), actividades de mantenimiento, verificación de variables y criterios para retirarlo del servicio.'],
      ['Concepto técnico de baja', 'Redacta un CONCEPTO TÉCNICO DE BAJA para este equipo con el motivo que indico: identificación, antecedentes, diagnóstico, justificación técnica y recomendación de disposición final.'],
    ],
    libre: [['Texto libre', '']],
  };

  // ------------------------------------------------------------ contexto real de la entidad
  async function contexto({ ent, eq, carpeta, inventario = true }) {
    const out = [];
    const e = st.emp;
    out.push(`EMPRESA QUE ELABORA: ${e.nombre} · Responsable: ${e.responsable} (${e.cargo}, Matrícula ${e.matricula}, Registro INVIMA ${e.invima}) · ${e.direccion}, ${e.ciudad} · Tel ${e.telefono} · ${e.email}`);
    if (ent) out.push(`ENTIDAD (cliente): ${ent.razon_social} · NIT ${ent.nit || '[NIT]'} · REPS ${ent.reps || '[REPS]'} · Representante: ${ent.representante || '[REPRESENTANTE]'} · ${[ent.direccion, ent.ciudad].filter(Boolean).join(', ')}`);
    out.push(`FECHA: ${UI.fecha(UI.hoy())}`);
    if (ent && inventario) {
      const [eqs, cons] = await Promise.all([S.list('equipos', { entidad_id: ent.id }), S.list('consultorios', { entidad_id: ent.id })]);
      const area = (id) => cons.find((c) => c.id === id)?.nombre || 'Sin servicio';
      const act = eqs.filter((x) => x.estado !== 'Dado de baja').slice(0, 200);
      out.push(`INVENTARIO (${act.length} equipos):\n| Servicio | Código | Equipo | Marca | Modelo | Serie | Riesgo | Registro sanitario | Estado | Mto | Metrología |\n` +
        act.map((x) => `| ${area(x.consultorio_id)} | ${x.codigo_inv} | ${x.nombre} | ${x.marca || ''} | ${x.modelo || ''} | ${x.serie || ''} | ${x.clase_riesgo || ''} | ${x.registro_sanitario || ''} | ${x.estado} | ${x.periodicidad_mto || ''} | ${x.periodicidad_metro || ''} |`).join('\n'));
      if (carpeta === 'indicadores') {
        const anio = new Date().getFullYear();
        const [cronos, mtos, evs, als] = await Promise.all([S.list('cronogramas', { entidad_id: ent.id }), S.list('mantenimientos', { entidad_id: ent.id }), S.list('eventos', { entidad_id: ent.id }), S.list('alertas', { entidad_id: ent.id })]);
        out.push('INDICADORES CALCULADOS:\n' + A.kpis({ equipos: eqs, cronos, mtos, eventos: evs, alertas: als, anio }).map((k) => `- ${k.nombre}: ${k.valor} (meta ${k.meta}; ${k.det}; fórmula: ${k.formula})`).join('\n'));
      }
    }
    if (eq) {
      const hv = eq.hv || {};
      out.push(`EQUIPO: ${eq.nombre} · Marca ${eq.marca || '[MARCA]'} · Modelo ${eq.modelo || '[MODELO]'} · Serie ${eq.serie || ''} · Código ${eq.codigo_inv} · Riesgo ${eq.clase_riesgo || ''} · Registro sanitario ${eq.registro_sanitario || ''} · Fabricante ${eq.fabricante || ''} · Función ${hv.funcion || ''} · Voltaje ${hv.voltaje || ''} V · Frecuencia ${hv.frecuencia || ''} Hz · Mantenimiento ${eq.periodicidad_mto || ''} · Metrología ${eq.periodicidad_metro || ''}`);
    }
    return out.join('\n\n');
  }

  // ------------------------------------------------------------ documentos del equipo como fuente
  const nrm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const CLAVES = /ESPECIFICACION|DATOS TECNICOS|CARACTERISTICAS|VOLTAJE|TENSION|POTENCIA|CORRIENTE|FRECUENCIA|DIMENSION|PESO|RANGO|TEMPERATURA|HUMEDAD|ALIMENTACION|BATERIA|FABRICANTE|TITULAR|REGISTRO SANITARIO|VIGENCIA|CLASIFICACION|RIESGO|ACCESORIO|LIMPIEZA|MANTENIMIENTO/g;
  async function textoDoc(d, max) {
    if (!/\.pdf$/i.test(d.nombre || d.archivo || '')) return `(${d.nombre}: no es PDF, no se pudo leer)`;
    try {
      const b = await S.fileBlob(d.archivo);
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await b.arrayBuffer()) }).promise;
      const pags = [];
      for (let p = 1; p <= Math.min(pdf.numPages, 40); p++) {
        const t = (await (await pdf.getPage(p)).getTextContent()).items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim();
        if (t) pags.push({ p, t, pts: (nrm(t).match(CLAVES) || []).length + (p <= 2 ? 3 : 0) });
      }
      if (!pags.length) return `(${d.nombre}: documento escaneado sin texto legible)`;
      // si no cabe completo, se toman las páginas con más datos técnicos
      let usar = pags;
      if (pags.reduce((a, x) => a + x.t.length, 0) > max) {
        usar = []; let tot = 0;
        for (const x of [...pags].sort((a, b) => b.pts - a.pts)) { if (tot + x.t.length > max && usar.length) continue; usar.push(x); tot += x.t.length; if (tot >= max) break; }
        usar.sort((a, b) => a.p - b.p);
      }
      return usar.map((x) => `[pág. ${x.p}] ${x.t}`).join('\n').slice(0, max);
    } catch (e) { return `(${d.nombre}: no se pudo abrir)`; }
  }
  A.textoDocIA = textoDoc;
  const GRUPOS = [
    ['manual', 'Manuales', (d) => d.carpeta === 'manual' && !/FICHA/.test(nrm(d.nombre))],
    ['ficha', 'Fichas técnicas', (d) => d.carpeta === 'manual' && /FICHA/.test(nrm(d.nombre))],
    ['rs', 'Registro sanitario', (d) => d.carpeta === 'registro_sanitario'],
    ['hv', 'Hoja de vida anterior', (d) => d.carpeta === 'hoja_vida'],
  ];

  // ------------------------------------------------------------ hoja de vida: campos que la IA puede llenar
  const LISTAS = { fuente: ['Electricidad', 'Batería', 'Aceite', 'Agua', 'Aire', 'Gas', 'Vapor', 'Oxígeno', 'Otro'], tecnologia: ['Eléctrico', 'Electrónico', 'Electromecánico', 'Mecánico', 'Hidráulico', 'Neumático', 'Acústico', 'Vapor', 'Solar'],
    clasif_biomedica: ['Diagnóstico', 'Prevención', 'Rehabilitación', 'Tratamiento y mantenimiento de la vida', 'Análisis de laboratorio y apoyo'], manuales: ['Operación', 'Mantenimiento', 'Guía rápida', 'Ficha técnica'], planos: ['Electrónico', 'Eléctrico', 'Mecánico', 'Neumático'] };
  const CAMPOS_HV = [
    ['fabricante', '3.3 Fabricante', 'eq'], ['registro_sanitario', '1.1 Registro sanitario', 'eq'], ['fecha_venc_rs', 'Vencimiento del registro (AAAA-MM-DD)', 'eq'], ['clase_riesgo', '6.4 Clasificación de riesgo (I, IIa, IIb, III)', 'eq'],
    ['ecri', '1.2 Código ECRI (del listado oficial)', 'hv', 'local'], ['tipo_registro', 'Tipo de registro (RS, PC, NA, NR)', 'hv'], ['funcion', '2.1 Función del equipo', 'hv'], ['movil', '2.9/2.10 Móvil o Fijo', 'hv'],
    ['voltaje', 'Voltaje (V)', 'hv'], ['corriente', 'Corriente (A)', 'hv'], ['potencia', 'Potencia (W)', 'hv'], ['frecuencia', 'Frecuencia (Hz)', 'hv'], ['presion', 'Presión (psi, mmHg)', 'hv'],
    ['rpm', 'Velocidad (RPM)', 'hv'], ['capacidad', 'Capacidad', 'hv'], ['presion_atm', 'Presión atm (Pa)', 'hv'], ['temperatura', 'Temperatura de operación (°C)', 'hv'], ['humedad', 'Humedad (%HR)', 'hv'],
    ['peso', 'Peso', 'hv'], ['dimensiones', 'Dimensiones', 'hv'], ['rangos', 'Rangos de medición / operación', 'hv'], ['otros_tec', 'Otros datos técnicos', 'hv'], ['vida_util', 'Vida útil', 'hv'],
    ['fuente', '6.1 Fuentes de alimentación', 'hv'], ['tecnologia', '6.2 Tecnología predominante', 'hv'], ['clasif_biomedica', '6.3 Clasificación biomédica', 'hv'], ['manuales', '6.5 Manuales', 'hv'], ['planos', '6.6 Planos', 'hv'],
    ['fab_ciudad', 'Fabricante: ciudad / país', 'hv'], ['fab_dir', 'Fabricante: dirección', 'hv'], ['fab_tel', 'Fabricante: teléfono', 'hv'], ['fab_correo', 'Fabricante: correo', 'hv'], ['fab_web', 'Fabricante: página web', 'hv'],
    ['prov_nombre', 'Proveedor / importador', 'hv'], ['prov_ciudad', 'Proveedor: ciudad / país', 'hv'], ['prov_dir', 'Proveedor: dirección', 'hv'], ['prov_tel', 'Proveedor: teléfono', 'hv'], ['prov_correo', 'Proveedor: correo', 'hv'], ['prov_web', 'Proveedor: página web', 'hv'],
    ['accesorios', '7. Accesorios', 'hv'], ['mediciones', '9.5 Recomendaciones para mediciones', 'hv'], ['recomendaciones', '10. Recomendaciones del fabricante', 'hv'],
  ];
  const instruccionHV = (extra) => `${extra}\n\nResponde SOLO con un objeto JSON (sin Markdown ni texto adicional) con estas claves; usa null cuando el dato no aparezca en los documentos ni en los datos del equipo. No inventes valores.\n` +
    CAMPOS_HV.filter((c) => c[3] !== 'local').map(([k, l]) => `- "${k}": ${l}${LISTAS[k] ? ` → arreglo con valores de: ${LISTAS[k].join(', ')}` : k === 'accesorios' ? ' → arreglo de objetos {"nombre","marca","modelo","serie","desc"}' : k === 'recomendaciones' ? ' → texto con máximo 12 viñetas "- "' : ''}`).join('\n') +
    `\nIndica también "fuentes": arreglo con el nombre del documento de donde salió cada dato importante.`;
  const vacio = (x) => x === undefined || x === null || x === '' || x === 'NR' || (Array.isArray(x) && !x.length);
  const mostrar = (x) => (Array.isArray(x) ? x.map((y) => (typeof y === 'object' ? [y.nombre, y.marca, y.modelo].filter(Boolean).join(' ') : y)).join(', ') : x ?? '');
  const normRiesgo = (x) => ({ I: 'I', IIA: 'IIa', IIB: 'IIb', III: 'III' }[nrm(x).replace(/CLASE|\s/g, '')] || null);

  // ------------------------------------------------------------ ventana del asistente
  A.asistenteIA = ({ ent = null, eq = null, carpeta = null } = {}) => {
    const grupo = eq ? 'equipo' : (PLANTILLAS[carpeta] ? carpeta : null);
    const opciones = [...(grupo ? PLANTILLAS[grupo] : Object.entries(PLANTILLAS).filter(([k]) => k !== 'equipo' && k !== 'libre').flatMap(([, v]) => v)), ...PLANTILLAS.libre];
    let historial = [], ultimo = '';
    const m = modal({
      titulo: `Asistente de IA${eq ? ' · ' + eq.nombre : ent ? ' · ' + ent.razon_social : ''}`, size: 'wide',
      cuerpo: `<div class="form ia">
        <div class="fields">
          ${f.sel('plantilla', 'Documento a redactar', opciones.map(([t], i) => [i, t]), 0, { full: true })}
          ${f.area('instruccion', 'Instrucciones (puede ajustarlas o agregar detalles)', opciones[0][1], { rows: 4 })}
          <div class="field full"><label class="checks"><input type="checkbox" name="inv" data-single checked> Usar los datos reales de la entidad y su inventario</label></div>
          ${eq ? '<fieldset class="field full" data-fuentes><legend>Fuentes del equipo: la IA lee estos documentos</legend><span class="muted">Buscando documentos del equipo…</span></fieldset>' : ''}
        </div>
        <div class="actions"><button type="button" class="btn pri" data-ia="redactar">${I.firma} Redactar</button><span class="muted" data-estado></span></div>
        <div class="field full" data-hvres hidden><span class="lbl">Datos encontrados para la hoja de vida: marque los que desea pasar</span><div class="tbl-wrap" style="max-height:380px"><table class="tbl"><thead><tr><th></th><th>Campo</th><th>Valor actual</th><th>Valor propuesto</th></tr></thead><tbody></tbody></table></div>
          <p class="muted" data-hvfuentes></p>
          <div class="actions"><button type="button" class="btn pri" data-ia="aplicarhv">Pasar a la hoja de vida</button><button type="button" class="btn" data-ia="verhv">${I.pdf} Ver hoja de vida</button></div></div>
        <div class="field full" data-res hidden><span class="lbl">Resultado (puede editarlo antes de guardarlo)</span><textarea name="resultado" rows="16" class="mono" style="font-size:.85rem"></textarea>
          <div class="actions">
            <input name="ajuste" placeholder="Pida un ajuste, ej: “más corto”, “agrega una tabla de responsables”" style="flex:1;min-width:200px;border:1px solid var(--line);border-radius:6px;padding:7px 10px;background:var(--surface)" aria-label="Ajuste">
            <button type="button" class="btn" data-ia="ajustar">Ajustar</button>
            <button type="button" class="btn" data-ia="pdf">${I.pdf} Ver PDF</button>
            <button type="button" class="btn pri" data-ia="guardar">${I.subir} Guardar en carpeta</button>
            ${eq ? `<button type="button" class="btn" data-ia="hv">Pasar a la hoja de vida</button>` : ''}
          </div></div>
        <p class="muted" style="font-size:.8rem">La IA puede cometer errores: revise el documento antes de entregarlo. No escriba datos de pacientes.</p>
      </div>`,
    });
    const body = m.body, $ = (s) => body.querySelector(s), estado = $('[data-estado]');
    let docsEq = [], propuesta = null;
    if (eq) (async () => {
      docsEq = (await S.list('documentos', { equipo_id: eq.id })).filter((d) => GRUPOS.some(([, , fn]) => fn(d)));
      const fs = $('[data-fuentes]'); if (!fs) return;
      fs.innerHTML = '<legend>Fuentes del equipo: la IA lee estos documentos</legend>' + (GRUPOS.map(([k, l, fn]) => {
        const l2 = docsEq.filter(fn); if (!l2.length) return '';
        return `<div style="margin:4px 0"><b style="font-size:.85rem">${h(l)}</b>${l2.map((d) => `<label class="checks" style="display:flex;gap:6px;align-items:center;font-size:.85rem"><input type="checkbox" data-doc="${d.id}" checked> ${h(d.nombre)}</label>`).join('')}</div>`;
      }).join('') || '<span class="muted">Este equipo aún no tiene manuales, fichas técnicas ni registro sanitario cargados. Súbalos en sus carpetas para que la IA los use.</span>');
    })();
    const modoHV = () => opciones[+$('[name=plantilla]').value][2] === 'hv';
    const textoFuentes = async (presupuesto) => {
      const sel = [...body.querySelectorAll('[data-doc]:checked')].map((x) => docsEq.find((d) => d.id === x.dataset.doc)).filter(Boolean);
      if (!sel.length) return '';
      const peso = (d) => (d.carpeta === 'registro_sanitario' ? 0.7 : /FICHA/.test(nrm(d.nombre)) ? 1 : d.carpeta === 'hoja_vida' ? 0.8 : 1.3);
      const tot = sel.reduce((a, d) => a + peso(d), 0); const out = [];
      for (const [i, d] of sel.entries()) {
        estado.textContent = `Leyendo ${d.nombre} (${i + 1} de ${sel.length})…`;
        out.push(`### DOCUMENTO: ${d.nombre} (${GRUPOS.find(([, , fn]) => fn(d))[1]})\n${await textoDoc(d, Math.max(1500, Math.floor(presupuesto * peso(d) / tot)))}`);
      }
      return 'DOCUMENTOS ANEXOS DEL EQUIPO:\n' + out.join('\n\n');
    };
    $('[name=plantilla]').onchange = (e) => { $('[name=instruccion]').value = opciones[+e.target.value][1]; };
    const pedir = async (instruccion, conHist) => {
      estado.textContent = 'Redactando… puede tardar hasta un minuto.';
      body.querySelectorAll('[data-ia]').forEach((b) => (b.disabled = true));
      try {
        let ctx = await contexto({ ent, eq, carpeta, inventario: $('[name=inv]').checked && !modoHV() });
        if (eq) { const fu = await textoFuentes(Math.max(6000, 56000 - ctx.length)); if (fu) ctx = (ctx + '\n\n' + fu).slice(0, 58000); }
        estado.textContent = 'Redactando… puede tardar hasta un minuto.';
        const consulta = () => Promise.race([S.ia({ instruccion: modoHV() && !conHist ? instruccionHV(instruccion) : instruccion, contexto: ctx, historial: conHist ? historial : [] }),
          new Promise((_, r) => setTimeout(() => r(new Error('La IA no respondió a tiempo')), 120000))]);
        let texto = null, err = null;
        for (let i = 0; i < 3 && texto === null; i++) {
          try { texto = await consulta(); } catch (e) { err = e; if (!/demand|overload|unavailable|503|504|546|429|tiempo|non-2xx/i.test(e.message)) break; estado.textContent = `La IA está ocupada, reintentando (${i + 1})…`; await new Promise((r) => setTimeout(r, 6000)); }
        }
        if (texto === null) throw new Error(/demand|overload|unavailable|503|429/i.test(err?.message || '') ? 'Google Gemini está saturado en este momento. Intente de nuevo en unos minutos.' : err?.message || 'La IA no respondió');
        if (modoHV()) {
          let j; try { j = JSON.parse((texto.match(/\{[\s\S]*\}/) || ['{}'])[0]); } catch { j = null; }
          if (!j) throw new Error('La IA no devolvió los datos en el formato esperado. Intente de nuevo.');
          if (!j.ecri) { try { const sg = await A.ECRI.sugerir(eq.nombre); if (sg[0]) j.ecri = A.ECRI.texto(sg[0]); } catch {} }
          propuesta = j; pintarHV(j);
          historial = [{ rol: 'usuario', texto: instruccion }, { rol: 'ia', texto }];
          estado.textContent = 'Listo. Revise los datos antes de pasarlos.'; return;
        }
        historial = [...(conHist ? historial : []), { rol: 'usuario', texto: instruccion }, { rol: 'ia', texto }].slice(-6);
        ultimo = texto; $('[data-res]').hidden = false; $('[name=resultado]').value = texto; estado.textContent = 'Listo.';
      } catch (e) { estado.textContent = ''; toast(e.message, true); }
      finally { body.querySelectorAll('[data-ia]').forEach((b) => (b.disabled = false)); }
    };
    const titulo = () => opciones[+$('[name=plantilla]').value][0].toUpperCase();
    const pintarHV = (j) => {
      const act = { ...(eq.hv || {}), ...eq };
      const filas = CAMPOS_HV.filter(([k]) => !vacio(j[k])).map(([k, l]) => {
        let v = j[k]; if (k === 'clase_riesgo') v = normRiesgo(v) || v;
        return `<tr><td><input type="checkbox" data-hvk="${k}" ${vacio(act[k]) ? 'checked' : ''}></td><td>${h(l)}</td><td class="muted">${h(String(mostrar(act[k]) || '—')).slice(0, 120)}</td><td>${h(String(mostrar(v))).replace(/\n/g, '<br>')}</td></tr>`;
      });
      $('[data-hvres] tbody').innerHTML = filas.join('') || '<tr><td colspan="4" class="empty">La IA no encontró datos en los documentos seleccionados.</td></tr>';
      $('[data-hvfuentes]').textContent = Array.isArray(j.fuentes) && j.fuentes.length ? `Fuentes usadas: ${j.fuentes.join(' · ')}` : '';
      $('[data-hvres]').hidden = false; $('[data-res]').hidden = true;
    };
    body.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-ia]'); if (!b) return;
      const a = b.dataset.ia;
      if (a === 'aplicarhv' && propuesta) {
        const act = await S.get('equipos', eq.id); const hv = { ...(act.hv || {}) }; const cols = {}; let n = 0;
        body.querySelectorAll('[data-hvk]:checked').forEach((c) => {
          const k = c.dataset.hvk, def = CAMPOS_HV.find((x) => x[0] === k); let v = propuesta[k];
          if (k === 'clase_riesgo') { v = normRiesgo(v); if (!v) return; }
          if (k === 'fecha_venc_rs' && !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return;
          if (LISTAS[k]) v = (Array.isArray(v) ? v : [v]).map((x) => LISTAS[k].find((o) => nrm(o) === nrm(x))).filter(Boolean);
          if (k === 'accesorios') v = (Array.isArray(v) ? v : []).filter((x) => x && x.nombre).slice(0, 8);
          if (k === 'movil') v = /FIJO/.test(nrm(v)) ? 'Fijo' : 'Móvil';
          if (def[2] === 'eq') cols[k] = v; else hv[k] = Array.isArray(v) || typeof v === 'object' ? v : String(v);
          n++;
        });
        if (!n) return toast('Marque al menos un dato', true);
        if (docsEq.some((d) => d.carpeta === 'registro_sanitario')) hv.anexos = { ...(hv.anexos || {}), reg_sanitario: 'Anexo' };
        if (cols.registro_sanitario && !hv.tipo_registro) hv.tipo_registro = 'RS';
        if (docsEq.some((d) => d.carpeta === 'manual')) hv.anexos = { ...(hv.anexos || {}), guia: (hv.anexos || {}).guia || 'Anexo' };
        const nuevo = await S.update('equipos', eq.id, { ...cols, hv }); Object.assign(eq, nuevo);
        toast(`${n} datos pasados a la hoja de vida`); A.recargar(); return;
      }
      if (a === 'verhv') { const e2 = await S.get('equipos', eq.id); const cons = (await S.list('consultorios', { entidad_id: e2.entidad_id })).find((c) => c.id === e2.consultorio_id); return UI.verPDF({ titulo: `Hoja de vida · ${e2.nombre}`, blob: await FMT.hojaVida({ eq: e2, ent, cons, fmt: st.fmt.hoja_vida }), nombre: `HV_${e2.codigo_inv}.pdf` }); }
      if (a === 'redactar') { const t = $('[name=instruccion]').value.trim(); if (!t) return toast('Escriba qué documento necesita', true); historial = []; return pedir(t, false); }
      if (a === 'ajustar') { const t = $('[name=ajuste]').value.trim(); if (!t) return toast('Escriba el ajuste', true); historial[historial.length - 1] = { rol: 'ia', texto: $('[name=resultado]').value }; $('[name=ajuste]').value = ''; return pedir(t, true); }
      const texto = $('[name=resultado]').value;
      if (a === 'pdf') { const doc = PDF.documento({ titulo: titulo(), texto, ent, emp: st.emp, fmt: { codigo: '', version: '01', fecha: UI.hoy() }, firma: st.firma }); return UI.verPDF({ titulo: titulo(), blob: doc.output('blob'), nombre: `${titulo()}.pdf` }); }
      if (a === 'hv' && eq) {
        const lim = texto.split('\n').map((l) => l.replace(/^#+\s*/, '').replace(/\*\*/g, '')).join('\n').trim();
        const act = await S.get('equipos', eq.id); await S.update('equipos', eq.id, { hv: { ...(act.hv || {}), recomendaciones: lim } });
        return toast('Recomendaciones guardadas en la hoja de vida (sección 10)');
      }
      if (a === 'guardar') return guardar(texto);
    });

    const guardar = async (texto) => {
      let entidades = ent ? [ent] : await S.list('entidades', {}, 'razon_social');
      if (!entidades.length) return toast('Primero cree una entidad', true);
      const cat = eq ? CAT.CARPETAS_EQUIPO : CAT.CARPETAS_ENTIDAD.filter((c) => !c.nav);
      const sug = eq ? 'manual' : (cat.some((c) => c.k === carpeta) ? carpeta : 'protocolos');
      const def = cat.find((c) => c.k === sug);
      modal({
        titulo: 'Guardar documento como PDF', size: 'sm',
        cuerpo: `<form class="form" onsubmit="return false"><div class="fields">
          ${f.input('titulo', 'Título del documento', titulo(), { full: true })}
          ${ent ? '' : f.sel('entidad', 'Entidad', entidades.map((x) => [x.id, x.razon_social]), entidades[0].id, { full: true })}
          ${f.sel('carpeta', 'Carpeta', cat.map((c) => [c.k, c.n]), sug, { full: true })}
          ${f.input('subcarpeta', 'Subcarpeta (opcional)', (def?.subs || [])[0] && sug === 'cronogramas' ? def.subs[0] : '', { full: true })}
          ${f.input('codigo', 'Código del documento (opcional)', '')}${f.input('version', 'Versión', '01')}
        </div></form>`,
        acciones: [{ t: 'Cancelar' }, { t: 'Guardar PDF', cls: 'pri', fn: async (mm) => {
          const v = leer(mm.body); const entidad = ent || entidades.find((x) => x.id === v.entidad);
          const doc = PDF.documento({ titulo: v.titulo || titulo(), texto, ent: entidad, emp: st.emp, fmt: { codigo: v.codigo, version: v.version, fecha: UI.hoy() }, firma: st.firma });
          const blob = doc.output('blob'); const nombre = `${v.titulo || titulo()}.pdf`;
          await A.guardarPDF({ blob, nombre, entidad_id: entidad.id, equipo_id: eq ? eq.id : null, carpeta: v.carpeta, subcarpeta: v.subcarpeta || null });
          toast(`Guardado en ${cat.find((c) => c.k === v.carpeta)?.n || v.carpeta}`);
          m.cerrar(); A.recargar();
        } }],
      });
    };
  };

  // ------------------------------------------------------------ vista del menú
  A.V.asistente = async () => {
    const ents = await S.list('entidades', {}, 'razon_social');
    A.content().innerHTML = `<div class="page-head"><div><span class="eyebrow">Inteligencia artificial</span><h1>Asistente de documentación</h1>
        <span class="muted">Redacta protocolos, programas, planes de capacitación, actas, análisis de alertas e informes con los datos reales de cada entidad, y los guarda como PDF con el formato IBCOL.</span></div></div>
      <section class="panel"><header><h2>¿Para qué entidad es el documento?</h2></header>
        ${ents.length ? `<div class="folders">${ents.map((e) => `<button class="folder" data-act="iaEnt" data-id="${e.id}"><span class="ic"></span><b>${h(e.razon_social)}</b><small>Abrir asistente</small></button>`).join('')}
          <button class="folder" data-act="iaEnt" data-id=""><span class="ic"></span><b>Documento general</b><small>Sin datos de una entidad</small></button></div>` : '<div class="empty">Primero cree una entidad.</div>'}
      </section>
      <section class="panel"><header><h2>También desde cada carpeta</h2></header>
        <p class="muted">En las carpetas 4 a 10 y en la carpeta de cada equipo aparece el botón “Redactar con IA” con plantillas propias de esa carpeta. Por ejemplo, en un equipo puede generar sus recomendaciones de uso y pasarlas directo a la hoja de vida.</p></section>`;
    A.acts({ iaEnt: (d) => A.asistenteIA({ ent: ents.find((e) => e.id === d.id) || null }) });
  };
})();
