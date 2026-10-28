// =====================================================================
//  Revisión de documentos por contenido (+ IA)
//  Abre cada PDF de los equipos, lee su texto y decide a qué equipo del
//  inventario pertenece: código de inventario, serie, activo fijo, modelo,
//  marca y nombre. Lo que no se pueda decidir con certeza se consulta a la IA.
//  Nada se mueve sin que el propietario lo confirme en la vista previa.
// =====================================================================
(() => {
  const A = window.APP, S = A.S;
  const { h, toast, modal } = UI;
  const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  const comp = (t) => norm(t).replace(/[^A-Z0-9]/g, '');
  const cacheTxt = new Map();
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  async function textoPDF(doc) {
    if (cacheTxt.has(doc.id)) return cacheTxt.get(doc.id);
    let t = '';
    try {
      const b = await S.fileBlob(doc.archivo);
      if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(await b.arrayBuffer()) }).promise;
      for (let p = 1; p <= Math.min(3, pdf.numPages); p++) t += (await (await pdf.getPage(p)).getTextContent()).items.map((i) => i.str).join(' ') + '\n';
    } catch (e) { t = ''; }
    t = t.replace(/\s+/g, ' ').trim();
    cacheTxt.set(doc.id, t);
    return t;
  }

  const numFinal = (v) => { const m = String(v || '').match(/(\d{1,4})\s*$/); return m ? Number(m[1]) : null; };

  // Puntaje de coincidencia entre un texto y un equipo, con las razones
  A.puntajeEquipo = (texto, e) => {
    const T = ' ' + norm(texto) + ' ', TC = comp(texto); let p = 0; const por = [];
    const c = comp(e.codigo_inv);
    if (c.length >= 5 && TC.includes(c)) { p += 10; por.push('código ' + e.codigo_inv); }
    else {
      const m = norm(e.codigo_inv).match(/([A-Z]{2,5})[\s-]*0*(\d{1,4})$/);
      if (m && new RegExp(`[^A-Z]${m[1]}[\\s.-]*0*${m[2]}(?!\\d)`).test(T)) { p += 7; por.push('código ' + m[1] + '-' + m[2]); }
    }
    const s = comp(e.serie);
    if (s.length >= 5 && TC.includes(s)) { p += 8; por.push('serie ' + e.serie); }
    const af = numFinal(e.activo_fijo);
    if (af !== null) {
      const re = /(?:COD\.?\s*A\.?\s?F\.?|ACTIVO\s*FIJO|[^A-Z]A\.\s?F\.)\s*(?:N[°O.]*)?[:\s]*(\d{1,8}(?: \d{3}(?!\d))?)/g; let m;
      while ((m = re.exec(T))) { const n = numFinal(m[1].trim()); if (n === af) { p += 6; por.push('activo fijo ' + e.activo_fijo); break; } }
    }
    const mo = comp(e.modelo), mo1 = comp(String(e.modelo || '').split(/\s+/)[0]);
    if (mo.length >= 3 && TC.includes(mo)) { p += 4; por.push('modelo ' + e.modelo); }
    else if (mo1.length >= 4 && TC.includes(mo1)) { p += 2; por.push('modelo ' + e.modelo); }
    if (String(e.marca || '').split(/[\s/()]+/).some((x) => comp(x).length >= 3 && TC.includes(comp(x)))) p += 1;
    if (comp(e.nombre).length >= 5 && TC.includes(comp(e.nombre))) { p += 3; por.push('nombre'); }
    return { p, por };
  };

  // Decide el equipo de un documento: contenido primero, nombre del archivo como apoyo
  A.equipoPorContenido = (doc, texto, eqs) => {
    const filas = eqs.map((e) => {
      const ct = A.puntajeEquipo(texto, e), fn = A.puntajeEquipo(doc.nombre, e);
      return { e, p: ct.p + fn.p * 0.6, ct: ct.p, por: ct.por.length ? ct.por : fn.por.map((x) => x + ' (nombre del archivo)') };
    }).sort((a, b) => b.p - a.p);
    const [g, seg] = filas; if (!g) return null;
    const margen = g.p - (seg?.p || 0);
    return { e: g.e, p: g.p, ct: g.ct, por: g.por, seguro: g.p >= 8 && margen >= 4, margen };
  };

  // Consulta a la IA los documentos que no se pudieron decidir
  async function preguntarIA(pendientes, eqs, prog) {
    const lista = eqs.map((e) => `${e.codigo_inv} | ${e.nombre} | marca ${e.marca || '-'} | modelo ${e.modelo || '-'} | serie ${e.serie || '-'} | activo fijo ${e.activo_fijo || '-'}`).join('\n');
    const res = new Map();
    for (let i = 0; i < pendientes.length; i += 5) {
      const lote = pendientes.slice(i, i + 5);
      prog(`Consultando a la IA… ${Math.min(i + 5, pendientes.length)} de ${pendientes.length}`);
      const contexto = `EQUIPOS DEL INVENTARIO (código | nombre | marca | modelo | serie | activo fijo):\n${lista}\n\nDOCUMENTOS:\n` +
        lote.map((x) => `### DOC ${x.doc.id}\nArchivo: ${x.doc.nombre}\nCarpeta: ${x.doc.carpeta}\nTexto (extracto): ${x.texto.slice(0, 1200) || '(sin texto legible)'}`).join('\n\n');
      const instruccion = 'Para cada documento indica a qué equipo del inventario pertenece, según su contenido (código, serie, activo fijo, marca, modelo, tipo de equipo). ' +
        'Responde SOLO con un arreglo JSON, sin texto adicional ni Markdown: [{"doc":"<id>","codigo":"<código del inventario o null>","confianza":"alta|media|baja","motivo":"<máx. 12 palabras>"}]. ' +
        'Si el documento es genérico y aplica a varios equipos iguales, o no hay datos suficientes, usa codigo null.';
      let txt = null, err = '';
      for (let intento = 0; intento < 2 && txt === null; intento++) {
        try {
          const lim = new Promise((_, rej) => setTimeout(() => rej(new Error('la IA no respondió a tiempo')), 75000));
          { const r = await Promise.race([S.ia({ instruccion, contexto }), lim]); txt = (typeof r === 'string' ? r : r?.texto) || ''; }
        } catch (e) { err = e.message; if (!/demand|overload|unavailable|503|504|546|429|rate|try again|tiempo|non-2xx/i.test(err)) break; prog(`La IA está ocupada, reintentando…`); await espera(5000); }
      }
      if (txt === null) throw new Error(err || 'La IA no respondió');
      try {
        const arr = JSON.parse((txt.match(/\[[\s\S]*\]/) || ['[]'])[0]);
        arr.forEach((r) => { const e = eqs.find((x) => comp(x.codigo_inv) === comp(r.codigo)); if (r.doc) res.set(String(r.doc), { e, confianza: r.confianza, motivo: r.motivo }); });
      } catch (e) { /* respuesta no interpretable: se deja como está */ }
    }
    return res;
  }

  A.revisarDocumentos = async (ent, { auto = false } = {}) => {
    const m = modal({ titulo: `Revisar documentos de ${ent.razon_social}`, size: 'wide',
      cuerpo: `<div class="form"><p>Abro cada documento de los equipos, leo su contenido y verifico a qué equipo del inventario corresponde (código, serie, activo fijo, modelo y marca).</p><p class="muted" data-prog>Preparando…</p></div>` });
    const prog = (t) => { const el = m.body.querySelector('[data-prog]'); if (el) el.textContent = t; };
    try {
      const [eqs, docsTodos, cons] = await Promise.all([S.list('equipos', { entidad_id: ent.id }), S.list('documentos', { entidad_id: ent.id }), S.list('consultorios', { entidad_id: ent.id })]);
      const docs = docsTodos.filter((d) => d.equipo_id && /\.pdf$/i.test(d.nombre || d.archivo || ''));
      if (!eqs.length || !docs.length) { m.cerrar(); if (!auto) toast('No hay documentos de equipos para revisar'); return; }
      const eqDe = (id) => eqs.find((e) => e.id === id);
      const srv = (e) => cons.find((c) => c.id === e?.consultorio_id)?.nombre || '';
      const etq = (e) => (e ? `${e.nombre} <span class="mono">${h(e.codigo_inv)}</span>` : '—');
      const resultados = [];
      let n = 0;
      for (const d of docs) {
        prog(`Leyendo documento ${++n} de ${docs.length}: ${d.nombre}`);
        if (!document.body.contains(m.el)) return; // cancelado
        const texto = await textoPDF(d);
        resultados.push({ doc: d, texto, dec: A.equipoPorContenido(d, texto, eqs) });
      }
      // documentos con el mismo contenido (copias) → no se mueven, se avisan
      const firma = (t) => comp(t).slice(0, 4000);
      const propuestas = [], dudosos = [], avisos = [];
      let correctos = 0, sinDatos = 0;
      for (const r of resultados) {
        const actual = eqDe(r.doc.equipo_id);
        if (r.dec?.seguro) {
          if (r.dec.e.id === r.doc.equipo_id) { correctos++; continue; }
          const copia = r.texto.length > 200 && resultados.find((o) => o !== r && o.doc.equipo_id === r.dec.e.id && o.doc.carpeta === r.doc.carpeta && firma(o.texto) === firma(r.texto));
          const yaTiene = !copia && ['hoja_vida', 'registro_sanitario', 'importacion', 'factura'].includes(r.doc.carpeta) && resultados.find((o) => o !== r && o.doc.equipo_id === r.dec.e.id && o.doc.carpeta === r.doc.carpeta && A.equipoPorContenido(o.doc, o.texto, eqs)?.e.id === r.dec.e.id);
          if (yaTiene) { avisos.push({ r, actual, msg: `Por dentro tiene los datos de ${r.dec.e.nombre} ${r.dec.e.codigo_inv} (${r.dec.por.join(', ')}), y ese equipo ya tiene su propio documento «${yaTiene.doc.nombre}». Parece un archivo equivocado: reemplácelo por el documento correcto de ${actual?.nombre || 'este equipo'}.` }); continue; }
          if (copia) { avisos.push({ r, actual, msg: `Su contenido es idéntico a «${copia.doc.nombre}» de ${r.dec.e.nombre} ${r.dec.e.codigo_inv}. Parece que se guardó un archivo equivocado: reemplácelo por el documento correcto de este equipo.` }); continue; }
          propuestas.push({ r, actual, destino: r.dec.e, motivo: `El documento indica ${r.dec.por.join(', ')}`, origen: 'contenido', marcar: true });
        } else if (r.texto.length > 80 && !(r.dec && r.dec.e.id === r.doc.equipo_id && r.dec.ct >= 6)) dudosos.push(r);
        else correctos++;
      }
      // IA para los dudosos con texto
      let notaIA = '';
      if (dudosos.length) {
        try {
          const ia = await preguntarIA(dudosos, eqs, prog);
          for (const r of dudosos) {
            const x = ia.get(String(r.doc.id)); const actual = eqDe(r.doc.equipo_id);
            if (x?.e && x.e.id !== r.doc.equipo_id && x.confianza !== 'baja') propuestas.push({ r, actual, destino: x.e, motivo: `IA (${x.confianza}): ${x.motivo || ''}`, origen: 'ia', marcar: x.confianza === 'alta' });
            else if (x?.e && x.e.id === r.doc.equipo_id) correctos++;
            else sinDatos++;
          }
          notaIA = `La IA revisó ${dudosos.length} documento${dudosos.length === 1 ? '' : 's'} sin datos claros.`;
        } catch (e) { notaIA = `No se pudo consultar la IA (${e.message}); se usó solo la lectura del contenido.`; sinDatos += dudosos.length; }
      }
      const sinTexto = resultados.filter((r) => r.texto.length <= 80).length;
      m.cerrar();
      if (!propuestas.length && !avisos.length) { if (!auto) toast(`Revisados ${docs.length} documentos: todos están en el equipo correcto`); return; }
      const carpetaN = (k) => (CAT.CARPETAS_EQUIPO.find((c) => c.k === k)?.n || k);
      const prev = modal({ titulo: `Revisión de documentos · ${ent.razon_social}`, size: 'wide',
        cuerpo: `<div class="form">
          <p>Revisé <b>${docs.length} documentos</b>: <b>${correctos}</b> coinciden con su equipo${sinTexto ? ` (${sinTexto} escaneados sin texto se ubicaron por el nombre del archivo)` : ''}.${sinDatos ? ` ${sinDatos} no traen datos que identifiquen un equipo (manuales o documentos generales) y se dejaron en la carpeta donde estaban.` : ''} ${notaIA}</p>
          ${propuestas.length ? `<p><b>${propuestas.length} documento${propuestas.length === 1 ? '' : 's'}</b> están en un equipo que no corresponde. Marque los que desea mover:</p>
          <div class="tbl-wrap" style="max-height:330px"><table class="tbl"><thead><tr><th></th><th>Documento</th><th>Carpeta</th><th>Está en</th><th>Debe ir a</th><th>Por qué</th></tr></thead><tbody>
          ${propuestas.map((p, i) => `<tr><td><input type="checkbox" data-i="${i}" ${p.marcar ? 'checked' : ''} aria-label="Mover"></td><td>${h(p.r.doc.nombre)}</td><td>${h(carpetaN(p.r.doc.carpeta))}</td><td>${etq(p.actual)}<br><small class="muted">${h(srv(p.actual))}</small></td><td><b>${etq(p.destino)}</b><br><small class="muted">${h(srv(p.destino))}</small></td><td><small>${h(p.motivo)}</small></td></tr>`).join('')}
          </tbody></table></div>` : ''}
          ${avisos.length ? `<p style="margin-top:12px"><b>Revise a mano:</b></p><ul>${avisos.map((a) => `<li><b>${h(a.r.doc.nombre)}</b> (en ${etq(a.actual)}): ${h(a.msg)}</li>`).join('')}</ul>` : ''}
        </div>`,
        acciones: propuestas.length ? [{ t: 'Cerrar' }, { t: 'Mover los marcados', cls: 'pri', fn: async (mm) => {
          const sel = [...mm.body.querySelectorAll('input[data-i]:checked')].map((x) => propuestas[+x.dataset.i]);
          for (const p of sel) await S.update('documentos', p.r.doc.id, { equipo_id: p.destino.id });
          toast(`${sel.length} documento${sel.length === 1 ? '' : 's'} movido${sel.length === 1 ? '' : 's'} a su equipo`);
          A.recargar();
        } }] : [{ t: 'Entendido' }],
      });
      return prev;
    } catch (e) { m.cerrar(); toast(e.message || String(e), true); }
  };
})();
