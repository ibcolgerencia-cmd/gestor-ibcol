// =====================================================================
//  CARGA DE SOPORTES YA REALIZADOS (PDF) · el sistema los lee y organiza
//  · Reportes trimestrales al INVIMA (RETEIM-002 / reporte en cero):
//    detecta año, trimestre, si es en cero, fecha y radicado; guarda el PDF
//    en "4. REPORTES TRIMESTRALES/AAAA/N TRIMESTRE" y marca el trimestre
//    como realizado.
//  · Consultas de alertas sanitarias (FT-PGTV-015 u otro soporte):
//    detecta mes y año; guarda el PDF en "AAAA/MM. MES" de la carpeta de
//    alertas y registra la consulta en la bitácora.
//  Antes de guardar muestra lo detectado para que el propietario lo revise.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const TV = (A.TV = A.TV || {});
  const { h, toast, modal } = UI;
  const TB = 'tv_registros';
  const ROM = ['I', 'II', 'III', 'IV'];
  const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const nrm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[_]+/g, ' ');
  const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(0, 80);
  const hoy = () => UI.hoy();

  // ------------------------------------------------------------------ texto del PDF (primeras páginas)
  TV.textoPDF = async (blob, maxPag = 6) => {
    try {
      if (!window.pdfjsLib) return '';
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
      let t = '';
      for (let p = 1; p <= Math.min(pdf.numPages, maxPag); p++) t += ' ' + (await (await pdf.getPage(p)).getTextContent()).items.map((i) => i.str).join(' ');
      return t.replace(/\s+/g, ' ').trim();
    } catch (e) { console.warn(e); return ''; }
  };
  // fechas que aparecen en el texto → ISO
  const fechas = (t) => {
    const out = []; const s = nrm(t);
    for (const m of s.matchAll(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2})\b/g)) { const d = +m[1], mo = +m[2]; if (d <= 31 && mo <= 12) out.push(`${m[3]}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`); }
    for (const m of s.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)) out.push(`${m[1]}-${m[2]}-${m[3]}`);
    for (const m of s.matchAll(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(?:de\s+|del\s+)?(20\d{2})\b/g)) { const mo = m[2] === 'setiembre' ? 9 : MES.indexOf(m[2]) + 1; out.push(`${m[3]}-${String(mo).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}`); }
    return out.filter((x) => x <= hoy() && x >= '2015-01-01');
  };

  // ------------------------------------------------------------------ detección de un reporte trimestral
  TV.detectarTrimestral = (nombre, texto) => {
    const n = nrm(nombre), t = nrm(texto), todo = `${n} ${t}`;
    let tri = null, anio = null, fuente = [];
    const pals = { primer: 1, primero: 1, segundo: 2, tercer: 3, tercero: 3, cuarto: 4 };
    const buscaT = (s) => {
      let m = s.match(/\b(primer|primero|segundo|tercer|tercero|cuarto)\s+trimestr(?:e|al)/); if (m) return pals[m[1]];
      m = s.match(/\btrimestr(?:e|al)\s*(?:n[°o.]*\s*)?(iv|iii|ii|i|[1-4])\b/); if (m) return isNaN(+m[1]) ? ROM.indexOf(m[1].toUpperCase()) + 1 : +m[1];
      m = s.match(/\b(iv|iii|ii|i|[1-4])\s*(?:er|do|ro|to|°|o)?\s*trimestr(?:e|al)/); if (m) return isNaN(+m[1]) ? ROM.indexOf(m[1].toUpperCase()) + 1 : +m[1];
      m = s.match(/(?:^|[\s_-])[tq]([1-4])(?:[\s_-]|$)/); if (m) return +m[1];
      m = s.match(/(enero|abril|julio|octubre)\s*(?:a|al|-|hasta)\s*(marzo|junio|septiembre|setiembre|diciembre)/); if (m) return { enero: 1, abril: 2, julio: 3, octubre: 4 }[m[1]];
      return null;
    };
    tri = buscaT(n); if (tri) fuente.push('nombre'); else { tri = buscaT(t); if (tri) fuente.push('contenido'); }
    const y = (t.match(/ano\s+(?:de\s+)?(?:reporte|reportado)[^0-9]{0,12}(20\d{2})/) || todo.match(/trimestr(?:e|al)[^0-9]{0,40}(20\d{2})/) || n.match(/\b(20\d{2})\b/) || t.match(/\b(20\d{2})\b/) || [])[1]; if (y) anio = +y;
    const fs = fechas(texto).concat(fechas(nombre));
    // fecha de reporte: la que sigue a "fecha de reporte / envío / radicación / notificación", si no la más reciente
    let fecha = null; const mF = texto && nrm(texto).match(/fecha\s+(?:y\s+hora\s+)?(?:del?\s+)?(?:reporte|envio|radicacion|notificacion|generacion|cargue|elaboracion|ingreso)[^0-9]{0,25}([0-9][0-9\/.\- a-z]{6,30})/);
    if (mF) fecha = fechas(mF[1])[0] || null;
    if (!fecha && fs.length) fecha = [...fs].sort().pop();
    // sin trimestre detectado: el trimestre anterior a la fecha del reporte
    if (!tri && fecha) { const mo = +fecha.slice(5, 7), yy = +fecha.slice(0, 4); const tq = Math.ceil(mo / 3) - 1; tri = tq || 4; anio = tq ? yy : yy - 1; fuente.push('fecha'); }
    if (!anio && fecha) anio = +fecha.slice(0, 4);
    const cero = /en cero|reporte cero|reportes? en 0|cero \(0\)|sin (eventos|incidentes|reportes)|no se presentaron|no se reportaron|ningun (evento|incidente)|0 eventos/.test(todo);
    const rad = (texto.match(/c[oó]digo\s+asignado\s*[:#]?\s*([0-9][0-9\-]{6,})/i) || [])[1] || (texto.match(/radicad[oa]\s*(?:n[°o.º]*|numero|no\.?)?\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/]{4,})/i) || [])[1] || '';
    return { anio: anio || new Date().getFullYear(), t: tri || null, cero, fecha: fecha || '', radicado: rad, seguro: !!(tri && y && !fuente.includes('fecha')), fuente: fuente.join(', ') || 'sin datos' };
  };
  // ------------------------------------------------------------------ detección de una consulta de alertas
  TV.detectarAlerta = (nombre, texto) => {
    const n = nrm(nombre), t = nrm(texto);
    const mesDe = (s) => { const i = MES.findIndex((m) => new RegExp(`\\b${m}\\b`).test(s)); return i >= 0 ? i + 1 : (/\bsetiembre\b/.test(s) ? 9 : null); };
    let mes = mesDe(n), fuente = mes ? 'nombre' : '';
    let anio = +(n.match(/\b(20\d{2})\b/) || [])[1] || null;
    if (!mes) { const m = t.match(/mes\s+(?:de\s+)?consulta[^a-z]{0,10}([a-z]+)/); mes = m ? mesDe(m[1]) : null; if (mes) fuente = 'contenido'; }
    const fs = fechas(texto).concat(fechas(nombre));
    if (!mes && fs.length) { const f = [...fs].sort().pop(); mes = +f.slice(5, 7); anio = anio || +f.slice(0, 4); fuente = 'fecha'; }
    if (!mes) { mes = mesDe(t); if (mes) fuente = 'contenido'; }
    if (!anio) anio = +(t.match(/\b(20\d{2})\b/) || [])[1] || (fs.length ? +[...fs].sort().pop().slice(0, 4) : new Date().getFullYear());
    return { mes: mes || null, anio, seguro: !!(mes && /\b20\d{2}\b/.test(n + ' ' + t)), fuente: fuente || 'sin datos' };
  };

  // ------------------------------------------------------------------ utilidades de archivos
  const subirArchivo = async ({ blob, nombre, ent, carpeta, subcarpeta }) => {
    const path = `${ent.id}/general/${carpeta}/${Date.now()}-${slug(nombre)}`;
    await S.upload(path, blob);
    return S.insert('documentos', { entidad_id: ent.id, equipo_id: null, carpeta, subcarpeta, nombre, archivo: path, mime: blob.type || 'application/pdf', tamano: blob.size, fecha_documento: hoy(), visible_cliente: true });
  };
  const elegirPDFs = () => new Promise((res) => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.pdf,application/pdf'; i.multiple = true; i.onchange = () => res([...i.files]); i.click(); });
  const progreso = (txt) => { const m = modal({ titulo: 'Leyendo los PDF…', cuerpo: `<p data-pg>${h(txt)}</p>`, acciones: [] }); return { set: (t) => { const p = m.body?.querySelector('[data-pg]'); if (p) p.textContent = t; }, cerrar: () => m.cerrar?.() }; };
  const opt = (vals, sel) => vals.map(([v, t]) => `<option value="${h(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${h(t)}</option>`).join('');
  const anios = () => { const y = new Date().getFullYear(); return Array.from({ length: 10 }, (_, i) => y + 1 - i).map((a) => [a, a]); };

  // ================================================================== REPORTES TRIMESTRALES
  // items: [{ file? | doc?, nombre, blob }]
  TV.cargarTrimestrales = async (ent, { existentes = false } = {}) => {
    const sub4 = await TV.subDestino(ent, 3);
    let items = [];
    if (existentes) {
      const docs = (await S.list('documentos', { entidad_id: ent.id })).filter((d) => d.carpeta === 'tecnovigilancia' && /\.pdf$/i.test(d.nombre || '') && ((d.subcarpeta || '').split('/')[0] === sub4 || /trimestr|reteim|en cero|tcvg|reporte masivo/i.test(d.nombre || '')));
      if (!docs.length) { toast(`No hay PDF en "${sub4}"`, true); return; }
      items = docs.map((d) => ({ doc: d, nombre: d.nombre }));
    } else {
      const fl = await elegirPDFs(); if (!fl.length) return;
      items = fl.map((f) => ({ file: f, nombre: f.name, blob: f }));
    }
    const pg = progreso(`0 de ${items.length}`);
    for (const [i, it] of items.entries()) {
      pg.set(`${i + 1} de ${items.length}: ${it.nombre}`);
      try { if (!it.blob) it.blob = await S.fileBlob(it.doc.archivo); it.det = TV.detectarTrimestral(it.nombre, await TV.textoPDF(it.blob)); } catch (e) { it.det = TV.detectarTrimestral(it.nombre, ''); it.err = e.message; }
    }
    pg.cerrar();
    // si el PDF no trae texto (captura de pantalla) y en ese trimestre no hay eventos no serios registrados → reporte en cero
    const evs = await S.list('eventos', { entidad_id: ent.id }).catch(() => []);
    items.forEach((it) => { if (!it.det.cero && it.det.t && !evs.some((e) => !TV.esSerio(e) && new Date(e.fecha_evento).getFullYear() === it.det.anio && Math.floor(new Date(e.fecha_evento).getMonth() / 3) + 1 === it.det.t)) it.det.cero = true; });
    items.sort((a, b) => (a.det.anio * 10 + (a.det.t || 0)) - (b.det.anio * 10 + (b.det.t || 0)));
    const fila = (it, i) => `<tr data-i="${i}"><td style="max-width:240px;word-break:break-word">${h(it.nombre)}<div class="muted" style="font-size:.75rem">Detectado por: ${h(it.det.fuente)}</div></td>
      <td><select data-k="anio" aria-label="Año">${opt(anios(), it.det.anio)}</select></td>
      <td><select data-k="t" aria-label="Trimestre">${opt([['', '— Elija —'], ...ROM.map((r, k) => [k + 1, `${r} trimestre`]), ['x', 'Omitir (no es un reporte)']], it.det.t || '')}</select></td>
      <td><select data-k="cero" aria-label="Tipo">${opt([['0', 'Con eventos (RETEIM-002)'], ['1', 'Reporte en cero']], it.det.cero ? '1' : '0')}</select></td>
      <td><input type="date" data-k="fecha" value="${h(it.det.fecha)}" aria-label="Fecha de reporte"></td><td><input data-k="radicado" value="${h(it.det.radicado)}" aria-label="Radicado" style="width:120px"></td>
      <td>${it.det.seguro ? '<span class="pill ok">Detectado</span>' : it.det.t ? '<span class="pill">Por fecha: revisar</span>' : '<span class="pill warn">Revisar</span>'}</td></tr>`;
    modal({ titulo: `Reportes trimestrales cargados (${items.length})`, size: 'wide', cuerpo: `<p class="muted" style="font-size:.85rem">Revise lo que el sistema leyó de cada PDF. Al guardar, cada archivo queda en "${h(sub4)}/AÑO/TRIMESTRE" y ese trimestre queda como <b>reportado</b>.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Archivo</th><th>Año</th><th>Trimestre</th><th>Tipo</th><th>Fecha de reporte</th><th>Radicado</th><th></th></tr></thead><tbody>${items.map(fila).join('')}</tbody></table></div>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar y organizar', cls: 'pri', fn: async (m) => {
        const vals = [...m.body.querySelectorAll('tr[data-i]')].map((tr) => { const o = {}; tr.querySelectorAll('[data-k]').forEach((x) => { o[x.dataset.k] = x.value; }); return { it: items[+tr.dataset.i], ...o }; });
        if (vals.some((v) => !v.t)) { toast('Elija el trimestre de todos los archivos (o «Omitir»)', true); return false; }
        const regs = await S.list(TB, { entidad_id: ent.id });
        let n = 0;
        for (const v of vals) {
          if (v.t === 'x') continue;
          const anio = +v.anio, t = +v.t, subcarpeta = `${sub4}/${anio}/${ROM[t - 1]} TRIMESTRE`;
          let doc = v.it.doc;
          if (doc) { if (doc.subcarpeta !== subcarpeta) await S.update('documentos', doc.id, { subcarpeta }); }
          else doc = await subirArchivo({ blob: v.it.blob, nombre: v.it.nombre, ent, carpeta: 'tecnovigilancia', subcarpeta });
          const r = regs.find((x) => x.tipo === 'trimestral' && x.anio === anio && x.periodo === `T${t}`);
          const datos = { ...(r?.datos || {}), fecha_envio: v.fecha || r?.datos?.fecha_envio || doc.fecha_documento || hoy(), radicado: v.radicado || r?.datos?.radicado || '', en_cero: v.cero === '1', soportes: [...new Set([...(r?.datos?.soportes || []), doc.id])], fuente: 'pdf' };
          if (r) { await S.update(TB, r.id, { datos, fecha: datos.fecha_envio }); r.datos = datos; } else regs.push(await S.insert(TB, { entidad_id: ent.id, tipo: 'trimestral', anio, periodo: `T${t}`, fecha: datos.fecha_envio, datos }));
          n++;
        }
        toast(`${n} reporte(s) organizados y trimestres marcados como reportados`); A.recargar();
      } }] });
  };

  // ================================================================== CONSULTAS DE ALERTAS SANITARIAS
  TV.cargarAlertas = async (ent, { existentes = false } = {}) => {
    let items = [];
    if (existentes) {
      const docs = (await S.list('documentos', { entidad_id: ent.id })).filter((d) => /\.pdf$/i.test(d.nombre || '') && (d.carpeta === 'alertas' || (d.carpeta === 'tecnovigilancia' && !/ANEXOS/i.test(d.subcarpeta || '') && /alerta|pgtv-015/i.test((d.subcarpeta || '') + d.nombre))));
      if (!docs.length) { toast('No hay PDF de alertas cargados', true); return; }
      items = docs.map((d) => ({ doc: d, nombre: d.nombre }));
    } else {
      const fl = await elegirPDFs(); if (!fl.length) return;
      items = fl.map((f) => ({ file: f, nombre: f.name, blob: f }));
    }
    const pg = progreso(`0 de ${items.length}`);
    for (const [i, it] of items.entries()) {
      pg.set(`${i + 1} de ${items.length}: ${it.nombre}`);
      try { if (!it.blob) it.blob = await S.fileBlob(it.doc.archivo); it.det = TV.detectarAlerta(it.nombre, await TV.textoPDF(it.blob, 3)); } catch (e) { it.det = TV.detectarAlerta(it.nombre, ''); }
    }
    pg.cerrar();
    const fila = (it, i) => `<tr data-i="${i}"><td style="max-width:260px;word-break:break-word">${h(it.nombre)}<div class="muted" style="font-size:.75rem">Detectado por: ${h(it.det.fuente)}</div></td>
      <td><select data-k="mes" aria-label="Mes">${opt([['', '— Elija —'], ...MES.map((m, k) => [k + 1, CAT.MESES[k]]), ['x', 'Omitir']], it.det.mes || '')}</select></td><td><select data-k="anio" aria-label="Año">${opt(anios(), it.det.anio)}</select></td>
      <td><select data-k="aplica" aria-label="Aplicabilidad">${opt([['No aplica', 'No aplica'], ['Aplica - verificado', 'Aplica - verificado'], ['Aplica - en gestión', 'Aplica - en gestión']], 'No aplica')}</select></td>
      <td>${it.det.seguro ? '<span class="pill ok">Detectado</span>' : '<span class="pill warn">Revisar</span>'}</td></tr>`;
    modal({ titulo: `Consultas de alertas cargadas (${items.length})`, size: 'wide', cuerpo: `<p class="muted" style="font-size:.85rem">Revise el mes de cada soporte. Al guardar, cada PDF queda en la carpeta de alertas en "AÑO/MES" y la consulta de ese mes queda registrada en la bitácora (si ya existe, se le agrega el soporte).</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Archivo</th><th>Mes de consulta</th><th>Año</th><th>Aplicabilidad</th><th></th></tr></thead><tbody>${items.map(fila).join('')}</tbody></table></div>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar y organizar', cls: 'pri', fn: async (m) => {
        const vals = [...m.body.querySelectorAll('tr[data-i]')].map((tr) => { const o = {}; tr.querySelectorAll('[data-k]').forEach((x) => { o[x.dataset.k] = x.value; }); return { it: items[+tr.dataset.i], ...o }; });
        if (vals.some((v) => !v.mes)) { toast('Elija el mes de todos los archivos', true); return false; }
        const als = await S.list('alertas', { entidad_id: ent.id }); let n = 0;
        for (const v of vals) {
          if (v.mes === 'x') continue;
          const mes = +v.mes, anio = +v.anio, nomMes = CAT.MESES[mes - 1], subcarpeta = `${anio}/${String(mes).padStart(2, '0')}. ${nomMes.toUpperCase()}`;
          let doc = v.it.doc;
          if (doc) { if (doc.carpeta === 'alertas' && doc.subcarpeta !== subcarpeta) await S.update('documentos', doc.id, { subcarpeta }); }
          else doc = await subirArchivo({ blob: v.it.blob, nombre: v.it.nombre, ent, carpeta: 'alertas', subcarpeta });
          const etiqueta = `${nomMes} ${anio}`;
          const ya = als.find((a) => nrm(a.mes_consulta) === nrm(etiqueta));
          if (ya) { if (!String(ya.analisis || '').includes(v.it.nombre)) await S.update('alertas', ya.id, { analisis: [ya.analisis, `Soporte: ${v.it.nombre}`].filter(Boolean).join(' · ') }); }
          else als.push(await S.insert('alertas', { entidad_id: ent.id, mes_consulta: etiqueta, tipo_notificacion: 'Consulta periódica', agencia: 'INVIMA', responsable: st.emp.responsable || '', analisis: `Consulta realizada. Soporte: ${v.it.nombre}`, aplicabilidad: v.aplica, fecha_publicacion: null }));
          n++;
        }
        toast(`${n} consulta(s) organizadas en la bitácora`); A.recargar();
      } }] });
  };

  // ================================================================== ACTAS DE COMITÉ YA REALIZADAS (PDF)
  TV.detectarActa = (nombre, texto) => {
    const n = nrm(nombre), t = nrm(texto);
    const num = ((n.match(/acta\s*(?:n[°o.º]*|no\.?|numero)?\s*[:#]?\s*(\d{1,4})/) || t.match(/acta\s*(?:n[°o.º]*|no\.?|numero)\s*[:#]?\s*(\d{1,4})/) || [])[1]) || '';
    const mF = t.match(/fecha(?:\s+de\s+(?:la\s+)?reunion)?\s*[:]?\s*([0-9][0-9\/.\- a-z]{6,30})/);
    const fs = fechas(texto).concat(fechas(nombre));
    const fecha = (mF && fechas(mF[1])[0]) || fechas(nombre)[0] || [...fs].sort()[0] || '';
    const tm = (String(texto).match(/tema\s*(?:de\s+la\s+reuni[oó]n)?\s*[:]\s*([^\n]{5,120}?)(?=\s{2,}|objetivo|lugar|hora|fecha|$)/i) || [])[1] || '';
    return { numero: num ? String(num).padStart(3, '0') : '', fecha, tema: tm.trim() || 'Comité de tecnovigilancia', seguro: !!(num && fecha) };
  };
  TV.cargarActas = async (ent) => {
    const fl = await elegirPDFs(); if (!fl.length) return;
    const sub3 = await TV.subDestino(ent, 2);
    const items = fl.map((f) => ({ nombre: f.name, blob: f }));
    const pg = progreso(`0 de ${items.length}`);
    for (const [i, it] of items.entries()) { pg.set(`${i + 1} de ${items.length}: ${it.nombre}`); it.det = TV.detectarActa(it.nombre, await TV.textoPDF(it.blob, 2)); }
    pg.cerrar();
    modal({ titulo: `Actas de comité cargadas (${items.length})`, size: 'wide', cuerpo: `<p class="muted" style="font-size:.85rem">Revise el número, la fecha y el tema. Al guardar, cada acta queda registrada como realizada (cuenta para el indicador del comité) y el PDF se guarda en "${h(sub3)}/AÑO".</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Archivo</th><th>Acta No.</th><th>Fecha</th><th>Tema</th><th></th></tr></thead><tbody>${items.map((it, i) => `<tr data-i="${i}"><td style="max-width:240px;word-break:break-word">${h(it.nombre)}</td>
        <td><input data-k="numero" value="${h(it.det.numero)}" style="width:70px" aria-label="Número"></td><td><input type="date" data-k="fecha" value="${h(it.det.fecha)}" aria-label="Fecha"></td><td><input data-k="tema" value="${h(it.det.tema)}" aria-label="Tema" style="width:100%"></td>
        <td>${it.det.seguro ? '<span class="pill ok">Detectado</span>' : '<span class="pill warn">Revisar</span>'}</td></tr>`).join('')}</tbody></table></div>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar y organizar', cls: 'pri', fn: async (m) => {
        const vals = [...m.body.querySelectorAll('tr[data-i]')].map((tr) => { const o = {}; tr.querySelectorAll('[data-k]').forEach((x) => { o[x.dataset.k] = x.value.trim(); }); return { it: items[+tr.dataset.i], ...o }; });
        if (vals.some((v) => !v.fecha)) { toast('Indique la fecha de todas las actas', true); return false; }
        for (const v of vals) {
          const doc = await subirArchivo({ blob: v.it.blob, nombre: v.it.nombre, ent, carpeta: 'tecnovigilancia', subcarpeta: `${sub3}/${v.fecha.slice(0, 4)}` });
          await S.insert('actas_comite', { entidad_id: ent.id, numero: v.numero || '—', fecha: v.fecha, tema: v.tema, archivo: doc.archivo, documento_id: doc.id, datos: { tipo: 'Comité de tecnovigilancia', cargada_pdf: true, asistentes: [], compromisos: [] } });
        }
        toast(`${vals.length} acta(s) registradas como realizadas`); A.recargar();
      } }] });
  };
})();
