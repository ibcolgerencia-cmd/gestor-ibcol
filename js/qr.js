// =====================================================================
//  CÓDIGOS QR Y DE BARRAS DE LOS EQUIPOS
//  · A.escanear(): lee con la cámara un QR del gestor (abre el equipo) o un
//    código de barras / código de inventario (lo busca en el inventario).
//    También acepta el texto de un lector de código de barras USB (teclado).
//  · Enlace directo: ?eq=<id> abre la hoja del equipo después de ingresar.
//  · A.rotulos(): rótulos en PDF con QR y/o código de barras para pegar en
//    los equipos (logo de la entidad, nombre, código, serie, marca y modelo).
//  Librerías (se cargan solo al usarlas): qrcode-generator, JsBarcode y
//  html5-qrcode.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, toast, modal, leer } = UI;
  const LIB = {
    qr: ['https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js', 'qrcode'],
    barras: ['https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js', 'JsBarcode'],
    lector: ['https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js', 'Html5Qrcode'],
  };
  const cargando = {};
  const lib = (k) => { const [url, g] = LIB[k]; if (window[g]) return Promise.resolve(window[g]);
    return (cargando[k] = cargando[k] || new Promise((ok, no) => { const s = document.createElement('script'); s.src = url; s.async = true; s.onload = () => (window[g] ? ok(window[g]) : no(new Error('No se pudo cargar ' + g))); s.onerror = () => { delete cargando[k]; no(new Error('Sin conexión para cargar el lector / generador de códigos')); }; document.head.appendChild(s); })); };
  A.ICO_QR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>';
  const base = () => `${location.origin}${location.pathname.replace(/index\.html$/, '')}`;
  A.urlEquipo = (id) => `${base()}?eq=${encodeURIComponent(id)}`;
  const nrm = (t) => String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  // ---------------------------------------------------------------- abrir lo leído
  const abrir = async (texto) => {
    const t = String(texto || '').trim(); if (!t) return;
    const m = t.match(/[?&#]eq=([0-9a-f-]{36})/i) || t.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    if (m) { const e = await S.get('equipos', m[1]).catch(() => null); if (e) { A.go('equipo', { id: e.id }); return true; } toast('Ese equipo no existe o no tiene permiso para verlo', true); return false; }
    // QR con los datos del rótulo: se toma la línea «Código inventario»
    const ci = t.match(/C[ÓO]D(?:IGO|\.)?\s*INVENTARIO\s*:\s*([^\n|]+)/i); if (ci) return abrir(ci[1].trim());
    // código de barras = código de inventario (o activo fijo / serie)
    const k = nrm(t); if (k.length < 2) { toast('Código no válido', true); return false; }
    const filtro = A.esProp() ? {} : { entidad_id: st.perfil?.entidad_id };
    const eqs = await S.list('equipos', filtro);
    let hall = eqs.filter((e) => nrm(e.codigo_inv) === k);
    if (!hall.length) hall = eqs.filter((e) => nrm(e.serie) === k || (e.activo_fijo && nrm(e.activo_fijo) === k));
    if (!hall.length) hall = eqs.filter((e) => nrm(e.codigo_inv).includes(k) || (k.length >= 5 && nrm(e.serie).includes(k)));
    if (!hall.length) { toast(`No se encontró ningún equipo con el código «${t}»`, true); return false; }
    if (hall.length === 1) { A.go('equipo', { id: hall[0].id }); return true; }
    const ents = await S.list('entidades', {}, 'razon_social').catch(() => []);
    modal({ titulo: `Varios equipos con «${t}»`, cuerpo: `<div style="display:flex;flex-direction:column;gap:6px">${hall.slice(0, 30).map((e) => `<button class="btn" data-abreq="${e.id}" style="justify-content:flex-start;text-align:left"><b>${h(e.codigo_inv || '')}</b>&nbsp;${h(e.nombre)} ${h(e.marca || '')} · <span class="muted">${h(ents.find((x) => x.id === e.entidad_id)?.razon_social || '')}</span></button>`).join('')}</div>`,
      alAbrir: (mm) => mm.body.querySelectorAll('[data-abreq]').forEach((b) => { b.onclick = () => { mm.cerrar(); A.go('equipo', { id: b.dataset.abreq }); }; }),
      acciones: [{ t: 'Cerrar', cls: 'pri' }] });
    return true;
  };
  A.abrirCodigo = abrir;

  // ---------------------------------------------------------------- escáner con la cámara
  A.escanear = async () => {
    let lector = null, listo = false;
    const parar = async () => { try { if (lector?.isScanning) await lector.stop(); lector?.clear?.(); } catch (e) { /* ya detenido */ } };
    modal({ titulo: 'Escanear código QR o de barras', size: 'wide',
      cuerpo: `<p class="muted" style="font-size:.88rem;margin:0 0 8px">Apunte la cámara al rótulo del equipo. El código QR abre directamente su hoja; el código de barras busca el código de inventario. Con un lector de código de barras USB, haga clic en la casilla de abajo y escanee.</p>
        <div id="qr-lector" style="width:100%;max-width:520px;margin:0 auto;border-radius:10px;overflow:hidden;background:#000;min-height:220px"></div>
        <p class="muted" data-qrest style="text-align:center;font-size:.85rem;margin:6px 0">Iniciando la cámara…</p>
        <form class="form" data-qrman onsubmit="return false"><div class="fields"><div class="field full"><label for="qr_txt">O escriba / escanee el código del equipo</label><input id="qr_txt" name="codigo" autocomplete="off" placeholder="Ej.: RADL-RX-017"></div></div></form>`,
      alAbrir: async (m) => {
        const est = m.body.querySelector('[data-qrest]'), inp = m.body.querySelector('#qr_txt');
        const listo2 = async (txt) => { if (listo) return; listo = true; await parar(); m.cerrar(); const ok = await abrir(txt); if (!ok) listo = false; };
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); listo2(inp.value); } });
        const obs = new MutationObserver(() => { if (!document.body.contains(m.body)) { parar(); obs.disconnect(); } }); obs.observe(document.body, { childList: true, subtree: true });
        try {
          const H = await lib('lector');
          lector = new H('qr-lector', { verbose: false, formatsToSupport: window.Html5QrcodeSupportedFormats ? ['QR_CODE', 'CODE_128', 'CODE_39', 'EAN_13', 'EAN_8', 'UPC_A', 'DATA_MATRIX'].map((k) => Html5QrcodeSupportedFormats[k]).filter((x) => x !== undefined) : undefined });
          await lector.start({ facingMode: 'environment' }, { fps: 10, qrbox: (w, hh) => ({ width: Math.round(Math.min(w, hh) * 0.75), height: Math.round(Math.min(w, hh) * 0.6) }) }, (txt) => listo2(txt), () => {});
          est.textContent = 'Buscando un código…';
        } catch (er) {
          est.innerHTML = `<b>No se pudo abrir la cámara.</b> ${h(/Permission|NotAllowed/i.test(String(er)) ? 'Permita el uso de la cámara en el navegador.' : String(er.message || er))} Puede escribir el código abajo.`;
          setTimeout(() => inp.focus(), 100);
        }
      },
      acciones: [{ t: 'Cerrar', fn: () => { parar(); } }, { t: 'Buscar código', cls: 'pri', fn: async (m) => { const v = leer(m.body.querySelector('[data-qrman]')).codigo; if (!v) { toast('Escriba o escanee un código', true); return false; } await parar(); const ok = await abrir(v); return ok ? undefined : false; } }] });
  };

  // ---------------------------------------------------------------- dibujo de QR y código de barras
  // punto: tamaño del punto de la impresora (mm) para que cada módulo del QR sea un número entero de puntos (rotuladora)
  const dibQR = async (doc, texto, x, y, lado, punto = 0) => {
    const qr = await lib('qr'); const q = qr(0, texto.length > 160 ? 'L' : 'M'); q.addData(utf8(texto)); q.make();
    const n = q.getModuleCount(); let c = lado / n; if (punto && c >= punto) { c = Math.floor(c / punto) * punto; x += (lado - c * n) / 2; y += (lado - c * n) / 2; } doc.setFillColor(0, 0, 0);
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) doc.rect(x + k * c, y + r * c, c + 0.01, c + 0.01, 'F');
  };
  const pngBarras = async (texto) => { const JB = await lib('barras'); const cv = document.createElement('canvas'); JB(cv, texto, { format: 'CODE128', displayValue: false, margin: 12, height: 60, width: 2 }); return { src: cv.toDataURL('image/png'), w: cv.width, h: cv.height }; };
  const fitImg = (doc, src, x, y, mw, mh) => { if (!src) return; try { const p = doc.getImageProperties(src); const r = Math.min(mw / p.width, mh / p.height); doc.addImage(src, /^data:image\/png/i.test(src) ? 'PNG' : 'JPEG', x + (mw - p.width * r) / 2, y + (mh - p.height * r) / 2, p.width * r, p.height * r); } catch (e) { /* sin imagen */ } };
  // ---------------------------------------------------------------- información que lleva el QR (se lee con cualquier celular, sin ingresar)
  const fD = (s) => { if (!s) return ''; const [y, m, d] = String(s).slice(0, 10).split('-'); return y && m && d ? `${d}/${m}/${y}` : String(s); };
  const ultimo = (mtos, eq, tipo, campo) => [eq[campo], ...mtos.filter((m) => m.equipo_id === eq.id && m.tipo === tipo).map((m) => m.fecha || m.datos?.fecha)].filter(Boolean).map((x) => String(x).slice(0, 10)).sort().pop() || '';
  const estado = (prox, hoy) => (!prox ? '' : String(prox).slice(0, 10) >= hoy ? `VIGENTE hasta ${fD(prox)}` : `VENCIDO desde ${fD(prox)}`);
  A.textoQR = ({ ent, eq, cons = [], mtos = [], enlace = false }) => {
    const c = cons.find((x) => x.id === eq.consultorio_id), hoy = new Date().toISOString().slice(0, 10), hv = eq.hv || {};
    const na = (v) => (v && String(v).trim() ? String(v).trim() : 'NR');
    const metNA = !eq.periodicidad_metro || /no aplica/i.test(eq.periodicidad_metro);
    const uMet = ultimo(mtos, eq, 'metrologia', 'fecha_ult_metro'), uMto = ultimo(mtos, eq, 'preventivo', 'fecha_ult_mto');
    const cal = metNA ? 'NO APLICA' : [estado(eq.fecha_prox_metro, hoy) || 'SIN FECHA PROGRAMADA', uMet ? `(última ${fD(uMet)})` : ''].filter(Boolean).join(' ');
    const mto = !eq.periodicidad_mto || /no aplica/i.test(eq.periodicidad_mto) ? 'NO APLICA' : [estado(eq.fecha_prox_mto, hoy) || 'SIN FECHA PROGRAMADA', uMto ? `(último ${fD(uMto)})` : ''].filter(Boolean).join(' ');
    return [
      `INSTITUCIÓN: ${na(ent?.razon_social)}`,
      `SEDE: ${na(c?.sede || 'Sede principal')}`,
      `CONSULTORIO / SERVICIO: ${na(c?.nombre)}`,
      `EQUIPO: ${na(eq.nombre)}`,
      `CÓDIGO INVENTARIO: ${na(eq.codigo_inv)}`,
      `MARCA: ${na(eq.marca)}`,
      `MODELO: ${na(eq.modelo)}`,
      `SERIE: ${na(eq.serie)}`,
      `UBICACIÓN: ${na(eq.ubicacion)}`,
      `CLASIFICACIÓN DE RIESGO: ${eq.clase_riesgo ? 'Clase ' + eq.clase_riesgo : 'NR'}`,
      `REGISTRO SANITARIO: ${na(eq.registro_sanitario)}`,
      `CALIBRACIÓN / VALIDACIÓN${hv.met_tipo ? ' (' + hv.met_tipo + ')' : ''}: ${cal}`,
      `MANTENIMIENTO PREVENTIVO: ${mto}`,
      `Información al ${fD(hoy)} · IBCOL Ingeniería Biomédica`,
      ...(enlace ? [`Ver en el gestor: ${A.urlEquipo(eq.id)}`] : []),
    ].join('\n');
  };
  // texto con tildes en UTF-8 (los lectores de QR lo muestran bien)
  const utf8 = (t) => unescape(encodeURIComponent(t));

  // versión corta del QR (rótulos pequeños y cinta): menos datos = módulos más grandes = se lee mejor
  A.textoQRCorto = ({ ent, eq, cons = [], mtos = [] }) => {
    const t = A.textoQR({ ent, eq, cons, mtos }).split('\n'); const v = (k) => (t.find((l) => l.startsWith(k)) || '').split(': ').slice(1).join(': ');
    return [`${v('INSTITUCIÓN')} · ${v('SEDE')} · ${v('CONSULTORIO')}`, `${v('EQUIPO')} · CÓD. INVENTARIO: ${v('CÓDIGO INVENTARIO')}`, `${v('MARCA')} ${v('MODELO')} · S/N ${v('SERIE')}`, `Ubic.: ${v('UBICACIÓN')} · Riesgo ${String(v('CLASIFICACIÓN DE RIESGO')).replace('Clase ', '')} · RS ${v('REGISTRO SANITARIO')}`,
      `Calib./Valid.: ${t.find((l) => l.startsWith('CALIBRACIÓN'))?.split(': ').slice(1).join(': ') || ''}`, `Mto. prev.: ${v('MANTENIMIENTO PREVENTIVO')}`, (t.find((l) => l.startsWith('Información al')) || '').replace(' · IBCOL Ingeniería Biomédica', '')].join('\n');
  };

  // tamaños: hojas adhesivas (varios rótulos por hoja carta) y cinta Brother PT-P700 (un rótulo por página, del ancho de la cinta)
  //  · PT-P700: cabezal de 128 puntos a 180 ppp; altura imprimible ≈ 18 mm en cinta TZe de 24 mm, ≈ 15 mm en 18 mm y ≈ 9,5 mm en 12 mm
  const TAM = {
    peq: { t: '50 × 25 mm', w: 50, h: 25 }, h5030: { t: '50 × 30 mm', w: 50, h: 30 }, h6040: { t: '60 × 40 mm', w: 60, h: 40 }, med: { t: '70 × 35 mm', w: 70, h: 35 },
    h8050: { t: '80 × 50 mm', w: 80, h: 50 }, gra: { t: '100 × 50 mm (recomendado para el QR con todos los datos)', w: 100, h: 50 }, pers: { t: 'Personalizado (ancho × alto)', w: 70, h: 35, pers: true },
    pt24: { t: 'Brother PT-P700 · cinta TZe 24 mm', cinta: 24, ph: 18, largo: 75 }, pt18: { t: 'Brother PT-P700 · cinta TZe 18 mm', cinta: 18, ph: 15, largo: 65 }, pt12: { t: 'Brother PT-P700 · cinta TZe 12 mm', cinta: 12, ph: 9.5, largo: 55 },
  };
  A.TAM_ROTULO = TAM;

  const textoDe = (e, ent, cons, mtos, datos, corto) => (datos.qrDatos === false ? A.urlEquipo(e.id) : (corto || datos.corto) ? A.textoQRCorto({ ent, eq: e, cons, mtos }) + (datos.enlace ? `\n${A.urlEquipo(e.id)}` : '') : A.textoQR({ ent, eq: e, cons, mtos, enlace: !!datos.enlace }));
  const lineasDe = (e, cons, datos) => [datos.marca !== false ? [e.marca, e.modelo].filter(Boolean).join(' · ') : '', datos.serie !== false && e.serie ? `S/N ${e.serie}` : '', datos.servicio !== false ? (cons.find((c) => c.id === e.consultorio_id)?.nombre || e.ubicacion || '') : ''].filter(Boolean);

  // rótulo de hoja adhesiva (w × h mm) con su esquina en (x, y)
  const rotuloHoja = async (doc, e, x, y, T, { ent, cons, mtos, tipo, datos, logo, borde = true }) => {
    if (borde) { doc.setDrawColor(150); doc.setLineWidth(0.2); doc.setLineDashPattern([1, 1], 0); doc.roundedRect(x, y, T.w, T.h, 1.5, 1.5); doc.setLineDashPattern([], 0); }
    const pad = Math.max(1.5, T.h * 0.07), codigo = e.codigo_inv || e.activo_fijo || e.serie || '';
    const conQR = tipo !== 'barras', conBar = tipo !== 'qr' && !!codigo;
    const barH = conBar ? Math.max(6, T.h * 0.2) : 0; const lq = conQR ? Math.min(T.h - 2 * pad - (conBar ? barH + 1 : 0), T.w * 0.5) : 0;
    if (conQR) await dibQR(doc, textoDe(e, ent, cons, mtos, datos, T.h < 35 || T.w < 60), x + pad, y + pad, lq);
    const tx = x + pad + (conQR ? lq + pad : 0), tw = x + T.w - pad - tx; let ty = y + pad;
    const hLogo = T.h * 0.18; if (datos.logo !== false && logo && T.h >= 30) { fitImg(doc, logo, tx, ty, tw * 0.55, hLogo); ty += hLogo + 0.8; }
    const fs = Math.min(T.h / 35 * 7, T.w / 70 * 8); doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold'); let fN = fs * 1.12; const larga = String(e.nombre || '').toUpperCase().split(/\s+/).sort((p, q) => q.length - p.length)[0] || ''; while (fN > 4.5) { doc.setFontSize(fN); if (doc.getTextWidth(larga) <= tw) break; fN -= 0.25; }
    doc.setFontSize(fN); const nom = doc.splitTextToSize(String(e.nombre || '').toUpperCase(), tw).slice(0, 2); doc.text(nom, tx, ty + fs * 0.38); ty += nom.length * fs * 0.45 + 0.4;
    doc.setFontSize(fs * 1.05); if (codigo) { doc.text(codigo, tx, ty + fs * 0.36); ty += fs * 0.45; }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(fs * 0.82);
    const resto = y + T.h - pad - (conBar ? barH + 1 : 0);
    for (const l of lineasDe(e, cons, datos)) { const ls = doc.splitTextToSize(l, tw).slice(0, 1); if (ty + fs * 0.36 > resto) break; doc.text(ls, tx, ty + fs * 0.33); ty += fs * 0.4; }
    // código de barras a todo el ancho del rótulo (barras más anchas = se lee mejor)
    if (conBar) { try { const b = await pngBarras(codigo); doc.addImage(b.src, 'PNG', x + pad, y + T.h - pad - barH, T.w - 2 * pad, barH); } catch (er) { /* código no válido para barras */ } }
  };

  // rótulo en cinta Brother: página = largo × ancho de la cinta; todo dentro de la franja imprimible centrada
  const rotuloCinta = async (doc, e, L, T, { ent, cons, mtos, tipo, datos }) => {
    const ph = T.ph, y0 = (T.cinta - ph) / 2, m = 2, codigo = e.codigo_inv || e.activo_fijo || e.serie || '';
    const conQR = tipo !== 'barras', conBar = tipo !== 'qr' && !!codigo; let x = m;
    // cinta de 12 mm: el QR solo cabe legible con el código de inventario (el gestor lo abre con «Escanear»)
    if (conQR) { await dibQR(doc, ph < 12 ? (codigo || A.urlEquipo(e.id)) : textoDe(e, ent, cons, mtos, datos, true), x, y0, ph, 25.4 / 180); x += ph + 1.5; }
    const libre = L - m - x, barW = conBar ? (conQR ? libre * 0.5 : libre * 0.55) : 0, tw = libre - (conBar ? barW + 1.5 : 0);
    let fs = Math.min(ph / 18 * 8.5, 9); doc.setTextColor(0, 0, 0); let ty = y0;
    // la palabra más larga del nombre debe caber completa (sin partirla)
    doc.setFont('helvetica', 'bold'); const larga = String(e.nombre || '').toUpperCase().split(/\s+/).sort((p, q) => q.length - p.length)[0] || '';
    while (fs > 4.5) { doc.setFontSize(fs); if (doc.getTextWidth(larga) <= tw) break; fs -= 0.25; }
    doc.setFontSize(fs); const nom = doc.splitTextToSize(String(e.nombre || '').toUpperCase(), tw).slice(0, ph >= 15 ? 2 : 1); doc.text(nom, x, ty + fs * 0.36); ty += nom.length * fs * 0.42;
    if (codigo) { doc.setFontSize(fs * 0.95); doc.text(codigo, x, ty + fs * 0.36); ty += fs * 0.42; }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(fs * 0.75);
    for (const l of lineasDe(e, cons, datos)) { if (ty + fs * 0.3 > y0 + ph) break; doc.text(doc.splitTextToSize(l, tw).slice(0, 1), x, ty + fs * 0.3); ty += fs * 0.34; }
    if (conBar) { try { const b = await pngBarras(codigo); const bx = L - m - barW, bh = ph - (ph >= 12 ? fs * 0.45 : 0); doc.addImage(b.src, 'PNG', bx, y0, barW, bh); if (ph >= 12) { doc.setFont('helvetica', 'normal'); doc.setFontSize(fs * 0.7); doc.text(codigo, bx + barW / 2, y0 + ph - 0.3, { align: 'center' }); } } catch (er) { /* código no válido */ } }
  };

  A.pdfRotulos = async ({ ent, eqs, cons = [], mtos = [], tipo = 'ambos', tam = 'med', datos = {}, ancho = 0, alto = 0, largo = 0 }) => {
    let T = { ...(TAM[tam] || TAM.med) }; if (T.pers) { T.w = Math.max(20, +ancho || T.w); T.h = Math.max(12, +alto || T.h); }
    const logo = ent?.logo || window.IBCOL_LOGO || null;
    if (T.cinta) {
      const L = Math.max(30, +largo || T.largo);
      const doc = new window.jspdf.jsPDF({ unit: 'mm', format: [T.cinta, L], orientation: 'landscape' });
      for (const [i, e] of eqs.entries()) { if (i) doc.addPage([T.cinta, L], 'landscape'); await rotuloCinta(doc, e, L, T, { ent, cons, mtos, tipo, datos }); }
      return doc.output('blob');
    }
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'letter' });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 8, gap = 3;
    const cols = Math.max(1, Math.floor((W - 2 * M + gap) / (T.w + gap))), filas = Math.max(1, Math.floor((H - 2 * M + gap) / (T.h + gap)));
    const ox = (W - (cols * T.w + (cols - 1) * gap)) / 2;
    let i = 0;
    for (const e of eqs) {
      const pos = i % (cols * filas); if (i && pos === 0) doc.addPage();
      await rotuloHoja(doc, e, ox + (pos % cols) * (T.w + gap), M + Math.floor(pos / cols) * (T.h + gap), T, { ent, cons, mtos, tipo, datos, logo });
      i++;
    }
    return doc.output('blob');
  };

  // ---------------------------------------------------------------- generador de rótulos (panel de control / equipo)
  A.rotulos = async ({ entId = null, eqIds = null } = {}) => {
    if (!A.esProp()) return toast('Solo IBCOL genera rótulos', true);
    const ents = await S.list('entidades', {}, 'razon_social');
    let ent = ents.find((e) => e.id === entId) || null, cons = [], eqs = [], mtos = [], sel = new Set(eqIds || []);
    const cargar = async () => { if (!ent) { cons = []; eqs = []; return; } [cons, eqs, mtos] = await Promise.all([S.list('consultorios', { entidad_id: ent.id }), S.list('equipos', { entidad_id: ent.id }), S.list('mantenimientos', { entidad_id: ent.id }).catch(() => [])]); cons = A.ordenar(cons); eqs = eqs.filter((e) => e.estado !== 'Dado de baja'); if (!eqIds) sel = new Set(); };
    await cargar();
    const lista = (b, filtro = '', sede = '') => { const q = nrm(filtro);
      const visibles = cons.filter((c) => !sede || (c.sede || 'Sede principal') === sede).map((c) => [c, eqs.filter((e) => e.consultorio_id === c.id && (!q || nrm(`${e.codigo_inv} ${e.nombre} ${e.serie} ${e.marca}`).includes(q))).sort((x, y) => (x.orden ?? 9999) - (y.orden ?? 9999))]).filter(([, l]) => l.length);
      const sinS = eqs.filter((e) => !cons.some((c) => c.id === e.consultorio_id) && (!q || nrm(`${e.codigo_inv} ${e.nombre}`).includes(q)));
      b.querySelector('[data-rolista]').innerHTML = (visibles.length || sinS.length) ? [...visibles, ...(sinS.length && !sede ? [[{ nombre: 'Sin servicio', id: '_' }, sinS]] : [])].map(([c, l]) => `<div style="margin:6px 0"><label class="chk" style="font-weight:600"><input type="checkbox" data-roserv="${c.id}" ${l.every((e) => sel.has(e.id)) ? 'checked' : ''}> ${h(c.nombre)}${c.sede ? ` <span class="muted">· ${h(c.sede)}</span>` : ''} <span class="muted">(${l.length})</span></label>
        <div style="display:flex;flex-wrap:wrap;gap:2px 14px;padding-left:22px">${l.map((e) => `<label class="chk" style="font-size:.85rem"><input type="checkbox" data-roeq="${e.id}" data-serv="${c.id}" ${sel.has(e.id) ? 'checked' : ''}> <span class="mono">${h(e.codigo_inv || '—')}</span> ${h(e.nombre)}</label>`).join('')}</div></div>`).join('') : '<div class="empty">Elija una entidad con equipos.</div>';
      b.querySelector('[data-ron]').textContent = `${sel.size} equipo${sel.size === 1 ? '' : 's'} elegido${sel.size === 1 ? '' : 's'}`;
    };
    const sedes = () => [...new Set(cons.map((c) => c.sede || 'Sede principal'))];
    modal({ titulo: 'Rótulos con código QR y de barras', size: 'wide',
      cuerpo: `<form class="form" onsubmit="return false"><p class="muted" style="font-size:.85rem;margin:0 0 8px">Genere los rótulos para pegar en los equipos. El <b>código QR</b> lleva los datos del equipo (institución, sede, consultorio, equipo, código, marca, modelo, serie, ubicación, riesgo, registro sanitario, calibración / validación y mantenimiento preventivo vigentes) y se lee con la cámara de cualquier celular; dentro del gestor, «Escanear» abre la hoja del equipo. Los datos quedan con la fecha en que se imprime el rótulo: vuelva a imprimirlo después de cada mantenimiento o calibración. El <b>código de barras</b> lleva el código de inventario y se lee con «Escanear» o con un lector USB.</p>
        <div class="fields">${UI.f.sel('ent', 'Entidad', [['', '— Elegir —'], ...ents.map((e) => [e.id, e.razon_social])], ent?.id || '')}<div class="field" data-rosedebox></div>
        ${UI.f.sel('tipo', 'Tipo de código', [['ambos', 'QR + código de barras'], ['qr', 'Solo QR'], ['barras', 'Solo código de barras']], 'ambos')}<div class="field"><label for="ro_tam">Tamaño del rótulo</label><select id="ro_tam" name="tam"><optgroup label="Hoja adhesiva (carta)">${Object.entries(TAM).filter(([, v]) => !v.cinta).map(([k, v]) => `<option value="${k}" ${k === 'gra' ? 'selected' : ''}>${h(v.t)}</option>`).join('')}</optgroup><optgroup label="Rotuladora Brother PT-P700">${Object.entries(TAM).filter(([, v]) => v.cinta).map(([k, v]) => `<option value="${k}">${h(v.t)}</option>`).join('')}</optgroup></select></div>
        <div class="field" data-ropers hidden><label>Ancho × alto (mm)</label><div style="display:flex;gap:6px"><input name="ancho" type="number" min="20" max="200" value="70" aria-label="Ancho en mm"><input name="alto" type="number" min="12" max="150" value="35" aria-label="Alto en mm"></div></div>
        <div class="field" data-rolargo hidden><label for="ro_largo">Largo de cada rótulo en la cinta (mm)</label><input id="ro_largo" name="largo" type="number" min="30" max="200" value="75"></div>
        <p class="muted full" data-roayuda hidden style="font-size:.8rem;margin:0">Para la <b>Brother PT-P700</b>: abra el PDF, elija la impresora Brother PT-P700, en <i>Propiedades</i> ponga el ancho de cinta elegido y el largo indicado (cada página es un rótulo), escala <b>100 % / tamaño real</b> y margen mínimo. El QR lleva la versión corta de los datos (en cinta de 12 mm solo el código de inventario, que «Escanear» abre en el gestor) para que se lea en la cinta. También puede abrir el PDF en P-touch Editor (Archivo › Importar imagen).</p>
        ${UI.f.sel('qrc', 'Contenido del código QR', [['datos', 'Datos del equipo (se leen con cualquier celular)'], ['corto', 'Datos resumidos (QR más pequeño, para rótulos chicos)'], ['datos_enlace', 'Datos del equipo + enlace al gestor'], ['enlace', 'Solo enlace al gestor (pide usuario y contraseña)']], 'datos')}
        <div class="field full" style="display:flex;flex-wrap:wrap;gap:4px 16px"><label class="chk"><input type="checkbox" name="d_logo" checked> Logo de la entidad</label><label class="chk"><input type="checkbox" name="d_marca" checked> Marca y modelo</label><label class="chk"><input type="checkbox" name="d_serie" checked> Serie</label><label class="chk"><input type="checkbox" name="d_servicio" checked> Servicio</label></div>
        <div class="field full"><label for="ro_q">Buscar equipo</label><input id="ro_q" data-roq placeholder="Código, nombre, serie o marca"></div></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:4px 0"><button type="button" class="btn sm" data-rotodos>Marcar todos</button><button type="button" class="btn sm" data-ronada>Quitar todos</button><span class="muted" data-ron></span></div>
        <div data-rolista style="max-height:44vh;overflow:auto;border:1px solid var(--line,#ddd);border-radius:8px;padding:6px 10px"></div></form>`,
      alAbrir: (m) => {
        const b = m.body, q = () => b.querySelector('[data-roq]').value, sd = () => b.querySelector('[name=sede]')?.value || '';
        const pintaSede = () => { const s = sedes(); b.querySelector('[data-rosedebox]').innerHTML = s.length > 1 ? `<label for="ro_sede">Sede</label><select id="ro_sede" name="sede"><option value="">Todas</option>${s.map((x) => `<option>${h(x)}</option>`).join('')}</select>` : ''; const se = b.querySelector('[name=sede]'); if (se) se.onchange = () => lista(b, q(), sd()); };
        pintaSede(); lista(b);
        const tamSel = b.querySelector('[name=tam]'), tamCambio = () => { const T = TAM[tamSel.value] || {}; b.querySelector('[data-ropers]').hidden = !T.pers; b.querySelector('[data-rolargo]').hidden = !T.cinta; b.querySelector('[data-roayuda]').hidden = !T.cinta; if (T.cinta) b.querySelector('[name=largo]').value = T.largo; };
        tamSel.onchange = tamCambio; tamCambio();
        b.querySelector('[name=ent]').onchange = async (e) => { ent = ents.find((x) => x.id === e.target.value) || null; await cargar(); pintaSede(); lista(b, q()); };
        b.querySelector('[data-roq]').oninput = () => lista(b, q(), sd());
        b.querySelector('[data-rotodos]').onclick = () => { b.querySelectorAll('[data-roeq]').forEach((x) => sel.add(x.dataset.roeq)); lista(b, q(), sd()); };
        b.querySelector('[data-ronada]').onclick = () => { sel.clear(); lista(b, q(), sd()); };
        b.querySelector('[data-rolista]').addEventListener('change', (e) => { const t = e.target;
          if (t.dataset.roeq) { if (t.checked) sel.add(t.dataset.roeq); else sel.delete(t.dataset.roeq); }
          if (t.dataset.roserv) b.querySelectorAll(`[data-serv="${t.dataset.roserv}"]`).forEach((x) => { if (t.checked) sel.add(x.dataset.roeq); else sel.delete(x.dataset.roeq); });
          lista(b, q(), sd()); });
      },
      acciones: [{ t: 'Cerrar' }, { t: 'Generar PDF de rótulos', cls: 'pri', fn: async (m) => {
        const v = leer(m.body); if (!ent) { toast('Elija la entidad', true); return false; }
        const elegidos = eqs.filter((e) => sel.has(e.id)).sort((x, y) => { const cx = cons.findIndex((c) => c.id === x.consultorio_id), cy = cons.findIndex((c) => c.id === y.consultorio_id); return cx - cy || (x.orden ?? 9999) - (y.orden ?? 9999); });
        if (!elegidos.length) { toast('Marque al menos un equipo', true); return false; }
        toast('Generando rótulos…');
        try {
          const blob = await A.pdfRotulos({ ent, eqs: elegidos, cons, mtos, tipo: v.tipo, tam: v.tam, ancho: v.ancho, alto: v.alto, largo: v.largo, datos: { qrDatos: v.qrc !== 'enlace', corto: v.qrc === 'corto', enlace: v.qrc === 'datos_enlace', logo: !!v.d_logo, marca: !!v.d_marca, serie: !!v.d_serie, servicio: !!v.d_servicio } });
          S.log('DESCARGA', 'equipos', ent.id, `Rótulos QR / código de barras (${elegidos.length})`);
          UI.verPDF({ titulo: `Rótulos · ${ent.razon_social} (${elegidos.length})`, blob, nombre: `Rotulos equipos ${ent.razon_social}.pdf`.replace(/[\\/:*?"<>|]/g, '-') });
        } catch (er) { toast(er.message, true); return false; }
        return false;
      } }] });
  };

  // ---------------------------------------------------------------- enlace directo ?eq=<id> (al ingresar)
  A.abrirEnlaceEquipo = async () => {
    let id = null; try { id = new URLSearchParams(location.search).get('eq'); } catch (e) { /* sin parámetros */ }
    if (!id) return false;
    try { const u = new URL(location.href); u.searchParams.delete('eq'); history.replaceState(history.state, '', u.pathname + (u.search || '') + u.hash); } catch (e) { /* no se pudo limpiar */ }
    const e = await S.get('equipos', id).catch(() => null);
    if (!e) { toast('El equipo del código QR no existe o su usuario no tiene permiso para verlo', true); return false; }
    A.go('equipo', { id: e.id }); return true;
  };
})();
