// =====================================================================
//  Módulos: registros generados, formularios y vistas de administración
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, confirmar, leer, f } = UI;
  const esProp = A.esProp;
  const anioAct = new Date().getFullYear();
  const nrmQ = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  // ------------------------------------------------------------ filas repetibles
  const rep = (id, cols, filas) => `<div class="repeat" data-rep="${id}">
      ${(filas.length ? filas : [{}]).map((r) => repFila(cols, r)).join('')}
      <button type="button" class="btn sm" data-addrep='${JSON.stringify(cols).replace(/'/g, '&#39;')}' style="justify-self:start">${I.mas} Agregar fila</button></div>`;
  const repFila = (cols, r = {}) => `<div class="ri" style="grid-template-columns:${cols.map((c) => c.w || '1fr').join(' ')} auto">${cols.map((c) => c.opts
    ? `<select data-k="${c.k}" aria-label="${h(c.ph)}">${c.opts.map((o) => `<option ${o === r[c.k] ? 'selected' : ''}>${h(o)}</option>`).join('')}</select>`
    : `<input data-k="${c.k}" placeholder="${h(c.ph)}" aria-label="${h(c.ph)}" value="${h(r[c.k] ?? '')}" ${c.type ? `type="${c.type}"` : ''}>`).join('')}<button type="button" class="icon-btn bad" data-delrep aria-label="Quitar fila">${I.x}</button></div>`;
  const repLeer = (root, id) => [...root.querySelectorAll(`[data-rep="${id}"] .ri`)].map((ri) => { const o = {}; ri.querySelectorAll('[data-k]').forEach((i) => { o[i.dataset.k] = i.value.trim(); }); return o; }).filter((o) => Object.values(o).some((v) => v && !['Pasa', 'No pasa', 'N/A'].includes(v)));
  const repBind = (root) => root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-addrep]'); if (a) { a.insertAdjacentHTML('beforebegin', repFila(JSON.parse(a.dataset.addrep))); return; }
    const d = e.target.closest('[data-delrep]'); if (d) { const box = d.closest('.repeat'); if (box.querySelectorAll('.ri').length > 1) d.closest('.ri').remove(); else d.closest('.ri').querySelectorAll('input').forEach((i) => (i.value = '')); }
  });

  // pestañas dentro de un modal
  const tabs = (lista) => `<div class="tabs" role="tablist">${lista.map((t, i) => `<button type="button" role="tab" data-tab="${i}" class="${i ? '' : 'on'}">${h(t)}</button>`).join('')}</div>`;
  const tabBind = (root) => root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    root.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('on', x === b));
    root.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== b.dataset.tab; });
  });

  const firmaBtn = (nombre, actual) => `<div class="field"><span class="lbl">${nombre}</span><div class="sig-prev" data-sigprev>${actual ? `<img src="${actual}" alt="Firma">` : '<span class="muted">Sin firma</span>'}</div><button type="button" class="btn sm" data-sig>${I.firma} Capturar firma</button></div>`;
  const firmaBind = (root, get, set, opts = {}) => root.querySelectorAll('[data-sig]').forEach((b, i) => {
    b.onclick = async () => { const d = await UI.pedirFirma({ titulo: opts.titulos?.[i] || 'Firma', actual: opts.actual?.[i] }); if (d) { set(i, d); b.previousElementSibling.innerHTML = `<img src="${d}" alt="Firma">`; } };
  });

  // =================================================================== GENERADORES DE CARPETA
  // ------------------------------------------------------------ Inventario
  A.G.inventario = async (el, { ent, sede: sedeCtx = null }) => {
    const [eqs, cons] = await Promise.all([S.list('equipos', { entidad_id: ent.id }, 'codigo_inv'), S.list('consultorios', { entidad_id: ent.id })]).then(([e, c]) => { const co = A.ordenar(c); const idx = (x) => co.findIndex((k) => k.id === x.consultorio_id); return [[...e].sort((a, b) => (idx(a) - idx(b)) || ((a.orden ?? 9999) - (b.orden ?? 9999)) || String(a.codigo_inv).localeCompare(String(b.codigo_inv))), co]; });
    let filtro = '', q = '', editar = false, sedeF = sedeCtx || '';
    const cn = (id) => cons.find((c) => c.id === id)?.nombre || '—';
    const sedeC = (c) => c?.sede || 'Sede principal';
    const sedesL = [...new Set(cons.map(sedeC))];
    const sedeDeEq = (e) => sedeC(cons.find((c) => c.id === e.consultorio_id));
    const visibles = () => eqs.filter((e) => (!sedeF || sedeDeEq(e) === sedeF) && (!filtro || e.consultorio_id === filtro) && (!q || nrmQ([e.codigo_inv, e.activo_fijo, e.nombre, e.marca, e.modelo, e.serie, e.ubicacion, e.registro_sanitario, cn(e.consultorio_id)].join(' ')).includes(q)));
    const pintar = () => {
      const lista = visibles();
      el.querySelector('[data-edit]')?.classList.toggle('pri', editar);
      el.querySelector('tbody').innerHTML = lista.map((e, i) => `<tr ${editar ? '' : `class="clic" data-act="abrirEq" data-id="${e.id}"`}>${A.COLS_EQ.map((c) => `<td class="${c.mono && !editar ? 'mono' : ''} ${c.k === 'item' ? 'num' : ''}">${editar ? A.celdaEdit(e, c.k, i, cons) : A.celdaVer(e, c.k, i, cons)}</td>`).join('')}<td>${A.estadoPill(e.estado)}</td></tr>`).join('') || '<tr><td colspan="11" class="empty">Sin equipos.</td></tr>';
      el.querySelector('[data-cuenta]').textContent = `${lista.length} de ${eqs.length} equipos`;
      if (editar) A.bindCeldas(el.querySelector('tbody'), eqs);
    };
    el.innerHTML = `<section class="panel"><header><div><h2>Equipos registrados por servicio</h2><span class="muted" style="font-size:.85rem">Se crean al cargar el inventario. Cada equipo queda dentro de su servicio en “3. Información del equipo”.</span></div><div class="actions">
        ${esProp() ? `<button class="btn pri" data-act="cargarInv">${I.subir} Cargar inventario (PDF o Excel)</button>` : ''}
        <button class="btn" data-act="invPDF">${I.pdf} PDF (FMB-001)</button>${esProp() ? `<button class="btn" data-act="invXLS">${I.excel} Excel</button>` : ''}${esProp() ? `<button class="btn" data-act="nuevoEq">${I.mas} Equipo</button>` : ''}</div></header>
      <div class="tbl-tools">${sedesL.length > 1 ? `<div class="field" style="min-width:170px"><select aria-label="Filtrar por sede" data-sedef><option value="">Todas las sedes</option>${sedesL.map((x) => `<option value="${h(x)}" ${sedeF === x ? 'selected' : ''}>${h(x)}</option>`).join('')}</select></div>` : ''}<div class="field" style="min-width:180px"><select aria-label="Filtrar por consultorio" data-filtro><option value="">Todos los consultorios</option>${cons.map((c) => `<option value="${c.id}">${h(c.nombre)}${sedesL.length > 1 ? ' · ' + h(sedeC(c)) : ''}</option>`).join('')}</select></div>
        <input type="search" data-q placeholder="Buscar código, equipo, marca, serie…" aria-label="Buscar en el inventario">
        <span class="muted" data-cuenta></span>
        ${esProp() ? `<span class="sp"></span><button class="btn" data-act="googleInv">${I.ia} Buscar con Google</button><button class="btn" data-act="editTabla" data-edit>${I.edit} Modificar datos</button><button class="btn" data-act="llenarNR">Completar vacíos con NO REGISTRA</button>` : ''}</div>
      ${esProp() ? '<p class="muted edit-hint" data-hint hidden>Modo edición: cambie cualquier dato y presione Enter o salga de la casilla para guardar. Escriba o elija <b>NO REGISTRA</b> cuando el dato no exista o <b>NO APLICA</b> cuando no corresponda (ej. equipos sin registro sanitario).</p>' : ''}
      ${A.datalistNR}
      <div class="tbl-wrap"><table class="tbl tbl-eq"><thead><tr>${A.COLS_EQ.map((c) => `<th style="min-width:${c.w}px">${c.t}</th>`).join('')}<th>Estado</th></tr></thead><tbody></tbody></table></div></section>`;
    pintar();
    el.querySelector('[data-filtro]').onchange = (e) => { filtro = e.target.value; pintar(); };
    const sf = el.querySelector('[data-sedef]');
    const ocultarCons = () => { const fs = el.querySelector('[data-filtro]'); [...fs.options].forEach((o) => { if (o.value) o.hidden = !!sedeF && sedeC(cons.find((c) => c.id === o.value)) !== sedeF; }); };
    if (sf) sf.onchange = (e) => { sedeF = e.target.value; filtro = ''; el.querySelector('[data-filtro]').value = ''; ocultarCons(); pintar(); };
    ocultarCons();
    let tq; el.querySelector('[data-q]').oninput = (e) => { clearTimeout(tq); tq = setTimeout(() => { q = nrmQ(e.target.value); pintar(); }, 150); };
    A.acts({
      editTabla: () => { editar = !editar; const hn = el.querySelector('[data-hint]'); if (hn) hn.hidden = !editar; pintar(); },
      llenarNR: () => A.completarNR(visibles(), pintar),
      googleInv: () => A.buscarGoogleInventario(ent, visibles()),
      abrirEq: (d) => A.go('equipo', { id: d.id }),
      nuevoEq: () => A.formEquipo({ entidad_id: ent.id, consultorio_id: filtro || cons[0]?.id }, cons),
      cargarInv: () => A.cargarInventario(ent),
      invPDF: async () => {
        const lista = visibles();
        const blob = await FMT.inventario({ ent, equipos: lista, consultorios: cons, fmt: st.fmt.inventario, cons: cons.find((c) => c.id === filtro) || (sedeF ? { sede: sedeF } : undefined) });
        S.log('CONSULTA', 'equipos', ent.id, 'Inventario PDF');
        UI.verPDF({ titulo: `Inventario${sedeF ? ' · ' + sedeF : ''}`, blob, nombre: `Inventario_${ent.razon_social}${sedeF ? '_' + sedeF : ''}.pdf` });
      },
      invXLS: () => {
        if (!esProp()) return;
        const lista = visibles(); const V = FMT.val;
        const aoa = [[`INVENTARIO · ${st.fmt.inventario.codigo} · Versión ${st.fmt.inventario.version}`], [ent.razon_social], [`NIT: ${ent.nit || ''}`, '', `REPS: ${ent.reps || ''}`], [],
          ['ÍTEM', 'CÓDIGO DE INV.', 'N° DE A.F.', 'EQUIPO', 'MARCA', 'MODELO', 'SERIE', 'UBICACIÓN / ÁREA', 'CLASIFICACIÓN POR RIESGO SANITARIO', 'REGISTRO SANITARIO O PERMISO DE COMERCIALIZACIÓN', 'ESTADO'],
          ...lista.map((e, i) => [(e.hv?.nr?.item ? FMT.NOREG : e.hv?.item) || i + 1, V(e, 'codigo_inv'), V(e, 'activo_fijo'), V(e, 'nombre'), V(e, 'marca'), V(e, 'modelo'), V(e, 'serie'), e.hv?.nr?.ubicacion ? FMT.marca(e, 'ubicacion') : `${cn(e.consultorio_id)}${e.ubicacion ? ' / ' + e.ubicacion : ''}`, e.hv?.nr?.clase_riesgo ? FMT.marca(e, 'clase_riesgo') : e.clase_riesgo || '', V(e, 'registro_sanitario'), e.estado])];
        const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = [6, 14, 12, 28, 16, 16, 16, 26, 12, 24, 14].map((w) => ({ wch: w }));
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'FMB-001');
        UI.descargar(new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Inventario_${ent.razon_social}.xlsx`);
        S.log('DESCARGA', 'equipos', ent.id, 'Inventario Excel');
      },
    });
  };

  // ------------------------------------------------------------ Cronogramas
  // Fechas de un ciclo que puede pasar de un año a otro: paso en meses desde (mes, año)
  //  alcance '12' = 12 meses, '24' = 24 meses, 'anio' = hasta diciembre del año de inicio
  A.fechasCiclo = (paso, mes, anio, alcance = '12') => {
    if (!paso) return [];
    const fin = alcance === 'anio' ? 12 - mes + 1 : +alcance || 12, r = [];
    for (let k = 0; k < fin; k += paso) { const abs = mes - 1 + k; r.push({ anio: anio + Math.floor(abs / 12), mes: (abs % 12) + 1 }); }
    return r;
  };
  A.planDesde = (per, mesIni = 1, semana = 2) => { const p = {}, paso = CAT.PERIODICIDAD[per] || 0; if (!paso) return p; for (let m = +mesIni; m <= 12; m += paso) p[`${m}-${semana}`] = 'P'; return p; };
  A.G.crono = async (el, { ent, sede: sedeCtx = null }, tipo) => {
    let anio = st.cronoAnio || anioAct;
    const [eqs, consAll] = await Promise.all([S.list('equipos', { entidad_id: ent.id }, 'codigo_inv'), S.list('consultorios', { entidad_id: ent.id })]);
    const cons = A.ordenar(consAll);
    const titulo = { mantenimiento: 'Cronograma de mantenimiento preventivo', metrologia: 'Cronograma de metrología y calibración', capacitacion: 'Cronograma de capacitación' }[tipo];
    const cap = tipo === 'capacitacion';
    const fk = `${ent.id}|${tipo}`; st.cronoF = st.cronoF || {}; const F = (st.cronoF[fk] = st.cronoF[fk] || { mes: 0, q: '', estado: '', editar: false, mesIni: 1, serv: '' });
    if (!F.mesIni) F.mesIni = 1;
    if (sedeCtx) F.serv = 'sede:' + sedeCtx;
    const eqd = (id) => eqs.find((e) => e.id === id) || {};
    const sedeC = (c) => c?.sede || 'Sede principal';
    const sedes = [...new Set(cons.map(sedeC))];
    const ordenEq = (() => { const idx = (x) => cons.findIndex((k) => k.id === x.consultorio_id); return (a, b) => (idx(a) - idx(b)) || ((a.orden ?? 9999) - (b.orden ?? 9999)) || String(a.codigo_inv || '').localeCompare(String(b.codigo_inv || '')); })();
    const mesDe = (c, m) => Object.entries(c?.plan || {}).filter(([k, v]) => v && +k.split('-')[0] === m).map(([k, v]) => ({ k, v }));
    const M3 = (m) => CAT.MESES[m - 1].slice(0, 3);
    const pintar = async () => {
      st.cronoAnio = anio;
      // Periodo de 12 meses: de enero a diciembre, o desde otro mes hasta el mismo mes del año siguiente (ej. oct 2026 – sep 2027)
      const ventana = [...Array(12).keys()].map((i) => { const abs = F.mesIni - 1 + i; return { y: anio + Math.floor(abs / 12), m: (abs % 12) + 1, p: i }; });
      const dosAnios = F.mesIni > 1;
      const yDe = (m) => ventana.find((v) => v.m === m).y;
      const fin = ventana[11];
      const periodoTxt = dosAnios ? `${M3(F.mesIni)} ${anio} – ${M3(fin.m)} ${fin.y}` : String(anio);
      const anios = dosAnios ? [anio, anio + 1] : [anio];
      const todos = (await Promise.all(anios.map((y) => S.list('cronogramas', { entidad_id: ent.id, tipo, anio: y })))).flat();
      // Una fila por equipo (o por tema de capacitación) con su programación de cada año del periodo
      const mapa = new Map();
      todos.forEach((c) => {
        const key = cap ? `t|${(c.tema || '').trim().toLowerCase()}|${c.equipo_id || ''}` : `e|${c.equipo_id || c.id}`;
        if (!mapa.has(key)) mapa.set(key, { key, equipo_id: c.equipo_id, tema: c.tema, cr: {} });
        const r = mapa.get(key); if (!r.cr[c.anio]) r.cr[c.anio] = c; if (!r.tema && c.tema) r.tema = c.tema;
      });
      const filas = [...mapa.values()].sort((a, b) => (cap ? String(a.tema || '').localeCompare(String(b.tema || '')) : ordenEq(eqd(a.equipo_id), eqd(b.equipo_id))));
      const mesF = (r, m) => mesDe(r.cr[yDe(m)], m);
      const mesAct = new Date().getMonth() + 1;
      const consDe = (r) => cons.find((x) => x.id === eqd(r.equipo_id).consultorio_id);
      const texto = (r) => { const e = eqd(r.equipo_id), c = consDe(r); return nrmQ([r.tema, e.codigo_inv, e.activo_fijo, e.nombre, e.marca, e.modelo, e.serie, e.ubicacion, e.registro_sanitario, c?.nombre, c?.sede].join(' ')); };
      const enServ = (r) => { if (!F.serv) return true; const c = consDe(r); if (F.serv.startsWith('sede:')) return !!c && sedeC(c) === F.serv.slice(5); return c?.id === F.serv; };
      const consSel = F.serv && !F.serv.startsWith('sede:') ? cons.find((c) => c.id === F.serv) : F.serv ? { sede: F.serv.slice(5), nombre: '' } : null;
      const delServ = filas.filter(enServ);
      const visibles = delServ.filter((r) => (!F.q || texto(r).includes(F.q)) && (!F.mes || mesF(r, F.mes).some((x) => !F.estado || x.v === F.estado)));
      const enMes = F.mes ? delServ.flatMap((r) => mesF(r, F.mes)) : [];
      const movibles = F.mes ? visibles.filter((r) => mesF(r, F.mes).some((x) => x.v !== 'E')).length : 0;
      const nFil = F.mes ? delServ.filter((r) => mesF(r, F.mes).length).length : 0;
      const mesTxt = F.mes ? `${CAT.MESES[F.mes - 1]} ${yDe(F.mes)}` : '';
      const resumen = F.mes ? `<div class="mes-res"><b>${mesTxt}:</b> <button class="btn sm" data-act="anio12">${F.anio12 ? 'Ver solo ' + CAT.MESES[F.mes - 1] : 'Ver todo el periodo'}</button> <span class="pill">${nFil} ${cap ? (nFil === 1 ? 'capacitación' : 'capacitaciones') : (nFil === 1 ? 'equipo' : 'equipos')}</span><span class="pill warn">${enMes.filter((x) => x.v === 'P').length} programados</span><span class="pill ok">${enMes.filter((x) => x.v === 'E').length} ejecutados</span><span class="pill bad">${enMes.filter((x) => x.v === 'N').length} no ejecutados</span>
        ${esProp() && !cap ? `<span class="sp"></span><span class="muted">Mover lo programado de ${CAT.MESES[F.mes - 1]} a</span><select data-mover-mes aria-label="Mes destino">${CAT.MESES.map((m, i) => `<option value="${i + 1}" ${i + 1 === (F.mes % 12) + 1 ? 'selected' : ''}>${m}</option>`).join('')}</select><select data-mover-sem aria-label="Semana destino">${[1, 2, 3, 4].map((s) => `<option ${s === 2 ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="btn sm" data-act="moverMes" ${movibles ? '' : 'disabled title="No hay semanas programadas sin ejecutar en este mes"'}>Mover (${movibles})</button>` : ''}</div>` : '';
      const colsInfo = cap ? [] : A.COLS_EQ;
      const posMes = F.mes ? ventana.find((v) => v.m === F.mes).p : -1;
      const vis = F.mes && !F.anio12 ? [ventana[posMes]] : ventana;
      const editar = F.editar && esProp() && !cap;
      const optServ = `<option value="">Todos los servicios</option>${sedes.map((sd) => {
        const lista = cons.filter((c) => sedeC(c) === sd).map((c) => `<option value="${c.id}" ${F.serv === c.id ? 'selected' : ''}>${h(c.nombre)}</option>`).join('');
        return sedes.length > 1 ? `<optgroup label="${h(sd)}"><option value="sede:${h(sd)}" ${F.serv === 'sede:' + sd ? 'selected' : ''}>Toda la sede ${h(sd)}</option>${lista}</optgroup>` : lista;
      }).join('')}`;
      el.innerHTML = `<section class="panel"><header><h2>${titulo}</h2><div class="actions">
          <button class="btn sm" data-act="anio" data-d="-1" aria-label="Periodo anterior">‹</button><b class="num" style="align-self:center">${periodoTxt}</b><button class="btn sm" data-act="anio" data-d="1" aria-label="Periodo siguiente">›</button>
          <button class="btn" data-act="cronoPDF">${I.pdf} PDF${F.mes || F.q || F.serv ? ' (filtrado)' : ''}</button>
          ${esProp() ? `${cap ? '' : `<button class="btn" data-act="generar">${I.cal} Generar desde periodicidad</button>`}<button class="btn pri" data-act="agregar">${I.mas} ${cap ? 'Capacitación' : 'Equipo'}</button>` : ''}</div></header>
        <div class="crono-tabs" role="tablist" aria-label="Periodo">
          <button role="tab" class="ctab ${!dosAnios ? 'on' : ''}" data-act="periodo" data-v="1">Año ${anio} (ene – dic)</button>
          <button role="tab" class="ctab ${dosAnios ? 'on' : ''}" data-act="periodo" data-v="${dosAnios ? F.mesIni : (new Date().getMonth() + 1 > 1 ? new Date().getMonth() + 1 : 7)}">Entre dos años${dosAnios ? `: ${periodoTxt}` : ''}</button>
          ${dosAnios ? `<label class="ctab-sel">Desde <select data-ini aria-label="Mes de inicio del periodo">${CAT.MESES.map((m, i) => (i ? `<option value="${i + 1}" ${F.mesIni === i + 1 ? 'selected' : ''}>${m} ${anio}</option>` : '')).join('')}</select></label>` : ''}
        </div>
        <div class="tbl-tools">
          <div class="field" style="min-width:190px"><select data-serv aria-label="Consultar por servicio">${optServ}</select></div>
          <div class="field"><select data-mes aria-label="Buscar por mes"><option value="0">Buscar por mes: todos</option>${ventana.map((v) => `<option value="${v.m}" ${F.mes === v.m ? 'selected' : ''}>${CAT.MESES[v.m - 1]}${dosAnios ? ' ' + v.y : ''}</option>`).join('')}</select></div>
          ${F.mes ? `<div class="field"><select data-estado aria-label="Estado en el mes"><option value="">Cualquier estado</option><option value="P" ${F.estado === 'P' ? 'selected' : ''}>Programado</option><option value="E" ${F.estado === 'E' ? 'selected' : ''}>Ejecutado</option><option value="N" ${F.estado === 'N' ? 'selected' : ''}>No ejecutado</option></select></div>` : ''}
          <input type="search" data-q value="${h(F.qRaw || '')}" placeholder="Buscar código, equipo, serie…" aria-label="Buscar en el cronograma">
          <span class="muted">${visibles.length} de ${filas.length}</span>
          ${esProp() && !cap ? `<span class="sp"></span><button class="btn ${editar ? 'pri' : ''}" data-act="editTabla">${I.edit} Modificar datos</button><button class="btn" data-act="llenarNR">Completar vacíos con NO REGISTRA</button>` : ''}</div>
        ${resumen}
        <div class="legend"><span><i style="background:#f6cf5e"></i>Programado</span><span><i style="background:#5dbb7a"></i>Ejecutado</span><span><i style="background:#e5705f"></i>No ejecutado / reprogramado</span>${esProp() ? `<span>Toque una semana para cambiar su estado${cap ? '' : ' · botón ✎ de cada fila para cambiar los meses'}.</span>` : ''}</div>
        ${editar ? '<p class="muted edit-hint">Modo edición: los cambios de Ítem, código, A.F., equipo, marca, modelo, serie, ubicación, riesgo y registro sanitario se guardan en el equipo (también cambian en el inventario y la hoja de vida). Escriba o elija <b>NO REGISTRA</b> cuando el dato no exista o <b>NO APLICA</b> cuando no corresponda (ej. equipos sin registro sanitario).</p>' : ''}
        ${A.datalistNR}
        ${visibles.length ? `<div class="crono-wrap"><table class="crono ${esProp() ? 'edit' : ''} ${editar ? 'editando' : ''}"><thead>
          ${dosAnios && vis.length > 1 ? `<tr>${cap ? '<th colspan="3"></th>' : `<th colspan="${colsInfo.length}"></th>`}${anios.map((y) => { const n = vis.filter((v) => v.y === y).length; return n ? `<th colspan="${n * 4}" class="crono-anio">AÑO ${y}</th>` : ''; }).join('')}${esProp() ? '<th></th>' : ''}</tr>` : ''}
          <tr>${cap ? '<th rowspan="2">Ítem</th><th rowspan="2">Tema</th><th rowspan="2">Equipo</th>' : colsInfo.map((c) => `<th rowspan="2" style="min-width:${editar ? c.w : 0}px">${c.t}</th>`).join('')}${vis.map((v) => { const m = CAT.MESES[v.m - 1]; return `<th colspan="4" class="${F.mes === v.m ? 'mes-sel' : ''}" data-act="verMes" data-m="${v.m}" style="cursor:pointer" title="${F.mes === v.m ? 'Quitar filtro' : 'Filtrar ' + m + ' ' + v.y}">${vis.length === 1 ? `${m.toUpperCase()} ${v.y}` : m.slice(0, 3)}</th>`; }).join('')}${esProp() ? '<th rowspan="2"></th>' : ''}</tr>
          <tr>${vis.map((v) => [1, 2, 3, 4].map((s) => `<th class="${F.mes === v.m ? 'mes-sel' : ''}" style="font-size:.66rem;padding:2px">${s}</th>`).join('')).join('')}</tr></thead><tbody>
          ${visibles.map((r) => { const e = eqd(r.equipo_id); const i = filas.indexOf(r); return `<tr>${cap ? `<td class="num">${i + 1}</td><td>${h(r.tema || '')}</td><td>${h(e.nombre || '—')}</td>` : colsInfo.map((col) => `<td class="${col.mono && !editar ? 'mono' : ''}">${e.id ? (editar ? A.celdaEdit(e, col.k, i, cons) : A.celdaVer(e, col.k, i, cons)) : ''}</td>`).join('')}
            ${vis.map((v) => [1, 2, 3, 4].map((s) => { const val = (r.cr[v.y]?.plan || {})[`${v.m}-${s}`] || ''; return `<td class="w ${val} ${v.y === anioAct && v.m === mesAct ? 'now' : ''} ${F.mes === v.m ? 'mes-sel' : ''} ${dosAnios && v.p === 12 - F.mesIni + 1 && s === 1 ? 'y-ini' : ''}" ${esProp() ? `data-act="celda" data-r="${i}" data-y="${v.y}" data-k="${v.m}-${s}"` : ''} title="${CAT.MESES[v.m - 1]} ${v.y} · semana ${s}">${val}</td>`; }).join('')).join('')}
            ${esProp() ? `<td style="white-space:nowrap">${cap ? '' : `<button class="icon-btn" data-act="meses" data-r="${i}" aria-label="Cambiar meses" title="Cambiar meses">${I.edit}</button>`}<button class="icon-btn bad" data-act="quitar" data-r="${i}" aria-label="Quitar fila">${I.del}</button></td>` : ''}</tr>`; }).join('')}
          </tbody></table></div>` : `<div class="empty">${filas.length ? 'Ningún registro coincide con la búsqueda o el servicio elegido.' : `No hay cronograma para ${periodoTxt}.${esProp() && !cap ? ' Use “Generar desde periodicidad” para crearlo automáticamente con la frecuencia de cada equipo.' : ''}`}</div>`}</section>`;
      el.querySelector('[data-mes]').onchange = (ev) => { F.mes = +ev.target.value; if (!F.mes) F.estado = ''; pintar(); };
      el.querySelector('[data-serv]').onchange = (ev) => { F.serv = ev.target.value; pintar(); };
      const ini = el.querySelector('[data-ini]'); if (ini) ini.onchange = (ev) => { F.mesIni = +ev.target.value; F.mes = 0; pintar(); };
      const es = el.querySelector('[data-estado]'); if (es) es.onchange = (ev) => { F.estado = ev.target.value; pintar(); };
      let tq; const qi = el.querySelector('[data-q]'); qi.oninput = () => { clearTimeout(tq); tq = setTimeout(() => { F.qRaw = qi.value; F.q = nrmQ(qi.value); pintar().then(() => { const n = el.querySelector('[data-q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }); }, 250); };
      if (editar) A.bindCeldas(el.querySelector('tbody'), eqs);
      if (F.mes && F.anio12) { const th = el.querySelector('th.mes-sel'); const w = el.querySelector('.crono-wrap'); if (th && w) w.scrollLeft = Math.max(0, th.offsetLeft - w.clientWidth / 2); }
      // crono de una fila para un año (lo crea si aún no existe)
      const cronoDe = async (r, y) => {
        if (r.cr[y]) return r.cr[y];
        const nv = await S.insert('cronogramas', { entidad_id: ent.id, equipo_id: r.equipo_id || null, tipo, anio: y, tema: r.tema || null, plan: {} });
        r.cr[y] = nv; return nv;
      };
      A.acts({
        anio: (d) => { anio += +d.d; pintar(); },
        periodo: (d) => { F.mesIni = +d.v; F.mes = 0; F.estado = ''; pintar(); },
        verMes: (d) => { F.mes = F.mes === +d.m ? 0 : +d.m; if (!F.mes) F.estado = ''; pintar(); },
        editTabla: () => { F.editar = !F.editar; pintar(); },
        anio12: () => { F.anio12 = !F.anio12; pintar(); },
        llenarNR: () => A.completarNR([...new Set(visibles.map((r) => eqd(r.equipo_id)).filter((e) => e.id))], pintar),
        celda: async (d, b) => {
          const r = filas[+d.r]; const y = +d.y; const orden = ['', 'P', 'E', 'N'];
          const actual = r.cr[y]?.plan?.[d.k] || '';
          const nv = orden[(orden.indexOf(actual) + 1) % 4];
          const c = await cronoDe(r, y);
          const plan = { ...(c.plan || {}) }; if (nv) plan[d.k] = nv; else delete plan[d.k];
          c.plan = plan; b.classList.remove('P', 'E', 'N'); if (nv) b.classList.add(nv); b.textContent = nv;
          await S.update('cronogramas', c.id, { plan });
        },
        meses: async (d) => {
          const r = filas[+d.r]; const e = eqd(r.equipo_id);
          const abrir = async (y) => A.cambiarMeses(await cronoDe(r, y), e, tipo, pintar, y);
          if (!dosAnios) return abrir(anio);
          modal({ titulo: '¿Qué año desea modificar?', size: 'sm', cuerpo: `<p>${h(e.codigo_inv || '')} ${h(e.nombre || '')}: el periodo ${h(periodoTxt)} tiene meses de dos años.</p>`,
            acciones: [{ t: 'Cancelar' }, ...anios.map((y) => ({ t: `Año ${y}`, cls: y === anio ? 'pri' : '', fn: () => { abrir(y); } }))] });
        },
        moverMes: async () => {
          const destino = +el.querySelector('[data-mover-mes]').value, sem = +el.querySelector('[data-mover-sem]').value;
          if (destino === F.mes) { toast('Elija un mes distinto', true); return; }
          const y = yDe(F.mes);
          const afect = visibles.filter((r) => mesF(r, F.mes).some((x) => x.v !== 'E'));
          if (!afect.length) { toast('No hay semanas programadas o no ejecutadas para mover en ese mes', true); return; }
          if (!(await confirmar(`Se moverá lo programado (no ejecutado) de ${CAT.MESES[F.mes - 1]} ${y} a ${CAT.MESES[destino - 1]} ${y} semana ${sem} en ${afect.length} ${afect.length === 1 ? 'fila' : 'filas'}. Lo ejecutado no se toca.`, 'Mover'))) return;
          for (const r of afect) {
            const c = r.cr[y]; const plan = { ...(c.plan || {}) };
            mesDe(c, F.mes).filter((x) => x.v !== 'E').forEach((x) => delete plan[x.k]);
            if (!mesDe({ plan }, destino).length) plan[`${destino}-${sem}`] = 'P';
            await S.update('cronogramas', c.id, { plan });
          }
          toast(`Programación movida a ${CAT.MESES[destino - 1]}`); F.mes = destino; pintar();
        },
        quitar: async (d) => {
          const r = filas[+d.r]; const lista = Object.values(r.cr);
          if (!(await confirmar(`¿Quitar esta fila del cronograma${lista.length > 1 ? ` (años ${Object.keys(r.cr).join(' y ')})` : ''}?`))) return;
          for (const c of lista) await S.remove('cronogramas', c.id); pintar();
        },
        cronoPDF: async () => {
          const etiqueta = `${titulo} ${periodoTxt}${F.mes ? ' · ' + mesTxt : ''}${consSel ? ' · ' + (consSel.nombre || consSel.sede) : ''}`;
          const blob = await FMT.cronograma({ ent, tipo, anio, filas: visibles, ventana, equipos: eqs, fmt: st.fmt.cronograma, titulo, consultorios: cons, cons: consSel });
          S.log('CONSULTA', 'cronogramas', ent.id, etiqueta);
          UI.verPDF({ titulo: etiqueta, blob, nombre: `Cronograma_${tipo}_${periodoTxt.replace(/\s+/g, '')}${F.mes ? '_' + CAT.MESES[F.mes - 1] : ''}${consSel ? '_' + (consSel.nombre || consSel.sede).replace(/\s+/g, '_') : ''}.pdf` });
        },
        generar: () => modal({
          titulo: 'Generar cronograma automáticamente', size: 'sm',
          cuerpo: `<div class="form"><p class="muted">Programa cada equipo activo según su periodicidad de ${tipo === 'metrologia' ? 'metrología' : 'mantenimiento'}. El ciclo puede pasar al año siguiente: por ejemplo, un equipo <b>semestral</b> que empieza en <b>octubre de ${anio}</b> queda programado también en <b>abril de ${anio + 1}</b>.</p>
            <div class="fields">${f.sel('mes', 'Mes de inicio', CAT.MESES.map((m, i) => [i + 1, m]), F.mes || new Date().getMonth() + 1)}${f.sel('anioIni', 'Año de inicio', [anio - 1, anio, anio + 1].map((y) => [y, y]), anio)}${f.sel('sem', 'Semana', [1, 2, 3, 4], 2)}
            ${f.sel('alcance', 'Programar', [['12', '12 meses desde el mes de inicio (puede pasar al año siguiente)'], ['24', '24 meses desde el mes de inicio'], ['anio', 'Solo hasta diciembre del año de inicio']], '12', { full: true })}</div>
            <label class="checks" style="margin-top:8px"><input type="checkbox" name="incluir" data-single checked> Incluir los equipos que ya están en el cronograma (se agregan las fechas que falten; no se borra nada de lo programado o ejecutado)</label>
            <p class="muted" data-gprev style="font-size:.85rem;margin-top:8px"></p></div>`,
          alAbrir: (m) => {
            const prev = () => {
              const d = leer(m.body); const ej = A.fechasCiclo(6, +d.mes, +d.anioIni, d.alcance);
              m.body.querySelector('[data-gprev]').innerHTML = `Ejemplo semestral: ${ej.map((x) => `<b>${CAT.MESES[x.mes - 1]} ${x.anio}</b>`).join(', ')}.`;
            };
            m.body.addEventListener('change', prev); prev();
          },
          acciones: [{ t: 'Cancelar' }, { t: 'Generar', cls: 'pri', fn: async (m) => {
            const d = leer(m.body); const anioIni = +d.anioIni, sem = +d.sem;
            let nNuevo = 0, nAct = 0; const anios = new Set();
            const cache = {};
            const delAnio = async (y) => (cache[y] = cache[y] || await S.list('cronogramas', { entidad_id: ent.id, tipo, anio: y }));
            for (const e of eqs.filter((x) => x.estado !== 'Dado de baja')) {
              const paso = CAT.PERIODICIDAD[tipo === 'metrologia' ? e.periodicidad_metro : e.periodicidad_mto]; if (!paso) continue;
              const porAnio = {};
              A.fechasCiclo(paso, +d.mes, anioIni, d.alcance).forEach((x) => { (porAnio[x.anio] = porAnio[x.anio] || []).push(x.mes); });
              for (const [yS, meses] of Object.entries(porAnio)) {
                const y = +yS, lista = await delAnio(y), c = lista.find((k) => k.equipo_id === e.id);
                if (c && !d.incluir) continue;
                const plan = { ...(c?.plan || {}) }; let cambio = false;
                meses.forEach((mm) => {
                  // si ese mes ya tiene algo (en cualquier semana) no se toca
                  if (Object.entries(plan).some(([k, v]) => v && +k.split('-')[0] === mm)) return;
                  plan[`${mm}-${sem}`] = 'P'; cambio = true;
                });
                if (!cambio) continue;
                if (c) { const u = await S.update('cronogramas', c.id, { plan }); Object.assign(c, u || { plan }); nAct++; }
                else { const nv = await S.insert('cronogramas', { entidad_id: ent.id, equipo_id: e.id, tipo, anio: y, plan }); lista.push(nv); nNuevo++; }
                anios.add(y);
              }
            }
            const ys = [...anios].sort();
            if (ys.length > 1 || +d.mes > 1) { F.mesIni = +d.mes; anio = anioIni; } else if (ys.length) anio = ys[0];
            toast(nNuevo || nAct ? `Cronograma generado${ys.length ? ' en ' + ys.join(' y ') : ''}: ${nNuevo} filas nuevas, ${nAct} equipos actualizados` : 'Todos los equipos ya tenían esas fechas programadas');
            pintar();
          } }],
        }),
        agregar: () => modal({
          titulo: cap ? 'Agregar capacitación' : 'Agregar equipo al cronograma', size: 'sm',
          cuerpo: `<div class="form">${cap ? f.input('tema', 'Tema de la capacitación *', '') : ''}${f.sel('equipo_id', cap ? 'Equipo relacionado (opcional)' : 'Equipo', [...(cap ? [['', '— Ninguno —']] : []), ...eqs.filter((e) => e.estado !== 'Dado de baja').map((e) => [e.id, `${e.codigo_inv} · ${e.nombre}`])], '')}</div>`,
          acciones: [{ t: 'Cancelar' }, { t: 'Agregar', cls: 'pri', fn: async (m) => {
            const d = leer(m.body); if (cap && !d.tema) { toast('Escriba el tema', true); return false; }
            const e = eqs.find((x) => x.id === d.equipo_id);
            const plan = !cap && e ? A.planDesde(tipo === 'metrologia' ? e.periodicidad_metro : e.periodicidad_mto, 1, 2) : {};
            await S.insert('cronogramas', { entidad_id: ent.id, equipo_id: d.equipo_id || null, tipo, anio, tema: d.tema || null, plan }); pintar();
          } }],
        }),
      });
    };
    await pintar();
  };

  // Cambiar los meses programados de una fila del cronograma
  A.cambiarMeses = (c, e, tipo, alGuardar, y = c?.anio) => {
    const meses = (p) => new Set(Object.entries(p || {}).filter(([, v]) => v).map(([k]) => +k.split('-')[0]));
    const act = meses(c.plan);
    const perAct = tipo === 'metrologia' ? e.periodicidad_metro : e.periodicidad_mto;
    const estadoMes = (m) => { const x = Object.entries(c.plan || {}).find(([k, v]) => v && +k.split('-')[0] === m); return x ? { P: 'Programado', E: 'Ejecutado', N: 'No ejecutado' }[x[1]] + ` · sem ${x[0].split('-')[1]}` : ''; };
    modal({
      titulo: `Cambiar meses${y ? ' ' + y : ''} · ${e.codigo_inv || ''} ${e.nombre || ''}`, size: 'sm',
      cuerpo: `<div class="form"><p class="muted">Marque los meses en que se hará ${tipo === 'metrologia' ? 'la calibración' : 'el mantenimiento'}. Los meses ya ejecutados conservan su estado.</p>
        <div class="mes-grid">${CAT.MESES.map((m, i) => `<label class="mes-chk ${act.has(i + 1) ? 'on' : ''}"><input type="checkbox" name="mes" value="${i + 1}" ${act.has(i + 1) ? 'checked' : ''}><b>${m}</b><small>${h(estadoMes(i + 1))}</small></label>`).join('')}</div>
        <div class="fields">${f.sel('sem', 'Semana para los meses nuevos', [1, 2, 3, 4], 2)}</div>
        <fieldset><legend>O calcular con una periodicidad</legend><div class="fields">${f.sel('per', 'Periodicidad', Object.keys(CAT.PERIODICIDAD).filter((p) => CAT.PERIODICIDAD[p]), CAT.PERIODICIDAD[perAct] ? perAct : 'Semestral')}${f.sel('ini', 'Mes de inicio', CAT.MESES.map((m, i) => [i + 1, m]), Math.min(...[...act, 13]) <= 12 ? Math.min(...act) : 1)}</div>
        <button type="button" class="btn sm" data-calc>Marcar meses con esta periodicidad</button><label class="checks" style="margin-top:6px"><input type="checkbox" name="guardar_per" data-single> Guardar también esta periodicidad en el equipo</label></fieldset></div>`,
      alAbrir: (m) => {
        const sync = () => m.body.querySelectorAll('.mes-chk').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked));
        m.body.addEventListener('change', sync);
        m.body.querySelector('[data-calc]').onclick = () => {
          const per = m.body.querySelector('[name=per]').value, ini = +m.body.querySelector('[name=ini]').value, paso = CAT.PERIODICIDAD[per];
          m.body.querySelectorAll('[name=mes]').forEach((x) => { const n = +x.value; x.checked = n >= ini && (n - ini) % paso === 0; });
          sync();
        };
      },
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar meses', cls: 'pri', fn: async (m) => {
        const d = leer(m.body); const sel = new Set(d.mes.map(Number)); const plan = {};
        Object.entries(c.plan || {}).forEach(([k, v]) => { if (v && sel.has(+k.split('-')[0])) plan[k] = v; });
        sel.forEach((n) => { if (!Object.keys(plan).some((k) => +k.split('-')[0] === n)) plan[`${n}-${d.sem}`] = 'P'; });
        await S.update('cronogramas', c.id, { plan }); c.plan = plan;
        if (d.guardar_per && e.id) await S.update('equipos', e.id, { [tipo === 'metrologia' ? 'periodicidad_metro' : 'periodicidad_mto']: d.per });
        toast('Meses actualizados'); alGuardar?.();
      } }],
    });
  };

  // Marca como ejecutada la semana del cronograma correspondiente a una fecha
  A.marcarCrono = async (eq, tipo, fecha) => {
    const d = new Date(fecha + 'T12:00:00'), anio = d.getFullYear(), mes = d.getMonth() + 1, sem = Math.min(4, Math.ceil(d.getDate() / 7));
    let c = (await S.list('cronogramas', { entidad_id: eq.entidad_id, equipo_id: eq.id, tipo, anio }))[0];
    if (!c) c = await S.insert('cronogramas', { entidad_id: eq.entidad_id, equipo_id: eq.id, tipo, anio, plan: A.planDesde(tipo === 'metrologia' ? eq.periodicidad_metro : eq.periodicidad_mto, 1, 2) });
    const plan = { ...(c.plan || {}) };
    const k = Object.keys(plan).find((x) => +x.split('-')[0] === mes && ['P', 'N'].includes(plan[x])) || `${mes}-${sem}`;
    plan[k] = 'E';
    await S.update('cronogramas', c.id, { plan });
  };

  // ------------------------------------------------------------ Hoja de vida (carpeta)
  A.G.hoja_vida = async (el, { ent, eq }) => {
    const [cons, mtos] = await Promise.all([S.list('consultorios', { entidad_id: ent.id }), S.list('mantenimientos', { equipo_id: eq.id }, '-fecha')]);
    const c = cons.find((x) => x.id === eq.consultorio_id);
    el.innerHTML = `<section class="panel"><header><h2>Hoja de vida ${h(st.fmt.hoja_vida.codigo)}</h2><div class="actions"><button class="btn" data-act="pdfHV">${I.pdf} Ver hoja de vida</button>${esProp() ? `<button class="btn pri" data-act="editHV">${I.edit} Editar hoja de vida</button>` : ''}</div></header>
      <p class="muted">Documento de identidad del equipo: identificación, registro histórico de adquisición, datos técnicos de instalación y funcionamiento, apoyo técnico, accesorios, anexos y programación de mantenimiento y metrología. Se actualiza automáticamente con cada intervención registrada (${mtos.length} en el historial).</p></section>
      <section class="panel" data-hvdocs><div class="loading">Cargando documentos…</div></section>`;
    A.acts({ pdfHV: () => A.verHojaVida(eq, ent, c, mtos), editHV: () => A.formHojaVida(eq, cons) });
    await A.panelDocsHV(el.querySelector('[data-hvdocs]'), { ent, eq, cons: c });
  };

  // ------------------------------------------------------------ Mantenimientos (carpeta)
  A.G.mto = async (el, { ent, eq }, tipo) => {
    const [cons, mtos] = await Promise.all([S.list('consultorios', { entidad_id: ent.id }), S.list('mantenimientos', { equipo_id: eq.id, tipo }, '-fecha')]);
    const c = cons.find((x) => x.id === eq.consultorio_id);
    const nom = { preventivo: 'Reportes de mantenimiento preventivo', correctivo: 'Reportes de mantenimiento correctivo', metrologia: 'Registros de metrología y calibración' }[tipo];
    const firmable = tipo !== 'metrologia';
    const valida = firmable ? await Promise.all(mtos.map((m) => A.verificarFirma(m))) : [];
    const pillFirma = (m, i) => (!firmable ? '' : valida[i] === true ? `<span class="pill ok" title="Código ${h(m.datos.firma_digital.hash)}">Firmado digitalmente</span>` : valida[i] === false ? '<span class="pill warn" title="El reporte cambió después de firmarse">Firma desactualizada</span>' : '<span class="pill">Sin firma digital</span>');
    el.innerHTML = `<section class="panel"><header><h2>${nom}</h2>${esProp() ? `<button class="btn pri" data-act="nuevo_${tipo}">${I.mas} Nuevo reporte</button>` : ''}</header>
      ${mtos.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Reporte N°</th><th>Fecha</th><th>${tipo === 'metrologia' ? 'Certificado / resultado' : 'Resumen'}</th><th>Estado final</th>${firmable ? '<th>Firma</th>' : ''}<th></th></tr></thead><tbody>
        ${mtos.map((m, i) => `<tr class="clic" data-act="ver_${tipo}" data-id="${m.id}"><td class="mono">${h(m.numero || '')}</td><td class="num">${UI.fecha(m.fecha)}</td><td>${h(tipo === 'metrologia' ? `${m.datos?.certificado || ''} · ${m.datos?.resultado || ''}` : (m.datos?.falla || m.datos?.observaciones || '').slice(0, 90))}</td>
          <td>${(m.datos?.valoracion || []).includes('No usar, retirar del servicio') ? '<span class="pill bad">Retirar del servicio</span>' : m.datos?.resultado === 'No conforme' ? '<span class="pill bad">No conforme</span>' : '<span class="pill ok">En funcionamiento</span>'}</td>${firmable ? `<td>${pillFirma(m, i)}</td>` : ''}
          <td><div class="row-actions"><button class="icon-btn" data-act="ver_${tipo}" data-id="${m.id}" aria-label="Ver PDF">${I.pdf}</button>${esProp() && firmable ? `<button class="icon-btn" data-act="firmar_${tipo}" data-id="${m.id}" aria-label="Firmar digitalmente" title="Firmar digitalmente">${I.firma}</button>` : ''}${esProp() ? `<button class="icon-btn" data-act="edit_${tipo}" data-id="${m.id}" aria-label="Editar">${I.edit}</button><button class="icon-btn bad" data-act="del_${tipo}" data-id="${m.id}" aria-label="Eliminar">${I.del}</button>` : ''}</div></td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty">Aún no hay reportes registrados.</div>'}</section>`;
    A.acts({
      [`nuevo_${tipo}`]: () => A.formMto({ eq, ent, cons: c, tipo }),
      [`ver_${tipo}`]: (d) => A.verMto(mtos.find((m) => m.id === d.id), eq, ent, c),
      [`edit_${tipo}`]: (d) => A.formMto({ eq, ent, cons: c, tipo, m: mtos.find((m) => m.id === d.id) }),
      [`firmar_${tipo}`]: (d) => A.firmarReporte(mtos.find((m) => m.id === d.id), eq, ent, c),
      [`del_${tipo}`]: async (d) => { if (await confirmar('¿Eliminar este reporte?')) { await S.remove('mantenimientos', d.id); toast('Reporte eliminado'); A.recargar(); } },
    });
  };
  // 1. MANTENIMIENTOS: preventivos y correctivos en la misma carpeta
  A.G.mtos = async (el, ctx) => {
    el.innerHTML = '<div data-p="preventivo"></div><div data-p="correctivo"></div>';
    await A.G.mto(el.querySelector('[data-p=preventivo]'), ctx, 'preventivo');
    await A.G.mto(el.querySelector('[data-p=correctivo]'), ctx, 'correctivo');
  };
  // 2. CRONOGRAMAS: mantenimiento, metrología y capacitación
  A.G.cronogramas = async (el, ctx) => {
    const tipos = [['mantenimiento', 'Mantenimiento preventivo'], ['metrologia', 'Metrología'], ['capacitacion', 'Capacitación']];
    const act = st.cronoTab || 'mantenimiento';
    el.innerHTML = `<div class="tabs">${tipos.map(([k, t]) => `<button data-act="tabCrono" data-k="${k}" class="${k === act ? 'on' : ''}">${t}</button>`).join('')}</div><div data-crono></div>`;
    await A.G.crono(el.querySelector('[data-crono]'), ctx, act);
    const subDe = { mantenimiento: CAT.SUBS_CRONO[0], metrologia: CAT.SUBS_CRONO[1], capacitacion: CAT.SUBS_CRONO[2] };
    st.subSel = st.subSel || {}; st.subSel[`${ctx.ent.id}||cronogramas`] = subDe[act];
    A.acts({ tabCrono: (d) => { st.cronoTab = d.k; A.recargar(); } });
  };
  A.verMto = async (m, eq, ent, cons) => {
    const fmt = st.fmt[m.tipo === 'metrologia' ? 'metrologia' : 'mto_' + m.tipo];
    const blob = await (m.tipo === 'preventivo' ? FMT.mtoPreventivo : m.tipo === 'correctivo' ? FMT.mtoCorrectivo : FMT.metrologia)({ m, eq, ent, cons, fmt });
    S.log('CONSULTA', 'mantenimientos', m.id, `Reporte ${m.numero}`);
    UI.verPDF({ titulo: `Reporte ${m.numero} · ${eq.nombre}`, blob, nombre: `Reporte_${m.tipo}_${m.numero}_${eq.codigo_inv}.pdf`, alDescargar: () => S.log('DESCARGA', 'mantenimientos', m.id, `Reporte ${m.numero}`) });
  };

  // ------------------------------------------------------------ Actas (carpeta)
  A.G.acta = async (el, { ent, eq }, tipo) => {
    el.innerHTML = `<section class="panel"><header><h2>${tipo === 'baja' ? 'Acta de baja' : 'Acta de entrega'} <span class="muted mono" style="font-size:.85rem">${h(st.fmt['acta_' + tipo].codigo)}</span></h2>${esProp() ? `<button class="btn pri" data-act="acta">${I.mas} Generar acta</button>` : ''}</header>
      <p class="muted">${tipo === 'baja' ? 'Genera el acta en el formato IBCOL. Los equipos incluidos quedan en estado “Dado de baja” y el acta se guarda en la carpeta “9. Acta baja” de cada uno.' : 'Genera el acta de entrega en el formato IBCOL y la guarda en la carpeta “10. Acta entrega” de cada equipo incluido.'}</p></section>`;
    A.acts({ acta: () => A.formActa({ ent, eq, tipo }) });
  };

  // ------------------------------------------------------------ Tecnovigilancia
  A.G.eventos = async (el, { ent }) => {
    const [evs, eqs] = await Promise.all([S.list('eventos', { entidad_id: ent.id }, '-fecha_evento'), S.list('equipos', { entidad_id: ent.id })]);
    const eqd = (id) => eqs.find((e) => e.id === id);
    const plazo = (ev) => { const lim = new Date(new Date(ev.fecha_evento).getTime() + 72 * 36e5); const hrs = Math.round((lim - new Date()) / 36e5); return hrs > 0 ? `<span class="pill warn">Notificar en ${hrs} h</span>` : '<span class="pill bad">Plazo de 72 h vencido</span>'; };
    el.innerHTML = `<section class="panel"><header><h2>Reportes de eventos e incidentes adversos</h2>${esProp() ? `<button class="btn pri" data-act="nuevoEv">${I.alerta} Reportar evento</button>` : ''}</header>
      <p class="muted">Los eventos con consecuencia de muerte o deterioro grave bloquean automáticamente el equipo (“Fuera de servicio”) y deben reportarse al Programa Nacional de Tecnovigilancia del INVIMA dentro de las 72 horas. Los demás se reportan en el consolidado periódico.</p>
      ${evs.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Equipo</th><th>Servicio</th><th>Consecuencia</th><th>Estado</th><th></th></tr></thead><tbody>
        ${evs.map((ev) => { const e = eqd(ev.equipo_id); const grave = ['Muerte', 'Deterioro grave'].includes(ev.consecuencia); return `<tr class="clic" data-act="verEv" data-id="${ev.id}"><td class="num">${UI.fechaHora(ev.fecha_evento)}</td><td>${e ? `<span class="mono">${h(e.codigo_inv)}</span> ${h(e.nombre)}` : '—'}</td><td>${h(ev.servicio || '')}</td>
          <td><span class="pill ${grave ? 'bad' : ev.consecuencia === 'Lesión temporal' ? 'warn' : ''}">${h(ev.consecuencia || '')}</span></td><td>${h(ev.estado)} ${grave && ev.estado === 'Abierto' ? plazo(ev) : ''}</td>
          <td><div class="row-actions"><button class="icon-btn" data-act="verEv" data-id="${ev.id}" aria-label="Ver PDF">${I.pdf}</button>${esProp() ? `<button class="icon-btn" data-act="editEv" data-id="${ev.id}" aria-label="Editar">${I.edit}</button><button class="icon-btn bad" data-act="delEv" data-id="${ev.id}" aria-label="Eliminar">${I.del}</button>` : ''}</div></td></tr>`; }).join('')}
      </tbody></table></div>` : '<div class="empty">Sin eventos reportados.</div>'}</section>`;
    A.acts({
      nuevoEv: () => A.formEvento(ent, eqs),
      editEv: (d) => A.formEvento(ent, eqs, evs.find((x) => x.id === d.id)),
      delEv: async (d) => { if (await confirmar('¿Eliminar este reporte de tecnovigilancia?')) { await S.remove('eventos', d.id); A.recargar(); } },
      verEv: (d) => { const ev = evs.find((x) => x.id === d.id); const doc = PDF.evento({ ev, eq: eqd(ev.equipo_id), ent, emp: st.emp, fmt: st.fmt.evento }); UI.verPDF({ titulo: 'Reporte de tecnovigilancia', blob: doc.output('blob'), nombre: `Tecnovigilancia_${UI.fecha(ev.fecha_evento)}.pdf` }); },
    });
  };

  A.formEvento = (ent, eqs, ev = null) => modal({
    titulo: ev ? 'Reporte de tecnovigilancia' : 'Reportar evento o incidente adverso',
    cuerpo: `<form class="form" onsubmit="return false">
      <fieldset><legend>A. Datos del reporte</legend><div class="fields">${f.input('fecha_evento', 'Fecha y hora del suceso *', ev ? ev.fecha_evento.slice(0, 16) : new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16), { type: 'datetime-local' })}
        ${f.input('servicio', 'Servicio clínico', ev?.servicio)}${f.input('reportante', 'Nombre del reportante', ev?.reportante)}${f.input('cargo', 'Cargo', ev?.cargo)}</div></fieldset>
      <fieldset><legend>B. Dispositivo médico</legend><div class="fields">${f.sel('equipo_id', 'Equipo involucrado', [['', '— Seleccione —'], ...eqs.map((e) => [e.id, `${e.codigo_inv} · ${e.nombre} · ${e.marca || ''} ${e.modelo || ''}`])], ev?.equipo_id, { full: true })}</div></fieldset>
      <fieldset><legend>C. Descripción y gravedad</legend><div class="fields">${f.area('descripcion', 'Descripción detallada del incidente *', ev?.descripcion, { rows: 4 })}
        ${f.sel('afecto_paciente', '¿Hubo afectación al paciente?', [['false', 'No'], ['true', 'Sí']], String(!!ev?.afecto_paciente))}${f.sel('consecuencia', 'Consecuencia clínica aparente', CAT.CONSECUENCIAS, ev?.consecuencia || 'Sin consecuencias')}</div></fieldset>
      <fieldset><legend>D. Acciones inmediatas</legend><div class="fields">${f.sel('retiro_equipo', 'Retiro del equipo del entorno clínico', [['true', 'Sí, fue retirado'], ['false', 'No']], String(ev ? !!ev.retiro_equipo : true))}${f.sel('estado', 'Estado del reporte', ['Abierto', 'Reportado INVIMA', 'Cerrado'], ev?.estado || 'Abierto')}
        ${f.area('contingencia', 'Medidas de contingencia', ev?.contingencia, { rows: 2 })}</div></fieldset></form>`,
    acciones: [{ t: 'Cancelar' }, { t: ev ? 'Guardar' : 'Enviar reporte', cls: 'pri', fn: async (m) => {
      const d = leer(m.body); if (!d.descripcion || !d.fecha_evento) { toast('Complete la fecha y la descripción', true); return false; }
      const o = { ...d, entidad_id: ent.id, equipo_id: d.equipo_id || null, afecto_paciente: d.afecto_paciente === 'true', retiro_equipo: d.retiro_equipo === 'true', fecha_evento: new Date(d.fecha_evento).toISOString() };
      if (ev) await S.update('eventos', ev.id, o); else {
        await S.insert('eventos', o);
        if (['Muerte', 'Deterioro grave'].includes(o.consecuencia) && o.equipo_id) toast('Evento grave: el equipo quedó Fuera de servicio. Notifique al INVIMA en las próximas 72 horas.', true);
        else if (o.retiro_equipo && o.equipo_id) await S.update('equipos', o.equipo_id, { estado: 'Fuera de servicio' });
      }
      toast('Reporte guardado'); A.recargar();
    } }],
  });

  // ------------------------------------------------------------ Alertas sanitarias
  A.G.alertas = async (el, { ent }) => {
    const als = await S.list('alertas', { entidad_id: ent.id }, 'created_at');
    el.innerHTML = `<section class="panel"><header><h2>Bitácora de consulta de alertas sanitarias</h2><div class="actions"><button class="btn" data-act="alPDF">${I.pdf} PDF (${h(st.fmt.alertas.codigo)})</button>${esProp() ? `<button class="btn pri" data-act="nuevaAl">${I.mas} Registrar consulta</button>` : ''}</div></header>
      <p class="muted">Registre cada mes la consulta de alertas, retiros de producto (recall) e informes de seguridad publicados por el INVIMA y agencias internacionales, y analice si aplican a los dispositivos del inventario.</p>
      ${als.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>No.</th><th>Mes de consulta</th><th>Registro sanitario</th><th>Dispositivo</th><th>Tipo de notificación</th><th>Agencia</th><th>Publicación</th><th>Responsable</th><th>Análisis</th><th>Aplicabilidad</th><th></th></tr></thead><tbody>
        ${als.map((a, i) => `<tr><td class="num">${i + 1}</td><td>${h(a.mes_consulta || '')}</td><td class="mono">${h(a.registro_sanitario || '')}</td><td>${h(a.dispositivo || '')}</td><td>${h(a.tipo_notificacion || '')}</td><td>${h(a.agencia || '')}</td><td class="num">${UI.fecha(a.fecha_publicacion)}</td><td>${h(a.responsable || '')}</td><td style="min-width:200px">${h(a.analisis || '')}</td><td><span class="pill ${/^aplica/i.test(a.aplicabilidad || '') ? 'warn' : ''}">${h(a.aplicabilidad || '')}</span></td>
          <td>${esProp() ? `<div class="row-actions"><button class="icon-btn" data-act="editAl" data-id="${a.id}" aria-label="Editar">${I.edit}</button><button class="icon-btn bad" data-act="delAl" data-id="${a.id}" aria-label="Eliminar">${I.del}</button></div>` : ''}</td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty">Sin consultas registradas.</div>'}</section>`;
    const form = (a = null) => modal({
      titulo: a ? 'Editar consulta de alerta' : 'Registrar consulta de alertas sanitarias',
      cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('mes_consulta', 'Mes de consulta', a?.mes_consulta || `${CAT.MESES[new Date().getMonth()]} ${anioAct}`)}${f.input('registro_sanitario', 'Registro sanitario / permiso', a?.registro_sanitario)}
        ${f.input('dispositivo', 'Nombre del dispositivo', a?.dispositivo, { full: true })}${f.sel('tipo_notificacion', 'Tipo de notificación', ['Consulta periódica', 'Alerta sanitaria', 'Retiro de producto (recall)', 'Informe de seguridad', 'Actualización de software'], a?.tipo_notificacion)}
        ${f.input('agencia', 'Agencia sanitaria', a?.agencia || 'INVIMA')}${f.input('fecha_publicacion', 'Fecha de publicación', a?.fecha_publicacion, { type: 'date' })}${f.input('responsable', 'Responsable de la consulta', a?.responsable || 'Laura Pistala')}
        ${f.area('analisis', 'Análisis', a?.analisis, { rows: 2 })}${f.sel('aplicabilidad', 'Aplicabilidad a dispositivos médicos', ['No aplica', 'Aplica - verificado', 'Aplica - en gestión'], a?.aplicabilidad)}</div></form>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => { const d = leer(m.body); d.fecha_publicacion = d.fecha_publicacion || null; a ? await S.update('alertas', a.id, d) : await S.insert('alertas', { ...d, entidad_id: ent.id }); toast('Consulta guardada'); A.recargar(); } }],
    });
    A.acts({
      nuevaAl: () => form(), editAl: (d) => form(als.find((x) => x.id === d.id)),
      delAl: async (d) => { if (await confirmar('¿Eliminar este registro?')) { await S.remove('alertas', d.id); A.recargar(); } },
      alPDF: async () => { const blob = await FMT.alertas({ ent, alertas: als, fmt: st.fmt.alertas }); UI.verPDF({ titulo: 'Bitácora de alertas sanitarias', blob, nombre: `Bitacora_alertas_${ent.razon_social}.pdf` }); },
    });
  };

  // ------------------------------------------------------------ Indicadores
  A.G.indicadores = async (el, { ent }) => {
    const [eqs, cronos, mtos, evs, als] = await Promise.all([S.list('equipos', { entidad_id: ent.id }), S.list('cronogramas', { entidad_id: ent.id }), S.list('mantenimientos', { entidad_id: ent.id }), S.list('eventos', { entidad_id: ent.id }), S.list('alertas', { entidad_id: ent.id })]);
    const k = A.kpis({ equipos: eqs, cronos, mtos, eventos: evs, alertas: als, anio: anioAct });
    el.innerHTML = `<section class="panel"><header><h2>Gestión de indicadores ${anioAct}</h2><button class="btn" data-act="kPDF">${I.pdf} Informe PDF</button></header>${A.kpiTiles(k)}
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Indicador</th><th>Fórmula</th><th class="r">Resultado</th><th>Meta</th></tr></thead><tbody>${k.map((x) => `<tr><td><b>${h(x.nombre)}</b></td><td class="muted">${h(x.formula)}</td><td class="r num">${h(x.valor)}</td><td>${h(x.meta)}</td></tr>`).join('')}</tbody></table></div></section>`;
    A.acts({ kPDF: () => { const doc = PDF.indicadores({ ent, k, emp: st.emp, anio: anioAct }); UI.verPDF({ titulo: 'Informe de indicadores', blob: doc.output('blob'), nombre: `Indicadores_${anioAct}_${ent.razon_social}.pdf` }); } });
  };

  // ------------------------------------------------------------ Comercial en carpeta de entidad
  A.G.cotizaciones = (el, { ent }) => A.listaComercial(el, 'cotizaciones', ent.id);
  A.G.facturas = (el, { ent }) => A.listaComercial(el, 'factura', ent.id);
  A.G.cuentas_cobro = (el, { ent }) => A.listaComercial(el, 'cuenta_cobro', ent.id);

  // =================================================================== FORMULARIOS
  // ------------------------------------------------------------ Equipo nuevo
  const camposEquipo = (e, cons) => `
    ${f.input('orden', 'N° (orden en el área)', e.orden ?? '', { type: 'number', attrs: 'min="0"' })}${f.input('nombre', 'Nombre del equipo *', e.nombre)}${f.input('codigo_inv', 'Código de inventario *', e.codigo_inv)}${f.input('activo_fijo', 'N° activo fijo', e.activo_fijo)}
    ${f.sel('consultorio_id', 'Área / consultorio', [['', '— Sin asignar —'], ...A.ordenar(cons).map((c, i) => [c.id, `${i + 1}. ${c.nombre}`])], e.consultorio_id)}${f.input('ubicacion', 'Ubicación física', e.ubicacion)}
    ${f.input('marca', 'Marca', e.marca)}${f.input('modelo', 'Modelo', e.modelo)}${f.input('serie', 'Serie', e.serie)}${f.input('fabricante', 'Fabricante', e.fabricante)}
    ${f.sel('clase_riesgo', 'Clasificación de riesgo', [['', '— Seleccione —'], ...Object.entries(CAT.RIESGO)], e.clase_riesgo)}${f.input('registro_sanitario', 'Registro sanitario / permiso', e.registro_sanitario)}${f.input('fecha_venc_rs', 'Vencimiento registro sanitario', e.fecha_venc_rs, { type: 'date' })}
    ${f.sel('periodicidad_mto', 'Periodicidad mantenimiento', Object.keys(CAT.PERIODICIDAD), e.periodicidad_mto || 'Semestral')}${f.sel('periodicidad_metro', 'Periodicidad metrología', Object.keys(CAT.PERIODICIDAD), e.periodicidad_metro || 'No aplica')}
    ${f.input('fecha_prox_mto', 'Próximo mantenimiento', e.fecha_prox_mto, { type: 'date' })}${f.input('fecha_prox_metro', 'Próxima calibración', e.fecha_prox_metro, { type: 'date' })}${f.input('fecha_fin_garantia', 'Garantía hasta', e.fecha_fin_garantia, { type: 'date' })}
    ${f.sel('estado', 'Estado', CAT.ESTADOS, e.estado || 'Activo')}`;
  const limpiarEquipo = (d) => { if ('orden' in d) d.orden = d.orden === '' ? null : Number(d.orden); ['fecha_venc_rs', 'fecha_prox_mto', 'fecha_prox_metro', 'fecha_fin_garantia', 'fecha_ult_mto', 'fecha_ult_metro', 'consultorio_id', 'clase_riesgo'].forEach((k) => { if (k in d && !d[k]) d[k] = null; }); return d; };

  A.formEquipo = (base, cons) => modal({
    titulo: 'Nuevo equipo biomédico',
    cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${camposEquipo(base, cons)}</div><p class="muted">Después podrá completar toda la hoja de vida (datos técnicos, adquisición, accesorios y anexos).</p></form>`,
    acciones: [{ t: 'Cancelar' }, { t: 'Crear equipo', cls: 'pri', fn: async (m) => {
      const d = limpiarEquipo(leer(m.body)); if (!d.nombre || !d.codigo_inv) { toast('Nombre y código de inventario son obligatorios', true); return false; }
      const n = await S.insert('equipos', { ...d, entidad_id: base.entidad_id, hv: {} });
      for (const [tipo, per] of [['mantenimiento', d.periodicidad_mto], ['metrologia', d.periodicidad_metro]]) if (CAT.PERIODICIDAD[per]) await S.insert('cronogramas', { entidad_id: base.entidad_id, equipo_id: n.id, tipo, anio: anioAct, plan: A.planDesde(per, new Date().getMonth() + 1, 2) });
      toast('Equipo creado y agregado a los cronogramas'); A.go('equipo', { id: n.id });
    } }],
  });

  // ------------------------------------------------------------ Hoja de vida completa
  A.formHojaVida = (eq, cons) => {
    const hv = eq.hv || {}, x = (k) => `hv_${k}`; let foto = hv.foto || null;
    const chk = (k, l, opts) => f.checks(x(k), l, opts, Array.isArray(hv[k]) ? hv[k] : hv[k] ? [hv[k]] : []);
    const anexos = [['reg_sanitario', '8.1 Registro sanitario o permiso'], ['importacion', '8.2 Registro de importación'], ['factura', '8.3 Factura o contrato'], ['acta_recibido', '8.4 Ingreso almacén / acta de recibido'], ['crono_garantia', '8.5 Cronograma en garantía'], ['protocolo', '8.6 Protocolo del fabricante'], ['guia', '8.7 Guía rápida de operación']];
    const T = ['Identificación', 'Código ECRI', 'Adquisición', 'Proveedor y fabricante', 'Datos técnicos', 'Apoyo técnico', 'Accesorios', 'Anexos', '9.5 Mediciones y recomendaciones'];
    const MED_COLS = [{ k: 'p', ph: 'Parámetro / magnitud', w: '1.6fr' }, { k: 'c', ph: 'Cantidad (valor o rango)' }, { k: 'u', ph: 'Unidad (mmHg, °C, kg…)', w: '.8fr' }];
    const sugMed = A.sugerirMediciones(eq.nombre);
    const medFilas = (hv.mediciones_tabla || []).length ? hv.mediciones_tabla : sugMed;
    const medAplica = hv.mediciones_aplica || ((hv.mediciones_tabla || []).length || sugMed.length || hv.mediciones ? 'Aplica' : 'No aplica');
    modal({
      titulo: `Hoja de vida · ${eq.codigo_inv}`, size: 'wide',
      cuerpo: `<form class="form" onsubmit="return false">${tabs(T)}
        <div data-panel="0"><div class="fields">${camposEquipo({ ...eq, ...Object.fromEntries(Object.keys(hv.nr || {}).filter((k) => hv.nr[k] && !['item', 'clase_riesgo'].includes(k)).map((k) => [k, FMT.marca(eq, k)])) }, cons)}<div class="field full"><span class="lbl">1.1 Registro sanitario o permiso de comercialización: marque una opción</span><div class="actions" style="gap:6px;flex-wrap:wrap">${[['RS', 'Registro sanitario'], ['PC', 'Permiso de comercialización'], ['NA', 'No aplica'], ['NR', 'No registra']].map(([v, t]) => `<label class="btn sm" style="gap:6px;cursor:pointer"><input type="radio" name="${x('tipo_registro')}" value="${v}" ${(hv.tipo_registro || (eq.registro_sanitario ? 'RS' : 'NR')) === v ? 'checked' : ''}> <b>${v}</b> <span class="muted">${t}</span></label>`).join('')}</div></div>
          <div class="field full"><label for="f_hv_ecri">1.2 Código ECRI (UMDNS)</label><div class="actions" style="gap:6px;flex-wrap:nowrap"><input id="f_hv_ecri" name="${x('ecri')}" value="${h(hv.ecri || '')}" placeholder="ej: 12-853 Oxímetros" style="flex:1"><button type="button" class="btn sm" data-ecri>Buscar en listado ECRI</button></div><div class="actions" data-ecri-sug style="gap:6px;margin-top:6px"></div></div>
          ${f.input(x('distintivo'), '1.4 Distintivo de habilitación', hv.distintivo)}${f.input(x('funcion'), '2.1 Función del equipo', hv.funcion)}${f.sel(x('movil'), '2.9 / 2.10 Tipo', ['Móvil', 'Fijo'], hv.movil || 'Móvil')}
          <div class="field"><span class="lbl">Foto del equipo (sale en la hoja de vida)</span><div class="actions" style="align-items:center"><img data-fprev src="${hv.foto || ''}" alt="" style="max-height:60px;${hv.foto ? '' : 'display:none'}"><label class="btn sm">${I.subir} Cargar foto<input type="file" accept="image/*" hidden data-foto></label></div></div></div></div>
        <div data-panel="1" hidden>
          <div class="fields"><div class="field full"><span class="lbl">Código ECRI asignado a este equipo (sale en la casilla 1.2 de la hoja de vida)</span>
            <div class="actions" style="gap:8px;align-items:center"><b class="mono" data-ecri-actual style="font-size:1.05rem">${h(hv.ecri || 'Sin asignar')}</b><button type="button" class="btn sm" data-ecri-quitar style="${hv.ecri ? '' : 'display:none'}">Quitar</button></div></div>
          <div class="field full"><label for="ecri_buscar">Buscar en el listado ECRI (UMDNS) por nombre en español, inglés o por código</label><input id="ecri_buscar" data-ecri-q placeholder="ej: oxímetro, tensiómetro, autoclave, 12-853" autocomplete="off"></div></div>
          <p class="muted" data-ecri-info style="margin:6px 0">Cargando listado ECRI…</p>
          <div class="tbl-wrap" style="max-height:330px"><table class="tbl"><thead><tr><th>Código</th><th>Nombre (español)</th><th>Nombre (inglés)</th><th></th></tr></thead><tbody data-ecri-res></tbody></table></div></div>
        <div data-panel="2" hidden><div class="fields">${f.sel(x('adquisicion'), '3.1 Forma de adquisición', ['Compra', 'Donación', 'Asignación', 'Comodato', 'Alquiler'], hv.adquisicion || 'Compra')}${f.input(x('costo'), 'Costo (COP)', hv.costo, { type: 'number' })}${f.input(x('factura'), 'Factura N°', hv.factura)}${f.input(x('contrato'), 'Contrato', hv.contrato)}
          ${f.input(x('garantia'), 'Garantía (descripción)', hv.garantia)}${f.input(x('f_fabricacion'), 'Fecha fabricación', hv.f_fabricacion, { type: 'date' })}${f.input(x('f_compra'), 'Fecha compra', hv.f_compra, { type: 'date' })}${f.input(x('f_recibido'), 'Fecha recibido', hv.f_recibido, { type: 'date' })}
          ${f.input(x('f_instalacion'), 'Fecha instalación', hv.f_instalacion, { type: 'date' })}${f.input(x('f_uso'), 'Fecha puesta en uso', hv.f_uso, { type: 'date' })}${f.input(x('vida_util'), 'Vida útil', hv.vida_util)}</div></div>
        <div data-panel="3" hidden><div class="grid2"><fieldset><legend>3.2 Proveedor</legend><div class="fields">${['nombre:Nombre', 'ciudad:Ciudad / país', 'dir:Dirección', 'tel:Tel / cel', 'correo:Correo', 'web:Página web'].map((p) => { const [k, l] = p.split(':'); return f.input(x('prov_' + k), l, hv['prov_' + k], { full: true }); }).join('')}</div></fieldset>
          <fieldset><legend>3.3 Fabricante</legend><div class="fields">${['ciudad:Ciudad / país', 'dir:Dirección', 'tel:Tel / cel', 'correo:Correo', 'web:Página web'].map((p) => { const [k, l] = p.split(':'); return f.input(x('fab_' + k), l, hv['fab_' + k], { full: true }); }).join('')}</div></fieldset></div></div>
        <div data-panel="4" hidden><div class="fields">${[['voltaje', 'Voltaje (V)'], ['corriente', 'Corriente (A)'], ['potencia', 'Potencia (W)'], ['frecuencia', 'Frecuencia (Hz)'], ['presion', 'Presión (psi, mmHg)'], ['rpm', 'Velocidad (RPM)'], ['capacidad', 'Capacidad'], ['presion_atm', 'Presión atm (Pa)'], ['temperatura', 'Temperatura (°C)'], ['humedad', 'Humedad (%HR)'], ['peso', 'Peso (g, kg)'], ['dimensiones', 'Dimensiones (cm)'], ['rangos', 'Rangos de operación'], ['otros_tec', 'Otros']].map(([k, l]) => f.input(x(k), l, hv[k])).join('')}</div></div>
        <div data-panel="5" hidden><div class="fields">${chk('fuente', '6.1 Fuentes de alimentación', ['Electricidad', 'Batería', 'Aceite', 'Agua', 'Aire', 'Gas', 'Vapor', 'Oxígeno', 'Otro'])}${chk('tecnologia', '6.2 Tecnología predominante', ['Eléctrico', 'Electrónico', 'Electromecánico', 'Mecánico', 'Hidráulico', 'Neumático', 'Acústico', 'Vapor', 'Solar'])}
          ${chk('clasif_biomedica', '6.3 Clasificación biomédica', ['Diagnóstico', 'Prevención', 'Rehabilitación', 'Tratamiento y mantenimiento de la vida', 'Análisis de laboratorio y apoyo'])}${chk('manuales', '6.5 Manuales (se consultan desde la hoja de vida)', ['Operación', 'Mantenimiento', 'Guía rápida', 'Ficha técnica'])}${chk('planos', '6.6 Planos', ['Electrónico', 'Eléctrico', 'Mecánico', 'Neumático'])}</div></div>
        <div data-panel="6" hidden><span class="lbl">7. Componentes y/o accesorios</span>${rep('acc', [{ k: 'nombre', ph: 'Nombre', w: '1.4fr' }, { k: 'marca', ph: 'Marca' }, { k: 'modelo', ph: 'Modelo' }, { k: 'serie', ph: 'Serie' }, { k: 'desc', ph: 'Descripción', w: '1.4fr' }], hv.accesorios || [])}</div>
        <div data-panel="7" hidden><div class="fields">${anexos.map(([k, l]) => f.sel(x('anexo_' + k), l, ['Anexo', 'No anexo', 'No aplica'], (hv.anexos || {})[k] || 'No aplica')).join('')}</div><p class="muted">Cargue los soportes (registro sanitario, factura, manual, certificado de importación…) en las carpetas del equipo.</p></div>
        <div data-panel="8" hidden><fieldset><legend>9.5 Recomendaciones para mediciones (cantidad / unidad)</legend>
          <div class="fields">${f.sel(x('mediciones_aplica'), '¿El equipo requiere mediciones?', ['Aplica', 'No aplica'], medAplica)}</div>
          <div data-med-box ${medAplica === 'No aplica' ? 'hidden' : ''}><div class="actions" style="justify-content:space-between;align-items:center"><span class="lbl">Parámetro o magnitud · cantidad (valor o rango) · unidad de medida</span><button type="button" class="btn sm" data-med-sug>${I.ia} Sugerir según el equipo</button></div>
            <div data-med-rep>${rep('med', MED_COLS, medFilas)}</div>
            ${f.area(x('mediciones'), 'Notas adicionales (opcional)', hv.mediciones, { rows: 2 })}</div>
          <div class="med-prev"><span class="lbl">Así sale en la casilla 9.5 de la hoja de vida</span><div data-med-prev></div></div></fieldset>
          <div class="fields">${f.area(x('recomendaciones'), '10. Recomendaciones del fabricante', hv.recomendaciones, { rows: 5 })}</div></div>
      </form>`,
      alAbrir: (m) => { tabBind(m.body); repBind(m.body);
        // 9.5 mediciones: vista previa, mostrar / ocultar y sugerencias
        const medPrev = () => { const ap = m.body.querySelector('[name=hv_mediciones_aplica]').value; m.body.querySelector('[data-med-box]').hidden = ap === 'No aplica';
          m.body.querySelector('[data-med-prev]').textContent = FMT.textoMediciones({ mediciones_aplica: ap, mediciones_tabla: repLeer(m.body, 'med'), mediciones: m.body.querySelector('[name=hv_mediciones]').value }) || 'NR'; };
        m.body.querySelector('[data-panel="8"]').addEventListener('input', medPrev); m.body.querySelector('[data-panel="8"]').addEventListener('change', medPrev); m.body.querySelector('[data-panel="8"]').addEventListener('click', () => setTimeout(medPrev, 0));
        m.body.querySelector('[data-med-sug]').onclick = () => { const l = A.sugerirMediciones(m.body.querySelector('[name=nombre]')?.value || eq.nombre); if (!l.length) { toast('No hay sugerencias para este tipo de equipo; escriba los parámetros a mano.', true); return; } m.body.querySelector('[data-med-rep]').innerHTML = rep('med', MED_COLS, l); medPrev(); toast('Parámetros sugeridos: revise cantidades y unidades según el manual del equipo.'); };
        medPrev();
        const ec = m.body.querySelector('[name=hv_ecri]'), sg = m.body.querySelector('[data-ecri-sug]');
        // pestaña Código ECRI: buscador dentro de la hoja de vida
        const actual = m.body.querySelector('[data-ecri-actual]'), quitar = m.body.querySelector('[data-ecri-quitar]'), q = m.body.querySelector('[data-ecri-q]'), res = m.body.querySelector('[data-ecri-res]'), info = m.body.querySelector('[data-ecri-info]');
        const asignar = (v) => { ec.value = v; actual.textContent = v || 'Sin asignar'; quitar.style.display = v ? '' : 'none'; };
        ec.addEventListener('input', () => asignar(ec.value));
        quitar.onclick = () => asignar('');
        const pintarECRI = (l, t) => { info.textContent = t; res.innerHTML = l.map((z) => `<tr><td class="mono" style="white-space:nowrap"><b>${h(z.c)}</b></td><td>${h(z.es)}</td><td class="muted">${h(z.en)}</td><td><button type="button" class="btn sm" data-ec-pick="${h(A.ECRI.texto(z))}">Asignar</button></td></tr>`).join('') || '<tr><td colspan="4" class="empty">Sin resultados. Pruebe con otra palabra.</td></tr>'; };
        res.onclick = (e) => { const b = e.target.closest('[data-ec-pick]'); if (b) { asignar(b.dataset.ecPick); toast(`Código ECRI asignado: ${b.dataset.ecPick}. Guarde la hoja de vida para conservarlo.`); } };
        A.ECRI.sugerir(eq.nombre).then((l) => pintarECRI(l, l.length ? `Sugerencias para “${eq.nombre}”. Escriba arriba para buscar en todo el listado.` : 'Escriba arriba para buscar en todo el listado.')).catch(() => { info.textContent = 'No se pudo cargar el listado ECRI.'; });
        let tq = null; q.oninput = () => { clearTimeout(tq); tq = setTimeout(async () => { await A.ECRI.cargar(); const r = q.value.trim() ? A.ECRI.buscar(q.value) : await A.ECRI.sugerir(eq.nombre); pintarECRI(r, q.value.trim() ? `${r.length} resultado(s)${r.length === 60 ? ' (se muestran los primeros 60)' : ''}` : `Sugerencias para “${eq.nombre}”.`); }, 150); };
        m.body.querySelector('[data-ecri]').onclick = () => A.ECRI.elegir(m.body.querySelector('[name=nombre]')?.value || eq.nombre, (v) => asignar(v));
        if (!hv.ecri) A.ECRI.sugerir(eq.nombre).then((l) => { sg.innerHTML = l.length ? '<span class="muted" style="font-size:.8rem">Sugeridos:</span>' + l.slice(0, 4).map((z) => `<button type="button" class="btn sm" data-ec="${h(A.ECRI.texto(z))}">${h(A.ECRI.texto(z))}</button>`).join('') : ''; sg.querySelectorAll('[data-ec]').forEach((b) => { b.onclick = () => asignar(b.dataset.ec); }); }).catch(() => {}); m.body.querySelector('[data-foto]').onchange = async (e) => { const fl = e.target.files[0]; if (!fl) return; foto = await UI.reducirImagen(fl, 700, 'image/jpeg'); const im = m.body.querySelector('[data-fprev]'); im.src = foto; im.style.display = ''; }; },
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar hoja de vida', cls: 'pri', fn: async (m) => {
        const d = leer(m.body); const cols = {}, nhv = { ...hv, anexos: {} };
        Object.entries(d).forEach(([k, v]) => { if (k.startsWith('hv_anexo_')) nhv.anexos[k.slice(9)] = v; else if (k.startsWith('hv_')) nhv[k.slice(3)] = v; else cols[k] = v; });
        nhv.accesorios = repLeer(m.body, 'acc'); nhv.foto = foto; nhv.mediciones_tabla = nhv.mediciones_aplica === 'No aplica' ? [] : repLeer(m.body, 'med');
        if (!cols.nombre || !cols.codigo_inv) { toast('Nombre y código de inventario son obligatorios', true); return false; }
        nhv.nr = { ...(hv.nr || {}) }; Object.keys(nhv.nr).forEach((k) => { if (k in cols && cols[k] && !/^(no registra|nr|no aplica)$/i.test(cols[k]) && cols[k] !== eq[k]) delete nhv.nr[k]; });
        Object.keys(cols).forEach((k) => { if (/^(no registra|no aplica)$/i.test(cols[k] || '') && !['codigo_inv', 'nombre'].includes(k)) { nhv.nr[k] = /aplica/i.test(cols[k]) ? 'NA' : true; cols[k] = ''; } });
        await S.update('equipos', eq.id, { ...limpiarEquipo(cols), hv: nhv }); toast('Hoja de vida actualizada'); A.recargar();
      } }],
    });
  };

  // ------------------------------------------------------------ Mantenimiento / metrología
  A.formMto = async ({ eq, ent, cons, tipo, m = null }) => {
    const todos = await S.list('mantenimientos', { entidad_id: ent.id });
    const serieN = { preventivo: 'mto_preventivo', correctivo: 'mto_correctivo' }[tipo];
    const sugerido = m ? null : serieN ? await A.CONS.siguiente(serieN, UI.hoy()) : null;
    const numero = m?.numero || sugerido || A.consecutivo(todos.filter((x) => x.tipo === tipo), 'numero', '').padStart(5, '0');
    const d = m?.datos || {};
    const fp = st.fmt.mto_preventivo;
    let fRecibe = m?.firma_recibe || null, fRealizo = m?.firma_realizo || st.firma || null, recibeNueva = false;
    // protocolo del equipo (Google + IA o manuales): pre-llena los reportes nuevos
    const pm = !m && tipo === 'preventivo' ? eq.hv?.protocolo_mto : null;
    const pruebasIni = d.pruebas || (pm?.pruebas?.length ? pm.pruebas : fp.pruebas || []).map((p) => ({ item: p, r: 'Pasa' }));
    const actsSel = d.actividades || (pm?.actividades?.length ? pm.actividades : fp.actividades);
    const actsTodas = [...new Set([...(fp.actividades || []), ...(pm?.actividades || []), ...(d.actividades || [])])];
    const herrSel = d.herramientas || (pm?.herramientas?.length ? (fp.herramientas || []).filter((x) => pm.herramientas.some((y) => y.toLowerCase().includes(x.toLowerCase()) || x.toLowerCase().includes(y.toLowerCase()))) : []);
    const obsIni = d.observaciones ?? (pm?.observaciones || '');
    const val = d.valoracion || (m ? [] : ['Equipo queda en funcionamiento', 'Equipo encontrado en servicio', 'Servicio concluido']);
    const titulo = { preventivo: 'Mantenimiento preventivo', correctivo: 'Mantenimiento correctivo', metrologia: 'Metrología / calibración' }[tipo];
    let cert = null;
    const cuerpo = `<form class="form" onsubmit="return false">
      <div class="fields">${f.input('numero', 'Reporte N°', numero)}${f.input('fecha', tipo === 'correctivo' ? 'Fecha de cierre' : 'Fecha', m?.fecha || UI.hoy(), { type: 'date' })}
        ${tipo === 'preventivo' ? `${f.sel('frecuencia', 'Frecuencia', Object.keys(CAT.PERIODICIDAD), d.frecuencia || eq.periodicidad_mto)}${f.input('tiempo', 'Tiempo empleado (hh:mm)', d.tiempo || '01:00')}` : ''}
        ${tipo === 'correctivo' ? `${f.input('fecha_reporte', 'Fecha de reporte de la falla', d.fecha_reporte || UI.hoy(), { type: 'date' })}${f.input('horas', 'Horas de trabajo', d.horas, { type: 'number', attrs: 'step="0.5" min="0"' })}` : ''}
      </div>
      ${tipo === 'preventivo' ? `<fieldset><legend>2. Puntos de inspección</legend>
        ${esProp() ? `<div class="ia-mto"><button type="button" class="btn" data-iamto>${I.ia} Completar con IA (manuales + Google)</button><span class="muted" data-iamto-est>${pm ? `Pre-llenado con el protocolo del equipo (${h(pm.origen || 'IA')}, ${UI.fecha(pm.fecha)}).` : 'Lee los manuales, fichas técnicas y guías del equipo y busca en Google para proponer pruebas, actividades y observaciones.'}</span></div>` : ''}
        <span class="lbl">Pruebas cualitativas (máximo 12 en el formato)</span><div data-pruebas-box>${rep('pruebas', [{ k: 'item', ph: 'Prueba', w: '3fr' }, { k: 'r', ph: 'Resultado', opts: ['Pasa', 'No pasa', 'N/A'] }], pruebasIni)}</div>
        <div data-acts-box>${f.checks('actividades', 'Actividades de mantenimiento (máximo 12 en el formato)', actsTodas, actsSel)}</div>${f.area('otras_act', 'Otras actividades (una por línea)', '', { rows: 2 })}</fieldset>` : ''}
      ${tipo === 'correctivo' ? `<fieldset><legend>Falla y reparación</legend><div class="fields">${f.area('falla', 'Falla reportada *', d.falla, { rows: 2 })}${f.area('diagnostico', 'Diagnóstico', d.diagnostico, { rows: 2 })}${f.sel('causa', 'Causa', ['Desgaste', 'Mal uso', 'Falla eléctrica', 'Falla de fábrica', 'Accidente', 'Falta de mantenimiento', 'Otra'], d.causa)}
        ${f.area('actividades_txt', 'Actividades realizadas (una por línea)', (d.actividades || []).join('\n'), { rows: 3 })}</div></fieldset>` : ''}
      ${tipo === 'metrologia' ? `<fieldset><legend>Calibración</legend><div class="fields">${f.input('laboratorio', 'Laboratorio', d.laboratorio, { full: true })}${f.input('certificado', 'Certificado N°', d.certificado)}${f.input('magnitud', 'Magnitud', d.magnitud)}
        ${f.sel('resultado', 'Resultado', ['Conforme', 'No conforme'], d.resultado)}${f.area('mediciones', 'Resultados de la verificación / mediciones', d.mediciones, { rows: 3 })}${f.input('proxima', 'Próxima calibración', d.proxima || UI.sumarMeses(UI.hoy(), CAT.PERIODICIDAD[eq.periodicidad_metro] || 12), { type: 'date' })}
        <div class="field full"><span class="lbl">Adjuntar certificado (PDF) — se guarda en la carpeta Metrología con alerta de vencimiento</span><input type="file" accept="application/pdf,image/*" data-cert></div></div></fieldset>` : ''}
      ${tipo !== 'metrologia' ? `<fieldset><legend>3. Estado de valoración</legend>${f.checks('valoracion', '', CAT.VALORACION, val)}</fieldset>
        <fieldset><legend>4. Herramienta, insumos y repuestos</legend>${tipo === 'preventivo' ? `<div data-herr-box>${f.checks('herramientas', 'Herramientas e insumos', fp.herramientas || [], herrSel)}</div>` : ''}<span class="lbl">Partes utilizadas (insumos o repuestos)</span>${rep('repuestos', [{ k: 'd', ph: 'Descripción', w: '3fr' }, { k: 'c', ph: 'Cant.', type: 'number' }], d.repuestos || [])}</fieldset>` : ''}
      <div class="fields">${f.area('observaciones', '5. Observaciones generales', tipo === 'preventivo' ? obsIni : d.observaciones, { rows: 3 })}</div>
      ${tipo !== 'metrologia' ? `<fieldset><legend>Firmas</legend><div class="fields">${f.input('recibe_nombre', 'Recibido a satisfacción: nombre', d.recibe_nombre)}${f.input('recibe_cargo', 'Cargo', d.recibe_cargo)}</div>
        <div class="grid2">${firmaBtn('Firma de quien recibe', fRecibe)}${firmaBtn(`Firma de quien realizó (${h(st.emp.responsable)})`, fRealizo)}</div>
        <label class="checks" style="margin-top:8px"><input type="checkbox" name="firmar_digital" data-single ${m && !d.firma_digital ? '' : 'checked'}> <b>Firmar digitalmente</b> <span class="muted">— estampa la firma en “REALIZÓ” y genera un código de verificación del reporte</span></label></fieldset>` : ''}
    </form>`;
    modal({
      titulo: `${titulo} · ${eq.nombre}`, size: 'wide', cuerpo,
      alAbrir: (mm) => {
        repBind(mm.body);
        firmaBind(mm.body, null, (i, dd) => { if (i === 0) { fRecibe = dd; recibeNueva = true; } else fRealizo = dd; }, { titulos: ['Firma de quien recibe', 'Firma de quien realizó'], actual: [null, st.firma] });
        const c = mm.body.querySelector('[data-cert]'); if (c) c.onchange = (e) => { cert = e.target.files[0] || null; };
        // Completar con IA: manuales / fichas / guías del equipo + Google
        const bia = mm.body.querySelector('[data-iamto]');
        if (bia) bia.onclick = async () => {
          const est = mm.body.querySelector('[data-iamto-est]'); bia.disabled = true;
          try {
            const x = await A.iaMantenimiento(eq, { onEstado: (t) => { est.textContent = t; } });
            if (!x.pruebas.length && !x.actividades.length) throw new Error('La IA no encontró pruebas ni actividades para este equipo');
            const ACT_LBL = 'Actividades de mantenimiento (máximo 12 en el formato)';
            if (x.pruebas.length) mm.body.querySelector('[data-pruebas-box]').innerHTML = rep('pruebas', [{ k: 'item', ph: 'Prueba', w: '3fr' }, { k: 'r', ph: 'Resultado', opts: ['Pasa', 'No pasa', 'N/A'] }], x.pruebas.map((p) => ({ item: p, r: 'Pasa' })));
            if (x.actividades.length) {
              const todas = [...new Set([...x.actividades, ...(fp.actividades || [])])];
              mm.body.querySelector('[data-acts-box]').innerHTML = f.checks('actividades', ACT_LBL, todas, x.actividades);
            }
            const hb = mm.body.querySelector('[data-herr-box]');
            if (hb && x.herramientas.length) hb.querySelectorAll('input[name=herramientas]').forEach((i) => { if (x.herramientas.some((y) => y.toLowerCase().includes(i.value.toLowerCase()) || i.value.toLowerCase().includes(y.toLowerCase()))) i.checked = true; });
            const ob = mm.body.querySelector('[name=observaciones]');
            if (x.observaciones) ob.value = ob.value.trim() && ob.value.trim() !== (pm?.observaciones || '').trim() && !ob.value.includes(x.observaciones) ? `${ob.value.trim()}\n${x.observaciones}` : x.observaciones;
            est.innerHTML = `Completado con ${x.docs.length ? `${x.docs.length} documento(s) del equipo` : 'Google'}${x.fuentes.length ? ` y ${x.fuentes.length} fuentes de Google` : ''}. Revise antes de guardar; quedó como protocolo del equipo para los próximos reportes.`;
            toast('Pruebas, actividades y observaciones completadas con IA');
          } catch (er) { est.textContent = ''; toast(er.message, true); } finally { bia.disabled = false; }
        };
      },
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar y ver PDF', cls: 'pri', fn: async (mm) => {
        const v = leer(mm.body);
        if (tipo === 'correctivo' && !v.falla) { toast('Describa la falla reportada', true); return false; }
        const datos = { observaciones: v.observaciones };
        if (tipo === 'preventivo') Object.assign(datos, { frecuencia: v.frecuencia, tiempo: v.tiempo, pruebas: repLeer(mm.body, 'pruebas').map((p) => ({ item: p.item, r: p.r })), actividades: [...v.actividades, ...v.otras_act.split('\n').map((s) => s.trim()).filter(Boolean)], herramientas: v.herramientas });
        if (tipo === 'correctivo') Object.assign(datos, { fecha_reporte: v.fecha_reporte, fecha_cierre: v.fecha, horas: v.horas, falla: v.falla, diagnostico: v.diagnostico, causa: v.causa, actividades: v.actividades_txt.split('\n').map((s) => s.trim()).filter(Boolean) });
        if (tipo === 'metrologia') Object.assign(datos, { mediciones: v.mediciones, laboratorio: v.laboratorio, certificado: v.certificado, magnitud: v.magnitud, resultado: v.resultado, proxima: v.proxima });
        if (tipo !== 'metrologia') Object.assign(datos, { valoracion: v.valoracion, repuestos: repLeer(mm.body, 'repuestos'), recibe_nombre: v.recibe_nombre, recibe_cargo: v.recibe_cargo });
        if (tipo !== 'metrologia' && fRecibe) datos.firma_recibe_fecha = recibeNueva || !d.firma_recibe_fecha ? new Date().toISOString() : d.firma_recibe_fecha;
        if (tipo !== 'metrologia' && v.firmar_digital && !fRealizo) { toast('Para firmar digitalmente capture la firma de quien realizó (o regístrela en “Mi empresa y firma”).', true); return false; }
        let numReg = null;
        if (!m && serieN) {
          numReg = await A.CONS.registrar({ serie: serieN, numero: v.numero, sugerido, entidad_id: ent.id, equipo_id: eq.id, fecha: v.fecha,
            observacion: `${titulo} · ${eq.nombre}${v.observaciones ? ' · ' + v.observaciones.slice(0, 160) : ''}` });
          v.numero = numReg.numero;
        }
        const firmar = tipo !== 'metrologia' && v.firmar_digital;
        const reg = { entidad_id: ent.id, equipo_id: eq.id, tipo, numero: v.numero, fecha: v.fecha, datos, firma_recibe: fRecibe, firma_realizo: firmar ? fRealizo : null };
        if (firmar) datos.firma_digital = await A.firmarDigital(reg);
        let guardado;
        try { guardado = m ? await S.update('mantenimientos', m.id, reg) : await S.insert('mantenimientos', reg); }
        catch (e) { if (numReg) await A.CONS.liberar(numReg); throw e; }
        if (numReg) await A.CONS.vincular(numReg, 'mantenimientos', guardado.id);
        // actualizar el equipo y el cronograma
        const cambios = {};
        if (tipo === 'preventivo') { cambios.fecha_ult_mto = v.fecha; cambios.fecha_prox_mto = CAT.PERIODICIDAD[v.frecuencia] ? UI.sumarMeses(v.fecha, CAT.PERIODICIDAD[v.frecuencia]) : null; }
        if (tipo === 'metrologia') { cambios.fecha_ult_metro = v.fecha; cambios.fecha_prox_metro = v.proxima || null; if (v.resultado === 'No conforme') cambios.estado = 'Fuera de servicio'; }
        if (tipo !== 'metrologia' && eq.estado !== 'Dado de baja') cambios.estado = v.valoracion.includes('No usar, retirar del servicio') ? 'Fuera de servicio' : v.valoracion.includes('Equipo queda en funcionamiento') ? 'Activo' : eq.estado;
        await S.update('equipos', eq.id, cambios);
        if (!m && tipo !== 'correctivo') await A.marcarCrono(eq, tipo === 'metrologia' ? 'metrologia' : 'mantenimiento', v.fecha);
        if (cert) {
          const path = `${ent.id}/${eq.id}/metrologia/${Date.now()}-${cert.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_')}`;
          await S.upload(path, cert);
          await S.insert('documentos', { entidad_id: ent.id, equipo_id: eq.id, carpeta: 'metrologia', nombre: `Certificado ${v.certificado || ''} - ${cert.name}`, archivo: path, mime: cert.type, tamano: cert.size, fecha_documento: v.fecha, fecha_vencimiento: v.proxima || null, visible_cliente: true });
        }
        toast('Reporte guardado. Hoja de vida y cronograma actualizados.');
        A.recargar();
        A.verMto(guardado, { ...eq, ...cambios }, ent, cons);
      } }],
    });
  };

  // ------------------------------------------------------------ Actas
  A.formActa = async ({ ent, eq, tipo }) => {
    const [eqs, docs] = await Promise.all([S.list('equipos', { entidad_id: ent.id }, 'codigo_inv'), S.list('documentos', { entidad_id: ent.id, carpeta: 'acta_' + tipo })]);
    const numero = (await A.CONS.siguiente('actas')) || String(new Set(docs.map((d) => d.nombre)).size + 1).padStart(4, '0');
    let fRecibe = null;
    modal({
      titulo: tipo === 'baja' ? 'Generar acta de baja' : 'Generar acta de entrega', size: 'wide',
      cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('numero', 'Acta No.', numero)}${f.input('fecha', 'Fecha', UI.hoy(), { type: 'date' })}
        ${tipo === 'entrega' ? f.input('servicio', 'Servicio que recibe', '') : ''}${f.input('recibe_nombre', 'Recibe: nombre', ent.representante || '')}${f.input('recibe_cargo', 'Recibe: cargo', '')}</div>
        ${f.checks('equipos', 'Equipos incluidos en el acta', eqs.filter((e) => e.estado !== 'Dado de baja' || e.id === eq?.id).map((e) => `${e.codigo_inv} · ${e.nombre}`), eq ? [`${eq.codigo_inv} · ${eq.nombre}`] : [])}
        ${tipo === 'baja' ? f.area('motivo', 'Motivo de la baja', 'Este equipo biomédico no pasó calibración y por tanto se debe sacar del servicio y reemplazarlo por otro de mejores o iguales condiciones.', { rows: 3 }) : ''}
        <div class="grid2">${firmaBtn('Firma de quien recibe (opcional)', null)}</div></form>`,
      alAbrir: (mm) => firmaBind(mm.body, null, (i, dd) => { fRecibe = dd; }, { titulos: ['Firma de quien recibe'] }),
      acciones: [{ t: 'Cancelar' }, { t: 'Generar y guardar', cls: 'pri', fn: async (mm) => {
        const v = leer(mm.body); const sel = eqs.filter((e) => v.equipos.includes(`${e.codigo_inv} · ${e.nombre}`));
        if (!sel.length) { toast('Seleccione al menos un equipo', true); return false; }
        const numReg = await A.CONS.registrar({ serie: 'actas', numero: v.numero, sugerido: numero, entidad_id: ent.id, equipo_id: sel.length === 1 ? sel[0].id : null, fecha: v.fecha,
          observacion: `Acta de ${tipo} · ${sel.map((e) => `${e.nombre} ${e.codigo_inv}`).join(', ').slice(0, 200)}` });
        v.numero = numReg.numero;
        const doc = PDF.acta({ tipo, a: { ...v, equipos: sel, firma_recibe: fRecibe }, ent, emp: st.emp, fmt: st.fmt['acta_' + tipo], firma: st.firma });
        const blob = doc.output('blob'); const nombre = `Acta de ${tipo} No. ${v.numero} - ${UI.fecha(v.fecha)}.pdf`;
        for (const e of sel) {
          await A.guardarPDF({ blob, nombre, entidad_id: ent.id, equipo_id: e.id, carpeta: 'acta_' + tipo });
          if (tipo === 'baja') await S.update('equipos', e.id, { estado: 'Dado de baja' });
        }
        toast(`Acta guardada en la carpeta de ${sel.length} equipo(s)`); A.recargar();
        UI.verPDF({ titulo: nombre, blob, nombre });
      } }],
    });
  };

  // =================================================================== COMERCIAL
  A.consecutivoCC = (lista) => { const n = lista.filter((x) => String(x.numero || '').endsWith('-' + anioAct)).map((x) => parseInt(String(x.numero).split('-')[0], 10)).filter((x) => !isNaN(x)); return `${String((n.length ? Math.max(...n) : 0) + 1).padStart(5, '0')}-${anioAct}`; };
  const totalItems = (items) => (items || []).reduce((s, i) => s + (Number(i.cantidad) || 0) * (Number(i.valor) || 0), 0);
  A.listaComercial = async (el, tipo, entidadId = null) => {
    const tabla = tipo === 'cotizaciones' ? 'cotizaciones' : 'cobros';
    const filtros = entidadId ? { entidad_id: entidadId } : {}; if (tabla === 'cobros') filtros.tipo = tipo;
    const [lista, ents] = await Promise.all([S.list(tabla, filtros, '-fecha'), entidadId ? Promise.resolve([]) : S.list('entidades', {}, 'razon_social')]);
    const en = (id) => ents.find((e) => e.id === id)?.razon_social || '—';
    const nom = { cotizaciones: 'Cotizaciones', cuenta_cobro: 'Cuentas de cobro', factura: 'Facturas' }[tipo];
    const tot = (x) => (tipo === 'factura' ? Number(x.total) || 0 : totalItems(x.items) * (1 + (Number(x.iva) || 0) / 100));
    const est = (e) => `<span class="pill ${['Aprobada', 'Pagada'].includes(e) ? 'ok' : ['Rechazada', 'Anulada'].includes(e) ? 'bad' : e === 'Enviada' ? 'acc' : 'warn'}">${h(e)}</span>`;
    el.innerHTML = `<section class="panel"><header><h2>${nom}</h2>${esProp() ? `<button class="btn pri" data-act="nuevoCom">${I.mas} ${tipo === 'cotizaciones' ? 'Nueva cotización' : tipo === 'factura' ? 'Registrar factura' : 'Nueva cuenta de cobro'}</button>` : ''}</header>
      ${lista.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Número</th><th>Fecha</th>${entidadId ? '' : '<th>Entidad</th>'}<th>${tipo === 'cotizaciones' ? 'Validez' : 'Concepto'}</th><th class="r">Total</th><th>Estado</th><th></th></tr></thead><tbody>
        ${lista.map((x) => `<tr class="clic" data-act="verCom" data-id="${x.id}"><td class="mono">${h(x.numero)}</td><td class="num">${UI.fecha(x.fecha)}</td>${entidadId ? '' : `<td>${h(en(x.entidad_id))}</td>`}<td class="muted">${tipo === 'cotizaciones' ? `${x.validez_dias || 30} días` : h((x.concepto || '').slice(0, 70))}</td><td class="r num"><b>${PDF.pesos(tot(x))}</b></td><td>${est(x.estado)}</td>
          <td><div class="row-actions"><button class="icon-btn" data-act="verCom" data-id="${x.id}" aria-label="Ver PDF">${I.pdf}</button>${esProp() ? `${tipo === 'cotizaciones' && x.estado === 'Aprobada' ? `<button class="btn sm" data-act="convertir" data-id="${x.id}">Cuenta de cobro</button>` : ''}<button class="icon-btn" data-act="editCom" data-id="${x.id}" aria-label="Editar">${I.edit}</button><button class="icon-btn bad" data-act="delCom" data-id="${x.id}" aria-label="Eliminar">${I.del}</button>` : ''}</div></td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty">Sin registros.</div>'}</section>`;
    const reg = (id) => lista.find((x) => x.id === id);
    A.acts({
      nuevoCom: () => A.formComercial(tipo, null, entidadId),
      editCom: (d) => A.formComercial(tipo, reg(d.id), entidadId),
      delCom: async (d) => { const x = reg(d.id); if (await confirmar(`¿Eliminar ${x.numero}?`)) { await S.remove(tabla, x.id); if (x.archivo) { try { await S.removeFile(x.archivo); } catch {} } A.recargar(); } },
      convertir: async (d) => { const c = reg(d.id); const todos = await S.list('cobros', { tipo: 'cuenta_cobro' }); A.formComercial('cuenta_cobro', { entidad_id: c.entidad_id, numero: A.consecutivoCC(todos), fecha: UI.hoy(), concepto: `Servicios según cotización ${c.numero}.`, items: c.items, estado: 'Pendiente', _nuevo: true }, entidadId); },
      verCom: async (d) => {
        const x = reg(d.id); const ent = await S.get('entidades', x.entidad_id);
        if (tipo === 'factura') {
          if (!x.archivo) return toast('Esta factura no tiene PDF adjunto', true);
          const b = await S.fileBlob(x.archivo); if (!b) return toast('El archivo no está disponible', true);
          return UI.verPDF({ titulo: `Factura ${x.numero}`, blob: b, nombre: `Factura_${x.numero}.pdf` });
        }
        const blob = tipo === 'cotizaciones' ? PDF.cotizacion({ c: x, ent, emp: st.emp, fmt: st.fmt.cotizacion, firma: st.firma }).output('blob') : await FMT.cuentaCobro({ cc: x, ent });
        S.log('CONSULTA', tabla, x.id, x.numero);
        UI.verPDF({ titulo: x.numero, blob, nombre: `${x.numero}.pdf` });
      },
    });
  };

  A.formComercial = async (tipo, x = null, entidadId = null) => {
    const ents = await S.list('entidades', {}, 'razon_social');
    const tabla = tipo === 'cotizaciones' ? 'cotizaciones' : 'cobros';
    const nuevo = !x || x._nuevo;
    let numero = x?.numero;
    const sugeridoCC = tipo === 'cuenta_cobro' && nuevo ? (await A.CONS.siguiente('cuenta_cobro')) : null;
    if (sugeridoCC && (!numero || x?._nuevo)) numero = sugeridoCC;
    if (!numero) { const todos = await S.list(tabla, tabla === 'cobros' ? { tipo } : {}); numero = tipo === 'factura' ? '' : tipo === 'cuenta_cobro' ? (await A.CONS.siguiente('cuenta_cobro')) || A.consecutivoCC(todos) : A.consecutivo(todos, 'numero', `COT-${anioAct}-`); }
    let archivo = null;
    const itemsCols = [{ k: 'descripcion', ph: 'Descripción del servicio o producto', w: '3fr' }, { k: 'cantidad', ph: 'Cant.', type: 'number', w: '.6fr' }, { k: 'valor', ph: 'Valor unitario', type: 'number', w: '1fr' }];
    modal({
      titulo: { cotizaciones: 'Cotización', cuenta_cobro: 'Cuenta de cobro', factura: 'Factura' }[tipo] + (nuevo ? ' nueva' : ` ${x.numero}`), size: 'wide',
      cuerpo: `<form class="form" onsubmit="return false"><div class="fields">
        ${f.sel('entidad_id', 'Entidad *', [['', '— Seleccione —'], ...ents.map((e) => [e.id, e.razon_social])], x?.entidad_id || entidadId || '')}${f.input('numero', tipo === 'factura' ? 'Número de factura *' : 'Número', numero)}${f.input('fecha', 'Fecha', x?.fecha || UI.hoy(), { type: 'date' })}
        ${tipo === 'cotizaciones' ? `${f.input('validez_dias', 'Validez (días)', x?.validez_dias || 30, { type: 'number' })}${f.input('iva', 'IVA %', x?.iva ?? 0, { type: 'number' })}${f.sel('estado', 'Estado', ['Borrador', 'Enviada', 'Aprobada', 'Rechazada'], x?.estado || 'Borrador')}`
          : `${f.sel('estado', 'Estado', ['Pendiente', 'Pagada', 'Anulada'], x?.estado || 'Pendiente')}${tipo === 'factura' ? f.input('total', 'Valor total (COP) *', x?.total, { type: 'number' }) : ''}`}
        ${tipo === 'factura' ? f.area('concepto', 'Por concepto de', x?.concepto, { rows: 2 }) : tipo === 'cuenta_cobro' ? f.area('concepto', 'Texto introductorio del concepto (opcional)', x?.concepto, { rows: 2 }) + '<p class="muted field full">Cada ítem sale numerado en “Por concepto de”, por ejemplo: “Cuota correspondiente al mes de marzo del contrato No. 05-2026, con el objeto de…”.</p>' : ''}</div>
        ${tipo !== 'factura' ? `<div class="field"><span class="lbl">Ítems</span>${rep('items', itemsCols, x?.items || [])}<div class="muted" data-tot></div></div>` : `<div class="field"><span class="lbl">PDF de la factura electrónica</span><input type="file" accept="application/pdf" data-fact>${x?.archivo ? '<span class="muted">Ya tiene un PDF adjunto; cargue otro para reemplazarlo.</span>' : ''}</div>`}
        ${tipo === 'cotizaciones' ? f.area('condiciones', 'Condiciones comerciales', x?.condiciones ?? st.fmt.cotizacion.condiciones, { rows: 4 }) : ''}</form>`,
      alAbrir: (m) => {
        repBind(m.body);
        const t = m.body.querySelector('[data-tot]');
        const calc = () => { if (!t) return; const s = totalItems(repLeer(m.body, 'items')); const iva = Number(m.body.querySelector('[name=iva]')?.value || 0); t.textContent = `Subtotal ${PDF.pesos(s)}${iva ? ` · IVA ${PDF.pesos(s * iva / 100)}` : ''} · Total ${PDF.pesos(s * (1 + iva / 100))}`; };
        m.body.addEventListener('input', calc); m.body.addEventListener('click', () => setTimeout(calc)); calc();
        const fa = m.body.querySelector('[data-fact]'); if (fa) fa.onchange = (e) => { archivo = e.target.files[0] || null; };
      },
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
        const v = leer(m.body); if (!v.entidad_id) { toast('Seleccione la entidad', true); return false; }
        if (!v.numero) { toast('Escriba el número', true); return false; }
        const o = { entidad_id: v.entidad_id, numero: v.numero, fecha: v.fecha, estado: v.estado };
        if (tipo === 'cotizaciones') Object.assign(o, { validez_dias: Number(v.validez_dias) || 30, iva: Number(v.iva) || 0, condiciones: v.condiciones, items: repLeer(m.body, 'items') });
        else {
          Object.assign(o, { tipo, concepto: v.concepto });
          if (tipo === 'cuenta_cobro') { o.items = repLeer(m.body, 'items'); o.total = totalItems(o.items); }
          else { o.total = Number(v.total) || 0; if (archivo) { const path = `${v.entidad_id}/general/facturas/${Date.now()}-factura-${v.numero.replace(/[^\w-]+/g, '_')}.pdf`; await S.upload(path, archivo); o.archivo = path; } }
        }
        let numReg = null;
        if (nuevo && tipo === 'cuenta_cobro') {
          numReg = await A.CONS.registrar({ serie: 'cuenta_cobro', numero: v.numero, sugerido: sugeridoCC, entidad_id: v.entidad_id, fecha: v.fecha,
            observacion: (o.items || []).map((i) => i.descripcion).filter(Boolean).join('; ').slice(0, 200) || v.concepto || 'Cuenta de cobro' });
          o.numero = numReg.numero;
        }
        let g;
        try { g = nuevo ? await S.insert(tabla, o) : await S.update(tabla, x.id, o); } catch (e) { if (numReg) await A.CONS.liberar(numReg); throw e; }
        if (numReg) await A.CONS.vincular(numReg, 'cobros', g.id);
        toast(nuevo && numReg ? `Cuenta de cobro ${o.numero} guardada` : 'Guardado'); A.recargar();
      } }],
    });
  };

  A.V.comercial = async () => {
    const pest = st.comTab || 'cotizaciones';
    A.content().innerHTML = `<div class="page-head"><div><span class="eyebrow">Comercial</span><h1>Cotizaciones y cobros</h1></div></div>
      <div class="tabs">${[['cotizaciones', 'Cotizaciones'], ['cuenta_cobro', 'Cuentas de cobro'], ['factura', 'Facturas']].map(([k, t]) => `<button data-act="tab" data-k="${k}" class="${k === pest ? 'on' : ''}">${t}</button>`).join('')}</div><div id="com"></div>`;
    A.acts({ tab: (d) => { st.comTab = d.k; A.recargar(); } });
    await A.listaComercial(document.getElementById('com'), pest, null);
  };

  // =================================================================== USUARIOS
  A.V.usuarios = async ({ ent: filtroEnt } = {}) => {
    const [perf, ents] = await Promise.all([S.list('perfiles'), S.list('entidades', {}, 'razon_social')]);
    const en = (id) => ents.find((e) => e.id === id)?.razon_social || '—';
    const lista = perf.filter((p) => !filtroEnt || p.entidad_id === filtroEnt).sort((a, b) => (a.rol === 'propietario' ? -1 : b.rol === 'propietario' ? 1 : en(a.entidad_id).localeCompare(en(b.entidad_id))));
    A.content().innerHTML = `${filtroEnt ? A.migasNav([['Entidades', 'entidades'], [en(filtroEnt), 'entidad', { id: filtroEnt }], 'Accesos']) : ''}
      <div class="page-head"><div><span class="eyebrow">Perfiles de acceso</span><h1>Usuarios y accesos</h1><span class="muted">Cada entidad tiene su propio usuario y contraseña y solo ve su carpeta, en modo consulta. Solo el propietario crea, modifica o elimina información.</span></div>
        <div class="actions"><button class="btn pri" data-act="nuevoU">${I.mas} Nuevo usuario de cliente</button></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Entidad</th><th>Estado</th><th></th></tr></thead><tbody>
        ${lista.map((p) => `<tr><td class="mono"><b>${h(p.usuario || p.email)}</b></td><td>${h(p.nombre || '')}</td><td><span class="pill ${p.rol === 'propietario' ? 'acc' : ''}">${p.rol === 'propietario' ? 'Propietario' : 'Cliente · consulta'}</span></td><td>${p.rol === 'propietario' ? 'Todas' : h(en(p.entidad_id))}</td>
          <td>${p.activo ? '<span class="pill ok">Activo</span>' : '<span class="pill bad">Desactivado</span>'}</td>
          <td><div class="row-actions">${p.rol !== 'propietario' ? `<button class="btn sm" data-act="clave" data-id="${p.id}">${I.llave} Contraseña</button><button class="btn sm" data-act="activo" data-id="${p.id}">${p.activo ? 'Desactivar' : 'Activar'}</button><button class="icon-btn" data-act="editU" data-id="${p.id}" aria-label="Editar">${I.edit}</button>` : ''}</div></td></tr>`).join('') || '<tr><td colspan="6" class="empty">Sin usuarios.</td></tr>'}
      </tbody></table></div>
      ${S.modo === 'nube' ? '<p class="muted">El cliente ingresa con su usuario (sin @) y su contraseña. Internamente el sistema lo convierte en un correo del dominio configurado.</p>' : ''}`;
    const p = (id) => perf.find((x) => x.id === id);
    A.acts({
      nuevoU: () => modal({
        titulo: 'Nuevo usuario de cliente',
        cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.sel('entidad_id', 'Entidad *', [['', '— Seleccione —'], ...ents.map((e) => [e.id, e.razon_social])], filtroEnt || '')}${f.input('nombre', 'Nombre de la persona o cargo', '')}
          ${f.input('usuario', 'Usuario *', '', { attrs: 'autocapitalize="none" placeholder="ej: clinica.sanjose"' })}${f.input('clave', 'Contraseña * (mínimo 6)', '', { attrs: 'autocomplete="new-password"' })}</div>
          <p class="muted">Entregue estos datos al cliente. Podrá ver y descargar en PDF toda la documentación de su entidad.</p></form>`,
        acciones: [{ t: 'Cancelar' }, { t: 'Crear usuario', cls: 'pri', fn: async (m) => {
          const d = leer(m.body); d.usuario = d.usuario.toLowerCase().replace(/\s+/g, '.');
          if (!d.entidad_id || !d.usuario || d.clave.length < 6) { toast('Complete entidad, usuario y una contraseña de mínimo 6 caracteres', true); return false; }
          if (!/^[a-z0-9._-]+$/.test(d.usuario)) { toast('El usuario solo puede tener letras, números, punto, guion', true); return false; }
          await S.crearUsuarioCliente(d); toast(`Usuario ${d.usuario} creado`); A.recargar();
        } }],
      }),
      clave: (d) => modal({ titulo: `Nueva contraseña · ${p(d.id).usuario}`, size: 'sm', cuerpo: `<div class="form">${f.input('clave', 'Nueva contraseña (mínimo 6)', '', { attrs: 'autocomplete="new-password"' })}</div>`,
        acciones: [{ t: 'Cancelar' }, { t: 'Cambiar', cls: 'pri', fn: async (m) => { await S.cambiarClave(d.id, leer(m.body).clave); toast('Contraseña actualizada'); } }] }),
      activo: async (d) => { await S.update('perfiles', d.id, { activo: !p(d.id).activo }); A.recargar(); },
      editU: (d) => modal({ titulo: 'Editar usuario', size: 'sm', cuerpo: `<div class="form">${f.input('nombre', 'Nombre', p(d.id).nombre)}${f.sel('entidad_id', 'Entidad', ents.map((e) => [e.id, e.razon_social]), p(d.id).entidad_id)}</div>`,
        acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => { await S.update('perfiles', d.id, leer(m.body)); A.recargar(); } }] }),
    });
  };

  // =================================================================== FORMATOS
  A.V.formatos = async () => {
    const nombres = { hoja_vida: 'Hoja de vida', inventario: 'Inventario', cronograma: 'Cronogramas', mto_preventivo: 'Mantenimiento preventivo', mto_correctivo: 'Mantenimiento correctivo', metrologia: 'Metrología', alertas: 'Bitácora alertas sanitarias', evento: 'Reporte tecnovigilancia', acta_baja: 'Acta de baja', acta_entrega: 'Acta de entrega', cotizacion: 'Cotización', cuenta_cobro: 'Cuenta de cobro' };
    A.content().innerHTML = `<div class="page-head"><div><span class="eyebrow">Control documental</span><h1>Formatos</h1><span class="muted">Los cambios aplican a todos los PDF que se generen desde ahora. Solo el propietario puede modificarlos.</span></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Formato</th><th>Título impreso</th><th>Código</th><th>Versión</th><th>Fecha aprobación</th><th></th></tr></thead><tbody>
      ${Object.keys(CAT.FORMATOS).map((k) => { const x = st.fmt[k]; return `<tr><td><b>${nombres[k] || k}</b></td><td>${h(x.titulo)}</td><td class="mono">${h(x.codigo)}</td><td class="mono">${h(x.version)}</td><td class="num">${UI.fecha(x.fecha)}</td><td class="r"><button class="btn sm" data-act="editF" data-k="${k}">${I.edit} Modificar</button></td></tr>`; }).join('')}
      </tbody></table></div>
      <section class="panel" id="biblio"></section>`;
    A.acts({
      editF: (d) => {
        const x = st.fmt[d.k], lista = (a) => (a || []).join('\n');
        modal({
          titulo: `Formato · ${nombres[d.k]}`,
          cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('titulo', 'Título impreso', x.titulo, { full: true })}${f.input('codigo', 'Código', x.codigo)}${f.input('version', 'Versión', x.version)}${f.input('fecha', 'Fecha de aprobación', x.fecha, { type: 'date' })}
            ${d.k === 'mto_preventivo' ? `${f.area('pruebas', 'Pruebas cualitativas por defecto (una por línea)', lista(x.pruebas), { rows: 6 })}${f.area('actividades', 'Actividades de mantenimiento (una por línea)', lista(x.actividades), { rows: 6 })}${f.area('herramientas', 'Herramientas e insumos (una por línea)', lista(x.herramientas), { rows: 5 })}` : ''}
            ${d.k === 'cotizacion' ? f.area('condiciones', 'Condiciones comerciales por defecto', x.condiciones, { rows: 5 }) : ''}</div></form>`,
          acciones: [{ t: 'Restablecer original', fn: async () => { await S.upsert('formatos', { clave: d.k, datos: CAT.FORMATOS[d.k] }); await A.cargarConfig(); A.recargar(); } }, { t: 'Cancelar' }, { t: 'Guardar formato', cls: 'pri', fn: async (m) => {
            const v = leer(m.body); ['pruebas', 'actividades', 'herramientas'].forEach((k) => { if (k in v) v[k] = v[k].split('\n').map((s) => s.trim()).filter(Boolean); });
            await S.upsert('formatos', { clave: d.k, datos: { ...x, ...v } }); await A.cargarConfig(); toast('Formato actualizado'); A.recargar();
          } }],
        });
      },
    });
    await A.archivos(document.getElementById('biblio'), { entidad_id: null, equipo_id: null, carpeta: 'formatos_base', titulo: 'Biblioteca de formatos (plantillas Excel y Word)' });
  };

  // =================================================================== AUDITORÍA
  A.V.auditoria = async () => {
    const [aud, ents] = await Promise.all([S.list('auditoria', {}, '-fecha'), S.list('entidades')]);
    let fa = '', ft = '';
    A.content().innerHTML = `<div class="page-head"><div><span class="eyebrow">Trazabilidad</span><h1>Pista de auditoría</h1><span class="muted">Registro inalterable de quién ingresó, consultó, descargó, creó, modificó, firmó o eliminó información y cuándo.</span></div></div>
      <div class="actions"><div class="field"><select data-fa aria-label="Acción"><option value="">Todas las acciones</option>${['INSERT', 'UPDATE', 'DELETE', 'CONSULTA', 'DESCARGA', 'FIRMA', 'LOGIN'].map((a) => `<option>${a}</option>`).join('')}</select></div>
        <div class="field"><input data-ft placeholder="Buscar usuario, entidad o registro" aria-label="Buscar"></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Acción</th><th>Detalle</th><th>Entidad</th></tr></thead><tbody></tbody></table></div>`;
    const en = (id) => ents.find((e) => e.id === id)?.razon_social || '';
    const cambios = (a) => {
      if (a.accion !== 'UPDATE' || !a.antes || !a.despues) return '';
      const k = Object.keys(a.despues).filter((x) => !['updated_at', 'created_at'].includes(x) && JSON.stringify(a.antes[x]) !== JSON.stringify(a.despues[x]));
      return k.length ? `<div class="muted" style="font-size:.8rem">${k.slice(0, 4).map((x) => `${h(x)}: <s>${h(String(typeof a.antes[x] === 'object' ? '…' : a.antes[x] ?? '—').slice(0, 30))}</s> → ${h(String(typeof a.despues[x] === 'object' ? '(actualizado)' : a.despues[x] ?? '—').slice(0, 30))}`).join(' · ')}</div>` : '';
    };
    const pintar = () => {
      const t = ft.toLowerCase();
      const l = aud.filter((a) => (!fa || a.accion === fa) && (!t || `${a.usuario} ${en(a.entidad_id)} ${a.detalle} ${JSON.stringify(a.despues || a.antes || {})}`.toLowerCase().includes(t))).slice(0, 400);
      A.content().querySelector('tbody').innerHTML = l.map((a) => `<tr><td class="num" style="white-space:nowrap">${UI.fechaHora(a.fecha)}</td><td class="mono">${h(a.usuario || '')}</td><td><span class="pill ${a.accion === 'DELETE' ? 'bad' : a.accion === 'UPDATE' ? 'warn' : a.accion === 'INSERT' ? 'ok' : 'acc'}">${a.accion}</span></td><td>${A.accionTxt(a)}${cambios(a)}</td><td>${h(en(a.entidad_id))}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Sin registros.</td></tr>';
    };
    A.content().querySelector('[data-fa]').onchange = (e) => { fa = e.target.value; pintar(); };
    A.content().querySelector('[data-ft]').oninput = (e) => { ft = e.target.value; pintar(); };
    pintar();
  };

  // =================================================================== EMPRESA Y FIRMA
  A.V.empresa = async () => {
    const e = st.emp;
    const campos = [['nombre', 'Razón social'], ['sigla', 'Sigla'], ['responsable', 'Profesional responsable'], ['cedula', 'Cédula'], ['cargo', 'Cargo'], ['matricula', 'Matrícula profesional'], ['invima', 'Inscripción INVIMA'], ['direccion', 'Dirección'], ['ciudad', 'Ciudad'], ['telefono', 'Teléfono principal'], ['telefono2', 'Teléfono alterno'], ['email', 'Correo'], ['cobro_titular', 'Cuenta de cobro: titular (DEBE A)'], ['cobro_documento', 'Cuenta de cobro: NIT / C.C. del titular'], ['cobro_expedicion', 'C.C. expedida en'], ['cobro_ciudad', 'Ciudad de expedición de la cuenta'], ['banco', 'Banco'], ['tipo_cuenta', 'Tipo de cuenta (Ahorros / Corriente)'], ['numero_cuenta', 'Número de cuenta'], ['regimen', 'Régimen tributario']];
    A.content().innerHTML = `<div class="page-head"><div><span class="eyebrow">Configuración</span><h1>Mi empresa y firma</h1><span class="muted">Estos datos aparecen en el pie de todos los formatos, cotizaciones y cuentas de cobro.</span></div></div>
      <div class="grid2"><section class="panel"><header><h2>Datos de la empresa</h2></header><form class="form" id="fEmp" onsubmit="return false"><div class="fields">${campos.map(([k, l]) => f.input(k, l, e[k])).join('')}</div><button class="btn pri" data-act="guardarEmp" style="justify-self:start">Guardar datos</button></form></section>
      <div style="display:grid;gap:18px;align-content:start">
        <section class="panel"><header><h2>Firma digital</h2></header><p class="muted">Se inserta en hojas de vida, reportes, actas, cotizaciones y cuentas de cobro, y sirve para firmar PDF cargados.</p>
          <div class="sig-prev" style="height:110px">${st.firma ? `<img src="${st.firma}" alt="Firma guardada">` : '<span class="muted">Sin firma registrada</span>'}</div>
          <div class="actions"><button class="btn pri" data-act="firma">${I.firma} ${st.firma ? 'Cambiar firma' : 'Registrar firma'}</button>${st.firma ? `<button class="btn danger" data-act="sinFirma">${I.del} Quitar</button>` : ''}</div></section>
        <section class="panel"><header><h2>Firma de cuentas de cobro</h2></header><p class="muted">Firma de ${h(e.cobro_titular || 'el titular')} que aparece en cada cuenta de cobro.</p>
          <div class="sig-prev" style="height:90px">${e.firma_cobro ? `<img src="${e.firma_cobro}" alt="Firma de cuentas de cobro">` : '<span class="muted">Sin firma registrada</span>'}</div>
          <div class="actions"><button class="btn" data-act="firmaCobro">${I.firma} ${e.firma_cobro ? 'Cambiar' : 'Registrar'} firma</button></div></section>
        <section class="panel"><header><h2>Mi contraseña</h2></header><div class="form"><div class="fields">${f.input('nueva', 'Nueva contraseña', '', { type: 'password', attrs: 'autocomplete="new-password"' })}</div><button class="btn" data-act="miClave" style="justify-self:start">${I.llave} Cambiar contraseña</button></div></section>
        <section class="panel"><header><h2>Almacenamiento</h2></header><p>${S.modo === 'nube' ? '<span class="pill ok">Nube conectada</span> Los datos y archivos se guardan en Supabase y están disponibles en todos sus dispositivos.' : '<span class="pill warn">Modo demostración</span> Los datos se guardan solo en este navegador. Siga la guía de instalación para conectar la nube gratuita.'}</p></section>
      </div></div>`;
    A.acts({
      guardarEmp: async () => { const d = { ...st.emp, ...leer(document.getElementById('fEmp')) }; await S.upsert('empresa', { id: 1, datos: d, firma: st.firma }); await A.cargarConfig(); toast('Datos guardados'); },
      firmaCobro: async () => { const d = await UI.pedirFirma({ titulo: 'Firma para cuentas de cobro', actual: st.emp.firma_cobro }); if (!d) return; await S.upsert('empresa', { id: 1, datos: { ...st.emp, firma_cobro: d }, firma: st.firma }); await A.cargarConfig(); toast('Firma de cuentas de cobro guardada'); A.recargar(); },
      firma: async () => { const d = await UI.pedirFirma({ titulo: 'Firma del propietario' }); if (!d) return; await S.upsert('empresa', { id: 1, datos: st.emp, firma: d }); await A.cargarConfig(); toast('Firma guardada'); A.recargar(); },
      sinFirma: async () => { if (await confirmar('¿Quitar la firma guardada?', 'Quitar')) { await S.upsert('empresa', { id: 1, datos: st.emp, firma: null }); await A.cargarConfig(); A.recargar(); } },
      miClave: async () => { const v = A.content().querySelector('[name=nueva]').value; await S.cambiarMiClave(v); toast('Contraseña actualizada'); A.content().querySelector('[name=nueva]').value = ''; },
    });
  };

  // =================================================================== CUENTA DEL CLIENTE
  A.V.cuenta = async () => {
    const e = st.emp;
    A.content().innerHTML = `<div class="page-head"><div><span class="eyebrow">Mi cuenta</span><h1>${h(st.perfil.nombre || st.perfil.usuario)}</h1></div></div>
      <div class="grid2"><section class="panel"><header><h2>Cambiar contraseña</h2></header><div class="form"><div class="fields">${f.input('nueva', 'Nueva contraseña (mínimo 6)', '', { type: 'password', attrs: 'autocomplete="new-password"' })}</div><button class="btn pri" data-act="miClave" style="justify-self:start">Cambiar contraseña</button></div></section>
      <section class="panel"><header><h2>Soporte técnico</h2></header><p><b>${h(e.nombre)}</b><br>${h(e.direccion)}<br>${h(e.ciudad)}<br>Contacto: <span class="mono">${h(e.telefono)}</span><br>${h(e.email)}</p></section></div>`;
    A.acts({ miClave: async () => { const v = A.content().querySelector('[name=nueva]').value; await S.cambiarMiClave(v); toast('Contraseña actualizada'); } });
  };

  A.arrancar();
})();
