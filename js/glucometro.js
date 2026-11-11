// =====================================================================
//  9. CONTROL CALIDAD GLUCÓMETRO · FORMATO CONTROL DE GLUCOMETRÍA
//  Igual al formato Excel de la entidad (MIS-ACT-LC-FOR-14): encabezado
//  PROCESO / SUBPROCESO / NOMBRE DEL DOCUMENTO / Código / Versión / Fecha,
//  franja "EQUIPO GLUCÓMETRO" y la tabla de controles diarios.
//  Tabla: control_glucometro (una fila por control). El propietario crea,
//  corrige y borra; el usuario de la entidad solo ve y agrega registros.
//  El Excel solo lo descarga el propietario.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, confirmar, leer, f } = UI;
  const esProp = A.esProp;
  const TABLA = 'control_glucometro';
  // encabezado por defecto (tomado del formato Excel de la entidad)
  const ENC = { proceso: 'APOYO DIAGNÓSTICO Y COMPLEMENTACIÓN TERAPÉUTICA', subproceso: 'LABORATORIO CLÍNICO', nombre: 'FORMATO CONTROL DE GLUCOMETRÍA', codigo: 'MIS-ACT-LC-FOR-14', version: '1', fecha: 'MARZO DE 2025', franja: 'EQUIPO GLUCÓMETRO' };
  const CAMPOS = ['marca', 'modelo', 'serie', 'lote_tira', 'lote_solucion', 'rango_normal', 'rango_alto', 'fecha_apertura', 'tipo', 'valor', 'observaciones', 'responsable', 'cargo'];
  // encabezado: Formatos (código, versión, fecha…) y, si la entidad/sede tiene uno propio, ese
  const fechaMes = (s) => { const m = String(s || '').match(/^(\d{4})-(\d{2})/); return m ? `${CAT.MESES[+m[2] - 1].toUpperCase()} DE ${m[1]}` : String(s || ''); };
  const encFormatos = () => { const x = st.fmt?.glucometro || {}; return { ...ENC, ...(x.titulo ? { nombre: x.titulo } : {}), ...['codigo', 'version', 'proceso', 'subproceso', 'franja'].reduce((o, k) => (x[k] ? { ...o, [k]: x[k] } : o), {}), ...(x.fecha ? { fecha: fechaMes(x.fecha) } : {}) }; };
  const propio = (ent, sede) => (ent.config?.fmt_glucometro || {})[sede || '_'] || (ent.config?.fmt_glucometro || {})._ || null;
  const encDe = (ent, sede) => ({ ...encFormatos(), ...(propio(ent, sede) || {}) });
  const fechaTxt = (s) => { if (!s) return ''; const [y, m, d] = String(s).slice(0, 10).split('-'); return y && m && d ? `${+d}/${+m}/${y}` : String(s); };
  const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.').replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? n : null; };
  // ¿el valor quedó dentro del rango de la solución empleada? (ej. "96 – 144 mg/dL")
  const rango = (t) => { const m = String(t || '').match(/(\d+(?:[.,]\d+)?)\s*[-–—a]\s*(\d+(?:[.,]\d+)?)/); return m ? [num(m[1]), num(m[2])] : null; };
  const fueraDeRango = (d) => {
    const v = num(d.valor); if (v == null) return false;
    const r = rango(d.tipo === 'ALTA' ? d.rango_alto : d.tipo === 'NORMAL' ? d.rango_normal : null); return r ? v < r[0] || v > r[1] : false;
  };

  // ------------------------------------------------------------------ vista de la carpeta
  A.G.glucometro = async (el, { ent, sede = null }) => {
    const hoy = new Date();
    st.glF = st.glF || {}; const llave = `${ent.id}|${sede || ''}`;
    const F = (st.glF[llave] = st.glF[llave] || { anio: hoy.getFullYear(), mes: 0, serie: '' });
    const [eqs, cons] = await Promise.all([S.list('equipos', { entidad_id: ent.id }), S.list('consultorios', { entidad_id: ent.id })]);
    const sedeEq = (e) => (cons.find((c) => c.id === e.consultorio_id)?.sede || 'Sede principal');
    const glucos = eqs.filter((e) => /gluc/i.test(`${e.nombre} ${e.tipo || ''}`) && e.estado !== 'Dado de baja' && (!sede || sedeEq(e) === sede));
    let regs = [];
    try { regs = (await S.list(TABLA, { entidad_id: ent.id }, '-fecha')).filter((r) => !sede || (r.sede || null) === sede || !r.sede); } catch (er) {
      el.innerHTML = `<section class="panel"><header><h2>Formato control de glucometría</h2></header><div class="empty">${/control_glucometro|relation|schema cache|does not exist/i.test(er.message) ? `Falta instalar la tabla del formato en la base de datos.${esProp() ? ' Ejecute el archivo <b>supabase/glucometro.sql</b> en Supabase › SQL Editor (o pídale a Claude que lo active).' : ' Avísele a IBCOL.'}` : h(er.message)}</div></section>`;
      return;
    }
    const pintar = () => {
      const enc = encDe(ent, sede);
      const anios = [...new Set([hoy.getFullYear(), ...regs.map((r) => +String(r.fecha).slice(0, 4))])].sort((a, b) => b - a);
      const series = [...new Set(regs.map((r) => r.datos?.serie).filter(Boolean))];
      const lista = regs.filter((r) => (!F.anio || +String(r.fecha).slice(0, 4) === +F.anio) && (!F.mes || +String(r.fecha).slice(5, 7) === +F.mes) && (!F.serie || r.datos?.serie === F.serie))
        .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)) || String(a.created_at).localeCompare(String(b.created_at)));
      const nFuera = lista.filter((r) => fueraDeRango(r.datos || {})).length;
      const periodo = `${F.mes ? CAT.MESES[F.mes - 1] + ' ' : ''}${F.anio || 'todos los años'}`;
      el.innerHTML = `<section class="panel gl"><header><div><h2>${h(enc.nombre)} · ${h(enc.codigo)}</h2><span class="muted" style="font-size:.85rem">Registro diario del control de calidad del glucómetro con solución control normal y alta. Igual al formato Excel; el PDF sale con el mismo diseño.</span></div>
          <div class="actions"><button class="btn pri" data-act="glNuevo">${I.mas} Registro de hoy</button><button class="btn" data-act="glPDF">${I.pdf} PDF</button>
          ${esProp() ? `<button class="btn" data-act="glGuardarPDF" title="Guarda el PDF del periodo en esta carpeta">${I.subir} Guardar PDF en la carpeta</button><button class="btn" data-act="glExcel">${I.excel} Excel</button><label class="btn">${I.subir} Importar Excel<input type="file" accept=".xlsx,.xls" hidden data-glimp></label><button class="btn" data-act="glEnc">${I.edit} Encabezado</button>` : ''}</div></header>
        <div class="tbl-tools">
          <div class="field"><label for="gl_anio">Año</label><select id="gl_anio" data-gl="anio"><option value="0">Todos</option>${anios.map((x) => `<option ${x === +F.anio ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
          <div class="field"><label for="gl_mes">Mes</label><select id="gl_mes" data-gl="mes"><option value="0">Todo el año</option>${CAT.MESES.map((m, i) => `<option value="${i + 1}" ${i + 1 === +F.mes ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
          ${series.length > 1 ? `<div class="field"><label for="gl_serie">Glucómetro</label><select id="gl_serie" data-gl="serie"><option value="">Todos</option>${series.map((x) => `<option ${x === F.serie ? 'selected' : ''}>${h(x)}</option>`).join('')}</select></div>` : ''}
          <span class="muted">${lista.length} registro${lista.length === 1 ? '' : 's'} · ${h(periodo)}</span>${nFuera ? `<span class="pill bad">${nFuera} fuera de rango</span>` : ''}</div>
        <div class="tbl-wrap"><table class="tbl gl-tbl"><thead>
          <tr><th rowspan="2">Fecha</th><th colspan="3">Marca glucómetro</th><th colspan="2">Tira glucometría</th><th colspan="2">Lote solución de control empleada</th><th rowspan="2">Fecha apertura solución de control</th><th colspan="2">Tipo de solución de control empleada</th><th rowspan="2">Valor obtenido</th><th rowspan="2">Observaciones</th><th rowspan="2">Responsable</th><th rowspan="2">Cargo del responsable</th>${esProp() ? '<th rowspan="2"></th>' : ''}</tr>
          <tr><th>Marca</th><th>Modelo</th><th>Serie</th><th>Lote de tirilla empleada</th><th>Lote solución de control empleada</th><th>Normal</th><th>Alto</th><th>Normal</th><th>Alta</th></tr></thead>
          <tbody>${lista.map((r) => { const d = r.datos || {}; const fuera = fueraDeRango(d); return `<tr class="${fuera ? 'gl-fuera' : ''}">
            <td class="num" style="white-space:nowrap">${fechaTxt(r.fecha)}</td><td>${h(d.marca || '')}</td><td>${h(d.modelo || '')}</td><td class="mono">${h(d.serie || '')}</td><td class="mono">${h(d.lote_tira || '')}</td><td class="mono">${h(d.lote_solucion || '')}</td>
            <td>${h(d.rango_normal || '')}</td><td>${h(d.rango_alto || '')}</td><td class="num">${fechaTxt(d.fecha_apertura)}</td>
            <td class="c">${d.tipo === 'NORMAL' || d.tipo === 'AMBAS' ? 'x' : ''}</td><td class="c">${d.tipo === 'ALTA' || d.tipo === 'AMBAS' ? 'x' : ''}</td>
            <td class="num"><b>${h(d.valor ?? '')}</b>${fuera ? ' <span class="pill bad" title="El valor está fuera del rango de la solución empleada">Fuera de rango</span>' : ''}</td><td>${h(d.observaciones || '')}</td><td>${h(d.responsable || '')}</td><td>${h(d.cargo || '')}</td>
            ${esProp() ? `<td style="white-space:nowrap"><button class="icon-btn" data-act="glEditar" data-id="${r.id}" title="Corregir" aria-label="Corregir">${I.edit}</button><button class="icon-btn" data-act="glBorrar" data-id="${r.id}" title="Eliminar" aria-label="Eliminar">${I.del}</button></td>` : ''}</tr>`; }).join('') || `<tr><td colspan="${esProp() ? 16 : 15}" class="muted" style="text-align:center;padding:24px">Sin registros en ${h(periodo)}.${esProp() ? ' Use “Registro de hoy” o “Importar Excel” para cargar los controles que ya tiene.' : ''}</td></tr>`}</tbody></table></div></section>`;
      el.querySelectorAll('[data-gl]').forEach((s) => { s.onchange = () => { F[s.dataset.gl] = s.dataset.gl === 'serie' ? s.value : +s.value; pintar(); }; });
      const imp = el.querySelector('[data-glimp]'); if (imp) imp.onchange = async () => { const fl = imp.files[0]; imp.value = ''; if (fl) await importar(fl); };
      A.acts({
        glNuevo: () => formRegistro(null),
        glEditar: (d) => formRegistro(regs.find((r) => r.id === d.id)),
        glBorrar: async (d) => {
          const r = regs.find((x) => x.id === d.id); if (!r) return;
          if (!(await confirmar(`¿Eliminar el registro del ${fechaTxt(r.fecha)} (valor ${r.datos?.valor ?? ''})?`, 'Eliminar'))) return;
          await S.remove(TABLA, r.id); regs = regs.filter((x) => x.id !== r.id); toast('Registro eliminado'); pintar();
        },
        glPDF: async () => {
          if (!lista.length) return toast('No hay registros en el periodo elegido', true);
          const blob = await A.pdfGlucometro(ent, sede, lista);
          S.log('CONSULTA', TABLA, ent.id, `Control glucometría ${periodo}`);
          UI.verPDF({ titulo: `${enc.nombre} · ${periodo}`, blob, nombre: nombreArch(periodo), alDescargar: () => S.log('DESCARGA', TABLA, ent.id, `Control glucometría ${periodo}`) });
        },
        glGuardarPDF: async () => {
          if (!lista.length) return toast('No hay registros en el periodo elegido', true);
          const nombre = nombreArch(periodo);
          const viejos = (await S.list('documentos', { entidad_id: ent.id })).filter((d) => d.carpeta === 'glucometro' && d.nombre === nombre);
          for (const d of viejos) { try { await S.removeFile(d.archivo); } catch {} await S.remove('documentos', d.id); }
          await A.guardarPDF({ blob: await A.pdfGlucometro(ent, sede, lista), nombre, entidad_id: ent.id, equipo_id: null, carpeta: 'glucometro', subcarpeta: sede || null });
          toast('PDF guardado en la carpeta'); A.recargar();
        },
        glExcel: () => excel(lista, periodo),
        glEnc: () => formEncabezado(),
      });
    };
    const nombreArch = (periodo) => `${encDe(ent, sede).codigo} Control glucometria ${sede ? sede + ' ' : ''}${periodo}.pdf`.replace(/[\\/:*?"<>|]/g, '-');

    // ---- formulario de un registro (los datos del glucómetro, lotes, rangos y responsable se copian del último)
    const formRegistro = (r) => {
      const ult = regs.slice().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)) || String(b.created_at).localeCompare(String(a.created_at)))[0]?.datos || {};
      const g0 = glucos[0];
      const d = r ? { ...r.datos } : { marca: ult.marca || g0?.marca || '', modelo: ult.modelo || g0?.modelo || '', serie: ult.serie || g0?.serie || '', lote_tira: ult.lote_tira || '', lote_solucion: ult.lote_solucion || '', rango_normal: ult.rango_normal || '96 – 144 mg/dL', rango_alto: ult.rango_alto || '280 - 420 mg/dL', fecha_apertura: ult.fecha_apertura || '', tipo: ult.tipo || 'NORMAL', valor: '', observaciones: 'Ninguna', responsable: ult.responsable || '', cargo: ult.cargo || '' };
      const fecha = r ? String(r.fecha).slice(0, 10) : UI.hoy();
      modal({ titulo: r ? `Corregir registro del ${fechaTxt(r.fecha)}` : 'Nuevo registro de control de glucometría', size: 'wide',
        cuerpo: `<form class="form" onsubmit="return false">
          ${glucos.length ? `<div class="fields">${f.sel('_eq', 'Glucómetro del inventario (llena marca, modelo y serie)', [['', '— Elegir —'], ...glucos.map((e) => [e.id, `${e.nombre} ${e.marca || ''} ${e.modelo || ''} · Serie ${e.serie || 'NR'}${e.codigo_inv ? ' · ' + e.codigo_inv : ''}`])], '', { full: true })}</div>` : ''}
          <div class="fields">${f.input('fecha', 'Fecha', fecha, { type: 'date', req: true })}${f.input('marca', 'Marca', d.marca)}${f.input('modelo', 'Modelo', d.modelo)}${f.input('serie', 'Serie', d.serie)}
          ${f.input('lote_tira', 'Lote de tirilla empleada', d.lote_tira)}${f.input('lote_solucion', 'Lote solución de control empleada', d.lote_solucion)}
          ${f.input('rango_normal', 'Rango solución NORMAL', d.rango_normal, { attrs: 'placeholder="96 – 144 mg/dL"' })}${f.input('rango_alto', 'Rango solución ALTO', d.rango_alto, { attrs: 'placeholder="280 - 420 mg/dL"' })}
          ${f.input('fecha_apertura', 'Fecha apertura solución de control', d.fecha_apertura, { type: 'date' })}
          ${f.sel('tipo', 'Tipo de solución de control empleada', [['NORMAL', 'Normal'], ['ALTA', 'Alta'], ['AMBAS', 'Normal y alta']], d.tipo)}
          ${f.input('valor', 'Valor obtenido (mg/dL)', d.valor ?? '', { req: true, attrs: 'inputmode="decimal"' })}
          ${f.input('observaciones', 'Observaciones', d.observaciones, { full: true })}
          ${f.input('responsable', 'Responsable', d.responsable)}${f.input('cargo', 'Cargo del responsable', d.cargo)}</div>
          <p class="muted" data-glrango style="font-size:.85rem"></p></form>`,
        alAbrir: (m) => {
          const q = (n) => m.body.querySelector(`[name=${n}]`);
          const se = q('_eq'); if (se) se.onchange = () => { const e = glucos.find((x) => x.id === se.value); if (e) { q('marca').value = e.marca || ''; q('modelo').value = e.modelo || ''; q('serie').value = e.serie || ''; } };
          const aviso = () => { const v = leer(m.body); const p = m.body.querySelector('[data-glrango]'); p.innerHTML = v.valor && fueraDeRango(v) ? '<span class="pill bad">El valor está fuera del rango de la solución empleada</span> Revise el glucómetro y las tiras antes de usarlo con pacientes, y anótelo en observaciones.' : ''; };
          ['valor', 'tipo', 'rango_normal', 'rango_alto'].forEach((n) => { const x = q(n); if (x) x.oninput = x.onchange = aviso; });
        },
        acciones: [{ t: 'Cancelar' }, { t: r ? 'Guardar cambios' : 'Guardar registro', cls: 'pri', fn: async (m) => {
          const v = leer(m.body);
          if (!v.fecha) { toast('Escriba la fecha', true); return false; }
          if (num(v.valor) == null) { toast('Escriba el valor obtenido', true); return false; }
          const datos = Object.fromEntries(CAMPOS.map((k) => [k, String(v[k] ?? '').trim()]));
          datos.valor = num(v.valor); if (v._eq) datos.equipo_id = v._eq; else if (r?.datos?.equipo_id) datos.equipo_id = r.datos.equipo_id;
          try {
            if (r) { const u = await S.update(TABLA, r.id, { fecha: v.fecha, datos }); regs = regs.map((x) => (x.id === r.id ? u : x)); }
            else { regs.push(await S.insert(TABLA, { entidad_id: ent.id, sede: sede || null, fecha: v.fecha, datos })); }
          } catch (er) { toast(er.message, true); return false; }
          toast(fueraDeRango(datos) ? 'Registro guardado · FUERA DE RANGO' : 'Registro guardado', fueraDeRango(datos));
          F.anio = +v.fecha.slice(0, 4); pintar();
        } }] });
    };

    // ---- encabezado del formato (por sede): proceso, subproceso, nombre, código, versión, fecha
    const formEncabezado = () => {
      const e = encDe(ent, sede);
      modal({ titulo: `Encabezado del formato${sede ? ' · ' + sede : ''}`, size: 'wide',
        cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('proceso', 'Proceso', e.proceso, { full: true })}${f.input('subproceso', 'Subproceso', e.subproceso, { full: true })}${f.input('nombre', 'Nombre del documento', e.nombre, { full: true })}
          ${f.input('codigo', 'Código', e.codigo)}${f.input('version', 'Versión', e.version)}${f.input('fecha', 'Fecha', e.fecha)}${f.input('franja', 'Título de la tabla', e.franja)}</div>
          <p class="muted">El logo es el de la entidad (Entidades › editar). Este encabezado sale en la pantalla, el PDF y el Excel.</p></form>`,
        acciones: [...(propio(ent, sede) ? [{ t: 'Usar el de Formatos', fn: async () => { const todos = { ...(ent.config?.fmt_glucometro || {}) }; delete todos[sede || '_']; if (await A.guardarConfig(ent, { ...(ent.config || {}), fmt_glucometro: todos })) { toast('Ahora usa el encabezado de Formatos'); pintar(); } } }] : []), { t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
          const v = leer(m.body); const todos = { ...(ent.config?.fmt_glucometro || {}) }; todos[sede || '_'] = v;
          if (await A.guardarConfig(ent, { ...(ent.config || {}), fmt_glucometro: todos })) { toast('Encabezado guardado'); pintar(); }
        } }] });
    };

    // ---- importar el Excel que ya lleva la entidad (mismas columnas del formato)
    const importar = async (file) => {
      const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
      const nuevos = [], malas = [];
      const fechaX = (c) => {
        if (c == null || c === '') return null;
        if (typeof c === 'number') { const p = XLSX.SSF.parse_date_code(c); return p ? `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}` : null; }
        const m = String(c).replace(/\s+/g, '').match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/); if (!m) return null;
        const [d, mm, y] = [+m[1], +m[2], +m[3]]; return y > 1990 && mm >= 1 && mm <= 12 && d >= 1 && d <= 31 ? `${y}-${String(mm).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;
      };
      for (const n of wb.SheetNames) {
        const filas = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '', raw: true });
        // la fila de títulos "MARCA | MODELO SERIE | SEIE | LOTE DE TIRILLA…" marca dónde empiezan los datos
        const ini = filas.findIndex((r) => /marca/i.test(String(r[1])) && /lote/i.test(String(r[4])));
        if (ini < 0) continue;
        for (let i = ini + 1; i < filas.length; i++) {
          const r = filas[i]; if (!r.slice(1, 21).some((x) => String(x).trim())) continue;
          const fecha = fechaX(r[0]); const s = (k) => String(r[k] ?? '').trim();
          if (!fecha) { malas.push(`fila ${i + 1} (${s(0) || 'sin fecha'})`); continue; }
          const tN = /x|✓|si/i.test(s(9)), tA = /x|✓|si/i.test(s(10));
          nuevos.push({ entidad_id: ent.id, sede: sede || null, fecha, datos: { marca: s(1), modelo: s(2), serie: s(3), lote_tira: s(4), lote_solucion: s(5), rango_normal: s(6), rango_alto: s(7), fecha_apertura: fechaX(r[8]) || s(8), tipo: tN && tA ? 'AMBAS' : tA ? 'ALTA' : 'NORMAL', valor: num(r[11]) ?? s(11), observaciones: s(12), responsable: s(15), cargo: s(20) } });
        }
      }
      if (!nuevos.length) return toast('No encontré registros: el archivo debe tener las columnas del formato de control de glucometría', true);
      const ya = new Set(regs.map((r) => `${String(r.fecha).slice(0, 10)}|${r.datos?.serie}|${r.datos?.valor}|${r.datos?.tipo}`));
      const pend = nuevos.filter((x) => !ya.has(`${x.fecha}|${x.datos.serie}|${x.datos.valor}|${x.datos.tipo}`));
      if (!(await confirmar(`Se encontraron ${nuevos.length} registros${nuevos.length - pend.length ? ` (${nuevos.length - pend.length} ya estaban cargados)` : ''}. Se agregarán ${pend.length}.${malas.length ? `\n\nNo se pudieron leer ${malas.length} filas por la fecha mal escrita: ${malas.slice(0, 6).join(', ')}${malas.length > 6 ? '…' : ''}. Agréguelas a mano con “Registro de hoy”.` : ''} ¿Continuar?`, 'Importar'))) return;
      let n = 0; for (const x of pend) { try { regs.push(await S.insert(TABLA, x)); n++; } catch (er) { toast(er.message, true); break; } }
      F.anio = 0; F.mes = 0; toast(`${n} registros importados${malas.length ? ` · ${malas.length} filas con fecha mal escrita no se cargaron` : ''}`); pintar();
    };

    // ---- Excel con el mismo diseño (solo propietario)
    const excel = (lista, periodo) => {
      if (!esProp()) return toast('Solo IBCOL descarga el formato en Excel', true);
      const e = encDe(ent, sede);
      const aoa = [
        ['', 'PROCESO', e.proceso, ...Array(16).fill(''), 'Código:', e.codigo], ['', 'SUBPROCESO', e.subproceso, ...Array(16).fill(''), 'Versión:', e.version],
        ['', 'NOMBRE DEL DOCUMENTO', '', ...Array(16).fill(''), 'Fecha:', e.fecha], ['', '', e.nombre], [], [e.franja], [],
        ['FECHA', 'MARCA GLUCOMETRO', '', '', 'TIRA GLUCOMETRIA', '', 'LOTE SOLUCIÓN DE CONTROL EMPLEADA', '', 'FECHA APERTURA SOLUCIÓN DE CONTROL', 'TIPO DE SOLUCIÓN DE CONTROL EMPLEADA', '', 'VALOR OBTENIDO', 'OBSERVACIONES', '', '', 'RESPONSABLE', '', '', '', '', 'CARGO DEL RESPONSABLE'],
        ['', 'MARCA', 'MODELO', 'SERIE', 'LOTE DE TIRILLA EMPLEADA', 'LOTE SOLUCIÓN DE CONTROL EMPLEADA', 'NORMAL', 'ALTO', '', 'NORMAL', 'ALTA'],
        ...lista.map((r) => { const d = r.datos || {}; return [fechaTxt(r.fecha), d.marca, d.modelo, d.serie, d.lote_tira, d.lote_solucion, d.rango_normal, d.rango_alto, fechaTxt(d.fecha_apertura), d.tipo === 'NORMAL' || d.tipo === 'AMBAS' ? 'x' : '', d.tipo === 'ALTA' || d.tipo === 'AMBAS' ? 'x' : '', d.valor, d.observaciones, '', '', d.responsable, '', '', '', '', d.cargo]; }),
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const R = (a) => XLSX.utils.decode_range(a);
      ws['!merges'] = ['C1:S1', 'U1:Y1', 'C2:S3', 'U2:Y2', 'B3:B4', 'U3:Y3', 'C4:S4', 'A6:Y6', 'A8:A9', 'B8:D8', 'E8:F8', 'G8:H8', 'I8:I9', 'J8:K8', 'L8:L9', 'M8:O9', 'P8:T9', 'U8:Y9',
        ...lista.flatMap((_, i) => [`M${i + 10}:O${i + 10}`, `P${i + 10}:T${i + 10}`, `U${i + 10}:Y${i + 10}`])].map(R);
      ws['!cols'] = [17.4, 17.4, 17.4, 17.4, 17.4, 22, 22, 22, 22, 10.3, 8.3, 14, 7, 4.1, 4.6, 4.6, 2.7, 2.1, 2.6, 7.9, 5.1, 5.1, 5.1, 5.1, 9.1].map((wch) => ({ wch }));
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, (sede || 'CONTROL').slice(0, 31));
      XLSX.writeFile(wb, nombreArch(periodo).replace(/\.pdf$/, '.xlsx'));
      S.log('DESCARGA', TABLA, ent.id, `Excel control glucometría ${periodo}`);
    };
    pintar();
  };

  // ------------------------------------------------------------------ PDF con el diseño del formato Excel
  A.pdfGlucometro = async (ent, sede, lista) => {
    const e = encDe(ent, sede);
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'letter', orientation: 'landscape' });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 8, ancho = W - 2 * M;
    const GR = [178, 178, 178], N = [0, 0, 0];
    // anchos de columna del Excel (A…Y) llevados al ancho de la hoja
    const wch = [17.4, 17.4, 17.4, 17.4, 17.4, 22, 22, 22, 22, 10.3, 8.3, 14, 7, 4.1, 4.6, 4.6, 2.7, 2.1, 2.6, 7.9, 5.1, 5.1, 5.1, 5.1, 9.1];
    const k = ancho / wch.reduce((a, b) => a + b, 0), cw = wch.map((x) => x * k), suma = (i, j) => cw.slice(i, j + 1).reduce((a, b) => a + b, 0);
    const img = (src, x, y, mw, mh) => { if (!src) return; try { const p = doc.getImageProperties(src); const r = Math.min(mw / p.width, mh / p.height); doc.addImage(src, /^data:image\/png/i.test(src) ? 'PNG' : 'JPEG', x + (mw - p.width * r) / 2, y + (mh - p.height * r) / 2, p.width * r, p.height * r); } catch (er) { console.warn(er); } };
    const celda = (x, y, w, hh, t, o = {}) => {
      if (o.fill) { doc.setFillColor(...o.fill); doc.rect(x, y, w, hh, 'FD'); } else doc.rect(x, y, w, hh);
      if (!t) return; doc.setFont('helvetica', o.bold ? 'bold' : 'normal'); doc.setFontSize(o.fs || 8); doc.setTextColor(...N);
      const ln = doc.splitTextToSize(String(t), w - 2); const lh = (o.fs || 8) * 0.42;
      const y0 = y + hh / 2 - ((ln.length - 1) * lh) / 2 + lh * 0.35;
      ln.forEach((l, i) => doc.text(l, o.left ? x + 1.5 : x + w / 2, y0 + i * lh, { align: o.left ? 'left' : 'center' }));
    };
    // encabezado (filas 1-6 del Excel)
    const encabezado = () => {
      doc.setDrawColor(...N); doc.setLineWidth(0.25);
      const y = M, fh = [7.5, 7.5, 5.6, 7.5], x = (i) => M + suma(0, i - 1), Y = (i) => y + fh.slice(0, i).reduce((a, b) => a + b, 0), tot = fh.reduce((a, b) => a + b, 0);
      // A1:A4 logo de la entidad
      doc.rect(M, y, cw[0], tot); img(ent.logo, M + 1, y + 1, cw[0] - 2, tot - 2);
      const wB = cw[1], wC = suma(2, 16), wT = suma(17, 19), wU = suma(20, 24);
      celda(x(1), Y(0), wB, fh[0], 'PROCESO', { bold: true, fs: 5.8 }); celda(x(2), Y(0), wC, fh[0], e.proceso, { bold: true, fs: 8.5 });
      celda(x(1), Y(1), wB, fh[1], 'SUBPROCESO', { bold: true, fs: 5.8 }); celda(x(2), Y(1), wC, fh[1] + fh[2], e.subproceso, { bold: true, fs: 8.5 });
      celda(x(1), Y(2), wB, fh[2] + fh[3], 'NOMBRE DEL DOCUMENTO', { bold: true, fs: 5.8 }); celda(x(2), Y(3), wC, fh[3], e.nombre, { bold: true, fs: 9.5 });
      [['Código:', e.codigo], ['Versión:', e.version], ['Fecha:', e.fecha], ['', '']].forEach(([a, b], i) => { celda(x(17), Y(i), wT, fh[i], a, { fs: 6.5 }); celda(x(20), Y(i), wU, fh[i], b, { fs: 7 }); });
      const y6 = y + tot + 2.5; celda(M, y6, ancho, 6, e.franja, { bold: true, fs: 9, fill: GR });
      return y6 + 6 + 2;
    };
    const y0 = encabezado();
    // tabla (filas 8-9 del Excel + datos); columnas con celdas combinadas como en el Excel
    const x = (d) => (d ? 'x' : '');
    const body = lista.map((r) => { const d = r.datos || {}; return [fechaTxt(r.fecha), d.marca || '', d.modelo || '', d.serie || '', d.lote_tira || '', d.lote_solucion || '', d.rango_normal || '', d.rango_alto || '', fechaTxt(d.fecha_apertura), x(d.tipo === 'NORMAL' || d.tipo === 'AMBAS'), x(d.tipo === 'ALTA' || d.tipo === 'AMBAS'), d.valor ?? '', d.observaciones || '', d.responsable || '', d.cargo || '']; });
    const anchos = [cw[0], cw[1], cw[2], cw[3], cw[4], cw[5], cw[6], cw[7], cw[8], cw[9], cw[10], cw[11], suma(12, 14), suma(15, 19), suma(20, 24)];
    const colStyles = {}; anchos.forEach((w, i) => { colStyles[i] = { cellWidth: w, halign: 'center' }; });
    const hd = (t, o = {}) => ({ content: t, ...o });
    doc.autoTable({ startY: y0, theme: 'grid', margin: { left: M, right: M, top: y0, bottom: 12 }, tableWidth: ancho,
      head: [[hd('FECHA', { rowSpan: 2 }), hd('MARCA GLUCOMETRO', { colSpan: 3 }), hd('TIRA GLUCOMETRIA', { colSpan: 2 }), hd('LOTE SOLUCIÓN DE CONTROL EMPLEADA', { colSpan: 2 }), hd('FECHA APERTURA SOLUCIÓN DE CONTROL', { rowSpan: 2 }), hd('TIPO DE SOLUCIÓN DE CONTROL EMPLEADA', { colSpan: 2 }), hd('VALOR OBTENIDO', { rowSpan: 2 }), hd('OBSERVACIONES', { rowSpan: 2 }), hd('RESPONSABLE', { rowSpan: 2 }), hd('CARGO DEL RESPONSABLE', { rowSpan: 2 })],
        ['MARCA', 'MODELO', 'SERIE', 'LOTE DE TIRILLA EMPLEADA', 'LOTE SOLUCIÓN DE CONTROL EMPLEADA', 'NORMAL', 'ALTO', 'NORMAL', 'ALTA']],
      body: body.length ? body : [Array(15).fill('')],
      styles: { fontSize: 6.8, cellPadding: 0.9, lineColor: N, lineWidth: 0.2, textColor: N, valign: 'middle', halign: 'center', overflow: 'linebreak' },
      headStyles: { fillColor: GR, textColor: N, fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 5.9, cellPadding: 0.6, lineColor: N, lineWidth: 0.2 },
      columnStyles: colStyles,
      didParseCell: (c) => { if (c.section === 'head' && c.row.index === 1 && c.cell.raw && /^(NORMAL|ALTA)$/.test(String(c.cell.raw)) && c.column.index >= 9) c.cell.styles.fontSize = 5; },
      didDrawPage: () => { if (doc.getCurrentPageInfo().pageNumber > 1) encabezado(); } });
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(60); doc.text(`${e.codigo} · Versión ${e.version}`, M, H - 5); doc.text(`Página ${i} de ${n}`, W - M, H - 5, { align: 'right' }); doc.setTextColor(...N); }
    return doc.output('blob');
  };
})();
