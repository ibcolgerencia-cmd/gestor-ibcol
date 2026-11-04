// =====================================================================
//  Inventario → servicios → equipos
//  - Lee el inventario (FMB-001 en PDF o Excel) y crea los servicios y sus equipos.
//  - Reubica documentos de cada equipo usando los códigos que aparecen en los nombres.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, leer, f } = UI;
  const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  const comp = (t) => norm(t).replace(/[^A-Z0-9]/g, '');
  const riesgoDe = (t) => { const x = norm(t).replace(/\s|CLASE/g, ''); return { I: 'I', IIA: 'IIa', IIB: 'IIb', III: 'III' }[x] || null; };
  const titulo = (t) => String(t || '').toUpperCase().replace(/\s+/g, ' ').trim();

  // Columnas del formato FMB-001 (y variantes)
  const COLS = [
    ['item', /^ITEM|^N[°O]\.?$/], ['codigo', /COD.*INV|CODIGO/], ['af', /A\.?\s?F\b|ACTIVO/], ['nombre', /^EQUIPO|NOMBRE|DISPOSITIVO/],
    ['marca', /MARCA/], ['modelo', /MODELO/], ['serie', /SERIE/], ['servicio', /UBICACION|AREA|SERVICIO/],
    ['riesgo', /RIESGO|CLASIFICACION/], ['rs', /REGISTRO|INVIMA|PERMISO/],
  ];
  const colDe = (txt) => { const t = norm(txt); if (t.includes(':')) return null; for (const [k, re] of COLS) if (re.test(t)) return k; return null; };

  // ---------------------------------------------------------------- lectura de Excel / CSV
  async function leerExcel(file) {
    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
    for (const nombre of wb.SheetNames) {
      const filas = XLSX.utils.sheet_to_json(wb.Sheets[nombre], { header: 1, defval: '' });
      const out = []; let mapa = null, servSec = '';
      for (const r of filas) {
        const ban = r.map((c) => String(c)).find((c) => /^SERVICIO\s*\/\s*\S/.test(norm(c)));
        if (ban) { servSec = norm(ban).replace(/^SERVICIO\s*\/\s*(AREA\s*:?)?\s*/, '').replace(/^:\s*/, '').trim(); continue; }
        if (r.some((c) => /^EQUIPO$/.test(norm(c))) && r.some((c) => /SERIE|MARCA/.test(norm(c)))) { mapa = {}; r.forEach((c, i) => { const k = colDe(c); if (k && !(k in mapa)) mapa[k] = i; }); continue; }
        if (!mapa) continue;
        const o = {}; Object.entries(mapa).forEach(([k, i]) => { o[k] = String(r[i] ?? '').trim(); });
        if (!o.nombre || /ELABORADO|IBCOL|PRESTADOR/i.test(o.nombre)) continue;
        if (servSec) { o.ubicacion = o.servicio || ''; o.servicio = servSec; }
        out.push(o);
      }
      if (out.length) return out;
    }
    throw new Error('No encontré la tabla del inventario (columnas EQUIPO, MARCA, SERIE…) en el Excel');
  }

  // ---------------------------------------------------------------- lectura de PDF (FMB-001 generado desde Excel)
  async function leerPDF(file) {
    if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const out = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const items = (await (await pdf.getPage(p)).getTextContent()).items.filter((it) => it.str.trim())
        .map((it) => ({ x: it.transform[4], y: it.transform[5], w: it.width || 0, t: it.str.trim() }));
      // Cada sección del inventario tiene su fila de títulos (el texto "EQUIPO" exacto) y puede tener
      // encima un título "SERVICIO / ÁREA: …". Una página puede tener varias secciones.
      const titulos = items.filter((it) => norm(it.t) === 'EQUIPO').sort((a, b) => b.y - a.y);
      titulos.forEach((hEq, s) => {
        const sig = titulos[s + 1];
        const cab = items.filter((it) => Math.abs(it.y - hEq.y) < 14 && colDe(it.t)).map((it) => ({ k: colDe(it.t), c: it.x + it.w / 2 }));
        const vistos = new Set(); const heads = cab.filter((c) => (vistos.has(c.k) ? false : vistos.add(c.k))).sort((a, b) => a.c - b.c);
        if (heads.length < 4) return;
        const banner = items.find((it) => /SERVICIO\s*\/\s*AREA\s*:/.test(norm(it.t)) && it.y > hEq.y && it.y < hEq.y + 45);
        const servSec = banner ? banner.t.split(':').slice(1).join(':').trim() : '';
        const xItem = Math.min(...heads.map((c) => c.c)) - 5;
        const piso = sig ? sig.y + 28 : -Infinity;
        const debajo = items.filter((it) => it.y < hEq.y - 4 && it.y > piso);
        // filas: empiezan con el número de ítem en el borde izquierdo
        const filas = debajo.filter((it) => /^\d{1,3}$/.test(it.t) && it.x < xItem + 25).map((it) => ({ y: it.y, celdas: {} }));
        if (!filas.length) return;
        const yFin = Math.min(...filas.map((f) => f.y)) - 14, yIni = Math.max(...filas.map((f) => f.y)) + 6;
        debajo.filter((it) => it.y > yFin && it.y < yIni && !/IBCOL|E-MAIL|DIRECCI|PRESTADOR|SERVICIO\s*\/|ACTUALIZACI/i.test(it.t)).forEach((it) => {
          const fila = filas.reduce((a, b) => (Math.abs(b.y - it.y) < Math.abs(a.y - it.y) ? b : a));
          const cx = it.x + it.w / 2;
          const col = heads.reduce((a, b) => (Math.abs(b.c - cx) < Math.abs(a.c - cx) ? b : a)).k;
          (fila.celdas[col] = fila.celdas[col] || []).push(it);
        });
        filas.forEach((f) => {
          const o = {}; Object.entries(f.celdas).forEach(([k, l]) => { o[k] = l.sort((a, b) => b.y - a.y || a.x - b.x).map((x) => x.t).join(' ').trim(); });
          if (servSec) { o.ubicacion = o.servicio || ''; o.servicio = servSec; }
          if (o.nombre) out.push(o);
        });
      });
    }
    if (!out.length) throw new Error('No pude leer la tabla del PDF. Pruebe con la versión en Excel del inventario.');
    return out;
  }

  A.parsearInventario = async (file) => (/\.pdf$/i.test(file.name) ? leerPDF(file) : leerExcel(file));

  // ---------------------------------------------------------------- aplicar inventario a la entidad
  // opts.sede: el inventario es de UNA sede (sus servicios se crean y ordenan solo dentro de esa sede)
  A.aplicarInventario = async (ent, filas, prog = () => {}, opts = {}) => {
    const [consTodos, eqsTodos] = await Promise.all([S.list('consultorios', { entidad_id: ent.id }), S.list('equipos', { entidad_id: ent.id })]);
    const sede = opts.sede || null;
    const deSede = (c) => !sede || norm(c.sede || 'Sede principal') === norm(sede);
    const cons = consTodos.filter(deSede);
    const idsSede = new Set(cons.map((c) => c.id));
    // con sede: solo se comparan los equipos de esa sede (y los que aún no tienen servicio)
    const eqs = sede ? eqsTodos.filter((e) => idsSede.has(e.consultorio_id) || !e.consultorio_id) : eqsTodos;
    let nS = 0, nE = 0, nA = 0, orden = cons.length;
    const servicio = async (nombre) => {
      const n = titulo(nombre || 'SIN SERVICIO');
      let c = cons.find((x) => norm(x.nombre) === norm(n));
      if (!c) { c = await S.insert('consultorios', { entidad_id: ent.id, nombre: n, orden: ++orden, sede: sede || 'Sede principal' }); cons.push(c); idsSede.add(c.id); nS++; }
      return c;
    };
    const vistos = new Set();
    for (const [i, r] of filas.entries()) {
      prog(`Equipo ${i + 1} de ${filas.length}`);
      const c = await servicio(r.servicio);
      const datos = { nombre: titulo(r.nombre), consultorio_id: c.id, ubicacion: titulo(r.ubicacion || r.servicio) || null, marca: r.marca || null, modelo: r.modelo || null, serie: r.serie && !/^N\/?R$/i.test(r.serie) ? r.serie : null,
        activo_fijo: r.af || null, clase_riesgo: riesgoDe(r.riesgo), registro_sanitario: r.rs || null, orden: Number(r.item) || i + 1 };
      let e = r.codigo ? eqs.find((x) => !vistos.has(x.id) && comp(x.codigo_inv) === comp(r.codigo)) : null;
      if (!e && comp(r.codigo).length >= 5) e = eqs.find((x) => !vistos.has(x.id) && comp(x.codigo_inv).includes(comp(r.codigo)));
      if (!e) e = eqs.find((x) => !vistos.has(x.id) && comp(x.nombre) === comp(datos.nombre) && (!x.serie || comp(x.serie) === comp(datos.serie)) && !A.esCarpetaDoc(x.nombre));
      if (e) { const nuevo = await S.update('equipos', e.id, { ...datos, codigo_inv: r.codigo || e.codigo_inv }); Object.assign(e, nuevo); nA++; }
      else {
        let cod = r.codigo || `${comp(datos.nombre).slice(0, 3)}-${String(i + 1).padStart(3, '0')}`;
        while (eqsTodos.some((x) => comp(x.codigo_inv) === comp(cod))) cod += '-B';
        e = await S.insert('equipos', { ...datos, entidad_id: ent.id, codigo_inv: cod, estado: 'Activo', periodicidad_mto: 'Semestral', periodicidad_metro: 'No aplica', hv: {} });
        eqs.push(e); eqsTodos.push(e); nE++;
      }
      vistos.add(e.id);
    }
    // servicios que quedaron vacíos y no están en el inventario (p. ej. de una lectura anterior equivocada)
    const enInv = new Set(filas.map((r) => norm(titulo(r.servicio || 'SIN SERVICIO'))));
    const eqsAhora = await S.list('equipos', { entidad_id: ent.id });
    for (const c of cons) {
      if (!enInv.has(norm(c.nombre)) && !eqsAhora.some((x) => x.consultorio_id === c.id)) { await S.remove('consultorios', c.id); nS--; }
    }
    // renumerar los servicios en el orden del inventario
    const ordenInv = [...enInv];
    const consAhora = (await S.list('consultorios', { entidad_id: ent.id })).filter(deSede);
    for (const c of consAhora) { const i = ordenInv.indexOf(norm(c.nombre)); if (i >= 0 && c.orden !== i + 1) await S.update('consultorios', c.id, { orden: i + 1 }); }
    return { nS: Math.max(0, nS), nE, nA };
  };

  // ¿El nombre corresponde a una carpeta de documentos de un equipo (hoja de vida, mantenimientos…)?
  A.esCarpetaDoc = (nombre) => /HOJA.*VIDA|MANTENIMIENTO|MTTO|METROLOG|REGISTRO SANITARIO|MANUAL|FICHA TEC|FACTURA|IMPORTACION|CERTIFICADO|ACTA/.test(norm(nombre));
  A.carpetaDeDoc = (carpetaNombre, archivo) => {
    const t = norm(carpetaNombre), f = norm(archivo);
    if (/HOJA.*VIDA/.test(t)) return 'hoja_vida';
    if (/MANTENIMIENTO|MTTO/.test(t)) return /CORRECTIV/.test(f) ? 'mto_correctivo' : 'mto_preventivo';
    if (/METROLOG|CALIBRA/.test(t)) return 'metrologia';
    if (/REGISTRO SANITARIO|INVIMA/.test(t)) return 'registro_sanitario';
    if (/FACTURA/.test(t)) return 'factura';
    if (/MANUAL|FICHA/.test(t)) return 'manual';
    if (/IMPORTACION|CONFORMIDAD/.test(t)) return 'importacion';
    if (/BAJA/.test(t)) return 'acta_baja';
    if (/ENTREGA/.test(t)) return 'acta_entrega';
    return null;
  };

  // Busca el equipo del inventario al que pertenece un documento por el código en su nombre
  // (ej. "ODFM-AUT-009", "PRT-005", "A.F. 003")
  A.equipoPorCodigo = (nombreArchivo, candidatos) => {
    const f = ' ' + norm(nombreArchivo).replace(/[_]/g, ' ') + ' ';
    const fc = comp(nombreArchivo);
    for (const e of candidatos) {
      const c = comp(e.codigo_inv); if (c.length >= 5 && fc.includes(c)) return e;
    }
    for (const e of candidatos) {
      const m = norm(e.codigo_inv).match(/([A-Z]{2,5})[\s-]*0*(\d{1,4})$/); if (!m) continue;
      const re = new RegExp(`[^A-Z]${m[1]}[\\s.-]*0*${m[2]}(?!\\d)`); if (re.test(f)) return e;
    }
    if (candidatos.length > 1) {
      for (const campo of ['serie', 'modelo']) {
        const hit = candidatos.filter((e) => comp(e[campo]).length >= 4 && fc.includes(comp(e[campo])));
        if (hit.length === 1) return hit[0];
      }
    }
    const af = f.match(/A\.?\s?F\.?\s*0*(\d{1,4})(?!\d)/);
    if (af) { const e = candidatos.find((x) => x.activo_fijo && Number(String(x.activo_fijo).replace(/\D/g, '')) === Number(af[1])); if (e) return e; }
    return null;
  };

  // Elige el equipo del inventario que corresponde a una carpeta con nombre de equipo
  A.equipoPorCarpeta = (nombreCarpeta, archivos, eqs) => {
    const n = comp(A.sinNum(nombreCarpeta));
    let cand = eqs.filter((e) => comp(e.nombre) === n);
    if (!cand.length) cand = eqs.filter((e) => n.length > 4 && (comp(e.nombre).includes(n) || n.includes(comp(e.nombre))));
    const votos = new Map();
    archivos.forEach((a) => { const e = A.equipoPorCodigo(a, eqs); if (e) votos.set(e.id, (votos.get(e.id) || 0) + 1); });
    if (!cand.length && !votos.size) archivos.forEach((a) => { const fa = comp(a); eqs.forEach((e) => { if (comp(e.nombre).length > 5 && fa.includes(comp(e.nombre))) votos.set(e.id, (votos.get(e.id) || 0) + 1); }); });
    if (!cand.length && votos.size) { const id = [...votos.entries()].sort((a, b) => b[1] - a[1])[0][0]; cand = eqs.filter((e) => e.id === id); }
    if (!cand.length) cand = eqs.filter((e) => comp(e.ubicacion) === n);
    return cand;
  };

  // ---------------------------------------------------------------- reparar importación anterior (equipos tomados como servicios)
  A.repararEstructura = async (ent, prog = () => {}) => {
    const [cons, eqsTodos, docsTodos] = await Promise.all([S.list('consultorios', { entidad_id: ent.id }), S.list('equipos', { entidad_id: ent.id }), S.list('documentos', { entidad_id: ent.id })]);
    const reales = eqsTodos.filter((e) => !A.esCarpetaDoc(e.nombre));
    let movidos = 0, borrados = 0;
    // 0) un mismo servicio repetido (ej. 6 veces "UNIDAD ODONTOLÓGICA") → uno solo con todos sus equipos
    const grupos = new Map();
    A.ordenar(cons).forEach((c) => { const k = norm(c.sede || 'Sede principal') + '|' + norm(c.nombre); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(c); });
    const ordenSede = new Map();
    for (const lista of grupos.values()) {
      const [queda, ...sobran] = lista; const ks = norm(queda.sede || 'Sede principal'); const ordenSrv = (ordenSede.get(ks) || 0) + 1; ordenSede.set(ks, ordenSrv);
      if (queda.orden !== ordenSrv) await S.update('consultorios', queda.id, { orden: ordenSrv });
      for (const c of sobran) {
        for (const e of eqsTodos.filter((x) => x.consultorio_id === c.id)) { await S.update('equipos', e.id, { consultorio_id: queda.id }); e.consultorio_id = queda.id; }
        await S.remove('consultorios', c.id); cons.splice(cons.indexOf(c), 1); movidos++;
        prog('Agrupando equipos por servicio…');
      }
    }
    // 1) servicios cuyo contenido son carpetas de documentos: en realidad son un equipo
    for (const c of cons) {
      const todos = eqsTodos.filter((e) => e.consultorio_id === c.id);
      const hijos = todos.filter((e) => A.esCarpetaDoc(e.nombre));
      if (!hijos.length) continue;
      const docs = docsTodos.filter((d) => hijos.some((e) => e.id === d.equipo_id));
      const cand = A.equipoPorCarpeta(c.nombre, docs.map((d) => d.nombre), reales);
      let destino = cand[0];
      if (!destino) {
        destino = await S.insert('equipos', { entidad_id: ent.id, consultorio_id: null, nombre: norm(c.nombre), codigo_inv: `${comp(c.nombre).slice(0, 3)}-${Date.now() % 1000}`, estado: 'Activo', periodicidad_mto: 'Semestral', periodicidad_metro: 'No aplica', hv: {} });
        reales.push(destino);
      }
      for (const d of docs) {
        const hijo = hijos.find((e) => e.id === d.equipo_id);
        const eq = (cand.length > 1 && A.equipoPorCodigo(d.nombre, cand)) || destino;
        const carpeta = A.carpetaDeDoc(hijo.nombre, d.nombre) || d.carpeta;
        await S.update('documentos', d.id, { equipo_id: eq.id, carpeta }); movidos++;
        prog(`Reubicando documentos… ${movidos}`);
      }
      // borrar las carpetas-equipo solo si ya no les queda ningún documento
      for (const e of hijos) { const quedan = await S.list('documentos', { equipo_id: e.id }); if (!quedan.length) { await S.remove('equipos', e.id); borrados++; } }
      if (todos.length === hijos.length && !(await S.list('equipos', { consultorio_id: c.id })).length) await S.remove('consultorios', c.id);
    }
    // 2) claves antiguas de carpeta
    const docs2 = await S.list('documentos', { entidad_id: ent.id });
    for (const d of docs2.filter((x) => x.carpeta === 'mantenimientos')) {
      await S.update('documentos', d.id, { carpeta: /CORRECTIV/.test(norm(d.nombre)) ? 'mto_correctivo' : 'mto_preventivo' }); movidos++;
    }
    for (const d of docs2.filter((x) => x.carpeta === 'actas_eq' || x.carpeta === 'actas')) {
      await S.update('documentos', d.id, { carpeta: /BAJA/.test(norm(d.nombre + ' ' + (d.subcarpeta || ''))) ? 'acta_baja' : 'acta_entrega' }); movidos++;
    }
    // 3) cronogramas sueltos → su subcarpeta según el nombre
    for (const d of docs2.filter((x) => x.carpeta === 'cronogramas' && !CAT.SUBS_CRONO.some((sc) => (x.subcarpeta || '').startsWith(sc)))) {
      const n = norm(d.nombre); const sub = /METROLOG|CALIBRA/.test(n) ? CAT.SUBS_CRONO[1] : /CAPACITA/.test(n) ? CAT.SUBS_CRONO[2] : /MANTENIM|MTTO/.test(n) ? CAT.SUBS_CRONO[0] : null;
      if (sub) { await S.update('documentos', d.id, { subcarpeta: sub }); movidos++; }
    }
    return { movidos, borrados };
  };

  // Logo de la entidad: la imagen que el inventario (FMB-001) trae en el recuadro superior izquierdo
  A.logoDeInventario = async (file) => {
    if (!/\.pdf$/i.test(file.name || '')) return null;
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const page = await pdf.getPage(1); const base = page.getViewport({ scale: 1 });
    const ops = await page.getOperatorList(); const O = pdfjsLib.OPS;
    const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
    let ctm = [1, 0, 0, 1, 0, 0]; const pila = []; const imgs = [];
    ops.fnArray.forEach((fn, i) => {
      const a = ops.argsArray[i];
      if (fn === O.save) pila.push(ctm.slice()); else if (fn === O.restore) ctm = pila.pop() || ctm; else if (fn === O.transform) ctm = mul(ctm, a);
      else if (fn === O.paintImageXObject || fn === O.paintJpegXObject) imgs.push({ x: ctm[4], y: ctm[5], w: Math.hypot(ctm[0], ctm[1]), h: Math.hypot(ctm[2], ctm[3]) });
    });
    const img = imgs.filter((i) => i.y > base.height * 0.6 && i.x < base.width * 0.4 && i.w > 30).sort((a, b) => b.w * b.h - a.w * a.h)[0];
    if (!img) return null;
    const esc = 5, vp = page.getViewport({ scale: esc });
    const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
    await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    const k = Math.min(esc, 600 / img.w), o = document.createElement('canvas'); o.width = Math.round(img.w * k); o.height = Math.round(img.h * k);
    const g = o.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, o.width, o.height);
    g.drawImage(cv, img.x * esc + 1, (base.height - img.y - img.h) * esc + 1, img.w * esc - 2, img.h * esc - 2, 0, 0, o.width, o.height);
    return o.toDataURL('image/png');
  };

  // ---------------------------------------------------------------- ventana "Cargar inventario"
  A.cargarInventario = (ent, archivoPrevio = null) => {
    const procesar = async (file, blobGuardado) => {
      let filas;
      try { filas = await A.parsearInventario(file); } catch (e) { return toast(e.message, true); }
      const servicios = [...new Set(filas.map((r) => titulo(r.servicio) || 'SIN SERVICIO'))];
      const eqs = await S.list('equipos', { entidad_id: ent.id });
      const malos = eqs.filter((e) => A.esCarpetaDoc(e.nombre)).length;
      modal({
        titulo: `Inventario de ${ent.razon_social}`, size: 'wide',
        cuerpo: `<div class="form"><p>Leí <b>${filas.length} equipos</b> en <b>${servicios.length} servicios</b> de “${h(file.name)}”. Revise antes de aplicar:</p>
          <div class="tbl-wrap" style="max-height:340px"><table class="tbl"><thead><tr><th>Ítem</th><th>Código</th><th>Equipo</th><th>Marca</th><th>Modelo</th><th>Serie</th><th>Servicio / área</th><th>Riesgo</th><th>Registro sanitario</th></tr></thead><tbody>
          ${filas.map((r) => `<tr><td class="num">${h(r.item || '')}</td><td class="mono">${h(r.codigo || '')}</td><td><b>${h(r.nombre)}</b></td><td>${h(r.marca || '')}</td><td>${h(r.modelo || '')}</td><td class="mono">${h(r.serie || '')}</td><td>${h(r.servicio || '')}</td><td>${h(riesgoDe(r.riesgo) || r.riesgo || '')}</td><td class="mono">${h(r.rs || '')}</td></tr>`).join('')}
          </tbody></table></div>
          <p class="muted">Al aplicar: se crean los servicios (${servicios.map(h).join(', ')}) y dentro de cada uno sus equipos con sus datos. Los equipos que ya existen se actualizan, no se duplican.${malos ? ` También se reubicarán los documentos que quedaron mal clasificados en la importación anterior (${malos} carpetas de documentos que se habían creado como equipos).` : ''}</p>
          <div class="muted" data-prog></div></div>`,
        acciones: [{ t: 'Cancelar' }, { t: 'Aplicar inventario', cls: 'pri', fn: async (m) => {
          const pr = m.body.querySelector('[data-prog]'); const p = (t) => { pr.textContent = t; };
          const r1 = await A.aplicarInventario(ent, filas, p);
          if (!ent.logo) { try { const logo = await A.logoDeInventario(file); if (logo) { await S.update('entidades', ent.id, { logo }); ent.logo = logo; } } catch (e) { console.warn('logo', e); } }
          let r2 = { movidos: 0, borrados: 0 };
          r2 = await A.repararEstructura(ent, p);
          if (blobGuardado === null && !archivoPrevio) {
            const path = `${ent.id}/general/inventarios/${Date.now()}-${file.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_')}`;
            await S.upload(path, file);
            await S.insert('documentos', { entidad_id: ent.id, equipo_id: null, carpeta: 'inventarios', nombre: file.name, archivo: path, mime: file.type, tamano: file.size, fecha_documento: UI.hoy(), visible_cliente: true });
          }
          toast(`${r1.nS} servicios y ${r1.nE} equipos creados, ${r1.nA} actualizados${r2.movidos ? ` · ${r2.movidos} documentos reubicados` : ''}`);
          A.go('areas', { id: ent.id });
          setTimeout(() => A.revisarDocumentos(ent, { auto: true }), 600);
        } }],
      });
    };
    if (archivoPrevio) return procesar(archivoPrevio, 'ya');
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.pdf,.xlsx,.xls,.csv';
    inp.onchange = () => { const fl = inp.files[0]; if (fl) procesar(fl, null); };
    inp.click();
  };

  // ---------------------------------------------------------------- programación marcada en un cronograma Excel (FMB-002)
  // Devuelve { anio, filas: [{ codigo, nombre, serie, plan: { 'mes-semana': 'P'|'E'|'N' } }] }
  const MESES_N = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const mesDeTxt = (t) => { const x = norm(t).replace(/[^A-Z]/g, ''); if (x.length < 3 || x.length > 10) return 0; const i = MESES_N.findIndex((m) => (x.length <= 4 ? m.startsWith(x) : m === x || (x === 'SETIEMBRE' && m === 'SEPTIEMBRE'))); return i + 1; };
  const tipoColor = (c) => {
    const rgb = String(c?.rgb || '').slice(-6); if (!/^[0-9A-F]{6}$/i.test(rgb)) return '';
    const r = parseInt(rgb.slice(0, 2), 16), g = parseInt(rgb.slice(2, 4), 16), b = parseInt(rgb.slice(4, 6), 16);
    if (r > 235 && g > 235 && b > 235) return ''; // blanco
    if (Math.abs(r - g) < 12 && Math.abs(g - b) < 12) return ''; // grises de la cuadrícula
    if (g > r + 30 && g > b) return 'E';
    if (r > g + 60 && r > b + 40) return 'N';
    return 'P';
  };
  async function leerPlanExcel(file) {
    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array', cellStyles: true });
    for (const nombre of wb.SheetNames) {
      const ws = wb.Sheets[nombre]; if (!ws['!ref']) continue;
      const rg = XLSX.utils.decode_range(ws['!ref']);
      const val = (r, c) => { const x = ws[XLSX.utils.encode_cell({ r, c })]; return x ? String(x.w ?? x.v ?? '').trim() : ''; };
      let anio = null, filaMes = -1, filaEq = -1, mapa = null;
      for (let r = rg.s.r; r <= Math.min(rg.e.r, rg.s.r + 40); r++) {
        let meses = 0;
        for (let c = rg.s.c; c <= rg.e.c; c++) { const t = val(r, c); const a = norm(t).match(/A[NÑ]O\D{0,3}(20\d{2})/); if (a && !anio) anio = +a[1]; if (mesDeTxt(t)) meses++; }
        if (meses >= 6 && filaMes < 0) filaMes = r;
        if (filaEq < 0) { const cs = []; for (let c = rg.s.c; c <= rg.e.c; c++) cs.push(val(r, c)); if (cs.some((t) => /^EQUIPO$/.test(norm(t))) && cs.some((t) => /SERIE|MARCA/.test(norm(t)))) { filaEq = r; mapa = {}; cs.forEach((t, i) => { const k = colDe(t); if (k && !(k in mapa)) mapa[k] = rg.s.c + i; }); } }
      }
      if (filaMes < 0 || !mapa) continue;
      // columnas de semanas: fila con 1-4 debajo de los meses
      const filaSem = filaMes + 1; const colMS = {}; let mesAct = 0;
      const mesEnCol = {}; for (let c = rg.s.c; c <= rg.e.c; c++) { const m = mesDeTxt(val(filaMes, c)); if (m) mesEnCol[c] = m; }
      (ws['!merges'] || []).forEach((mg) => { if (mg.s.r === filaMes && mesEnCol[mg.s.c]) for (let c = mg.s.c; c <= mg.e.c; c++) mesEnCol[c] = mesEnCol[mg.s.c]; });
      for (let c = rg.s.c; c <= rg.e.c; c++) { if (mesEnCol[c]) mesAct = mesEnCol[c]; const w = +val(filaSem, c); if (mesAct && w >= 1 && w <= 4) colMS[c] = `${mesAct}-${w}`; }
      if (Object.keys(colMS).length < 12) continue;
      const out = [];
      for (let r = Math.max(filaSem, filaEq) + 1; r <= rg.e.r; r++) {
        const o = {}; Object.entries(mapa).forEach(([k, c]) => { o[k] = val(r, c); });
        if (!o.nombre || /ELABORADO|IBCOL|PRESTADOR|RESPONSABLE/i.test(o.nombre)) continue;
        const plan = {};
        Object.entries(colMS).forEach(([c, k]) => {
          const x = ws[XLSX.utils.encode_cell({ r, c: +c })]; const t = norm(x ? (x.w ?? x.v ?? '') : '');
          let v = /^E/.test(t) || t === 'EJECUTADO' ? 'E' : /^N/.test(t) ? 'N' : t ? 'P' : '';
          if (!v && x?.s) v = tipoColor(x.s.fgColor) || tipoColor(x.s.bgColor);
          if (v) plan[k] = v;
        });
        out.push({ ...o, plan });
      }
      if (out.length) return { anio, filas: out };
    }
    return null;
  }

  // ---------------------------------------------------------------- llenar inventario y cronograma con los archivos cargados
  // Toma los inventarios y cronogramas (Excel/PDF) de la entidad o sede, busca cada equipo por código (o nombre + serie)
  // y completa sus datos vacíos; de los cronogramas en Excel también toma los meses y semanas marcados.
  // Núcleo: lee los documentos y completa los equipos (eqsS) y la programación del cronograma.
  // tipo: 'mantenimiento' | 'metrologia' | 'auto' (lo deduce del nombre o subcarpeta del archivo) | null (no programa)
  const tipoDeDoc = (doc) => { const t = norm(`${doc.subcarpeta || ''} ${doc.nombre}`); return /CAPACIT/.test(t) ? null : /METROLOG|CALIBRA/.test(t) ? 'metrologia' : 'mantenimiento'; };
  async function procesarDocs(ent, eqsS, docsSel, { datos = true, reemplazar = false, codigos = false, crear = false, ordenar = false, sedeDe = () => null, tipo = null, anioPlan = new Date().getFullYear(), prog = () => {}, eqsDe = null } = {}) {
    let nAct = 0, nPlan = 0, nNuevos = 0; const sinMatch = new Set(), errores = [], actIds = new Set(), sedesOrdenadas = new Set();
    const cronCache = {};
    const svc = (t) => comp(norm(t).replace(/\b(DE|DEL|LA|LAS|LOS|EL|Y)\b/g, ' '));
    const consAll = await S.list('consultorios', { entidad_id: ent.id });
    const consN = {}; consAll.forEach((c) => { consN[c.id] = svc(c.nombre); });
    const mismoServ = (cn, sv) => !!cn && !!sv && (cn === sv || cn.includes(sv) || sv.includes(cn));
    const lev = (a, b) => { if (Math.abs(a.length - b.length) > 2) return 9; const d = [...Array(b.length + 1).keys()]; for (let i = 1; i <= a.length; i++) { let prev = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } } return d[b.length]; };
    const parecido = (a, b) => (!a || !b ? 0 : a === b ? 3 : (a.length >= 5 && b.length >= 5 && (a.startsWith(b) || b.startsWith(a))) ? 2 : lev(a, b) <= 2 && Math.min(a.length, b.length) >= 6 ? 1 : 0);
    // código → serie → mismo servicio + nombre parecido (uno a uno) → nombre único
    const buscarEn = (lista, r, usados) => {
      const libre = (x) => !usados.has(x.id);
      if (r.codigo) { const c = comp(r.codigo); const e = lista.find((x) => comp(x.codigo_inv) === c); if (e) return e; }
      const sr = comp(r.serie); if (sr.length >= 4 && !/^(NR|NOREGISTRA)$/.test(sr)) { const e = lista.find((x) => comp(x.serie) === sr); if (e) return e; }
      const n = comp(r.nombre); if (!n) return null;
      const sv = svc(r.servicio);
      if (sv) {
        const mismos = lista.filter((x) => libre(x) && mismoServ(consN[x.consultorio_id], sv));
        let mejor = null, pt = 0; mismos.forEach((x) => { const p = parecido(comp(x.nombre), n); if (p > pt) { pt = p; mejor = x; } });
        if (mejor) return mejor;
      }
      const iguales = lista.filter((x) => libre(x) && comp(x.nombre) === n);
      if (iguales.length === 1) return iguales[0];
      // el servicio del archivo no coincide (ej. el archivo no separa "TOMA DE MUESTRAS"): buscar en la sede,
      // prefiriendo los servicios que el archivo no menciona
      const fuera = (x) => { const cn = consN[x.consultorio_id] || ''; return ![...servArch].some((sv2) => mismoServ(cn, sv2)); };
      let mejor = null, pt = 0; lista.forEach((x) => { if (!libre(x)) return; const p = parecido(comp(x.nombre), n); if (!p) return; const q = p + (fuera(x) ? 10 : 0); if (q > pt) { pt = q; mejor = x; } });
      return mejor && (pt >= 10 || iguales.length === 0) ? mejor : null;
    };
    let servArch = new Set();
    for (const doc of docsSel) {
      prog(`Leyendo ${doc.nombre}…`);
      const lista = eqsDe ? eqsDe(doc) : eqsS; const usados = new Set(); const usadosP = new Set();
      const buscar = (r, u = usados) => { const e = buscarEn(lista, r, u); if (e) u.add(e.id); return e; };
      const tipoD = tipo === 'auto' ? tipoDeDoc(doc) : tipo;
      let file;
      try { const b = await S.fileBlob(doc.archivo); if (!b) throw new Error('no disponible'); file = new File([b], doc.nombre, { type: b.type || doc.mime || '' }); }
      catch (e) { errores.push(`${doc.nombre}: no se pudo abrir`); continue; }
      let filas = [], plan = null;
      try { filas = await A.parsearInventario(file); } catch (e) { /* puede ser un cronograma sin tabla de inventario */ }
      if (tipoD && /\.(xlsx?|xlsm)$/i.test(doc.nombre)) { try { plan = await leerPlanExcel(file); } catch (e) { console.warn(e); } }
      if (!filas.length && plan) filas = plan.filas;
      filas = filas.filter((r) => /[A-ZÁÉÍÓÚÑ]{3}/i.test(r.nombre || ''));
      if (!filas.length) { errores.push(`${doc.nombre}: no se encontró la tabla de equipos`); continue; }
      servArch = new Set(filas.map((r) => svc(r.servicio)).filter(Boolean));
      // 1) datos de los equipos
      if (datos) {
        const esInv = doc.carpeta === 'inventarios'; const sedeD = sedeDe(doc);
        const ordenarDoc = ordenar && esInv && !sedesOrdenadas.has(sedeD || '*');
        for (const [pos, r] of filas.entries()) {
          let e = buscar(r);
          if (!e && crear && esInv) {
            // crear el equipo que falta en su servicio (y el servicio, si no existe en la sede)
            const sv = svc(r.servicio || 'SIN SERVICIO');
            let c = consAll.find((x) => (!sedeD || (x.sede || 'Sede principal') === sedeD) && mismoServ(consN[x.id], sv));
            if (!c) { c = await S.insert('consultorios', { entidad_id: ent.id, nombre: titulo(r.servicio || 'SIN SERVICIO'), orden: 900 + consAll.length, sede: sedeD || 'Sede principal' }); consAll.push(c); consN[c.id] = svc(c.nombre); }
            const todos = await S.list('equipos', { entidad_id: ent.id });
            let cod = r.codigo || `${comp(r.nombre).slice(0, 3)}-${String(pos + 1).padStart(3, '0')}`;
            while (todos.some((x) => comp(x.codigo_inv) === comp(cod))) cod += '-B';
            e = await S.insert('equipos', { entidad_id: ent.id, consultorio_id: c.id, codigo_inv: cod, nombre: titulo(r.nombre), marca: r.marca || null, modelo: r.modelo || null, serie: r.serie && !/^N\/?R$/i.test(r.serie) ? r.serie : null,
              activo_fijo: r.af || null, clase_riesgo: riesgoDe(r.riesgo), registro_sanitario: r.rs || null, ubicacion: titulo(r.ubicacion || r.servicio) || null, orden: pos + 1, estado: 'Activo', periodicidad_mto: 'Semestral', periodicidad_metro: 'No aplica', hv: {} });
            lista.push(e); if (lista !== eqsS) eqsS.push(e); usados.add(e.id); nNuevos++; continue;
          }
          if (!e) { if (r.nombre) sinMatch.add(`${r.codigo ? r.codigo + ' · ' : ''}${r.nombre}`); continue; }
          const cand = { ...(codigos && r.codigo ? { codigo_inv: r.codigo } : {}), activo_fijo: r.af, marca: r.marca, modelo: r.modelo, serie: r.serie && !/^N\/?R$/i.test(r.serie) ? r.serie : '', registro_sanitario: r.rs, clase_riesgo: riesgoDe(r.riesgo), ubicacion: r.ubicacion || '' };
          const cambios = {};
          Object.entries(cand).forEach(([k, v]) => { v = String(v || '').trim(); if (!v || /^(NO REGISTRA|NR|N\/A)$/i.test(v)) return; if (reemplazar || !e[k] || k === 'codigo_inv') { if (e[k] !== v) cambios[k] = v; } });
          if (ordenarDoc && e.orden !== pos + 1) cambios.orden = pos + 1;
          if (Object.keys(cambios).length) { const u = await S.update('equipos', e.id, cambios); Object.assign(e, u || cambios); if (!actIds.has(e.id)) { actIds.add(e.id); nAct++; } }
        }
      }
      // servicios de la sede en el orden del inventario (los que el archivo no trae quedan al final)
      if (datos && ordenar && doc.carpeta === 'inventarios' && !sedesOrdenadas.has(sedeDe(doc) || '*')) {
        const sedeD = sedeDe(doc); sedesOrdenadas.add(sedeD || '*');
        const ordenS = [...new Set(filas.map((r) => svc(r.servicio)).filter(Boolean))];
        const deSede = A.ordenar(consAll.filter((c) => !sedeD || (c.sede || 'Sede principal') === sedeD));
        const idx = (c) => { const i = ordenS.findIndex((sv) => mismoServ(consN[c.id], sv)); return i < 0 ? 1000 : i; };
        const nuevo = [...deSede].sort((a, b) => idx(a) - idx(b) || deSede.indexOf(a) - deSede.indexOf(b));
        for (const [i, c] of nuevo.entries()) if (c.orden !== i + 1) { await S.update('consultorios', c.id, { orden: i + 1 }); c.orden = i + 1; }
      }
      // 2) programación del cronograma
      if (plan && tipoD) {
        const y = plan.anio || anioPlan; const ck = `${tipoD}-${y}`;
        cronCache[ck] = cronCache[ck] || await S.list('cronogramas', { entidad_id: ent.id, tipo: tipoD, anio: y });
        for (const r of plan.filas) {
          const e = buscar(r, usadosP); if (!e || !Object.keys(r.plan).length) continue;
          const c = cronCache[ck].find((x) => x.equipo_id === e.id);
          const nuevo = { ...(c?.plan || {}) }; let cambio = false;
          Object.entries(r.plan).forEach(([k, v]) => { if (!nuevo[k]) { nuevo[k] = v; cambio = true; } });
          if (!cambio) continue;
          if (c) { await S.update('cronogramas', c.id, { plan: nuevo }); c.plan = nuevo; } else cronCache[ck].push(await S.insert('cronogramas', { entidad_id: ent.id, equipo_id: e.id, tipo: tipoD, anio: y, plan: nuevo }));
          nPlan++;
        }
      }
    }
    return { nAct, nPlan, nNuevos, sinMatch, errores };
  }

  // Llenar TODAS las entidades y sedes con sus inventarios / cronogramas en Excel ya cargados
  A.llenarTodas = async () => {
    const ents = await S.list('entidades', {}, 'razon_social');
    if (!ents.length) return toast('No hay entidades', true);
    modal({
      titulo: 'Llenar todas las entidades con sus archivos cargados', size: 'wide',
      cuerpo: `<form class="form" onsubmit="return false"><p class="muted">Para cada entidad y cada sede se leen los inventarios y cronogramas en Excel subidos a las carpetas <b>1. Inventarios</b> y <b>2. Cronogramas</b> (del más reciente al más antiguo). Cada equipo se busca dentro de su sede por <b>código de inventario</b>, serie o <b>servicio y nombre</b>; con eso quedan llenos el inventario y las columnas del cronograma.</p>
        <div class="tbl-wrap" style="max-height:240px;overflow:auto"><table class="tbl"><thead><tr><th></th><th>Entidad</th></tr></thead><tbody>${ents.map((e) => `<tr><td><input type="checkbox" name="ent" value="${e.id}" checked aria-label="Incluir ${h(e.razon_social)}"></td><td>${h(e.razon_social)}</td></tr>`).join('')}</tbody></table></div>
        <label class="checks full radio-line"><input type="checkbox" name="reemplazar" data-single> Reemplazar también los datos que ya tienen (si no, solo se llenan los vacíos)</label>
        <label class="checks full radio-line"><input type="checkbox" name="codigos" data-single> Cambiar el código de inventario por el del archivo cuando el equipo se encontró por servicio y nombre</label>
        <label class="checks full radio-line"><input type="checkbox" name="plan" data-single checked> Pasar también los meses y semanas marcados en los cronogramas en Excel (mantenimiento o metrología según el nombre del archivo; no borra lo ya programado)</label>
        <label class="checks full radio-line"><input type="checkbox" name="crear" data-single checked> Cargar todos los equipos del inventario: crear los que aún no existen (en su servicio y sede)</label>
        <label class="checks full radio-line"><input type="checkbox" name="ordenar" data-single checked> Ordenar los servicios y equipos en el mismo orden del inventario en Excel</label>
        <label class="checks full radio-line"><input type="checkbox" name="pdf" data-single> Leer también los inventarios en PDF</label>
        <div class="muted" data-prog style="margin-top:8px"></div></form>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Llenar todas', cls: 'pri', fn: async (m) => {
        const d = leer(m.body); const sel = new Set(d.ent || []);
        if (!sel.size) { toast('Marque al menos una entidad', true); return false; }
        const pg = m.body.querySelector('[data-prog]'); const res = [];
        const extRe = d.pdf ? /\.(xlsx?|xlsm|csv|pdf)$/i : /\.(xlsx?|xlsm|csv)$/i;
        for (const ent of ents.filter((e) => sel.has(e.id))) {
          const [docsAll, cons, eqs] = await Promise.all([S.list('documentos', { entidad_id: ent.id }), S.list('consultorios', { entidad_id: ent.id }), S.list('equipos', { entidad_id: ent.id })]);
          const docs = docsAll.filter((x) => !x.equipo_id && ['inventarios', 'cronogramas'].includes(x.carpeta) && extRe.test(x.nombre))
            .sort((a, b) => String(b.fecha_documento || b.created_at || '').localeCompare(String(a.fecha_documento || a.created_at || '')));
          if (!docs.length) { res.push({ ent, sinArch: true }); continue; }
          const sedes = A.sedesDe ? A.sedesDe(cons, ent) : [];
          const sedeCons = (sd) => new Set(cons.filter((c) => (c.sede || 'Sede principal') === sd).map((c) => c.id));
          const eqsDe = (doc) => { if (sedes.length < 2 || !A.esDeSede) return eqs; const sds = sedes.filter((sd) => A.esDeSede(doc, sd, sedes)); if (sds.length !== 1) return eqs; const ids = sedeCons(sds[0]); const l = eqs.filter((e) => ids.has(e.consultorio_id)); return l.length ? l : eqs; };
          const sedeDeDoc = (doc) => { if (!A.esDeSede || !sedes.length) return null; const sds = sedes.filter((sd) => A.esDeSede(doc, sd, sedes)); return sds.length === 1 ? sds[0] : null; };
          const r = await procesarDocs(ent, eqs, docs, { datos: true, reemplazar: d.reemplazar, codigos: d.codigos, crear: d.crear, ordenar: d.ordenar, sedeDe: sedeDeDoc, tipo: d.plan ? 'auto' : null, eqsDe, prog: (t) => { pg.textContent = `${ent.razon_social}: ${t}`; } });
          S.log('EDITAR', 'equipos', ent.id, `Llenado desde archivos (todas): ${r.nAct} equipos, ${r.nPlan} cronogramas`);
          res.push({ ent, n: docs.length, ...r });
        }
        modal({ titulo: 'Resultado por entidad', size: 'wide', cuerpo: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Entidad</th><th>Archivos</th><th>Equipos completados / ordenados</th><th>Equipos nuevos</th><th>Filas de cronograma</th><th>Sin coincidir</th></tr></thead><tbody>
          ${res.map((x) => `<tr><td>${h(x.ent.razon_social)}</td>${x.sinArch ? '<td colspan="5" class="muted">Sin inventarios ni cronogramas en Excel cargados</td>' : `<td class="num">${x.n}</td><td class="num">${x.nAct}</td><td class="num">${x.nNuevos}</td><td class="num">${x.nPlan}</td><td>${x.sinMatch.size ? `<details><summary>${x.sinMatch.size}</summary><small>${[...x.sinMatch].slice(0, 40).map(h).join('<br>')}</small></details>` : '0'}${x.errores.length ? `<br><small class="muted">${x.errores.map(h).join('<br>')}</small>` : ''}</td>`}</tr>`).join('')}
          </tbody></table></div>`, acciones: [{ t: 'Cerrar', cls: 'pri' }] });
        A.recargar();
      } }],
    });
  };

  A._leerPlanExcel = leerPlanExcel;
  A.llenarDesdeArchivos = async (ent, { sede = null, tipo = null, anio = new Date().getFullYear(), alTerminar } = {}) => {
    const [docsAll, cons, eqs] = await Promise.all([S.list('documentos', { entidad_id: ent.id }), S.list('consultorios', { entidad_id: ent.id }), S.list('equipos', { entidad_id: ent.id })]);
    const sedes = A.sedesDe ? A.sedesDe(cons, ent) : [];
    const docs = docsAll.filter((d) => !d.equipo_id && ['inventarios', 'cronogramas'].includes(d.carpeta) && /\.(xlsx?|xlsm|csv|pdf)$/i.test(d.nombre) && (!sede || A.esDeSede(d, sede, sedes)))
      .sort((a, b) => String(b.fecha_documento || b.created_at || '').localeCompare(String(a.fecha_documento || a.created_at || '')));
    if (!docs.length) return toast('No hay inventarios ni cronogramas en Excel o PDF cargados en las carpetas', true);
    const idsSede = new Set(cons.filter((c) => !sede || (c.sede || 'Sede principal') === sede).map((c) => c.id));
    const eqsS = eqs.filter((e) => !sede || idsSede.has(e.consultorio_id));
    const tipoTxt = { mantenimiento: 'mantenimiento preventivo', metrologia: 'metrología', capacitacion: 'capacitación' }[tipo] || '';
    modal({
      titulo: 'Llenar con los datos de los archivos cargados', size: 'wide',
      cuerpo: `<form class="form" onsubmit="return false"><p class="muted">Se leen los archivos marcados y se busca cada equipo por su <b>código de inventario</b> (o por nombre y serie). Solo se tocan los equipos que ya existen${sede ? ' en ' + h(sede) : ''}.</p>
        <div class="tbl-wrap" style="max-height:260px;overflow:auto"><table class="tbl"><thead><tr><th></th><th>Archivo</th><th>Carpeta</th><th>Fecha</th></tr></thead><tbody>
        ${docs.map((d, i) => `<tr><td><input type="checkbox" name="doc" value="${d.id}" ${i < 4 && /\.(xlsx?|xlsm|csv)$/i.test(d.nombre) ? 'checked' : ''} aria-label="Usar ${h(d.nombre)}"></td><td>${h(d.nombre)}${d.subcarpeta ? `<br><small class="muted">${h(d.subcarpeta)}</small>` : ''}</td><td>${d.carpeta === 'inventarios' ? 'Inventario' : 'Cronograma'}</td><td class="mono">${h(String(d.fecha_documento || d.created_at || '').slice(0, 10))}</td></tr>`).join('')}
        </tbody></table></div>
        <label class="checks full radio-line"><input type="checkbox" name="datos" data-single checked> Completar los datos vacíos de los equipos: A.F., marca, modelo, serie, riesgo, registro sanitario y ubicación</label>
        <label class="checks full radio-line"><input type="checkbox" name="reemplazar" data-single> Reemplazar también los datos que ya tienen (usar lo que dice el archivo)</label>
        <label class="checks full radio-line"><input type="checkbox" name="crear" data-single checked> Cargar todos los equipos de los inventarios: crear los que aún no existen</label>
        <label class="checks full radio-line"><input type="checkbox" name="ordenar" data-single checked> Ordenar los servicios y equipos como en el inventario</label>
        <label class="checks full radio-line"><input type="checkbox" name="codigos" data-single> Cambiar el código de inventario por el del archivo cuando el equipo se encontró por servicio y nombre</label>
        ${tipo ? `<label class="checks full radio-line"><input type="checkbox" name="plan" data-single checked> Pasar al cronograma de ${h(tipoTxt)} los meses y semanas marcados en los cronogramas en Excel (no borra lo ya programado)</label>
        <div class="fields">${f.sel('anioPlan', 'Año del cronograma si el archivo no lo dice', [anio - 1, anio, anio + 1].map((y) => [y, y]), anio)}</div>` : ''}
        <div class="muted" data-prog style="margin-top:8px"></div></form>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Llenar', cls: 'pri', fn: async (m) => {
        const d = leer(m.body); const sel = Array.isArray(d.doc) ? d.doc : [];
        if (!sel.length) { toast('Marque al menos un archivo', true); return false; }
        const prog = m.body.querySelector('[data-prog]');
        const { nAct, nPlan, nNuevos, sinMatch, errores } = await procesarDocs(ent, eqsS, sel.map((id) => docs.find((x) => x.id === id)), { datos: d.datos, reemplazar: d.reemplazar, codigos: d.codigos, crear: d.crear, ordenar: d.ordenar, sedeDe: () => sede, tipo: d.plan ? tipo : null, anioPlan: +d.anioPlan || anio, prog: (t) => { prog.textContent = t; } });
        S.log('EDITAR', 'equipos', ent.id, `Llenado desde archivos: ${nAct} equipos, ${nPlan} cronogramas`);
        const faltan = [...sinMatch];
        modal({ titulo: 'Resultado', size: 'sm', cuerpo: `<p><b>${nAct}</b> equipo${nAct === 1 ? '' : 's'} con datos completados u ordenados · <b>${nNuevos}</b> nuevo${nNuevos === 1 ? '' : 's'}${tipo ? ` · <b>${nPlan}</b> fila${nPlan === 1 ? '' : 's'} del cronograma programadas` : ''}.</p>
          ${faltan.length ? `<p class="muted" style="font-size:.85rem">${faltan.length} fila${faltan.length === 1 ? '' : 's'} de los archivos no coincidieron con ningún equipo${sede ? ' de la sede' : ''} (revise el código):</p><ul style="font-size:.82rem;max-height:160px;overflow:auto">${faltan.slice(0, 40).map((x) => `<li>${h(x)}</li>`).join('')}</ul>` : ''}
          ${errores.length ? `<p class="muted" style="font-size:.85rem">${errores.map(h).join('<br>')}</p>` : ''}`, acciones: [{ t: 'Cerrar', cls: 'pri' }] });
        alTerminar?.();
      } }],
    });
  };

  // Usar un inventario ya cargado en la carpeta 1
  A.inventarioDesdeDoc = async (ent, doc) => {
    const b = await S.fileBlob(doc.archivo); if (!b) throw new Error('No se pudo abrir el archivo');
    A.cargarInventario(ent, new File([b], doc.nombre, { type: b.type || doc.mime || '' }));
  };
})();
