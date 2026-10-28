// =====================================================================
//  Consecutivos: numeración de reportes de mantenimiento preventivo y
//  correctivo, actas de baja/entrega y cuentas de cobro. Cada número que
//  se usa queda registrado con entidad, equipo, fecha y observación.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, confirmar, leer, f } = UI;

  const SERIES_BASE = [
    { serie: 'mto_preventivo', nombre: 'Reporte de mantenimiento preventivo', ultimo: 6669, formato: '{n:5}', orden: 1 },
    { serie: 'mto_correctivo', nombre: 'Reporte de mantenimiento correctivo', ultimo: 21, formato: '{n:4}-{yy}', orden: 2 },
    { serie: 'actas', nombre: 'Actas de baja y de entrega', ultimo: 82, formato: '{n:4}', orden: 3 },
    { serie: 'cuenta_cobro', nombre: 'Cuentas de cobro', ultimo: 306, formato: '{n:5}-{yyyy}', orden: 4 },
  ];
  const formatear = (formato, n, fecha) => {
    const y = String(fecha || UI.hoy()).slice(0, 4);
    return formato.replace('{n:5}', String(n).padStart(5, '0')).replace('{n:4}', String(n).padStart(4, '0')).replace('{n}', String(n)).replace('{yyyy}', y).replace('{yy}', y.slice(2));
  };
  const numDe = (s) => { const m = String(s || '').trim().match(/^\d+/); return m ? Number(m[0]) : null; };

  async function series() {
    let l = await S.list('consecutivos');
    if (!l.length && S.modo !== 'nube') { for (const s of SERIES_BASE) await S.insert('consecutivos', s); l = await S.list('consecutivos'); }
    return A.ordenar(l);
  }
  async function serie(k) {
    const s = (await series()).find((x) => x.serie === k);
    if (!s) throw new Error('Falta crear la tabla de consecutivos en Supabase (ejecute supabase/consecutivos.sql).');
    return s;
  }

  A.CONS = {
    formatear,
    // número que se asignaría ahora (no lo reserva)
    async siguiente(k, fecha) { try { const s = await serie(k); return formatear(s.formato, s.ultimo + 1, fecha); } catch (e) { console.warn(e); return ''; } },
    // asigna/registra el número. Si `numero` viene vacío o igual al sugerido, toma el siguiente libre.
    async registrar({ serie: k, numero = null, sugerido = null, entidad_id = null, equipo_id = null, fecha = UI.hoy(), observacion = '', ref_tabla = null, ref_id = null }) {
      const usar = numero && numero !== sugerido ? numero : null;
      if (S.modo === 'nube') {
        return S.rpc('registrar_consecutivo', { p_serie: k, p_numero: usar, p_entidad: entidad_id, p_equipo: equipo_id, p_fecha: fecha, p_obs: observacion, p_ref_tabla: ref_tabla, p_ref_id: ref_id });
      }
      const s = await serie(k);
      const n = usar ? numDe(usar) : s.ultimo + 1; const num = usar || formatear(s.formato, n, fecha);
      if ((await S.list('registro_consecutivos', { serie: k })).some((r) => r.numero === num)) throw new Error(`El número ${num} ya fue usado en ${s.nombre}`);
      const r = await S.insert('registro_consecutivos', { serie: k, numero: num, entidad_id, equipo_id, fecha, observacion, ref_tabla, ref_id });
      if (n !== null && n > s.ultimo) await S.update('consecutivos', s.id, { ultimo: n });
      return r;
    },
    async vincular(registro, ref_tabla, ref_id) { try { await S.update('registro_consecutivos', registro.id, { ref_tabla, ref_id }); } catch (e) { console.warn(e); } },
    async liberar(registro) { try { await S.remove('registro_consecutivos', registro.id); } catch (e) { console.warn(e); } },
  };

  // ------------------------------------------------------------------ vista
  A.V.consecutivos = async () => {
    const [ser, regs, ents, eqs] = await Promise.all([series(), S.list('registro_consecutivos', {}, '-created_at'), S.list('entidades', {}, 'razon_social'), S.list('equipos')]);
    let fs = '', fe = '', ft = '';
    const en = (id) => ents.find((e) => e.id === id)?.razon_social || '—';
    const eqN = (id) => { const e = eqs.find((x) => x.id === id); return e ? `${e.nombre} · ${e.codigo_inv}` : '—'; };
    const sn = (k) => ser.find((s) => s.serie === k)?.nombre || k;
    A.content().innerHTML = `<div class="page-head"><div><span class="eyebrow">Numeración de documentos</span><h1>Consecutivos</h1>
        <span class="muted">Cada reporte, acta o cuenta de cobro toma el siguiente número automáticamente y queda registrado aquí con su entidad, equipo, fecha y observación.</span></div>
        <div class="actions"><button class="btn" data-act="xls">${I.excel} Exportar a Excel</button><button class="btn pri" data-act="nuevo">${I.mas} Registrar número</button></div></div>
      <div class="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:16px">
        ${ser.map((s) => `<section class="panel" style="margin:0"><span class="eyebrow">${h(s.nombre)}</span>
          <div style="display:flex;align-items:baseline;gap:10px;margin:6px 0"><b class="mono" style="font-size:1.5rem">${h(formatear(s.formato, s.ultimo, UI.hoy()))}</b><span class="muted">último usado</span></div>
          <div class="muted">Siguiente: <b class="mono">${h(formatear(s.formato, s.ultimo + 1, UI.hoy()))}</b></div>
          <div class="actions" style="margin-top:8px"><button class="btn sm" data-act="ajustar" data-k="${s.serie}">${I.edit} Ajustar número</button><button class="btn sm" data-act="nuevo" data-k="${s.serie}">${I.mas} Registrar</button></div></section>`).join('')}
      </div>
      <div class="actions"><div class="field"><select data-fs aria-label="Tipo"><option value="">Todos los tipos</option>${ser.map((s) => `<option value="${s.serie}">${h(s.nombre)}</option>`).join('')}</select></div>
        <div class="field"><select data-fe aria-label="Entidad"><option value="">Todas las entidades</option>${ents.map((e) => `<option value="${e.id}">${h(e.razon_social)}</option>`).join('')}</select></div>
        <div class="field"><input data-ft placeholder="Buscar número, equipo u observación" aria-label="Buscar"></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tipo</th><th>N°</th><th>Fecha</th><th>Entidad</th><th>Equipo</th><th>Observación</th><th></th></tr></thead><tbody></tbody></table></div>`;
    const filtrados = () => regs.filter((r) => (!fs || r.serie === fs) && (!fe || r.entidad_id === fe) && (!ft || `${r.numero} ${eqN(r.equipo_id)} ${r.observacion || ''}`.toLowerCase().includes(ft)));
    const pintar = () => {
      const l = filtrados();
      A.content().querySelector('tbody').innerHTML = l.map((r) => `<tr><td>${h(sn(r.serie))}</td><td class="mono"><b>${h(r.numero)}</b></td><td>${UI.fecha(r.fecha)}</td><td>${h(en(r.entidad_id))}</td><td>${h(eqN(r.equipo_id))}</td><td>${h(r.observacion || '')}${r.ref_tabla ? ' <span class="pill acc">generado en la app</span>' : ''}</td>
        <td><button class="icon-btn" data-act="editar" data-id="${r.id}" aria-label="Editar">${I.edit}</button></td></tr>`).join('') || '<tr><td colspan="7" class="empty">Aún no hay números registrados.</td></tr>';
    };
    pintar();
    const c = A.content();
    c.querySelector('[data-fs]').onchange = (e) => { fs = e.target.value; pintar(); };
    c.querySelector('[data-fe]').onchange = (e) => { fe = e.target.value; pintar(); };
    c.querySelector('[data-ft]').oninput = (e) => { ft = e.target.value.toLowerCase(); pintar(); };

    const opEq = (entId) => [['', '— Ninguno / varios —'], ...eqs.filter((e) => !entId || e.entidad_id === entId).map((e) => [e.id, `${e.codigo_inv} · ${e.nombre}`])];
    const formReg = async (r = null, k = '') => {
      const sug = r ? r.numero : await A.CONS.siguiente(k || ser[0].serie);
      modal({
        titulo: r ? `Editar registro ${r.numero}` : 'Registrar número', cuerpo: `<form class="form" onsubmit="return false"><div class="fields">
          ${f.sel('serie', 'Tipo de documento', ser.map((s) => [s.serie, s.nombre]), r?.serie || k || ser[0].serie)}${f.input('numero', 'Número', sug)}
          ${f.input('fecha', 'Fecha', r?.fecha || UI.hoy(), { type: 'date' })}${f.sel('entidad_id', 'Entidad', [['', '— Seleccione —'], ...ents.map((e) => [e.id, e.razon_social])], r?.entidad_id || '')}
          ${f.sel('equipo_id', 'Equipo', opEq(r?.entidad_id), r?.equipo_id || '')}${f.area('observacion', 'Observación', r?.observacion || '', { rows: 2 })}</div>
          ${r ? '' : '<p class="muted">Use esta opción para dejar constancia de un número usado fuera de la app (por ejemplo un reporte hecho en Excel). Si deja el número sugerido, se toma el siguiente libre.</p>'}</form>`,
        alAbrir: (m) => {
          const se = m.body.querySelector('[name=entidad_id]'), sq = m.body.querySelector('[name=equipo_id]'), ss = m.body.querySelector('[name=serie]'), sn2 = m.body.querySelector('[name=numero]');
          se.onchange = () => { sq.innerHTML = opEq(se.value).map(([v, t]) => `<option value="${v}">${h(t)}</option>`).join(''); };
          if (!r) ss.onchange = async () => { sn2.value = await A.CONS.siguiente(ss.value, m.body.querySelector('[name=fecha]').value); };
        },
        acciones: [
          ...(r ? [{ t: `${I.del} Eliminar`, cls: 'danger', fn: async () => { if (!(await confirmar(`¿Eliminar el registro del número ${r.numero}? El número quedará libre.`))) return false; await S.remove('registro_consecutivos', r.id); toast('Registro eliminado'); A.recargar(); } }] : []),
          { t: 'Cancelar' },
          { t: 'Guardar', cls: 'pri', fn: async (m) => {
            const v = leer(m.body);
            const datos = { entidad_id: v.entidad_id || null, equipo_id: v.equipo_id || null, fecha: v.fecha || UI.hoy(), observacion: v.observacion };
            if (r) await S.update('registro_consecutivos', r.id, { ...datos, numero: v.numero, serie: v.serie });
            else { const nuevo = await A.CONS.registrar({ serie: v.serie, numero: v.numero, sugerido: sug, ...datos }); toast(`Número ${nuevo.numero} registrado`); }
            A.recargar();
          } },
        ],
      });
    };
    A.acts({
      nuevo: (d) => formReg(null, d.k),
      editar: (d) => formReg(regs.find((r) => r.id === d.id)),
      ajustar: (d) => {
        const s = ser.find((x) => x.serie === d.k);
        modal({
          titulo: `Ajustar · ${s.nombre}`, size: 'sm',
          cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('ultimo', 'Último número usado', String(s.ultimo), { type: 'number', attrs: 'min="0"' })}</div>
            <p class="muted">El siguiente documento tomará este número + 1. Formato: <span class="mono">${h(formatear(s.formato, s.ultimo + 1, UI.hoy()))}</span></p></form>`,
          acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
            const n = parseInt(leer(m.body).ultimo, 10); if (isNaN(n) || n < 0) { toast('Escriba un número válido', true); return false; }
            await S.update('consecutivos', s.id, { ultimo: n }); toast(`Siguiente número: ${formatear(s.formato, n + 1, UI.hoy())}`); A.recargar();
          } }],
        });
      },
      xls: () => {
        const aoa = [['Tipo', 'Número', 'Fecha', 'Entidad', 'Equipo', 'Observación'], ...filtrados().map((r) => [sn(r.serie), r.numero, r.fecha, en(r.entidad_id), eqN(r.equipo_id), r.observacion || ''])];
        const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = [{ wch: 34 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 36 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(wb, ws, 'Consecutivos'); XLSX.writeFile(wb, `Consecutivos_IBCOL_${UI.hoy()}.xlsx`);
      },
    });
  };
})();
