// =====================================================================
//  Formatos exactos IBCOL
//  Cada formato es el PDF de la plantilla original (Excel) con las celdas
//  de datos vacías (formatos/<k>.pdf) + un mapa con la posición exacta de
//  cada celda (formatos/<k>.json). Aquí solo se escriben los datos dentro de
//  esas celdas, así el documento queda idéntico al formato original.
//  Para regenerar fondos y mapas: tools/build_formatos.py
// =====================================================================
window.FMT = (() => {
  const VER = 'f5';
  const cache = {};
  const cargar = (k) => (cache[k] = cache[k] || Promise.all([
    fetch(`formatos/${k}.pdf?${VER}`).then((r) => { if (!r.ok) throw new Error('No se encontró el formato ' + k); return r.arrayBuffer(); }),
    fetch(`formatos/${k}.json?${VER}`).then((r) => r.json()),
  ]).catch((e) => { delete cache[k]; throw e; }));

  const hex = (c) => { const n = parseInt(c, 16); return PDFLib.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
  const COLORES = { P: 'FFD666', E: '5FBE78', N: 'EB6E64' };

  // Solo caracteres que la fuente estándar puede escribir
  const limpiar = (t, font) => {
    let s = String(t).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/\t/g, ' ');
    let out = '';
    for (const ch of s) { try { font.encodeText(ch); out += ch; } catch { out += ch.normalize('NFD').replace(/[̀-ͯ]/g, '') || '?'; } }
    return out;
  };

  function partir(texto, font, size, ancho) {
    const lineas = [];
    String(texto).split('\n').forEach((parrafo) => {
      const pal = parrafo.split(/ +/); let act = '';
      pal.forEach((p) => {
        const prueba = act ? act + ' ' + p : p;
        if (font.widthOfTextAtSize(prueba, size) <= ancho || !act) act = prueba; else { lineas.push(act); act = p; }
        while (font.widthOfTextAtSize(act, size) > ancho && act.length > 1) { // palabra más larga que la celda
          let i = act.length - 1; while (i > 1 && font.widthOfTextAtSize(act.slice(0, i), size) > ancho) i--;
          lineas.push(act.slice(0, i)); act = act.slice(i);
        }
      });
      lineas.push(act);
    });
    return lineas;
  }

  function escribir(pg, c, valor, fN, fB) {
    const font = c.bold ? fB : fN;
    const txt = limpiar(valor, font);
    const pad = 1.5, ancho = c.w - 2 * pad;
    let size = c.size || 8, lineas;
    const multilinea = c.wrap || c.h >= size * 2.3 || txt.includes('\n');
    for (; size >= 3.5; size -= 0.25) {
      lineas = multilinea ? partir(txt, font, size, ancho) : [txt];
      const cabe = lineas.every((l) => font.widthOfTextAtSize(l, size) <= ancho) && lineas.length * size * 1.12 <= c.h + 0.5;
      if (cabe) break;
    }
    const alto = lineas.length * size * 1.12;
    const arriba = c.wrap && c.align === 'left' && c.h > size * 3;
    let y = arriba ? c.y + c.h - pad - size * 0.85 : c.y + (c.h + alto) / 2 - size * 0.92;
    const color = c.color ? hex(c.color) : PDFLib.rgb(0, 0, 0);
    lineas.forEach((l) => {
      const w = font.widthOfTextAtSize(l, size);
      const x = c.align === 'left' ? c.x + pad : c.align === 'right' ? c.x + c.w - pad - w : c.x + (c.w - w) / 2;
      pg.drawText(l, { x, y, size, font, color });
      y -= size * 1.12;
    });
  }

  function chulo(pg, c) {
    const s = Math.min(c.h * 0.6, 7), cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    const col = PDFLib.rgb(0, 0, 0);
    pg.drawLine({ start: { x: cx - s * 0.5, y: cy }, end: { x: cx - s * 0.12, y: cy - s * 0.42 }, thickness: s * 0.16, color: col });
    pg.drawLine({ start: { x: cx - s * 0.12, y: cy - s * 0.42 }, end: { x: cx + s * 0.55, y: cy + s * 0.5 }, thickness: s * 0.16, color: col });
  }

  async function imagen(out, pg, c, src) {
    try {
      const bytes = await (await fetch(src)).arrayBuffer();
      const img = /^data:image\/png/i.test(src) || /\.png($|\?)/i.test(src) ? await out.embedPng(bytes) : await out.embedJpg(bytes);
      const pad = 2, esc = Math.min((c.w - 2 * pad) / img.width, (c.h - 2 * pad) / img.height);
      const w = img.width * esc, h = img.height * esc;
      pg.drawImage(img, { x: c.x + (c.w - w) / 2, y: c.y + (c.h - h) / 2, width: w, height: h });
    } catch (e) { console.warn('imagen no válida en el formato', e); }
  }

  // hojas: lista de objetos {campo: valor}; cada objeto es una copia completa del formato
  async function render(k, hojas) {
    const [bytes, mapa] = await cargar(k);
    const { PDFDocument, StandardFonts } = PDFLib;
    const src = await PDFDocument.load(bytes);
    const out = await PDFDocument.create();
    const fN = await out.embedFont(StandardFonts.Helvetica), fB = await out.embedFont(StandardFonts.HelveticaBold);
    for (const vals of hojas) {
      const pags = await out.copyPages(src, src.getPageIndices());
      pags.forEach((p) => out.addPage(p));
      for (const [key, c] of Object.entries(mapa.campos)) {
        let v = vals[key];
        if (v === undefined || (c.img && !v)) v = c.default;
        if (v === null || v === undefined || v === '') continue;
        const pg = pags[c.p];
        if (c.img) { if (typeof v === 'string' && v.startsWith('data:')) await imagen(out, pg, c, v); else if (typeof v === 'string') escribir(pg, c, v, fN, fB); continue; }
        if (v === '✓') { chulo(pg, c); continue; }
        if (typeof v === 'object' && v.fill) { const m = 0.6; pg.drawRectangle({ x: c.x + m, y: c.y + m, width: c.w - 2 * m, height: c.h - 2 * m, color: hex(COLORES[v.fill] || v.fill) }); continue; }
        escribir(pg, c, v, fN, fB);
      }
      // Filas sin datos: se dejan en blanco (sin cuadrícula) en la última hoja de los formatos con tabla
      if (vals.__nFilas > 0 && mapa.filas && vals.__nFilas < mapa.filas) {
        const re = /^r(\d+)_/; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, pIdx = 0;
        for (const [key, c] of Object.entries(mapa.campos)) {
          const m = key.match(re); if (!m || +m[1] < vals.__nFilas) continue;
          x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x + c.w); y0 = Math.min(y0, c.y); y1 = Math.max(y1, c.y + c.h); pIdx = c.p || 0;
        }
        if (x1 > x0 && y1 > y0) pags[pIdx].drawRectangle({ x: x0 - 1.2, y: y0 - 1.2, width: x1 - x0 + 2.4, height: y1 - y0 + 1.2 - 0.8, color: hex('FFFFFF') });
      }
      // textos adicionales sobre el formato (ej. meses de un periodo que cruza dos años)
      for (const x of vals.__extra || []) {
        const pg = pags[x.p || 0];
        if (x.bg) pg.drawRectangle({ x: x.x, y: x.y, width: x.w, height: x.h, color: hex(x.bg) });
        if (x.texto) escribir(pg, { align: 'center', bold: true, size: 6, ...x }, x.texto, fN, fB);
      }
    }
    out.setTitle(k); out.setProducer('Gestor Biomédico IBCOL');
    return new Blob([await out.save()], { type: 'application/pdf' });
  }

  async function capacidad(k) { return (await cargar(k))[1].filas || 1; }

  // ------------------------------------------------------------------ utilidades de datos
  const fD = (s) => { if (!s) return ''; const d = new Date(String(s).length <= 10 ? s + 'T12:00:00' : s); return isNaN(d) ? String(s) : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
  const fUS = (s) => { if (!s) return ''; const d = new Date(String(s).length <= 10 ? s + 'T12:00:00' : s); return isNaN(d) ? String(s) : `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`; };
  const nr = (x) => (x === undefined || x === null || x === '' ? 'NR' : String(x));
  const U = (x) => String(x || '').toUpperCase();
  const lista = (l) => (Array.isArray(l) ? l : l ? [l] : []).map((x) => String(x).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase());
  const ap = (l, v) => (lista(l).includes(v) ? 'APLICA' : 'NA');
  const X = (b) => (b ? 'X' : '');
  // Valor de un dato del equipo: respeta la marca "NO REGISTRA" (eq.hv.nr) y el ítem manual (eq.hv.item)
  const NOREG = 'NO REGISTRA';
  // hv.nr[k]: true = NO REGISTRA · 'NA' = NO APLICA
  const NOAPL = 'NO APLICA';
  const marca = (e, k) => { const x = e?.hv?.nr?.[k]; return x === 'NA' ? NOAPL : x ? NOREG : ''; };
  const val = (e, k) => { if (!e) return ''; const mk = marca(e, k); if (mk) return mk; if (k === 'item') return e.hv?.item ?? ''; return e[k] ?? ''; };
  const riesgoTxt = (e) => (marca(e, 'clase_riesgo') || (e?.clase_riesgo ? `CLASE ${String(e.clase_riesgo).toUpperCase()}` : 'NR'));
  // 9.5 Recomendaciones para mediciones: tabla parámetro / cantidad / unidad
  const textoMediciones = (hv = {}) => {
    if (hv.mediciones_aplica === 'No aplica') return 'NO APLICA';
    const filas = (hv.mediciones_tabla || []).filter((r) => r.p || r.c || r.u).map((r) => `${r.p ? U(r.p) + ': ' : ''}${[r.c, r.u].filter(Boolean).join(' ')}`.trim());
    return [filas.join('  |  '), hv.mediciones || ''].filter(Boolean).join('\n');
  };
  // Línea de firma digital de los reportes
  const lineaFirma = (m) => {
    const fd = m.datos?.firma_digital; if (!fd || !m.firma_realizo) return '';
    const fh = new Date(fd.fecha); const t = isNaN(fh) ? fd.fecha : `${fD(fd.fecha)} ${String(fh.getHours()).padStart(2, '0')}:${String(fh.getMinutes()).padStart(2, '0')}`;
    const rec = m.firma_recibe && m.datos?.firma_recibe_fecha ? `  ·  Recibido y firmado por ${m.datos.recibe_nombre || 'el usuario'} el ${fD(m.datos.firma_recibe_fecha)}` : '';
    return `FIRMADO DIGITALMENTE por ${fd.nombre || ''}${fd.cargo ? ' - ' + fd.cargo : ''} el ${t}${rec}.  Código de verificación: ${fd.hash}  (cualquier cambio posterior al reporte invalida este código)`;
  };
  const cabEntidad = (ent, cons) => ({
    ent_nombre: ent?.razon_social ? U(ent.razon_social) : undefined,
    ent_dir: [ent?.direccion, ent?.ciudad].filter(Boolean).length ? U([ent.direccion, ent.ciudad].filter(Boolean).join(', ')) : undefined,
    ent_sede: cons ? U([cons.sede, cons.nombre].filter(Boolean).join(' - ')) : ent?.ciudad ? `SEDE: ${U(ent.ciudad)}` : undefined,
    ent_nit: ent?.nit ? `NIT: ${ent.nit}` : undefined,
    ent_email: ent?.email ? `E-MAIL: ${ent.email}` : undefined,
    logo: ent?.logo || undefined,
  });
  // equipos en el orden del inventario: servicio (orden) y luego ítem dentro del servicio
  const porServicio = (equipos, consultorios = []) => {
    const oc = (id) => { const c = consultorios.find((x) => x.id === id); return c ? (c.orden ?? 999) : 9999; };
    return [...equipos].sort((a, b) => oc(a.consultorio_id) - oc(b.consultorio_id) || (a.orden ?? 999) - (b.orden ?? 999) || String(a.codigo_inv || '').localeCompare(String(b.codigo_inv || '')));
  };
  const partes = (arr, n) => { const out = []; for (let i = 0; i < Math.max(1, arr.length); i += n) out.push(arr.slice(i, i + n)); return out; };

  // ------------------------------------------------------------------ HOJA DE VIDA (FHVEB-001)
  async function hojaVida({ eq, ent, cons, fmt = {} }) {
    const hv = eq.hv || {}; const v = { ...cabEntidad(ent, cons) };
    v.ent_contacto = [ent?.representante, ent?.telefono].filter(Boolean).length ? `CONTACTO: ${[ent.representante, ent.telefono].filter(Boolean).join(' - ')}` : undefined;
    const tr = hv.tipo_registro || (eq.registro_sanitario ? 'RS' : 'NR');
    Object.assign(v, { rs: nr(val(eq, 'registro_sanitario')), mk_rs: X(tr === 'RS'), mk_pc: X(tr === 'PC'), mk_na: X(tr === 'NA'), mk_nr: X(tr === 'NR'),
      ecri: nr(hv.ecri), reps: nr(ent?.reps), distintivo: nr(hv.distintivo), equipo: U(val(eq, 'nombre')), foto: hv.foto || null, funcion: nr(hv.funcion),
      marca: nr(val(eq, 'marca')), af: nr(val(eq, 'activo_fijo')), modelo: nr(val(eq, 'modelo')), servicio: nr(cons?.servicio || cons?.nombre), serie: nr(val(eq, 'serie')), ubicacion: nr(val(eq, 'ubicacion')),
      inventario: nr(val(eq, 'codigo_inv')), movil: X(hv.movil !== 'Fijo'), fijo: X(hv.movil === 'Fijo') });
    const adq = lista(hv.adquisicion || 'Compra')[0];
    ['compra', 'donacion', 'asignacion', 'comodato', 'alquiler'].forEach((k) => { v[`adq_${k}`] = X(adq === k); });
    Object.assign(v, { garantia: nr(hv.garantia || (eq.fecha_fin_garantia ? 'Hasta ' + fD(eq.fecha_fin_garantia) : '')), costo: hv.costo ? '$ ' + Math.round(Number(hv.costo)).toLocaleString('es-CO') : 'NR',
      factura: nr(hv.factura), contrato: nr(hv.contrato), f_fabricacion: nr(fD(hv.f_fabricacion)), f_compra: nr(fD(hv.f_compra)), f_recibido: nr(fD(hv.f_recibido)),
      f_instalacion: nr(fD(hv.f_instalacion)), f_uso: nr(fD(hv.f_uso)), vida_util: nr(hv.vida_util),
      prov_nombre: nr(hv.prov_nombre), prov_ciudad: nr(hv.prov_ciudad), prov_dir: nr(hv.prov_dir), prov_tel: nr(hv.prov_tel), prov_correo: nr(hv.prov_correo), prov_web: nr(hv.prov_web),
      fab_nombre: nr(eq.fabricante), fab_ciudad: nr(hv.fab_ciudad), fab_dir: nr(hv.fab_dir), fab_tel: nr(hv.fab_tel), fab_correo: nr(hv.fab_correo), fab_web: nr(hv.fab_web) });
    ['voltaje', 'corriente', 'potencia', 'frecuencia', 'presion', 'rpm', 'capacidad', 'presion_atm', 'temperatura', 'humedad', 'peso', 'dimensiones', 'rangos', 'otros_tec']
      .forEach((k) => { v[`i_${k}`] = nr(hv[k]); v[`f_${k}`] = nr(hv[`func_${k}`] ?? hv[k]); });
    ['electricidad', 'bateria', 'aceite', 'agua', 'aire', 'gas', 'vapor', 'oxigeno', 'otro'].forEach((k) => { v[`fu_${k}`] = ap(hv.fuente, k); });
    v.fu_cual = hv.fuente_cual || 'NA';
    ['electrico', 'electronico', 'electromecanico', 'mecanico', 'hidraulico', 'neumatico', 'acustico', 'vapor', 'solar'].forEach((k) => { v[`te_${k}`] = ap(hv.tecnologia, k); });
    const cb = lista(hv.clasif_biomedica);
    Object.assign(v, { cb_diagnostico: ap(cb, 'diagnostico'), cb_prevencion: ap(cb, 'prevencion'), cb_rehabilitacion: ap(cb, 'rehabilitacion'),
      cb_tto: cb.some((x) => x.startsWith('tratamiento')) ? 'APLICA' : 'NA', cb_laboratorio: cb.some((x) => x.startsWith('analisis')) ? 'APLICA' : 'NA' });
    ['I', 'IIa', 'IIb', 'III'].forEach((r) => { v[`r_${r}`] = eq.clase_riesgo === r ? 'APLICA' : 'NA'; });
    // 6.5 Manuales (formato v.002 ajustado): Operación, Mantenimiento, Guía rápida, Ficha técnica
    Object.assign(v, { ma_operacion: ap(hv.manuales, 'operacion'), ma_mantenimiento: ap(hv.manuales, 'mantenimiento'), ma_partes: ap(hv.manuales, 'guia rapida'), ma_despiece: ap(hv.manuales, 'ficha tecnica') });
    ['electronico', 'mecanico', 'electrico', 'neumatico'].forEach((k) => { v[`pl_${k}`] = ap(hv.planos, k); });
    const acc = (hv.accesorios || []).filter((a) => a.nombre);
    for (let i = 0; i < 4; i++) { const a = acc[i] || {}; ['nombre', 'marca', 'modelo', 'serie', 'desc'].forEach((k) => { v[`acc${i}_${k}`] = nr(a[k]); }); }
    const anexos = hv.anexos || {};
    ['reg_sanitario', 'importacion', 'factura', 'acta_recibido', 'crono_garantia', 'protocolo', 'guia'].forEach((k, i) => {
      const s = anexos[k] || 'No aplica';
      v[`an${i}_si`] = X(s === 'Anexo'); v[`an${i}_no`] = X(s === 'No anexo'); v[`an${i}_na`] = X(s === 'No aplica');
      v[`an${i}_obs`] = i === 0 ? nr(val(eq, 'registro_sanitario')) : (hv.anexos_obs || {})[k] || '';
    });
    const mtoAp = eq.periodicidad_mto && eq.periodicidad_mto !== 'No aplica', metAp = eq.periodicidad_metro && eq.periodicidad_metro !== 'No aplica';
    Object.assign(v, { mto_si: X(mtoAp), mto_no: X(!mtoAp), periodicidad_mto: mtoAp ? U(eq.periodicidad_mto) : 'NA', metro_si: X(metAp), metro_no: X(!metAp),
      periodicidad_metro: metAp ? U(eq.periodicidad_metro) : 'NA', mediciones: textoMediciones(hv),
      equipo_2: U(val(eq, 'nombre')), marca_2: nr(val(eq, 'marca')), modelo_2: nr(val(eq, 'modelo')), serie_2: nr(val(eq, 'serie')), recomendaciones: hv.recomendaciones || '' });
    const cod = fmt.codigo ? `Código: ${fmt.codigo}` : undefined, fec = fmt.fecha ? `Fecha Act: ${fD(fmt.fecha)}` : undefined, ver = fmt.version ? `Versión: ${fmt.version}` : undefined;
    Object.assign(v, { fmt_codigo: cod, fmt_fecha: fec, fmt_version: ver, fmt_codigo_2: cod, fmt_fecha_2: fec, fmt_version_2: ver });
    return render('hoja_vida', [v]);
  }

  // Campos comunes de los reportes FMB-004 / 005 / 006
  function mtoComun({ m, eq, ent, cons, fmt = {} }) {
    const d = m.datos || {};
    const v = { equipo: U(val(eq, 'nombre')), numero: m.numero || '', entidad: ent?.razon_social || '', sede: cons?.sede || '', servicio: cons?.nombre || '', marca: nr(val(eq, 'marca')), modelo: nr(val(eq, 'modelo')), serie: nr(val(eq, 'serie')),
      frecuencia: d.frecuencia || eq.periodicidad_mto || '', fecha: fD(m.fecha), cod_inv: nr(val(eq, 'codigo_inv')), cod_af: nr(val(eq, 'activo_fijo')), obs: d.observaciones || '',
      firma_recibe: m.firma_recibe || null, firma_realizo: m.firma_realizo || null, firma_digital: lineaFirma(m), recibe_nombre: `NOMBRE: ${d.recibe_nombre || ''}${d.recibe_cargo ? `\nCARGO: ${d.recibe_cargo}` : ''}`,
      fmt_codigo: fmt.codigo ? `CÓDIGO ${fmt.codigo}` : undefined, fmt_version: fmt.version ? `VERSIÓN  ${fmt.version}` : undefined, fmt_fecha: fmt.fecha ? fUS(fmt.fecha) : undefined };
    const valo = d.valoracion || [];
    CAT.VALORACION.forEach((x, i) => { v[`v${i}`] = valo.includes(x) ? '✓' : 'x'; });
    const rp = (d.repuestos || []).filter((r) => r.d);
    for (let i = 0; i < 8; i++) v[`rp${i}`] = rp[i] ? `${rp[i].c && rp[i].c != 1 ? rp[i].c + ' ' : ''}${rp[i].d}` : 'NA';
    return v;
  }

  async function mtoCorrectivo(o) {
    const d = o.m.datos || {}; const v = mtoComun(o);
    Object.assign(v, { frecuencia: fD(d.fecha_reporte), tiempo: d.horas ? `${d.horas} h` : '', falla: d.falla || '', diagnostico: d.diagnostico || '', causa: d.causa || '' });
    (d.actividades || []).slice(0, 12).forEach((a, i) => { v[`ac${i}`] = a; v[`ok${i}`] = '✓'; });
    return render('mto_correctivo', [v]);
  }

  async function metrologia(o) {
    const d = o.m.datos || {}; const v = mtoComun(o);
    Object.assign(v, { frecuencia: o.eq.periodicidad_metro || '', tiempo: d.tiempo || '', laboratorio: d.laboratorio || '', certificado: d.certificado || '', magnitud: d.magnitud || '',
      fecha_cal: fD(o.m.fecha), proxima: fD(d.proxima), resultado: d.resultado || '', mediciones: d.mediciones || '' });
    return render('metrologia', [v]);
  }

  // ------------------------------------------------------------------ MANTENIMIENTO PREVENTIVO (FMB-004)
  async function mtoPreventivo({ m, eq, ent, cons, fmt = {} }) {
    const d = m.datos || {};
    const v = { equipo: U(val(eq, 'nombre')), numero: m.numero || '', entidad: ent?.razon_social || '', sede: cons?.sede || '', servicio: cons?.nombre || '', marca: nr(val(eq, 'marca')), modelo: nr(val(eq, 'modelo')), serie: nr(val(eq, 'serie')),
      frecuencia: d.frecuencia || eq.periodicidad_mto || '', fecha: fD(m.fecha), tiempo: d.tiempo ? (/^\d{1,2}:\d{2}$/.test(d.tiempo) ? d.tiempo + ':00' : d.tiempo) : undefined,
      cod_inv: nr(val(eq, 'codigo_inv')), cod_af: nr(val(eq, 'activo_fijo')), obs: d.observaciones || '',
      firma_recibe: m.firma_recibe || null, firma_realizo: m.firma_realizo || null, firma_digital: lineaFirma(m), recibe_nombre: `NOMBRE: ${d.recibe_nombre || ''}${d.recibe_cargo ? `\nCARGO: ${d.recibe_cargo}` : ''}`,
      fmt_codigo: fmt.codigo ? `CÓDIGO ${fmt.codigo}` : undefined, fmt_version: fmt.version ? `VERSIÓN  ${fmt.version}` : undefined, fmt_fecha: fmt.fecha ? fUS(fmt.fecha) : undefined };
    (d.pruebas || []).slice(0, 12).forEach((p, i) => { v[`p${i}`] = p.item || ''; v[`pa${i}`] = X(p.r === 'Pasa'); v[`np${i}`] = X(p.r === 'No pasa'); });
    (d.actividades || []).slice(0, 12).forEach((a, i) => { v[`ac${i}`] = a; v[`ok${i}`] = '✓'; });
    const valo = d.valoracion || [];
    CAT.VALORACION.forEach((x, i) => { v[`v${i}`] = valo.includes(x) ? '✓' : 'x'; });
    const rp = (d.repuestos || []).filter((r) => r.d);
    for (let i = 0; i < 8; i++) v[`rp${i}`] = rp[i] ? `${rp[i].c && rp[i].c != 1 ? rp[i].c + ' ' : ''}${rp[i].d}` : 'NA';
    return render('mto_preventivo', [v]);
  }

  // ------------------------------------------------------------------ CRONOGRAMA (FMB-002)
  async function cronograma({ ent, tipo, anio, cronos = null, filas = null, ventana = null, equipos, fmt = {}, cons = null, titulo, consultorios = [] }) {
    const cap = await capacidad('cronograma');
    const [, mapa] = await cargar('cronograma');
    // filas: [{ equipo_id, tema, cr: { año: crono } }] · ventana: 12 meses [{ y, m }] (puede cruzar dos años)
    if (!filas) filas = (cronos || []).map((c) => ({ equipo_id: c.equipo_id, tema: c.tema, cr: { [c.anio ?? anio]: c } }));
    if (!ventana) ventana = [...Array(12).keys()].map((i) => ({ y: anio, m: i + 1 }));
    const orden = porServicio(equipos, consultorios).map((e) => e.id);
    filas = [...filas].sort((a, b) => (orden.indexOf(a.equipo_id) + 1 || 9999) - (orden.indexOf(b.equipo_id) + 1 || 9999));
    const eqs = (id) => equipos.find((e) => e.id === id) || {};
    const MES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const cruza = ventana[0].m !== 1;
    const y1 = ventana[0].y, y2 = ventana[11].y;
    // Etiquetas de año: el formato tiene dos (sobre ene–may y jun–dic). Si el periodo cruza dos años, se escriben los meses de cada uno.
    const rango = (y) => { const ms = ventana.filter((v) => v.y === y); return `AÑO ${y}: ${MES[ms[0].m - 1].slice(0, 3)} – ${MES[ms[ms.length - 1].m - 1].slice(0, 3)}`; };
    const extra = [];
    if (cruza) {
      // Reescribe los nombres de los meses de cada columna en el orden del periodo (oct, nov, dic, ene…)
      ventana.forEach((v, p) => {
        const c1 = mapa.campos[`r0_w${p + 1}-1`], c4 = mapa.campos[`r0_w${p + 1}-4`]; if (!c1 || !c4) return;
        const x = c1.x + 0.5, w = c4.x + c4.w - c1.x - 1;
        extra.push({ x, y: 411.3, w, h: 15.3, bg: 'FFFFFF', texto: `${MES[v.m - 1].slice(0, 3)} ${String(v.y).slice(2)}`, size: 6.2, color: v.y === y1 ? '0070C0' : '00B050' });
      });
      // Fila de años: un rótulo sobre los meses de cada año, separados donde empieza enero
      const a1 = mapa.campos.anio1, a2 = mapa.campos.anio2;
      if (a1 && a2) {
        const xIni = a1.x, xFin = a2.x + a2.w;
        const corte = ventana.findIndex((v) => v.y === y2), cc = mapa.campos[`r0_w${corte + 1}-1`];
        const xc = cc ? cc.x : (xIni + xFin) / 2;
        extra.push({ x: xIni + 0.5, y: a1.y + 0.5, w: xc - xIni - 1, h: a1.h + 1.1, bg: 'FFFFFF', texto: rango(y1), size: 6.3, color: '0070C0' });
        extra.push({ x: xc + 0.5, y: a1.y + 0.5, w: xFin - xc - 1, h: a1.h + 1.1, bg: 'FFFFFF', texto: rango(y2), size: 6.3, color: '00B050' });
        extra.push({ x: xc - 0.35, y: a1.y, w: 0.7, h: a1.h + 1.6, bg: '000000' });
      }
    }
    const base = { ...cabEntidad(ent, cons), titulo: titulo ? U(titulo) : undefined, reps: ent?.reps || '', servicio: `SERVICIO: ${cons ? U([cons.sede && !cons.nombre ? 'SEDE ' + cons.sede : '', cons.nombre].filter(Boolean).join(' ')) : 'TODOS LOS SERVICIOS'}`,
      fecha_act: `FECHA ACTUALIZACIÓN: ${fD(UI.hoy())}`, estrategia: fmt.estrategia || (tipo === 'metrologia' ? 'CALIBRACIÓN' : tipo === 'capacitacion' ? 'CAPACITACIÓN' : 'PREVENTIVO'),
      anio1: cruza ? rango(y1) : `AÑO ${anio}`, anio2: cruza ? rango(y2) : `AÑO ${anio}`,
      fmt_codigo: fmt.codigo ? `CÓDIGO ${fmt.codigo}` : undefined, fmt_version: fmt.version ? `VERSIÓN  ${fmt.version}` : undefined, fmt_fecha: fmt.fecha ? fUS(fmt.fecha) : undefined, __extra: extra };
    const hojas = partes(filas, cap).map((grupo, h) => {
      const v = { ...base, __nFilas: grupo.length };
      grupo.forEach((r, i) => {
        const e = eqs(r.equipo_id);
        const it = e.hv?.nr?.item ? 'NR' : val(e, 'item');
        Object.assign(v, { [`r${i}_item`]: String(it || h * cap + i + 1), [`r${i}_cod`]: val(e, 'codigo_inv'), [`r${i}_af`]: val(e, 'activo_fijo'), [`r${i}_equipo`]: tipo === 'capacitacion' ? r.tema || e.nombre || '' : val(e, 'nombre'),
          [`r${i}_marca`]: val(e, 'marca'), [`r${i}_modelo`]: val(e, 'modelo'), [`r${i}_serie`]: val(e, 'serie') });
        ventana.forEach((w, p) => {
          const plan = r.cr[w.y]?.plan || {};
          [1, 2, 3, 4].forEach((s) => { const x = plan[`${w.m}-${s}`]; if (x) v[`r${i}_w${p + 1}-${s}`] = { fill: x }; });
        });
      });
      return v;
    });
    return render('cronograma', hojas);
  }

  // ------------------------------------------------------------------ INVENTARIO (FMB-001)
  async function inventario({ ent, equipos, consultorios, fmt = {}, cons = null }) {
    const cap = await capacidad('inventario');
    equipos = porServicio(equipos, consultorios);
    const cn = (id) => consultorios.find((c) => c.id === id)?.nombre || '';
    const base = { ...cabEntidad(ent, cons), reps: ent?.reps || '', servicio: `SERVICIO: ${cons ? U(cons.nombre) : 'TODOS LOS SERVICIOS'}`, fecha_act: `FECHA ACTUALIZACIÓN: ${fD(UI.hoy())}`,
      fmt_codigo: fmt.codigo ? `CÓDIGO ${fmt.codigo}` : undefined, fmt_version: fmt.version ? `VERSIÓN  ${fmt.version}` : undefined, fmt_fecha: fmt.fecha ? fUS(fmt.fecha) : undefined };
    const hojas = partes(equipos, cap).map((grupo, h) => {
      const v = { ...base, __nFilas: grupo.length };
      grupo.forEach((e, i) => Object.assign(v, { [`r${i}_item`]: String((e.hv?.nr?.item ? 'NR' : val(e, 'item')) || h * cap + i + 1), [`r${i}_cod`]: val(e, 'codigo_inv'), [`r${i}_af`]: val(e, 'activo_fijo'), [`r${i}_equipo`]: val(e, 'nombre'),
        [`r${i}_marca`]: val(e, 'marca'), [`r${i}_modelo`]: val(e, 'modelo'), [`r${i}_serie`]: val(e, 'serie') || 'NR', [`r${i}_ubicacion`]: U(val(e, 'ubicacion') || cn(e.consultorio_id)),
        [`r${i}_riesgo`]: riesgoTxt(e), [`r${i}_rs`]: val(e, 'registro_sanitario') || 'NR' }));
      return v;
    });
    return render('inventario', hojas);
  }

  // ------------------------------------------------------------------ BITÁCORA ALERTAS (FT-PGTV-015)
  async function alertas({ ent, alertas, fmt = {} }) {
    const cap = await capacidad('alertas');
    const base = { ent_nombre: U(ent?.razon_social || ''), logo: ent?.logo || undefined,
      fmt_codigo: fmt.codigo ? `CÓDIGO: ${fmt.codigo}` : undefined, fmt_version: fmt.version ? `VERSIÓN: ${fmt.version}` : undefined, fmt_fecha: fmt.fecha ? `FECHA DE CREACIÓN: ${fD(fmt.fecha).replace(/^0/, '')}` : undefined };
    const hojas = partes(alertas, cap).map((grupo, h) => {
      const v = { ...base, __nFilas: grupo.length };
      for (let i = 0; i < cap; i++) {
        const a = grupo[i]; if (!a) continue;
        v[`r${i}_n`] = String(h * cap + i + 1);
        Object.assign(v, { [`r${i}_mes`]: a.mes_consulta || '', [`r${i}_rs`]: a.registro_sanitario || '', [`r${i}_dispositivo`]: a.dispositivo || '', [`r${i}_tipo`]: a.tipo_notificacion || '',
          [`r${i}_agencia`]: a.agencia || 'INVIMA', [`r${i}_fecha`]: fD(a.fecha_publicacion), [`r${i}_responsable`]: U(a.responsable || 'LAURA PISTALA'), [`r${i}_analisis`]: a.analisis || '', [`r${i}_aplica`]: a.aplicabilidad || '' });
      }
      return v;
    });
    return render('alertas', hojas);
  }

  // ------------------------------------------------------------------ CUENTA DE COBRO (formato Word de IBCOL)
  async function cuentaCobro({ cc, ent }) {
    const items = (cc.items || []).filter((i) => i.descripcion);
    const total = items.length ? items.reduce((s, i) => s + (Number(i.cantidad) || 1) * (Number(i.valor) || 0), 0) : Number(cc.total) || 0;
    const n = (x) => Math.round(Number(x) || 0).toLocaleString('es-CO');
    const conc = items.length ? items.map((it, k) => `${k + 1}. ${it.descripcion}${Number(it.cantidad) > 1 ? ` (${it.cantidad} x $ ${n(it.valor)})` : ''} (VALOR $ ${n((Number(it.cantidad) || 1) * (Number(it.valor) || 0))})`) : [`1. ${cc.concepto || ''}`];
    if (items.length && cc.concepto) conc.unshift(cc.concepto);
    const v = { fecha: `(${fD(cc.fecha || UI.hoy())})`, numero: `(${cc.numero || ''})`, ent_nombre: U(ent?.razon_social || 'DATOS EMPRESA'), ent_id: `ID: N.I. ${ent?.nit || ''}`,
      ent_dir: `DIR: ${[ent?.direccion, ent?.ciudad].filter(Boolean).join(', ')}`, ent_tel: `TEL.: ${ent?.telefono || ''}  E-MAIL: ${ent?.email || ''}`,
      suma: `$ ${n(total)}`, letras: `${U(PDF.enLetras(total))} PESOS M/C.`, concepto: U(conc.join('\n')) };
    return render('cuenta_cobro', [v]);
  }

  return { val, marca, NOAPL, NOREG, textoMediciones, render, cuentaCobro, hojaVida, mtoPreventivo, mtoCorrectivo, metrologia, cronograma, inventario, alertas, cargar };
})();
