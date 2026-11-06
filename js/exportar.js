// =====================================================================
//  DESCARGAR LA CARPETA COMPLETA DE UNA ENTIDAD EN UN SOLO PDF
//  Solo el propietario (administrador IBCOL).
//  Portada + índice con número de página + carpetas generales (inventario
//  y documentos guardados) + 3. Información del equipo (por servicio: hoja
//  de vida, reportes de mantenimiento/metrología y documentos de cada equipo).
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, leer, f } = UI;
  const esPDF = (d) => /pdf/i.test(d.mime || '') || /\.pdf$/i.test(d.nombre || d.archivo || '');
  const esImg = (d) => /^image\/(png|jpe?g)/i.test(d.mime || '') || /\.(png|jpe?g)$/i.test(d.nombre || '');
  const nom = (ent, nivel, c, eq = null) => (A.nomCarpeta ? A.nomCarpeta(ent, nivel, c.k, eq) : c.n) || c.n;
  const limpio = (t) => String(t || '').replace(/\s+/g, ' ').trim();

  A.exportarCarpetaPDF = async (ent, sede = null) => {
    if (st.perfil?.rol !== 'propietario') return toast('Solo el administrador puede descargar la carpeta completa.', true);
    modal({ titulo: `Descargar carpeta completa · ${ent.razon_social}${sede ? ' · ' + sede : ''}`, size: 'sm',
      cuerpo: `<form class="form" onsubmit="return false">
        <div class="fields">
          <div class="field full"><label>¿Cómo la quiere descargar?</label>
            <label class="checks radio-line"><input type="radio" name="formato" value="zip" checked> <b>En carpetas</b>, organizada igual que en el gestor (archivo .zip con una carpeta por cada carpeta, servicio y equipo; cada documento en PDF y los Excel/Word tal cual)</label>
            <label class="checks radio-line"><input type="radio" name="formato" value="pdf"> <b>Un solo PDF</b> con portada e índice (los Excel/Word quedan nombrados en el índice)</label></div>
          <label class="checks full radio-line"><input type="checkbox" name="generales" checked> Carpetas generales (inventario, cronogramas, protocolos, alertas, capacitación, indicadores, contratos…)</label>
          <label class="checks full radio-line"><input type="checkbox" name="hv" checked> Hoja de vida de cada equipo</label>
          <label class="checks full radio-line"><input type="checkbox" name="mto" checked> Reportes de mantenimiento preventivo, correctivo y metrología</label>
          <label class="checks full radio-line"><input type="checkbox" name="docs_eq" checked> Documentos de cada equipo (registro sanitario, facturas, importación, actas…)</label>
          <label class="checks full radio-line"><input type="checkbox" name="manuales"> Incluir manuales y fichas técnicas (pueden ser muy pesados)</label>
          <label class="checks full radio-line"><input type="checkbox" name="baja"> Incluir equipos dados de baja</label>
        </div></form>`,
      acciones: [{ t: 'Cancelar' }, { t: `${I.bajar} Descargar`, cls: 'pri', fn: (m) => { const o = leer(m.body); setTimeout(() => armar(ent, sede, o), 50); } }] });
  };

  async function armar(ent, sede, o) {
    let cancelado = false;
    const prog = modal({ titulo: 'Armando la carpeta en PDF…', size: 'sm', cuerpo: `<p data-p-txt>Cargando datos…</p><div class="bar" style="height:8px;background:var(--line,#ddd);border-radius:6px;overflow:hidden"><div data-p-bar style="height:100%;width:0;background:var(--pri,#0a8fb0);transition:width .2s"></div></div><p class="muted" data-p-sub style="font-size:.85rem;margin-top:8px"></p>`,
      acciones: [{ t: 'Cancelar', fn: () => { cancelado = true; } }] });
    const body = () => document.querySelector('[data-p-txt]')?.closest('.modal') || document;
    const avance = (txt, i, n, sub = '') => { const b = body(); const t = b.querySelector('[data-p-txt]'); if (t) t.textContent = txt; const br = b.querySelector('[data-p-bar]'); if (br && n) br.style.width = `${Math.round((i / n) * 100)}%`; const s = b.querySelector('[data-p-sub]'); if (s) s.textContent = sub; };
    const cerrar = () => { try { prog?.cerrar?.(); } catch { /* */ } };
    try {
      const [consT, eqsT, docsT, mtosT] = await Promise.all([S.list('consultorios', { entidad_id: ent.id }), S.list('equipos', { entidad_id: ent.id }), S.list('documentos', { entidad_id: ent.id }), S.list('mantenimientos', { entidad_id: ent.id }, '-fecha')]);
      const sedes = A.sedesDe(consT, ent);
      const cons = A.ordenar(consT.filter((c) => !sede || (c.sede || 'Sede principal') === sede));
      const eqs = eqsT.filter((e) => cons.some((c) => c.id === e.consultorio_id) || (!sede && !e.consultorio_id)).filter((e) => o.baja || e.estado !== 'Dado de baja')
        .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999) || String(a.codigo_inv || '').localeCompare(String(b.codigo_inv || ''), 'es', { numeric: true }));
      const docsGen = docsT.filter((d) => !d.equipo_id && (!sede || A.esDeSede(d, sede, sedes)));
      const ocE = A.ocultas(ent, 'ent');

      // ---- plan de trabajo: lista de piezas en orden { nivel, titulo, tarea }
      const piezas = []; // { nivel:0|1|2|3, titulo, fuente: async () => ({ bytes } | { img, tipo } | null), nota }
      let dir = []; const vacias = [];
      const add = (nivel, titulo, fuente = null, nota = '', file = null, raw = null) => piezas.push({ nivel, titulo, fuente, nota, dir: [...dir], file: file || (fuente ? titulo : null), raw });
      const bajarRaw = (d) => async () => (await S.fileBlob(d.archivo)).arrayBuffer();
      const docPieza = (nivel, d) => {
        const file = /\.[a-z0-9]{2,5}$/i.test(d.nombre || '') ? d.nombre : `${d.nombre || 'documento'}${(d.archivo || '').match(/\.[a-z0-9]{2,5}$/i)?.[0] || ''}`;
        if (esPDF(d)) add(nivel, d.nombre, async () => ({ bytes: await (await S.fileBlob(d.archivo)).arrayBuffer() }), '', file, bajarRaw(d));
        else if (esImg(d)) add(nivel, d.nombre, async () => ({ img: await (await S.fileBlob(d.archivo)).arrayBuffer(), png: /png/i.test(d.mime || d.nombre) }), '', file, bajarRaw(d));
        else add(nivel, d.nombre, null, 'no incluido: archivo de Excel/Word u otro formato', file, bajarRaw(d));
      };
      if (o.generales) {
        for (const c of A.carpetasEnt(ent)) {
          if (ocE.has(c.k)) continue;
          if (c.k === 'equipos') continue;
          const lista = docsGen.filter((d) => d.carpeta === c.k).sort((a, b) => String(a.subcarpeta || '').localeCompare(String(b.subcarpeta || ''), 'es', { numeric: true }) || A.ordenDocs(a, b));
          const genInv = c.k === 'inventarios' && eqs.length;
          vacias.push([nom(ent, 'ent', c)]); (c.subs || []).forEach((x) => vacias.push([nom(ent, 'ent', c), x]));
          if (!lista.length && !genInv) continue;
          dir = [nom(ent, 'ent', c)]; add(0, nom(ent, 'ent', c));
          if (genInv) add(1, `Inventario de equipos biomédicos${sede ? ' · ' + sede : ''} (${eqs.length} equipos)`, async () => ({ bytes: await (await FMT.inventario({ ent, equipos: eqs, consultorios: consT, fmt: st.fmt.inventario, cons: null })).arrayBuffer() }), '', `Inventario ${ent.razon_social}${sede ? ' - ' + sede : ''}.pdf`);
          let subAnt = null;
          for (const d of lista) {
            const sub = d.subcarpeta ? d.subcarpeta.split('/').join(' › ') : '';
            dir = [nom(ent, 'ent', c), ...(d.subcarpeta ? d.subcarpeta.split('/').filter(Boolean) : [])];
            if (sub && sub !== subAnt) { add(1, sub); subAnt = sub; }
            docPieza(sub ? 2 : 1, d);
          }
        }
      }
      if (o.hv || o.mto || o.docs_eq) {
        const carpEq = CAT.CARPETAS_EQUIPO;
        const nomEq = A.carpetasEnt(ent).find((c) => c.k === 'equipos');
        const rEq = nomEq ? nom(ent, 'ent', nomEq) : '3. INFORMACIÓN DEL EQUIPO';
        dir = [rEq]; add(0, rEq);
        for (const c of [...cons, ...(!sede && eqs.some((e) => !e.consultorio_id) ? [{ id: null, nombre: 'SIN SERVICIO' }] : [])]) {
          const lista = eqs.filter((e) => (e.consultorio_id || null) === c.id);
          if (!lista.length) continue;
          const rServ = [rEq, ...(sedes.length > 1 && !sede ? [c.sede || 'Sede principal'] : []), c.nombre];
          dir = rServ; add(1, `${sedes.length > 1 && c.sede ? c.sede + ' › ' : ''}${c.nombre}`);
          for (const e of lista) {
            const oc = A.ocultasEq(ent, e);
            const rE = [...rServ, `${e.codigo_inv || ''} ${e.nombre || ''}`.trim()];
            dir = rE; add(2, `${e.codigo_inv || ''} · ${e.nombre || ''}${e.marca ? ' · ' + e.marca : ''}${e.serie ? ' · S/N ' + e.serie : ''}`);
            const dEq = docsT.filter((d) => d.equipo_id === e.id || (d.equipos_rel || []).includes(e.id));
            for (const k of A.carpetasEq(ent, e)) {
              if (oc.has(k.k)) continue;
              if (k.k === 'manual' && !o.manuales) continue;
              const nk = nom(ent, 'eq', k, e);
              dir = [...rE, nk]; vacias.push(dir);
              if (k.k === 'hoja_vida' && o.hv) add(3, `${nk}`, async () => ({ bytes: await (await FMT.hojaVida({ eq: e, ent, cons: c.id ? c : null, fmt: st.fmt.hoja_vida })).arrayBuffer() }), '', `Hoja de vida ${e.codigo_inv || ''} ${e.nombre || ''}.pdf`);
              if (o.mto && /^mto:/.test(k.gen || '')) {
                const tipo = k.gen.split(':')[1];
                for (const m of mtosT.filter((x) => x.equipo_id === e.id && x.tipo === tipo)) {
                  const fmt = st.fmt[tipo === 'metrologia' ? 'metrologia' : 'mto_' + tipo];
                  const fn = tipo === 'preventivo' ? FMT.mtoPreventivo : tipo === 'correctivo' ? FMT.mtoCorrectivo : FMT.metrologia;
                  add(3, `${nk} · Reporte ${m.numero || ''} · ${UI.fecha(m.fecha)}`, async () => ({ bytes: await (await fn({ m, eq: e, ent, cons: c.id ? c : null, fmt })).arrayBuffer() }), '', `${String(m.fecha || '').slice(0, 10)} Reporte ${tipo === 'metrologia' ? 'metrología' : 'mantenimiento ' + tipo} ${m.numero || ''} ${e.codigo_inv || ''}.pdf`);
                }
              }
              if (o.docs_eq || (k.k === 'hoja_vida' && o.hv) || (/^mto:/.test(k.gen || '') && o.mto)) {
                for (const d of dEq.filter((x) => x.carpeta === k.k).sort(A.ordenDocs)) { const p = piezas.length; docPieza(3, d); piezas[p].titulo = `${nk} · ${d.nombre}`; }
              }
            }
          }
        }
      }
      const conFuente = piezas.filter((p) => p.fuente);
      if (!conFuente.length && !piezas.some((p) => p.raw)) { cerrar(); return toast('La carpeta no tiene documentos con esas opciones.', true); }
      if (o.formato !== 'pdf') { await zipear(ent, sede, piezas, { vacias, avance, cancelado: () => cancelado }); cerrar(); return; }

      // ---- unir
      const { PDFDocument, StandardFonts, rgb } = PDFLib;
      const out = await PDFDocument.create();
      const fN = await out.embedFont(StandardFonts.Helvetica);
      let hecho = 0;
      for (const p of piezas) {
        if (cancelado) throw new Error('__cancel');
        p.pagina = out.getPageCount() + 1;
        if (!p.fuente) continue;
        hecho++; avance('Uniendo documentos…', hecho, conFuente.length, `${hecho} de ${conFuente.length} · ${limpio(p.titulo).slice(0, 80)}`);
        try {
          const r = await p.fuente();
          if (r?.bytes) {
            const src = await PDFDocument.load(r.bytes, { ignoreEncryption: true });
            const pags = await out.copyPages(src, src.getPageIndices()); pags.forEach((x) => out.addPage(x));
            p.paginas = pags.length;
          } else if (r?.img) {
            const im = r.png ? await out.embedPng(r.img) : await out.embedJpg(r.img);
            const W = 612, H = 792, M = 30; const esc = Math.min((W - 2 * M) / im.width, (H - 2 * M - 20) / im.height, 1);
            const pg = out.addPage([W, H]); pg.drawImage(im, { x: (W - im.width * esc) / 2, y: (H - 20 - im.height * esc) / 2, width: im.width * esc, height: im.height * esc });
            pg.drawText(limpioPDF(p.titulo, fN).slice(0, 110), { x: M, y: H - 22, size: 8, font: fN, color: rgb(0.3, 0.3, 0.3) }); p.paginas = 1;
          }
        } catch (e) { console.warn('No se pudo unir', p.titulo, e); p.nota = 'no incluido: el archivo está dañado o protegido'; p.pagina = null; }
      }
      if (cancelado) throw new Error('__cancel');
      avance('Armando portada e índice…', 1, 1);

      // ---- portada + índice (jsPDF) y se insertan al principio
      const lineas = piezas.filter((p) => p.nivel < 3 || p.fuente || p.nota);
      const POR_PAG = 52; const pagsIndice = Math.max(1, Math.ceil(lineas.length / POR_PAG));
      const offset = 1 + pagsIndice;
      const doc = PDF.nuevo();
      const W = doc.internal.pageSize.getWidth(), Hh = doc.internal.pageSize.getHeight();
      // portada
      try { if (window.IBCOL_LOGO) doc.addImage(window.IBCOL_LOGO, 'JPEG', W / 2 - 35, 30, 70, 40); } catch { /* sin logo */ }
      try { if (ent.logo) doc.addImage(ent.logo, /png/i.test(ent.logo.slice(0, 30)) ? 'PNG' : 'JPEG', W / 2 - 25, 80, 50, 30); } catch { /* sin logo */ }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(0, 110, 140);
      doc.text('CARPETA DE GESTIÓN DE TECNOLOGÍA BIOMÉDICA', W / 2, 130, { align: 'center', maxWidth: W - 40 });
      doc.setTextColor(30); doc.setFontSize(15); doc.text(doc.splitTextToSize(String(ent.razon_social || '').toUpperCase(), W - 40), W / 2, 160, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
      [sede ? `Sede: ${sede}` : 'Todas las sedes', `NIT ${ent.nit || '—'} · REPS ${ent.reps || '—'}`, [ent.direccion, ent.ciudad].filter(Boolean).join(', '), '',
        `${eqs.length} equipos biomédicos · ${out.getPageCount() + offset} páginas`, `Generado el ${new Date().toLocaleString('es-CO')}`, '',
        st.emp?.razon_social || 'IBCOL Ingeniería Biomédica de Colombia', `${st.emp?.telefono || '3146872775'} · ${st.emp?.correo || 'ibcolgerencia@gmail.com'}`]
        .forEach((l, i) => doc.text(l, W / 2, 180 + i * 7, { align: 'center' }));
      // índice
      let y = 0, enPag = POR_PAG;
      lineas.forEach((p) => {
        if (enPag >= POR_PAG) { doc.addPage(); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(0, 110, 140); doc.text('ÍNDICE', 14, 18); doc.setTextColor(30); y = 26; enPag = 0; }
        const x = 14 + p.nivel * 5; const pg = p.pagina ? String(p.pagina + offset) : '';
        doc.setFont('helvetica', p.nivel === 0 ? 'bold' : 'normal'); doc.setFontSize(p.nivel === 0 ? 9.5 : p.nivel === 1 ? 8.5 : 7.8);
        doc.setTextColor(p.nota && !p.pagina ? 150 : 30);
        const txt = limpio(p.titulo) + (p.nota ? `  (${p.nota})` : '');
        const t = doc.splitTextToSize(txt, W - x - 30)[0];
        doc.text(t, x, y);
        if (pg && p.fuente) { const tw = doc.getTextWidth(t); doc.setTextColor(170); let px = x + tw + 2; while (px < W - 24) { doc.text('.', px, y); px += 1.6; } doc.setTextColor(30); doc.text(pg, W - 14, y, { align: 'right' }); }
        else if (pg && p.nivel < 3) { doc.setTextColor(120); doc.text(pg, W - 14, y, { align: 'right' }); doc.setTextColor(30); }
        y += 5; enPag++;
      });
      while (doc.getNumberOfPages() < offset) doc.addPage();
      const pre = await PDFDocument.load(doc.output('arraybuffer'));
      const prePags = await out.copyPages(pre, pre.getPageIndices());
      prePags.slice(0, offset).forEach((x, i) => out.insertPage(i, x));
      // numeración en todas las páginas
      const total = out.getPageCount();
      out.getPages().forEach((pg, i) => { if (i === 0) return; const { width } = pg.getSize(); pg.drawText(`${i + 1} / ${total}`, { x: width - 52, y: 8, size: 7, font: fN, color: rgb(0.45, 0.45, 0.45) }); });
      out.setTitle(`Carpeta ${ent.razon_social}`); out.setAuthor(st.emp?.razon_social || 'IBCOL'); out.setProducer('Gestor Biomédico IBCOL');
      const blob = new Blob([await out.save()], { type: 'application/pdf' });
      cerrar();
      const nombre = `Carpeta completa ${ent.razon_social}${sede ? ' - ' + sede : ''} ${UI.hoy()}.pdf`.replace(/[\\/:*?"<>|]+/g, '-');
      S.log('DESCARGA', 'entidades', ent.id, `Carpeta completa en PDF (${total} páginas)`);
      const noInc = piezas.filter((p) => p.nota && !p.pagina).length;
      toast(`PDF listo: ${total} páginas${noInc ? ` · ${noInc} archivo(s) no se pudieron unir (ver índice)` : ''}`);
      UI.descargar(blob, nombre);
    } catch (e) {
      cerrar();
      if (e.message === '__cancel') return toast('Descarga cancelada');
      console.error(e); toast('No se pudo armar el PDF: ' + (e.message || e), true);
    }
  }
  // ------------------------------------------------------------------ descarga en carpetas (.zip) con la misma estructura del gestor
  const cargarZip = () => window.JSZip ? Promise.resolve() : new Promise((ok, mal) => { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'; sc.onload = ok; sc.onerror = () => mal(new Error('No se pudo cargar el compresor ZIP (revise la conexión)')); document.head.appendChild(sc); });
  const seg = (t) => limpio(t).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').replace(/[. ]+$/, '').slice(0, 90) || 'sin nombre';
  async function zipear(ent, sede, piezas, { vacias = [], avance, cancelado }) {
    await cargarZip();
    const zip = new JSZip(); const raiz = seg(`${ent.razon_social}${sede ? ' - ' + sede : ''}`);
    const usados = new Set(); const fallas = [];
    const items = piezas.filter((p) => p.fuente || p.raw);
    // carpetas vacías también (para que se vea la misma estructura)
    [...vacias, ...piezas.map((p) => p.dir)].forEach((d) => { if (d?.length) zip.folder([raiz, ...d.map(seg)].join('/')); });
    let i = 0;
    for (const p of items) {
      if (cancelado()) throw new Error('__cancel');
      i++; avance('Descargando y organizando en carpetas…', i, items.length, `${i} de ${items.length} · ${limpio(p.file || p.titulo).slice(0, 80)}`);
      let nombre = seg(p.file || p.titulo); if (p.fuente && !p.raw && !/\.pdf$/i.test(nombre)) nombre += '.pdf';
      let ruta = [raiz, ...p.dir.map(seg), nombre].join('/');
      for (let n = 2; usados.has(ruta.toLowerCase()); n++) ruta = [raiz, ...p.dir.map(seg), nombre.replace(/(\.[^.]+)?$/, ` (${n})$1`)].join('/');
      usados.add(ruta.toLowerCase());
      try {
        const bytes = p.raw ? await p.raw() : (await p.fuente()).bytes;
        zip.file(ruta, bytes, { binary: true, compression: /\.pdf$|\.(png|jpe?g|zip)$/i.test(ruta) ? 'STORE' : 'DEFLATE' });
      } catch (e) { console.warn('No se pudo agregar', ruta, e); fallas.push(ruta.replace(raiz + '/', '')); }
    }
    if (fallas.length) zip.file(`${raiz}/ARCHIVOS NO INCLUIDOS.txt`, `Estos archivos no se pudieron descargar (dañados o no encontrados):\r\n\r\n${fallas.join('\r\n')}`);
    avance('Comprimiendo…', 0, 100);
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', streamFiles: true }, (m) => avance('Comprimiendo…', m.percent, 100));
    const nombre = `Carpeta ${ent.razon_social}${sede ? ' - ' + sede : ''} ${UI.hoy()}.zip`.replace(/[\\/:*?"<>|]+/g, '-');
    S.log('DESCARGA', 'entidades', ent.id, `Carpeta completa en carpetas (.zip, ${items.length - fallas.length} archivos)`);
    toast(`Carpeta lista: ${items.length - fallas.length} archivos${fallas.length ? ` · ${fallas.length} no se pudieron descargar (ver ARCHIVOS NO INCLUIDOS.txt)` : ''}`);
    UI.descargar(blob, nombre);
  }
  const limpioPDF = (t, font) => { let out = ''; for (const ch of String(t)) { try { font.encodeText(ch); out += ch; } catch { out += ch.normalize('NFD').replace(/[̀-ͯ]/g, '') || '?'; } } return out; };
})();
