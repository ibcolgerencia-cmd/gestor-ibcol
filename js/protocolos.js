// =====================================================================
//  4. PROTOCOLOS Y PROGRAMAS · documentos adaptables por entidad
//  Pestañas por documento (limpieza y desinfección, mantenimiento,
//  glucómetro, capacitación, adquisición, metrología, suficiencia,
//  seguridad y manejo de tecnología) y, dentro de cada uno, pestañas de
//  Contenido (secciones editables), Tablas de la entidad, Datos y firmas y
//  Control de cambios. El PDF se arma con el texto, los datos de la entidad
//  y bloques que se llenan con su inventario.
//  Texto por entidad → tv_registros (tipo 'prot_doc', periodo = documento).
//  Datos de las tablas y firmas → entidades.config.prot.
//  Plantilla de referencia → formatos ('prot_<documento>').
//  Solo el propietario modifica; la entidad consulta y descarga el PDF.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st, P = A.PROT;
  const { h, I, toast, modal, confirmar, leer, f } = UI;
  const esProp = A.esProp;
  const TB = 'tv_registros', TIPO = 'prot_doc';
  const AZ = [0, 150, 190], GR = [217, 217, 217], CL = [221, 243, 250], NG = [0, 0, 0];
  const nrm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const sn = (t) => String(t ?? '').replace(/−/g, '-').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/[✓✔✅]/g, '-').replace(/[​]/g, '');
  const fF = (s) => (s ? UI.fecha(String(s).slice(0, 10)) : '');
  const def = (k) => P.DOCS.find((d) => d.k === k);
  const clon = (o) => JSON.parse(JSON.stringify(o));

  // registrar los documentos en la lista de formatos (código, versión y fecha editables en Formatos)
  P.DOCS.forEach((d) => { if (!CAT.FORMATOS['prot_' + d.k]) CAT.FORMATOS['prot_' + d.k] = { titulo: d.titulo, codigo: d.codigo, version: d.version, fecha: d.fecha }; });

  // ------------------------------------------------------------------ datos
  P.cfg = (ent) => ent?.config?.prot || {};
  const guardarCfg = async (ent, o) => { const config = { ...(ent.config || {}), prot: { ...P.cfg(ent), ...o } }; await S.update('entidades', ent.id, { config }); ent.config = config; };
  // plantilla de referencia: la de Formatos si el propietario la cambió; si no, la del código
  P.ref = (k) => { const d = def(k), r = st.fmt?.['prot_' + k] || {}; return { ...d, titulo: r.titulo || d.titulo, codigo: r.codigo || d.codigo, version: r.version || d.version, fecha: r.fecha || d.fecha, secciones: Array.isArray(r.secciones) && r.secciones.length ? r.secciones : d.secciones }; };
  // documento efectivo de la entidad
  P.doc = (k, reg) => { const r = P.ref(k), x = reg?.datos || {}; return { ...r, ...Object.fromEntries(['titulo', 'codigo', 'version', 'fecha'].filter((c) => x[c]).map((c) => [c, x[c]])), secciones: Array.isArray(x.secciones) && x.secciones.length ? x.secciones : clon(r.secciones), cambios: x.cambios || [], propio: !!(x.secciones && x.secciones.length) }; };
  const regsDe = async (ent) => { try { return (await S.list(TB, { entidad_id: ent.id })).filter((r) => r.tipo === TIPO); } catch (er) { if (/tv_registros|schema cache|does not exist|relation/i.test(er.message)) return null; throw er; } };
  const guardarReg = async (ent, k, reg, datos) => {
    if (reg) { const r = await S.update(TB, reg.id, { datos: { ...(reg.datos || {}), ...datos } }); Object.assign(reg, r || { datos: { ...(reg.datos || {}), ...datos } }); return reg; }
    return S.insert(TB, { entidad_id: ent.id, tipo: TIPO, periodo: k, anio: new Date().getFullYear(), fecha: UI.hoy(), datos });
  };

  // contexto para los bloques: equipos activos, áreas, sedes
  P.contexto = async (ent) => {
    const [eqs, cons] = await Promise.all([S.list('equipos', { entidad_id: ent.id }), S.list('consultorios', { entidad_id: ent.id })]);
    const act = eqs.filter((e) => !/baja/i.test(e.estado || ''));
    const consM = Object.fromEntries(cons.map((c) => [c.id, c]));
    const sedes = A.sedesDe ? A.sedesDe(cons, ent) : [...new Set(cons.map((c) => c.sede || 'Sede principal'))];
    return { ent, eqs: act, cons, consM, sedes, cfg: P.cfg(ent) };
  };
  const nomEq = (e) => String(e.nombre || '').replace(/\s+/g, ' ').trim().toUpperCase();
  const tipos = (ctx) => { const g = {}; ctx.eqs.forEach((e) => { const n = nomEq(e); if (!n) return; (g[n] = g[n] || []).push(e); }); return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0], 'es')); };
  // equipos de una tabla (limpieza / metro): los del inventario + los agregados a mano; sin los quitados
  P.filasEq = (ctx, clave, conQuitados = false) => {
    const cfg = ctx.cfg, base = tipos(ctx), ya = new Set(base.map(([n]) => n));
    const extra = (cfg[clave + '_extra'] || []).map((n) => String(n).toUpperCase().trim()).filter((n) => n && !ya.has(n)).map((n) => [n, [], true]);
    const todas = [...base.map(([n, l]) => [n, l, false]), ...extra].sort((a, b) => a[0].localeCompare(b[0], 'es'));
    return conQuitados ? todas : todas.filter(([n]) => !(cfg[clave] || {})[n]?.quitar);
  };
  P.nomTabla = (ctx, clave, n) => String(ctx.cfg[clave]?.[n]?.nombre || '').trim() || n;
  const moda = (l) => { const c = {}; l.filter(Boolean).forEach((x) => { c[x] = (c[x] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || ''; };
  const kb = (lista, n) => lista.find(([re]) => re.test(n));
  P.limpiezaDe = (ctx, n) => { const o = ctx.cfg.limpieza?.[n] || {}, k = kb(P.KB_LIMPIEZA, n) || [null, ...P.KB_LIMPIEZA_DEF]; return { proc: o.proc || k[1], frec: o.frec || k[2], agente: o.agente || P.desinfPrincipal(ctx) }; };
  P.metroDe = (ctx, n, l) => { const o = ctx.cfg.metro?.[n] || {}, k = kb(P.KB_METRO, n); const per = moda(l.map((e) => e.periodicidad_metro).filter((p) => p && !/no aplica/i.test(p))); if (o.excluir || o.quitar) return null; if (!k && !per && !o.mag && !(ctx.cfg.metro_extra || []).includes(n)) return null; return { mag: o.mag || k?.[1] || '', tipo: o.tipo || k?.[2] || 'CAL', frec: o.frec || per || 'Anual' }; };
  P.desinfPrincipal = (ctx) => (ctx.cfg.desinfectantes || []).find((x) => x.nombre)?.nombre || 'detergente y desinfectante de dispositivos médicos con registro sanitario vigente';
  P.temasDe = (ctx) => {
    if (ctx.cfg.cap?.temas?.length) return ctx.cfg.cap.temas;
    const l = tipos(ctx).map(([n]) => ({ tema: `Uso seguro, limpieza y cuidados: ${n.toLowerCase()}`, dirigido: 'Personal asistencial que usa el equipo', resp: 'Ingeniería biomédica' }));
    l.push({ tema: 'Programa institucional de tecnovigilancia: reporte de eventos e incidentes adversos', dirigido: 'Todo el personal asistencial', resp: 'Referente de tecnovigilancia / ingeniería biomédica' });
    l.push({ tema: 'Protocolo de limpieza y desinfección de equipos biomédicos', dirigido: 'Personal asistencial y de servicios generales', resp: 'Ingeniería biomédica' });
    if (ctx.eqs.some((e) => /gluc[oó]metro/i.test(e.nombre || ''))) l.push({ tema: 'Control de calidad del glucómetro', dirigido: 'Personal que realiza glucometrías', resp: 'Ingeniería biomédica' });
    // meses por defecto: cada tema dos veces al año (semestral), repartidos
    return l.map((t, i) => ({ ...t, meses: t.meses || [(i % 6) + 1, (i % 6) + 7] }));
  };

  // marcadores {ENTIDAD}, {NIT}…
  P.valores = (ctx) => {
    const ent = ctx.ent, emp = st.emp || {};
    const serv = [...new Set(ctx.cons.map((c) => c.nombre).filter(Boolean))];
    return { ENTIDAD: ent.razon_social, NIT: ent.nit, CIUDAD: ent.ciudad, DIRECCION: ent.direccion, REPRESENTANTE: ent.representante, SEDES: ctx.sedes.join(', '), SERVICIOS: serv.slice(0, 40).join(', ') + (serv.length > 40 ? '…' : ''), N_EQUIPOS: String(ctx.eqs.length), DESINFECTANTE: P.desinfPrincipal(ctx),
      RESPONSABLE: emp.responsable, EMPRESA: emp.nombre || 'IBCOL Ingeniería Biomédica de Colombia', TELEFONO_IBCOL: [emp.telefono, emp.telefono2].filter(Boolean).join(' – '), CORREO_IBCOL: emp.email, ANIO: String(new Date().getFullYear()) };
  };
  P.reemplazar = (s, vals) => String(s || '').replace(/\{([A-Z_]+)\}/g, (m, k) => (vals[k] ? vals[k] : k in vals ? `[${k.replace(/_/g, ' ').toLowerCase()}]` : m));

  // ------------------------------------------------------------------ PDF
  const nuevo = (o = 'p') => new window.jspdf.jsPDF({ unit: 'mm', format: 'letter', orientation: o });
  const img = (doc, src, x, y, mw, mh) => { if (!src) return; try { const p = doc.getImageProperties(src); const r = Math.min(mw / p.width, mh / p.height); doc.addImage(src, /^data:image\/png/i.test(src) ? 'PNG' : 'JPEG', x + (mw - p.width * r) / 2, y + (mh - p.height * r) / 2, p.width * r, p.height * r); } catch (e) { /* imagen no válida */ } };

  P.pdf = (d, ctx) => {
    const ent = ctx.ent, cfg = ctx.cfg, vals = P.valores(ctx), rep = (s) => sn(P.reemplazar(s, vals));
    const fmt = { titulo: d.titulo, codigo: d.codigo, version: d.version, fecha: d.fecha };
    const doc = nuevo('p'), W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 22, ancho = W - 2 * M, TOP = 40, BOT = 30;
    // portada
    doc.setFillColor(...AZ); doc.rect(0, 0, W, 8, 'F'); doc.rect(0, H - 8, W, 8, 'F');
    if (ent.logo) img(doc, ent.logo, W / 2 - 35, 34, 70, 40);
    doc.setTextColor(...AZ); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(d.tipo || '', W / 2, 92, { align: 'center' });
    doc.setFontSize(20); doc.text(doc.splitTextToSize(sn(d.titulo).toUpperCase(), ancho), W / 2, 104, { align: 'center' });
    doc.setTextColor(...NG); doc.setFontSize(14); doc.text(doc.splitTextToSize(sn(ent.razon_social || '').toUpperCase(), ancho), W / 2, 140, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.text([`${d.codigo || ''} · Versión ${d.version || ''}`, 'GESTIÓN DE TECNOLOGÍA BIOMÉDICA', `${ent.ciudad || ''}${ent.ciudad ? ' · ' : ''}${new Date().getFullYear()}`], W / 2, 160, { align: 'center' });
    img(doc, window.IBCOL_LOGO, W / 2 - 22, H - 52, 44, 20); doc.setFontSize(8); doc.text(sn(`Elaborado con el acompañamiento de ${vals.EMPRESA}`), W / 2, H - 26, { align: 'center' });
    doc.addPage(); const pagTOC = doc.getNumberOfPages(); doc.addPage();
    let y = TOP; const toc = [];
    const salto = (n) => { if (y + n > H - BOT) { doc.addPage(); y = TOP; } };
    const escribir = (t, { fs = 9.8, b = false, ind = 0, vin = '', gapA = 1.8 } = {}) => {
      doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.setFontSize(fs); doc.setTextColor(...NG);
      const ls = doc.splitTextToSize(t, ancho - ind - (vin ? 5 : 0)), lh = fs * 0.43;
      ls.forEach((ln, i) => { salto(lh + 1); if (vin && !i) doc.text(vin, M + ind, y); if (b || !window.PDFJ) doc.text(ln, M + ind + (vin ? 5 : 0), y); else window.PDFJ(doc, ln, M + ind + (vin ? 5 : 0), y, ancho - ind - (vin ? 5 : 0), i === ls.length - 1); y += lh; });
      y += gapA;
    };
    const tabla = (head, body, o = {}) => {
      salto(18);
      doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M, top: TOP, bottom: BOT }, styles: { fontSize: 7.8, cellPadding: 1.1, lineColor: NG, lineWidth: 0.2, textColor: NG, valign: 'middle', halign: 'left' }, headStyles: { fillColor: CL, textColor: NG, fontStyle: 'bold', halign: 'center' }, head: head ? [head.map(sn)] : undefined, body: body.map((r) => r.map((c) => (typeof c === 'object' && c ? { ...c, content: sn(c.content) } : sn(c)))), ...o });
      y = doc.lastAutoTable.finalY + 5;
    };
    const nota = (t) => { doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(90); const ls = doc.splitTextToSize(sn(t), ancho); salto(ls.length * 3.6 + 2); doc.text(ls, M, y); y += ls.length * 3.6 + 3; doc.setTextColor(...NG); };
    const ficha = (filas) => tabla(null, filas, { columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42, fillColor: CL } } });

    const bloques = {
      INVENTARIO: () => {
        const g = {}; ctx.eqs.forEach((e) => { const c = ctx.consM[e.consultorio_id]; const k = `${c?.sede || 'Sede principal'}|${c?.nombre || e.ubicacion || 'Sin área asignada'}`; g[k] = (g[k] || 0) + 1; });
        const body = Object.entries(g).sort((a, b) => a[0].localeCompare(b[0], 'es')).map(([k, n]) => { const [s, a] = k.split('|'); return [s, a, { content: String(n), styles: { halign: 'center' } }]; });
        tabla(['Sede', 'Servicio / área', 'Equipos'], body.length ? body : [['—', 'Inventario FMB-001 pendiente de cargar en el gestor', '']], { columnStyles: { 2: { cellWidth: 22 } } });
        nota(`Total de equipos biomédicos activos: ${ctx.eqs.length}. El detalle está en el inventario FMB-001 del gestor biomédico.`);
      },
      EQUIPOS_RIESGO: () => {
        const body = tipos(ctx).map(([n, l]) => [n, moda(l.map((e) => e.clase_riesgo)) ? `Clase ${moda(l.map((e) => e.clase_riesgo))}` : 'Sin clasificar', { content: String(l.length), styles: { halign: 'center' } }]);
        tabla(['Equipo biomédico', 'Clasificación de riesgo', 'Cantidad'], body.length ? body : [['Sin equipos registrados', '', '']], { columnStyles: { 1: { cellWidth: 40, halign: 'center' }, 2: { cellWidth: 22 } } });
      },
      PERIODICIDAD: () => {
        const body = tipos(ctx).map(([n, l]) => { const r = moda(l.map((e) => e.clase_riesgo)); return [n, r ? `Clase ${r}` : '—', moda(l.map((e) => e.periodicidad_mto)) || 'Semestral', moda(l.map((e) => e.periodicidad_metro)) || 'No aplica', { content: String(l.length), styles: { halign: 'center' } }]; });
        tabla(['Equipo biomédico', 'Riesgo', 'Mantenimiento preventivo', 'Metrología', 'Cant.'], body.length ? body : [['Sin equipos registrados', '', '', '', '']], { columnStyles: { 1: { cellWidth: 22, halign: 'center' }, 2: { cellWidth: 36, halign: 'center' }, 3: { cellWidth: 30, halign: 'center' }, 4: { cellWidth: 13 } } });
      },
      CONDICIONES: () => {
        const l = (ent.config?.temp_puntos || []).filter((p) => p.activo !== false);
        const tn = { ambiente: 'Temperatura ambiente y humedad relativa', refrigeracion: 'Refrigeración', congelacion: 'Congelación' };
        const rg = (p) => { const r = { ambiente: [15, 25, 30, 70], refrigeracion: [2, 8], congelacion: [-25, -10] }[p.tipo] || [15, 25, 30, 70]; const t1 = p.tmin ?? r[0], t2 = p.tmax ?? r[1]; return `${t1} a ${t2} °C${p.tipo === 'ambiente' ? ` · ${p.hmin ?? r[2]} a ${p.hmax ?? r[3]} %HR` : ''}`; };
        if (!l.length) { nota('Las condiciones ambientales se registran en la carpeta 12. TEMPERATURA Y HUMEDAD cuando la entidad tiene áreas, neveras o congeladores que lo requieren.'); return; }
        tabla(['Punto de control', 'Sede', 'Formato', 'Rango aceptable'], l.map((p) => [p.nombre || '', p.sede || '', `${tn[p.tipo] || ''}${p.codigo ? ` (${p.codigo})` : ''}`, rg(p)]));
      },
      LIMPIEZA_EQUIPOS: () => {
        const body = P.filasEq(ctx, 'limpieza').map(([n]) => { const x = P.limpiezaDe(ctx, n); return [P.nomTabla(ctx, 'limpieza', n), x.proc, x.agente, x.frec]; });
        tabla(['Equipo', 'Procedimiento de limpieza y desinfección', 'Agente recomendado', 'Frecuencia'], body.length ? body : [['Sin equipos registrados', '', '', '']], { styles: { fontSize: 7.2, cellPadding: 1, lineColor: NG, lineWidth: 0.2, textColor: NG, valign: 'middle', halign: 'left' }, columnStyles: { 0: { cellWidth: 32, fontStyle: 'bold' }, 2: { cellWidth: 32 }, 3: { cellWidth: 28 } } });
        nota('Registrar cada limpieza y desinfección en el formato FMB-006 (Lista de chequeo limpieza y desinfección equipo biomédico).');
      },
      DESINFECTANTES: () => {
        const l = (cfg.desinfectantes || []).filter((x) => x.nombre);
        tabla(['Producto', 'Tipo / uso', 'Principio activo', 'Registro sanitario', 'Tiempo de contacto'], l.length ? l.map((x) => [x.nombre, x.uso || '', x.principio || '', x.rs || '', x.contacto || '']) : [['Detergente y desinfectante de dispositivos médicos y superficies', 'Limpieza y desinfección de bajo nivel', 'Según ficha técnica', 'Vigente (INVIMA)', 'Según ficha técnica']], { columnStyles: { 0: { fontStyle: 'bold' } } });
      },
      METROLOGIA_EQUIPOS: () => {
        const body = P.filasEq(ctx, 'metro').map(([n, l]) => { const m = P.metroDe(ctx, n, l); return m ? [P.nomTabla(ctx, 'metro', n), { content: l.length ? String(l.length) : '', styles: { halign: 'center' } }, m.mag, `${m.tipo} · ${P.TIPO_METRO[m.tipo] || ''}`, m.frec] : null; }).filter(Boolean);
        tabla(['Equipo', 'Cant.', 'Magnitudes a controlar', 'Actividad', 'Frecuencia'], body.length ? body : [['Sin equipos que requieran aseguramiento metrológico', '', '', '', '']], { columnStyles: { 1: { cellWidth: 12 }, 3: { cellWidth: 30 }, 4: { cellWidth: 22, halign: 'center' } } });
        nota('CAL: calibración en laboratorio acreditado · CLF: calificación (mapeo / desempeño) · VER: verificación con patrón o control.');
      },
      GLUCOMETROS: () => {
        const l = ctx.eqs.filter((e) => /gluc[oó]metro/i.test(e.nombre || ''));
        if (!l.length) { nota('Equipo: sistema de monitoreo de glucosa en sangre (glucómetro). Registre los glucómetros en el inventario para que aparezcan aquí.'); return; }
        tabla(['Código', 'Equipo', 'Marca', 'Modelo', 'Serie', 'Ubicación'], l.map((e) => [e.codigo_inv || '', e.nombre || '', e.marca || '', e.modelo || '', e.serie || '', [ctx.consM[e.consultorio_id]?.sede, ctx.consM[e.consultorio_id]?.nombre].filter(Boolean).join(' / ')]));
      },
      RANGOS_GLUCO: () => {
        const g = cfg.gluco || {};
        tabla(['Tipo de solución', 'Rango (mg/dL)', 'Rango (mmol/L)'], [['NORMAL', g.normal || 'Según el envase de las tiras', g.normal_mmol || ''], ['ALTA', g.alta || 'Según el envase de las tiras', g.alta_mmol || ''], ...(g.baja ? [['BAJA', g.baja, g.baja_mmol || '']] : [])], { columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } } });
        nota('El rango válido es el impreso en el envase del lote de tiras reactivas en uso; es el rango esperado de la solución de control, no un rango de glucosa del paciente.');
      },
      PASOS_GLUCO: () => {
        const q = cfg.gluco?.resp || 'Personal asistencial que realiza la glucometría', donde = cfg.gluco?.donde || 'Servicio donde se encuentra el glucómetro';
        tabla(['¿Qué se hace?', '¿Quién?', '¿Cómo?', '¿Cuándo?', '¿Dónde?'], [
          ['1. Insertar la tira reactiva', q, 'Con las barras de contacto hacia arriba en el puerto del medidor.', 'En los casos del numeral «Cuándo realizar la prueba».', donde],
          ['2. Verificar el encendido', q, 'Comprobar que se enciendan todos los segmentos de la pantalla.', 'Al insertar la tira.', 'Pantalla del medidor'],
          ['3. Modo solución de control', q, 'Marcar la prueba como solución de control según el manual.', 'Antes de aplicar la gota.', 'Panel del glucómetro'],
          ['4. Preparar la solución', q, 'Agitar el gotero y desechar la primera gota.', 'Antes de aplicar.', 'Gotero de solución'],
          ['5. Aplicar la gota', q, 'Aplicar la segunda gota en la punta de la tira.', 'Inmediatamente.', 'Tira reactiva'],
          ['6. Leer el resultado', q, 'Esperar el conteo y comparar con el rango del envase.', 'Al terminar el conteo.', 'Pantalla del medidor'],
          ['7. Registrar', q, 'Anotar el resultado en el formato FMB-007; si está fuera de rango, repetir y reportar.', 'Al terminar la prueba.', donde],
        ], { styles: { fontSize: 7.2, cellPadding: 1, lineColor: NG, lineWidth: 0.2, textColor: NG, halign: 'left' }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 32 } } });
      },
      TEMAS_CAPACITACION: () => { tabla(['#', 'Tema', 'Dirigido a', 'Responsable'], P.temasDe(ctx).map((t, i) => [{ content: String(i + 1), styles: { halign: 'center' } }, t.tema, t.dirigido || '', t.resp || '']), { columnStyles: { 0: { cellWidth: 8 } } }); },
      CRONOGRAMA_CAP: () => {
        const ms = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
        tabla(['Tema', 'Dirigido a', ...ms], P.temasDe(ctx).map((t) => [t.tema, t.dirigido || '', ...ms.map((_, i) => ({ content: (t.meses || []).includes(i + 1) ? 'X' : '', styles: { halign: 'center', fontStyle: 'bold', fillColor: (t.meses || []).includes(i + 1) ? CL : [255, 255, 255] } }))]),
          { styles: { fontSize: 6.8, cellPadding: 0.9, lineColor: NG, lineWidth: 0.2, textColor: NG, halign: 'left' }, columnStyles: { 0: { cellWidth: 58 }, 1: { cellWidth: 34 }, ...Object.fromEntries(ms.map((_, i) => [i + 2, { cellWidth: (ancho - 92) / 12 }])) } });
        nota(`Cronograma de capacitación continua FT-CCC-012 · vigencia ${new Date().getFullYear()}. Cada sesión se evalúa con pre y post test (FMB-008) y lista de asistencia.`);
      },
      INDICADORES_MTTO: () => {
        ficha([['Nombre', '% de cumplimiento del mantenimiento preventivo'], ['Objetivo', 'Medir la ejecución del cronograma de mantenimiento preventivo.'], ['Fórmula', '(N.° de mantenimientos preventivos realizados en el periodo / N.° de mantenimientos preventivos programados en el periodo) × 100'], ['Unidad', 'Porcentaje'], ['Meta', '>= 90 %'], ['Periodicidad', 'Semestral'], ['Fuente', 'Cronograma FMB-002 y reportes FMB-004'], ['Responsable', 'Ingeniería biomédica']]);
        ficha([['Nombre', '% de cumplimiento del mantenimiento correctivo'], ['Objetivo', 'Medir la atención de las solicitudes de mantenimiento correctivo.'], ['Fórmula', '(N.° de mantenimientos correctivos realizados / N.° de mantenimientos correctivos solicitados) × 100'], ['Unidad', 'Porcentaje'], ['Meta', '>= 90 %'], ['Periodicidad', 'Semestral'], ['Fuente', 'Reportes de daño y reportes FMB-005'], ['Responsable', 'Ingeniería biomédica']]);
        ficha([['Nombre', '% de equipos con calibración vigente'], ['Objetivo', 'Verificar la confiabilidad metrológica de los equipos de medición.'], ['Fórmula', '(N.° de equipos con certificado de calibración vigente / N.° de equipos que requieren calibración) × 100'], ['Unidad', 'Porcentaje'], ['Meta', '100 %'], ['Periodicidad', 'Anual'], ['Fuente', 'Cronograma FMB-003 y certificados'], ['Responsable', 'Ingeniería biomédica']]);
      },
      INDICADORES_CAP: () => {
        ficha([['Nombre', '% de cumplimiento del plan de capacitación'], ['Fórmula', '(N.° de capacitaciones realizadas / N.° de capacitaciones programadas) × 100'], ['Meta', '>= 80 %'], ['Periodicidad', 'Semestral'], ['Fuente', 'Cronograma FT-CCC-012 y listas de asistencia']]);
        ficha([['Nombre', 'Cobertura de las capacitaciones'], ['Fórmula', '(N.° de personas capacitadas / N.° de personas convocadas) × 100'], ['Meta', '>= 80 %'], ['Periodicidad', 'Semestral'], ['Fuente', 'Listas de asistencia']]);
        ficha([['Nombre', 'Efectividad de las capacitaciones'], ['Fórmula', '(N.° de personas con post test >= 80 % / N.° de personas evaluadas) × 100'], ['Meta', '>= 80 %'], ['Periodicidad', 'Semestral'], ['Fuente', 'Pre y post test FMB-008']]);
      },
      PASOS_ADQ: () => {
        tabla(['Actividad', 'Responsable', 'Descripción', 'Registro'], [
          ['1. Identificar la necesidad', 'Líder del servicio', 'Justificación de la necesidad (nuevo servicio, reposición, insuficiencia, normatividad).', 'Solicitud'],
          ['2. Requisición del equipo', 'Líder del servicio · ingeniería biomédica', 'Modalidad (compra, arriendo, comodato, leasing), especificaciones técnicas mínimas y clasificación de riesgo.', 'Requisición firmada'],
          ['3. Aprobación', 'Representante legal', 'Aprueba la necesidad y la disponibilidad presupuestal.', 'Aprobación'],
          ['4. Solicitud de cotizaciones', 'Compras / administración', 'Mínimo tres proveedores que cumplan los requisitos normativos y técnicos.', 'Cotizaciones'],
          ['5. Evaluación técnica y económica', 'Ingeniería biomédica', 'Cuadro comparativo: especificaciones, registro sanitario, garantía, soporte, repuestos, capacitación y costo total.', 'Concepto técnico'],
          ['6. Selección y compra', 'Representante legal · compras', 'Selección del proveedor y orden de compra o contrato.', 'Orden de compra'],
          ['7. Recepción e instalación', 'Ingeniería biomédica · servicio', 'Inspección inicial, pruebas, inventario, hoja de vida, cronogramas y capacitación.', 'Acta de entrega FT-AE-032'],
        ], { styles: { fontSize: 7.4, cellPadding: 1.1, lineColor: NG, lineWidth: 0.2, textColor: NG, halign: 'left' }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 38 }, 1: { cellWidth: 34 }, 3: { cellWidth: 28 } } });
      },
      MATRIZ_PRIORIDAD: () => {
        tabla(['Criterio', 'Peso', 'Calificación (1 bajo · 3 medio · 5 alto)'], [['Riesgo para el paciente si no se cuenta con el equipo', '30 %', ''], ['Exigencia normativa (estándar de dotación)', '25 %', ''], ['Demanda del servicio / insuficiencia', '20 %', ''], ['Estado u obsolescencia del equipo actual', '15 %', ''], ['Costo total de propiedad', '10 %', '']], { columnStyles: { 1: { cellWidth: 18, halign: 'center' }, 2: { cellWidth: 52 } } });
        nota('Índice de prioridad = suma de (peso × calificación). Se priorizan las adquisiciones con mayor índice.');
      },
      CRITERIOS_SUFICIENCIA: () => {
        tabla(['Condición', 'Resultado'], [['% de suficiencia <= 0', 'No hay suficiencia de equipos.'], ['0 < % de suficiencia < 10', 'Hay riesgo de insuficiencia si aumenta levemente el flujo de pacientes.'], ['% de suficiencia >= 10', 'Hay suficiencia óptima de tecnología en el servicio.'], ['Equipos requeridos <= 0', 'No se requieren equipos adicionales.'], ['0 < equipos requeridos < 1', 'Hay una leve insuficiencia tecnológica.'], ['Equipos requeridos >= 1', 'Se requiere adquirir al menos un equipo más.']], { columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' } } });
      },
      SUFICIENCIA: () => {
        const filas = P.suficiencia(ctx);
        if (!filas.length) { nota('Registre en la pestaña «Tablas de la entidad» los servicios, equipos, horarios, tiempos de uso y usuarios atendidos por mes para calcular la suficiencia.'); return; }
        tabla(['Sede / servicio', 'Equipo', 'N.°', 'Cap. por equipo (us/mes)', 'Cap. total', 'Usuarios/mes', '% suficiencia', 'Equipos req.', 'Resultado'], filas.map((r) => [[r.sede, r.servicio].filter(Boolean).join(' / '), r.equipo, r.n, r.cap, r.capT, r.usuarios, r.pct, r.req, r.res]),
          { styles: { fontSize: 6.8, cellPadding: 0.9, lineColor: NG, lineWidth: 0.2, textColor: NG, halign: 'center' }, columnStyles: { 0: { halign: 'left', cellWidth: 30 }, 1: { halign: 'left', cellWidth: 28 }, 8: { halign: 'left', cellWidth: 40 } } });
      },
      CICLO: () => {
        salto(104); const cx = W / 2, cy = y + 50, R = 42, RX = Math.min(ancho / 2 - 19, 68), et = ['PLANEACIÓN', 'SELECCIÓN', 'ADQUISICIÓN', 'INSTALACIÓN', 'USO', 'MANTENIMIENTO Y CALIBRACIÓN', 'SEGUIMIENTO', 'TRASLADOS', 'EVALUACIÓN', 'BAJA', 'DISPOSICIÓN FINAL', 'RENOVACIÓN'];
        doc.setDrawColor(...AZ); doc.setLineWidth(0.5); doc.ellipse(cx, cy, RX, R, 'S'); doc.setLineWidth(0.25);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...AZ); doc.text(['GESTIÓN DE LA', 'TECNOLOGÍA', 'BIOMÉDICA'], cx, cy - 3, { align: 'center' }); doc.setTextColor(...NG);
        et.forEach((t, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / et.length, x = cx + RX * Math.cos(a), yy = cy + R * Math.sin(a), bw = 34, bh = 9;
          doc.setFillColor(...CL); doc.setDrawColor(...AZ); doc.roundedRect(x - bw / 2, yy - bh / 2, bw, bh, 2, 2, 'FD'); doc.setFont('helvetica', 'bold'); doc.setFontSize(6.4); const ls = doc.splitTextToSize(t, bw - 2); doc.text(ls, x, yy - (ls.length - 1) * 1.2 + 0.8, { align: 'center' }); });
        y = cy + R + 12;
      },
      FLUJO_CORRECTIVO: () => {
        salto(120); const cx = W / 2, bw = 92, bh = 10;
        const caja = (t, yy, fill = CL, x = cx, w = bw) => { doc.setFillColor(...fill); doc.setDrawColor(...AZ); doc.roundedRect(x - w / 2, yy, w, bh, 2, 2, 'FD'); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.4); doc.setTextColor(...NG); const ls = doc.splitTextToSize(sn(t), w - 4); doc.text(ls, x, yy + bh / 2 - (ls.length - 1) * 1.4 + 1, { align: 'center' }); };
        const fl = (x1, y1, x2, y2) => { doc.setDrawColor(...AZ); doc.setLineWidth(0.4); doc.line(x1, y1, x2, y2); const a = Math.atan2(y2 - y1, x2 - x1); doc.setFillColor(...AZ); doc.triangle(x2, y2, x2 - 2 * Math.cos(a - 0.45), y2 - 2 * Math.sin(a - 0.45), x2 - 2 * Math.cos(a + 0.45), y2 - 2 * Math.sin(a + 0.45), 'F'); doc.setLineWidth(0.25); };
        const pasos = [['El servicio reporta la falla (gestor biomédico, WhatsApp o teléfono)'], ['Recepción y registro de la solicitud por ingeniería biomédica'], ['¿El equipo es propio?', 'No: reportar al proveedor (comodato / alquiler) y hacer seguimiento'], ['Diagnóstico de la falla y retiro del servicio si no es seguro'], ['¿Es reparable técnica y económicamente?', 'No: evaluar la baja (acta FT-AB-033)'], ['Reparación, pruebas de funcionamiento y seguridad'], ['Entrega al servicio y registro en el reporte FMB-005 y la hoja de vida']];
        pasos.forEach(([t, no], i) => { caja(t, y, no ? [255, 242, 204] : CL); if (no) { const xr = cx + bw / 2 + 4, w2 = W - M - xr; fl(cx + bw / 2, y + bh / 2, xr, y + bh / 2); caja(no, y, [253, 226, 226], xr + w2 / 2, w2); doc.setFontSize(7); doc.text('NO', cx + bw / 2 + 1, y + bh / 2 - 1.6); }
          if (i < pasos.length - 1) { fl(cx, y + bh, cx, y + bh + 5); if (no) { doc.setFontSize(7); doc.text('SÍ', cx + 1.5, y + bh + 3.6); } } y += bh + 5; });
        y += 3;
      },
      CAMBIOS: () => {
        salto(62);
        const filas = d.cambios?.length ? d.cambios : [{ version: d.version, fecha: d.fecha, desc: 'Creación del documento', resp: `${st.emp?.responsable || ''} - ${st.emp?.cargo || 'Ingeniera Biomédica'}` }];
        tabla(['Versión', 'Fecha', 'Descripción de la modificación', 'Nombre y cargo del responsable'], filas.map((c) => [c.version || '', fF(c.fecha), c.desc || '', c.resp || '']), { styles: { fontSize: 8, cellPadding: 1.2, lineColor: NG, lineWidth: 0.2, textColor: NG, halign: 'center' } });
        y += 4; salto(40); const fz = cfg.firmas || {}, bw = (ancho - 8) / 3;
        [['ELABORÓ', st.emp?.responsable || '', st.emp?.cargo || 'Ingeniera Biomédica', st.firma], ['REVISÓ', fz.reviso || '', fz.cargo_reviso || '', fz.firma_reviso], ['APROBÓ', fz.aprobo || ent.representante || '', fz.cargo_aprobo || 'Representante legal', fz.firma_aprobo]].forEach(([t, nom, car, fi], i) => {
          const x = M + i * (bw + 4); doc.rect(x, y, bw, 30); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(t, x + bw / 2, y + 4.5, { align: 'center' }); if (fi) img(doc, fi, x + 4, y + 7, bw - 8, 11);
          doc.line(x + 4, y + 20, x + bw - 4, y + 20); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.text(doc.splitTextToSize(sn(nom), bw - 4)[0] || '', x + bw / 2, y + 23.5, { align: 'center' }); doc.text(doc.splitTextToSize(sn(car), bw - 4)[0] || '', x + bw / 2, y + 27, { align: 'center' }); });
        y += 34;
      },
    };

    let n1 = 0;
    for (const sec of d.secciones) {
      n1++; salto(22); if (y > TOP + 2) y += 3;
      doc.setFillColor(...CL); doc.rect(M, y - 4.6, ancho, 7, 'F'); toc.push([`${n1}. ${rep(sec.t)}`, doc.getNumberOfPages(), 1]);
      escribir(`${n1}. ${rep(sec.t).toUpperCase()}`, { fs: 11, b: true, gapA: 3 });
      let n2 = 0;
      for (const raw of String(sec.x || '').split('\n')) {
        const l = raw.trimEnd(), tok = l.trim(); if (!tok) { y += 1; continue; }
        const bq = tok.match(/^\[\[([A-Z_]+)\]\]$/);
        if (bq) { if (bloques[bq[1]]) bloques[bq[1]](); else nota(`[Bloque ${bq[1]} no disponible]`); continue; }
        if (l.startsWith('## ')) { n2++; salto(12); y += 1; const t = `${n1}.${n2}. ${rep(l.slice(3).trim())}`; toc.push([t, doc.getNumberOfPages(), 2]); escribir(t, { fs: 10, b: true, gapA: 1.5 }); continue; }
        if (l.startsWith('-- ')) { escribir(rep(l.slice(3)), { ind: 10, vin: '–', fs: 9.4 }); continue; }
        if (l.startsWith('- ')) { escribir(rep(l.slice(2)), { ind: 4, vin: '•', fs: 9.6 }); continue; }
        const m = tok.match(/^(\d{1,2}\.)\s+(.*)$/);
        if (m) escribir(rep(m[2]), { ind: 4, vin: m[1], fs: 9.6 }); else escribir(rep(tok));
      }
    }
    // tabla de contenido
    doc.setPage(pagTOC); y = TOP; doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...AZ); doc.text('CONTENIDO', W / 2, y, { align: 'center' }); doc.setTextColor(...NG); y += 9;
    toc.forEach(([t, p, lv]) => { if (y > H - BOT) return; doc.setFont('helvetica', lv === 1 ? 'bold' : 'normal'); doc.setFontSize(lv === 1 ? 9.5 : 8.6); const x0 = M + (lv === 1 ? 0 : 6); const tt = doc.splitTextToSize(t, ancho - 20)[0]; doc.text(tt, x0, y); const tw = doc.getTextWidth(tt); doc.setTextColor(150); let dots = ''; while (doc.getTextWidth(dots + '.') < ancho - (x0 - M) - tw - 10) dots += '.'; doc.text(dots, x0 + tw + 1, y); doc.setTextColor(...NG); doc.text(String(p), M + ancho, y, { align: 'right' }); y += lv === 1 ? 6 : 5; });
    // encabezado y pie
    const tot = doc.getNumberOfPages(), emp = st.emp || {};
    for (let i = 2; i <= tot; i++) {
      doc.setPage(i); A.TV.encabezado(doc, { fmt, ent, titulo: sn(fmt.titulo), pagina: `PÁGINA ${i} DE ${tot}` });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.6); doc.setTextColor(90);
      doc.text(sn(`${emp.nombre || 'IBCOL Ingeniería Biomédica de Colombia'} · ${emp.email || ''} · ${[emp.telefono, emp.telefono2].filter(Boolean).join(' – ')}`), W / 2, H - 12, { align: 'center' });
      doc.text('Documento controlado. Su copia impresa o descargada se considera no controlada.', W / 2, H - 9, { align: 'center' }); doc.setTextColor(...NG);
    }
    return doc;
  };

  // cálculo de suficiencia (metodología del documento PSFEB-018)
  P.suficiencia = (ctx) => (ctx.cfg.suf?.filas || []).filter((r) => r.equipo).map((r) => {
    const num = (v) => (v === '' || v == null || isNaN(+v) ? 0 : +v);
    const n = num(r.n) || ctx.eqs.filter((e) => nomEq(e) === String(r.equipo).toUpperCase().trim() && (!r.sede || (ctx.consM[e.consultorio_id]?.sede || 'Sede principal') === r.sede)).length;
    const disp = num(r.dias) * num(r.horas), tPac = (num(r.min) + num(r.reposo)) / 60, real = Math.max(0, disp - num(r.desinf));
    const cap = tPac > 0 ? Math.floor(real / tPac) : 0, capT = cap * n, us = num(r.usuarios);
    const pct = us > 0 ? ((capT - us) / us) * 100 : 0, req = cap > 0 ? (us - capT) / cap : 0;
    const res = us <= 0 ? 'Sin datos de usuarios' : req >= 1 ? `Se requiere(n) ${Math.ceil(req)} equipo(s) más` : req > 0 ? 'Leve insuficiencia tecnológica' : pct < 10 ? 'Riesgo de insuficiencia si aumenta el flujo' : 'Suficiencia óptima';
    return { ...r, n, cap, capT, usuarios: us || '—', pct: us > 0 ? `${pct.toFixed(1)} %` : '—', req: us > 0 ? req.toFixed(2) : '—', res };
  });

  // ------------------------------------------------------------------ importar texto (PDF / Word) y partir en secciones
  const leerZip = async (buf, nombre) => {
    const v = new DataView(buf), u8 = new Uint8Array(buf); let e = buf.byteLength - 22; while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('El archivo Word no es válido.');
    let p = v.getUint32(e + 16, true); const n = v.getUint16(e + 10, true), dec = new TextDecoder();
    for (let i = 0; i < n; i++) {
      const met = v.getUint16(p + 10, true), tam = v.getUint32(p + 20, true), ln = v.getUint16(p + 28, true), lx = v.getUint16(p + 30, true), lc = v.getUint16(p + 32, true), off = v.getUint32(p + 42, true), nom = dec.decode(u8.slice(p + 46, p + 46 + ln));
      if (nom === nombre) { const l2 = v.getUint16(off + 26, true), x2 = v.getUint16(off + 28, true), ini = off + 30 + l2 + x2, dat = u8.slice(ini, ini + tam); if (met === 0) return dec.decode(dat); return new Response(new Blob([dat]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text(); }
      p += 46 + ln + lx + lc;
    }
    throw new Error('No se encontró el contenido del documento Word.');
  };
  P.textoDocx = async (file) => {
    const xml = await leerZip(await file.arrayBuffer(), 'word/document.xml');
    const d = new DOMParser().parseFromString(xml, 'application/xml'), W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const out = [], body = d.getElementsByTagNameNS(W, 'body')[0];
    const txt = (n) => [...n.getElementsByTagNameNS(W, 't')].map((t) => t.textContent).join('');
    for (const n of body ? [...body.children] : []) {
      if (n.localName === 'p') { const t = txt(n).trim(); if (!t) { out.push(''); continue; } const sty = n.getElementsByTagNameNS(W, 'pStyle')[0]?.getAttribute('w:val') || ''; const lista = n.getElementsByTagNameNS(W, 'numPr').length; out.push(/^(heading|t[ií]tulo|ttulo)1$/i.test(sty) ? '#H1 ' + t : /^(heading|t[ií]tulo|ttulo)[2-4]$/i.test(sty) ? '#H2 ' + t : lista ? '- ' + t : t); }
      else if (n.localName === 'tbl') { for (const tr of n.getElementsByTagNameNS(W, 'tr')) { const c = [...tr.getElementsByTagNameNS(W, 'tc')].map((tc) => txt(tc).trim()).filter(Boolean); if (c.length) out.push(c.join(' | ')); } out.push(''); }
    }
    return out.join('\n');
  };
  P.textoPdf = async (file) => {
    if (!window.pdfjsLib) throw new Error('No se pudo cargar el lector de PDF.');
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; const pags = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const it = (await (await pdf.getPage(p)).getTextContent()).items.filter((i) => i.str.trim()); const ls = [];
      it.forEach((i) => { const yy = Math.round(i.transform[5] / 2.5); const l = ls.find((z) => Math.abs(z.y - yy) <= 1); if (l) l.p.push(i); else ls.push({ y: yy, p: [i] }); });
      pags.push(ls.sort((a, b) => b.y - a.y).map((l) => l.p.sort((a, b) => a.transform[4] - b.transform[4]).map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim()));
    }
    // quitar encabezados y pies que se repiten en las páginas
    const c = {}; pags.forEach((l) => new Set(l).forEach((x) => { c[x] = (c[x] || 0) + 1; }));
    const rep = new Set(Object.keys(c).filter((x) => c[x] >= Math.max(3, pags.length * 0.4)));
    return pags.map((l) => l.filter((x) => !rep.has(x) && !/^p[aá]gina:?\s*\d+\s*de\s*\d+$/i.test(x) && !/^\d{1,3}$/.test(x)).join('\n')).join('\n\n');
  };
  const TIT = new Set(['introduccion', 'objetivos', 'objetivo', 'objetivo general', 'objetivos especificos', 'alcance', 'responsable', 'responsables', 'autoridad y responsable', 'marco legal', 'marco normativo', 'politicas', 'documentos relacionados', 'definiciones', 'terminos y definiciones', 'desarrollo o procedimiento', 'desarrollo', 'procedimiento', 'bibliografia', 'anexos', 'control de cambios', 'control del cambio', 'justificacion', 'indicadores', 'recomendaciones generales', 'proposito', 'metodologia', 'conclusion', 'conclusiones', 'cronograma']);
  P.partir = (texto) => {
    const lineas = String(texto).replace(/\r/g, '').split('\n').map((l) => l.replace(/[​]/g, '').trim());
    const secs = []; let cur = null, par = '';
    const flush = () => { if (par.trim() && cur) cur.x.push(par.trim()); par = ''; };
    const esTit = (l) => { if (l.startsWith('#H1 ')) return 1; if (l.startsWith('#H2 ')) return 2; if (l.includes(' | ')) return 0; const s = l.replace(/^[-•●▪➢✓]\s+/, '').replace(/^\d+(\.\d+)*\.?\s*/, ''), n = nrm(s).replace(/[^a-z ]/g, '').trim(); if (!n || l.length > 90 || /\.{5,}/.test(l)) return 0; if (TIT.has(n)) return 1; const le = s.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, ''); if (le.length >= 5 && le === le.toUpperCase() && !/[,;]$/.test(l)) return /^\d+\.\d+/.test(l) ? 2 : 1; if (/^\d+\.\d+\.?\s+[A-ZÁÉÍÓÚÑ]/.test(l) && l.length < 80) return 2; return 0; };
    for (const l of lineas) {
      if (!l || /\.{6,}\s*\d*$/.test(l)) { flush(); continue; }
      const t = esTit(l), lim = l.replace(/^#H[12] /, '').replace(/^[-•●▪➢✓]\s+/, '').replace(/^\d+(\.\d+)*\.?\s*/, '').replace(/[:.]$/, '').trim();
      if (t === 1) { flush(); cur = { t: lim.toUpperCase(), x: [] }; secs.push(cur); continue; }
      if (!cur) continue; // portada / encabezados antes del primer título
      if (t === 2) { flush(); cur.x.push('## ' + lim.charAt(0).toUpperCase() + lim.slice(1).toLowerCase()); continue; }
      if (/^([-•●▪➢✓o]|\d+[.)])\s+/.test(l)) { flush(); par = /^\d+[.)]/.test(l) ? l.replace(/^(\d+)[.)]\s+/, '$1. ') : '- ' + l.replace(/^([-•●▪➢✓o])\s+/, ''); continue; }
      if (par && /[.:;]$/.test(par) && /^[A-ZÁÉÍÓÚÑ0-9¿]/.test(l)) flush();
      par = par ? par + ' ' + l : l;
    }
    flush();
    // unir títulos partidos en dos líneas (sección vacía seguida de otra en mayúsculas)
    const out = [];
    secs.forEach((s) => { const p = out[out.length - 1]; if (p && !p.x.length && s.t.length < 60 && p.t.length < 60 && !TIT.has(nrm(s.t))) { p.t = `${p.t} ${s.t}`; p.x = s.x; } else out.push(s); });
    // la portada (elaboró / aprobó, títulos del documento) queda antes del primer título conocido
    const i0 = out.findIndex((s) => TIT.has(nrm(s.t).replace(/[^a-z ]/g, '').trim()));
    const res = out.filter((s, i) => !(i0 > 0 && i < i0 && s.x.join(' ').length < 900));
    return res.filter((s) => s.x.length || TIT.has(nrm(s.t))).map((s) => ({ t: s.t, x: s.x.join('\n') }));
  };

  // ------------------------------------------------------------------ guardar en la carpeta
  const eqv = (x) => String(x).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/^\s*\d+\s*[.\-)]\s*/, '').replace(/\b(DE|DEL|LA|LAS|LOS|Y|EL|PARA)\b/g, '').replace(/[^A-Z]/g, '');
  P.subDestino = async (ent, sub) => {
    const k = eqv(sub), docs = (await S.list('documentos', { entidad_id: ent.id })).filter((d) => d.carpeta === 'protocolos');
    return [...new Set(docs.map((d) => (d.subcarpeta || '').split('/')[0]).filter(Boolean))].find((x) => { const e = eqv(x); return e === k || (Math.min(e.length, k.length) >= 8 && (e.includes(k) || k.includes(e))); }) || sub;
  };
  const verPDF = async (ent, d, ctx) => {
    const doc = P.pdf(d, ctx), nombre = `${d.codigo} ${d.titulo}`.replace(/[\\/:*?"<>|]/g, '-').slice(0, 120) + '.pdf';
    UI.verPDF({ titulo: `${d.codigo} · ${d.titulo}`, blob: doc.output('blob'), nombre,
      extras: esProp() ? [{ t: 'Guardar en la carpeta', fn: async () => { const sub = await P.subDestino(ent, d.sub); await A.guardarPDF({ blob: doc.output('blob'), nombre, entidad_id: ent.id, equipo_id: null, carpeta: 'protocolos', subcarpeta: sub }); toast(`Guardado en ${sub}`); return false; } }] : [] });
  };

  // ------------------------------------------------------------------ vista (carpeta 4. PROTOCOLOS Y PROGRAMAS)
  A.G.protocolos = async (el, { ent }) => {
    const regs = await regsDe(ent); const ctx = await P.contexto(ent);
    st.protSel = st.protSel || {}; const sel = st.protSel[ent.id] = st.protSel[ent.id] || { k: P.DOCS[0].k, sub: 'contenido', sec: 0 };
    st.protDraft = st.protDraft || {};
    const regDe = (k) => (regs || []).find((r) => r.periodo === k) || null;
    el.innerHTML = `<section class="panel"><header><div><h2>Protocolos y programas de ${h(ent.razon_social)}</h2><span class="muted" style="font-size:.85rem">Documentos adaptados a la entidad: el texto se ajusta en cada pestaña y las tablas se llenan con su inventario (${ctx.eqs.length} equipos activos), sedes y datos propios.${esProp() ? ' Los cambios solo los puede hacer IBCOL.' : ''}</span></div></header>
      ${regs === null ? '<div class="empty">Falta activar la tabla de registros (supabase/tecnovigilancia.sql).</div>' : ''}
      <div class="tabs" role="tablist" data-prot-docs style="flex-wrap:wrap">${P.DOCS.map((d) => `<button type="button" role="tab" class="${d.k === sel.k ? 'on' : ''}" aria-selected="${d.k === sel.k}" data-prot-doc="${d.k}">${h(d.n)}${regDe(d.k)?.datos?.secciones?.length ? ' ●' : ''}</button>`).join('')}</div>
      <div data-prot-panel style="margin-top:14px"></div></section>`;
    const panel = el.querySelector('[data-prot-panel]');
    el.querySelectorAll('[data-prot-doc]').forEach((b) => { b.onclick = async () => { if (dirty() && !(await confirmar('Hay cambios sin guardar en este documento. ¿Cambiar de pestaña y descartarlos?', 'Descartar y cambiar'))) return; delete st.protDraft[`${ent.id}|${sel.k}`]; sel.k = b.dataset.protDoc; sel.sec = 0; el.querySelectorAll('[data-prot-doc]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); }); pintar(); }; });
    const clave = () => `${ent.id}|${sel.k}`;
    const dirty = () => !!st.protDraft[clave()]?.dirty;
    const borrador = () => { const k = clave(); if (!st.protDraft[k]) { const d = P.doc(sel.k, regDe(sel.k)); st.protDraft[k] = { secciones: clon(d.secciones), dirty: false }; } return st.protDraft[k]; };

    const esCapDoc = () => sel.k === 'capacitacion' || sel.k === 'plan_cap';
    const pintar = () => {
      const reg = regDe(sel.k), d = P.doc(sel.k, reg), dr = borrador(); d.secciones = dr.secciones;
      const subs = [['contenido', 'Contenido'], ...(def(sel.k).datos.length ? [['tablas', 'Tablas de la entidad']] : []), ...(esCapDoc() && P.capEquipos ? [['sesiones', 'Capacitaciones por equipo']] : []), ['datos', 'Datos y firmas'], ['cambios', 'Control de cambios']];
      if (!subs.some(([k]) => k === sel.sub)) sel.sub = 'contenido';
      panel.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start;justify-content:space-between">
          <div><h3 style="margin:0">${h(d.titulo)}</h3><div class="muted" style="font-size:.85rem">${h(d.codigo)} · Versión ${h(d.version)} · ${fF(d.fecha)} · ${d.secciones.length} secciones · ${d.propio ? '<span class="pill ok">Texto propio de la entidad</span>' : '<span class="pill">Texto de referencia IBCOL</span>'}${dr.dirty ? ' <span class="pill warn">Cambios sin guardar</span>' : ''}</div></div>
          <div class="actions">${esProp() ? `<label class="btn sm" title="Cargar el texto desde el documento de la entidad (PDF o Word) y separarlo en secciones">${I.subir} Importar PDF / Word<input type="file" accept=".pdf,.docx" hidden data-imp></label>${d.propio ? '<button class="btn sm" data-x="ref">Volver al texto de referencia</button>' : ''}<button class="btn sm" data-x="plantilla" title="Usar este texto como plantilla de referencia para todas las entidades">Guardar como referencia</button>` : ''}<button class="btn pri" data-x="pdf">${I.pdf} ${esProp() ? 'Generar documento (PDF)' : 'Ver documento (PDF)'}</button></div></div>
        ${esProp() ? `<div class="tabs" role="tablist" style="margin-top:10px">${subs.map(([k, t]) => `<button type="button" role="tab" class="${k === sel.sub ? 'on' : ''}" data-sub="${k}">${t}</button>`).join('')}</div><div data-sub-body style="margin-top:12px"></div>`
        : `<ol style="margin:12px 0 0 18px;columns:2;font-size:.9rem">${d.secciones.map((s) => `<li>${h(P.reemplazar(s.t, P.valores(ctx)))}</li>`).join('')}</ol>`}`;
      panel.querySelector('[data-x=pdf]').onclick = async () => { try { await verPDF(ent, d, ctx); } catch (er) { console.error(er); toast('No se pudo generar el PDF: ' + er.message, true); } };
      if (!esProp()) { if (esCapDoc() && P.capEquipos) { const cb = document.createElement('div'); cb.style.marginTop = '16px'; panel.appendChild(cb); P.capEquipos(cb, { ent, ctx }); } return; }
      panel.querySelectorAll('[data-sub]').forEach((b) => { b.onclick = () => { sel.sub = b.dataset.sub; pintar(); }; });
      panel.querySelector('[data-x=ref]')?.addEventListener('click', async () => { if (!(await confirmar('¿Volver al texto de referencia de IBCOL? Se pierde el texto propio de esta entidad para este documento.', 'Usar texto de referencia'))) return; await guardarReg(ent, sel.k, reg, { secciones: [] }); delete st.protDraft[clave()]; toast('Documento con el texto de referencia'); A.recargar(); });
      panel.querySelector('[data-x=plantilla]').onclick = async () => { if (!(await confirmar(`¿Guardar el texto actual de «${d.n}» como plantilla de referencia para TODAS las entidades? Las entidades con texto propio no cambian.`, 'Guardar como referencia'))) return; const cur = st.fmt['prot_' + sel.k] || {}; await S.upsert('formatos', { clave: 'prot_' + sel.k, datos: { ...cur, titulo: cur.titulo || d.titulo, codigo: cur.codigo || d.codigo, version: cur.version || d.version, fecha: cur.fecha || d.fecha, secciones: P.limpiarValores(dr.secciones, ctx), actualizado: new Date().toISOString() } }); await A.cargarConfig(); toast('Plantilla de referencia guardada'); };
      panel.querySelector('[data-imp]').onchange = async (ev) => {
        const fi = ev.target.files[0]; ev.target.value = ''; if (!fi) return;
        try { toast('Leyendo el documento…'); const tx = /\.docx$/i.test(fi.name) ? await P.textoDocx(fi) : await P.textoPdf(fi); const secs = P.partir(tx);
          if (!secs.length) { toast('No se encontraron títulos de sección en el documento', true); return; }
          if (!(await confirmar(`Se encontraron ${secs.length} secciones: ${secs.slice(0, 12).map((s) => s.t).join(' · ')}${secs.length > 12 ? '…' : ''}. ¿Reemplazar el contenido de este documento con el texto importado? (Podrá revisarlo antes de guardar.)`, 'Reemplazar contenido'))) return;
          const cam = secs.findIndex((s) => /control de(l)? cambio/i.test(s.t)); if (cam >= 0) secs[cam].x = '[[CAMBIOS]]'; else secs.push({ t: 'CONTROL DE CAMBIOS', x: '[[CAMBIOS]]' });
          dr.secciones = P.limpiarValores(secs, ctx); dr.dirty = true; sel.sub = 'contenido'; sel.sec = 0; pintar(); toast('Texto importado: revise las secciones y pulse «Guardar»');
        } catch (er) { console.error(er); toast('No se pudo leer el documento: ' + er.message, true); }
      };
      const body = panel.querySelector('[data-sub-body]');
      ({ contenido: subContenido, tablas: subTablas, datos: subDatos, cambios: subCambios, sesiones: (b) => P.capEquipos(b, { ent, ctx }) }[sel.sub])(body, d, reg, dr);
    };

    // ---------- Contenido: pestañas por sección
    const subContenido = (body, d, reg, dr) => {
      const L = dr.secciones; if (sel.sec >= L.length) sel.sec = Math.max(0, L.length - 1);
      const s = L[sel.sec] || { t: '', x: '' };
      const bl = Object.entries(P.BLOQUES);
      body.innerHTML = `<div style="display:grid;grid-template-columns:minmax(180px,250px) 1fr;gap:14px" class="prot-grid">
        <div role="tablist" aria-orientation="vertical" style="display:flex;flex-direction:column;gap:3px;max-height:560px;overflow:auto">${L.map((x, i) => `<button type="button" role="tab" class="btn sm ${i === sel.sec ? 'pri' : ''}" style="justify-content:flex-start;text-align:left;white-space:normal" data-sec="${i}">${i + 1}. ${h(x.t || '(sin título)')}</button>`).join('')}
          <button type="button" class="btn sm" data-nueva>${I.mas} Nueva sección</button></div>
        <div>${L.length ? `<label class="field full"><span>Título de la sección</span><input data-t value="${h(s.t)}"></label>
          <label class="field full" style="margin-top:8px"><span>Texto (líneas que empiezan con «## » son subtítulos, con «- » viñetas y con «1. » pasos)</span><textarea data-tx rows="20" style="width:100%;font-family:ui-monospace,monospace;font-size:.82rem">${h(s.x)}</textarea></label>
          <details style="margin-top:6px"><summary class="muted" style="cursor:pointer;font-size:.85rem">Insertar datos de la entidad o tablas automáticas</summary>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${P.MARCADORES.map(([m, t]) => `<button type="button" class="btn sm" data-ins="${m}" title="${h(t)}">${m}</button>`).join('')}</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${bl.map(([k, t]) => `<button type="button" class="btn sm" data-ins="[[${k}]]" title="${h(t)}">${h(t)}</button>`).join('')}</div></details>
          <div class="actions" style="margin-top:10px;justify-content:space-between"><div class="actions"><button class="btn sm" data-mv="-1" ${sel.sec ? '' : 'disabled'}>↑ Subir</button><button class="btn sm" data-mv="1" ${sel.sec < L.length - 1 ? '' : 'disabled'}>↓ Bajar</button><button class="btn sm" data-restaurar title="Volver al texto de referencia de esta sección">Restaurar sección</button><button class="btn sm bad" data-borrar>${I.del} Quitar sección</button></div>
          <div class="actions"><button class="btn" data-descartar ${dr.dirty ? '' : 'disabled'}>Descartar cambios</button><button class="btn pri" data-guardar ${dr.dirty ? '' : 'disabled'}>Guardar documento</button></div></div>` : '<div class="empty">Sin secciones. Agregue una nueva sección.</div>'}</div></div>`;
      const tx = body.querySelector("[data-tx]"), ti = body.querySelector('[data-t]');
      const marcar = () => { if (!dr.dirty) { dr.dirty = true; body.querySelector('[data-guardar]').disabled = false; body.querySelector('[data-descartar]').disabled = false; } };
      ti?.addEventListener('input', () => { s.t = ti.value; marcar(); body.querySelector(`[data-sec="${sel.sec}"]`).textContent = `${sel.sec + 1}. ${ti.value || '(sin título)'}`; });
      tx?.addEventListener('input', () => { s.x = tx.value; marcar(); });
      body.querySelectorAll('[data-sec]').forEach((b) => { b.onclick = () => { sel.sec = +b.dataset.sec; subContenido(body, d, reg, dr); }; });
      body.querySelector('[data-nueva]').onclick = () => { L.splice(L.length && /cambios/i.test(L[L.length - 1].t) ? L.length - 1 : L.length, 0, { t: 'NUEVA SECCIÓN', x: '' }); sel.sec = L.findIndex((x) => x.t === 'NUEVA SECCIÓN' && !x.x); dr.dirty = true; pintar(); };
      body.querySelectorAll('[data-ins]').forEach((b) => { b.onclick = () => { if (!tx) return; const v = b.dataset.ins, bloque = v.startsWith('[['), a = tx.selectionStart ?? tx.value.length; const ins = bloque ? `\n${v}\n` : v; tx.value = tx.value.slice(0, a) + ins + tx.value.slice(tx.selectionEnd ?? a); s.x = tx.value; marcar(); tx.focus(); }; });
      body.querySelectorAll('[data-mv]').forEach((b) => { b.onclick = () => { const j = sel.sec + +b.dataset.mv; [L[sel.sec], L[j]] = [L[j], L[sel.sec]]; sel.sec = j; dr.dirty = true; pintar(); }; });
      body.querySelector('[data-borrar]')?.addEventListener('click', async () => { if (!(await confirmar(`¿Quitar la sección «${s.t}» de este documento?`, 'Quitar sección'))) return; L.splice(sel.sec, 1); sel.sec = Math.max(0, sel.sec - 1); dr.dirty = true; pintar(); });
      body.querySelector('[data-restaurar]')?.addEventListener('click', () => { const r = P.ref(sel.k).secciones.find((x) => nrm(x.t) === nrm(s.t)); if (!r) { toast('Esta sección no existe en el texto de referencia', true); return; } s.x = r.x; dr.dirty = true; pintar(); toast('Sección restaurada (pulse «Guardar documento» para conservarla)'); });
      body.querySelector('[data-descartar]')?.addEventListener('click', () => { delete st.protDraft[clave()]; pintar(); });
      body.querySelector('[data-guardar]')?.addEventListener('click', async () => { await guardarReg(ent, sel.k, reg, { secciones: L.filter((x) => x.t || x.x) }); delete st.protDraft[clave()]; toast('Documento guardado para esta entidad'); A.recargar(); });
    };

    // ---------- Tablas de la entidad
    const subTablas = (body, d) => {
      const cfg = P.cfg(ent), qs = d.datos, partes = [];
      if (qs.includes('desinfectantes')) partes.push(`<fieldset style="min-width:0"><legend>Productos de limpieza y desinfección</legend><div data-tb="desinf"></div><button type="button" class="btn sm" data-add="desinf">${I.mas} Producto</button></fieldset>`);
      if (qs.includes('limpieza')) partes.push(`<fieldset style="min-width:0"><legend>Procedimiento y frecuencia por equipo (se proponen según el tipo de equipo; puede cambiarlos, quitarlos o agregar)</legend><div data-tb="limp"></div><div class="actions" style="margin-top:6px"><input data-nuevo="limp" placeholder="Nombre del equipo a agregar" list="protEqs" style="min-width:240px"><button type="button" class="btn sm" data-add="limp">${I.mas} Agregar equipo</button></div></fieldset>`);
      if (qs.includes('gluco')) partes.push(`<fieldset><legend>Rangos de las soluciones de control y responsables</legend><div class="fields">${f.input('normal', 'Solución NORMAL (mg/dL)', cfg.gluco?.normal || '', { attrs: 'placeholder="ej: 60 – 120"' })}${f.input('normal_mmol', 'NORMAL (mmol/L)', cfg.gluco?.normal_mmol || '')}${f.input('alta', 'Solución ALTA (mg/dL)', cfg.gluco?.alta || '', { attrs: 'placeholder="ej: 200 – 320"' })}${f.input('alta_mmol', 'ALTA (mmol/L)', cfg.gluco?.alta_mmol || '')}${f.input('baja', 'Solución BAJA (opcional)', cfg.gluco?.baja || '')}${f.input('resp', '¿Quién realiza la prueba?', cfg.gluco?.resp || '', { attrs: 'placeholder="Personal asistencial que realiza la glucometría"' })}${f.input('donde', '¿Dónde?', cfg.gluco?.donde || '', { attrs: 'placeholder="Servicio donde se encuentra el glucómetro"' })}</div></fieldset>`);
      if (qs.includes('metro')) partes.push(`<fieldset style="min-width:0"><legend>Magnitudes, actividad y frecuencia por equipo (puede quitarlos o agregar)</legend><div data-tb="metro"></div><div class="actions" style="margin-top:6px"><input data-nuevo="metro" placeholder="Nombre del equipo a agregar" list="protEqs" style="min-width:240px"><button type="button" class="btn sm" data-add="metro">${I.mas} Agregar equipo</button></div></fieldset>`);
      if (qs.includes('cap')) partes.push(`<fieldset style="min-width:0"><legend>Temas y cronograma de capacitación (marque los meses)</legend><div data-tb="cap"></div><button type="button" class="btn sm" data-add="cap">${I.mas} Tema</button></fieldset>`);
      if (qs.includes('suf')) partes.push(`<fieldset style="min-width:0"><legend>Datos para el cálculo de suficiencia (por servicio y equipo)</legend><div data-tb="suf"></div><button type="button" class="btn sm" data-add="suf">${I.mas} Servicio / equipo</button><button type="button" class="btn sm" data-add="sufAuto">Agregar los equipos del inventario</button></fieldset>`);
      body.innerHTML = `<form class="form" onsubmit="return false"><datalist id="protEqs">${tipos(ctx).map(([n]) => `<option value="${h(n)}">`).join('')}</datalist>${partes.join('')}<div class="actions" style="margin-top:10px"><button type="button" class="btn pri" data-guardar-tb>Guardar tablas de la entidad</button></div></form>`;
      const w = { desinf: clon(cfg.desinfectantes || []), limp: clon(cfg.limpieza || {}), metro: clon(cfg.metro || {}), limpX: clon(cfg.limpieza_extra || []), metroX: clon(cfg.metro_extra || []), cap: clon(P.temasDe(ctx)), suf: clon(cfg.suf?.filas || []) };
      const inp = (v, a = '', ph = '') => `<input value="${h(v ?? '')}" ${a} placeholder="${h(ph)}" style="width:100%">`;
      const cW = () => ({ ...ctx, cfg: { ...cfg, limpieza: w.limp, limpieza_extra: w.limpX, metro: w.metro, metro_extra: w.metroX, desinfectantes: w.desinf } });
      const quitados = (clave, mapa, tipo) => { const l = P.filasEq(cW(), clave, true).filter(([n]) => mapa[n]?.quitar); return l.length ? `<p class="muted" style="font-size:.85rem;margin:6px 0 0">Equipos quitados de esta tabla: ${l.map(([n]) => `<button type="button" class="chip" data-rest="${tipo}" data-n="${h(n)}" title="Volver a incluir">${h(n)} ↺</button>`).join(' ')}</p>` : ''; };
      const pintarTb = () => {
        const q = (s) => body.querySelector(`[data-tb="${s}"]`);
        if (q('desinf')) q('desinf').innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Producto</th><th>Tipo / uso</th><th>Principio activo</th><th>Registro sanitario</th><th>Tiempo de contacto</th><th></th></tr></thead><tbody>${w.desinf.map((x, i) => `<tr>${['nombre', 'uso', 'principio', 'rs', 'contacto'].map((c) => `<td>${inp(x[c], `data-d="${i}" data-c="${c}"`)}</td>`).join('')}<td><button type="button" class="icon-btn bad" data-rm-d="${i}" aria-label="Quitar">${I.del}</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Sin productos. Agregue el desinfectante que usa la entidad (ficha técnica y registro sanitario).</td></tr>'}</tbody></table></div>`;
        if (q('limp')) q('limp').innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Equipo</th><th>Procedimiento</th><th>Frecuencia</th><th></th></tr></thead><tbody>${P.filasEq(cW(), 'limpieza').map(([n, l, ex]) => { const x = P.limpiezaDe(cW(), n); return `<tr><td style="min-width:170px">${inp(w.limp[n]?.nombre || n, `data-l="${h(n)}" data-c="nombre" aria-label="Nombre del equipo" title="Puede cambiar el nombre con que aparece en el protocolo"`)}${ex ? ' <span class="pill">agregado</span>' : (w.limp[n]?.nombre && w.limp[n].nombre !== n ? `<div class="muted" style="font-size:.75rem">Inventario: ${h(n)}</div>` : '')}</td><td><textarea rows="3" data-l="${h(n)}" data-c="proc" style="width:100%;min-width:300px">${h(x.proc)}</textarea></td><td>${inp(x.frec, `data-l="${h(n)}" data-c="frec"`)}</td><td><button type="button" class="icon-btn bad" data-quitar="limp" data-n="${h(n)}" aria-label="Quitar ${h(n)}" title="Quitar este equipo del protocolo">${I.del}</button></td></tr>`; }).join('') || '<tr><td colspan="4" class="muted">Sin equipos. Agregue los equipos de la entidad.</td></tr>'}</tbody></table></div>${quitados('limpieza', w.limp, 'limp')}`;
        if (q('metro')) q('metro').innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Equipo</th><th>Aplica</th><th>Magnitudes</th><th>Actividad</th><th>Frecuencia</th><th></th></tr></thead><tbody>${P.filasEq(cW(), 'metro').map(([n, l, ex]) => { const o = w.metro[n] || {}, c2 = cW(); c2.cfg.metro = { ...w.metro, [n]: { ...o, excluir: false } }; const x = P.metroDe(c2, n, l); const ap = !o.excluir && !!x; return `<tr><td style="min-width:170px">${inp(o.nombre || n, `data-m="${h(n)}" data-c="nombre" aria-label="Nombre del equipo" title="Puede cambiar el nombre con que aparece en el protocolo"`)} ${ex ? '<span class="pill">agregado</span>' : `<span class="muted">(${l.length})</span>`}${o.nombre && o.nombre !== n ? `<div class="muted" style="font-size:.75rem">Inventario: ${h(n)}</div>` : ''}</td><td><input type="checkbox" data-m="${h(n)}" data-c="aplica" ${ap ? 'checked' : ''}></td><td>${inp(x?.mag || o.mag || '', `data-m="${h(n)}" data-c="mag"`)}</td><td><select data-m="${h(n)}" data-c="tipo">${Object.entries(P.TIPO_METRO).map(([k, t]) => `<option value="${k}" ${(x?.tipo || 'CAL') === k ? 'selected' : ''}>${k} · ${t}</option>`).join('')}</select></td><td>${inp(x?.frec || o.frec || 'Anual', `data-m="${h(n)}" data-c="frec"`)}</td><td><button type="button" class="icon-btn bad" data-quitar="metro" data-n="${h(n)}" aria-label="Quitar ${h(n)}" title="Quitar este equipo del programa">${I.del}</button></td></tr>`; }).join('')}</tbody></table></div>${quitados('metro', w.metro, 'metro')}`;
        if (q('cap')) q('cap').innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tema</th><th>Dirigido a</th><th>Responsable</th>${CAT.MESES.map((m) => `<th title="${m}" style="text-align:center">${m.slice(0, 3)}</th>`).join('')}<th></th></tr></thead><tbody>${w.cap.map((x, i) => `<tr><td style="min-width:220px">${inp(x.tema, `data-k="${i}" data-c="tema"`)}</td><td style="min-width:140px">${inp(x.dirigido, `data-k="${i}" data-c="dirigido"`)}</td><td style="min-width:120px">${inp(x.resp, `data-k="${i}" data-c="resp"`)}</td>${CAT.MESES.map((_, m) => `<td style="text-align:center"><input type="checkbox" data-k="${i}" data-mes="${m + 1}" ${(x.meses || []).includes(m + 1) ? 'checked' : ''}></td>`).join('')}<td><button type="button" class="icon-btn bad" data-rm-k="${i}" aria-label="Quitar">${I.del}</button></td></tr>`).join('')}</tbody></table></div>`;
        if (q('suf')) { const calc = P.suficiencia({ ...ctx, cfg: { ...cfg, suf: { filas: w.suf } } }); q('suf').innerHTML = `<p class="muted" style="font-size:.82rem;margin:0 0 6px">N.° de equipos vacío = se cuentan del inventario. Minutos de uso por paciente, minutos de reposo/preparación entre pacientes y horas de limpieza o esterilización al mes.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Sede</th><th>Servicio</th><th>Equipo</th><th>N.°</th><th>Días/mes</th><th>Horas/día</th><th>Min. uso</th><th>Min. reposo</th><th>H. limpieza/mes</th><th>Usuarios/mes</th><th>Resultado</th><th></th></tr></thead><tbody>${w.suf.map((x, i) => `<tr>${["sede", "servicio", "equipo"].map((c) => `<td style="min-width:150px">${inp(x[c], `data-s="${i}" data-c="${c}"`)}</td>`).join('')}${['n', 'dias', 'horas', 'min', 'reposo', 'desinf', 'usuarios'].map((c) => `<td style="min-width:62px">${inp(x[c], `data-s="${i}" data-c="${c}" type="number" min="0" step="any"`, c === 'n' ? String(calc.find((z) => z.equipo === x.equipo && z.sede === x.sede)?.n ?? '') : '')}</td>`).join('')}<td style="min-width:150px;font-size:.8rem">${h(calc.find((z) => z.equipo === x.equipo && z.sede === x.sede && z.servicio === x.servicio)?.res || '')}</td><td><button type="button" class="icon-btn bad" data-rm-s="${i}" aria-label="Quitar">${I.del}</button></td></tr>`).join('') || '<tr><td colspan="12" class="muted">Sin datos. Agregue los servicios y equipos a evaluar.</td></tr>'}</tbody></table></div>`; }
      };
      pintarTb();
      body.addEventListener('input', (e) => { const t = e.target, c = t.dataset.c;
        if (t.dataset.d != null) w.desinf[+t.dataset.d][c] = t.value;
        if (t.dataset.l != null) { w.limp[t.dataset.l] = { ...(w.limp[t.dataset.l] || {}), [c]: t.value }; }
        if (t.dataset.m != null && c !== 'aplica') w.metro[t.dataset.m] = { ...(w.metro[t.dataset.m] || {}), [c]: t.value };
        if (t.dataset.k != null && c) w.cap[+t.dataset.k][c] = t.value;
        if (t.dataset.s != null) w.suf[+t.dataset.s][c] = t.value; });
      body.addEventListener('change', (e) => { const t = e.target;
        if (t.dataset.m != null && t.dataset.c === 'aplica') w.metro[t.dataset.m] = { ...(w.metro[t.dataset.m] || {}), excluir: !t.checked };
        if (t.dataset.m != null && t.dataset.c === 'tipo') w.metro[t.dataset.m] = { ...(w.metro[t.dataset.m] || {}), tipo: t.value };
        if (t.dataset.mes) { const x = w.cap[+t.dataset.k], m = +t.dataset.mes; x.meses = t.checked ? [...new Set([...(x.meses || []), m])].sort((a, b) => a - b) : (x.meses || []).filter((z) => z !== m); }
        if (t.dataset.s != null) pintarTb(); });
      body.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.add === 'desinf') { w.desinf.push({ nombre: '', uso: 'Detergente y desinfectante de dispositivos médicos y superficies' }); pintarTb(); }
        if (b.dataset.add === 'cap') { w.cap.push({ tema: '', dirigido: '', resp: 'Ingeniería biomédica', meses: [] }); pintarTb(); }
        if (b.dataset.add === 'suf') { w.suf.push({ sede: ctx.sedes[0] || '', servicio: '', equipo: '', dias: 22, horas: 8, min: 15, reposo: 5, desinf: 4, usuarios: '' }); pintarTb(); }
        if (b.dataset.add === 'sufAuto') { const g = {}; ctx.eqs.forEach((e) => { const c = ctx.consM[e.consultorio_id]; const k = `${c?.sede || 'Sede principal'}|${c?.nombre || ''}|${nomEq(e)}`; g[k] = 1; }); Object.keys(g).sort().forEach((k) => { const [sede, servicio, equipo] = k.split('|'); if (!w.suf.some((x) => x.sede === sede && x.servicio === servicio && x.equipo === equipo)) w.suf.push({ sede, servicio, equipo, dias: 22, horas: 8, min: 15, reposo: 5, desinf: 4, usuarios: '' }); }); pintarTb(); toast('Equipos agregados: complete tiempos y usuarios atendidos'); }
        if (b.dataset.add === 'limp' || b.dataset.add === 'metro') { const t = b.dataset.add, i = body.querySelector(`[data-nuevo="${t}"]`), n = String(i.value || '').replace(/\s+/g, ' ').trim().toUpperCase(); if (!n) { toast('Escriba el nombre del equipo', true); return; }
          const mapa = t === 'limp' ? w.limp : w.metro, lx = t === 'limp' ? w.limpX : w.metroX; if (mapa[n]?.quitar) mapa[n] = { ...mapa[n], quitar: false }; else if (P.filasEq(cW(), t === 'limp' ? 'limpieza' : 'metro', true).some(([x]) => x === n)) { toast('Ese equipo ya está en la tabla', true); return; } else lx.push(n); if (t === 'metro') mapa[n] = { ...(mapa[n] || {}), excluir: false }; i.value = ''; pintarTb(); }
        if (b.dataset.quitar) { const n = b.dataset.n, t = b.dataset.quitar, mapa = t === 'limp' ? w.limp : w.metro, lx = t === 'limp' ? w.limpX : w.metroX; const j = lx.indexOf(n); if (j >= 0) { lx.splice(j, 1); delete mapa[n]; } else mapa[n] = { ...(mapa[n] || {}), quitar: true }; pintarTb(); }
        if (b.dataset.rest) { const n = b.dataset.n, mapa = b.dataset.rest === 'limp' ? w.limp : w.metro; mapa[n] = { ...(mapa[n] || {}), quitar: false }; pintarTb(); }
        if (b.dataset.rmD != null) { w.desinf.splice(+b.dataset.rmD, 1); pintarTb(); }
        if (b.dataset.rmK != null) { w.cap.splice(+b.dataset.rmK, 1); pintarTb(); }
        if (b.dataset.rmS != null) { w.suf.splice(+b.dataset.rmS, 1); pintarTb(); }
        if (b.hasAttribute('data-guardar-tb')) (async () => {
          const o = {};
          if (qs.includes('desinfectantes')) o.desinfectantes = w.desinf.filter((x) => x.nombre);
          if (qs.includes('limpieza')) { o.limpieza = w.limp; o.limpieza_extra = w.limpX; }
          if (qs.includes('metro')) { o.metro = w.metro; o.metro_extra = w.metroX; }
          if (qs.includes('cap')) o.cap = { temas: w.cap.filter((x) => x.tema) };
          if (qs.includes('suf')) o.suf = { filas: w.suf.filter((x) => x.equipo) };
          if (qs.includes('gluco')) { const v = leer(body); o.gluco = Object.fromEntries(['normal', 'normal_mmol', 'alta', 'alta_mmol', 'baja', 'resp', 'donde'].map((c) => [c, v[c] || ''])); }
          await guardarCfg(ent, o); ctx.cfg = P.cfg(ent); toast('Tablas guardadas para la entidad'); pintar();
        })(); });
    };

    // ---------- Datos y firmas
    const subDatos = (body, d, reg) => {
      const fz = P.cfg(ent).firmas || {}, x = reg?.datos || {};
      body.innerHTML = `<form class="form" onsubmit="return false"><fieldset><legend>Identificación del documento (vacío = el de la plantilla de referencia)</legend><div class="fields">${f.input('titulo', 'Título', x.titulo || '', { full: true, attrs: `placeholder="${h(P.ref(sel.k).titulo)}"` })}${f.input('codigo', 'Código', x.codigo || '', { attrs: `placeholder="${h(P.ref(sel.k).codigo)}"` })}${f.input('version', 'Versión', x.version || '', { attrs: `placeholder="${h(P.ref(sel.k).version)}"` })}${f.input('fecha', 'Fecha', x.fecha || '', { type: 'date' })}</div></fieldset>
        <fieldset><legend>Firmas de los documentos de la entidad (aplican a todos sus protocolos y programas)</legend><div class="fields">${f.input('reviso', 'Revisó · nombre', fz.reviso || '')}${f.input('cargo_reviso', 'Revisó · cargo', fz.cargo_reviso || '', { attrs: 'placeholder="Coordinador(a) administrativo(a)"' })}${f.input('aprobo', 'Aprobó · nombre', fz.aprobo || ent.representante || '')}${f.input('cargo_aprobo', 'Aprobó · cargo', fz.cargo_aprobo || 'Representante legal')}</div>
          <div class="actions" style="margin-top:6px"><button type="button" class="btn sm" data-fir="firma_reviso">${fz.firma_reviso ? '✓ ' : ''}Firma de quien revisó</button><button type="button" class="btn sm" data-fir="firma_aprobo">${fz.firma_aprobo ? '✓ ' : ''}Firma de quien aprobó</button></div>
          <p class="muted" style="font-size:.82rem">«Elaboró» usa el responsable y la firma de IBCOL (Mi empresa y firma).</p></fieldset>
        <div class="actions"><button type="button" class="btn pri" data-g>Guardar</button></div></form>`;
      body.querySelectorAll('[data-fir]').forEach((b) => { b.onclick = async () => { const k = b.dataset.fir; const img = await UI.pedirFirma({ titulo: k === 'firma_reviso' ? 'Firma de quien revisó' : 'Firma de quien aprobó', actual: fz[k] }); if (img === undefined || img === null) return; await guardarCfg(ent, { firmas: { ...(P.cfg(ent).firmas || {}), [k]: img || null } }); toast('Firma guardada'); pintar(); }; });
      body.querySelector('[data-g]').onclick = async () => { const v = leer(body); await guardarReg(ent, sel.k, reg, { titulo: v.titulo, codigo: v.codigo, version: v.version, fecha: v.fecha });
        await guardarCfg(ent, { firmas: { ...(P.cfg(ent).firmas || {}), reviso: v.reviso, cargo_reviso: v.cargo_reviso, aprobo: v.aprobo, cargo_aprobo: v.cargo_aprobo } }); toast('Datos guardados'); A.recargar(); };
    };

    // ---------- Control de cambios
    const subCambios = (body, d, reg) => {
      const l = clon(d.cambios || []);
      const pint = () => { body.innerHTML = `<p class="muted" style="font-size:.85rem">Si no hay registros, el documento muestra «Creación del documento» con la versión y fecha actuales.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Versión</th><th>Fecha</th><th>Descripción de la modificación</th><th>Nombre y cargo del responsable</th><th></th></tr></thead><tbody>${l.map((c, i) => `<tr><td><input data-i="${i}" data-c="version" value="${h(c.version || '')}" style="width:70px"></td><td><input type="date" data-i="${i}" data-c="fecha" value="${h(c.fecha || '')}"></td><td><input data-i="${i}" data-c="desc" value="${h(c.desc || '')}" style="width:100%;min-width:220px"></td><td><input data-i="${i}" data-c="resp" value="${h(c.resp || '')}" style="width:100%;min-width:160px"></td><td><button type="button" class="icon-btn bad" data-rm="${i}" aria-label="Quitar">${I.del}</button></td></tr>`).join('')}</tbody></table></div>
        <div class="actions" style="margin-top:8px"><button type="button" class="btn sm" data-add>${I.mas} Cambio</button><button type="button" class="btn pri" data-g>Guardar control de cambios</button></div>`;
        body.querySelectorAll('[data-i]').forEach((x) => { x.oninput = () => { l[+x.dataset.i][x.dataset.c] = x.value; }; });
        body.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => { l.splice(+b.dataset.rm, 1); pint(); }; });
        body.querySelector('[data-add]').onclick = () => { l.push({ version: d.version, fecha: UI.hoy(), desc: '', resp: `${st.emp?.responsable || ''} - ${st.emp?.cargo || 'Ingeniera Biomédica'}` }); pint(); };
        body.querySelector('[data-g]').onclick = async () => { await guardarReg(ent, sel.k, reg, { cambios: l.filter((c) => c.desc || c.version) }); toast('Control de cambios guardado'); A.recargar(); };
      };
      pint();
    };
    pintar();
  };

  // al guardar como referencia o importar, cambia los datos de la entidad por marcadores
  P.limpiarValores = (secs, ctx) => {
    const v = P.valores(ctx), pares = [['ENTIDAD', v.ENTIDAD], ['NIT', v.NIT]].filter(([, x]) => x && String(x).length > 3);
    const nombreCorto = String(ctx.ent.razon_social || '').replace(/\b(S\.?A\.?S\.?|S\.?A\.?|LTDA\.?|E\.?S\.?E\.?)\s*$/i, '').trim();
    const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    return secs.map((s) => { let t = s.t, x = s.x; for (const [k, val] of [...pares, ['ENTIDAD', nombreCorto]]) { if (!val || val.length < 4) continue; const re = new RegExp(esc(val), 'gi'); t = t.replace(re, `{${k}}`); x = x.replace(re, `{${k}}`); } x = x.replace(/\{ENTIDAD\}\s+(S\.?A\.?S\.?|IPS\s+S\.?A\.?S\.?)/g, '{ENTIDAD}'); return { t, x }; });
  };
})();
