// =====================================================================
//  CONTROL DE ESTERILIZACIÓN · BITÁCORA DE CONTROL DE CARGAS Y VALIDACIÓN
//  DE ESTERILIZADORES (formato CE-FO-02 de IBCOL)
//  Una fila por carga o prueba del esterilizador: equipo, contenido, número y
//  lote de la carga, método / ciclo, horas, parámetros físicos, indicadores
//  (cinta testigo, indicador químico interno, indicador biológico) con su
//  evidencia fotográfica, liberación de la carga y responsable.
//  Mejoras según el Manual de buenas prácticas de esterilización
//  (Resolución 2183 de 2004) y la Resolución 3100 de 2019:
//   · prueba de Bowie-Dick y prueba de vacío (fuga) diarias,
//   · lote de la carga (trazabilidad hasta el paciente) y vencimiento,
//   · liberación de la carga: no se libera si un indicador falla o el
//     indicador biológico es positivo; cargas con implantes en cuarentena
//     hasta el resultado del biológico,
//   · foto del registro impreso / pantalla del ciclo del equipo.
//  Tabla: control_esterilizacion. El propietario crea, corrige y borra; el
//  usuario de la entidad y el personal asistencial (portal de calidad) ven
//  y agregan registros de su entidad / sede.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, confirmar, leer, f } = UI;
  const esProp = A.esProp;
  const TABLA = 'control_esterilizacion';
  const ENC = { titulo: 'BITÁCORA DE CONTROL DE CARGAS Y VALIDACIÓN DE ESTERILIZADORES', codigo: 'CE-FO-02', version: '01', fecha: '' };
  const TIPOS = ['Carga', 'Prueba Bowie-Dick', 'Prueba de vacío (fuga)', 'Carga con implantes'];
  const METODOS = ['Vapor 121 °C', 'Vapor 134 °C', 'Vapor 132 °C (rápido / flash)', 'Peróxido de hidrógeno (plasma)', 'Óxido de etileno', 'Calor seco', 'Otro'];
  const IND = [['', '—'], ['Cumple', 'Cumple'], ['No cumple', 'No cumple'], ['N/A', 'N/A']];
  const IB = [['', '—'], ['Negativo', 'Negativo (cumple)'], ['Positivo', 'Positivo (falla)'], ['Pendiente', 'Pendiente de lectura'], ['N/A', 'N/A']];
  const LIB = ['Liberada', 'En cuarentena (espera biológico)', 'No liberada - retenida', 'Reprocesada'];
  const FOTOS = [['fotos_cinta', 'Cinta testigo'], ['fotos_iq', 'Ind. químico interno'], ['fotos_ib', 'Ind. biológico'], ['fotos_ciclo', 'Registro del ciclo (impreso / pantalla)']];
  const fechaTxt = (s) => { if (!s) return ''; const [y, m, d] = String(s).slice(0, 10).split('-'); return y && m && d ? `${+d}/${+m}/${y}` : String(s); };
  const propio = (ent, sede) => (ent.config?.fmt_esterilizacion || {})[sede || '_'] || (ent.config?.fmt_esterilizacion || {})._ || null;
  const encDe = (ent, sede) => { const x = st.fmt?.esterilizacion || {}; return { ...ENC, institucion: ent.razon_social || '', ...['titulo', 'codigo', 'version', 'fecha'].reduce((o, k) => (x[k] ? { ...o, [k]: x[k] } : o), {}), ...(propio(ent, sede) || {}) }; };
  // ¿falla algún control? → la carga no se libera
  const falla = (d) => d.cinta === 'No cumple' || d.iq === 'No cumple' || d.ib === 'Positivo';
  const libSugerida = (d) => (falla(d) ? 'No liberada - retenida' : (/implante/i.test(d.tipo_registro || '') || d.implantes === 'Sí') && (!d.ib || d.ib === 'Pendiente') ? 'En cuarentena (espera biológico)' : 'Liberada');
  const pillInd = (v) => (!v ? '' : `<span class="pill ${v === 'Cumple' || v === 'Negativo' ? 'ok' : v === 'No cumple' || v === 'Positivo' ? 'bad' : v === 'Pendiente' ? 'warn' : ''}">${h(v)}</span>`);
  const pillLib = (v) => (!v ? '' : `<span class="pill ${v === 'Liberada' ? 'ok' : /No liberada/.test(v) ? 'bad' : 'warn'}">${h(v)}</span>`);
  const nFotos = (d) => FOTOS.reduce((n, [k]) => n + (d[k] || []).length, 0);
  const reducirFoto = (file) => new Promise((res) => { const u = URL.createObjectURL(file); const im = new Image(); im.onload = () => { const k = Math.min(1, 1400 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob((b) => res(b || file), 'image/jpeg', 0.78); }; im.onerror = () => { URL.revokeObjectURL(u); res(null); }; im.src = u; });
  const urlF = {};
  const urlFoto = async (fo) => { if (urlF[fo.archivo] !== undefined) return urlF[fo.archivo]; try { const b = await S.fileBlob(fo.archivo); if (!b || !b.size) throw new Error('vacía'); urlF[fo.archivo] = URL.createObjectURL(b); } catch (e) { urlF[fo.archivo] = null; } return urlF[fo.archivo]; };

  A.fotosEsterilizacion = async (r) => {
    const d = r.datos || {}; const grupos = [];
    for (const [k, t] of FOTOS) { const l = d[k] || []; const us = await Promise.all(l.map(urlFoto)); const ok = l.map((x, i) => [x, us[i]]).filter(([, u]) => u); if (ok.length) grupos.push([t, ok]); }
    modal({ titulo: `Evidencia · ${fechaTxt(r.fecha)} · carga ${d.n_carga || ''}`, size: 'wide', cuerpo: grupos.length ? grupos.map(([t, ok]) => `<h3 style="font-size:.95rem;margin:10px 0 6px">${h(t)}</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">${ok.map(([x, u]) => `<a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt="${h(x.nombre || t)}" style="width:100%;border-radius:8px;border:1px solid var(--line,#ddd)"></a>`).join('')}</div>`).join('') : '<div class="empty">No hay fotos disponibles.</div>', acciones: [{ t: 'Cerrar', cls: 'pri' }] });
  };

  // ------------------------------------------------------------------ vista de la carpeta
  A.G.esterilizacion = async (el, { ent, sede = null }) => {
    const hoy = new Date();
    st.esF = st.esF || {}; const llave = `${ent.id}|${sede || ''}`;
    const F = (st.esF[llave] = st.esF[llave] || { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1, equipo: '' });
    const [eqs, cons] = await Promise.all([S.list('equipos', { entidad_id: ent.id }), S.list('consultorios', { entidad_id: ent.id })]);
    const sedeEq = (e) => (cons.find((c) => c.id === e.consultorio_id)?.sede || 'Sede principal');
    const autoclaves = eqs.filter((e) => /autoclav|esteriliz|horno|calor seco/i.test(`${e.nombre} ${e.tipo || ''}`) && e.estado !== 'Dado de baja' && (!sede || sedeEq(e) === sede));
    let regs = [];
    try { regs = (await S.list(TABLA, { entidad_id: ent.id }, '-fecha')).filter((r) => !sede || (r.sede || null) === sede || !r.sede); } catch (er) {
      el.innerHTML = `<section class="panel"><header><h2>Control de esterilización</h2></header><div class="empty">${/control_esterilizacion|relation|schema cache|does not exist/i.test(er.message) ? `Falta instalar la tabla del formato en la base de datos.${esProp() ? ' Ejecute el archivo <b>supabase/esterilizacion.sql</b> en Supabase › SQL Editor (o pídale a Claude que lo active).' : ' Avísele a IBCOL.'}` : h(er.message)}</div></section>`;
      return;
    }
    const pintar = () => {
      const enc = encDe(ent, sede);
      const anios = [...new Set([hoy.getFullYear(), ...regs.map((r) => +String(r.fecha).slice(0, 4))])].sort((a, b) => b - a);
      const equipos = [...new Set(regs.map((r) => r.datos?.equipo).filter(Boolean))];
      const lista = regs.filter((r) => (!F.anio || +String(r.fecha).slice(0, 4) === +F.anio) && (!F.mes || +String(r.fecha).slice(5, 7) === +F.mes) && (!F.equipo || r.datos?.equipo === F.equipo))
        .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)) || String(a.datos?.hora_ini || '').localeCompare(String(b.datos?.hora_ini || '')) || String(a.created_at).localeCompare(String(b.created_at)));
      const nFalla = lista.filter((r) => falla(r.datos || {})).length, nPend = lista.filter((r) => /cuarentena/i.test(r.datos?.liberacion || '') || r.datos?.ib === 'Pendiente').length;
      const periodo = `${F.mes ? CAT.MESES[F.mes - 1] + ' ' : ''}${F.anio || 'todos los años'}`;
      // ¿se hizo la prueba de Bowie-Dick en los días con cargas de vapor?
      const diasVapor = new Set(lista.filter((r) => /vapor/i.test(r.datos?.metodo || '') && !/bowie|vac/i.test(r.datos?.tipo_registro || '')).map((r) => `${String(r.fecha).slice(0, 10)}|${r.datos?.equipo || ''}`));
      const diasBD = new Set(lista.filter((r) => /bowie/i.test(r.datos?.tipo_registro || '')).map((r) => `${String(r.fecha).slice(0, 10)}|${r.datos?.equipo || ''}`));
      const sinBD = [...diasVapor].filter((k) => !diasBD.has(k));
      el.innerHTML = `<section class="panel es"><header><div><h2>${h(enc.titulo)} · ${h(enc.codigo)}</h2><span class="muted" style="font-size:.85rem">${h(enc.institucion)}${sede ? ' · ' + h(sede) : ''} · Versión ${h(enc.version)}${enc.fecha ? ' · Vigencia ' + h(fechaTxt(enc.fecha) || enc.fecha) : ''}. Registre cada carga y las pruebas diarias del esterilizador con la foto de sus indicadores.</span></div>
          <div class="actions"><button class="btn pri" data-act="esNuevo">${I.mas} Registrar carga</button><button class="btn" data-act="esPDF">${I.pdf} PDF</button>
          ${esProp() ? `<button class="btn" data-act="esGuardarPDF" title="Guarda el PDF del periodo en esta carpeta">${I.subir} Guardar PDF en la carpeta</button><button class="btn" data-act="esExcel">${I.excel} Excel</button><button class="btn" data-act="esEnc">${I.edit} Encabezado</button>` : ''}</div></header>
        <div class="tbl-tools">
          <div class="field"><label for="es_anio">Año</label><select id="es_anio" data-es="anio"><option value="0">Todos</option>${anios.map((x) => `<option ${x === +F.anio ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
          <div class="field"><label for="es_mes">Mes</label><select id="es_mes" data-es="mes"><option value="0">Todo el año</option>${CAT.MESES.map((m, i) => `<option value="${i + 1}" ${i + 1 === +F.mes ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
          ${equipos.length > 1 ? `<div class="field"><label for="es_eq">Equipo</label><select id="es_eq" data-es="equipo"><option value="">Todos</option>${equipos.map((x) => `<option ${x === F.equipo ? 'selected' : ''}>${h(x)}</option>`).join('')}</select></div>` : ''}
          <span class="muted">${lista.length} registro${lista.length === 1 ? '' : 's'} · ${h(periodo)}</span>${nFalla ? `<span class="pill bad">${nFalla} con falla de indicador</span>` : ''}${nPend ? `<span class="pill warn">${nPend} en espera del biológico</span>` : ''}${sinBD.length ? `<span class="pill warn" title="${h(sinBD.map((k) => fechaTxt(k.split('|')[0])).join(', '))}">${sinBD.length} día${sinBD.length === 1 ? '' : 's'} con carga de vapor sin prueba de Bowie-Dick</span>` : ''}</div>
        <div class="tbl-wrap"><table class="tbl es-tbl"><thead><tr><th>Fecha</th><th>N° equipo / autoclave</th><th>Equipo / instrumental (contenido)</th><th>N° carga · lote</th><th>Método / ciclo</th><th>Hora inicio</th><th>Hora fin</th><th>Temp. (°C)</th><th>Presión / tiempo</th><th>Cinta testigo</th><th>Ind. químico interno</th><th>Ind. biológico (lote / res.)</th><th>Liberación</th><th>Responsable</th><th>Observaciones</th>${esProp() ? '<th></th>' : ''}</tr></thead>
          <tbody>${lista.map((r) => { const d = r.datos || {}; const fa = falla(d), nf = nFotos(d); return `<tr class="${fa ? 'gl-fuera' : ''}">
            <td class="num" style="white-space:nowrap">${fechaTxt(r.fecha)}</td><td>${h(d.equipo || '')}</td><td>${d.tipo_registro && d.tipo_registro !== 'Carga' ? `<b>${h(d.tipo_registro)}</b><br>` : ''}${h(d.contenido || '')}</td><td>${h(d.n_carga || '')}${d.lote_carga ? `<div class="mono muted" style="font-size:.75rem">${h(d.lote_carga)}</div>` : ''}</td><td>${h(d.metodo || '')}</td>
            <td class="num">${h(d.hora_ini || '')}</td><td class="num">${h(d.hora_fin || '')}</td><td class="num">${h(d.temp || '')}</td><td>${h([d.presion, d.tiempo ? d.tiempo + ' min' : ''].filter(Boolean).join(' / '))}</td>
            <td>${pillInd(d.cinta)}</td><td>${pillInd(d.iq)}${d.iq_clase ? `<div class="muted" style="font-size:.75rem">${h(d.iq_clase)}</div>` : ''}</td><td>${d.ib_lote ? `<span class="mono">${h(d.ib_lote)}</span> ` : ''}${pillInd(d.ib)}</td><td>${pillLib(d.liberacion)}${d.vence ? `<div class="muted" style="font-size:.75rem">Vence ${fechaTxt(d.vence)}</div>` : ''}</td>
            <td>${h(d.responsable || '')}</td><td>${h(d.observaciones || '')}${nf ? ` <button class="btn sm" data-act="esFotos" data-id="${r.id}" title="Ver la evidencia fotográfica">📷 ${nf}</button>` : ''}</td>
            ${esProp() ? `<td style="white-space:nowrap"><button class="icon-btn" data-act="esEditar" data-id="${r.id}" title="Corregir" aria-label="Corregir">${I.edit}</button><button class="icon-btn" data-act="esBorrar" data-id="${r.id}" title="Eliminar" aria-label="Eliminar">${I.del}</button></td>` : ''}</tr>`; }).join('') || `<tr><td colspan="${esProp() ? 16 : 15}" class="muted" style="text-align:center;padding:24px">Sin registros en ${h(periodo)}. Use «Registrar carga».</td></tr>`}</tbody></table></div>
        <p class="muted" style="font-size:.8rem;margin-top:8px">Carga liberada solo si la cinta testigo y el indicador químico cumplen y el biológico es negativo. Cargas con implantes: en cuarentena hasta el resultado del biológico. Ante una falla: retener la carga, revisar el ciclo y avisar a ingeniería biomédica (reporte de daño del equipo). Prueba de Bowie-Dick diaria antes de la primera carga en los esterilizadores de vapor con prevacío.</p></section>`;
      el.querySelectorAll('[data-es]').forEach((s) => { s.onchange = () => { F[s.dataset.es] = s.dataset.es === 'equipo' ? s.value : +s.value; pintar(); }; });
      A.acts({
        esNuevo: () => formRegistro(null),
        esEditar: (d) => formRegistro(regs.find((r) => r.id === d.id)),
        esFotos: (d) => A.fotosEsterilizacion(regs.find((r) => r.id === d.id)),
        esBorrar: async (d) => {
          const r = regs.find((x) => x.id === d.id); if (!r) return;
          if (!(await confirmar(`¿Eliminar el registro del ${fechaTxt(r.fecha)} (carga ${r.datos?.n_carga || ''})?`, 'Eliminar'))) return;
          await S.remove(TABLA, r.id); regs = regs.filter((x) => x.id !== r.id); toast('Registro eliminado'); pintar();
        },
        esPDF: async () => {
          if (!lista.length) return toast('No hay registros en el periodo elegido', true);
          toast('Preparando el PDF…'); const blob = await A.pdfEsterilizacion(ent, sede, lista, periodo);
          S.log('CONSULTA', TABLA, ent.id, `Control esterilización ${periodo}`);
          UI.verPDF({ titulo: `${enc.titulo} · ${periodo}`, blob, nombre: nombreArch(periodo), alDescargar: () => S.log('DESCARGA', TABLA, ent.id, `Control esterilización ${periodo}`) });
        },
        esGuardarPDF: async () => {
          if (!lista.length) return toast('No hay registros en el periodo elegido', true);
          const nombre = nombreArch(periodo);
          const viejos = (await S.list('documentos', { entidad_id: ent.id })).filter((d) => d.carpeta === 'esterilizacion' && d.nombre === nombre);
          for (const d of viejos) await S.remove('documentos', d.id);
          await A.guardarPDF({ blob: await A.pdfEsterilizacion(ent, sede, lista, periodo), nombre, entidad_id: ent.id, equipo_id: null, carpeta: 'esterilizacion', subcarpeta: sede || null });
          toast('PDF guardado en la carpeta'); A.recargar();
        },
        esExcel: () => excel(lista, periodo),
        esEnc: () => formEncabezado(),
      });
    };
    const nombreArch = (periodo) => `${encDe(ent, sede).codigo} Control esterilizacion ${sede ? sede + ' ' : ''}${periodo}.pdf`.replace(/[\\/:*?"<>|]/g, '-');

    // ---- formulario de un registro (equipo, método, responsable… se copian del último)
    const formRegistro = (r) => {
      const ult = regs.slice().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)) || String(b.created_at).localeCompare(String(a.created_at)))[0]?.datos || {};
      const a0 = autoclaves[0];
      const hoyD = UI.hoy();
      const nHoy = regs.filter((x) => String(x.fecha).slice(0, 10) === hoyD && x.datos?.equipo === (ult.equipo || '')).length;
      const d = r ? { ...r.datos } : { tipo_registro: 'Carga', equipo: ult.equipo || (a0 ? `${a0.codigo_inv || ''} ${a0.nombre || ''}`.trim() : ''), equipo_id: ult.equipo_id || a0?.id || '', contenido: '', n_carga: String(nHoy + 1), metodo: ult.metodo || 'Vapor 134 °C', hora_ini: '', hora_fin: '', temp: ult.temp || '', presion: ult.presion || '', tiempo: ult.tiempo || '', cinta: '', iq: '', iq_clase: ult.iq_clase || '', ib_lote: '', ib: '', implantes: 'No', liberacion: '', vence: '', responsable: ult.responsable || '', cargo: ult.cargo || '', observaciones: '' };
      const fecha = r ? String(r.fecha).slice(0, 10) : hoyD;
      const fotos = Object.fromEntries(FOTOS.map(([k]) => [k, [...(d[k] || [])]]));
      modal({ titulo: r ? `Corregir registro del ${fechaTxt(r.fecha)}` : 'Registrar carga de esterilización', size: 'wide',
        cuerpo: `<form class="form" onsubmit="return false">
          ${autoclaves.length ? `<div class="fields">${f.sel('_eq', 'Esterilizador del inventario', [['', '— Elegir —'], ...autoclaves.map((e) => [e.id, `${e.codigo_inv ? e.codigo_inv + ' · ' : ''}${e.nombre} ${e.marca || ''} ${e.modelo || ''}`.trim()])], d.equipo_id || '', { full: true })}</div>` : ''}
          <div class="fields">${f.input('fecha', 'Fecha', fecha, { type: 'date', req: true })}${f.sel('tipo_registro', 'Tipo de registro', TIPOS, d.tipo_registro || 'Carga')}${f.input('equipo', 'N° equipo / autoclave', d.equipo)}${f.input('n_carga', 'N° carga del día', d.n_carga, { attrs: 'inputmode="numeric"' })}
          ${f.input('contenido', 'Nombre del equipo / instrumental (contenido de la carga)', d.contenido, { full: true, attrs: 'placeholder="Ej.: 3 paquetes de instrumental de curación, 2 equipos de parto"' })}
          ${f.sel('metodo', 'Método / ciclo', METODOS, d.metodo)}${f.input('hora_ini', 'Hora inicio', d.hora_ini, { type: 'time' })}${f.input('hora_fin', 'Hora fin', d.hora_fin, { type: 'time' })}${f.input('temp', 'Temperatura (°C)', d.temp, { attrs: 'inputmode="decimal"' })}
          ${f.input('presion', 'Presión', d.presion, { attrs: 'placeholder="Ej.: 2,1 bar / 30 psi"' })}${f.input('tiempo', 'Tiempo de exposición (min)', d.tiempo, { attrs: 'inputmode="numeric"' })}${f.input('lote_carga', 'Lote de la carga (trazabilidad)', d.lote_carga || '', { attrs: 'placeholder="Se genera solo si lo deja vacío"' })}${f.input('vence', 'Fecha de vencimiento de los paquetes', d.vence, { type: 'date' })}</div>
          <fieldset><legend>Indicadores</legend><div class="fields">${f.sel('cinta', 'Cinta testigo (ind. externo)', IND, d.cinta)}${f.sel('iq', 'Indicador químico interno', IND, d.iq)}${f.input('iq_clase', 'Clase del indicador químico', d.iq_clase, { attrs: 'placeholder="Ej.: Clase 5 integrador"' })}${f.sel('implantes', '¿Carga con implantes?', ['No', 'Sí'], d.implantes || 'No')}
          ${f.input('ib_lote', 'Indicador biológico · lote', d.ib_lote)}${f.sel('ib', 'Indicador biológico · resultado', IB, d.ib)}${f.sel('liberacion', 'Liberación de la carga', [['', '— Según los indicadores —'], ...LIB.map((x) => [x, x])], d.liberacion || '')}</div>
          <p data-esaviso style="font-size:.85rem;margin:4px 0 0"></p></fieldset>
          <div class="fields">${f.input('observaciones', 'Observaciones', d.observaciones, { full: true })}${f.input('responsable', 'Responsable central', d.responsable, { req: true })}${f.input('cargo', 'Cargo', d.cargo)}</div>
          <fieldset><legend>Evidencia fotográfica</legend><p class="muted" style="font-size:.8rem;margin:0 0 6px">Tome la foto con el celular o cárguela. Se ven antes de guardar y se pueden quitar.</p>
          ${FOTOS.map(([k, t]) => `<div style="margin:6px 0 10px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="font-size:.88rem">${h(t)}</b><label class="btn sm">📷 Tomar o cargar<input type="file" accept="image/*" multiple hidden data-essub="${k}"></label></div><div data-esfotos="${k}" style="margin-top:4px"></div></div>`).join('')}</fieldset></form>`,
        alAbrir: (m) => {
          const q = (n) => m.body.querySelector(`[name=${n}]`);
          const se = q('_eq'); if (se) se.onchange = () => { const e = autoclaves.find((x) => x.id === se.value); if (e) q('equipo').value = `${e.codigo_inv || ''} ${e.nombre || ''}`.trim(); };
          const aviso = () => { const v = leer(m.body); const p = m.body.querySelector('[data-esaviso]'); const sug = libSugerida(v);
            p.innerHTML = falla(v) ? '<span class="pill bad">Falla de indicador</span> <b>No libere la carga:</b> reténgala, revise el ciclo y avise a ingeniería biomédica. Si alguna carga anterior ya se usó, informe al programa de tecnovigilancia.' : /cuarentena/.test(sug) ? '<span class="pill warn">Implantes</span> Mantenga la carga en cuarentena hasta tener el resultado negativo del indicador biológico.' : v.cinta || v.iq ? `<span class="pill ok">Sugerido: ${h(sug)}</span>` : '';
            if (falla(v) && q('liberacion').value === 'Liberada') q('liberacion').value = ''; };
          ['cinta', 'iq', 'ib', 'implantes', 'tipo_registro'].forEach((n) => { const x = q(n); if (x) x.onchange = aviso; }); aviso();
          const pintarF = async (k) => { const box = m.body.querySelector(`[data-esfotos="${k}"]`); const l = fotos[k]; if (!l.length) { box.innerHTML = '<span class="muted" style="font-size:.8rem">Sin fotos.</span>'; return; } const us = await Promise.all(l.map(urlFoto));
            box.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px">${l.map((x, i) => `<figure style="margin:0;position:relative;width:120px">${us[i] ? `<img src="${us[i]}" alt="" style="width:120px;height:90px;object-fit:cover;border-radius:6px;border:1px solid var(--line,#ddd);display:block">` : '<div style="width:120px;height:90px;display:flex;align-items:center;justify-content:center;font-size:.75rem;border:1px dashed #c33;border-radius:6px">No disponible</div>'}<button type="button" class="icon-btn bad" data-rmes="${k}|${i}" aria-label="Quitar foto" style="position:absolute;top:2px;right:2px;background:#fff">${I.x}</button></figure>`).join('')}</div>`; };
          FOTOS.forEach(([k]) => pintarF(k));
          m.body.addEventListener('click', (e) => { const b = e.target.closest('[data-rmes]'); if (!b) return; const [k, i] = b.dataset.rmes.split('|'); fotos[k].splice(+i, 1); pintarF(k); });
          m.body.querySelectorAll('[data-essub]').forEach((inp) => { inp.onchange = async () => { const k = inp.dataset.essub, fl = [...inp.files]; inp.value = ''; if (!fl.length) return; toast('Subiendo fotos…');
            for (const file of fl) { try { const b = await reducirFoto(file); if (!b) throw new Error('no es una imagen'); const path = `${ent.id}/compartidos/esterilizacion/${Date.now()}-${k}.jpg`; await S.upload(path, b); urlF[path] = URL.createObjectURL(b); fotos[k].push({ archivo: path, nombre: `${FOTOS.find((x) => x[0] === k)[1]} ${UI.hoy()} (${fotos[k].length + 1}).jpg`, tamano: b.size }); } catch (er) { toast(`${file.name}: ${er.message}`, true); } }
            pintarF(k); toast('Fotos agregadas (pulse Guardar)'); }; });
        },
        acciones: [{ t: 'Cancelar' }, { t: r ? 'Guardar cambios' : 'Guardar registro', cls: 'pri', fn: async (m) => {
          const v = leer(m.body);
          if (!v.fecha) { toast('Escriba la fecha', true); return false; }
          if (!String(v.responsable || '').trim()) { toast('Escriba el responsable', true); return false; }
          if (v.liberacion === 'Liberada' && falla(v)) { toast('Con una falla de indicador la carga no se puede liberar', true); return false; }
          const datos = { ...(r?.datos || {}) };
          ['tipo_registro', 'equipo', 'n_carga', 'contenido', 'metodo', 'hora_ini', 'hora_fin', 'temp', 'presion', 'tiempo', 'lote_carga', 'vence', 'cinta', 'iq', 'iq_clase', 'implantes', 'ib_lote', 'ib', 'liberacion', 'observaciones', 'responsable', 'cargo'].forEach((k) => { datos[k] = String(v[k] ?? '').trim(); });
          if (v._eq) datos.equipo_id = v._eq;
          if (!datos.lote_carga) { const eq = autoclaves.find((e) => e.id === datos.equipo_id); datos.lote_carga = `${v.fecha.replace(/-/g, '')}-${(eq?.codigo_inv || datos.equipo || 'EQ').replace(/[^\w]+/g, '').slice(-8).toUpperCase()}-${String(datos.n_carga || 1).padStart(2, '0')}`; }
          if (!datos.liberacion) datos.liberacion = libSugerida(datos);
          FOTOS.forEach(([k]) => { datos[k] = fotos[k].map(({ archivo, nombre, doc }) => ({ archivo, nombre, ...(doc ? { doc } : {}) })); });
          // copia como documento en la carpeta (solo IBCOL / usuarios con permiso; si no, la foto queda en el registro)
          for (const [k, t] of FOTOS) for (const x of datos[k]) { if (x.doc) continue; try { const dc = await S.insert('documentos', { entidad_id: ent.id, equipo_id: null, carpeta: 'esterilizacion', subcarpeta: `${sede ? sede + '/' : ''}EVIDENCIAS/${v.fecha.slice(0, 7)}`, nombre: `${t} ${fechaTxt(v.fecha)} carga ${datos.n_carga || ''} - ${x.nombre}`, archivo: x.archivo, mime: 'image/jpeg', fecha_documento: v.fecha, visible_cliente: true, firmado: false }); x.doc = dc.id; } catch (er) { /* sin permiso para documentos */ } }
          try {
            if (r) { const u = await S.update(TABLA, r.id, { fecha: v.fecha, datos }); regs = regs.map((x) => (x.id === r.id ? u : x)); }
            else { regs.push(await S.insert(TABLA, { entidad_id: ent.id, sede: sede || null, fecha: v.fecha, datos })); }
          } catch (er) { toast(er.message, true); return false; }
          toast(falla(datos) ? 'Registro guardado · CARGA NO LIBERADA' : 'Registro guardado', falla(datos));
          F.anio = +v.fecha.slice(0, 4); F.mes = +v.fecha.slice(5, 7); pintar();
        } }] });
    };

    const formEncabezado = () => {
      const e = encDe(ent, sede);
      modal({ titulo: `Encabezado del formato${sede ? ' · ' + sede : ''}`, size: 'wide',
        cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('institucion', 'Institución / clínica', e.institucion, { full: true })}${f.input('titulo', 'Nombre del formato', e.titulo, { full: true })}
          ${f.input('codigo', 'Código', e.codigo)}${f.input('version', 'Versión', e.version)}${f.input('fecha', 'Fecha de vigencia', e.fecha, { type: 'date' })}</div>
          <p class="muted">El logo es el de la entidad (Entidades › editar). Este encabezado sale en la pantalla, el PDF y el Excel${sede ? ' de esta sede' : ''}.</p></form>`,
        acciones: [...(propio(ent, sede) ? [{ t: 'Volver al predeterminado', fn: async () => { const todos = { ...(ent.config?.fmt_esterilizacion || {}) }; delete todos[sede || '_']; if (await A.guardarConfig(ent, { ...(ent.config || {}), fmt_esterilizacion: todos })) { toast('Encabezado predeterminado'); pintar(); } } }] : []), { t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
          const v = leer(m.body); const todos = { ...(ent.config?.fmt_esterilizacion || {}) }; todos[sede || '_'] = v;
          if (await A.guardarConfig(ent, { ...(ent.config || {}), fmt_esterilizacion: todos })) { toast('Encabezado guardado'); pintar(); }
        } }] });
    };

    const fila = (r) => { const d = r.datos || {}; return [fechaTxt(r.fecha), d.equipo || '', [d.tipo_registro && d.tipo_registro !== 'Carga' ? d.tipo_registro : '', d.contenido].filter(Boolean).join(' · '), [d.n_carga, d.lote_carga].filter(Boolean).join(' · '), d.metodo || '', d.hora_ini || '', d.hora_fin || '', d.temp || '', [d.presion, d.tiempo ? d.tiempo + ' min' : ''].filter(Boolean).join(' / '), d.cinta || '', [d.iq, d.iq_clase].filter(Boolean).join(' · '), [d.ib_lote, d.ib].filter(Boolean).join(' / '), [d.liberacion, d.vence ? 'Vence ' + fechaTxt(d.vence) : ''].filter(Boolean).join(' · '), [d.responsable, d.cargo].filter(Boolean).join(' · '), d.observaciones || '']; };
    A.esFila = fila;
    const excel = (lista, periodo) => {
      if (!esProp()) return toast('Solo IBCOL descarga el formato en Excel', true);
      const e = encDe(ent, sede);
      const aoa = [[`INSTITUCIÓN / CLÍNICA: ${e.institucion}`], [e.titulo], [`Código: ${e.codigo}`, '', '', `Versión: ${e.version}`, '', `Fecha Vigencia: ${fechaTxt(e.fecha) || e.fecha || ''}`, '', '', `Mes / Año: ${periodo}`], [],
        ['Fecha', 'N° Equipo / Autoclave', 'Nombre del Equipo / Instrumental', 'N° Carga del Día · Lote', 'Método / Ciclo', 'Hora Inicio', 'Hora Fin', 'Temp. (°C)', 'Presión / Tiempo', 'Cinta Testigo', 'Ind. Químico Interno', 'Ind. Biológico (Lote/Res.)', 'Liberación', 'Responsable Central', 'Observaciones'], ...lista.map(fila)];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!merges'] = ['A1:O1', 'A2:O2', 'A3:C3', 'D3:E3', 'F3:H3', 'I3:O3'].map((a) => XLSX.utils.decode_range(a));
      ws['!cols'] = [12, 18, 33, 16, 20, 11, 11, 10, 16, 14, 18, 22, 22, 22, 28].map((wch) => ({ wch }));
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Control_Cargas');
      XLSX.writeFile(wb, nombreArch(periodo).replace(/\.pdf$/, '.xlsx'));
      S.log('DESCARGA', TABLA, ent.id, `Excel control esterilización ${periodo}`);
    };
    pintar();
  };

  // ------------------------------------------------------------------ PDF con el diseño del formato CE-FO-02
  A.pdfEsterilizacion = async (ent, sede, lista, periodo = '') => {
    const e = encDe(ent, sede);
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'letter', orientation: 'landscape' });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 8, ancho = W - 2 * M;
    const AZ = [31, 78, 120], CL = [217, 225, 242], N = [0, 0, 0];
    const img = (src, x, y, mw, mh) => { if (!src) return; try { const p = doc.getImageProperties(src); const r = Math.min(mw / p.width, mh / p.height); doc.addImage(src, /^data:image\/png/i.test(src) ? 'PNG' : 'JPEG', x + (mw - p.width * r) / 2, y + (mh - p.height * r) / 2, p.width * r, p.height * r); } catch (er) { /* sin imagen */ } };
    const encabezado = () => {
      doc.setDrawColor(...N); doc.setLineWidth(0.25); const y = M, lw = 34;
      doc.rect(M, y, lw, 22); img(ent.logo, M + 1, y + 1, lw - 2, 20);
      doc.rect(M + lw, y, ancho - lw, 7); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.text(`INSTITUCIÓN / CLÍNICA: ${e.institucion}`, M + lw + 2, y + 4.8);
      doc.rect(M + lw, y + 7, ancho - lw, 8); doc.setFontSize(12); doc.text(e.titulo, M + lw + (ancho - lw) / 2, y + 12.6, { align: 'center' });
      const ws = [0.25, 0.2, 0.25, 0.3].map((k) => k * (ancho - lw)); let x = M + lw; doc.setFontSize(8.5);
      [`Código: ${e.codigo}`, `Versión: ${e.version}`, `Fecha Vigencia: ${fechaTxt(e.fecha) || e.fecha || '____/____/______'}`, `Mes / Año: ${periodo}`].forEach((t, i) => { doc.setFillColor(...CL); doc.rect(x, y + 15, ws[i], 7, 'FD'); doc.text(t, x + ws[i] / 2, y + 19.6, { align: 'center' }); x += ws[i]; });
      return y + 22 + 3;
    };
    const y0 = encabezado();
    const cols = [13, 18, 32, 18, 18, 10, 10, 9, 16, 13, 16, 19, 19, 20, 0]; const fijo = cols.reduce((a, b) => a + b, 0); cols[cols.length - 1] = ancho - fijo;
    const colStyles = {}; cols.forEach((w, i) => { colStyles[i] = { cellWidth: w }; });
    doc.autoTable({ startY: y0, theme: 'grid', margin: { left: M, right: M, top: y0, bottom: 14 }, tableWidth: ancho,
      head: [['Fecha', 'N° Equipo / Autoclave', 'Nombre del Equipo / Instrumental', 'N° Carga del Día · Lote', 'Método / Ciclo', 'Hora Inicio', 'Hora Fin', 'Temp. (°C)', 'Presión / Tiempo', 'Cinta Testigo', 'Ind. Químico Interno', 'Ind. Biológico (Lote/Res.)', 'Liberación', 'Responsable Central', 'Observaciones']],
      body: lista.length ? lista.map((r) => A.esFilaPDF(r)) : [Array(15).fill('')],
      styles: { fontSize: 6.6, cellPadding: 0.9, lineColor: N, lineWidth: 0.2, textColor: N, valign: 'middle', halign: 'center', overflow: 'linebreak' },
      headStyles: { fillColor: AZ, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 6.4 },
      columnStyles: colStyles,
      didParseCell: (c) => { if (c.section !== 'body') return; const t = String(c.cell.raw || ''); if (/No cumple|Positivo|No liberada/.test(t)) { c.cell.styles.textColor = [180, 0, 0]; c.cell.styles.fontStyle = 'bold'; } },
      didDrawPage: () => { if (doc.getCurrentPageInfo().pageNumber > 1) encabezado(); } });
    // evidencia fotográfica (solo las fotos que se pueden abrir)
    const ev = [];
    for (const r of lista) for (const [k, t] of FOTOS) for (const fo of r.datos?.[k] || []) { try { const bl = await S.fileBlob(fo.archivo); if (!bl || !bl.size) continue; const src = await new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = no; fr.readAsDataURL(bl); }); doc.getImageProperties(src); ev.push({ src, r, t }); } catch (er) { /* no disponible: se omite */ } }
    if (ev.length) {
      const nc = 4, gap = 4, fw = (ancho - gap * (nc - 1)) / nc, fh = fw * 0.72, cap = 8; let y = H;
      ev.forEach((x, i) => {
        const c = i % nc;
        if (c === 0 && y + fh + cap > H - 12) { doc.addPage(); y = encabezado(); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('EVIDENCIA FOTOGRÁFICA DE LOS INDICADORES', M, y + 3); y += 7; }
        const xx = M + c * (fw + gap); doc.setDrawColor(180); doc.rect(xx, y, fw, fh); img(x.src, xx + 0.8, y + 0.8, fw - 1.6, fh - 1.6); doc.setDrawColor(...N);
        const d = x.r.datos || {}; doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.text(doc.splitTextToSize(`${x.t} · ${fechaTxt(x.r.fecha)} · ${d.equipo || ''} · carga ${d.n_carga || ''}${d.lote_carga ? ' (' + d.lote_carga + ')' : ''}`, fw), xx, y + fh + 3);
        if (c === nc - 1 || i === ev.length - 1) y += fh + cap + 2;
      });
    }
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(60); doc.text(`${e.codigo} · Versión ${e.version} · ${e.institucion}`, M, H - 5); doc.text(`Página ${i} de ${n}`, W - M, H - 5, { align: 'right' }); doc.setTextColor(...N); }
    return doc.output('blob');
  };
  A.esFilaPDF = (r) => { const d = r.datos || {}; return [fechaTxt(r.fecha), d.equipo || '', [d.tipo_registro && d.tipo_registro !== 'Carga' ? d.tipo_registro : '', d.contenido].filter(Boolean).join(' · '), [d.n_carga, d.lote_carga].filter(Boolean).join(' · '), d.metodo || '', d.hora_ini || '', d.hora_fin || '', d.temp || '', [d.presion, d.tiempo ? d.tiempo + ' min' : ''].filter(Boolean).join(' / '), d.cinta || '', [d.iq, d.iq_clase].filter(Boolean).join(' · '), [d.ib_lote, d.ib].filter(Boolean).join(' / '), [d.liberacion, d.vence ? 'Vence ' + fechaTxt(d.vence) : ''].filter(Boolean).join(' · '), [d.responsable, d.cargo].filter(Boolean).join(' · '), d.observaciones || '']; };
})();
