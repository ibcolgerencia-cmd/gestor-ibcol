// =====================================================================
//  CARGAR UN CRONOGRAMA (Excel o PDF) DE MANTENIMIENTO O METROLOGÍA
//  Lee el archivo (semanas 1-4 o CP / CE por mes, uno o varios bloques por servicio,
//  periodos de dos años como abril 2026 – marzo 2027), busca cada equipo por código,
//  activo fijo o serie, muestra la vista previa y aplica:
//  · la programación de cada mes (P programado, E ejecutado, N no ejecutado)
//  · proveedor y tipo CAL / VAL (metrología) · el mismo orden y la misma cantidad de equipos
//  · guarda el archivo en 2. Cronogramas (el Excel queda oculto para la entidad).
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, toast, modal } = UI;
  const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  const comp = (t) => norm(t).replace(/[^A-Z0-9]/g, '');
  const M3 = (m) => CAT.MESES[m - 1].slice(0, 3);
  const sedeC = (c) => c?.sede || 'Sede principal';
  const EST = { P: 'Prog.', E: 'Ejec.', N: 'No ejec.', G: 'Garantía', C: 'Comodato' };

  // equipo de la entidad que corresponde a una fila: código / activo fijo → serie → nombre en la sede
  const buscador = (eqs, cons, sede) => {
    const usados = new Set();
    const enSede = (e) => !sede || sedeC(cons.find((c) => c.id === e.consultorio_id)) === sede;
    return (r) => {
      const libres = eqs.filter((e) => !usados.has(e.id) && e.estado !== 'Dado de baja');
      const toma = (e) => { if (e) usados.add(e.id); return e || null; };
      for (const k of [r.codigo, r.af]) { const c = comp(k); if (c.length >= 4) { const e = libres.find((x) => comp(x.codigo_inv) === c) || libres.find((x) => comp(x.activo_fijo) === c); if (e) return toma(e); } }
      const sr = comp(r.serie); if (sr.length >= 4 && !/^(NR|NOREGISTRA|NA)$/.test(sr)) { const e = libres.find((x) => comp(x.serie) === sr); if (e) return toma(e); }
      const n = comp(r.nombre), mo = comp(r.modelo), ma = comp(r.marca);
      const cand = libres.filter((x) => enSede(x) && comp(x.nombre) === n);
      const e = cand.find((x) => mo && comp(x.modelo) === mo) || cand.find((x) => ma && comp(x.marca) === ma) || (cand.length === 1 ? cand[0] : null);
      return toma(e);
    };
  };
  const marcasTxt = (r) => Object.entries(r.planes || {}).flatMap(([y, p]) => Object.entries(p).map(([k, v]) => ({ y: +y, m: +k.split('-')[0], v })))
    .sort((a, b) => a.y - b.y || a.m - b.m).map((x) => `<span class="chip-est ${x.v}">${M3(x.m)} ${String(x.y).slice(2)} · ${EST[x.v] || x.v}</span>`).join(' ');

  A.cargarCronograma = (ent, { tipo: tipo0 = 'metrologia', sede: sede0 = null, alTerminar = null, archivo = null } = {}) => {
    const procesar = async (file) => {
      let plan;
      try { plan = await A.leerCronograma(file); } catch (e) { console.warn(e); }
      if (!plan || !plan.filas.length) return toast('No encontré la tabla del cronograma (columnas EQUIPO, MARCA/SERIE y los meses). Revise el archivo.', true);
      const [eqs, consAll] = await Promise.all([S.list('equipos', { entidad_id: ent.id }), S.list('consultorios', { entidad_id: ent.id })]);
      const cons = A.ordenar(consAll); const sedes = A.sedesDe(cons, ent);
      const tipoDed = /METROLOG|CALIBRA|ASEGURAMIENTO/.test(norm(file.name)) || plan.filas.some((r) => r.metTipo !== undefined) ? 'metrologia' : /MANTENIM|MTTO|PREVENTIV/.test(norm(file.name)) ? 'mantenimiento' : tipo0;
      // sede: la del contexto, o la que más equipos del archivo tiene
      const pre = buscador(eqs, cons, null); const prev0 = plan.filas.map((r) => pre(r));
      const cuenta = {}; prev0.filter(Boolean).forEach((e) => { const sd = sedeC(cons.find((c) => c.id === e.consultorio_id)); cuenta[sd] = (cuenta[sd] || 0) + 1; });
      const sedeMas = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      const sedeSug = sede0 || sedeMas;
      const base = plan.anio || new Date().getFullYear();
      const pinta = (m, sede) => {
        const bus = buscador(eqs, cons, sede || null); const res = plan.filas.map((r) => ({ r, e: bus(r) }));
        const nOk = res.filter((x) => x.e).length;
        m.body.querySelector('[data-res]').innerHTML = `<p><b>${nOk} de ${plan.filas.length}</b> equipos encontrados en el inventario${nOk < plan.filas.length ? ` · <span class="pill warn">${plan.filas.length - nOk} sin encontrar</span> (no se programan; revise el código o créelos en el inventario)` : ''}.</p>
          <div class="tbl-wrap" style="max-height:330px;overflow:auto"><table class="tbl"><thead><tr><th>#</th><th>Servicio</th><th>Equipo</th><th>Código / A.F.</th><th>Serie</th>${plan.filas.some((r) => r.metTipo) ? '<th>Tipo</th>' : ''}${plan.filas.some((r) => r.proveedor) ? '<th>Proveedor</th>' : ''}<th>Programación</th><th>En el gestor</th></tr></thead><tbody>
          ${res.map(({ r, e }, i) => { const c = e && cons.find((x) => x.id === e.consultorio_id); return `<tr><td class="num">${i + 1}</td><td>${h(r.servicio || '')}</td><td><b>${h(r.nombre)}</b></td><td class="mono">${h(r.codigo || r.af || '')}</td><td class="mono">${h(r.serie || '')}</td>${plan.filas.some((x) => x.metTipo) ? `<td>${h(r.metTipo || '')}</td>` : ''}${plan.filas.some((x) => x.proveedor) ? `<td>${h(r.proveedor || '')}</td>` : ''}<td>${marcasTxt(r) || '<span class="muted">—</span>'}</td><td>${e ? `<span class="pill ok">✓</span> ${h(e.codigo_inv || '')} <small class="muted">${h(sedeC(c))} · ${h(c?.nombre || '')}</small>` : '<span class="pill bad">No está</span>'}</td></tr>`; }).join('')}
          </tbody></table></div>`;
        return res;
      };
      const optsMes = CAT.MESES.map((n, i) => `<option value="${i + 1}" ${plan.mesIni === i + 1 ? 'selected' : ''}>${n}</option>`).join('');
      const mv = modal({
        titulo: `Cargar cronograma · ${file.name}`, size: 'wide',
        cuerpo: `<form class="form" onsubmit="return false">
          <p class="muted">Leí <b>${plan.filas.length} equipos</b>${plan.meta?.sede ? ` de «${h(plan.meta.sede)}»` : ''}. Periodo del archivo: <b>${M3(plan.mesIni)} ${base}${plan.mesIni > 1 ? ` – ${M3(plan.mesIni - 1)} ${base + 1}` : ` – dic ${base}`}</b>.</p>
          <div class="fields">
            <label class="field"><span>Cronograma</span><select name="tipo"><option value="metrologia" ${tipoDed === 'metrologia' ? 'selected' : ''}>Metrología y calibración</option><option value="mantenimiento" ${tipoDed === 'mantenimiento' ? 'selected' : ''}>Mantenimiento preventivo</option></select></label>
            <label class="field"><span>Sede</span><select name="sede">${['', ...sedes].map((sd) => `<option value="${h(sd)}" ${sd === sedeSug ? 'selected' : ''}>${sd ? h(sd) : 'Toda la entidad'}</option>`).join('')}</select></label>
            <label class="field"><span>Primer mes del periodo</span><select name="mesIni">${optsMes}</select></label>
            <label class="field"><span>Año del primer mes</span><input name="anio" type="number" min="2015" max="2040" value="${base}"></label>
          </div>
          <label class="crono-opt"><input type="checkbox" name="reemplazar" checked><span>Dejar los meses del periodo <b>exactamente como en el archivo</b> (quita las marcas que el archivo no tiene). Si no, solo se llenan los meses vacíos.</span></label>
          <label class="crono-opt"><input type="checkbox" name="orden" checked><span>Mostrar el cronograma <b>en el mismo orden</b> del archivo</span></label>
          <label class="crono-opt"><input type="checkbox" name="solo" checked><span>Mostrar en el cronograma de la sede <b>solo los equipos del archivo</b> (los demás no se borran; se ven con «Mostrar todos»)</span></label>
          <label class="crono-opt"><input type="checkbox" name="datos" checked><span>Actualizar proveedor y tipo CAL / VAL de cada equipo (metrología)</span></label>
          <label class="crono-opt"><input type="checkbox" name="guardar" checked><span>Guardar el archivo en <b>2. Cronogramas</b>${/\.pdf$/i.test(file.name) ? '' : ' (el Excel queda oculto para la entidad)'}</span></label>
          <div data-res></div><div class="muted" data-prog></div></form>`,
        acciones: [{ t: 'Cancelar' }, { t: 'Aplicar cronograma', cls: 'pri', fn: async (m) => {
          const g = (n) => m.body.querySelector(`[name=${n}]`); const pr = m.body.querySelector('[data-prog]');
          const tipo = g('tipo').value, sede = g('sede').value || null;
          const mesIni = +g('mesIni').value, anio = +g('anio').value || base;
          // si el usuario corrigió el periodo, se recalcula el año de cada mes
          if (mesIni !== plan.mesIni || anio !== base) plan.filas.forEach((r) => { const pl = {}; Object.values(r.planes || {}).forEach((p) => Object.entries(p).forEach(([k, v]) => { const y = +k.split('-')[0] < mesIni ? anio + 1 : anio; (pl[y] = pl[y] || {})[k] = v; })); r.planes = pl; });
          const plan2 = { ...plan, anio, mesIni };
          const bus = buscador(eqs, cons, sede);
          const r = await A.aplicarPlan(ent, plan2, tipo, { buscar: bus, reemplazar: g('reemplazar').checked, datosMetro: g('datos').checked, prog: (t) => { pr.textContent = t; } });
          // orden y cantidad del cronograma (por tipo y sede)
          if (g('orden').checked || g('solo').checked) {
            const fresh = (await S.get('entidades', ent.id)) || ent; const cfg = { ...(fresh.config || {}) };
            const co = { ...(cfg.crono_orden || {}) }; const porT = { ...(co[tipo] || {}) };
            const clave = sede || sedeC(cons.find((c) => c.id === eqs.find((e) => e.id === r.ids[0])?.consultorio_id));
            porT[clave] = { ids: r.ids, solo: g('solo').checked, orden: g('orden').checked, archivo: file.name, fecha: UI.hoy() };
            co[tipo] = porT; cfg.crono_orden = co;
            await S.update('entidades', ent.id, { config: cfg }); ent.config = cfg;
          }
          if (g('guardar').checked) {
            pr.textContent = 'Guardando el archivo…';
            const sub = [sede, CAT.SUBS_CRONO[tipo === 'metrologia' ? 1 : 0]].filter(Boolean).join('/');
            const ruta = `${ent.id}/general/cronogramas/${Date.now()}-${file.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_')}`;
            await S.upload(ruta, file);
            const docs = await S.list('documentos', { entidad_id: ent.id, carpeta: 'cronogramas' });
            const prevD = docs.find((d) => !d.equipo_id && d.subcarpeta === sub && d.nombre === file.name);
            const datos = { archivo: ruta, mime: file.type || '', tamano: file.size, fecha_documento: UI.hoy(), visible_cliente: /\.pdf$/i.test(file.name) };
            if (prevD) await S.update('documentos', prevD.id, { ...datos, versiones: [...(prevD.versiones || []), { archivo: prevD.archivo, fecha: prevD.updated_at || prevD.created_at }] });
            else await S.insert('documentos', { entidad_id: ent.id, equipo_id: null, carpeta: 'cronogramas', subcarpeta: sub, nombre: file.name, ...datos });
          }
          S.log('EDITAR', 'cronogramas', ent.id, `Cargar cronograma de ${tipo} «${file.name}»${sede ? ' · ' + sede : ''}: ${r.nEq} equipos, ${r.nPlan} con cambios, ${r.sin.length} sin encontrar`);
          toast(`Cronograma cargado: ${r.nEq} equipos (${r.nPlan} con cambios)${r.sin.length ? ` · ${r.sin.length} no se encontraron` : ''}`, !!r.sin.length);
          // el cronograma queda mostrando el periodo del archivo
          st.cronoAnio = anio; st.cronoF = st.cronoF || {}; const fk = `${ent.id}|${tipo}`; st.cronoF[fk] = { ...(st.cronoF[fk] || { mes: 0, q: '', estado: '', editar: false, serv: '' }), mesIni, mes: 0, serv: sede ? 'sede:' + sede : '' };
          if (alTerminar) alTerminar({ tipo, sede, anio, mesIni, ...r });
        } }],
      });
      const mm = mv || { body: [...document.querySelectorAll('.modal .body')].pop() };
      pinta(mm, sedeSug);
      mm.body.querySelector('[name=sede]')?.addEventListener('change', (ev) => pinta(mm, ev.target.value));
    };
    if (archivo) return procesar(archivo);
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.xlsx,.xls,.xlsm,.pdf';
    inp.onchange = () => { const fl = inp.files[0]; if (fl) procesar(fl).catch((e) => { console.error(e); toast(e.message || String(e), true); }); };
    inp.click();
  };
})();
