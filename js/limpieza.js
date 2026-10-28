// =====================================================================
//  7. LISTA CHEQUEO LIMPIEZA Y DESINFECCIÓN (formato FMB-006 v02)
//  Planilla mensual por servicio: equipos del inventario × días 1-31.
//  El usuario de la entidad (cliente) marca con X cada día que realiza la
//  limpieza; IBCOL (propietario) configura procedimiento, agente y frecuencia.
//  Tabla: listas_limpieza (el cliente solo escribe las de su entidad).
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, confirmar, leer, f } = UI;
  const esProp = A.esProp;
  const FREC = ['Diario', 'Después de cada paciente', 'Cada 8 días', 'Semanal', 'Quincenal', 'Mensual'];
  const PROC = 'LIMPIEZA Y DESINFECCIÓN:\n- Con un paño limpio, seco y no absorbente.\n- Pase el paño en una sola dirección, sin repasar.\n- Deje actuar por 1 minuto. No enjuague.';
  const AGENTE = 'Detergente y desinfectante Eucida Advanced';
  const DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const fmtLC = () => st.fmt.lista_limpieza || CAT.FORMATOS.lista_limpieza;
  const pad = (n) => String(n).padStart(2, '0');
  const diasMes = (a, m) => new Date(a, m, 0).getDate();

  // Festivos de Colombia (Ley 51 de 1983 / Ley Emiliani)
  const cacheFest = {};
  function festivos(anio) {
    if (cacheFest[anio]) return cacheFest[anio];
    const a = anio % 19, b = Math.floor(anio / 100), c = anio % 100, d = Math.floor(b / 4), e = b % 4, g = Math.floor((8 * b + 13) / 25), hh = (19 * a + b - d - g + 15) % 30, j = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * j - hh - k) % 7, mm = Math.floor((a + 11 * hh + 19 * l) / 433);
    const mesP = Math.floor((hh + l - 7 * mm + 90) / 25), diaP = (hh + l - 7 * mm + 33 * mesP + 19) % 32;
    const pascua = new Date(anio, mesP - 1, diaP);
    const mas = (dt, n) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);
    const lunes = (dt) => (dt.getDay() === 1 ? dt : mas(dt, (8 - dt.getDay()) % 7));
    const f0 = (m, d2) => new Date(anio, m - 1, d2);
    const lista = [f0(1, 1), f0(5, 1), f0(7, 20), f0(8, 7), f0(12, 8), f0(12, 25), mas(pascua, -3), mas(pascua, -2),
      ...[f0(1, 6), f0(3, 19), f0(6, 29), f0(8, 15), f0(10, 12), f0(11, 1), f0(11, 11)].map(lunes), mas(pascua, 43), mas(pascua, 64), mas(pascua, 71)];
    return (cacheFest[anio] = new Set(lista.map((x) => `${x.getMonth() + 1}-${x.getDate()}`)));
  }
  const tipoDia = (a, m, d) => { const dt = new Date(a, m - 1, d); return festivos(a).has(`${m}-${d}`) ? 'fest' : dt.getDay() === 0 || dt.getDay() === 6 ? 'fds' : ''; };

  // ------------------------------------------------------------------ vista de la carpeta
  A.G.limpieza = async (el, { ent }) => {
    const hoy = new Date();
    st.lcF = st.lcF || {}; const F = (st.lcF[ent.id] = st.lcF[ent.id] || { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1, cons: '' });
    let [consAll, eqs] = await Promise.all([S.list('consultorios', { entidad_id: ent.id }), S.list('equipos', { entidad_id: ent.id })]);
    const cons = A.ordenar(consAll).filter((c) => eqs.some((e) => e.consultorio_id === c.id && e.estado !== 'Dado de baja'));
    if (!F.cons || !cons.some((c) => c.id === F.cons)) F.cons = cons[0]?.id || '';
    let lista = null, guardando = null;
    const pintar = async () => {
      let regs;
      try { regs = await S.list('listas_limpieza', { entidad_id: ent.id }); } catch (er) {
        el.innerHTML = `<section class="panel"><header><h2>Lista de chequeo diaria</h2></header><div class="empty">${/listas_limpieza|relation|schema cache|does not exist/i.test(er.message) ? `Falta instalar la tabla de listas de chequeo en la base de datos.${esProp() ? ' En Supabase → SQL Editor ejecute una vez <span class="mono">supabase/limpieza.sql</span>.' : ' Avise a IBCOL.'}` : h(er.message)}</div></section>`;
        return;
      }
      const c = cons.find((x) => x.id === F.cons);
      lista = regs.find((r) => r.consultorio_id === F.cons && +r.anio === +F.anio && +r.mes === +F.mes) || null;
      const anterior = regs.filter((r) => r.consultorio_id === F.cons && (+r.anio * 12 + +r.mes) < (+F.anio * 12 + +F.mes)).sort((x, y) => (y.anio * 12 + y.mes) - (x.anio * 12 + x.mes))[0];
      const eqServ = eqs.filter((e) => e.consultorio_id === F.cons && e.estado !== 'Dado de baja').sort((x, y) => (x.orden ?? 9999) - (y.orden ?? 9999) || String(x.codigo_inv).localeCompare(String(y.codigo_inv)));
      // filas: las guardadas + equipos nuevos del inventario
      const base = (lista?.datos?.filas || anterior?.datos?.filas?.map((r) => ({ ...r, marcas: {} })) || []);
      const filas = [...base.filter((r) => !r.equipo_id || eqServ.some((e) => e.id === r.equipo_id)),
        ...eqServ.filter((e) => !base.some((r) => r.equipo_id === e.id)).map((e) => ({ equipo_id: e.id, procedimiento: PROC, agente: AGENTE, frecuencia: 'Diario', marcas: {} }))];
      filas.forEach((r) => { const e = eqs.find((x) => x.id === r.equipo_id); if (e) r.equipo = `${e.nombre}${e.marca ? ' ' + e.marca : ''}${e.codigo_inv ? ' (' + e.codigo_inv + ')' : ''}`; });
      const datos = { responsable: lista?.datos?.responsable ?? anterior?.datos?.responsable ?? '', cargo: lista?.datos?.cargo ?? anterior?.datos?.cargo ?? '', filas };
      const nd = diasMes(F.anio, F.mes), esMesActual = +F.anio === hoy.getFullYear() && +F.mes === hoy.getMonth() + 1, dHoy = hoy.getDate();
      const editable = true; // propietario y usuario de la entidad pueden marcar
      const hechosHoy = esMesActual ? filas.filter((r) => r.marcas?.[dHoy]).length : 0;
      el.innerHTML = `<section class="panel lc"><header><div><h2>Lista de chequeo diaria · ${h(fmtLC().codigo)}</h2><span class="muted" style="font-size:.85rem">Marque con X el día del mes en que realiza la limpieza y desinfección de cada equipo. No marque sábados, domingos ni festivos si no son laborales en la entidad.</span></div>
          <div class="actions"><button class="btn" data-act="lcPDF">${I.pdf} PDF ${h(fmtLC().codigo)}</button>${esProp() && lista ? `<button class="btn" data-act="lcGuardarPDF">${I.subir} Guardar PDF en la carpeta</button>` : ''}</div></header>
        ${cons.length ? '' : '<div class="empty">La entidad aún no tiene equipos por servicio en el inventario.</div>'}
        <div class="tbl-tools lc-tools">
          <div class="field"><label for="lc_cons">Servicio</label><select id="lc_cons" data-lc="cons">${cons.map((x) => `<option value="${x.id}" ${x.id === F.cons ? 'selected' : ''}>${h(x.nombre)}</option>`).join('')}</select></div>
          <div class="field"><label for="lc_anio">Año</label><select id="lc_anio" data-lc="anio">${[hoy.getFullYear() - 2, hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1].map((x) => `<option ${x === +F.anio ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
          <div class="field"><label for="lc_mes">Mes</label><select id="lc_mes" data-lc="mes">${CAT.MESES.map((m, i) => `<option value="${i + 1}" ${i + 1 === +F.mes ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
          <div class="field"><label for="lc_resp">Responsable de la limpieza</label><input id="lc_resp" data-lc="responsable" value="${h(datos.responsable)}" placeholder="Nombre"></div>
          <div class="field"><label for="lc_cargo">Cargo</label><input id="lc_cargo" data-lc="cargo" value="${h(datos.cargo)}" placeholder="Cargo"></div>
          <span class="muted" data-lc-est></span></div>
        ${esMesActual && filas.length ? `<div class="lc-hoy"><div><b>Hoy, ${dHoy} de ${CAT.MESES[F.mes - 1].toLowerCase()}</b>${tipoDia(F.anio, F.mes, dHoy) ? ` <span class="pill warn">${tipoDia(F.anio, F.mes, dHoy) === 'fest' ? 'Festivo' : 'Fin de semana'}</span>` : ''}<br><span class="muted">${hechosHoy} de ${filas.length} equipos marcados hoy</span></div>
          <button class="btn pri" data-act="lcTodosHoy" ${hechosHoy === filas.length ? 'disabled' : ''}>Marcar X hoy en todos los equipos</button></div>` : ''}
        ${filas.length ? `<div class="lc-wrap"><table class="lc-tbl"><thead>
          <tr><th rowspan="2" class="lc-it">Ítem</th><th rowspan="2" class="lc-eq">Equipos</th><th rowspan="2" class="lc-pr">Procedimiento</th><th rowspan="2" class="lc-ag">Agente recomendado</th><th rowspan="2" class="lc-fr">Frecuencia</th><th colspan="${nd}">${CAT.MESES[F.mes - 1].toUpperCase()} ${F.anio}</th></tr>
          <tr>${Array.from({ length: nd }, (_, i) => { const t = tipoDia(F.anio, F.mes, i + 1); return `<th class="lc-d ${t} ${esMesActual && i + 1 === dHoy ? 'hoy' : ''}" title="${t === 'fest' ? 'Festivo' : t === 'fds' ? 'Fin de semana' : ''}">${i + 1}<small>${DIAS[new Date(F.anio, F.mes - 1, i + 1).getDay()]}</small></th>`; }).join('')}</tr></thead>
          <tbody>${filas.map((r, i) => `<tr data-fila="${i}"><td class="num">${i + 1}</td><td class="lc-eq">${h(r.equipo || r.nombre || '')}</td>
            <td class="lc-pr">${esProp() ? `<textarea data-k="procedimiento" rows="3" aria-label="Procedimiento">${h(r.procedimiento || '')}</textarea>` : h(r.procedimiento || '').replace(/\n/g, '<br>')}</td>
            <td class="lc-ag">${esProp() ? `<textarea data-k="agente" rows="3" aria-label="Agente recomendado">${h(r.agente || '')}</textarea>` : h(r.agente || '')}</td>
            <td class="lc-fr"><select data-k="frecuencia" aria-label="Frecuencia" ${esProp() ? '' : 'disabled'}>${[...new Set([...FREC, r.frecuencia].filter(Boolean))].map((x) => `<option ${x === r.frecuencia ? 'selected' : ''}>${h(x)}</option>`).join('')}</select></td>
            ${Array.from({ length: nd }, (_, d) => { const t = tipoDia(F.anio, F.mes, d + 1); return `<td class="lc-c ${t} ${esMesActual && d + 1 === dHoy ? 'hoy' : ''}"><button type="button" data-x="${d + 1}" aria-label="Día ${d + 1}" ${editable ? '' : 'disabled'}>${r.marcas?.[d + 1] ? 'X' : ''}</button></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>` : (cons.length ? '<div class="empty">Este servicio no tiene equipos activos en el inventario.</div>' : '')}
        <p class="muted lc-ley"><span class="lc-sw fds"></span> Fin de semana · <span class="lc-sw fest"></span> Festivo en Colombia · <span class="lc-sw hoy"></span> Hoy. Toque una casilla para marcar o quitar la X; se guarda sola.</p></section>`;
      const est = el.querySelector('[data-lc-est]');
      // llevar la vista a la columna de hoy
      const wrap = el.querySelector('.lc-wrap'), thHoy = el.querySelector('th.hoy');
      if (wrap && thHoy) { const fijo = el.querySelector('thead .lc-eq'); wrap.scrollLeft = Math.max(0, thHoy.offsetLeft - (fijo ? fijo.offsetLeft + fijo.offsetWidth : 0) - wrap.clientWidth * 0.35); }
      // guardar (con espera corta para agrupar varias marcas)
      const guardar = () => {
        clearTimeout(guardando); if (est) est.textContent = 'Guardando…';
        guardando = setTimeout(async () => {
          try {
            const fila = { entidad_id: ent.id, consultorio_id: F.cons, anio: +F.anio, mes: +F.mes, datos: { ...datos, servicio: c?.nombre || '', filas: datos.filas.map(({ equipo, ...x }) => ({ ...x, nombre: equipo })) } };
            lista = lista ? await S.update('listas_limpieza', lista.id, { datos: fila.datos }) : await S.insert('listas_limpieza', fila);
            if (est) { est.textContent = 'Guardado ✓'; setTimeout(() => { if (est.textContent === 'Guardado ✓') est.textContent = ''; }, 1500); }
          } catch (er) { if (est) est.textContent = ''; toast(er.message, true); }
        }, 500);
      };
      el.querySelectorAll('[data-lc=cons],[data-lc=anio],[data-lc=mes]').forEach((s) => { s.onchange = () => { F[s.dataset.lc] = s.dataset.lc === 'cons' ? s.value : +s.value; pintar(); }; });
      el.querySelectorAll('[data-lc=responsable],[data-lc=cargo]').forEach((i) => { i.onchange = () => { datos[i.dataset.lc] = i.value.trim(); guardar(); }; });
      el.querySelectorAll('tr[data-fila]').forEach((tr) => {
        const r = filas[+tr.dataset.fila];
        tr.querySelectorAll('[data-x]').forEach((b) => {
          b.onclick = () => {
            const d = +b.dataset.x; r.marcas = { ...(r.marcas || {}) };
            if (r.marcas[d]) delete r.marcas[d]; else r.marcas[d] = 'X';
            b.textContent = r.marcas[d] ? 'X' : ''; guardar();
            if (esMesActual && d === dHoy) { const n = filas.filter((x) => x.marcas?.[dHoy]).length; const s2 = el.querySelector('.lc-hoy .muted'); if (s2) s2.textContent = `${n} de ${filas.length} equipos marcados hoy`; }
          };
        });
        tr.querySelectorAll('[data-k]').forEach((i) => { i.onchange = () => { r[i.dataset.k] = i.value; guardar(); }; });
      });
      A.acts({
        lcTodosHoy: () => { filas.forEach((r) => { r.marcas = { ...(r.marcas || {}), [dHoy]: 'X' }; }); guardar(); setTimeout(pintar, 650); },
        lcPDF: async () => { const blob = await A.pdfLimpieza(ent, c, F.anio, F.mes, datos); S.log('CONSULTA', 'listas_limpieza', lista?.id || ent.id, `Lista limpieza ${c?.nombre} ${F.mes}/${F.anio}`); UI.verPDF({ titulo: `Lista de chequeo · ${c?.nombre || ''} · ${CAT.MESES[F.mes - 1]} ${F.anio}`, blob, nombre: `${fmtLC().codigo} Lista limpieza ${c?.nombre || ''} ${CAT.MESES[F.mes - 1]} ${F.anio}.pdf` }); },
        lcGuardarPDF: async () => {
          const nombre = `${fmtLC().codigo} Lista limpieza ${c?.nombre || ''} ${CAT.MESES[F.mes - 1]} ${F.anio}.pdf`;
          const viejos = (await S.list('documentos', { entidad_id: ent.id })).filter((d) => d.carpeta === 'limpieza' && d.nombre === nombre);
          for (const d of viejos) { try { await S.removeFile(d.archivo); } catch {} await S.remove('documentos', d.id); }
          await A.guardarPDF({ blob: await A.pdfLimpieza(ent, c, F.anio, F.mes, datos), nombre, entidad_id: ent.id, equipo_id: null, carpeta: 'limpieza', subcarpeta: `${F.anio}` });
          toast('PDF guardado en la carpeta'); A.recargar();
        },
      });
    };
    await pintar();
  };

  // ------------------------------------------------------------------ PDF con el diseño del formato FMB-006
  A.pdfLimpieza = async (ent, cons, anio, mes, datos) => {
    const fmt = fmtLC(), emp = st.emp;
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'letter', orientation: 'landscape' });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 8, ancho = W - 2 * M;
    const AZ = [0, 150, 190], GR = [217, 217, 217], CI = [0, 176, 240], N = [0, 0, 0];
    const img = (src, x, y, mw, mh) => { if (!src) return; try { const p = doc.getImageProperties(src); const r = Math.min(mw / p.width, mh / p.height); doc.addImage(src, /^data:image\/png/i.test(src) ? 'PNG' : 'JPEG', x + (mw - p.width * r) / 2, y + (mh - p.height * r) / 2, p.width * r, p.height * r); } catch (e) { console.warn(e); } };
    const nd = diasMes(anio, mes);
    const encabezado = () => {
      const y = M, hh = 26, c1 = 50, c3 = 46, cx = M + c1, cw = ancho - c1 - c3;
      doc.setDrawColor(...N); doc.setLineWidth(0.25); doc.rect(M, y, ancho, hh); doc.line(cx, y, cx, y + hh); doc.line(cx + cw, y, cx + cw, y + hh);
      if (ent.logo) img(ent.logo, M + 2, y + 2, c1 - 4, hh - 4); else { doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...AZ); doc.text('LOGO EMPRESA', M + c1 / 2, y + hh / 2, { align: 'center' }); }
      doc.setFillColor(...GR); doc.rect(cx, y, cw, 5, 'FD'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...AZ);
      doc.text((fmt.titulo || 'LISTA DE CHEQUEO LIMPIEZA Y DESINFECCIÓN EQUIPO BIOMÉDICO').toUpperCase(), cx + cw / 2, y + 3.6, { align: 'center' });
      doc.setTextColor(...N); doc.setFontSize(6.5);
      [(ent.razon_social || '').toUpperCase(), [ent.direccion, ent.ciudad].filter(Boolean).join(', ').toUpperCase(), (cons ? [cons.sede, cons.nombre].filter(Boolean).join(' - ') : '').toUpperCase(), `NIT: ${ent.nit || ''}`, cons?.sede ? `SEDE: ${cons.sede}`.toUpperCase() : '', `E-MAIL: ${ent.email || ''}`]
        .filter(Boolean).forEach((t, i) => doc.text(t, cx + cw / 2, y + 8.5 + i * 3, { align: 'center' }));
      const rx = cx + cw; [`CÓDIGO ${fmt.codigo || ''}`, `VERSIÓN  ${fmt.version || ''}`, 'FECHA APROBACIÓN', fmt.fecha ? UI.fecha(fmt.fecha) : ''].forEach((t, i) => { const yy = y + i * (hh / 4); if (i) doc.line(rx, yy, rx + c3, yy); doc.setFont('helvetica', 'bold'); doc.setFontSize(i === 2 ? 7 : 8); doc.text(t, rx + c3 / 2, yy + hh / 8 + 1.2, { align: 'center' }); });
      return y + hh + 2;
    };
    let y = encabezado();
    // bloque servicio / responsable / recomendaciones
    doc.autoTable({ startY: y, theme: 'grid', margin: { left: M, right: M }, styles: { fontSize: 7, cellPadding: 1, lineColor: N, lineWidth: 0.2, textColor: N, valign: 'middle' },
      body: [[{ content: 'SERVICIO', styles: { fillColor: GR, textColor: AZ, fontStyle: 'bold', halign: 'center' } }, { content: 'RESPONSABLE ENCARGADO DE LA LIMPIEZA Y DESINFECCIÓN', rowSpan: 2, styles: { fillColor: GR, textColor: AZ, fontStyle: 'bold', halign: 'center' } }, { content: 'NOMBRE', styles: { textColor: AZ, fontStyle: 'bold', halign: 'center' } }, { content: datos.responsable || '', styles: { halign: 'center' } }],
        [{ content: (cons?.nombre || '').toUpperCase(), styles: { halign: 'center', textColor: AZ } }, { content: 'CARGO', styles: { textColor: AZ, fontStyle: 'bold', halign: 'center' } }, { content: datos.cargo || '', styles: { halign: 'center' } }],
        [{ content: `${CAT.MESES[mes - 1].toUpperCase()} ${anio}`, styles: { halign: 'center', fontStyle: 'bold' } }, { content: 'RECOMENDACIONES PARA EL DILIGENCIAMIENTO', styles: { fillColor: GR, textColor: AZ, fontStyle: 'bold', halign: 'center' } }, { content: 'Marcar con X identificando el día del mes en que realiza la actividad.\nTener en cuenta no marcar los días sábados, domingos y festivos en caso de no ser laborales dentro de la entidad.', colSpan: 2 }]],
      columnStyles: { 0: { cellWidth: 46 }, 1: { cellWidth: 56 }, 2: { cellWidth: 26 } } });
    y = doc.lastAutoTable.finalY + 2;
    // tabla de equipos × días
    const fijo = [8, 38, 62, 32, 20], resto = ancho - fijo.reduce((a, b) => a + b, 0), wd = resto / nd;
    const head = [[{ content: 'ÍTEM', rowSpan: 2 }, { content: 'EQUIPOS', rowSpan: 2 }, { content: 'PROCEDIMIENTO', rowSpan: 2 }, { content: 'AGENTE RECOMENDADO', rowSpan: 2 }, { content: 'FRECUENCIA', rowSpan: 2 },
      { content: `AÑO: ${anio}`, colSpan: Math.floor(nd / 2) }, { content: `MES: ${CAT.MESES[mes - 1].toUpperCase()}`, colSpan: nd - Math.floor(nd / 2) }],
      Array.from({ length: nd }, (_, i) => String(i + 1))];
    const body = datos.filas.map((r, i) => [String(i + 1), r.equipo || r.nombre || '', r.procedimiento || '', r.agente || '', r.frecuencia || '', ...Array.from({ length: nd }, (_, d) => (r.marcas?.[d + 1] ? 'X' : ''))]);
    const colStyles = { 0: { cellWidth: fijo[0], halign: 'center' }, 1: { cellWidth: fijo[1], halign: 'center' }, 2: { cellWidth: fijo[2], fontSize: 5.6 }, 3: { cellWidth: fijo[3], halign: 'center', fontSize: 6 }, 4: { cellWidth: fijo[4], halign: 'center', fontSize: 6 } };
    for (let d = 0; d < nd; d++) colStyles[5 + d] = { cellWidth: wd, halign: 'center', fontStyle: 'bold', cellPadding: 0.3 };
    doc.autoTable({ startY: y, head, body: body.length ? body : [['', '', '', '', '', ...Array(nd).fill('')]], theme: 'grid', margin: { left: M, right: M, top: 40, bottom: 16 },
      styles: { fontSize: 6.3, cellPadding: 0.8, lineColor: N, lineWidth: 0.2, textColor: N, valign: 'middle', overflow: 'linebreak' },
      headStyles: { fillColor: GR, textColor: AZ, fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 6.3, lineColor: N, lineWidth: 0.2, cellPadding: 0.5 },
      columnStyles: colStyles,
      didParseCell: (c) => {
        const di = c.column.index - 5; if (di < 0) return;
        if (c.section === 'head' && c.row.index === 1) { c.cell.styles.fontSize = 5.5; c.cell.styles.textColor = N; }
        if (c.section === 'body' || (c.section === 'head' && c.row.index === 1)) { const t = tipoDia(anio, mes, di + 1); if (t) c.cell.styles.fillColor = t === 'fest' ? [255, 226, 214] : [236, 236, 236]; }
        if (c.section === 'body') { c.cell.styles.fontSize = 7.5; c.cell.styles.textColor = [0, 70, 140]; }
      },
      didDrawPage: () => { if (doc.getNumberOfPages() > 1 && doc.getCurrentPageInfo().pageNumber > 1) encabezado(); } });
    // pie
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.3); doc.setTextColor(40);
      doc.text('Protocolo de limpieza y desinfección de equipos biomédicos', M, H - 8);
      doc.text(`${emp.nombre || 'IBCOL Ingeniería Biomédica de Colombia'}: ${[emp.telefono, emp.telefono2].filter(Boolean).join(' – ')}  E-MAIL: ${emp.email || ''}  DIRECCIÓN: ${emp.direccion || ''}  ${emp.ciudad || ''}`, W / 2 + 20, H - 8, { align: 'center' });
      img(window.IBCOL_LOGO, W - M - 22, H - 14, 22, 10);
      doc.text(`Página ${i} de ${n}`, M, H - 4.5); doc.setTextColor(...N);
    }
    void CI; return doc.output('blob');
  };
})();
