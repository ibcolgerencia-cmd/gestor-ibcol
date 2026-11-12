// =====================================================================
//  12. TEMPERATURA Y HUMEDAD · registro diario con gráficas
//  Tres formatos (como los Excel de la entidad):
//   · Temperatura ambiente y humedad relativa  (FOR-03)
//   · Temperatura de refrigeración (neveras)    (F-01)
//   · Temperatura de congelación               (F-001)
//  Puntos de control por entidad y sede (ent.config.temp_puntos): área o
//  equipo a controlar, termohigrómetro (equipo de medición), certificado,
//  fecha de calibración, factor de corrección y rango aceptable.
//  Tabla temp_humedad: una fila por lectura (M / T / N). La entidad y el
//  usuario de calidad (de su sede) registran; IBCOL corrige y borra.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, confirmar, leer, f } = UI;
  const esProp = A.esProp;
  const TB = 'temp_humedad';
  const TIPOS = {
    ambiente: { n: 'Temperatura ambiente y humedad relativa', fmt: 'temp_ambiente', tmin: 15, tmax: 25, hmin: 30, hmax: 70, mt: 3, mh: 5, hum: true, et: 'TEMPERATURA AMBIENTE (°C)' },
    refrigeracion: { n: 'Temperatura de refrigeración', fmt: 'temp_refrigeracion', tmin: 2, tmax: 8, mt: 1, et: 'TEMPERATURA REFRIGERACIÓN (°C)' },
    congelacion: { n: 'Temperatura de congelación', fmt: 'temp_congelacion', tmin: -25, tmax: -10, mt: 5, et: 'CADENA DE FRÍO (°C)' },
  };
  A.TEMP_TIPOS = TIPOS;
  const TURNOS = [['M', 'Mañana'], ['T', 'Tarde'], ['N', 'Noche']];
  const num = (x) => (x === '' || x === null || x === undefined || isNaN(+String(x).replace(',', '.')) ? null : +String(x).replace(',', '.'));
  const r1 = (x) => (x === null ? '' : (Math.round(x * 10) / 10).toFixed(1));
  const puntosDe = (ent, sede) => (ent.config?.temp_puntos || []).filter((p) => !sede || !p.sede || p.sede === sede);
  const rangoDe = (p) => { const t = TIPOS[p.tipo] || TIPOS.ambiente; return { tmin: num(p.tmin) ?? t.tmin, tmax: num(p.tmax) ?? t.tmax, hmin: num(p.hmin) ?? t.hmin, hmax: num(p.hmax) ?? t.hmax }; };
  const fueraT = (p, v) => { const r = rangoDe(p); return v !== null && (v < r.tmin || v > r.tmax); };
  const fueraH = (p, v) => { const r = rangoDe(p); return v !== null && r.hmin !== undefined && (v < r.hmin || v > r.hmax); };
  const fmtDe = (p) => ({ ...(CAT.FORMATOS[TIPOS[p.tipo]?.fmt] || {}), ...(st.fmt[TIPOS[p.tipo]?.fmt] || {}), ...(p.codigo ? { codigo: p.codigo } : {}) });
  const corr = (p, v, cual = 't') => (v === null ? null : v + (num(cual === 't' ? p.factor_t : p.factor_h) || 0));
  const diasMes = (a, m) => new Date(a, m, 0).getDate();
  const guardarPuntos = async (ent, l) => { const config = { ...(ent.config || {}), temp_puntos: l }; await S.update('entidades', ent.id, { config }); ent.config = config; };

  // ------------------------------------------------------------------ gráfica (SVG) con bandas verde / amarilla / roja
  const grafSVG = (p, regs, anio, mes, cual = 't') => {
    const t = TIPOS[p.tipo] || TIPOS.ambiente, r = rangoDe(p), lo = cual === 't' ? r.tmin : r.hmin, hi = cual === 't' ? r.tmax : r.hmax, m = cual === 't' ? t.mt : t.mh;
    const ymin = lo - 2 * m, ymax = hi + 2 * m, W = 640, H = 210, L = 34, R = 8, T = 10, B = 24, nd = diasMes(anio, mes);
    const X = (d) => L + ((d - 0.5) / nd) * (W - L - R), Y = (v) => T + (1 - (Math.max(ymin, Math.min(ymax, v)) - ymin) / (ymax - ymin)) * (H - T - B);
    const band = (a, b, c) => `<rect x="${L}" y="${Y(b)}" width="${W - L - R}" height="${Math.max(0, Y(a) - Y(b))}" fill="${c}"/>`;
    let s = band(hi + m, ymax, '#f3b3b3') + band(hi, hi + m, '#fde9a8') + band(lo, hi, '#c8ebc4') + band(lo - m, lo, '#fde9a8') + band(ymin, lo - m, '#f3b3b3');
    const paso = (ymax - ymin) / 6; for (let k = 0; k <= 6; k++) { const v = ymin + k * paso; s += `<text x="${L - 4}" y="${Y(v) + 3}" font-size="9" text-anchor="end" fill="currentColor">${Math.round(v)}</text>`; }
    for (let d = 1; d <= nd; d++) s += `<text x="${X(d)}" y="${H - 8}" font-size="8" text-anchor="middle" fill="currentColor">${d}</text>`;
    const marcas = { M: '#1d1d1d', T: '#6b7c93', N: '#0096be' };
    regs.forEach((x) => { const v = corr(p, num(cual === 't' ? x.datos?.t : x.datos?.h), cual); if (v === null) return; const d = +x.fecha.slice(8, 10), cx = X(d) + ({ M: -3, T: 3, N: 0 }[x.turno] || 0), cy = Y(v);
      s += x.turno === 'M' ? `<path d="M${cx} ${cy - 4}L${cx + 4} ${cy}L${cx} ${cy + 4}L${cx - 4} ${cy}Z" fill="${marcas.M}"><title>Día ${d} mañana: ${r1(v)}</title></path>` : `<circle cx="${cx}" cy="${cy}" r="3.4" fill="${marcas[x.turno] || '#555'}"><title>Día ${d} ${x.turno === 'T' ? 'tarde' : 'noche'}: ${r1(v)}</title></circle>`; });
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:900px;height:auto;color:var(--muted,#667)" role="img" aria-label="Gráfica ${cual === 't' ? 'temperatura' : 'humedad'} del mes">${s}</svg>
      <div class="muted" style="font-size:.78rem;display:flex;gap:14px;flex-wrap:wrap"><span>◆ Mañana corregida</span><span style="color:#6b7c93">● Tarde corregida</span><span style="color:#0096be">● Noche corregida</span><span>Rango: ${cual === 't' ? `${lo} a ${hi} °C` : `${lo} a ${hi} %HR`}</span></div>`;
  };

  // ------------------------------------------------------------------ vista
  st.tempSel = st.tempSel || {};
  A.G.temperatura = async (el, { ent, sede = null }) => {
    const ll = `${ent.id}|${sede || ''}`, hoy = UI.hoy();
    const sel = st.tempSel[ll] || { anio: +hoy.slice(0, 4), mes: +hoy.slice(5, 7), punto: null };
    const puntos = puntosDe(ent, sede);
    if (!sel.punto || !puntos.some((p) => p.id === sel.punto)) sel.punto = puntos[0]?.id || null;
    st.tempSel[ll] = sel;
    const p = puntos.find((x) => x.id === sel.punto);
    let regs = [], falta = false;
    if (p) { try { regs = (await S.list(TB, { entidad_id: ent.id })).filter((x) => x.punto === p.id && x.fecha.slice(0, 7) === `${sel.anio}-${String(sel.mes).padStart(2, '0')}`); } catch (er) { if (/temp_humedad|schema cache|does not exist|relation/i.test(er.message)) falta = true; else throw er; } }
    const t = p ? TIPOS[p.tipo] || TIPOS.ambiente : null, r = p ? rangoDe(p) : null;
    const fuera = regs.filter((x) => fueraT(p, corr(p, num(x.datos?.t))) || (t?.hum && fueraH(p, corr(p, num(x.datos?.h), 'h'))));
    const hoyHecho = p ? TURNOS.filter(([k]) => regs.some((x) => x.fecha === hoy && x.turno === k)).map(([, n]) => n) : [];
    el.innerHTML = `<section class="panel"><header><div><h2>Registro de temperatura y humedad</h2><span class="muted" style="font-size:.85rem">Registre cada día la lectura de la mañana y de la tarde (y de la noche si aplica). El valor corregido suma el factor de corrección del certificado de calibración del termohigrómetro. Los valores fuera de rango piden la acción tomada.</span></div>
        <div class="actions">${esProp() ? `<button class="btn" data-act="tpPuntos">${I.edit} Puntos de control</button>` : ''}${p ? `<button class="btn" data-act="tpPDF">${I.pdf} Formato del mes (PDF)</button><button class="btn pri" data-act="tpNuevo">${I.mas} Registrar lectura</button>` : ''}</div></header>
      ${falta ? `<div class="empty">Falta activar el registro en la base de datos.${esProp() ? ' Ejecute supabase/temperatura.sql en Supabase → SQL Editor.' : ' Avise a IBCOL.'}</div>` : ''}
      ${!puntos.length ? `<div class="empty">${esProp() ? 'Aún no hay puntos de control. Use «Puntos de control» para agregar el área (temperatura ambiente y humedad), las neveras (refrigeración) o el congelador de cada sede que lo requiera.' : 'IBCOL aún no ha configurado los puntos de control de temperatura y humedad de esta sede.'}</div>` : `
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${puntos.map((x) => `<button class="btn sm ${x.id === sel.punto ? 'pri' : ''}" data-act="tpPunto" data-id="${x.id}">${h(x.nombre)}${!sede && x.sede ? ` · ${h(x.sede)}` : ''} <span class="muted" style="font-size:.75rem">(${h((TIPOS[x.tipo] || TIPOS.ambiente).n.split(' ').slice(-1)[0])})</span></button>`).join('')}
        <span style="flex:1"></span><select data-tp-mes aria-label="Mes">${CAT.MESES.map((m, i) => `<option value="${i + 1}" ${i + 1 === sel.mes ? 'selected' : ''}>${m}</option>`).join('')}</select><select data-tp-anio aria-label="Año">${[sel.anio + 1, sel.anio, sel.anio - 1, sel.anio - 2].filter((a) => a <= +hoy.slice(0, 4) + 0).map((a) => `<option ${a === sel.anio ? 'selected' : ''}>${a}</option>`).join('')}</select></div>`}</section>
      ${p ? `<section class="panel"><header><div><h2>${h(t.n)} · ${h(p.nombre)}</h2><span class="muted" style="font-size:.85rem">${[p.area, p.sede, p.activo ? 'AF ' + p.activo : ''].filter(Boolean).map(h).join(' · ')} · Rango: ${r.tmin} a ${r.tmax} °C${t.hum ? ` · ${r.hmin} a ${r.hmax} %HR` : ''} · Termohigrómetro ${h(p.med_activo || '—')}${p.med_cert ? ' · Cert. ' + h(p.med_cert) : ''}${p.med_fecha ? ' · Calibrado ' + UI.fecha(p.med_fecha) : ''} · Factor ${num(p.factor_t) || 0} °C${t.hum ? ' / ' + (num(p.factor_h) || 0) + ' %' : ''}</span></div>
          <div>${sel.anio === +hoy.slice(0, 4) && sel.mes === +hoy.slice(5, 7) ? `<span class="pill ${hoyHecho.length >= 2 ? 'ok' : 'warn'}">Hoy: ${hoyHecho.length ? hoyHecho.join(' y ') : 'sin registro'}</span>` : ''} ${fuera.length ? `<span class="pill bad">${fuera.length} fuera de rango</span>` : regs.length ? '<span class="pill ok">Todo en rango</span>' : ''}</div></header>
        <h3 style="font-size:.95rem;margin:4px 0">${h(t.et)}</h3>${grafSVG(p, regs, sel.anio, sel.mes, 't')}${t.hum ? `<h3 style="font-size:.95rem;margin:10px 0 4px">HUMEDAD RELATIVA (%)</h3>${grafSVG(p, regs, sel.anio, sel.mes, 'h')}` : ''}
        ${tablaMes(p, regs, sel.anio, sel.mes)}
        ${fuera.length ? `<h3 style="font-size:.95rem;margin:12px 0 4px">Valores fuera de rango y acciones tomadas</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Turno</th><th>Valor</th><th>Acción tomada (corrección)</th><th>Responsable</th></tr></thead><tbody>${fuera.map((x) => `<tr><td class="num">${UI.fecha(x.fecha)}</td><td>${x.turno}</td><td class="num">${fueraT(p, corr(p, num(x.datos.t))) ? r1(corr(p, num(x.datos.t))) + ' °C ' : ''}${t.hum && fueraH(p, corr(p, num(x.datos.h), 'h')) ? r1(corr(p, num(x.datos.h), 'h')) + ' %HR' : ''}</td><td>${h(x.datos.accion || '—')}</td><td>${h(x.datos.resp || '')}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${regs.length ? `<details style="margin-top:8px"><summary class="muted" style="cursor:pointer">Ver las ${regs.length} lecturas del mes</summary><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Turno</th><th class="r">T °C leída</th><th class="r">T corregida</th>${t.hum ? '<th class="r">%HR leída</th><th class="r">%HR corregida</th>' : ''}<th>Responsable</th><th></th></tr></thead><tbody>${[...regs].sort((a, b) => (a.fecha + a.turno).localeCompare(b.fecha + b.turno)).map((x) => `<tr><td class="num">${UI.fecha(x.fecha)}</td><td>${x.turno}</td><td class="r num">${r1(num(x.datos.t))}</td><td class="r num" style="${fueraT(p, corr(p, num(x.datos.t))) ? 'color:#c0392b;font-weight:700' : ''}">${r1(corr(p, num(x.datos.t)))}</td>${t.hum ? `<td class="r num">${r1(num(x.datos.h))}</td><td class="r num" style="${fueraH(p, corr(p, num(x.datos.h), 'h')) ? 'color:#c0392b;font-weight:700' : ''}">${r1(corr(p, num(x.datos.h), 'h'))}</td>` : ''}<td>${h(x.datos.resp || '')}</td><td>${esProp() ? `<button class="icon-btn bad" data-act="tpDel" data-id="${x.id}" aria-label="Eliminar lectura">${I.del}</button>` : ''}</td></tr>`).join('')}</tbody></table></div></details>` : ''}
      </section>` : ''}`;
    const sm = el.querySelector('[data-tp-mes]'), sa = el.querySelector('[data-tp-anio]');
    if (sm) sm.onchange = () => { sel.mes = +sm.value; A.recargar(); };
    if (sa) sa.onchange = () => { sel.anio = +sa.value; A.recargar(); };
    A.acts({
      tpPunto: (d) => { sel.punto = d.id; A.recargar(); },
      tpPuntos: () => formPuntos(ent),
      tpNuevo: () => formLectura(ent, p, sede, regs),
      tpPDF: () => { const doc = A.pdfTemperatura(ent, p, regs, sel.anio, sel.mes); UI.verPDF({ titulo: `${t.n} · ${p.nombre} · ${CAT.MESES[sel.mes - 1]} ${sel.anio}`, blob: doc.output('blob'), nombre: `${fmtDe(p).codigo || 'TEMP'} ${p.nombre} ${CAT.MESES[sel.mes - 1]} ${sel.anio}.pdf`.replace(/[\\/:*?"<>|]/g, '-'),
        extras: esProp() ? [{ t: 'Guardar en la carpeta', fn: async () => { await A.guardarPDF({ blob: doc.output('blob'), nombre: `${fmtDe(p).codigo || 'TEMP'} ${p.nombre} ${CAT.MESES[sel.mes - 1]} ${sel.anio}.pdf`, entidad_id: ent.id, equipo_id: null, carpeta: 'temperatura', subcarpeta: `${p.sede ? p.sede + '/' : ''}${sel.anio}` }); toast('Guardado en la carpeta'); return false; } }] : [] }); },
      tpDel: async (d) => { if (await confirmar('¿Eliminar esta lectura?')) { await S.remove(TB, d.id); A.recargar(); } },
    });
  };
  const tablaMes = (p, regs, anio, mes) => {
    const t = TIPOS[p.tipo] || TIPOS.ambiente, nd = diasMes(anio, mes), val = (d, k, c) => { const x = regs.find((y) => +y.fecha.slice(8, 10) === d && y.turno === k); return x ? num(c === 't' ? x.datos?.t : x.datos?.h) : null; };
    const fila = (lab, fn, chk) => `<tr><th style="text-align:left;white-space:nowrap;font-size:.75rem">${lab}</th>${Array.from({ length: nd }, (_, i) => { const v = fn(i + 1); return `<td class="num" style="font-size:.72rem;padding:3px 2px;text-align:center;${v !== null && chk && chk(v) ? 'background:rgba(220,53,69,.18);font-weight:700' : ''}">${v === null ? '' : r1(v)}</td>`; }).join('')}</tr>`;
    const bloque = (c) => [['M', 'Mañana'], ['T', 'Tarde'], ['N', 'Noche']].map(([k, n]) => fila(`${c === 't' ? 'T°' : '%HR'} ${n} corregida`, (d) => corr(p, val(d, k, c), c), (v) => (c === 't' ? fueraT(p, v) : fueraH(p, v)))).join('');
    return `<div class="tbl-wrap" style="margin-top:8px"><table class="tbl" style="min-width:900px"><thead><tr><th style="text-align:left">Día</th>${Array.from({ length: nd }, (_, i) => `<th style="text-align:center;font-size:.72rem;padding:3px 2px">${i + 1}</th>`).join('')}</tr></thead><tbody>${bloque('t')}${t.hum ? bloque('h') : ''}</tbody></table></div>`;
  };

  // ------------------------------------------------------------------ registrar lectura
  const formLectura = (ent, p0, sede, regs) => {
    const puntos = puntosDe(ent, sede), hr = new Date().getHours(), turno = hr < 12 ? 'M' : hr < 19 ? 'T' : 'N';
    modal({ titulo: 'Registrar lectura de temperatura y humedad', cuerpo: `<form class="form" onsubmit="return false"><div class="fields">
      ${f.sel('punto', 'Punto de control *', puntos.map((x) => [x.id, `${x.nombre}${x.sede && !sede ? ' · ' + x.sede : ''}`]), p0?.id, { full: true })}
      ${f.input('fecha', 'Fecha *', UI.hoy(), { type: 'date', attrs: `max="${UI.hoy()}"${esProp() ? '' : ` min="${new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10)}"`}` })}${f.sel('turno', 'Turno *', TURNOS, turno)}
      ${f.input('t', 'Temperatura leída (°C) *', '', { type: 'number', attrs: 'step="0.1" inputmode="decimal"' })}<div data-hum>${f.input('h', 'Humedad relativa leída (%)', '', { type: 'number', attrs: 'step="0.1" inputmode="decimal"' })}</div>
      ${f.input('resp', 'Realizado y verificado por *', st.perfil?.nombre || '')}<div data-acc class="full" hidden>${f.area('accion', 'Valor fuera de rango: acción tomada (corrección) *', '', { rows: 2 })}</div>
      <p class="muted full" data-rango style="font-size:.82rem;margin:0"></p></div></form>`,
      alAbrir: (m) => {
        const q = (n) => m.body.querySelector(`[name=${n}]`);
        const upd = () => { const p = puntos.find((x) => x.id === q('punto').value); if (!p) return; const t = TIPOS[p.tipo] || TIPOS.ambiente, r = rangoDe(p);
          m.body.querySelector('[data-hum]').hidden = !t.hum; m.body.querySelector('[data-rango]').textContent = `Rango aceptable: ${r.tmin} a ${r.tmax} °C${t.hum ? ` · ${r.hmin} a ${r.hmax} %HR` : ''}. Factor de corrección: ${num(p.factor_t) || 0} °C${t.hum ? ' / ' + (num(p.factor_h) || 0) + ' %' : ''}.`;
          const fu = fueraT(p, corr(p, num(q('t').value))) || (t.hum && fueraH(p, corr(p, num(q('h').value), 'h'))); m.body.querySelector('[data-acc]').hidden = !fu; };
        ['punto', 't', 'h'].forEach((n) => q(n)?.addEventListener('input', upd)); q('punto').addEventListener('change', upd); upd();
      },
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
        const v = leer(m.body), p = puntos.find((x) => x.id === v.punto), t = TIPOS[p.tipo] || TIPOS.ambiente;
        if (!v.fecha || num(v.t) === null || !v.resp) { toast('Complete fecha, temperatura y responsable', true); return false; }
        const fu = fueraT(p, corr(p, num(v.t))) || (t.hum && fueraH(p, corr(p, num(v.h), 'h')));
        if (fu && !String(v.accion || '').trim()) { toast('El valor está fuera de rango: escriba la acción tomada', true); return false; }
        const todas = await S.list(TB, { entidad_id: ent.id }).catch(() => regs || []);
        if (todas.some((x) => x.punto === p.id && x.fecha === v.fecha && x.turno === v.turno)) { toast('Ya hay una lectura de ese turno en esa fecha', true); return false; }
        try { await S.insert(TB, { entidad_id: ent.id, sede: p.sede || sede || null, punto: p.id, fecha: v.fecha, turno: v.turno, datos: { t: num(v.t), h: t.hum ? num(v.h) : null, resp: v.resp, accion: fu ? v.accion : '' } }); }
        catch (er) { toast(/temp_humedad|schema|relation/i.test(er.message) ? 'Falta activar el registro en la base de datos (supabase/temperatura.sql)' : er.message, true); return false; }
        toast(fu ? 'Lectura guardada (fuera de rango)' : 'Lectura guardada'); A.recargar();
      } }] });
  };

  // ------------------------------------------------------------------ puntos de control (propietario)
  const formPuntos = async (ent) => {
    const [cons, eqs] = await Promise.all([S.list('consultorios', { entidad_id: ent.id }), S.list('equipos', { entidad_id: ent.id })]);
    const sedes = A.sedesDe(cons, ent); let l = [...(ent.config?.temp_puntos || [])];
    const termos = eqs.filter((e) => /termohigr|term[oó]metro|datalogger|higr[oó]metro/i.test(e.nombre || ''));
    const pinta = (m) => { m.body.querySelector('[data-l]').innerHTML = l.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Punto</th><th>Tipo</th><th>Sede</th><th>Rango</th><th></th></tr></thead><tbody>${l.map((p, i) => { const r = rangoDe(p); return `<tr><td><b>${h(p.nombre)}</b><div class="muted" style="font-size:.78rem">${h(p.area || '')}</div></td><td>${h((TIPOS[p.tipo] || TIPOS.ambiente).n)}</td><td>${h(p.sede || 'Todas')}</td><td class="num">${r.tmin} a ${r.tmax} °C${TIPOS[p.tipo]?.hum ? ` · ${r.hmin}-${r.hmax} %` : ''}</td><td><div class="row-actions"><button type="button" class="icon-btn" data-ed="${i}" aria-label="Editar">${I.edit}</button><button type="button" class="icon-btn bad" data-rm="${i}" aria-label="Quitar">${I.del}</button></div></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">Sin puntos de control.</div>'; };
    const editar = (i, m0) => {
      const p = i === null ? { id: 'p' + Date.now().toString(36), tipo: 'ambiente', sede: sedes[0] } : { ...l[i] };
      modal({ titulo: i === null ? 'Nuevo punto de control' : `Punto · ${p.nombre}`, size: 'wide', cuerpo: `<form class="form" onsubmit="return false">
        <fieldset><legend>Qué se controla</legend><div class="fields">${f.sel('tipo', 'Formato *', Object.entries(TIPOS).map(([k, t]) => [k, t.n]), p.tipo)}${f.input('nombre', 'Aplica a (área o equipo) *', p.nombre, { attrs: 'placeholder="ej: Área procesamiento / Nevera de proceso"' })}
          ${f.sel('sede', 'Sede', sedes, p.sede || sedes[0])}${f.input('area', 'Área', p.area)}${f.sel('equipo_id', 'Equipo a controlar (nevera / congelador, opcional)', [['', '—'], ...eqs.filter((e) => /never|refriger|congel|freezer|cava/i.test(e.nombre || '')).map((e) => [e.id, `${e.codigo_inv} · ${e.nombre}`])], p.equipo_id || '')}${f.input('activo', 'Activo fijo del equipo controlado', p.activo)}</div></fieldset>
        <fieldset><legend>Equipo de medición (termohigrómetro)</legend><div class="fields">${termos.length ? f.sel('med_eq', 'Del inventario (opcional)', [['', '—'], ...termos.map((e) => [e.id, `${e.codigo_inv} · ${e.nombre} ${e.serie || ''}`])], p.med_eq || '') : ''}${f.input('med_activo', 'Activo fijo / serie', p.med_activo)}${f.input('med_cert', 'Certificado de calibración No.', p.med_cert)}${f.input('med_fecha', 'Fecha de calibración', p.med_fecha, { type: 'date' })}
          ${f.input('factor_t', 'Factor de corrección temperatura (°C)', p.factor_t ?? 0, { type: 'number', attrs: 'step="0.1"' })}${f.input('factor_h', 'Factor de corrección humedad (%)', p.factor_h ?? 0, { type: 'number', attrs: 'step="0.1"' })}</div></fieldset>
        <fieldset><legend>Rango aceptable (vacío = el del formato)</legend><div class="fields">${f.input('tmin', 'T° mínima', p.tmin ?? '', { type: 'number', attrs: 'step="0.1"' })}${f.input('tmax', 'T° máxima', p.tmax ?? '', { type: 'number', attrs: 'step="0.1"' })}${f.input('hmin', '%HR mínima (ambiente)', p.hmin ?? '', { type: 'number' })}${f.input('hmax', '%HR máxima (ambiente)', p.hmax ?? '', { type: 'number' })}${f.input('codigo', 'Código propio del formato (opcional)', p.codigo)}</div></fieldset></form>`,
        alAbrir: (m) => { const me = m.body.querySelector('[name=med_eq]'); if (me) me.onchange = () => { const e = termos.find((x) => x.id === me.value); if (e) { m.body.querySelector('[name=med_activo]').value = e.codigo_inv || e.serie || ''; } }; },
        acciones: [{ t: 'Cancelar' }, { t: 'Aceptar', cls: 'pri', fn: (m) => { const v = leer(m.body); if (!v.nombre) { toast('Escriba a qué aplica', true); return false; } const o = { ...p, ...v }; if (i === null) l.push(o); else l[i] = o; pinta(m0); } }] });
    };
    modal({ titulo: `Puntos de control de temperatura y humedad · ${ent.razon_social}`, size: 'wide', cuerpo: `<p class="muted" style="font-size:.85rem">Agregue un punto por cada área (temperatura ambiente y humedad), nevera (refrigeración) o congelador que se controle en cada sede.</p><div data-l></div><div class="actions" style="margin-top:8px"><button type="button" class="btn" data-nuevo>${I.mas} Punto de control</button></div>`,
      alAbrir: (m) => { pinta(m); m.body.addEventListener('click', async (e) => { const ed = e.target.closest('[data-ed]'), rm = e.target.closest('[data-rm]'); if (e.target.closest('[data-nuevo]')) editar(null, m); if (ed) editar(+ed.dataset.ed, m); if (rm && await confirmar('¿Quitar este punto de control? Las lecturas ya registradas no se borran.')) { l.splice(+rm.dataset.rm, 1); pinta(m); } }); },
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar puntos', cls: 'pri', fn: async () => { await guardarPuntos(ent, l); toast('Puntos de control guardados'); A.recargar(); } }] });
  };

  // ------------------------------------------------------------------ PDF del mes (mismo diseño de los formatos Excel)
  A.pdfTemperatura = (ent, p, regs, anio, mes) => {
    const t = TIPOS[p.tipo] || TIPOS.ambiente, r = rangoDe(p), fmt = fmtDe(p), nd = diasMes(anio, mes);
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'letter', orientation: 'l' }), W = doc.internal.pageSize.getWidth(), M = 8, NG = [0, 0, 0], CL = [221, 235, 247], GR = [217, 217, 217];
    const val = (d, k, c) => { const x = regs.find((y) => +y.fecha.slice(8, 10) === d && y.turno === k); return x ? num(c === 't' ? x.datos?.t : x.datos?.h) : null; };
    const resp = (d) => [...new Set(regs.filter((y) => +y.fecha.slice(8, 10) === d).map((y) => y.datos?.resp).filter(Boolean))].join(' / ');
    const enc = () => {
      doc.autoTable({ startY: 6, theme: 'grid', margin: { left: M, right: M }, styles: { fontSize: 8, cellPadding: 1, lineColor: NG, lineWidth: 0.2, textColor: NG, halign: 'center', valign: 'middle' },
        body: [[{ content: 'FORMATO', rowSpan: 3, styles: { fontStyle: 'bold', cellWidth: 30 } }, { content: (fmt.titulo || t.n).toUpperCase(), rowSpan: 3, styles: { fontStyle: 'bold', fontSize: 10 } }, { content: `CÓDIGO: ${fmt.codigo || ''}`, styles: { cellWidth: 42 } }], [`VERSIÓN: ${fmt.version || ''}`], [`FECHA: ${fmt.fecha ? UI.fecha(fmt.fecha) : ''}`]] });
      doc.autoTable({ startY: doc.lastAutoTable.finalY + 1, theme: 'grid', margin: { left: M, right: M }, styles: { fontSize: 7.5, cellPadding: 0.9, lineColor: NG, lineWidth: 0.2, textColor: NG },
        body: [[{ content: 'APLICA A:', styles: { fontStyle: 'bold', fillColor: GR } }, { content: p.nombre, colSpan: 3 }, { content: 'MES:', styles: { fontStyle: 'bold', fillColor: GR } }, CAT.MESES[mes - 1].toUpperCase(), { content: 'AÑO:', styles: { fontStyle: 'bold', fillColor: GR } }, String(anio)],
          [{ content: 'EQUIPO A CONTROLAR', colSpan: 4, styles: { fontStyle: 'bold', halign: 'center', fillColor: CL } }, { content: 'EQUIPO DE MEDICIÓN', colSpan: 4, styles: { fontStyle: 'bold', halign: 'center', fillColor: CL } }],
          ...[['NOMBRE:', 'ACTIVO FIJO:', 'ÁREA:', 'SEDE:', 'ACTIVO FIJO:', 'CERTIFICADO DE CALIBRACIÓN No.:', 'FECHA DE CALIBRACIÓN:', 'FACTOR DE CORRECCIÓN:'].map((x) => ({ content: x, styles: { fontStyle: 'bold', fillColor: GR, fontSize: 6.8 } }))],
          [ent.razon_social, p.activo || '', p.area || '', p.sede || '', p.med_activo || '', p.med_cert || '', p.med_fecha ? UI.fecha(p.med_fecha) : '', t.hum ? `T: ${num(p.factor_t) || 0} °C · HR: ${num(p.factor_h) || 0} %` : `${num(p.factor_t) || 0} °C`],
          [{ content: 'RANGO ACEPTABLE:', styles: { fontStyle: 'bold', fillColor: GR } }, { content: t.hum ? `T° Ambiente: de ${r.tmin} °C hasta ${r.tmax} °C  -  % Humedad relativa: de ${r.hmin} hasta ${r.hmax}` : `T°: de ${r.tmin} °C hasta ${r.tmax} °C`, colSpan: 7 }]] });
    };
    const grilla = (c, titulo) => {
      const filas = [['Lectura Mañana (M)', (d) => val(d, 'M', c)], ['Lectura Tarde (T)', (d) => val(d, 'T', c)], ['Lectura Noche (N), si aplica', (d) => val(d, 'N', c)], ['M corregida', (d) => corr(p, val(d, 'M', c), c), 1], ['T corregida', (d) => corr(p, val(d, 'T', c), c), 1], ['N corregida, si aplica', (d) => corr(p, val(d, 'N', c), c), 1]];
      const chk = (v) => (c === 't' ? fueraT(p, v) : fueraH(p, v));
      doc.autoTable({ startY: doc.lastAutoTable.finalY + 1, theme: 'grid', margin: { left: M, right: M }, styles: { fontSize: 6.3, cellPadding: 0.6, lineColor: NG, lineWidth: 0.15, textColor: NG, halign: 'center', overflow: 'hidden' },
        head: [[{ content: titulo, colSpan: nd + 1, styles: { fillColor: GR, textColor: NG, fontStyle: 'bold', fontSize: 8 } }], ['Día', ...Array.from({ length: nd }, (_, i) => String(i + 1))]], headStyles: { fillColor: CL, textColor: NG },
        body: [...filas.map(([lab, fn, b]) => [{ content: `${c === 't' ? 'Temperatura' : 'Humedad'} ${lab}`, styles: { halign: 'left', fontStyle: b ? 'bold' : 'normal', fillColor: b ? CL : false } }, ...Array.from({ length: nd }, (_, i) => { const v = fn(i + 1); return { content: v === null ? '' : r1(v), styles: { fillColor: b && v !== null && chk(v) ? [253, 200, 200] : b ? CL : false } }; })]),
          [{ content: 'Realizado y verificado por', styles: { halign: 'left', fontSize: 5.8 } }, ...Array.from({ length: nd }, (_, i) => ({ content: resp(i + 1) ? resp(i + 1).split(' ').map((w) => w[0]).join('').slice(0, 4) : '', styles: { fontSize: 5 } }))]],
        columnStyles: { 0: { cellWidth: 44 } } });
      // gráfica
      let y = doc.lastAutoTable.finalY + 3; const gh = 46, gx = M + 12, gw = W - 2 * M - 16, lo = c === 't' ? r.tmin : r.hmin, hi = c === 't' ? r.tmax : r.hmax, mg = c === 't' ? t.mt : t.mh, ymin = lo - 2 * mg, ymax = hi + 2 * mg;
      if (y + gh + 10 > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); y = 12; }
      const Y = (v) => y + (1 - (Math.max(ymin, Math.min(ymax, v)) - ymin) / (ymax - ymin)) * gh, X = (d) => gx + ((d - 0.5) / nd) * gw;
      [[hi + mg, ymax, [243, 179, 179]], [hi, hi + mg, [253, 233, 168]], [lo, hi, [200, 235, 196]], [lo - mg, lo, [253, 233, 168]], [ymin, lo - mg, [243, 179, 179]]].forEach(([a, b, col]) => { doc.setFillColor(...col); doc.rect(gx, Y(b), gw, Y(a) - Y(b), 'F'); });
      doc.setDrawColor(120); doc.setLineWidth(0.2); doc.rect(gx, y, gw, gh); doc.setFontSize(6.5); doc.setTextColor(60);
      for (let k = 0; k <= 6; k++) { const v = ymin + (k * (ymax - ymin)) / 6; doc.text(String(Math.round(v)), gx - 1.5, Y(v) + 1, { align: 'right' }); }
      for (let d = 1; d <= nd; d++) doc.text(String(d), X(d), y + gh + 3.5, { align: 'center' });
      doc.setFontSize(7.5); doc.text(c === 't' ? `${t.et}` : 'HUMEDAD RELATIVA (%)', gx + gw / 2, y - 0.8, { align: 'center' });
      for (let d = 1; d <= nd; d++) [['M', -0.9, [20, 20, 20]], ['T', 0.9, [107, 124, 147]], ['N', 0, [0, 150, 190]]].forEach(([k, dx, col]) => { const v = corr(p, val(d, k, c), c); if (v === null) return; doc.setFillColor(...col); const cx = X(d) + dx, cy = Y(v); if (k === 'M') doc.lines([[1.1, 1.1], [-1.1, 1.1], [-1.1, -1.1], [1.1, -1.1]], cx, cy - 1.1, [1, 1], 'F', true); else doc.circle(cx, cy, 0.9, 'F'); });
      doc.setFontSize(6.5); doc.setTextColor(40); doc.text('Rombo negro: mañana corregida  ·  punto gris: tarde corregida  ·  punto azul: noche corregida', gx, y + gh + 7); doc.setTextColor(...NG);
      doc.lastAutoTable.finalY = y + gh + 8;
    };
    enc(); grilla('t', t.et);
    if (t.hum) { doc.addPage(); enc(); grilla('h', 'HUMEDAD RELATIVA (%)'); }
    const fuera = regs.filter((x) => fueraT(p, corr(p, num(x.datos?.t))) || (t.hum && fueraH(p, corr(p, num(x.datos?.h), 'h'))));
    doc.autoTable({ startY: doc.lastAutoTable.finalY + 2, theme: 'grid', margin: { left: M, right: M, bottom: 18 }, styles: { fontSize: 7, cellPadding: 0.9, lineColor: NG, lineWidth: 0.2, textColor: NG }, headStyles: { fillColor: GR, textColor: NG, fontStyle: 'bold', halign: 'center' },
      head: [[{ content: 'Siempre que el valor de la variable se encuentre por fuera de su rango de control, se debe realizar el siguiente análisis y toma de correcciones:', colSpan: 5 }], ['FECHA', 'VARIABLE', 'VALOR DE MEDICIÓN', 'ACCIÓN TOMADA (CORRECCIÓN)', 'OBSERVACIÓN / RESPONSABLE']],
      body: (fuera.length ? fuera : [null, null]).map((x) => (x ? [UI.fecha(x.fecha) + ' ' + x.turno, fueraT(p, corr(p, num(x.datos.t))) ? 'Temperatura' : 'Humedad', fueraT(p, corr(p, num(x.datos.t))) ? r1(corr(p, num(x.datos.t))) + ' °C' : r1(corr(p, num(x.datos.h), 'h')) + ' %HR', x.datos.accion || '', x.datos.resp || ''] : ['', '', '', '', ''])),
      columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 24 }, 2: { cellWidth: 28 } } });
    const n = doc.getNumberOfPages(), emp = st.emp || {};
    for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(6.5); doc.setTextColor(90); doc.text(`${emp.nombre || 'IBCOL Ingeniería Biomédica de Colombia'} · ${emp.email || ''} · Propiedad intelectual: documento controlado. Página ${i} de ${n}`, W / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' }); }
    return doc;
  };
})();
