// =====================================================================
//  Inventario → servicios → equipos
//  - Lee el inventario (FMB-001 en PDF o Excel) y crea los servicios y sus equipos.
//  - Reubica documentos de cada equipo usando los códigos que aparecen en los nombres.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal } = UI;
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
        const ban = r.map((c) => String(c)).find((c) => /SERVICIO\s*\/\s*AREA\s*:/.test(norm(c)));
        if (ban) { servSec = ban.split(':').slice(1).join(':').trim(); continue; }
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

  // Usar un inventario ya cargado en la carpeta 1
  A.inventarioDesdeDoc = async (ent, doc) => {
    const b = await S.fileBlob(doc.archivo); if (!b) throw new Error('No se pudo abrir el archivo');
    A.cargarInventario(ent, new File([b], doc.nombre, { type: b.type || doc.mime || '' }));
  };
})();
