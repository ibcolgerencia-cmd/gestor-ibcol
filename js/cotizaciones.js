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
  const TIPOS = ['Equipo biomédico', 'Mantenimiento preventivo', 'Mantenimiento correctivo', 'Calibración', 'Repuesto o insumo', 'Otro servicio'];
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

  // ---------------------------------------------------------------- vista: inventario de precios
  A.listaCatalogo = async (el) => {
    if (!esProp()) { el.innerHTML = '<div class="empty">Solo el propietario puede ver el inventario de precios.</div>'; return; }
    const lista = await cargar();
    st.catTipo = st.catTipo || ''; st.catQ = st.catQ || '';
    el.innerHTML = `<section class="panel"><header><h2>Inventario para cotizaciones</h2>
        <div class="actions" style="margin:0;gap:6px;flex-wrap:wrap"><button class="btn" data-cat="plantilla">${I.excel} Plantilla Excel</button>
        <label class="btn" style="cursor:pointer">${I.subir} Importar Excel<input type="file" accept=".xlsx,.xls,.csv" data-cat-xls hidden></label>
        <button class="btn pri" data-cat="nuevo">${I.mas} Nuevo ítem</button></div></header>
      ${faltaTabla ? avisoSQL : ''}
      <p class="muted" style="margin-top:0">Equipos biomédicos, servicios de mantenimiento, calibración, repuestos y otros servicios con su valor unitario. Desde aquí se agregan a las cotizaciones con «Agregar del inventario». Solo usted ve estos valores: el cliente final solo ve el total de la cotización.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <input type="search" data-cat-q placeholder="Buscar por descripción, código, marca o modelo…" value="${h(st.catQ)}" style="flex:1;min-width:220px">
        <select data-cat-tipo><option value="">Todos los tipos</option>${TIPOS.map((t) => `<option ${t === st.catTipo ? 'selected' : ''}>${h(t)}</option>`).join('')}</select></div>
      <div data-cat-tabla></div></section>`;
    const pintar = () => {
      const q = nrm(st.catQ);
      const l = lista.filter((x) => (!st.catTipo || x.tipo === st.catTipo) && (!q || nrm([x.codigo, x.descripcion, x.marca, x.modelo, x.tipo].join(' ')).includes(q)));
      el.querySelector('[data-cat-tabla]').innerHTML = l.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Código</th><th>Tipo</th><th>Descripción</th><th>Marca / modelo</th><th>Unidad</th><th class="r">Valor unitario</th><th></th></tr></thead><tbody>
        ${l.map((x) => `<tr class="${x.activo === false ? 'muted' : ''}"><td class="mono">${h(x.codigo || '')}</td><td><span class="pill">${h(x.tipo || '')}</span></td><td><b>${h(x.descripcion)}</b>${x.notas ? `<div class="muted" style="font-size:.8rem">${h(x.notas)}</div>` : ''}</td>
          <td>${h([x.marca, x.modelo].filter(Boolean).join(' · '))}</td><td>${h(x.unidad || '')}</td><td class="r num"><b>${pesos(x.valor)}</b></td>
          <td><div class="row-actions"><button class="icon-btn" data-cat="editar" data-id="${x.id}" aria-label="Editar">${I.edit}</button><button class="icon-btn bad" data-cat="borrar" data-id="${x.id}" aria-label="Eliminar">${I.del}</button></div></td></tr>`).join('')}
        </tbody></table></div><p class="muted" style="font-size:.8rem">${l.length} de ${lista.length} ítems</p>` : `<div class="empty">${lista.length ? 'Ningún ítem coincide con la búsqueda.' : 'Aún no hay ítems. Cree el primero o importe su lista de precios desde Excel.'}</div>`;
    };
    pintar();
    const qi = el.querySelector('[data-cat-q]'); qi.oninput = () => { st.catQ = qi.value; pintar(); };
    el.querySelector('[data-cat-tipo]').onchange = (e) => { st.catTipo = e.target.value; pintar(); };
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-cat]'); if (!b) return;
      const x = lista.find((y) => y.id === b.dataset.id);
      if (b.dataset.cat === 'nuevo') return formItem(null, () => A.listaCatalogo(el));
      if (b.dataset.cat === 'editar') return formItem(x, () => A.listaCatalogo(el));
      if (b.dataset.cat === 'borrar') { if (await confirmar(`¿Eliminar «${x.descripcion}» del inventario de precios? Las cotizaciones ya hechas no cambian.`)) { await S.remove('catalogo_cotizacion', x.id); toast('Ítem eliminado'); A.listaCatalogo(el); } return; }
      if (b.dataset.cat === 'plantilla') return plantilla();
    });
    el.querySelector('[data-cat-xls]').onchange = async (e) => { const file = e.target.files[0]; e.target.value = ''; if (file) await importar(file, lista, () => A.listaCatalogo(el)); };
  };

  const formItem = (x, alListo) => modal({
    titulo: x ? 'Editar ítem del inventario' : 'Nuevo ítem del inventario', size: 'sm',
    cuerpo: `<form class="form" onsubmit="return false"><div class="fields">
      ${f.sel('tipo', 'Tipo *', TIPOS, x?.tipo || 'Mantenimiento preventivo')}${f.input('codigo', 'Código', x?.codigo || '')}
      ${f.area('descripcion', 'Descripción * (así sale en la cotización)', x?.descripcion || '', { rows: 2 })}
      ${f.input('marca', 'Marca', x?.marca || '')}${f.input('modelo', 'Modelo', x?.modelo || '')}
      ${f.sel('unidad', 'Unidad', UNIDADES, x?.unidad || 'Unidad')}${f.input('valor', 'Valor unitario (COP, sin IVA) *', x?.valor ?? '', { type: 'number', attrs: 'min="0" step="100"' })}
      ${f.area('notas', 'Notas internas (no salen en la cotización)', x?.notas || '', { rows: 2 })}</div></form>`,
    acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
      const v = leer(m.body);
      if (!v.descripcion?.trim()) { toast('Escriba la descripción', true); return false; }
      const o = { tipo: v.tipo, codigo: v.codigo?.trim() || null, descripcion: v.descripcion.trim(), marca: v.marca?.trim() || null, modelo: v.modelo?.trim() || null, unidad: v.unidad, valor: num(v.valor), notas: v.notas?.trim() || null, activo: true };
      try { x ? await S.update('catalogo_cotizacion', x.id, o) : await S.insert('catalogo_cotizacion', o); }
      catch (e) { if (/catalogo_cotizacion|schema cache|does not exist|relation/i.test(e.message)) { toast('Falta ejecutar supabase/cotizaciones_inventario.sql en Supabase', true); return false; } throw e; }
      toast(x ? 'Ítem actualizado' : 'Ítem agregado al inventario'); alListo?.();
    } }],
  });

  const COLS = ['Tipo', 'Código', 'Descripción', 'Marca', 'Modelo', 'Unidad', 'Valor unitario'];
  const plantilla = () => {
    const ej = [['Mantenimiento preventivo', 'MP-001', 'Mantenimiento preventivo de tensiómetro', '', '', 'Equipo', 45000], ['Calibración', 'CAL-001', 'Calibración de báscula con certificado', '', '', 'Equipo', 60000], ['Equipo biomédico', 'EQ-001', 'Monitor de signos vitales', 'Marca', 'Modelo', 'Unidad', 3500000]];
    const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet([COLS, ...ej]);
    ws['!cols'] = [{ wch: 26 }, { wch: 10 }, { wch: 50 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario'); XLSX.writeFile(wb, 'Plantilla_inventario_cotizaciones_IBCOL.xlsx');
  };
  const importar = async (file, actuales, alListo) => {
    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
    const filas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
    const hi = filas.findIndex((r) => r.some((c) => /descrip/i.test(String(c))));
    if (hi < 0) return toast('No se encontró la columna «Descripción». Use la plantilla Excel.', true);
    const cab = filas[hi].map((c) => nrm(c));
    const col = (re) => cab.findIndex((c) => re.test(c));
    const ci = { tipo: col(/^tipo/), codigo: col(/codigo|cod\b|ref/), descripcion: col(/descrip/), marca: col(/marca/), modelo: col(/modelo/), unidad: col(/unidad|und/), valor: col(/valor|precio|tarifa/) };
    const tipoDe = (t) => TIPOS.find((x) => nrm(x) === nrm(t)) || (/calibr/i.test(t) ? 'Calibración' : /correct/i.test(t) ? 'Mantenimiento correctivo' : /manten/i.test(t) ? 'Mantenimiento preventivo' : /equipo/i.test(t) ? 'Equipo biomédico' : /repuest|insum/i.test(t) ? 'Repuesto o insumo' : 'Otro servicio');
    const nuevos = filas.slice(hi + 1).map((r) => ({ tipo: tipoDe(String(r[ci.tipo] ?? '')), codigo: String(r[ci.codigo] ?? '').trim() || null, descripcion: String(r[ci.descripcion] ?? '').trim(), marca: String(r[ci.marca] ?? '').trim() || null, modelo: String(r[ci.modelo] ?? '').trim() || null, unidad: String(r[ci.unidad] ?? '').trim() || 'Unidad', valor: num(r[ci.valor]), activo: true })).filter((x) => x.descripcion);
    if (!nuevos.length) return toast('El archivo no tiene ítems para importar', true);
    const clave = (x) => nrm(x.codigo || x.descripcion);
    let n = 0, u = 0;
    for (const x of nuevos) {
      const ya = actuales.find((y) => clave(y) === clave(x));
      try { if (ya) { await S.update('catalogo_cotizacion', ya.id, x); u++; } else { await S.insert('catalogo_cotizacion', x); n++; } }
      catch (e) { toast(/catalogo_cotizacion|schema cache|relation/i.test(e.message) ? 'Falta ejecutar supabase/cotizaciones_inventario.sql en Supabase' : e.message, true); break; }
    }
    toast(`Inventario importado: ${n} nuevos, ${u} actualizados`); alListo?.();
  };

  // ---------------------------------------------------------------- selector para la cotización
  A.elegirDelInventario = async (alElegir) => {
    const lista = (await cargar()).filter((x) => x.activo !== false);
    if (faltaTabla) return toast('Falta ejecutar supabase/cotizaciones_inventario.sql en Supabase', true);
    if (!lista.length) return toast('El inventario de precios está vacío. Agregue ítems en Cotizaciones y cobros › Inventario de precios.', true);
    let tipo = '', q = '';
    modal({
      titulo: 'Agregar del inventario', size: 'wide',
      cuerpo: `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><input type="search" data-q placeholder="Buscar…" style="flex:1;min-width:200px">
        <select data-t><option value="">Todos los tipos</option>${TIPOS.map((t) => `<option>${h(t)}</option>`).join('')}</select></div>
        <div data-l style="max-height:52vh;overflow:auto"></div><p class="muted" data-sum style="margin-bottom:0"></p>`,
      alAbrir: (m) => {
        const sel = new Map();
        const pintar = () => {
          const nq = nrm(q);
          const l = lista.filter((x) => (!tipo || x.tipo === tipo) && (!nq || nrm([x.codigo, x.descripcion, x.marca, x.modelo].join(' ')).includes(nq)));
          m.body.querySelector('[data-l]').innerHTML = l.length ? `<table class="tbl"><thead><tr><th></th><th>Descripción</th><th>Tipo</th><th class="r">Valor</th><th style="width:80px">Cant.</th></tr></thead><tbody>
            ${l.map((x) => `<tr><td><input type="checkbox" data-id="${x.id}" ${sel.has(x.id) ? 'checked' : ''} aria-label="Elegir"></td><td><b>${h(x.descripcion)}</b>${x.marca || x.modelo ? `<div class="muted" style="font-size:.8rem">${h([x.marca, x.modelo].filter(Boolean).join(' · '))}</div>` : ''}</td>
              <td class="muted">${h(x.tipo)}</td><td class="r num">${pesos(x.valor)}</td><td><input type="number" min="1" step="1" data-cant="${x.id}" value="${sel.get(x.id) || 1}" style="width:70px"></td></tr>`).join('')}</tbody></table>` : '<div class="empty">Sin resultados.</div>';
        };
        const resumen = () => { const t = [...sel].reduce((s, [id, c]) => s + c * (Number(lista.find((x) => x.id === id)?.valor) || 0), 0); m.body.querySelector('[data-sum]').textContent = sel.size ? `${sel.size} ítem(s) elegidos · ${pesos(t)} antes de IVA` : 'Marque los ítems y ajuste la cantidad.'; };
        pintar(); resumen();
        m.body.querySelector('[data-q]').oninput = (e) => { q = e.target.value; pintar(); };
        m.body.querySelector('[data-t]').onchange = (e) => { tipo = e.target.value; pintar(); };
        m.body.addEventListener('change', (e) => {
          const c = e.target.closest('[data-id]'); if (c) { const cant = Number(m.body.querySelector(`[data-cant="${c.dataset.id}"]`)?.value) || 1; c.checked ? sel.set(c.dataset.id, cant) : sel.delete(c.dataset.id); }
          const n = e.target.closest('[data-cant]'); if (n) { const id = n.dataset.cant; const v = Math.max(1, Number(n.value) || 1); const ch = m.body.querySelector(`[data-id="${id}"]`); if (ch) ch.checked = true; sel.set(id, v); }
          resumen();
        });
        m._sel = sel;
      },
      acciones: [{ t: 'Cancelar' }, { t: 'Agregar a la cotización', cls: 'pri', fn: (m) => {
        const sel = m._sel; if (!sel?.size) { toast('Marque al menos un ítem', true); return false; }
        alElegir([...sel].map(([id, c]) => { const x = lista.find((y) => y.id === id); return { descripcion: [x.descripcion, x.marca || x.modelo ? `(${[x.marca, x.modelo].filter(Boolean).join(' ')})` : ''].filter(Boolean).join(' '), cantidad: c, valor: Number(x.valor) || 0 }; }));
      } }],
    });
  };
})();
