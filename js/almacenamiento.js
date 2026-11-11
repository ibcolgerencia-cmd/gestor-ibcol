// =====================================================================
//  ALMACENAMIENTO (solo propietario)
//  · Revisar el espacio usado en la nube.
//  · Borrar archivos huérfanos: archivos guardados que ninguna tabla del gestor
//    usa (quedan al reimportar o borrar registros). Supabase solo libera espacio
//    si se borran con la API de Storage, por eso lo hace la app.
//    SQL: supabase/limpieza_almacenamiento.sql
//  · Comprimir PDF: reduce las imágenes escaneadas (JPEG) dentro del PDF. El texto,
//    las tablas y los dibujos no se tocan. No se modifican PDF con firma digital.
//    Se aplica sola al subir PDF grandes y con un botón a los ya guardados.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, toast, modal, confirmar } = UI;
  const esProp = () => st.perfil?.rol === 'propietario';
  const mb = (b) => `${(Number(b || 0) / 1048576).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MB`;
  const tam = (b) => (Number(b) >= 1073741824 ? `${(b / 1073741824).toLocaleString('es-CO', { maximumFractionDigits: 2 })} GB` : mb(b));

  // ---------------------------------------------------------------- compresión de PDF
  const MIN_PDF = 1.5 * 1048576;      // solo PDF de más de 1,5 MB
  async function comprimirPDF(blob, { maxLado = 2000, calidad = 0.65 } = {}) {
    if (!window.PDFLib || !blob || blob.size < MIN_PDF) return blob;
    const buf = new Uint8Array(await blob.arrayBuffer());
    // PDF con firma digital (certificados firmados): no se tocan para no invalidar la firma
    const muestra = new TextDecoder('latin1').decode(buf.length > 4e6 ? buf.subarray(buf.length - 4e6) : buf);
    if (/\/ByteRange\s*\[/.test(muestra) || /\/Type\s*\/Sig\b/.test(muestra)) return blob;
    const { PDFDocument, PDFName, PDFRawStream, PDFArray } = PDFLib;
    let pdf; try { pdf = await PDFDocument.load(buf, { updateMetadata: false }); } catch { return blob; }
    const N = (n) => PDFName.of(n);
    let cambios = 0;
    for (const [ref, obj] of pdf.context.enumerateIndirectObjects()) {
      if (!(obj instanceof PDFRawStream)) continue;
      const d = obj.dict;
      // 1) sin pérdida: fuentes, dibujos e imágenes guardados SIN comprimir se comprimen con Flate (como un ZIP)
      if (!d.get(N('Filter')) && ![N('Metadata'), N('XRef'), N('ObjStm')].includes(d.get(N('Type')))) {
        const raw = obj.getContents();
        if (raw.length > 4096) {
          try {
            const z = pdf.context.flateStream(raw, {});
            if (z.getContents().length < raw.length * 0.9) {
              for (const [k, v] of d.entries()) if (![N('Length'), N('Filter'), N('DecodeParms')].includes(k)) z.dict.set(k, v);
              pdf.context.assign(ref, z); cambios++;
            }
          } catch { /* se deja igual */ }
        }
        continue;
      }
      // 2) imágenes escaneadas JPEG: se reducen a ~2000 px y calidad media
      if (d.get(N('Subtype')) !== N('Image')) continue;
      let filt = d.get(N('Filter')); if (filt instanceof PDFArray) filt = filt.size() === 1 ? filt.get(0) : null;
      if (filt !== N('DCTDecode')) continue;
      if (d.get(N('SMask')) || d.get(N('Mask')) || d.get(N('Decode')) || d.get(N('DecodeParms'))) continue;
      const cs = d.get(N('ColorSpace'));
      let ok = cs === N('DeviceRGB') || cs === N('DeviceGray');
      if (!ok && cs instanceof PDFArray && cs.get(0) === N('ICCBased')) { const icc = pdf.context.lookup(cs.get(1)); const n = icc?.dict?.get(N('N'))?.asNumber?.(); ok = n === 1 || n === 3; }
      if (!ok) continue;
      const bytes = obj.getContents(); if (bytes.length < 80000) continue;
      try {
        const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
        const k = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
        const w = Math.max(1, Math.round(bmp.width * k)), hh = Math.max(1, Math.round(bmp.height * k));
        const c = document.createElement('canvas'); c.width = w; c.height = hh;
        const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, hh); ctx.drawImage(bmp, 0, 0, w, hh); bmp.close?.();
        const nb = new Uint8Array(await (await new Promise((r) => c.toBlob(r, 'image/jpeg', calidad))).arrayBuffer());
        if (nb.length > bytes.length * 0.85) continue;
        pdf.context.assign(ref, pdf.context.stream(nb, { Type: 'XObject', Subtype: 'Image', Width: w, Height: hh, ColorSpace: 'DeviceRGB', BitsPerComponent: 8, Filter: 'DCTDecode' }));
        cambios++;
      } catch { /* imagen que el navegador no puede leer: se deja igual */ }
    }
    if (!cambios) return blob;
    try {
      const out = await pdf.save({ useObjectStreams: true });
      await PDFDocument.load(out, { updateMetadata: false }); // verificación: el PDF nuevo abre bien
      return out.length < blob.size * 0.9 ? new Blob([out], { type: 'application/pdf' }) : blob;
    } catch { return blob; }
  }
  A.comprimirPDF = comprimirPDF;
  // la nube llama esta función antes de subir cualquier archivo
  window.IBCOL_COMPRIMIR = async (path, blob) => (/\.pdf$/i.test(path) || blob?.type === 'application/pdf' ? comprimirPDF(blob) : blob);

  // ---------------------------------------------------------------- panel en Mi empresa
  const faltaSQL = (e) => /archivos_huerfanos|almacenamiento_resumen|function|schema cache/i.test(e?.message || '');
  A.panelAlmacenamiento = async (cont) => {
    if (!cont || !esProp() || S.modo !== 'nube') return;
    cont.innerHTML = `<div class="actions" style="flex-wrap:wrap;gap:6px;margin-top:8px"><button class="btn sm" data-alm="revisar">Revisar espacio</button></div><div data-alm-res class="muted" style="font-size:.88rem"></div>`;
    const res = cont.querySelector('[data-alm-res]');
    const revisar = async () => {
      res.textContent = 'Revisando el almacenamiento…';
      let r; try { r = (await S.rpc('almacenamiento_resumen', {}))?.[0]; } catch (e) { res.innerHTML = faltaSQL(e) ? 'Falta activar la revisión en la base de datos: ejecute <b class="mono">supabase/limpieza_almacenamiento.sql</b> en Supabase.' : h(e.message); return; }
      let r2 = null; if (S.r2) { try { const l = await S.r2Lista(); r2 = { n: l.length, b: l.reduce((x, o) => x + Number(o.tamano || 0), 0) }; } catch (e) { r2 = { error: e.message }; } }
      res.innerHTML = `<p style="margin:8px 0">${S.r2 ? `<b>Cloudflare R2</b> (10 GB gratis): ${r2?.error ? `<span style="color:#b02e26">${h(r2.error)}</span>` : `<b>${r2.n.toLocaleString('es-CO')}</b> archivos · <b>${tam(r2.b)}</b>`}<br>` : ''}
        ${S.r2 ? '<b>Supabase</b> (archivos antiguos por pasar): ' : 'Archivos en la nube: '}<b>${Number(r.archivos).toLocaleString('es-CO')}</b> · <b>${tam(r.bytes)}</b><br>
        Archivos huérfanos (no los usa ningún documento): <b>${Number(r.huerfanos).toLocaleString('es-CO')}</b> · <b>${tam(r.bytes_huerfanos)}</b></p>
        <div class="actions" style="flex-wrap:wrap;gap:6px">${Number(r.huerfanos) ? `<button class="btn sm danger" data-alm="huerfanos">Borrar ${Number(r.huerfanos).toLocaleString('es-CO')} archivos huérfanos (${tam(r.bytes_huerfanos)})</button>` : '<span class="pill ok">Sin archivos huérfanos</span>'}
        ${S.r2 && Number(r.archivos) ? `<button class="btn sm pri" data-alm="r2">Pasar ${Number(r.archivos).toLocaleString('es-CO')} archivos a Cloudflare R2</button>` : ''}
        <button class="btn sm" data-alm="comprimir">Comprimir PDF guardados</button></div>`;
    };
    cont.onclick = async (e) => {
      const b = e.target.closest('[data-alm]'); if (!b) return;
      if (b.dataset.alm === 'revisar') return revisar();
      if (b.dataset.alm === 'huerfanos') return borrarHuerfanos(res, revisar);
      if (b.dataset.alm === 'comprimir') return comprimirGuardados(res, revisar);
      if (b.dataset.alm === 'r2') return pasarAR2(revisar);
    };
  };

  async function borrarHuerfanos(res, alFinal) {
    if (!(await confirmar('Se borrarán de la nube los archivos que ningún documento del gestor usa (quedaron de importaciones repetidas o registros borrados). Los documentos que se ven en las carpetas NO se tocan. ¿Continuar?', 'Borrar huérfanos'))) return;
    let total = 0, bytes = 0, vueltas = 0, fallos = 0;
    while (vueltas++ < 40) {
      let lote; try { lote = await S.rpc('archivos_huerfanos', { p_limite: 1000 }); } catch (e) { toast(e.message, true); break; }
      if (!lote?.length) break;
      for (let i = 0; i < lote.length; i += 100) {
        const parte = lote.slice(i, i + 100);
        try { await S.removeFiles(parte.map((x) => x.nombre)); total += parte.length; bytes += parte.reduce((s, x) => s + Number(x.tamano || 0), 0); }
        catch (e) { fallos++; console.warn('borrar huérfanos', e); if (fallos > 3) break; }
        res.textContent = `Borrando archivos huérfanos… ${total.toLocaleString('es-CO')} archivos · ${tam(bytes)} liberados`;
      }
      if (fallos > 3) break;
    }
    S.log('ELIMINAR', 'storage', '', `Limpieza de huérfanos: ${total} archivos, ${tam(bytes)}`).catch?.(() => {});
    toast(`Listo: ${total.toLocaleString('es-CO')} archivos huérfanos borrados (${tam(bytes)} liberados)`, fallos > 3);
    await alFinal();
  }

  // ---------------------------------------------------------------- paso de Supabase Storage a Cloudflare R2
  async function pasarAR2(alFinal) {
    if (!(await confirmar('Se copiarán todos los archivos del gestor a Cloudflare R2 (10 GB gratis). Cuando estén todos copiados y verificados, se borran de Supabase para liberar el espacio. Los documentos siguen viéndose igual. Puede tardar varios minutos: no cierre la página. ¿Continuar?', 'Pasar a R2'))) return;
    const m = modal({ titulo: 'Pasando archivos a Cloudflare R2', size: 'sm', cuerpo: '<p data-cp>Preparando la lista de archivos…</p><p class="muted" style="font-size:.85rem">No cierre esta página.</p>', acciones: [{ t: 'Detener', fn: () => { parar = true; return false; } }] });
    const prog = (t) => { const p = m.body.querySelector('[data-cp]'); if (p) p.textContent = t; };
    let parar = false;
    try {
      const [docs, cobros, actas] = await Promise.all([S.list('documentos'), S.list('cobros').catch(() => []), S.list('actas_comite').catch(() => [])]);
      const rutas = new Set();
      [...docs, ...cobros].forEach((d) => d.archivo && rutas.add(d.archivo));
      actas.forEach((a) => { if (a.archivo) rutas.add(a.archivo); [...(a.fotos || []), ...(a.anexos || [])].forEach((x) => x?.archivo && rutas.add(x.archivo)); });
      const enR2 = new Set((await S.r2Lista()).map((o) => o.ruta));
      const pend = [...rutas].filter((p) => !enR2.has(p));
      let ok = 0, bytes = 0; const faltan = [], fallos = [];
      const t0 = Date.now();
      let i = 0;
      const trabajador = async () => {
        while (i < pend.length && !parar) {
          const p = pend[i++];
          try { const b = await S.supaBlob(p); await S.r2Subir(p, b); ok++; bytes += b.size; }
          catch (e) { (/not.?found|no existe|404/i.test(e.message || '') ? faltan : fallos).push(p); }
          prog(`${(ok + faltan.length + fallos.length).toLocaleString('es-CO')} de ${pend.length.toLocaleString('es-CO')} · ${tam(bytes)} copiados${fallos.length ? ` · ${fallos.length} con error` : ''}`);
        }
      };
      await Promise.all([trabajador(), trabajador(), trabajador(), trabajador()]);
      if (parar) { m.cerrar?.(); toast(`Detenido: ${ok} archivos copiados a R2. Puede continuar después.`); return alFinal(); }
      // reintento de los que fallaron
      for (const p of fallos.splice(0)) { try { const b = await S.supaBlob(p); await S.r2Subir(p, b); ok++; bytes += b.size; } catch { fallos.push(p); } }
      // verificación: todo lo referenciado debe estar en R2
      prog('Verificando que todos los archivos estén en R2…');
      const ya = new Set((await S.r2Lista()).map((o) => o.ruta));
      const sinCopia = [...rutas].filter((p) => !ya.has(p) && !faltan.includes(p));
      if (sinCopia.length) { m.cerrar?.(); toast(`${sinCopia.length} archivos no se pudieron copiar. No se borró nada de Supabase; vuelva a intentarlo.`, true); console.warn('sin copia', sinCopia); return alFinal(); }
      // liberar Supabase: borrar las copias que ya están en R2
      const borrar = [...rutas].filter((p) => ya.has(p));
      for (let k = 0; k < borrar.length; k += 100) { prog(`Liberando espacio en Supabase… ${Math.min(k + 100, borrar.length).toLocaleString('es-CO')} de ${borrar.length.toLocaleString('es-CO')}`); try { await S.supaBorrar(borrar.slice(k, k + 100)); } catch (e) { console.warn('supabase', e); } }
      m.cerrar?.();
      toast(`Listo: ${ok.toLocaleString('es-CO')} archivos pasados a Cloudflare R2 (${tam(bytes)}) en ${Math.max(1, Math.round((Date.now() - t0) / 60000))} min${faltan.length ? ` · ${faltan.length} ya no existían` : ''}`);
    } catch (e) { m.cerrar?.(); toast(e.message, true); }
    await alFinal();
  }

  async function comprimirGuardados(res, alFinal) {
    const docs = (await S.list('documentos')).filter((d) => /\.pdf$/i.test(d.archivo || d.nombre || '') && Number(d.tamano || 0) >= MIN_PDF).sort((a, b) => b.tamano - a.tamano);
    if (!docs.length) return toast('No hay PDF grandes para comprimir');
    const peso = docs.reduce((s, d) => s + Number(d.tamano || 0), 0);
    if (!(await confirmar(`Se revisarán ${docs.length} PDF de más de 1,5 MB (${tam(peso)}). Se reducen solo las imágenes escaneadas; el texto y las tablas quedan igual, y los PDF con firma digital no se modifican. Puede tardar varios minutos: no cierre la página. ¿Continuar?`, 'Comprimir'))) return;
    let n = 0, ahorro = 0, hechos = 0; const t0 = Date.now(); let cancelar = false;
    const m = modal({ titulo: 'Comprimiendo PDF', size: 'sm', cuerpo: '<p data-cp>Preparando…</p><p class="muted" style="font-size:.85rem">Puede seguir usando otra pestaña. No cierre esta.</p>', acciones: [{ t: 'Detener', fn: () => { cancelar = true; return false; } }] });
    const prog = () => m.body.querySelector('[data-cp]');
    for (const d of docs) {
      if (cancelar) break;
      hechos++;
      prog().textContent = `${hechos} de ${docs.length} · ${n} reducidos · ${tam(ahorro)} ahorrados · ${h(d.nombre).slice(0, 60)}`;
      try {
        const orig = await S.fileBlob(d.archivo);
        const nuevo = await comprimirPDF(orig);
        if (nuevo === orig || nuevo.size >= orig.size) continue;
        await S.reemplazarArchivo(d.archivo, nuevo);
        await S.update('documentos', d.id, { tamano: nuevo.size });
        n++; ahorro += orig.size - nuevo.size;
      } catch (e) { console.warn('comprimir', d.nombre, e); }
    }
    m.cerrar?.();
    toast(`${n} PDF comprimidos · ${tam(ahorro)} ahorrados (${Math.round((Date.now() - t0) / 60000)} min)`);
    await alFinal();
  }
})();
