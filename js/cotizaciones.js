// =====================================================================
//  INVENTARIO DE PRECIOS PARA COTIZACIONES (solo propietario)
//  Equipos biomédicos, servicios de mantenimiento, calibración y otros.
//  · Tabla catalogo_cotizacion: solo la ve y la modifica el propietario.
//  · El detalle (tabla de ítems y valores) de cada cotización queda en
//    cotizaciones_detalle, también solo del propietario. El cliente final
//    solo ve el valor total de la cotización (más IVA si aplica).
//  Base de datos: supabase/cotizaciones_inventario.sql
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, confirmar, leer, f } = UI;
  const esProp = () => st.perfil?.rol === 'propietario';
  const TIPOS = ['Mantenimiento y metrología', 'Mantenimiento correctivo', 'Equipo biomédico', 'Repuesto o insumo', 'Otro servicio'];
  const UNIDADES = ['Unidad', 'Equipo', 'Servicio', 'Visita', 'Hora', 'Mes', 'Global'];
  const pesos = (n) => PDF.pesos(Number(n) || 0);
  const nrm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const num = (v) => { if (typeof v === 'number') return v; const s = String(v ?? '').replace(/[^\d,.-]/g, ''); return Number(s.includes(',') && !s.includes('.') ? s.replace(',', '.') : s.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.')) || 0; };
  let faltaTabla = false;

  const cargar = async () => {
    try { const l = await S.list('catalogo_cotizacion', {}, 'descripcion'); faltaTabla = false; return l; }
    catch (e) { if (/catalogo_cotizacion|schema cache|does not exist|relation/i.test(e.message || '')) { faltaTabla = true; return []; } throw e; }
  };
  const avisoSQL = '<div class="panel" style="margin-bottom:12px;border-left:4px solid #d9a400;background:rgba(217,164,0,.08)">Falta activar el inventario de precios en la base de datos: ejecute <b class="mono">supabase/cotizaciones_inventario.sql</b> en Supabase &gt; SQL Editor.</div>';

  // ---------------------------------------------------------------- ítems y total de una cotización
  A.totalCot = (x) => (x?.total != null && x.total !== '' ? Number(x.total) || 0 : (x?.items || []).reduce((s, i) => s + (Number(i.cantidad) || 0) * (Number(i.valor) || 0), 0) * (1 + (Number(x?.iva) || 0) / 100));
  A.itemsCot = async (x) => {
    if (!x || !esProp()) return [];
    try { const d = await S.get('cotizaciones_detalle', x.id); if (d?.items?.length) return d.items; } catch {}
    return x.items || [];
  };
  // guarda el detalle aparte (solo propietario); devuelve true si quedó en la tabla privada
  A.guardarItemsCot = async (id, items) => {
    try { await S.upsert('cotizaciones_detalle', { id, items }); return true; }
    catch (e) { console.warn('cotizaciones_detalle', e.message); return false; }
  };

  // ---------------------------------------------------------------- precios por equipo
  // valor = mantenimiento preventivo (o valor unitario para equipos, repuestos y otros servicios)
  // valor_metrologia = metrología / calibración (vacío = No aplica)
  const MYM = 'Mantenimiento y metrología';
  const esMyM = (x) => x.tipo === MYM;
  const tieneMet = (x) => x.valor_metrologia != null && x.valor_metrologia !== '';
  const noAplica = '<span class="bad-t" style="color:#c0392b;font-weight:600">No aplica</span>';
  const ordenar = (l) => [...l].sort((a, b) => String(a.codigo || '~').localeCompare(String(b.codigo || '~'), 'es', { numeric: true }) || String(a.descripcion).localeCompare(String(b.descripcion), 'es'));

  // ---------------------------------------------------------------- vista: inventario de precios
  A.listaCatalogo = async (el) => {
    if (!esProp()) { el.innerHTML = '<div class="empty">Solo el propietario puede ver el inventario de precios.</div>'; return; }
    const lista = ordenar(await cargar());
    st.catTipo = st.catTipo || ''; st.catQ = st.catQ || '';
    el.innerHTML = `<section class="panel"><header><h2>Inventario para cotizaciones</h2>
        <div class="actions" style="margin:0;gap:6px;flex-wrap:wrap"><button class="btn" data-cat="plantilla">${I.excel} Plantilla Excel</button>
        <label class="btn" style="cursor:pointer">${I.subir} Importar Excel<input type="file" accept=".xlsx,.xls,.csv" data-cat-xls hidden></label>
        <button class="btn pri" data-cat="nuevo">${I.mas} Nuevo ítem</button></div></header>
      ${faltaTabla ? avisoSQL : ''}
      <p class="muted" style="margin-top:0">Precios de mantenimiento preventivo y metrología por equipo, y valores de equipos biomédicos, repuestos y otros servicios. Desde aquí se agregan a las cotizaciones con «Agregar del inventario». Solo usted ve estos valores: el cliente final solo ve el total de la cotización.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <input type="search" data-cat-q placeholder="Buscar por equipo, ítem, marca o modelo…" value="${h(st.catQ)}" style="flex:1;min-width:220px">
        <select data-cat-tipo><option value="">Todos los tipos</option>${TIPOS.map((t) => `<option ${t === st.catTipo ? 'selected' : ''}>${h(t)}</option>`).join('')}</select></div>
      <div data-cat-tabla></div></section>`;
    const pintar = () => {
      const q = nrm(st.catQ);
      const l = lista.filter((x) => (!st.catTipo || x.tipo === st.catTipo) && (!q || nrm([x.codigo, x.descripcion, x.marca, x.modelo, x.tipo].join(' ')).includes(q)));
      el.querySelector('[data-cat-tabla]').innerHTML = l.length ? `<div class="tbl-wrap"><table class="tbl tbl-precios"><thead><tr><th>Ítem</th><th>Equipo / descripción</th><th>Tipo</th><th class="r">$ Mto. preventivo</th><th class="r">$ Metrología</th><th></th></tr></thead><tbody>
        ${l.map((x) => `<tr class="${x.activo === false ? 'muted' : ''}"><td class="mono">${h(x.codigo || '')}</td><td><b>${h(x.descripcion)}</b>${x.marca || x.modelo ? `<div class="muted" style="font-size:.8rem">${h([x.marca, x.modelo].filter(Boolean).join(' · '))}</div>` : ''}</td><td><span class="pill">${h(x.tipo || '')}</span></td>
          <td class="r num"><b>${pesos(x.valor)}</b>${esMyM(x) ? '' : `<div class="muted" style="font-size:.75rem">${h(x.unidad || 'Unidad')}</div>`}</td><td class="r num">${tieneMet(x) ? `<b>${pesos(x.valor_metrologia)}</b>` : esMyM(x) ? noAplica : '<span class="muted">—</span>'}</td>
          <td><div class="row-actions"><button class="icon-btn" data-cat="editar" data-id="${x.id}" aria-label="Editar">${I.edit}</button><button class="icon-btn bad" data-cat="borrar" data-id="${x.id}" aria-label="Eliminar">${I.del}</button></div></td></tr>`).join('')}
        </tbody></table></div><p class="muted" style="font-size:.8rem">${l.length} de ${lista.length} ítems</p>` : `<div class="empty">${lista.length ? 'Ningún ítem coincide con la búsqueda.' : 'Aún no hay ítems. Cree el primero o importe su lista de precios desde Excel.'}</div>`;
    };
    pintar();
    const qi = el.querySelector('[data-cat-q]'); qi.oninput = () => { st.catQ = qi.value; pintar(); };
    el.querySelector('[data-cat-tipo]').onchange = (e) => { st.catTipo = e.target.value; pintar(); };
    el.onclick = async (e) => {
      const b = e.target.closest('[data-cat]'); if (!b) return;
      const x = lista.find((y) => y.id === b.dataset.id);
      if (b.dataset.cat === 'nuevo') return formItem(null, () => A.listaCatalogo(el));
      if (b.dataset.cat === 'editar') return formItem(x, () => A.listaCatalogo(el));
      if (b.dataset.cat === 'borrar') { if (await confirmar(`¿Eliminar «${x.descripcion}» del inventario de precios? Las cotizaciones ya hechas no cambian.`)) { await S.remove('catalogo_cotizacion', x.id); toast('Ítem eliminado'); A.listaCatalogo(el); } return; }
      if (b.dataset.cat === 'plantilla') return plantilla();
    };
    el.querySelector('[data-cat-xls]').onchange = async (e) => { const file = e.target.files[0]; e.target.value = ''; if (file) await importar(file, lista, () => A.listaCatalogo(el)); };
  };

  const formItem = (x, alListo) => modal({
    titulo: x ? 'Editar ítem del inventario' : 'Nuevo ítem del inventario', size: 'sm',
    cuerpo: `<form class="form" onsubmit="return false"><div class="fields">
      ${f.sel('tipo', 'Tipo *', TIPOS, x?.tipo || MYM)}${f.input('codigo', 'Ítem / código', x?.codigo || '')}
      ${f.area('descripcion', 'Equipo o descripción *', x?.descripcion || '', { rows: 2 })}
      ${f.input('marca', 'Marca', x?.marca || '')}${f.input('modelo', 'Modelo', x?.modelo || '')}
      ${f.input('valor', '$ Mantenimiento preventivo (o valor unitario) *', x?.valor ?? '', { type: 'number', attrs: 'min="0" step="100"' })}
      ${f.input('valor_metrologia', '$ Metrología (vacío = No aplica)', x?.valor_metrologia ?? '', { type: 'number', attrs: 'min="0" step="100"' })}
      ${f.sel('unidad', 'Unidad', UNIDADES, x?.unidad || 'Equipo')}
      ${f.area('notas', 'Notas internas (no salen en la cotización)', x?.notas || '', { rows: 2 })}</div></form>`,
    acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
      const v = leer(m.body);
      if (!v.descripcion?.trim()) { toast('Escriba el equipo o la descripción', true); return false; }
      const o = { tipo: v.tipo, codigo: v.codigo?.trim() || null, descripcion: v.descripcion.trim(), marca: v.marca?.trim() || null, modelo: v.modelo?.trim() || null, unidad: v.unidad, valor: num(v.valor), valor_metrologia: String(v.valor_metrologia ?? '').trim() === '' ? null : num(v.valor_metrologia), notas: v.notas?.trim() || null, activo: true };
      try { x ? await S.update('catalogo_cotizacion', x.id, o) : await S.insert('catalogo_cotizacion', o); }
      catch (e) { if (/catalogo_cotizacion|valor_metrologia|schema cache|does not exist|relation/i.test(e.message)) { toast('Falta ejecutar supabase/cotizaciones_inventario.sql en Supabase', true); return false; } throw e; }
      toast(x ? 'Ítem actualizado' : 'Ítem agregado al inventario'); alListo?.();
    } }],
  });

  const COLS = ['Ítem', 'Tipo', 'Equipo / descripción', 'Marca', 'Modelo', 'Unidad', '$ Mto preventivo', '$ Metrología'];
  const plantilla = () => {
    const ej = [['N1', MYM, 'Tensiómetro (ejemplo)', '', '', 'Equipo', 30000, 50000], ['N2', MYM, 'Equipo de órganos (ejemplo)', '', '', 'Equipo', 30000, 'NO APLICA'], ['EQ-1', 'Equipo biomédico', 'Monitor de signos vitales (ejemplo)', 'Marca', 'Modelo', 'Unidad', 3000000, '']];
    const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet([COLS, ...ej]);
    ws['!cols'] = [{ wch: 8 }, { wch: 26 }, { wch: 50 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario'); XLSX.writeFile(wb, 'Plantilla_inventario_cotizaciones_IBCOL.xlsx');
  };
  // acepta la plantilla y también listas como «ITEM | EQUIPO | $ MMTO PREVENT | $METROLOGIA» (en varias hojas o tablas)
  const importar = async (file, actuales, alListo) => {
    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
    const tipoDe = (t, met) => TIPOS.find((x) => nrm(x) === nrm(t)) || (!t || met ? MYM : /calibr|metrolog|manten/i.test(t) ? MYM : /equipo/i.test(t) ? 'Equipo biomédico' : /repuest|insum/i.test(t) ? 'Repuesto o insumo' : 'Otro servicio');
    const nuevos = [];
    for (const nombre of wb.SheetNames) {
      const filas = XLSX.utils.sheet_to_json(wb.Sheets[nombre], { header: 1, defval: '' });
      let ci = null;
      for (const r of filas) {
        const cab = r.map((c) => nrm(c));
        if (cab.some((c) => /descrip|^equipo/.test(c)) && cab.some((c) => /mmto|manten|valor|precio|tarifa|metrolog/.test(c))) {
          const col = (re) => cab.findIndex((c) => re.test(c));
          ci = { codigo: col(/^item|codigo|cod\b|ref/), tipo: col(/^tipo/), descripcion: col(/descrip|^equipo/), marca: col(/marca/), modelo: col(/modelo/), unidad: col(/unidad|und/), valor: col(/mmto|manten|valor unit|^valor|precio|tarifa/), met: col(/metrolog|calibr/) };
          continue;
        }
        if (!ci) continue;
        const desc = String(r[ci.descripcion] ?? '').replace(/\s+/g, ' ').trim(); if (!desc) continue;
        const raw = (i) => (i >= 0 ? r[i] : '');
        const val = (v) => (v === '' || v == null || (typeof v !== 'number' && !/\d/.test(String(v))) ? null : num(v));
        const met = ci.met >= 0 ? val(raw(ci.met)) : null;
        nuevos.push({ tipo: tipoDe(String(raw(ci.tipo)), ci.met >= 0), codigo: String(raw(ci.codigo)).trim() || null, descripcion: desc, marca: String(raw(ci.marca)).trim() || null, modelo: String(raw(ci.modelo)).trim() || null,
          unidad: String(raw(ci.unidad)).trim() || 'Equipo', valor: val(raw(ci.valor)) ?? 0, valor_metrologia: met, activo: true });
      }
    }
    if (!nuevos.length) return toast('No se encontraron ítems. El archivo debe tener columnas como «Equipo» y «$ Mto preventivo» / «$ Metrología». Use la plantilla Excel.', true);
    const clave = (x) => nrm(x.codigo || x.descripcion);
    let n = 0, u = 0;
    for (const x of nuevos) {
      const ya = actuales.find((y) => clave(y) === clave(x));
      try { if (ya) { await S.update('catalogo_cotizacion', ya.id, x); u++; } else { await S.insert('catalogo_cotizacion', x); n++; } }
      catch (e) { toast(/catalogo_cotizacion|valor_metrologia|schema cache|relation/i.test(e.message) ? 'Falta ejecutar supabase/cotizaciones_inventario.sql en Supabase' : e.message, true); break; }
    }
    toast(`Inventario importado: ${n} nuevos, ${u} actualizados`); alListo?.();
  };

  // ---------------------------------------------------------------- panel para arrastrar a la cotización
  // Cada precio es una ficha que se arrastra a la tabla de ítems (en celular: tocar la ficha la agrega)
  A.panelArrastre = async (cont, alAgregar) => {
    const lista = ordenar((await cargar()).filter((x) => x.activo !== false));
    if (faltaTabla || !lista.length) { cont.innerHTML = ''; return; }
    let q = '';
    const extra = (x) => (x.marca || x.modelo ? ` (${[x.marca, x.modelo].filter(Boolean).join(' ')})` : '');
    const itemDe = (x, k) => (k === 'met'
      ? { descripcion: `Metrología / calibración ${x.descripcion}${extra(x)}`, cantidad: 1, valor: Number(x.valor_metrologia) || 0 }
      : { descripcion: esMyM(x) ? `Mantenimiento preventivo ${x.descripcion}${extra(x)}` : `${x.descripcion}${extra(x)}`, cantidad: 1, valor: Number(x.valor) || 0 });
    let abierto = true; try { abierto = localStorage.getItem('ibcol_inv_drag') !== '0'; } catch {}
    cont.innerHTML = `<details class="inv-drag" ${abierto ? 'open' : ''}><summary><b>Inventario de precios</b> <span class="muted">— arrastre un precio a la tabla de ítems (o tóquelo para agregarlo)</span></summary>
      <input type="search" data-dq placeholder="Buscar equipo o servicio…" style="width:100%;margin:8px 0">
      <div class="inv-drag-lista" data-dl></div></details>`;
    cont.querySelector('details').addEventListener('toggle', (e) => { try { localStorage.setItem('ibcol_inv_drag', e.target.open ? '1' : '0'); } catch {} });
    const pintar = () => {
      const nq = nrm(q);
      const l = lista.filter((x) => !nq || nrm([x.codigo, x.descripcion, x.marca, x.modelo, x.tipo].join(' ')).includes(nq)).slice(0, 150);
      cont.querySelector('[data-dl]').innerHTML = l.length ? l.map((x) => `<div class="inv-drag-fila"><span class="mono muted">${h(x.codigo || '')}</span><span class="inv-drag-nom">${h(x.descripcion)}</span>
        <span class="inv-chip" draggable="true" data-chip="mto" data-id="${x.id}" title="Arrastre a la tabla o toque para agregar">${esMyM(x) ? 'Mto.' : h(x.tipo === 'Equipo biomédico' ? 'Equipo' : 'Valor')} ${pesos(x.valor)}</span>
        ${tieneMet(x) ? `<span class="inv-chip met" draggable="true" data-chip="met" data-id="${x.id}" title="Arrastre a la tabla o toque para agregar">Metrología ${pesos(x.valor_metrologia)}</span>` : esMyM(x) ? '<span class="inv-chip off">Metrología: no aplica</span>' : '<span></span>'}</div>`).join('') : '<div class="muted" style="padding:8px">Sin resultados.</div>';
    };
    pintar();
    cont.querySelector('[data-dq]').oninput = (e) => { q = e.target.value; pintar(); };
    const de = (el) => { const x = lista.find((y) => y.id === el.dataset.id); return x ? itemDe(x, el.dataset.chip) : null; };
    cont.addEventListener('dragstart', (e) => { const c = e.target.closest?.('[data-chip]'); if (!c) return; const it = de(c); if (!it) return; e.dataTransfer.setData('application/x-ibcol-item', JSON.stringify(it)); e.dataTransfer.setData('text/plain', it.descripcion); e.dataTransfer.effectAllowed = 'copy'; c.classList.add('arrastrando'); });
    cont.addEventListener('dragend', (e) => e.target.closest?.('[data-chip]')?.classList.remove('arrastrando'));
    cont.addEventListener('click', (e) => { const c = e.target.closest('[data-chip]'); if (!c) return; const it = de(c); if (it) alAgregar(it); });
  };

  // ---------------------------------------------------------------- selector para la cotización
  A.elegirDelInventario = async (alElegir) => {
    const lista = ordenar((await cargar()).filter((x) => x.activo !== false));
    if (faltaTabla) return toast('Falta ejecutar supabase/cotizaciones_inventario.sql en Supabase', true);
    if (!lista.length) return toast('El inventario de precios está vacío. Agregue ítems en Cotizaciones y cobros › Inventario de precios.', true);
    let tipo = '', q = '';
    const sel = new Map(); // id → { mto, met, cant }
    const get = (id) => sel.get(id) || { mto: false, met: false, cant: 1 };
    modal({
      titulo: 'Agregar del inventario', size: 'wide',
      cuerpo: `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><input type="search" data-q placeholder="Buscar equipo o ítem…" style="flex:1;min-width:200px">
        <select data-t><option value="">Todos los tipos</option>${TIPOS.map((t) => `<option>${h(t)}</option>`).join('')}</select></div>
        <p class="muted" style="margin-top:0">Marque <b>Mto. preventivo</b>, <b>Metrología</b> o ambos para cada equipo y ajuste la cantidad.</p>
        <div data-l style="max-height:52vh;overflow:auto"></div><p class="muted" data-sum style="margin-bottom:0"></p>`,
      alAbrir: (m) => {
        const pintar = () => {
          const nq = nrm(q);
          const l = lista.filter((x) => (!tipo || x.tipo === tipo) && (!nq || nrm([x.codigo, x.descripcion, x.marca, x.modelo].join(' ')).includes(nq)));
          m.body.querySelector('[data-l]').innerHTML = l.length ? `<table class="tbl"><thead><tr><th>Ítem</th><th>Equipo / descripción</th><th class="r">$ Mto. preventivo</th><th class="r">$ Metrología</th><th style="width:80px">Cant.</th></tr></thead><tbody>
            ${l.map((x) => { const s = get(x.id); return `<tr><td class="mono">${h(x.codigo || '')}</td><td><b>${h(x.descripcion)}</b>${esMyM(x) ? '' : `<div class="muted" style="font-size:.8rem">${h([x.tipo, x.marca, x.modelo].filter(Boolean).join(' · '))}</div>`}</td>
              <td class="r num"><label style="display:inline-flex;gap:6px;align-items:center;cursor:pointer;justify-content:flex-end"><input type="checkbox" data-sel="mto" data-id="${x.id}" ${s.mto ? 'checked' : ''}> ${pesos(x.valor)}</label></td>
              <td class="r num">${tieneMet(x) ? `<label style="display:inline-flex;gap:6px;align-items:center;cursor:pointer;justify-content:flex-end"><input type="checkbox" data-sel="met" data-id="${x.id}" ${s.met ? 'checked' : ''}> ${pesos(x.valor_metrologia)}</label>` : esMyM(x) ? noAplica : '<span class="muted">—</span>'}</td>
              <td><input type="number" min="1" step="1" data-cant="${x.id}" value="${s.cant}" style="width:70px"></td></tr>`; }).join('')}</tbody></table>` : '<div class="empty">Sin resultados.</div>';
        };
        const resumen = () => {
          let t = 0, n = 0; sel.forEach((s, id) => { const x = lista.find((y) => y.id === id); if (s.mto) { t += s.cant * (Number(x.valor) || 0); n++; } if (s.met) { t += s.cant * (Number(x.valor_metrologia) || 0); n++; } });
          m.body.querySelector('[data-sum]').textContent = n ? `${n} servicio(s) elegidos · ${pesos(t)} antes de IVA` : 'Marque los servicios y ajuste la cantidad.';
        };
        pintar(); resumen();
        m.body.querySelector('[data-q]').oninput = (e) => { q = e.target.value; pintar(); };
        m.body.querySelector('[data-t]').onchange = (e) => { tipo = e.target.value; pintar(); };
        m.body.addEventListener('change', (e) => {
          const c = e.target.closest('[data-sel]'); if (c) { const s = { ...get(c.dataset.id) }; s[c.dataset.sel] = c.checked; s.cant = Math.max(1, Number(m.body.querySelector(`[data-cant="${c.dataset.id}"]`)?.value) || 1); sel.set(c.dataset.id, s); }
          const n = e.target.closest('[data-cant]'); if (n) { const s = { ...get(n.dataset.cant) }; s.cant = Math.max(1, Number(n.value) || 1); if (!s.mto && !s.met) s.mto = true; sel.set(n.dataset.cant, s); pintar(); }
          resumen();
        });
      },
      acciones: [{ t: 'Cancelar' }, { t: 'Agregar a la cotización', cls: 'pri', fn: () => {
        const out = [];
        sel.forEach((s, id) => {
          const x = lista.find((y) => y.id === id); const extra = x.marca || x.modelo ? ` (${[x.marca, x.modelo].filter(Boolean).join(' ')})` : '';
          if (s.mto) out.push({ descripcion: esMyM(x) ? `Mantenimiento preventivo ${x.descripcion}${extra}` : `${x.descripcion}${extra}`, cantidad: s.cant, valor: Number(x.valor) || 0 });
          if (s.met && tieneMet(x)) out.push({ descripcion: `Metrología / calibración ${x.descripcion}${extra}`, cantidad: s.cant, valor: Number(x.valor_metrologia) || 0 });
        });
        if (!out.length) { toast('Marque al menos un servicio', true); return false; }
        alElegir(out);
      } }],
    });
  };
})();
