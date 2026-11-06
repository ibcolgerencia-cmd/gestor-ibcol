// =====================================================================
//  REPORTE DE DAÑO DE EQUIPOS (cliente o propietario) con trazabilidad
//  Tabla: reportes_dano (ver supabase/reportes_dano.sql)
//  - Cualquier usuario de la entidad reporta: nombre, celular, entidad, sede, servicio, equipo y la falla.
//  - Aviso a IBCOL por WhatsApp / mensaje de texto / correo desde el celular de quien reporta.
//  - El propietario lleva el reporte al equipo: PDF en "Mantenimientos correctivos" y, si quiere,
//    abre el reporte de mantenimiento con la falla ya escrita.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, leer, f } = UI;
  const esProp = () => st.perfil?.rol === 'propietario';
  const ESTADOS = ['Nuevo', 'En revisión', 'Atendido', 'Cerrado'];
  const contacto = () => ({ cel: String(st.emp?.celular_alertas || st.emp?.telefono || '3146872775').replace(/\D/g, ''), correo: st.emp?.correo_alertas || st.emp?.correo || 'ibcolgerencia@gmail.com' });
  const faltaTabla = (e) => /reportes_dano|relation|does not exist|schema cache/i.test(e?.message || '');
  const avisoTabla = () => toast('Falta activar los reportes de daño en la base de datos (tabla reportes_dano). Pídale a Claude que la active.', true);

  // ---------------------------------------------------------------- texto del aviso
  const mensaje = (r, ent, cons, eq) => [
    '⚠️ REPORTE DE DAÑO DE EQUIPO BIOMÉDICO',
    `N°: ${r.numero || r.id?.slice(0, 8) || ''}`,
    `Fecha: ${new Date(r.created_at || Date.now()).toLocaleString('es-CO')}`,
    `Reporta: ${r.nombre} · Cel: ${r.celular}`,
    `Entidad: ${ent?.razon_social || ''}`,
    `Sede: ${r.sede || ''}`,
    `Servicio: ${cons?.nombre || ''}`,
    `Equipo: ${eq ? `${eq.codigo_inv || ''} ${eq.nombre || ''} ${eq.marca || ''} ${eq.modelo || ''} S/N ${eq.serie || 'NR'}` : (r.datos?.equipo_texto || '')}`,
    `Falla: ${r.descripcion}`,
    `Equipo fuera de servicio: ${r.fuera_servicio ? 'SÍ' : 'NO'}`,
  ].join('\n');

  const avisar = (r, ent, cons, eq) => {
    const c = contacto(); const txt = mensaje(r, ent, cons, eq); const asunto = `Reporte de daño · ${eq?.nombre || 'equipo'} · ${ent?.razon_social || ''}`;
    const wa = `https://wa.me/57${c.cel.replace(/^57/, '')}?text=${encodeURIComponent(txt)}`;
    const sms = `sms:+57${c.cel.replace(/^57/, '')}?&body=${encodeURIComponent(txt)}`;
    const mail = `mailto:${c.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(txt)}`;
    modal({ titulo: 'Reporte enviado · avise a IBCOL', size: 'sm',
      cuerpo: `<p>El reporte quedó guardado con trazabilidad${r.numero ? ` (N° <b>${h(r.numero)}</b>)` : ''}. IBCOL lo ve en su panel de control.</p>
        <p class="muted" style="font-size:.88rem">Para que el ingeniero lo reciba de inmediato, envíe el aviso por uno de estos medios (se abre con el mensaje ya escrito, solo oprima enviar):</p>
        <div class="actions" style="flex-direction:column;align-items:stretch">
          <a class="btn pri" style="text-decoration:none" href="${wa}" target="_blank" rel="noopener">${I.alerta} WhatsApp a IBCOL (${h(c.cel)})</a>
          <a class="btn" style="text-decoration:none" href="${sms}">${I.alerta} Mensaje de texto (SMS) a ${h(c.cel)}</a>
          <a class="btn" style="text-decoration:none" href="${mail}">${I.alerta} Correo a ${h(c.correo)}</a>
        </div>`,
      acciones: [{ t: 'Cerrar', cls: 'pri' }] });
  };

  // ---------------------------------------------------------------- formulario
  A.formReporteDano = async ({ entId = null, eqId = null, sede: sedeFija = null } = {}) => {
    const ents = esProp() ? await S.list('entidades', {}, 'razon_social') : [await S.get('entidades', st.perfil.entidad_id)].filter(Boolean);
    let ent = ents.find((e) => e.id === (entId || st.perfil?.entidad_id)) || (ents.length === 1 ? ents[0] : null);
    let cons = [], eqs = [];
    const cargar = async () => { if (!ent) { cons = []; eqs = []; return; } [cons, eqs] = await Promise.all([S.list('consultorios', { entidad_id: ent.id }), S.list('equipos', { entidad_id: ent.id })]); cons = A.ordenar ? A.ordenar(cons) : cons; eqs = eqs.filter((e) => e.estado !== 'Dado de baja'); };
    await cargar();
    const eqIni = eqId ? eqs.find((e) => e.id === eqId) : null;
    const sedesDe = () => { const l = A.sedesDe && ent ? A.sedesDe(cons, ent) : [...new Set(cons.map((c) => c.sede || 'Sede principal'))]; return sedeFija ? l.filter((x) => x === sedeFija) : l; };
    const opc = (l, sel, vacio) => `<option value="">${vacio}</option>` + l.map(([v, t]) => `<option value="${h(v)}" ${v === sel ? 'selected' : ''}>${h(t)}</option>`).join('');
    modal({ titulo: 'Reportar daño de un equipo biomédico', size: 'wide',
      cuerpo: `<form class="form" onsubmit="return false"><p class="muted">Diligencie los datos. El reporte queda guardado con fecha y hora para la trazabilidad del equipo y se avisa a IBCOL Ingeniería Biomédica.</p>
        <div class="fields">
          ${f.input('nombre', 'Nombre y apellido de quien reporta *', st.perfil?.rol !== 'propietario' ? (st.perfil?.nombre || '') : '')}
          ${f.input('celular', 'Número de celular *', '', { type: 'tel' })}
          <div class="field"><label for="f_rent">Entidad *</label><select id="f_rent" name="ent" ${esProp() ? '' : 'disabled'}>${opc(ents.map((e) => [e.id, e.razon_social]), ent?.id || '', 'Seleccione la entidad…')}</select></div>
          <div class="field"><label for="f_rsede">Sede *</label><select id="f_rsede" name="sede"></select></div>
          <div class="field"><label for="f_rserv">Servicio *</label><select id="f_rserv" name="servicio"></select></div>
          <div class="field"><label for="f_req">Equipo *</label><select id="f_req" name="equipo"></select></div>
          <div class="field full" data-otro-eq style="display:none"><label for="f_reqt">¿Qué equipo? (si no está en la lista)</label><input id="f_reqt" name="equipo_texto" placeholder="Nombre, marca, serie o placa del equipo"></div>
          ${f.area('descripcion', 'Descripción del daño o falla *', '', { rows: 4, full: true, ph: '¿Qué le pasa al equipo? ¿Desde cuándo? ¿Afectó a algún paciente?' })}
          <label class="checks full radio-line"><input type="checkbox" name="fuera_servicio" data-single> <span>El equipo quedó <b>fuera de servicio</b> (no se puede usar)</span></label>
          <label class="checks full radio-line"><input type="checkbox" name="autoriza_datos"> <span>Autorizo a IBCOL el tratamiento de mi nombre y celular para gestionar este reporte y contactarme, según la <a href="politicas.html" target="_blank" rel="noopener">Política de tratamiento de datos personales</a> (Ley 1581 de 2012). *</span></label>
        </div></form>`,
      alAbrir: (m) => {
        const sE = m.body.querySelector('[name=ent]'), sS = m.body.querySelector('[name=sede]'), sV = m.body.querySelector('[name=servicio]'), sQ = m.body.querySelector('[name=equipo]'), otro = m.body.querySelector('[data-otro-eq]');
        const llenarSedes = (sel) => { const sd = sedesDe(); sS.innerHTML = opc(sd.map((x) => [x, x]), sel || (sd.length === 1 ? sd[0] : ''), 'Seleccione la sede…'); llenarServ(); };
        const llenarServ = (sel) => { const l = cons.filter((c) => !sS.value || (c.sede || 'Sede principal') === sS.value); sV.innerHTML = opc(l.map((c) => [c.id, c.nombre]), sel || '', 'Seleccione el servicio…'); llenarEq(); };
        const llenarEq = (sel) => { const l = eqs.filter((e) => e.consultorio_id === sV.value).sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999)); sQ.innerHTML = opc(l.map((e) => [e.id, `${e.codigo_inv ? e.codigo_inv + ' · ' : ''}${e.nombre}${e.marca ? ' · ' + e.marca : ''}${e.serie ? ' · S/N ' + e.serie : ''}`]), sel || '', sV.value ? 'Seleccione el equipo…' : 'Primero elija el servicio') + (sV.value ? '<option value="__otro">Otro equipo (escribirlo)</option>' : ''); otro.style.display = sQ.value === '__otro' ? '' : 'none'; };
        sE.onchange = async () => { ent = ents.find((e) => e.id === sE.value) || null; await cargar(); llenarSedes(); };
        sS.onchange = () => llenarServ(); sV.onchange = () => llenarEq(); sQ.onchange = () => { otro.style.display = sQ.value === '__otro' ? '' : 'none'; };
        if (eqIni) { const c = cons.find((x) => x.id === eqIni.consultorio_id); llenarSedes(c?.sede || 'Sede principal'); llenarServ(c?.id); llenarEq(eqIni.id); } else llenarSedes();
      },
      acciones: [{ t: 'Cancelar' }, { t: 'Enviar reporte', cls: 'pri', fn: async (m) => {
        const d = leer(m.body); const entSel = ents.find((e) => e.id === (m.body.querySelector('[name=ent]').value)) || ent;
        const falta = [!d.nombre && 'nombre y apellido', !String(d.celular || '').replace(/\D/g, '').match(/^\d{7,12}$/) && 'celular válido', !entSel && 'entidad', !d.sede && 'sede', !d.servicio && 'servicio', !d.equipo && 'equipo', (d.equipo === '__otro' && !d.equipo_texto) && 'nombre del equipo', !d.descripcion && 'descripción del daño', !d.autoriza_datos && 'autorización de tratamiento de datos'].filter(Boolean);
        if (falta.length) { toast('Falta: ' + falta.join(', '), true); return false; }
        const eq = d.equipo !== '__otro' ? eqs.find((e) => e.id === d.equipo) : null; const cn = cons.find((c) => c.id === d.servicio);
        const numero = `RD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const reg = { entidad_id: entSel.id, consultorio_id: cn?.id || null, equipo_id: eq?.id || null, sede: d.sede, nombre: d.nombre.trim(), celular: String(d.celular).replace(/\D/g, ''), descripcion: d.descripcion.trim(), fuera_servicio: !!d.fuera_servicio, estado: 'Nuevo', numero,
          datos: { equipo_texto: d.equipo === '__otro' ? d.equipo_texto : '', equipo: eq ? { codigo: eq.codigo_inv, nombre: eq.nombre, marca: eq.marca, modelo: eq.modelo, serie: eq.serie } : null, servicio: cn?.nombre || '', reporto_usuario: st.perfil?.usuario || st.perfil?.nombre || '', autorizacion_datos: { acepta: true, fecha: new Date().toISOString(), politica: 'PL-PDP-001 v' + (window.POLITICAS?.VERSION || '1.0') } } };
        let r;
        try { r = await S.insert('reportes_dano', reg); } catch (e) { if (faltaTabla(e)) { avisoTabla(); return false; } throw e; }
        S.log('CREAR', 'reportes_dano', r?.id, `Reporte de daño ${numero}: ${eq ? eq.codigo_inv + ' ' + eq.nombre : d.equipo_texto} (${entSel.razon_social})`);
        avisar({ ...reg, ...(r || {}) }, entSel, cn, eq);
        if (document.querySelector('[data-reportes]')) A.recargar();
      } }] });
  };

  // ---------------------------------------------------------------- PDF del reporte
  const pdfReporte = async (r, ent, cons, eq) => {
    const doc = PDF.nuevo(); const W = doc.internal.pageSize.getWidth();
    let y0 = PDF.encabezado(doc, { titulo: 'REPORTE DE DAÑO DE EQUIPO BIOMÉDICO', fmt: { codigo: 'FMB-RD-001', version: '1', fecha: '2026-11-05' }, ent, cons });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text(`N° ${r.numero || ''}   ·   Fecha del reporte: ${new Date(r.created_at || Date.now()).toLocaleString('es-CO')}`, W / 2, y0 + 3, { align: 'center' });
    const fila = (a, b) => [{ content: a, styles: { fontStyle: 'bold', fillColor: [221, 243, 250] } }, b || '—'];
    doc.autoTable({ startY: y0 + 7, theme: 'grid', styles: { fontSize: 9, cellPadding: 2, lineColor: [60, 60, 60], lineWidth: 0.2 }, columnStyles: { 0: { cellWidth: 55 } },
      head: [[{ content: '1. DATOS DEL REPORTE', colSpan: 2, styles: { fillColor: [0, 150, 190], textColor: 255 } }]],
      body: [fila('Nombre y apellido de quien reporta', r.nombre), fila('Número celular', r.celular), fila('Entidad', ent?.razon_social), fila('Sede', r.sede), fila('Servicio', cons?.nombre || r.datos?.servicio), fila('Estado del reporte', r.estado)] });
    doc.autoTable({ startY: doc.lastAutoTable.finalY + 4, theme: 'grid', styles: { fontSize: 9, cellPadding: 2, lineColor: [60, 60, 60], lineWidth: 0.2 }, columnStyles: { 0: { cellWidth: 55 } },
      head: [[{ content: '2. EQUIPO', colSpan: 2, styles: { fillColor: [0, 150, 190], textColor: 255 } }]],
      body: eq ? [fila('Equipo', eq.nombre), fila('Código de inventario', eq.codigo_inv), fila('Marca / modelo', `${eq.marca || ''} ${eq.modelo || ''}`.trim()), fila('Serie', eq.serie || 'NR'), fila('Activo fijo', eq.activo_fijo)] : [fila('Equipo', r.datos?.equipo_texto)] });
    doc.autoTable({ startY: doc.lastAutoTable.finalY + 4, theme: 'grid', styles: { fontSize: 9, cellPadding: 2.5, lineColor: [60, 60, 60], lineWidth: 0.2 },
      head: [[{ content: '3. DESCRIPCIÓN DEL DAÑO O FALLA', styles: { fillColor: [0, 150, 190], textColor: 255 } }]],
      body: [[r.descripcion || ''], [{ content: `Equipo fuera de servicio: ${r.fuera_servicio ? 'SÍ' : 'NO'}`, styles: { fontStyle: 'bold' } }]] });
    const seg = r.datos?.seguimiento || [];
    if (seg.length) doc.autoTable({ startY: doc.lastAutoTable.finalY + 4, theme: 'grid', styles: { fontSize: 8.5, cellPadding: 2, lineColor: [60, 60, 60], lineWidth: 0.2 },
      head: [[{ content: '4. SEGUIMIENTO (IBCOL)', colSpan: 3, styles: { fillColor: [0, 150, 190], textColor: 255 } }], ['Fecha', 'Estado', 'Nota']], body: seg.map((s) => [new Date(s.f).toLocaleString('es-CO'), s.estado, s.nota || '']) });
    doc.setFontSize(7.5); doc.setTextColor(110); doc.text(`${st.emp?.razon_social || 'IBCOL Ingeniería Biomédica de Colombia'} · Reporte generado desde el Gestor Biomédico · Trazabilidad del equipo`, W / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    return doc.output('blob');
  };

  A.pdfReporteDano = pdfReporte;
  // llevar el reporte al equipo: PDF en la carpeta de mantenimientos correctivos
  const llevarAlEquipo = async (r, ent, cons, eq) => {
    if (!eq) return toast('Este reporte no tiene un equipo de la lista. Cree el equipo y edite el reporte.', true);
    const blob = await pdfReporte(r, ent, cons, eq);
    const nombre = `REPORTE DAÑO ${r.numero || ''} ${new Date(r.created_at || Date.now()).toLocaleDateString('es-CO').replace(/\//g, '_')}.pdf`;
    const path = `${ent.id}/${eq.id}/mto_correctivo/${Date.now()}-${nombre.replace(/[^\w.-]+/g, '_')}`;
    await S.upload(path, blob);
    const doc = await S.insert('documentos', { entidad_id: ent.id, equipo_id: eq.id, carpeta: 'mto_correctivo', nombre, archivo: path, mime: 'application/pdf', tamano: blob.size, visible_cliente: true, fecha_documento: String(r.created_at || new Date().toISOString()).slice(0, 10) });
    const seg = [...(r.datos?.seguimiento || []), { f: new Date().toISOString(), estado: r.estado === 'Nuevo' ? 'En revisión' : r.estado, nota: 'Reporte llevado a la carpeta del equipo (Mantenimientos correctivos)' }];
    await S.update('reportes_dano', r.id, { documento_id: doc?.id || null, estado: r.estado === 'Nuevo' ? 'En revisión' : r.estado, datos: { ...(r.datos || {}), carpeta_ok: true, seguimiento: seg } });
    S.log('EDITAR', 'reportes_dano', r.id, `Reporte ${r.numero} llevado al equipo ${eq.codigo_inv}`);
    toast(`Reporte guardado en ${eq.codigo_inv} › Mantenimientos correctivos`);
  };

  // ---------------------------------------------------------------- lista (panel del propietario y de la entidad)
  A.panelReportes = async (cont, { entidadId = null, sede = null } = {}) => {
    const deSede = (l) => (sede ? l.filter((r) => (r.sede || 'Sede principal') === sede) : l);
    if (!cont) return;
    let reps = [];
    try { reps = deSede(await S.list('reportes_dano', entidadId ? { entidad_id: entidadId } : {}, '-created_at')); }
    catch (e) { if (!faltaTabla(e)) console.warn(e); cont.innerHTML = `<header><h3>${I.alerta.replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px"')} Reportes de daño de equipos</h3><div class="actions"><button class="btn pri" data-rep-nuevo>${I.mas} Reportar daño de un equipo</button></div></header><p class="muted">${esProp() ? 'Falta activar la tabla de reportes en la base de datos.' : 'Pronto podrá reportar aquí los daños de los equipos.'}</p>`; cont.querySelector('[data-rep-nuevo]').onclick = () => A.formReporteDano({ entId: entidadId, sede }); return; }
    const [ents, cons, eqs] = await Promise.all([entidadId ? Promise.resolve([await S.get('entidades', entidadId)]) : S.list('entidades'), S.list('consultorios', entidadId ? { entidad_id: entidadId } : {}), S.list('equipos', entidadId ? { entidad_id: entidadId } : {})]);
    // reportes llevados antes a "Mantenimientos preventivos": pasarlos a "Mantenimientos correctivos"
    if (esProp()) for (const r of reps.filter((x) => x.documento_id && !x.datos?.carpeta_ok)) {
      try { const dc = await S.get('documentos', r.documento_id); if (dc && dc.carpeta === 'mto_preventivo') await S.update('documentos', dc.id, { carpeta: 'mto_correctivo' }); await S.update('reportes_dano', r.id, { datos: { ...(r.datos || {}), carpeta_ok: true } }); r.datos = { ...(r.datos || {}), carpeta_ok: true }; } catch (e) { console.warn(e); }
    }
    const E = (id) => ents.find((x) => x?.id === id), C = (id) => cons.find((x) => x.id === id), Q = (id) => eqs.find((x) => x.id === id);
    let filtro = 'abiertos';
    const pintar = () => {
      const l = reps.filter((r) => filtro === 'todos' || (filtro === 'abiertos' ? !['Atendido', 'Cerrado'].includes(r.estado) : r.estado === filtro));
      const nuevos = reps.filter((r) => r.estado === 'Nuevo').length;
      cont.innerHTML = `<header><h3>${I.alerta.replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px"')} Reportes de daño de equipos ${nuevos ? `<span class="pill bad">${nuevos} nuevo${nuevos === 1 ? '' : 's'}</span>` : ''}</h3><div class="actions">
          <select data-rep-f aria-label="Filtrar reportes">${[['abiertos', 'Abiertos'], ['todos', 'Todos'], ...ESTADOS.map((x) => [x, x])].map(([v, t]) => `<option value="${v}" ${v === filtro ? 'selected' : ''}>${t}</option>`).join('')}</select>
          <button class="btn pri" data-rep-nuevo>${I.mas} Reportar daño de un equipo</button></div></header>
        ${l.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>N°</th>${entidadId ? '' : '<th>Entidad</th>'}<th>Sede · servicio</th><th>Equipo</th><th>Reporta</th><th>Daño</th><th>Estado</th>${esProp() ? '<th></th>' : ''}</tr></thead><tbody>
          ${l.map((r) => { const eq = Q(r.equipo_id), c = C(r.consultorio_id); return `<tr>
            <td class="mono" style="white-space:nowrap">${h(new Date(r.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }))}</td><td class="mono">${h(r.numero || '')}</td>
            ${entidadId ? '' : `<td>${h(E(r.entidad_id)?.razon_social || '')}</td>`}<td>${h(r.sede || '')}<br><small class="muted">${h(c?.nombre || r.datos?.servicio || '')}</small></td>
            <td>${eq ? `<b>${h(eq.nombre)}</b><br><small class="mono">${h(eq.codigo_inv || '')}</small>` : h(r.datos?.equipo_texto || '—')}${r.fuera_servicio ? '<br><span class="pill bad">Fuera de servicio</span>' : ''}</td>
            <td>${h(r.nombre)}<br><small><a href="tel:${h(r.celular)}">${h(r.celular)}</a></small></td><td style="max-width:280px">${h(r.descripcion)}</td>
            <td><span class="pill ${r.estado === 'Nuevo' ? 'bad' : r.estado === 'En revisión' ? 'warn' : 'ok'}">${h(r.estado)}</span>${r.documento_id ? '<br><small class="muted">En la carpeta del equipo</small>' : ''}</td>
            ${esProp() ? `<td><div style="display:flex;flex-wrap:wrap;gap:4px;min-width:150px"><button class="btn sm" data-rep-llevar="${r.id}" ${eq ? '' : 'disabled'} title="Guardar el PDF del reporte en Mantenimientos correctivos del equipo">Llevar al equipo</button>
              <button class="btn sm" data-rep-mto="${r.id}" ${eq ? '' : 'disabled'} title="Crear el reporte de mantenimiento correctivo (FMB-005) con la falla ya escrita">Correctivo</button>
              <button class="btn sm" data-rep-est="${r.id}">Estado</button><button class="btn sm" data-rep-pdf="${r.id}" title="Ver PDF">${I.pdf}</button></div></td>` : ''}
          </tr>`; }).join('')}</tbody></table></div>` : `<p class="muted">${reps.length ? 'No hay reportes con ese filtro.' : 'No hay reportes de daño. Si un equipo falla, use “Reportar daño de un equipo”.'}</p>`}`;
      cont.querySelector('[data-rep-nuevo]').onclick = () => A.formReporteDano({ entId: entidadId, sede });
      cont.querySelector('[data-rep-f]').onchange = (e) => { filtro = e.target.value; pintar(); };
      const R = (id) => reps.find((x) => x.id === id);
      cont.querySelectorAll('[data-rep-llevar]').forEach((b) => (b.onclick = async () => { const r = R(b.dataset.repLlevar); b.disabled = true; try { await llevarAlEquipo(r, E(r.entidad_id), C(r.consultorio_id), Q(r.equipo_id)); reps = deSede(await S.list('reportes_dano', entidadId ? { entidad_id: entidadId } : {}, '-created_at')); pintar(); } finally { b.disabled = false; } }));
      cont.querySelectorAll('[data-rep-pdf]').forEach((b) => (b.onclick = async () => { const r = R(b.dataset.repPdf); const blob = await pdfReporte(r, E(r.entidad_id), C(r.consultorio_id), Q(r.equipo_id)); window.open(URL.createObjectURL(blob), '_blank'); }));
      cont.querySelectorAll('[data-rep-mto]').forEach((b) => (b.onclick = async () => {
        const r = R(b.dataset.repMto); const eq = Q(r.equipo_id); const consEnt = cons.filter((c) => c.entidad_id === r.entidad_id);
        const txt = `Reporte de daño ${r.numero} (${new Date(r.created_at).toLocaleDateString('es-CO')}) – ${r.nombre}, cel. ${r.celular}: ${r.descripcion}`;
        A.formMto({ eq, ent: E(r.entidad_id), cons: consEnt, tipo: 'correctivo', pre: { falla: r.descripcion, fecha_reporte: String(r.created_at).slice(0, 10), observaciones: txt, reporte_dano: r.numero },
          alGuardar: async (mt) => {
            const seg = [...(r.datos?.seguimiento || []), { f: new Date().toISOString(), estado: 'Atendido', nota: `Reporte de mantenimiento correctivo ${mt?.numero || ''} realizado` }];
            await S.update('reportes_dano', r.id, { estado: 'Atendido', datos: { ...(r.datos || {}), mantenimiento_id: mt?.id || null, seguimiento: seg } });
            S.log('EDITAR', 'reportes_dano', r.id, `Reporte ${r.numero}: correctivo ${mt?.numero || ''}`);
            reps = deSede(await S.list('reportes_dano', entidadId ? { entidad_id: entidadId } : {}, '-created_at')); pintar();
          } });
      }));
      cont.querySelectorAll('[data-rep-est]').forEach((b) => (b.onclick = () => {
        const r = R(b.dataset.repEst);
        modal({ titulo: `Estado del reporte ${r.numero || ''}`, size: 'sm', cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.sel('estado', 'Estado', ESTADOS.map((x) => [x, x]), r.estado, { full: true })}${f.area('nota', 'Nota de seguimiento (opcional)', '', { rows: 3, full: true })}</div></form>`,
          acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
            const v = leer(m.body); const seg = [...(r.datos?.seguimiento || []), { f: new Date().toISOString(), estado: v.estado, nota: v.nota || '' }];
            await S.update('reportes_dano', r.id, { estado: v.estado, datos: { ...(r.datos || {}), seguimiento: seg } }); S.log('EDITAR', 'reportes_dano', r.id, `Reporte ${r.numero}: ${v.estado}`);
            reps = deSede(await S.list('reportes_dano', entidadId ? { entidad_id: entidadId } : {}, '-created_at')); pintar(); toast('Estado actualizado');
          } }] });
      }));
    };
    pintar();
  };
})();
