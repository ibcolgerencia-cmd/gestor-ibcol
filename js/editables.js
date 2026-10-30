// =====================================================================
//  Datos editables del equipo (inventario y cronogramas), "NO REGISTRA",
//  documentos de soporte consultables desde la hoja de vida,
//  9.5 Recomendaciones para mediciones y firma digital de reportes.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, confirmar, leer, f } = UI;
  const esProp = A.esProp;
  const NOREG = FMT.NOREG;
  const nrm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  // ------------------------------------------------------------------ columnas del inventario / cronograma
  A.COLS_EQ = [
    { k: 'item', t: 'Ítem', w: 52 }, { k: 'codigo_inv', t: 'Código inv.', w: 110, mono: true }, { k: 'activo_fijo', t: 'N° A.F.', w: 90, mono: true },
    { k: 'nombre', t: 'Equipo', w: 170 }, { k: 'marca', t: 'Marca', w: 110 }, { k: 'modelo', t: 'Modelo', w: 110 }, { k: 'serie', t: 'Serie', w: 110, mono: true },
    { k: 'ubicacion', t: 'Ubicación / área', w: 190 }, { k: 'clase_riesgo', t: 'Riesgo', w: 110 }, { k: 'registro_sanitario', t: 'Registro sanitario', w: 150, mono: true },
  ];
  const OBLIG = ['codigo_inv', 'nombre']; // columnas que no se pueden dejar vacías en la base de datos
  A.val = FMT.val;
  const NOAPL = FMT.NOAPL;
  const marcado = (e, k) => !!e?.hv?.nr?.[k];
  const pillNR = (e, k) => `<span class="pill nr">${FMT.marca(e, k)}</span>`;

  // Celda en modo consulta
  A.celdaVer = (e, k, i, cons = []) => {
    if (marcado(e, k)) return pillNR(e, k);
    if (k === 'item') return h(e.hv?.item || String(i + 1));
    if (k === 'clase_riesgo') return A.riesgo(e.clase_riesgo) || '';
    if (k === 'ubicacion') { const c = cons.find((x) => x.id === e.consultorio_id); return `${h(c?.nombre || '—')}${e.ubicacion ? ' / ' + h(e.ubicacion) : ''}`; }
    if (k === 'nombre') return `<b>${h(e.nombre || '')}</b>`;
    return h(e[k] || '');
  };

  // Celda en modo edición
  A.celdaEdit = (e, k, i, cons = []) => {
    const at = `data-eqid="${e.id}" data-eqk="${k}"`;
    const v = marcado(e, k) ? FMT.marca(e, k) : k === 'item' ? (e.hv?.item ?? '') : (e[k] ?? '');
    if (k === 'clase_riesgo') {
      const op = [['', '—'], ...Object.keys(CAT.RIESGO).map((r) => [r, `Clase ${r}`]), [NOREG, NOREG], [NOAPL, NOAPL]];
      return `<select class="cel" ${at} aria-label="Riesgo">${op.map(([o, t]) => `<option value="${h(o)}" ${String(o) === String(v) ? 'selected' : ''}>${h(t)}</option>`).join('')}</select>`;
    }
    if (k === 'ubicacion') {
      return `<div class="cel2"><select class="cel" data-eqid="${e.id}" data-eqk="consultorio_id" aria-label="Área"><option value="">— Sin área —</option>${A.ordenar(cons).map((c) => `<option value="${c.id}" ${c.id === e.consultorio_id ? 'selected' : ''}>${h(c.nombre)}</option>`).join('')}</select>
        <input class="cel" ${at} value="${h(v)}" list="dl-noreg" placeholder="Ubicación" aria-label="Ubicación"></div>`;
    }
    return `<input class="cel" ${at} value="${h(v)}" list="dl-noreg" placeholder="${k === 'item' ? String(i + 1) : ''}" aria-label="${h(A.COLS_EQ.find((c) => c.k === k)?.t || k)}" ${k === 'item' ? 'style="width:52px"' : ''}>`;
  };
  A.datalistNR = '<datalist id="dl-noreg"><option value="NO REGISTRA"><option value="NO APLICA"></datalist>';

  // Guarda un dato del equipo. "NO REGISTRA" o "NR" quedan marcados sin romper reglas de la base de datos
  A.guardarDatoEq = async (e, k, crudo) => {
    const v = String(crudo ?? '').trim();
    const hv = { ...(e.hv || {}) }; const nr = { ...(hv.nr || {}) }; const cols = {};
    const esNR = /^(no registra|nr)$/i.test(v), esNA = /^(no aplica|n\/?a)$/i.test(v);
    if (k === 'consultorio_id') cols.consultorio_id = v || null;
    else if (esNR || esNA) {
      nr[k] = esNA ? 'NA' : true;
      if (k === 'item') delete hv.item; else if (!OBLIG.includes(k)) cols[k] = null;
    } else {
      delete nr[k];
      if (k === 'item') { if (v) hv.item = v; else delete hv.item; }
      else if (OBLIG.includes(k)) { if (!v) { toast('Este dato no puede quedar vacío. Escriba un valor o "NO REGISTRA".', true); return false; } cols[k] = v; }
      else cols[k] = v || null;
    }
    hv.nr = nr;
    const r = await S.update('equipos', e.id, { ...cols, hv });
    Object.assign(e, r || { ...cols, hv });
    return true;
  };

  // Enlaza los campos editables de una tabla (guardan al salir del campo)
  A.bindCeldas = (root, equipos, alGuardar) => {
    root.querySelectorAll('.cel[data-eqid]').forEach((el) => {
      el.dataset.ini = el.value;
      const guardar = async () => {
        if (el.value === el.dataset.ini) return;
        const e = equipos.find((x) => x.id === el.dataset.eqid); if (!e) return;
        el.classList.add('saving');
        try {
          const ok = await A.guardarDatoEq(e, el.dataset.eqk, el.value);
          if (ok === false) { el.value = el.dataset.ini; return; }
          if (/^(no registra|nr)$/i.test(el.value.trim())) el.value = NOREG; else if (/^(no aplica|n\/?a)$/i.test(el.value.trim())) el.value = NOAPL;
          el.dataset.ini = el.value; el.classList.add('ok'); setTimeout(() => el.classList.remove('ok'), 900);
          alGuardar?.(e);
        } catch (er) { toast(er.message, true); el.value = el.dataset.ini; } finally { el.classList.remove('saving'); }
      };
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'blur', guardar);
      if (el.tagName === 'INPUT') el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); el.blur(); } if (ev.key === 'Escape') { el.value = el.dataset.ini; el.blur(); } });
    });
  };

  // Completa con NO REGISTRA los datos vacíos de las columnas elegidas
  A.completarNR = (equipos, alTerminar) => modal({
    titulo: 'Completar datos vacíos con “NO REGISTRA”', size: 'sm',
    cuerpo: `<div class="form"><p class="muted">Se aplica a los ${equipos.length} equipos que se ven en la tabla. Solo cambia los datos que están vacíos.</p>
      ${f.checks('cols', 'Columnas', A.COLS_EQ.filter((c) => c.k !== 'item').map((c) => c.t), ['N° A.F.', 'Serie', 'Registro sanitario'])}</div>`,
    acciones: [{ t: 'Cancelar' }, { t: 'Completar', cls: 'pri', fn: async (m) => {
      const elegidas = A.COLS_EQ.filter((c) => leer(m.body).cols.includes(c.t)).map((c) => c.k);
      if (!elegidas.length) { toast('Elija al menos una columna', true); return false; }
      let n = 0;
      for (const e of equipos) {
        const faltan = elegidas.filter((k) => !marcado(e, k) && !String(e[k] ?? '').trim());
        if (!faltan.length) continue;
        const hv = { ...(e.hv || {}), nr: { ...(e.hv?.nr || {}) } }; faltan.forEach((k) => { hv.nr[k] = true; });
        Object.assign(e, (await S.update('equipos', e.id, { hv })) || { hv }); n += faltan.length;
      }
      toast(n ? `${n} datos marcados como NO REGISTRA` : 'No había datos vacíos en esas columnas'); alTerminar?.();
    } }],
  });

  // ------------------------------------------------------------------ 9.5 Recomendaciones para mediciones
  // Parámetro / cantidad / unidad sugeridos según el tipo de equipo
  A.MEDICIONES = [
    [/tensiometro|esfigmo|presion arterial/, [['Presión arterial', '0 - 300', 'mmHg']]],
    [/termohigro|higrometro/, [['Temperatura', '-10 - 50', '°C'], ['Humedad relativa', '20 - 90', '%HR']]],
    [/termometro/, [['Temperatura corporal', '35 - 42', '°C']]],
    [/glucometro/, [['Glucosa', '20 - 600', 'mg/dL']]],
    [/oximetro|pulsioximetro|saturometro/, [['Saturación de oxígeno (SpO2)', '70 - 100', '%'], ['Frecuencia cardiaca', '30 - 250', 'lpm']]],
    [/monitor/, [['Frecuencia cardiaca', '30 - 250', 'lpm'], ['SpO2', '70 - 100', '%'], ['Presión no invasiva', '0 - 300', 'mmHg'], ['Temperatura', '35 - 42', '°C']]],
    [/electrocardiogra|\becg\b|\bekg\b/, [['Frecuencia cardiaca', '30 - 300', 'lpm'], ['Sensibilidad', '10', 'mm/mV'], ['Velocidad de papel', '25', 'mm/s']]],
    [/desfibrilador|\bdea\b/, [['Energía entregada', '2 - 200', 'J'], ['Frecuencia cardiaca', '30 - 300', 'lpm']]],
    [/doppler/, [['Frecuencia cardiaca fetal', '50 - 210', 'lpm']]],
    [/bascula|balanza|pesa bebe|pesabebe/, [['Peso', '0 - 150', 'kg']]],
    [/tallimetro|infantometro|estadiometro/, [['Longitud / talla', '0 - 200', 'cm']]],
    [/autoclave|esteriliza/, [['Temperatura', '121 - 134', '°C'], ['Presión', '15 - 30', 'psi'], ['Tiempo de ciclo', '15 - 30', 'min']]],
    [/nevera|refrigerador|congelador|cadena de frio/, [['Temperatura', '2 - 8', '°C']]],
    [/incubadora/, [['Temperatura', '35 - 37', '°C'], ['Humedad', '40 - 80', '%HR']]],
    [/centrifuga/, [['Velocidad', '0 - 4000', 'RPM'], ['Tiempo', '0 - 60', 'min']]],
    [/succion|aspirador/, [['Presión de vacío', '0 - 600', 'mmHg']]],
    [/concentrador/, [['Flujo', '0.5 - 5', 'L/min'], ['Concentración de O2', '87 - 96', '%']]],
    [/flujometro|regulador|oxigeno/, [['Flujo', '0 - 15', 'L/min']]],
    [/nebulizador/, [['Flujo de aire', '6 - 8', 'L/min'], ['Presión', '14 - 35', 'psi']]],
    [/bomba de infusion|infusion/, [['Flujo', '0.1 - 999', 'mL/h'], ['Volumen a infundir', '0 - 9999', 'mL']]],
    [/fotocurado|lampara de luz led/, [['Intensidad lumínica', '800 - 1500', 'mW/cm²']]],
    [/micropipeta|pipeta/, [['Volumen', '10 - 1000', 'µL']]],
    [/electrobisturi|electrocauterio/, [['Potencia de corte', '0 - 300', 'W'], ['Potencia de coagulación', '0 - 120', 'W']]],
    [/ventilador/, [['Volumen corriente', '50 - 2000', 'mL'], ['Frecuencia respiratoria', '5 - 60', 'rpm'], ['FiO2', '21 - 100', '%']]],
    [/cronometro|temporizador/, [['Tiempo', '0 - 60', 'min']]],
    [/compresor|unidad odontologica/, [['Presión de aire', '60 - 80', 'psi']]],
  ];
  A.sugerirMediciones = (nombre) => { const n = nrm(nombre); const r = A.MEDICIONES.find(([re]) => re.test(n)); return r ? r[1].map(([p, c, u]) => ({ p, c, u })) : []; };

  // ------------------------------------------------------------------ documentos de soporte desde la hoja de vida
  const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(0, 90);
  A.abrirDoc = async (d) => {
    const b = await S.fileBlob(d.archivo); if (!b) throw new Error('El archivo no está disponible en este dispositivo');
    S.log('CONSULTA', 'documentos', d.id, d.nombre);
    const e = UI.ext(d.nombre);
    if (e === 'pdf') return UI.verPDF({ titulo: d.nombre, blob: b, nombre: d.nombre, archivo: d.archivo, alDescargar: () => S.log('DESCARGA', 'documentos', d.id, d.nombre) });
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(e)) { const url = URL.createObjectURL(b); return modal({ titulo: d.nombre, size: 'wide', cuerpo: `<div class="viewer"><img src="${url}" alt="${h(d.nombre)}"></div>`, acciones: [{ t: `${I.bajar} Descargar`, cls: 'pri', fn: () => { UI.descargar(b, d.nombre); return false; } }] }); }
    UI.descargar(b, d.nombre); S.log('DESCARGA', 'documentos', d.id, d.nombre); toast('Este tipo de archivo se abre con su programa. Descargando…');
  };

  const MANUALES = [
    { k: 'Operación', re: /operaci|usuario|\buser|instrucciones de uso|\bifu\b|manual de uso/ },
    { k: 'Mantenimiento', re: /mantenimiento|servicio|service|tecnico de servicio|reparaci/ },
    { k: 'Guía rápida', re: /guia rapida|guia de uso|quick|rapida|resumen de uso/ },
    { k: 'Ficha técnica', re: /ficha|tecnica|datasheet|data sheet|especificaci|catalogo|brochure/ },
  ];
  const claseManual = (d) => {
    const sub = nrm(d.subcarpeta), nom = nrm(d.nombre);
    const porSub = MANUALES.find((m) => sub && sub.startsWith(nrm(m.k)));
    if (porSub) return porSub.k;
    // el orden importa: "guía rápida" antes que "operación"; "ficha técnica" antes que "mantenimiento"
    for (const k of ['Guía rápida', 'Ficha técnica', 'Mantenimiento', 'Operación']) if (MANUALES.find((m) => m.k === k).re.test(nom)) return k;
    return 'Otros';
  };

  // Panel: Registro sanitario, factura, metrología, manuales e importación del equipo
  A.panelDocsHV = async (el, { ent, eq, cons, compacto = false }) => {
    const [docs0, mtos] = await Promise.all([S.list('documentos', { equipo_id: eq.id }, '-created_at'), S.list('mantenimientos', { equipo_id: eq.id, tipo: 'metrologia' }, '-fecha')]);
    const docs = esProp() ? docs0 : docs0.filter((d) => !window.IBCOL_ES_EXCEL(d.nombre));
    const de = (carpeta) => docs.filter((d) => d.carpeta === carpeta);
    const metroAplica = eq.periodicidad_metro && eq.periodicidad_metro !== 'No aplica';
    const manuales = de('manual'); const porClase = {}; manuales.forEach((d) => { (porClase[claseManual(d)] = porClase[claseManual(d)] || []).push(d); });
    const fila = (d) => `<div class="hvd-doc"><span class="ext ${h(UI.ext(d.nombre))}">${h(UI.ext(d.nombre).slice(0, 4).toUpperCase())}</span><span class="nm" title="${h(d.nombre)}">${h(d.nombre)}</span>
      ${d.fecha_vencimiento ? `<span class="pill ${UI.diasHasta(d.fecha_vencimiento) < 0 ? 'bad' : UI.diasHasta(d.fecha_vencimiento) <= 30 ? 'warn' : 'ok'}">Vence ${UI.fecha(d.fecha_vencimiento)}</span>` : ''}
      <button type="button" class="btn sm" data-hvd="ver" data-id="${d.id}">${I.ver} Consultar</button><button type="button" class="icon-btn" data-hvd="bajar" data-id="${d.id}" aria-label="Descargar">${I.bajar}</button></div>`;
    const subir = (carpeta, sub = '') => (esProp() ? `<label class="btn sm">${I.subir} Cargar<input type="file" hidden multiple data-hvup="${carpeta}" data-sub="${h(sub)}"></label>` : '');
    const vacio = (t) => `<div class="hvd-vacio">${t}</div>`;
    const bloque = (num, titulo, dato, carpeta, lista, extra = '') => `<div class="hvd-card"><header><div><span class="eyebrow">${num}</span><h4>${titulo}</h4>${dato ? `<span class="muted mono">${dato}</span>` : ''}</div><div class="actions">${subir(carpeta)}</div></header>
      ${lista.length ? lista.map(fila).join('') : vacio(esProp() ? 'Sin documento cargado. Use “Cargar” para agregarlo.' : 'Sin documento cargado.')}${extra}</div>`;
    const rs = A.val(eq, 'registro_sanitario');
    const gBtn = esProp() ? `<button type="button" class="btn" data-hvd="google">${I.ia} Buscar con Google</button>` : '';
    el.innerHTML = `${compacto ? (gBtn ? `<div class="actions" style="justify-content:flex-end">${gBtn}</div>` : '') : `<header><div><h2>Documentos consultables desde la hoja de vida</h2><span class="muted" style="font-size:.85rem">Toque “Consultar” para abrir el soporte de cada casilla de la hoja de vida.${esProp() ? ' “Buscar con Google” trae ficha técnica, guía rápida, registro sanitario y manuales.' : ''}</span></div><div class="actions">${gBtn}</div></header>`}
      <div class="hvd-grid">
        ${bloque('1.1', 'Registro sanitario o permiso', `${h(rs || 'NR')}${eq.fecha_venc_rs ? ' · vence ' + UI.fecha(eq.fecha_venc_rs) : ''}`, 'registro_sanitario', de('registro_sanitario'))}
        ${bloque('3.1 · 8.3', 'Factura o contrato', h(eq.hv?.factura ? 'Factura N° ' + eq.hv.factura : eq.hv?.contrato ? 'Contrato ' + eq.hv.contrato : 'NR'), 'factura', de('factura'))}
        ${bloque('9.3', 'Metrología', metroAplica ? `Aplica · ${h(eq.periodicidad_metro)}${eq.fecha_prox_metro ? ' · próxima ' + UI.fecha(eq.fecha_prox_metro) : ''}` : 'No aplica', 'metrologia', de('metrologia'),
          mtos.length ? `<div class="hvd-doc"><span class="ext pdf">FMB</span><span class="nm">${mtos.length} registro(s) de metrología · último ${UI.fecha(mtos[0].fecha)}${mtos[0].datos?.certificado ? ' · cert. ' + h(mtos[0].datos.certificado) : ''}</span><button type="button" class="btn sm" data-hvd="metro">${I.ver} Consultar</button></div>` : (!metroAplica && !de('metrologia').length ? '' : ''))}
        <div class="hvd-card wide"><header><div><span class="eyebrow">6.5</span><h4>Manuales</h4><span class="muted">Operación · Mantenimiento · Guía rápida · Ficha técnica</span></div></header>
          <div class="hvd-man">${[...MANUALES.map((m) => m.k), ...(porClase.Otros ? ['Otros'] : [])].map((k) => `<div class="hvd-slot"><div class="hvd-slot-h"><b>${k === 'Otros' ? 'Otros documentos' : k}</b>${k === 'Otros' ? '' : `<span class="pill ${porClase[k] ? 'ok' : ''}">${porClase[k] ? 'APLICA' : (eq.hv?.manuales || []).some((x) => nrm(x) === nrm(k)) ? 'APLICA · sin archivo' : 'NA'}</span>`}${k === 'Otros' ? '' : subir('manual', k.toUpperCase())}</div>
            ${(porClase[k] || []).map(fila).join('') || vacio('Sin documento.')}</div>`).join('')}</div></div>
        ${bloque('8.2', 'Certificado de importación', '', 'importacion', de('importacion'))}
      </div>`;
    const doc = (id) => docs.find((d) => d.id === id);
    el.querySelectorAll('[data-hvd]').forEach((b) => {
      b.onclick = async (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        try {
          if (b.dataset.hvd === 'ver') await A.abrirDoc(doc(b.dataset.id));
          if (b.dataset.hvd === 'bajar') { const d = doc(b.dataset.id); UI.descargar(await S.fileBlob(d.archivo), d.nombre); S.log('DESCARGA', 'documentos', d.id, d.nombre); }
          if (b.dataset.hvd === 'metro') await A.verMto(mtos[0], eq, ent, cons);
          if (b.dataset.hvd === 'google') await A.buscarGoogleEquipo(eq, ent);
        } catch (er) { toast(er.message, true); }
      };
    });
    el.querySelectorAll('[data-hvup]').forEach((inp) => {
      inp.onchange = async () => {
        const carpeta = inp.dataset.hvup, sub = inp.dataset.sub || null; const files = [...inp.files]; if (!files.length) return;
        try {
          for (const fl of files) {
            const path = `${eq.entidad_id}/${eq.id}/${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${slug(fl.name)}`;
            await S.upload(path, fl);
            await S.insert('documentos', { entidad_id: eq.entidad_id, equipo_id: eq.id, carpeta, subcarpeta: sub, nombre: fl.name, archivo: path, mime: fl.type, tamano: fl.size, fecha_documento: UI.hoy(), visible_cliente: true });
          }
          // la hoja de vida queda marcada: anexo presente / manual que aplica
          const act = await S.get('equipos', eq.id); const hv = { ...(act.hv || {}) };
          const anexo = { registro_sanitario: 'reg_sanitario', factura: 'factura', importacion: 'importacion' }[carpeta];
          if (anexo) hv.anexos = { ...(hv.anexos || {}), [anexo]: 'Anexo' };
          if (carpeta === 'manual' && sub) { const k = MANUALES.find((m) => m.k.toUpperCase() === sub)?.k; if (k) hv.manuales = [...new Set([...(Array.isArray(hv.manuales) ? hv.manuales : hv.manuales ? [hv.manuales] : []), k])]; }
          await S.update('equipos', eq.id, { hv }); eq.hv = hv;
          toast(files.length === 1 ? 'Documento cargado y enlazado a la hoja de vida' : `${files.length} documentos cargados`);
          A.panelDocsHV(el, { ent, eq, cons, compacto });
        } catch (er) { toast(er.message, true); }
      };
    });
  };

  A.modalDocsHV = (eq, ent, cons) => {
    const m = modal({ titulo: `Documentos de la hoja de vida · ${eq.nombre}`, size: 'wide', cuerpo: '<div data-hvdocs class="hvd-wrap"><div class="loading">Cargando documentos…</div></div>', acciones: [{ t: 'Cerrar' }] });
    A.panelDocsHV(m.body.querySelector('[data-hvdocs]'), { ent, eq, cons, compacto: true }).catch((er) => toast(er.message, true));
    return m;
  };

  // ------------------------------------------------------------------ firma digital de reportes
  const canon = (o) => (Array.isArray(o) ? `[${o.map(canon).join(',')}]` : o && typeof o === 'object' ? `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canon(o[k])}`).join(',')}}` : JSON.stringify(o ?? null));
  async function sha256(txt) {
    if (window.crypto?.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
    let h1 = 0x811c9dc5, h2 = 0x01000193; for (let i = 0; i < txt.length; i++) { h1 = Math.imul(h1 ^ txt.charCodeAt(i), 16777619); h2 = Math.imul(h2 ^ txt.charCodeAt(i), 2246822519); }
    return ((h1 >>> 0).toString(16) + (h2 >>> 0).toString(16)).padEnd(16, '0');
  }
  const contenidoFirmado = (reg) => { const { firma_digital, ...datos } = reg.datos || {}; return canon({ tipo: reg.tipo, numero: reg.numero, fecha: reg.fecha, equipo_id: reg.equipo_id, datos, realizo: !!reg.firma_realizo, recibe: !!reg.firma_recibe }); };
  const codigo = (hex) => hex.slice(0, 16).toUpperCase().match(/.{4}/g).join('-');
  A.firmarDigital = async (reg) => ({ por: st.perfil?.usuario || '', nombre: st.emp.responsable || '', cargo: st.emp.cargo || '', fecha: new Date().toISOString(), hash: codigo(await sha256(contenidoFirmado(reg))) });
  A.verificarFirma = async (reg) => { const fd = reg.datos?.firma_digital; if (!fd) return null; return codigo(await sha256(contenidoFirmado(reg))) === fd.hash; };

  // Firmar (o volver a firmar) un reporte ya guardado: quien recibe y quien realizó
  A.firmarReporte = (m, eq, ent, cons) => {
    const d = m.datos || {}; let fRecibe = m.firma_recibe || null, fRealizo = m.firma_realizo || st.firma || null; let cambioRecibe = false;
    const caja = (t, img, i) => `<div class="field"><span class="lbl">${t}</span><div class="sig-prev">${img ? `<img src="${img}" alt="Firma">` : '<span class="muted">Sin firma</span>'}</div><button type="button" class="btn sm" data-fsig="${i}">${I.firma} Capturar firma</button></div>`;
    modal({
      titulo: `Firma digital · Reporte ${m.numero || ''}`, size: 'wide',
      cuerpo: `<form class="form" onsubmit="return false"><p class="muted">La firma de quien realizó se estampa en la casilla “REALIZÓ” del formato y se genera un <b>código de verificación</b> con el contenido del reporte: si el reporte se modifica después, el código deja de coincidir.</p>
        <div class="fields">${f.input('recibe_nombre', 'Recibido a satisfacción: nombre', d.recibe_nombre)}${f.input('recibe_cargo', 'Cargo', d.recibe_cargo)}</div>
        <div class="grid2">${caja('Firma de quien recibe (puede firmar en la pantalla del celular o tableta)', fRecibe, 0)}${caja(`Firma de quien realizó (${h(st.emp.responsable || '')})`, fRealizo, 1)}</div></form>`,
      alAbrir: (mm) => mm.body.querySelectorAll('[data-fsig]').forEach((b) => {
        b.onclick = async () => {
          const i = +b.dataset.fsig; const r = await UI.pedirFirma({ titulo: i ? 'Firma de quien realizó' : 'Firma de quien recibe', actual: i ? st.firma : null });
          if (!r) return; if (i) fRealizo = r; else { fRecibe = r; cambioRecibe = true; }
          b.previousElementSibling.innerHTML = `<img src="${r}" alt="Firma">`;
        };
      }),
      acciones: [{ t: 'Cancelar' }, { t: `${I.firma} Firmar y ver PDF`, cls: 'pri', fn: async (mm) => {
        if (!fRealizo) { toast('Capture la firma de quien realizó (o regístrela en “Mi empresa y firma”)', true); return false; }
        const v = leer(mm.body);
        const datos = { ...d, recibe_nombre: v.recibe_nombre, recibe_cargo: v.recibe_cargo };
        if (fRecibe && (cambioRecibe || !datos.firma_recibe_fecha)) datos.firma_recibe_fecha = new Date().toISOString();
        if (!fRecibe) delete datos.firma_recibe_fecha;
        const reg = { ...m, datos, firma_recibe: fRecibe, firma_realizo: fRealizo };
        reg.datos.firma_digital = await A.firmarDigital(reg);
        const g = await S.update('mantenimientos', m.id, { datos: reg.datos, firma_recibe: fRecibe, firma_realizo: fRealizo });
        S.log('FIRMA', 'mantenimientos', m.id, `Reporte ${m.numero} · código ${reg.datos.firma_digital.hash}`);
        toast(`Reporte firmado digitalmente · código ${reg.datos.firma_digital.hash}`);
        A.recargar(); A.verMto(g || reg, eq, ent, cons);
      } }],
    });
  };
})();
