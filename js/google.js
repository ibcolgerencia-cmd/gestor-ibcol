// =====================================================================
//  Búsqueda con Google + IA de Google (Gemini) para cada equipo del inventario:
//  ficha técnica, guía rápida, registro sanitario INVIMA, manuales del
//  fabricante y protocolo de mantenimiento preventivo. Todo se guarda en las
//  carpetas del equipo. También completa el reporte FMB-004.
//  Servidor: supabase/functions/buscar-equipo
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, confirmar, f } = UI;
  const NOREG = FMT.NOREG;
  const nrm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const vacio = (x) => x === undefined || x === null || String(x).trim() === '' || /^(nr|na|no registra|null|n\/a)$/i.test(String(x).trim());
  const lista = (x) => (Array.isArray(x) ? x : x ? [x] : []).map((s) => (typeof s === 'string' ? s.trim() : s)).filter((s) => s && !vacio(typeof s === 'string' ? s : 'x'));
  const fechaOK = (x) => /^\d{4}-\d{2}-\d{2}$/.test(String(x || ''));
  const dominio = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

  const QUE = [
    ['ficha', 'Ficha técnica', 'PDF en 7. Manual o ficha técnica › FICHA TÉCNICA'],
    ['guia', 'Guía rápida de uso', 'PDF en 7. Manual o ficha técnica › GUÍA RÁPIDA'],
    ['registro', 'Registro sanitario INVIMA', 'consulta en PDF en 5. Registro sanitario'],
    ['manuales', 'Manuales del fabricante', 'descarga los PDF encontrados a 7. › OPERACIÓN / MANTENIMIENTO'],
    ['mantenimiento', 'Protocolo de mantenimiento preventivo', 'queda en el equipo y llena los reportes FMB-004'],
  ];
  const SUB = { 'Operación': 'OPERACIÓN', 'Mantenimiento': 'MANTENIMIENTO', 'Guía rápida': 'GUÍA RÁPIDA', 'Ficha técnica': 'FICHA TÉCNICA' };
  const tipoDoc = (t) => { const n = nrm(t); return /guia|quick/.test(n) ? 'Guía rápida' : /ficha|datasheet|especific|catalog|brochure/.test(n) ? 'Ficha técnica' : /mantenim|servicio|service|tecnico|repair/.test(n) ? 'Mantenimiento' : 'Operación'; };

  // Datos del inventario para la búsqueda (sin "NO REGISTRA")
  const datosEq = (e) => {
    const v = (k) => { const x = FMT.val(e, k); return x === NOREG ? '' : x || ''; };
    return { nombre: v('nombre'), marca: v('marca'), modelo: v('modelo'), serie: v('serie'), registro_sanitario: v('registro_sanitario'), clase_riesgo: e.hv?.nr?.clase_riesgo ? '' : e.clase_riesgo || '', fabricante: e.fabricante || '', periodicidad_mto: e.periodicidad_mto || '' };
  };
  const claveGrupo = (e) => { const d = datosEq(e); return [d.nombre, d.marca, d.modelo].map(nrm).join('|'); };

  // ------------------------------------------------------------------ llamadas al servidor (con reintento ante cuota)
  async function llamar(body, onEspera) {
    for (let i = 0; i < 3; i++) {
      try { return await S.buscar(body); } catch (e) {
        const msg = e.message || '';
        if (i < 2 && /cuota|saturad|429|503|non-2xx|Failed to fetch/i.test(msg)) { onEspera?.(i, msg); await new Promise((r) => setTimeout(r, /cuota|429/i.test(msg) ? 45000 : 8000)); continue; }
        throw e;
      }
    }
  }
  A.investigarEquipo = (e, que) => llamar({ accion: 'investigar', equipo: datosEq(e), que });

  // ------------------------------------------------------------------ textos (Markdown → PDF con formato IBCOL)
  const tabla = (filas) => { const f2 = filas.filter(([, v]) => !vacio(v)); return f2.length ? `| Campo | Dato |\n|---|---|\n${f2.map(([k, v]) => `| ${k} | ${String(v).replace(/\|/g, '/').replace(/\n/g, ' ')} |`).join('\n')}\n` : ''; };
  const vinetas = (l) => lista(l).map((x) => `- ${x}`).join('\n');
  const numeros = (l) => lista(l).map((x, i) => `${i + 1}. ${x}`).join('\n');
  const pieFuentes = (r) => {
    const fu = (r.fuentes || []).slice(0, 12);
    return `\n## Fuentes consultadas\n${fu.length ? fu.map((x) => `- ${x.titulo}${dominio(x.url) && !/vertexaisearch/.test(x.url) ? ' (' + dominio(x.url) + ')' : ''}`).join('\n') : '- Búsqueda en Google con IA de Google (Gemini)'}\n\nDocumento elaborado con búsqueda en Google e IA el ${UI.fecha(UI.hoy())}. Verifique los datos con la placa del equipo y el manual del fabricante antes de usarlo como soporte oficial.${r.datos?.nota ? `\n\nNota: ${r.datos.nota}` : ''}`;
  };
  const mdFicha = (e, r) => {
    const x = r.datos.ficha || {}, d = datosEq(e);
    return [
      '## 1. Identificación', tabla([['Equipo', d.nombre], ['Nombre comercial', x.nombre_comercial], ['Marca', d.marca], ['Modelo', d.modelo], ['Serie', d.serie], ['Código de inventario', e.codigo_inv], ['Fabricante', x.fabricante], ['País de origen', x.pais_origen], ['Clasificación de riesgo', x.clase_riesgo || d.clase_riesgo], ['Registro sanitario', d.registro_sanitario || r.datos.registro?.numero], ['Vida útil', x.vida_util]]),
      x.descripcion || x.funcion || x.principio_funcionamiento ? `## 2. Descripción y función\n${[x.descripcion, x.funcion && `Función: ${x.funcion}`, x.principio_funcionamiento && `Principio de funcionamiento: ${x.principio_funcionamiento}`].filter(Boolean).join('\n\n')}\n` : '',
      lista(x.especificaciones).length ? `## 3. Especificaciones técnicas\n| Parámetro | Valor |\n|---|---|\n${lista(x.especificaciones).filter((s) => s.parametro && !vacio(s.valor)).map((s) => `| ${s.parametro} | ${String(s.valor).replace(/\|/g, '/')} |`).join('\n')}\n` : '',
      tabla([['Alimentación', x.alimentacion], ['Voltaje', x.voltaje], ['Frecuencia', x.frecuencia], ['Potencia', x.potencia], ['Corriente', x.corriente], ['Batería', x.bateria]]) ? `## 4. Alimentación eléctrica\n${tabla([['Alimentación', x.alimentacion], ['Voltaje', x.voltaje], ['Frecuencia', x.frecuencia], ['Potencia', x.potencia], ['Corriente', x.corriente], ['Batería', x.bateria]])}` : '',
      tabla([['Peso', x.peso], ['Dimensiones', x.dimensiones], ['Rangos de medición / operación', x.rangos], ['Temperatura de operación', x.temperatura_operacion], ['Humedad de operación', x.humedad_operacion]]) ? `## 5. Características físicas y ambientales\n${tabla([['Peso', x.peso], ['Dimensiones', x.dimensiones], ['Rangos de medición / operación', x.rangos], ['Temperatura de operación', x.temperatura_operacion], ['Humedad de operación', x.humedad_operacion]])}` : '',
      lista(x.accesorios).length ? `## 6. Accesorios\n${vinetas(x.accesorios)}\n` : '',
      lista(x.normas).length ? `## 7. Normas técnicas\n${vinetas(x.normas)}\n` : '',
      pieFuentes(r),
    ].filter(Boolean).join('\n');
  };
  const mdGuia = (e, r) => {
    const g = r.datos.guia || {};
    const sec = (t, l, num = true) => (lista(l).length ? `## ${t}\n${num ? numeros(l) : vinetas(l)}\n` : '');
    return [
      `Equipo: ${[datosEq(e).nombre, datosEq(e).marca, datosEq(e).modelo].filter(Boolean).join(' · ')} · Código ${e.codigo_inv}\n`,
      sec('1. Antes de usar', g.antes_de_usar), sec('2. Encendido', g.encendido), sec('3. Uso paso a paso', g.uso), sec('4. Apagado', g.apagado),
      sec('5. Limpieza y desinfección', g.limpieza, false), sec('6. Almacenamiento', g.almacenamiento, false),
      lista(g.fallas).length ? `## 7. Qué hacer ante una falla\n| Problema | Solución |\n|---|---|\n${lista(g.fallas).filter((x) => x.problema).map((x) => `| ${x.problema} | ${x.solucion || ''} |`).join('\n')}\n` : '',
      sec('8. Precauciones', g.precauciones, false),
      '## Ante una falla o evento adverso\nRetire el equipo del servicio, márquelo como fuera de servicio, informe al responsable de tecnovigilancia y solicite soporte a IBCOL Ingeniería Biomédica de Colombia (3146586628 – 3146872775).',
      pieFuentes(r),
    ].filter(Boolean).join('\n');
  };
  const mdRegistro = (e, r) => {
    const x = r.datos.registro || {}, d = datosEq(e);
    return [
      '## Datos del equipo en el inventario', tabla([['Equipo', d.nombre], ['Marca', d.marca], ['Modelo', d.modelo], ['Serie', d.serie], ['Código de inventario', e.codigo_inv], ['Registro sanitario en inventario', d.registro_sanitario || 'No registra']]),
      '## Resultado de la consulta', tabla([['Registro sanitario / permiso', x.numero || 'No encontrado'], ['Estado', x.estado], ['Titular', x.titular], ['Fabricante', x.fabricante], ['Importador', x.importador], ['Fecha de expedición', fechaOK(x.fecha_expedicion) ? UI.fecha(x.fecha_expedicion) : x.fecha_expedicion], ['Fecha de vencimiento', fechaOK(x.fecha_vencimiento) ? UI.fecha(x.fecha_vencimiento) : x.fecha_vencimiento], ['Clasificación de riesgo', x.clase_riesgo], ['Modalidad', x.modalidad], ['Coincide con el inventario', x.coincide_con_inventario === true ? 'Sí' : x.coincide_con_inventario === false ? 'No: revisar' : '']]),
      `## Verificación\nConfirme el registro en la consulta oficial del INVIMA (consultaregistro.invima.gov.co) e imprima el soporte oficial para el archivo del equipo.${x.url_consulta && !/vertexaisearch/.test(x.url_consulta) ? `\nEnlace de consulta: ${x.url_consulta}` : ''}`,
      pieFuentes(r),
    ].filter(Boolean).join('\n');
  };

  // ------------------------------------------------------------------ guardado en las carpetas del equipo
  async function reemplazarPDF(e, ent, { titulo, texto, nombre, carpeta, subcarpeta }) {
    const viejos = (await S.list('documentos', { equipo_id: e.id })).filter((d) => d.carpeta === carpeta && d.nombre === nombre);
    for (const d of viejos) { try { await S.removeFile(d.archivo); } catch {} await S.remove('documentos', d.id); }
    const doc = PDF.documento({ titulo, texto, ent, emp: st.emp, fmt: { codigo: '', version: '01', fecha: UI.hoy() }, firma: st.firma });
    return A.guardarPDF({ blob: doc.output('blob'), nombre, entidad_id: e.entidad_id, equipo_id: e.id, carpeta, subcarpeta });
  }
  const b64Blob = (b64, mime) => { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return new Blob([u], { type: mime }); };
  const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(0, 90);
  A.descargarPDFWeb = async (url) => { const r = await llamar({ accion: 'descargar', url }); return { blob: b64Blob(r.base64, r.mime), nombre: r.nombre }; };

  // Guarda lo elegido. sel = { ficha, guia, registro, manuales: [doc], mantenimiento, completar }, textos = markdown editado
  A.guardarBusqueda = async (e, ent, r, sel, textos = {}, cacheDescargas = {}) => {
    const hecho = [], fallos = [];
    const d = datosEq(e), etiqueta = `${e.codigo_inv} ${d.nombre}`.trim();
    const act = await S.get('equipos', e.id); const hv = { ...(act.hv || {}) }; const cols = {};
    const manuales = new Set(Array.isArray(hv.manuales) ? hv.manuales : hv.manuales ? [hv.manuales] : []);
    if (sel.ficha && r.datos.ficha) { await reemplazarPDF(e, ent, { titulo: `FICHA TÉCNICA · ${d.nombre.toUpperCase()}`, texto: textos.ficha || mdFicha(e, r), nombre: `Ficha técnica ${etiqueta}.pdf`, carpeta: 'manual', subcarpeta: 'FICHA TÉCNICA' }); manuales.add('Ficha técnica'); hecho.push('ficha técnica'); }
    if (sel.guia && r.datos.guia) { await reemplazarPDF(e, ent, { titulo: `GUÍA RÁPIDA DE USO · ${d.nombre.toUpperCase()}`, texto: textos.guia || mdGuia(e, r), nombre: `Guía rápida ${etiqueta}.pdf`, carpeta: 'manual', subcarpeta: 'GUÍA RÁPIDA' }); manuales.add('Guía rápida'); hv.anexos = { ...(hv.anexos || {}), guia: 'Anexo' }; hecho.push('guía rápida'); }
    if (sel.registro && r.datos.registro) {
      await reemplazarPDF(e, ent, { titulo: 'CONSULTA DE REGISTRO SANITARIO', texto: textos.registro || mdRegistro(e, r), nombre: `Consulta registro sanitario ${etiqueta}.pdf`, carpeta: 'registro_sanitario', subcarpeta: null });
      hecho.push('consulta de registro sanitario');
    }
    for (const doc of sel.manuales || []) {
      try {
        const k = doc.url; cacheDescargas[k] = cacheDescargas[k] || A.descargarPDFWeb(doc.url);
        const { blob, nombre } = await cacheDescargas[k];
        const tipo = doc.tipo && SUB[doc.tipo] ? doc.tipo : tipoDoc(doc.tipo + ' ' + doc.titulo);
        const nom = `${tipo} - ${doc.titulo && doc.titulo.length < 80 ? slug(doc.titulo).replace(/_/g, ' ') + '.pdf' : nombre}`;
        const path = `${e.entidad_id}/${e.id}/manual/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${slug(nom)}`;
        await S.upload(path, blob);
        await S.insert('documentos', { entidad_id: e.entidad_id, equipo_id: e.id, carpeta: 'manual', subcarpeta: SUB[tipo], nombre: nom, archivo: path, mime: 'application/pdf', tamano: blob.size, fecha_documento: UI.hoy(), visible_cliente: true });
        manuales.add(tipo); hecho.push(`manual (${tipo.toLowerCase()})`);
      } catch (er) { fallos.push({ doc, error: er.message }); }
    }
    if (sel.mantenimiento && r.datos.mantenimiento) {
      const m = r.datos.mantenimiento;
      hv.protocolo_mto = { pruebas: lista(m.pruebas).slice(0, 12), actividades: lista(m.actividades).slice(0, 12), herramientas: lista(m.herramientas), observaciones: m.observaciones || '', metrologia: m.metrologia || '', frecuencia: m.frecuencia || '', fecha: UI.hoy(), origen: 'Google + IA' };
      if (!act.periodicidad_mto && CAT.PERIODICIDAD[m.frecuencia]) cols.periodicidad_mto = m.frecuencia;
      hecho.push('protocolo de mantenimiento');
    }
    // completar solo los datos vacíos del inventario y la hoja de vida
    if (sel.completar) {
      const x = r.datos.ficha || {}, rg = r.datos.registro || {};
      const pon = (k, v, enHV = true) => { if (vacio(v)) return; if (enHV) { if (vacio(hv[k])) hv[k] = String(v); } else if (vacio(act[k]) && !act.hv?.nr?.[k]) cols[k] = v; };
      pon('fabricante', x.fabricante || rg.fabricante, false);
      const rsOk = rg.numero && !/no encontrado/i.test(rg.estado || '') && rg.coincide_con_inventario !== false;
      if (rsOk && vacio(act.registro_sanitario) && !act.hv?.nr?.registro_sanitario) { cols.registro_sanitario = rg.numero; if (!hv.tipo_registro || hv.tipo_registro === 'NR') hv.tipo_registro = 'RS'; }
      if (rsOk && fechaOK(rg.fecha_vencimiento) && !act.fecha_venc_rs) cols.fecha_venc_rs = rg.fecha_vencimiento;
      const cr = { I: 'I', IIA: 'IIa', IIB: 'IIb', III: 'III' }[String(x.clase_riesgo || rg.clase_riesgo || '').toUpperCase().replace(/CLASE|\s/g, '')];
      if (cr && !act.clase_riesgo && !act.hv?.nr?.clase_riesgo) cols.clase_riesgo = cr;
      [['funcion', x.funcion], ['voltaje', x.voltaje], ['frecuencia', x.frecuencia], ['potencia', x.potencia], ['corriente', x.corriente], ['peso', x.peso], ['dimensiones', x.dimensiones], ['rangos', x.rangos], ['temperatura', x.temperatura_operacion], ['humedad', x.humedad_operacion], ['vida_util', x.vida_util]].forEach(([k, v]) => pon(k, v));
      if (vacio(hv.recomendaciones) && r.datos.guia) { const p = [...lista(r.datos.guia.antes_de_usar), ...lista(r.datos.guia.limpieza), ...lista(r.datos.guia.precauciones)].slice(0, 12); if (p.length) hv.recomendaciones = p.map((s) => `- ${s}`).join('\n'); }
      if (!(hv.accesorios || []).some((a) => a.nombre) && lista(x.accesorios).length) hv.accesorios = lista(x.accesorios).slice(0, 4).map((nombre) => ({ nombre: String(nombre).slice(0, 60) }));
      if (Object.keys(cols).length || hecho.length) hecho.push('datos vacíos de la hoja de vida');
    }
    if (sel.registro && r.datos.registro?.numero) hv.anexos = { ...(hv.anexos || {}), reg_sanitario: 'Anexo' };
    hv.manuales = [...manuales];
    hv.busqueda_google = { fecha: UI.hoy(), identificado: !!r.datos.identificado, fuentes: (r.fuentes || []).slice(0, 15) };
    const nuevo = await S.update('equipos', e.id, { ...cols, hv }); Object.assign(e, nuevo || { ...cols, hv });
    S.log('MODIFICA', 'equipos', e.id, `Búsqueda con Google: ${hecho.join(', ') || 'sin cambios'}`);
    return { hecho, fallos };
  };

  // ------------------------------------------------------------------ ventana por equipo
  const iframeSug = (html) => (html ? `<iframe class="g-sug" sandbox="allow-popups allow-popups-to-escape-sandbox" title="Sugerencias de búsqueda de Google" srcdoc="${h(`<base target="_blank">${html}`)}"></iframe>` : '');
  const fuentesHTML = (r) => ((r.fuentes || []).length ? `<details class="g-fu"><summary>${r.fuentes.length} fuentes de Google consultadas</summary><ul>${r.fuentes.map((x) => `<li><a href="${h(x.url)}" target="_blank" rel="noopener noreferrer">${h(x.titulo)}</a></li>`).join('')}</ul></details>` : '');

  A.buscarGoogleEquipo = async (eq, ent) => {
    ent = ent || (await S.get('entidades', eq.entidad_id));
    const d = datosEq(eq); let r = null; const cache = {};
    const m = modal({
      titulo: `Buscar con Google · ${eq.nombre}`, size: 'wide',
      cuerpo: `<form class="form g-form" onsubmit="return false">
        <p class="muted">Con los datos del inventario, la IA de Google busca en internet la información del equipo y prepara los documentos para guardarlos en sus carpetas. Puede corregir los datos de búsqueda.</p>
        <div class="fields">${f.input('g_nombre', 'Equipo', d.nombre)}${f.input('g_marca', 'Marca', d.marca)}${f.input('g_modelo', 'Modelo', d.modelo)}${f.input('g_rs', 'Registro sanitario', d.registro_sanitario)}</div>
        <div class="g-que">${QUE.map(([k, t, s]) => `<label class="g-chk"><input type="checkbox" name="que" value="${k}" checked><b>${t}</b><small>${s}</small></label>`).join('')}</div>
        <div class="actions"><button type="button" class="btn pri" data-g="buscar">${I.ia} Buscar con Google</button><span class="muted" data-g-estado></span></div>
        <div data-g-res></div></form>`,
      acciones: [{ t: 'Cerrar' }, { t: `${I.subir} Guardar en las carpetas del equipo`, cls: 'pri', fn: async (mm) => {
        if (!r) { toast('Primero haga la búsqueda', true); return false; }
        const b = mm.body, chk = (k) => !!b.querySelector(`[data-gs="${k}"]`)?.checked;
        const sel = { ficha: chk('ficha'), guia: chk('guia'), registro: chk('registro'), mantenimiento: chk('mantenimiento'), completar: chk('completar'),
          manuales: [...b.querySelectorAll('[data-gdoc]:checked')].map((c) => ({ ...r.datos.documentos[+c.dataset.gdoc], tipo: b.querySelector(`[data-gtipo="${c.dataset.gdoc}"]`).value })) };
        const textos = Object.fromEntries(['ficha', 'guia', 'registro'].map((k) => [k, b.querySelector(`[data-gtxt="${k}"]`)?.value]));
        toast('Guardando en las carpetas del equipo…');
        const { hecho, fallos } = await A.guardarBusqueda(eq, ent, r, sel, textos, cache);
        if (fallos.length) modal({ titulo: 'Manuales que no se pudieron descargar', size: 'sm', cuerpo: `<p class="muted">Algunos sitios no permiten la descarga automática. Ábralos, descárguelos y súbalos con “Cargar” en la hoja de vida del equipo.</p><ul class="g-fallos">${fallos.map((x) => `<li><a href="${h(x.doc.url)}" target="_blank" rel="noopener noreferrer">${h(x.doc.titulo || x.doc.url)}</a><br><small class="muted">${h(x.error)}</small></li>`).join('')}</ul>`, acciones: [{ t: 'Entendido', cls: 'pri' }] });
        toast(hecho.length ? `Guardado: ${hecho.join(', ')}` : 'No se guardó nada', !hecho.length);
        A.recargar();
      } }],
    });
    const body = m.body, est = body.querySelector('[data-g-estado]'), res = body.querySelector('[data-g-res]');
    body.querySelector('[data-g="buscar"]').onclick = async (ev) => {
      const btn = ev.currentTarget; const v = UI.leer(body);
      const que = v.que; if (!que.length) return toast('Marque qué desea buscar', true);
      const e2 = { ...eq, nombre: v.g_nombre, marca: v.g_marca, modelo: v.g_modelo, registro_sanitario: v.g_rs, hv: { ...(eq.hv || {}), nr: {} } };
      btn.disabled = true; res.innerHTML = ''; est.textContent = 'Buscando en Google y leyendo las fuentes… puede tardar hasta un minuto.';
      try {
        r = await llamar({ accion: 'investigar', equipo: datosEq(e2), que }, () => { est.textContent = 'Google está ocupado; reintentando…'; });
        est.textContent = `Listo · ${r.fuentes?.length || 0} fuentes · ${r.modelo || ''}`;
        pintar(e2, que);
      } catch (er) { est.textContent = ''; toast(er.message, true); } finally { btn.disabled = false; }
    };
    const pintar = (e2, que) => {
      const x = r.datos || {}; const docs = lista(x.documentos).filter((dd) => /^https?:\/\//.test(dd.url || ''));
      x.documentos = docs;
      const card = (k, titulo, cuerpo, on = true) => `<section class="g-card"><header><label class="g-save"><input type="checkbox" data-gs="${k}" ${on ? 'checked' : ''}> Guardar</label><h4>${titulo}</h4></header>${cuerpo}</section>`;
      const txt = (k, md) => `<textarea data-gtxt="${k}" rows="9" class="mono" aria-label="${k}">${h(md)}</textarea>`;
      const rg = x.registro || {};
      res.innerHTML = `<div class="g-head">${x.identificado ? '<span class="pill ok">Modelo identificado</span>' : '<span class="pill warn">Modelo no identificado con certeza</span>'}${r.sin_busqueda ? '<span class="pill bad">Sin búsqueda en Google: la clave de Gemini no permitió buscar; datos de la IA, verifíquelos</span>' : ''}${x.nota ? `<span class="muted">${h(x.nota)}</span>` : ''}</div>
        ${iframeSug(r.sugerencias)}
        ${que.includes('ficha') && x.ficha ? card('ficha', 'Ficha técnica', txt('ficha', mdFicha(e2, r))) : ''}
        ${que.includes('guia') && x.guia ? card('guia', 'Guía rápida de uso', txt('guia', mdGuia(e2, r))) : ''}
        ${que.includes('registro') && x.registro ? card('registro', 'Registro sanitario INVIMA', `<div class="g-rs"><b class="mono">${h(rg.numero || 'No encontrado')}</b> <span class="pill ${/vigente/i.test(rg.estado || '') ? 'ok' : /vencid/i.test(rg.estado || '') ? 'bad' : 'warn'}">${h(rg.estado || 'Sin estado')}</span>${rg.fecha_vencimiento ? ` <span class="muted">vence ${h(fechaOK(rg.fecha_vencimiento) ? UI.fecha(rg.fecha_vencimiento) : rg.fecha_vencimiento)}</span>` : ''}${rg.titular ? `<br><span class="muted">Titular: ${h(rg.titular)}</span>` : ''}${rg.coincide_con_inventario === false ? '<br><span class="pill bad">No coincide con el registro del inventario: revisar</span>' : ''}</div>${txt('registro', mdRegistro(e2, r))}`) : ''}
        ${que.includes('manuales') ? `<section class="g-card"><header><h4>Manuales y documentos encontrados</h4></header>${docs.length ? docs.map((dd, i) => `<div class="g-doc"><input type="checkbox" data-gdoc="${i}" checked aria-label="Descargar ${h(dd.titulo || '')}"><select data-gtipo="${i}" aria-label="Tipo">${Object.keys(SUB).map((t) => `<option ${t === tipoDoc(dd.tipo + ' ' + dd.titulo) ? 'selected' : ''}>${t}</option>`).join('')}</select><a href="${h(dd.url)}" target="_blank" rel="noopener noreferrer" class="nm">${h(dd.titulo || dd.url)}</a><span class="muted">${h(dominio(dd.url))}${dd.idioma ? ' · ' + h(dd.idioma) : ''}</span></div>`).join('') : '<div class="hvd-vacio">No se encontraron manuales descargables. Puede abrir las fuentes y cargarlos a mano.</div>'}<p class="muted" style="margin:6px 0 0;font-size:.82rem">Se descargan como PDF a 7. Manual o ficha técnica. Si un sitio no permite la descarga, se le mostrará el enlace.</p></section>` : ''}
        ${que.includes('mantenimiento') && x.mantenimiento ? card('mantenimiento', 'Protocolo de mantenimiento preventivo (para el reporte FMB-004)', `<div class="g-mto"><div><span class="lbl">Pruebas cualitativas</span><ol>${lista(x.mantenimiento.pruebas).map((p) => `<li>${h(p)}</li>`).join('')}</ol></div><div><span class="lbl">Actividades</span><ol>${lista(x.mantenimiento.actividades).map((p) => `<li>${h(p)}</li>`).join('')}</ol></div></div>${x.mantenimiento.observaciones ? `<p><span class="lbl">Observaciones</span><br>${h(x.mantenimiento.observaciones)}</p>` : ''}<p class="muted" style="font-size:.82rem">${x.mantenimiento.frecuencia ? `Frecuencia sugerida: ${h(x.mantenimiento.frecuencia)} · ` : ''}${x.mantenimiento.metrologia ? `Metrología: ${h(x.mantenimiento.metrologia)}` : ''}</p>`) : ''}
        <label class="checks g-compl"><input type="checkbox" data-gs="completar" checked> <span>Completar con estos datos lo que esté <b>vacío</b> en el inventario y la hoja de vida (fabricante, registro sanitario y vencimiento, riesgo, datos técnicos, recomendaciones). No se reemplaza nada que ya tenga valor.</span></label>
        ${fuentesHTML(r)}`;
    };
  };

  // ------------------------------------------------------------------ todo el inventario
  A.buscarGoogleInventario = async (ent, equipos) => {
    const eqs = equipos.filter((e) => e.estado !== 'Dado de baja');
    const grupos = {}; eqs.forEach((e) => { (grupos[claveGrupo(e)] = grupos[claveGrupo(e)] || []).push(e); });
    const nG = Object.keys(grupos).length; let corriendo = false, parar = false;
    const m = modal({
      titulo: 'Buscar con Google para el inventario', size: 'wide',
      cuerpo: `<div class="form g-form">
        <p class="muted">Equipos en la lista: <b>${eqs.length}</b>. Los equipos con el mismo nombre, marca y modelo comparten una sola búsqueda (<b>${nG} búsquedas</b>). Cada búsqueda tarda entre 20 y 60 segundos: deje esta ventana abierta hasta que termine.</p>
        <div class="g-que">${QUE.map(([k, t, s]) => `<label class="g-chk"><input type="checkbox" name="que" value="${k}" ${k === 'manuales' ? '' : 'checked'}><b>${t}</b><small>${s}</small></label>`).join('')}</div>
        <label class="checks"><input type="checkbox" name="completar" data-single checked> <span>Completar los datos <b>vacíos</b> del inventario y la hoja de vida</span></label>
        <label class="checks"><input type="checkbox" name="omitir" data-single checked> Omitir los equipos que ya fueron buscados con Google</label>
        <div class="actions"><button type="button" class="btn pri" data-g="iniciar">${I.ia} Iniciar</button><button type="button" class="btn" data-g="parar" hidden>Detener</button><span class="muted" data-g-estado></span></div>
        <div class="g-prog" hidden><div class="g-bar"><i></i></div><ol class="g-log"></ol></div></div>`,
      acciones: [{ t: 'Cerrar', fn: async () => { if (corriendo && !(await confirmar('La búsqueda sigue en curso. ¿Detenerla y cerrar?', 'Detener'))) return false; parar = true; } }],
    });
    const b = m.body, est = b.querySelector('[data-g-estado]'), log = b.querySelector('.g-log'), bar = b.querySelector('.g-bar i');
    const linea = (t, cls = '') => { log.insertAdjacentHTML('afterbegin', `<li class="${cls}">${t}</li>`); };
    b.querySelector('[data-g="parar"]').onclick = () => { parar = true; est.textContent = 'Deteniendo al terminar el equipo actual…'; };
    b.querySelector('[data-g="iniciar"]').onclick = async (ev) => {
      const v = UI.leer(b); const que = v.que; if (!que.length) return toast('Marque qué desea buscar', true);
      const lista2 = Object.values(grupos).map((g) => (v.omitir ? g.filter((e) => !e.hv?.busqueda_google) : g)).filter((g) => g.length);
      if (!lista2.length) return toast('Todos los equipos ya fueron buscados. Desmarque “Omitir…” para repetir.', true);
      ev.currentTarget.hidden = true; b.querySelector('[data-g="parar"]').hidden = false; b.querySelector('.g-prog').hidden = false;
      corriendo = true; parar = false; let ok = 0, err = 0, n = 0; const tot = lista2.reduce((a, g) => a + g.length, 0); const cache = {};
      for (const g of lista2) {
        if (parar) break;
        const e0 = g[0]; const nom = `${h(datosEq(e0).nombre)} ${h(datosEq(e0).marca)} ${h(datosEq(e0).modelo)}`.trim();
        est.textContent = `Buscando ${datosEq(e0).nombre}… (${n + 1}-${n + g.length} de ${tot})`;
        try {
          const r = await llamar({ accion: 'investigar', equipo: datosEq(e0), que }, () => { est.textContent = 'Google está ocupado; esperando para reintentar…'; });
          const docs = lista(r.datos.documentos).filter((dd) => /^https?:\/\//.test(dd.url || '')).slice(0, 3);
          for (const e of g) {
            const { hecho, fallos } = await A.guardarBusqueda(e, ent, r, { ficha: que.includes('ficha'), guia: que.includes('guia'), registro: que.includes('registro'), mantenimiento: que.includes('mantenimiento'), completar: !!v.completar, manuales: que.includes('manuales') ? docs : [] }, {}, cache);
            linea(`<b class="mono">${h(e.codigo_inv)}</b> ${nom}: ${h(hecho.join(', ') || 'sin datos')}${fallos.length ? ` <span class="pill warn">${fallos.length} manual(es) sin descarga</span>` : ''}${r.datos.identificado ? '' : ' <span class="pill warn">modelo no identificado</span>'}`, 'ok'); ok++;
          }
        } catch (er) { g.forEach((e) => linea(`<b class="mono">${h(e.codigo_inv)}</b> ${nom}: <span class="bad-t">${h(er.message)}</span>`, 'err')); err += g.length; if (/cuota|sesión|propietario|instalada|GEMINI/i.test(er.message)) { parar = true; } }
        n += g.length; bar.style.width = `${Math.round((n / tot) * 100)}%`;
        if (!parar) await new Promise((r) => setTimeout(r, 4000));
      }
      corriendo = false; b.querySelector('[data-g="parar"]').hidden = true;
      est.textContent = `${parar && n < tot ? 'Detenido' : 'Terminado'}: ${ok} equipos actualizados${err ? ` · ${err} con error` : ''}.`;
      toast(est.textContent, !!err && !ok); A.recargar?.();
    };
  };

  // ------------------------------------------------------------------ reporte de mantenimiento preventivo (FMB-004)
  // Lee manuales, fichas técnicas y guías del equipo + Google y propone pruebas, actividades y observaciones
  A.iaMantenimiento = async (eq, { onEstado } = {}) => {
    const docs = (await S.list('documentos', { equipo_id: eq.id })).filter((d) => ['manual', 'hoja_vida'].includes(d.carpeta) && /\.pdf$/i.test(d.nombre || d.archivo || ''));
    const orden = (d) => (/mantenim|servic/i.test(nrm(d.subcarpeta) + nrm(d.nombre)) ? 0 : /operac|usuario|manual/i.test(nrm(d.subcarpeta) + nrm(d.nombre)) ? 1 : /guia/.test(nrm(d.nombre)) ? 2 : d.carpeta === 'hoja_vida' ? 4 : 3);
    const usar = docs.sort((a, b) => orden(a) - orden(b)).slice(0, 5);
    const partes = [];
    for (const [i, d] of usar.entries()) { onEstado?.(`Leyendo ${d.nombre} (${i + 1} de ${usar.length})…`); partes.push(`### DOCUMENTO: ${d.nombre}\n${await A.textoDocIA(d, Math.floor(50000 / Math.max(usar.length, 1)))}`); }
    const prev = (await S.list('mantenimientos', { equipo_id: eq.id, tipo: 'preventivo' }, '-fecha'))[0];
    const fp = st.fmt.mto_preventivo || {};
    onEstado?.(usar.length ? 'Consultando la IA de Google con los manuales…' : 'Sin manuales cargados: buscando en Google…');
    const r = await llamar({ accion: 'mantenimiento', equipo: datosEq(eq), documentos: partes.join('\n\n'), protocolo: eq.hv?.protocolo_mto || null,
      base: { pruebas: fp.pruebas || [], actividades: fp.actividades || [], herramientas: fp.herramientas || [] }, anterior: prev?.datos?.observaciones || '' }, () => onEstado?.('Google está ocupado; reintentando…'));
    const x = r.datos || {};
    const corta = (s) => String(s).replace(/\s+/g, ' ').trim().slice(0, 70);
    const out = { pruebas: lista(x.pruebas).map(corta).slice(0, 12), actividades: lista(x.actividades).map(corta).slice(0, 12), herramientas: lista(x.herramientas), observaciones: String(x.observaciones || '').trim(), fuentes: r.fuentes || [], docs: usar.map((d) => d.nombre), sugerencias: r.sugerencias };
    // queda como protocolo del equipo para los próximos reportes
    const act = await S.get('equipos', eq.id);
    await S.update('equipos', eq.id, { hv: { ...(act.hv || {}), protocolo_mto: { ...(act.hv?.protocolo_mto || {}), pruebas: out.pruebas, actividades: out.actividades, herramientas: out.herramientas, observaciones: out.observaciones, fecha: UI.hoy(), origen: usar.length ? 'Manuales + Google + IA' : 'Google + IA' } } });
    return out;
  };
})();
