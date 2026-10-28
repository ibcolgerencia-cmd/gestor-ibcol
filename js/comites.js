// =====================================================================
//  COMITÉS: Formato Acta de Reunión FAR-013 (comité de tecnovigilancia,
//  reuniones y capacitaciones). Cada acta se guarda en la tabla
//  actas_comite y su PDF (mismo diseño del formato Word de IBCOL) queda en
//  la carpeta COMITÉS de la entidad.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, confirmar, leer, f } = UI;
  const esProp = A.esProp;
  const anioAct = new Date().getFullYear();
  const TRIM = ['Primer trimestre', 'Segundo trimestre', 'Tercer trimestre', 'Cuarto trimestre'];
  const ORDEN = ['Verificación de asistencia.', 'Lectura y aprobación del acta anterior.', 'Revisión de alertas sanitarias emitidas por INVIMA.',
    'Análisis de eventos adversos reportados en el último trimestre.', 'Seguimiento al mantenimiento preventivo de equipos biomédicos.', 'Propuestas de mejora y compromisos.', 'Programación de próxima reunión.'];
  const COORD = 'Ingeniera biomédica - Referente de Tecnovigilancia';
  const nrm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const mesesTxt = (l) => { const m = (l || []).map((i) => CAT.MESES[i - 1].toLowerCase()); return m.length > 1 ? `${m.slice(0, -1).join(', ')} y ${m[m.length - 1]}` : m[0] || ''; };
  const objetivoDe = (meses, anio) => `Seguimiento al programa de Tecnovigilancia y revisión de eventos adversos reportados (Risarh) de los meses de ${mesesTxt(meses) || '[MESES]'} de ${anio}.`;
  const trimDe = (fecha) => Math.floor((new Date((fecha || UI.hoy()) + 'T12:00:00').getMonth()) / 3);
  const fmtFAR = () => st.fmt.acta_comite || CAT.FORMATOS.acta_comite;
  const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(0, 80);
  const horaTxt = (t) => { if (!t) return ''; const [hh, mm] = t.split(':').map(Number); return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'a. m.' : 'p. m.'}`; };
  const fechaLarga = (s) => { if (!s) return ''; const d = new Date(String(s).slice(0, 10) + 'T12:00:00'); return `${d.getDate()} de ${CAT.MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`; };

  // ------------------------------------------------------------------ lista del comité
  // Dónde se guarda el PDF de cada acta: PROGRAMA DE TECNOVIGILANCIA › (subcarpeta de comités existente, ej. "3. COMITES")
  const destinoActas = async (ent) => {
    const docs = await S.list('documentos', { entidad_id: ent.id });
    const sub = docs.filter((d) => d.carpeta === 'tecnovigilancia' && /comit/i.test(d.subcarpeta || '')).map((d) => d.subcarpeta)[0];
    return { carpeta: 'tecnovigilancia', subcarpeta: sub || '3. COMITES' };
  };
  // Carpeta PROGRAMA DE TECNOVIGILANCIA: eventos adversos + actas de comité FAR-013
  A.G.tecnovigilancia = async (el, ctx) => {
    el.innerHTML = '<div data-tv-ev></div><div data-tv-com></div>';
    await A.G.eventos(el.querySelector('[data-tv-ev]'), ctx);
    await A.G.comites(el.querySelector('[data-tv-com]'), ctx);
  };
  A.G.comites = async (el, { ent }) => {
    let lista;
    try { lista = await S.list('actas_comite', { entidad_id: ent.id }); } catch (er) {
      el.innerHTML = `<section class="panel"><header><h2>Actas de comité y reuniones</h2></header><div class="empty">${/actas_comite|relation|schema cache|does not exist/i.test(er.message) ? `Falta instalar la tabla de actas en la base de datos.${esProp() ? ' En Supabase → SQL Editor ejecute una vez el archivo <span class="mono">supabase/comites.sql</span> del repositorio.' : ' Avise a IBCOL.'}` : h(er.message)}</div></section>`;
      return;
    }
    const actas = lista.sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')) || String(b.numero || '').localeCompare(String(a.numero || '')));
    el.innerHTML = `<section class="panel"><header><div><h2>Comité de tecnovigilancia · Actas ${h(fmtFAR().codigo)}</h2><span class="muted" style="font-size:.85rem">Formato acta de reunión ${h(fmtFAR().codigo)} para comités, reuniones y capacitaciones. Cada acta genera su PDF en la subcarpeta de comités de esta carpeta.</span></div>
        ${esProp() ? `<div class="actions"><button class="btn pri" data-act="nuevaActa">${I.mas} Nueva acta de comité (${h(fmtFAR().codigo)})</button></div>` : ''}</header>
      ${actas.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Acta No.</th><th>Fecha</th><th>Tipo</th><th>Tema</th><th>Compromisos</th><th>Firmas</th><th>Próxima reunión</th><th></th></tr></thead><tbody>
        ${actas.map((a) => { const d = a.datos || {}; const as = (d.asistentes || []).filter((x) => x.nombre); const fir = as.filter((x) => x.firma).length; return `<tr class="clic" data-act="verActa" data-id="${a.id}">
          <td class="mono">${h(a.numero || '')}</td><td class="num">${UI.fecha(a.fecha)}</td><td>${h(d.tipo || '')}</td><td>${h(a.tema || '')}</td>
          <td>${(d.compromisos || []).filter((c) => c.actividad).length} · ${h(d.trimestre || '')} ${h(d.anio_comp || '')}</td>
          <td><span class="pill ${as.length && fir === as.length ? 'ok' : 'warn'}">${fir}/${as.length}</span></td><td class="num">${d.proxima ? UI.fechaHora ? UI.fechaHora(d.proxima) : d.proxima : '—'}</td>
          <td><div class="row-actions"><button class="icon-btn" data-act="verActa" data-id="${a.id}" aria-label="Ver PDF">${I.pdf}</button>${esProp() ? `<button class="icon-btn" data-act="editActa" data-id="${a.id}" aria-label="Editar">${I.edit}</button><button class="icon-btn" data-act="copiaActa" data-id="${a.id}" aria-label="Nueva acta a partir de esta" title="Nueva acta a partir de esta">${I.mas}</button><button class="icon-btn bad" data-act="delActa" data-id="${a.id}" aria-label="Eliminar">${I.del}</button>` : ''}</div></td></tr>`; }).join('')}
      </tbody></table></div>` : `<div class="empty">Aún no hay actas.${esProp() ? ' Use “Nueva acta de comité”.' : ''}</div>`}</section>`;
    const reg = (id) => actas.find((x) => x.id === id);
    A.acts({
      nuevaActa: () => A.formActa(ent, null, actas),
      editActa: (d) => A.formActa(ent, reg(d.id), actas),
      copiaActa: (d) => { const b = reg(d.id); A.formActa(ent, { datos: { ...b.datos, asistentes: (b.datos.asistentes || []).map((x) => ({ ...x, firma: null })), compromisos: b.datos.compromisos, fotos: [], anexos: [], desarrollo: '', conclusiones: '' }, tema: b.tema, _copia: true }, actas); },
      verActa: async (d) => {
        const a = reg(d.id);
        try {
          let blob = null;
          if (a.archivo) blob = await S.fileBlob(a.archivo).catch(() => null);
          if (!blob) blob = await A.pdfActa(ent, a);
          S.log('CONSULTA', 'actas_comite', a.id, `Acta ${a.numero}`);
          UI.verPDF({ titulo: `Acta ${a.numero} · ${a.tema || ''}`, blob, nombre: `Acta_${slug(a.numero)}_${slug(a.tema || 'comite')}.pdf`, alDescargar: () => S.log('DESCARGA', 'actas_comite', a.id, `Acta ${a.numero}`) });
        } catch (er) { toast(er.message, true); }
      },
      delActa: async (d) => {
        const a = reg(d.id);
        if (!(await confirmar(`¿Eliminar el acta ${a.numero}? También se borra su PDF.`))) return;
        if (a.documento_id) { const doc = await S.get('documentos', a.documento_id); if (doc) { try { await S.removeFile(doc.archivo); } catch {} await S.remove('documentos', doc.id); } }
        await S.remove('actas_comite', a.id); toast('Acta eliminada'); A.recargar();
      },
    });
  };

  // ------------------------------------------------------------------ formulario (todas las indicaciones del formato FAR-013)
  const tabs = (l) => `<div class="tabs" role="tablist">${l.map((t, i) => `<button type="button" role="tab" data-tab="${i}" class="${i ? '' : 'on'}">${h(t)}</button>`).join('')}</div>`;
  const firmaCelda = (src) => (src ? `<img src="${src}" alt="Firma">` : '<span class="muted">Sin firma</span>');
  const filaAsis = (x = {}) => `<div class="ac-asis"><input data-k="nombre" placeholder="Nombre" aria-label="Nombre" value="${h(x.nombre || '')}"><input data-k="cargo" placeholder="Cargo" aria-label="Cargo" value="${h(x.cargo || '')}">
    <div class="ac-firma" data-firma="${h(x.firma || '')}">${firmaCelda(x.firma)}</div><div class="ac-fbtn"><button type="button" class="btn sm" data-fdib>${I.firma} Firmar</button><label class="btn sm">${I.subir} Cargar firma<input type="file" accept="image/*" hidden data-fimg></label><button type="button" class="icon-btn bad" data-fdel aria-label="Quitar asistente">${I.x}</button></div></div>`;
  const filaComp = (c = {}) => `<div class="ac-comp"><input data-k="responsable" placeholder="Nombre del responsable" aria-label="Responsable" value="${h(c.responsable || '')}"><input data-k="actividad" placeholder="Actividad programada" aria-label="Actividad" value="${h(c.actividad || '')}"><input data-k="fecha" type="date" aria-label="Fecha límite" value="${h(c.fecha || '')}"><button type="button" class="icon-btn bad" data-cdel aria-label="Quitar compromiso">${I.x}</button></div>`;
  const filaOrden = (t = '') => `<div class="ac-orden"><input data-k="t" value="${h(t)}" aria-label="Punto del orden del día"><button type="button" class="icon-btn bad" data-odel aria-label="Quitar punto">${I.x}</button></div>`;

  A.formActa = async (ent, a = null, todas = []) => {
    const d = a?.datos || {};
    const nums = todas.map((x) => parseInt(String(x.numero || '').replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
    const numero = a?.numero && !a._copia ? a.numero : String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0');
    const fecha = (!a?._copia && a?.fecha) || UI.hoy();
    const tr = trimDe(fecha); const mesesDef = d.meses && !a?._copia ? d.meses : [tr * 3 + 1, tr * 3 + 2, tr * 3 + 3];
    const anioObj = d.anio_obj || new Date(fecha + 'T12:00:00').getFullYear();
    const asis = d.asistentes?.length ? d.asistentes : [{}, {}, {}, { nombre: st.emp.responsable || 'Laura María Pistala', cargo: 'Ingeniera Biomédica', firma: st.firma || null }];
    let fotos = [...(d.fotos || [])], anexos = [...(d.anexos || [])]; const nuevasFotos = [], nuevosAnexos = [];
    let objetivoManual = !!d.objetivo_manual;
    const cuerpo = `<form class="form acta-form" onsubmit="return false">${tabs(['1. Encuentro', '2. Desarrollo', '3. Asistentes', '4. Compromisos y cierre', '5. Evidencia y anexos'])}
      <div data-panel="0"><div class="fields">
        ${f.input('fecha', 'Fecha del encuentro', fecha, { type: 'date' })}
        ${f.sel('tipo', 'Tipo de encuentro', ['Comité', 'Reunión', 'Capacitación'], d.tipo || 'Comité')}
        ${f.input('hora_ini', 'Hora inicial', d.hora_ini || '08:00', { type: 'time' })}${f.input('hora_fin', 'Hora final', d.hora_fin || '10:00', { type: 'time' })}
        ${f.sel('metodologia', 'Metodología', ['Presencial', 'Virtual'], d.metodologia || 'Presencial')}
        ${f.input('tema', 'Tema a tratar (comité)', a?.tema || 'Comité de Tecnovigilancia', { full: true })}
        ${f.input('coordinador', 'Coordinador de la reunión', d.coordinador || COORD, { full: true })}
        ${f.input('empresa', 'Empresa', d.empresa || ent.razon_social || '')}${f.input('area', 'Área o servicio', d.area || '')}
        ${f.sel('pretest', 'Pre-test', ['No aplica', 'Aplica'], d.pretest || 'No aplica')}${f.sel('postest', 'Post-test', ['No aplica', 'Aplica'], d.postest || 'No aplica')}
      </div></div>
      <div data-panel="1" hidden><div class="fields">
        ${f.input('numero', 'Acta No. (puede cambiarlo)', numero)}${f.sel('anio_obj', 'Año de los meses revisados', [anioAct - 2, anioAct - 1, anioAct, anioAct + 1], anioObj)}
        <div class="field full"><span class="lbl">Meses revisados en el objetivo</span><div class="mes-grid ac-meses">${CAT.MESES.map((m, i) => `<label class="mes-chk ${mesesDef.includes(i + 1) ? 'on' : ''}"><input type="checkbox" name="meses" value="${i + 1}" ${mesesDef.includes(i + 1) ? 'checked' : ''}><b>${m}</b></label>`).join('')}</div></div>
        ${f.area('objetivo', 'Objetivo de la reunión', d.objetivo || objetivoDe(mesesDef, anioObj), { rows: 2 })}
        <div class="field full"><span class="lbl">Orden del día</span><div class="ac-ordenes" data-ordenes>${(d.orden || ORDEN).map(filaOrden).join('')}</div><button type="button" class="btn sm" data-oadd style="justify-self:start">${I.mas} Agregar punto</button></div>
        <div class="field full"><div class="actions" style="justify-content:space-between;align-items:center"><label for="f_desarrollo">Desarrollo de la reunión</label><span class="actions" style="gap:6px"><button type="button" class="btn sm" data-datos>Traer datos de la app</button><button type="button" class="btn sm" data-iaact>${I.ia} Redactar con IA</button></span></div>
          <textarea id="f_desarrollo" name="desarrollo" rows="10" placeholder="Desarrollo de cada punto del orden del día. Use “- ” al inicio de una línea para viñetas.">${h(d.desarrollo || '')}</textarea><span class="muted" data-iaest style="font-size:.82rem"></span></div>
      </div></div>
      <div data-panel="2" hidden><p class="muted">Los asistentes salen en la tabla de asistentes y en la lista de asistencia del acta. Cada uno puede firmar en la pantalla o cargar su firma como imagen.</p>
        <div class="ac-asis-h"><span>Nombre</span><span>Cargo</span><span>Firma</span><span></span></div><div data-asis>${asis.map(filaAsis).join('')}</div>
        <button type="button" class="btn sm" data-aadd>${I.mas} Agregar asistente</button></div>
      <div data-panel="3" hidden><div class="fields">
        ${f.sel('trimestre', 'Compromisos del', TRIM, d.trimestre || TRIM[tr])}${f.sel('anio_comp', 'Año', [anioAct - 1, anioAct, anioAct + 1, anioAct + 2], d.anio_comp || new Date(fecha + 'T12:00:00').getFullYear())}</div>
        <div class="ac-comp-h"><span>Responsable</span><span>Actividad</span><span>Fecha límite</span><span></span></div><div data-comps>${(d.compromisos?.length ? d.compromisos : [{}, {}, {}]).map(filaComp).join('')}</div>
        <button type="button" class="btn sm" data-cadd>${I.mas} Agregar compromiso</button>
        <div class="fields" style="margin-top:12px">${f.input('proxima', 'Próxima reunión (fecha y hora)', d.proxima || '', { type: 'datetime-local' })}${f.input('proxima_lugar', 'Lugar o enlace (opcional)', d.proxima_lugar || '')}
          ${f.area('conclusiones', 'Conclusiones generales', d.conclusiones || '', { rows: 4 })}</div></div>
      <div data-panel="4" hidden>
        <fieldset><legend>Evidencia fotográfica</legend><div class="ac-fotos" data-fotos></div><label class="btn sm">${I.subir} Cargar fotos<input type="file" accept="image/*" multiple hidden data-fotoin></label></fieldset>
        <fieldset><legend>Anexo de alertas sanitarias emitidas por el INVIMA</legend>
          <div class="field full"><span class="lbl">Meses del anexo</span><div class="mes-grid">${CAT.MESES.map((m, i) => `<label class="mes-chk ${(d.meses_anexo || mesesDef).includes(i + 1) ? 'on' : ''}"><input type="checkbox" name="meses_anexo" value="${i + 1}" ${(d.meses_anexo || mesesDef).includes(i + 1) ? 'checked' : ''}><b>${m}</b></label>`).join('')}</div></div>
          <label class="checks"><input type="checkbox" name="incluir_bitacora" data-single ${d.incluir_bitacora === false ? '' : 'checked'}> <span>Incluir las consultas de alertas registradas en <b>5. Alertas sanitarias</b> para esos meses</span></label>
          <span class="lbl" style="margin-top:8px">Alertas e informes de seguridad (PDF o imagen): se anexan al final del acta</span><div class="ac-anexos" data-anexos></div>
          <label class="btn sm">${I.subir} Cargar alertas e informes<input type="file" accept="application/pdf,image/*" multiple hidden data-anexin></label></fieldset></div>
    </form>`;
    const m = modal({
      titulo: `${a && !a._copia ? 'Editar' : 'Nueva'} acta · ${ent.razon_social}`, size: 'wide', cuerpo,
      acciones: [{ t: 'Cancelar' }, { t: `${I.pdf} Guardar y ver PDF`, cls: 'pri', fn: async (mm) => guardar(mm) }],
    });
    const b = m.body, $ = (s) => b.querySelector(s);
    // pestañas
    b.addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (!t) return; b.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('on', x === t)); b.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== t.dataset.tab; }); });
    // meses → objetivo automático (hasta que el usuario lo edite a mano)
    const syncMes = () => b.querySelectorAll('.mes-chk').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked));
    const recomponer = () => { if (objetivoManual) return; const v = leer(b); $('[name=objetivo]').value = objetivoDe(v.meses.map(Number).sort((x, y) => x - y), v.anio_obj); };
    b.addEventListener('change', (e) => { syncMes(); if (e.target.name === 'meses' || e.target.name === 'anio_obj') recomponer(); if (e.target.name === 'fecha') { const t = trimDe(e.target.value); $('[name=trimestre]').value = TRIM[t]; } });
    $('[name=objetivo]').addEventListener('input', () => { objetivoManual = true; });
    // filas dinámicas
    $('[data-oadd]').onclick = () => $('[data-ordenes]').insertAdjacentHTML('beforeend', filaOrden(''));
    $('[data-aadd]').onclick = () => $('[data-asis]').insertAdjacentHTML('beforeend', filaAsis());
    $('[data-cadd]').onclick = () => $('[data-comps]').insertAdjacentHTML('beforeend', filaComp());
    b.addEventListener('click', async (e) => {
      const del = e.target.closest('[data-odel],[data-fdel],[data-cdel]'); if (del) { del.closest('.ac-orden,.ac-asis,.ac-comp').remove(); return; }
      const dib = e.target.closest('[data-fdib]');
      if (dib) { const row = dib.closest('.ac-asis'); const nom = row.querySelector('[data-k=nombre]').value; const r = await UI.pedirFirma({ titulo: `Firma${nom ? ' · ' + nom : ''}` }); if (r) { const c = row.querySelector('.ac-firma'); c.dataset.firma = r; c.innerHTML = firmaCelda(r); } }
    });
    b.addEventListener('change', async (e) => {
      if (e.target.matches('[data-fimg]')) { const fl = e.target.files[0]; if (!fl) return; const r = await UI.reducirImagen(fl, 500, 'image/png'); const c = e.target.closest('.ac-asis').querySelector('.ac-firma'); c.dataset.firma = r; c.innerHTML = firmaCelda(r); }
      if (e.target.matches('[data-fotoin]')) { for (const fl of e.target.files) nuevasFotos.push({ nombre: fl.name, dataURL: await UI.reducirImagen(fl, 1400, 'image/jpeg') }); e.target.value = ''; pintarFotos(); }
      if (e.target.matches('[data-anexin]')) { for (const fl of e.target.files) nuevosAnexos.push({ nombre: fl.name, file: fl }); e.target.value = ''; pintarAnexos(); }
    });
    const pintarFotos = async () => {
      const urls = await Promise.all(fotos.map(async (p) => { try { return URL.createObjectURL(await S.fileBlob(p.archivo)); } catch { return ''; } }));
      $('[data-fotos]').innerHTML = [...fotos.map((p, i) => `<figure><img src="${urls[i]}" alt="${h(p.nombre)}"><button type="button" class="icon-btn bad" data-qfoto="v${i}" aria-label="Quitar foto">${I.x}</button></figure>`),
        ...nuevasFotos.map((p, i) => `<figure><img src="${p.dataURL}" alt="${h(p.nombre)}"><button type="button" class="icon-btn bad" data-qfoto="n${i}" aria-label="Quitar foto">${I.x}</button></figure>`)].join('') || '<span class="muted">Sin fotos.</span>';
      b.querySelectorAll('[data-qfoto]').forEach((x) => { x.onclick = () => { const k = x.dataset.qfoto; if (k[0] === 'v') fotos.splice(+k.slice(1), 1); else nuevasFotos.splice(+k.slice(1), 1); pintarFotos(); }; });
    };
    const pintarAnexos = () => {
      $('[data-anexos]').innerHTML = [...anexos.map((x, i) => `<div class="hvd-doc"><span class="ext">${h(UI.ext(x.nombre).toUpperCase())}</span><span class="nm">${h(x.nombre)}</span><button type="button" class="icon-btn bad" data-qanx="v${i}" aria-label="Quitar">${I.x}</button></div>`),
        ...nuevosAnexos.map((x, i) => `<div class="hvd-doc"><span class="ext">${h(UI.ext(x.nombre).toUpperCase())}</span><span class="nm">${h(x.nombre)}</span><span class="pill">nuevo</span><button type="button" class="icon-btn bad" data-qanx="n${i}" aria-label="Quitar">${I.x}</button></div>`)].join('') || '<span class="muted">Sin archivos anexos.</span>';
      b.querySelectorAll('[data-qanx]').forEach((x) => { x.onclick = () => { const k = x.dataset.qanx; if (k[0] === 'v') anexos.splice(+k.slice(1), 1); else nuevosAnexos.splice(+k.slice(1), 1); pintarAnexos(); }; });
    };
    pintarFotos(); pintarAnexos();

    // Desarrollo: datos reales de la app (alertas, eventos, mantenimiento) y redacción con IA
    const resumenApp = async () => {
      const v = leer(b); const meses = v.meses.map(Number), anio = +v.anio_obj;
      const [als, evs, cronos, eqs] = await Promise.all([S.list('alertas', { entidad_id: ent.id }), S.list('eventos', { entidad_id: ent.id }), S.list('cronogramas', { entidad_id: ent.id, tipo: 'mantenimiento', anio }), S.list('equipos', { entidad_id: ent.id })]);
      const enMes = (a) => meses.some((mm) => nrm(a.mes_consulta).includes(nrm(CAT.MESES[mm - 1]))) && String(a.mes_consulta || '').includes(String(anio));
      const al = als.filter(enMes); const apl = al.filter((x) => /^aplica/i.test(x.aplicabilidad || ''));
      const ev = evs.filter((x) => { const dt = new Date(x.fecha_evento); return dt.getFullYear() === anio && meses.includes(dt.getMonth() + 1); });
      let prog = 0, ejec = 0; cronos.forEach((c) => Object.entries(c.plan || {}).forEach(([k, val]) => { if (meses.includes(+k.split('-')[0])) { if (val === 'E') { ejec++; prog++; } else if (val === 'P' || val === 'N') prog++; } }));
      const eq = (id) => eqs.find((x) => x.id === id);
      return [
        `- Verificación de asistencia: se verifica la asistencia de los integrantes y el quórum.`,
        `- Lectura y aprobación del acta anterior: [resultado].`,
        `- Alertas sanitarias INVIMA (${mesesTxt(meses)} de ${anio}): se registraron ${al.length} consulta(s)${al.length ? `; ${apl.length} aplica(n) a dispositivos del inventario` : ''}.${al.filter((x) => x.dispositivo && !/sin alertas/i.test(x.dispositivo)).map((x) => ` ${x.tipo_notificacion || 'Alerta'}: ${x.dispositivo}${x.registro_sanitario && x.registro_sanitario !== '—' ? ' (' + x.registro_sanitario + ')' : ''} – ${x.aplicabilidad || ''}${x.analisis ? ': ' + x.analisis.replace(/\.\s*$/, '') : ''}.`).join('')}`,
        `- Eventos e incidentes adversos con dispositivos médicos: ${ev.length ? `${ev.length} reporte(s).${ev.map((x) => ` ${UI.fecha(x.fecha_evento)} · ${eq(x.equipo_id)?.nombre || 'Dispositivo'}: ${(x.descripcion || '').replace(/\.\s*$/, '')} (${x.consecuencia || ''}; ${x.estado || ''}).`).join('')}` : 'no se reportaron eventos ni incidentes adversos en el periodo.'}`,
        `- Mantenimiento preventivo: ${prog ? `${ejec} de ${prog} mantenimientos programados ejecutados (${Math.round((ejec / prog) * 100)} % de cumplimiento).` : 'sin mantenimientos programados en el cronograma para el periodo.'}`,
        `- Propuestas de mejora y compromisos: ver tabla de compromisos.`,
        `- Programación de próxima reunión: ver fecha programada.`,
      ].join('\n');
    };
    $('[data-datos]').onclick = async () => { const t = await resumenApp(); const ta = $('[name=desarrollo]'); ta.value = ta.value.trim() ? `${ta.value.trim()}\n${t}` : t; toast('Datos de alertas, eventos y mantenimiento agregados'); };
    $('[data-iaact]').onclick = async (ev) => {
      const btn = ev.currentTarget, est = $('[data-iaest]'); btn.disabled = true; est.textContent = 'Redactando con IA… puede tardar hasta un minuto.';
      try {
        const v = leer(b); const datos = await resumenApp();
        const orden = [...b.querySelectorAll('.ac-orden [data-k=t]')].map((x) => x.value).filter(Boolean);
        const texto = await S.ia({ instruccion: `Redacta el DESARROLLO DE LA REUNIÓN de un acta de ${v.tipo.toLowerCase()} (${v.tema}) de la entidad, punto por punto del orden del día. Usa solo los datos entregados; donde falte información deja [corchetes]. Formato: una viñeta "- " por cada punto, que empiece con el nombre del punto seguido de dos puntos, y 2 a 4 frases. Sin negrillas, sin títulos.\nORDEN DEL DÍA:\n${orden.map((x, i) => `${i + 1}. ${x}`).join('\n')}\nNOTAS DEL USUARIO:\n${v.desarrollo || '(ninguna)'}`, contexto: `ENTIDAD: ${ent.razon_social}\nFECHA: ${v.fecha}\nOBJETIVO: ${v.objetivo}\nDATOS DE LA APP:\n${datos}`, historial: [] });
        $('[name=desarrollo]').value = texto.replace(/\*\*/g, '').trim(); est.textContent = 'Listo. Revise y ajuste el texto.';
      } catch (er) { est.textContent = ''; toast(er.message, true); } finally { btn.disabled = false; }
    };

    const guardar = async (mm) => {
      const v = leer(mm.body);
      if (!v.numero.trim()) { toast('Escriba el número del acta', true); return false; }
      const asistentes = [...b.querySelectorAll('.ac-asis')].map((r) => ({ nombre: r.querySelector('[data-k=nombre]').value.trim(), cargo: r.querySelector('[data-k=cargo]').value.trim(), firma: r.querySelector('.ac-firma').dataset.firma || null })).filter((x) => x.nombre || x.cargo || x.firma);
      const compromisos = [...b.querySelectorAll('.ac-comp')].map((r) => ({ responsable: r.querySelector('[data-k=responsable]').value.trim(), actividad: r.querySelector('[data-k=actividad]').value.trim(), fecha: r.querySelector('[data-k=fecha]').value || null })).filter((x) => x.responsable || x.actividad);
      const orden = [...b.querySelectorAll('.ac-orden [data-k=t]')].map((x) => x.value.trim()).filter(Boolean);
      toast('Guardando acta…');
      // fotos y anexos nuevos al almacenamiento
      const base = `${ent.id}/comites/${Date.now()}`;
      for (const [i, p] of nuevasFotos.entries()) { const blob = await (await fetch(p.dataURL)).blob(); const path = `${base}-foto${i}-${slug(p.nombre)}`.replace(/\.(png|jpe?g|webp|gif)$/i, '') + '.jpg'; await S.upload(path, new Blob([blob], { type: 'image/jpeg' })); fotos.push({ nombre: p.nombre, archivo: path }); }
      for (const [i, x] of nuevosAnexos.entries()) { const path = `${base}-anexo${i}-${slug(x.nombre)}`; await S.upload(path, x.file); anexos.push({ nombre: x.nombre, archivo: path, mime: x.file.type }); }
      nuevasFotos.length = 0; nuevosAnexos.length = 0;
      const datos = { tipo: v.tipo, hora_ini: v.hora_ini, hora_fin: v.hora_fin, metodologia: v.metodologia, coordinador: v.coordinador, empresa: v.empresa, area: v.area, pretest: v.pretest, postest: v.postest,
        meses: v.meses.map(Number).sort((x, y) => x - y), anio_obj: +v.anio_obj, objetivo: v.objetivo, objetivo_manual: objetivoManual, orden, desarrollo: v.desarrollo, asistentes,
        trimestre: v.trimestre, anio_comp: +v.anio_comp, compromisos, proxima: v.proxima || null, proxima_lugar: v.proxima_lugar, conclusiones: v.conclusiones,
        fotos, anexos, meses_anexo: v.meses_anexo.map(Number).sort((x, y) => x - y), incluir_bitacora: !!v.incluir_bitacora };
      const fila = { entidad_id: ent.id, numero: v.numero.trim(), fecha: v.fecha, tema: v.tema, datos };
      let g = a && !a._copia ? await S.update('actas_comite', a.id, fila) : await S.insert('actas_comite', fila);
      g = g || { ...a, ...fila };
      const blob = await A.pdfActa(ent, g);
      // PDF en la carpeta COMITÉS (reemplaza el anterior de esta acta)
      if (g.documento_id) { const old = await S.get('documentos', g.documento_id); if (old) { try { await S.removeFile(old.archivo); } catch {} await S.remove('documentos', old.id); } }
      const nombre = `Acta ${v.numero.trim()} - ${v.tema || 'Comité'} - ${UI.fecha(v.fecha).replace(/\//g, '-')}.pdf`;
      const dest = await destinoActas(ent);
      const doc = await A.guardarPDF({ blob, nombre: `${fmtFAR().codigo} ${nombre}`, entidad_id: ent.id, equipo_id: null, carpeta: dest.carpeta, subcarpeta: dest.subcarpeta });
      await S.update('actas_comite', g.id, { documento_id: doc?.id || null, archivo: doc?.archivo || null });
      toast(`Acta ${v.numero} guardada`);
      UI.verPDF({ titulo: `Acta ${v.numero} · ${v.tema}`, blob, nombre });
      A.recargar();
    };
  };

  // ------------------------------------------------------------------ PDF con el diseño del formato FAR-013
  A.pdfActa = async (ent, a) => {
    const d = a.datos || {}; const fmt = fmtFAR(); const emp = st.emp;
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'letter' });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 18, TOP = 34, BOT = 34, ancho = W - 2 * M;
    const AZUL = [214, 234, 248], NEGRO = [0, 0, 0], LIN = [0, 0, 0];
    const img = (src, x, y, mw, mh) => { if (!src) return; try { const p = doc.getImageProperties(src); const r = Math.min(mw / p.width, mh / p.height); doc.addImage(src, /^data:image\/png/i.test(src) ? 'PNG' : 'JPEG', x + (mw - p.width * r) / 2, y + (mh - p.height * r) / 2, p.width * r, p.height * r); } catch (e) { console.warn(e); } };
    const aData = async (path) => { try { return await UI.aDataURL(await S.fileBlob(path)); } catch { return null; } };
    let y = TOP;
    const salto = (n) => { if (y + n > H - BOT) { doc.addPage(); y = TOP; } };
    const titulo = (t, center = true) => { salto(10); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.text(t, center ? W / 2 : M, y, { align: center ? 'center' : 'left' }); y += 6; };
    const parr = (t, fs = 9) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(fs); for (const raw of String(t || '').split('\n')) { const vin = /^\s*[-•]\s+/.test(raw); const tx = raw.replace(/^\s*[-•]\s+/, ''); const ls = doc.splitTextToSize(tx, ancho - (vin ? 6 : 0)); ls.forEach((ln, i) => { salto(5); if (vin && i === 0) doc.text('•', M + 1.5, y); doc.text(ln, M + (vin ? 6 : 0), y); y += fs * 0.42; }); if (!raw.trim()) y += 1.5; } y += 2; };
    const tablaOpts = { theme: 'grid', margin: { left: M, right: M, top: TOP, bottom: BOT }, styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.2, lineColor: LIN, lineWidth: 0.2, textColor: NEGRO, valign: 'middle' }, headStyles: { fillColor: AZUL, textColor: NEGRO, fontStyle: 'bold', halign: 'center', lineColor: LIN, lineWidth: 0.2 } };
    const X = (b) => (b ? 'X' : '');

    // 1. Datos del encuentro
    const infoRows = [
      ['FECHA DEL ENCUENTRO', fechaLarga(a.fecha)],
      ['TIPO DE ENCUENTRO', `REUNIÓN: ${X(d.tipo === 'Reunión')}              CAPACITACIÓN: ${X(d.tipo === 'Capacitación')}              COMITÉ: ${X(d.tipo === 'Comité')}`],
      ['HORA', `HORA INICIAL: ${horaTxt(d.hora_ini)}                          HORA FINAL: ${horaTxt(d.hora_fin)}`],
      ['METODOLOGÍA', `PRESENCIAL: ${X(d.metodologia === 'Presencial')}                                  VIRTUAL: ${X(d.metodologia === 'Virtual')}`],
      ['TEMA A TRATAR (COMITÉ)', a.tema || ''], ['COORDINADOR DE LA REUNIÓN', d.coordinador || COORD], ['EMPRESA', d.empresa || ent.razon_social || ''], ['ÁREA O SERVICIO', d.area || ''],
      ['FECHA DE TEST', `PRE-TEST: ${d.pretest || 'No aplica'}                          POST TEST: ${d.postest || 'No aplica'}`],
    ];
    doc.autoTable({ ...tablaOpts, startY: y, body: infoRows, styles: { ...tablaOpts.styles, fontSize: 7.5, cellPadding: 0.9 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 44 } } });
    y = doc.lastAutoTable.finalY + 8;

    // 2. Desarrollo
    titulo('DESARROLLO DE LA REUNIÓN.');
    salto(14); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('ACTA No.', M, y); doc.setFont('helvetica', 'normal'); doc.text(String(a.numero || ''), M + 17, y); y += 5;
    doc.setFont('helvetica', 'bold'); const ol = 'OBJETIVO DE LA REUNIÓN: '; const ow = doc.getTextWidth(ol);
    const objL = doc.splitTextToSize(ol + (d.objetivo || ''), ancho); doc.text(ol, M, y); doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize((d.objetivo || ''), ancho - ow)[0] || '', M + ow, y); y += 4;
    const resto = doc.splitTextToSize((d.objetivo || ''), ancho - ow).slice(1).join(' '); if (resto) { doc.splitTextToSize(resto, ancho).forEach((ln) => { salto(5); doc.text(ln, M, y); y += 4; }); } y += 4; void objL;

    // asistentes (con firmas)
    const tablaAsis = (lista) => {
      const filas = lista.length ? lista : [{}, {}, {}];
      doc.autoTable({ ...tablaOpts, startY: y, head: [['Nombre', 'Cargo', 'Firma']], body: filas.map((x) => [x.nombre || '', x.cargo || '', '']),
        styles: { ...tablaOpts.styles, halign: 'center', minCellHeight: 11 }, columnStyles: { 0: { cellWidth: ancho / 3 }, 1: { cellWidth: ancho / 3 }, 2: { cellWidth: ancho / 3 } },
        didDrawCell: (c) => { if (c.section === 'body' && c.column.index === 2) { const fr = filas[c.row.index]?.firma; if (fr) img(fr, c.cell.x + 2, c.cell.y + 0.8, c.cell.width - 4, c.cell.height - 1.6); } } });
      y = doc.lastAutoTable.finalY + 6;
    };
    titulo('ASISTENTES'); tablaAsis((d.asistentes || []).filter((x) => x.nombre || x.cargo));

    titulo('ORDEN DEL DÍA', false);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    (d.orden || []).forEach((t, i) => { doc.splitTextToSize(t, ancho - 10).forEach((ln, j) => { salto(5); if (!j) doc.text(`${i + 1}.`, M + 3, y); doc.text(ln, M + 9, y); y += 4; }); }); y += 3;

    titulo('DESARROLLO DE LA REUNIÓN', false); parr(d.desarrollo || '');

    // compromisos por trimestre y año
    titulo(`COMPROMISOS ${(d.trimestre || '').toUpperCase()} ${d.anio_comp || ''}`.trim(), false);
    const comps = (d.compromisos || []).filter((c) => c.responsable || c.actividad);
    doc.autoTable({ ...tablaOpts, startY: y, head: [['Responsable', 'Actividad', 'Fecha límite']], body: (comps.length ? comps : [{}]).map((c) => [c.responsable || '', c.actividad || '', c.fecha ? UI.fecha(c.fecha) : '']),
      styles: { ...tablaOpts.styles, halign: 'center' }, columnStyles: { 0: { cellWidth: 52 }, 2: { cellWidth: 32 } } });
    y = doc.lastAutoTable.finalY + 7;

    salto(8); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); const pl = 'PRÓXIMA REUNIÓN: '; doc.text(pl, M, y); doc.setFont('helvetica', 'normal');
    const px = d.proxima ? `${fechaLarga(d.proxima.slice(0, 10))}${d.proxima.length > 10 ? ', ' + horaTxt(d.proxima.slice(11, 16)) : ''}${d.proxima_lugar ? ' · ' + d.proxima_lugar : ''}`.replace(/\.?$/, '.') : 'Por definir.';
    doc.text(doc.splitTextToSize(px, ancho - doc.getTextWidth(pl)), M + doc.getTextWidth(pl), y); y += 9;

    titulo('CONCLUSIONES GENERALES'); parr(d.conclusiones || '');

    titulo('EVIDENCIA FOTOGRÁFICA');
    const fotos = (await Promise.all((d.fotos || []).map((p) => aData(p.archivo)))).filter(Boolean);
    if (fotos.length) {
      const fw = (ancho - 6) / 2, fh = 62;
      for (let i = 0; i < fotos.length; i += 2) { salto(fh + 4); for (let j = 0; j < 2 && i + j < fotos.length; j++) { doc.setDrawColor(180); doc.rect(M + j * (fw + 6), y, fw, fh); img(fotos[i + j], M + j * (fw + 6) + 1, y + 1, fw - 2, fh - 2); } y += fh + 5; }
    } else parr('Sin registro fotográfico.');

    // lista de asistencia
    doc.addPage(); y = TOP;
    titulo('LISTA ASISTENCIA');
    doc.autoTable({ ...tablaOpts, startY: y, body: [['FECHA DEL ENCUENTRO', fechaLarga(a.fecha)], ['TEMA A TRATAR', a.tema || ''], ['COORDINADOR DE LA REUNIÓN', d.coordinador || COORD]], styles: { ...tablaOpts.styles, fontSize: 7.5, cellPadding: 0.9 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 44 } } });
    y = doc.lastAutoTable.finalY + 4; tablaAsis((d.asistentes || []).filter((x) => x.nombre || x.cargo));

    // anexo de alertas sanitarias
    const ma = d.meses_anexo || d.meses || [];
    salto(16); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(doc.splitTextToSize(`Anexo de Alertas sanitarias emitidas por el Invima (${mesesTxt(ma) || 'meses'} de ${d.anio_obj || ''}).`, ancho), M, y); y += 6;
    if (d.incluir_bitacora !== false) {
      const als = (await S.list('alertas', { entidad_id: ent.id })).filter((x) => ma.some((mm) => nrm(x.mes_consulta).includes(nrm(CAT.MESES[mm - 1]))) && String(x.mes_consulta || '').includes(String(d.anio_obj || '')));
      if (als.length) {
        doc.autoTable({ ...tablaOpts, startY: y, head: [['Mes', 'Registro sanitario', 'Dispositivo', 'Tipo', 'Agencia', 'Aplicabilidad']], body: als.map((x) => [x.mes_consulta || '', x.registro_sanitario || '', x.dispositivo || '', x.tipo_notificacion || '', x.agencia || '', x.aplicabilidad || '']), styles: { ...tablaOpts.styles, fontSize: 7 } });
        y = doc.lastAutoTable.finalY + 5;
      } else parr('No hay consultas de alertas registradas en la app para esos meses.', 8);
    }
    const anexos = d.anexos || [];
    if (anexos.length) parr(`Se anexan ${anexos.length} documento(s): ${anexos.map((x) => x.nombre).join('; ')}.`, 8);
    for (const x of anexos.filter((x) => /^image\//.test(x.mime || '') || /\.(png|jpe?g|webp)$/i.test(x.nombre))) { const src = await aData(x.archivo); if (src) { doc.addPage(); y = TOP; titulo(x.nombre, false); img(src, M, y, ancho, H - BOT - y - 4); } }

    // encabezado y pie en todas las páginas (igual al Word)
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setDrawColor(...LIN); doc.setLineWidth(0.3); const hy = 10, hh = 18, c1 = 32, c3 = 40;
      doc.rect(M, hy, ancho, hh); doc.line(M + c1, hy, M + c1, hy + hh); doc.line(W - M - c3, hy, W - M - c3, hy + hh);
      img(window.IBCOL_LOGO, M + 1.5, hy + 1.5, c1 - 3, hh - 3);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...NEGRO); doc.text((fmt.titulo || 'FORMATO ACTA DE REUNIÓN').toUpperCase(), M + c1 + (ancho - c1 - c3) / 2, hy + hh / 2 + 1.5, { align: 'center' });
      if (ent.logo) img(ent.logo, W - M - c3 + 1.5, hy + 1.5, c3 - 3, hh - 3); else { doc.setFontSize(8); doc.text('LOGO EMPRESA', W - M - c3 / 2, hy + hh / 2 + 1, { align: 'center' }); }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(40);
      const fy = H - 26;
      [emp.nombre || 'IBCOL Ingeniería Biomédica de Colombia', `CONTACTO: ${emp.telefono2 || emp.telefono || '3146872775'}`, `E-MAIL: ${emp.email || 'ibcolgerencia@gmail.com'}`, `DIRECCIÓN: ${emp.direccion || 'Carrera 39 # 6B – 22'}`, emp.ciudad || 'Popayán – Cauca',
        `${fmt.codigo || 'FAR-013'} – Versión ${fmt.version || '002'} – F. ACT: ${fmt.fecha ? UI.fecha(fmt.fecha) : '09/01/2024'}`].forEach((l, k) => doc.text(l, W / 2, fy + k * 3, { align: 'center' }));
      img(window.IBCOL_LOGO, W - M - 30, fy - 1, 30, 14);
      doc.setFontSize(6.5); doc.text(`Página ${i} de ${n}`, M, H - 8); doc.setTextColor(...NEGRO);
    }
    let blob = doc.output('blob');
    // alertas e informes en PDF: se agregan al final
    const pdfs = anexos.filter((x) => /pdf/i.test(x.mime || '') || /\.pdf$/i.test(x.nombre));
    if (pdfs.length && window.PDFLib) {
      try {
        const base = await PDFLib.PDFDocument.load(await blob.arrayBuffer());
        for (const x of pdfs) { try { const src = await PDFLib.PDFDocument.load(await (await S.fileBlob(x.archivo)).arrayBuffer(), { ignoreEncryption: true }); (await base.copyPages(src, src.getPageIndices())).forEach((p) => base.addPage(p)); } catch (e) { console.warn('anexo', x.nombre, e); } }
        blob = new Blob([await base.save()], { type: 'application/pdf' });
      } catch (e) { console.warn(e); }
    }
    return blob;
  };
})();
