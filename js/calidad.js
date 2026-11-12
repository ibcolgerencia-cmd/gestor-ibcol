// =====================================================================
//  PORTAL DEL ÁREA DE CALIDAD (un enlace por entidad)
//  Usuario y contraseña propios (rol "calidad"), independientes del usuario
//  principal de la entidad. Solo permite:
//   · Lista de chequeo de limpieza y desinfección (diligenciar)
//   · Reporte de daño de equipos (reportar y ver sus reportes)
//  No ve inventarios, hojas de vida, documentos ni ninguna otra carpeta
//  (también lo impiden las reglas de la base de datos: supabase/seguridad_calidad.sql).
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, leer, f } = UI;

  // documentos que puede diligenciar cada usuario de calidad / auxiliar (se guardan en la entidad: config.calidad_docs[usuario])
  const DOCS = [['limpieza', 'Lista de chequeo limpieza y desinfección'], ['dano', 'Reporte de daño de equipos'], ['glucometro', 'Control de calidad glucómetro (control de glucometría)'], ['temperatura', 'Registro de temperatura y humedad'], ['evento', 'Reporte de eventos / incidentes adversos (FT-PGTV-016)']];
  A.DOCS_CALIDAD = DOCS;
  A.docsCalidad = (ent, p) => { const l = ent?.config?.calidad_docs?.[p?.usuario]; return Array.isArray(l) && l.length ? l : DOCS.map((d) => d[0]); };
  A.docsCalidadTxt = (ent, p) => A.docsCalidad(ent, p).map((k) => ({ limpieza: 'limpieza', dano: 'reporte de daño', glucometro: 'glucometría', temperatura: 'temperatura y humedad', evento: 'eventos adversos' }[k])).filter(Boolean).join(', ');
  A.checksDocsCalidad = (sel) => `<fieldset class="field full" style="border:1px solid var(--line);border-radius:8px;padding:8px 10px"><legend style="font-size:.85rem;font-weight:600;padding:0 4px">Documentos que puede diligenciar *</legend>
    ${DOCS.map(([k, t]) => `<label style="display:flex;gap:8px;align-items:center;margin:4px 0"><input type="checkbox" data-doccal="${k}" ${!sel || sel.includes(k) ? 'checked' : ''}> ${h(t)}</label>`).join('')}</fieldset>`;
  A.leerDocsCalidad = (root) => [...root.querySelectorAll('[data-doccal]')].filter((c) => c.checked).map((c) => c.dataset.doccal);
  A.guardarDocsCalidad = async (ent, usuario, docs) => {
    if (!ent || !usuario) return; const ent2 = (await S.get('entidades', ent.id)) || ent;
    await A.guardarConfig(ent2, { ...(ent2.config || {}), calidad_docs: { ...(ent2.config?.calidad_docs || {}), [usuario]: docs } });
  };

  const base = () => location.origin + location.pathname.replace(/index\.html$/, '');
  A.linkCalidad = (ent, sede = null) => `${base()}?portal=calidad&n=${encodeURIComponent(((ent.sigla || ent.razon_social || '') + (sede ? ' · ' + sede : '')).slice(0, 200))}`;

  // ---------------------------------------------------------------- vista del usuario de calidad
  A.V.calidad = async () => {
    const c = A.content();
    const ent = st.perfil?.entidad_id ? await S.get('entidades', st.perfil.entidad_id) : null;
    if (!ent) { c.innerHTML = '<div class="empty">Su usuario de calidad aún no tiene una entidad asignada. Contacte a IBCOL.</div>'; return; }
    const docs = A.docsCalidad(ent, st.perfil);
    if (!docs.includes(st.calTab)) st.calTab = docs[0];
    const sede = st.perfil?.sede || null;
    if (!sede) {
      const sedes = A.sedesDe(await S.list('consultorios', { entidad_id: ent.id }), ent);
      if (sedes.length > 1) { c.innerHTML = `<div class="page-head"><div><span class="eyebrow">Portal del área de calidad</span><h1>${h(ent.razon_social)}</h1></div></div><div class="empty">Su usuario de calidad aún no tiene una sede asignada. Pida a IBCOL que le asigne la sede para ver y diligenciar los servicios de esa sede.</div>`; return; }
    }
    c.innerHTML = `<div class="page-head"><div><span class="eyebrow">Portal del área de calidad${sede ? ' · ' + h(sede) : ''}</span><h1>${h(ent.razon_social)}</h1>
        <span class="muted">Diligencie los documentos asignados a su usuario. Las demás carpetas de la entidad no están disponibles con este acceso.</span></div></div>
      <div class="tabs" role="tablist" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
        ${docs.includes('limpieza') ? `<button class="btn ${st.calTab === 'limpieza' ? 'pri' : ''}" data-cal-tab="limpieza" role="tab" aria-selected="${st.calTab === 'limpieza'}">${I.check || ''} Lista de chequeo limpieza y desinfección</button>` : ''}
        ${docs.includes('dano') ? `<button class="btn ${st.calTab === 'dano' ? 'pri' : ''}" data-cal-tab="dano" role="tab" aria-selected="${st.calTab === 'dano'}">${I.alerta} Reporte de daño de equipos</button>` : ''}
        ${docs.includes('glucometro') ? `<button class="btn ${st.calTab === 'glucometro' ? 'pri' : ''}" data-cal-tab="glucometro" role="tab" aria-selected="${st.calTab === 'glucometro'}">${I.check || ''} Control calidad glucómetro</button>` : ''}
        ${docs.includes('temperatura') ? `<button class="btn ${st.calTab === 'temperatura' ? 'pri' : ''}" data-cal-tab="temperatura" role="tab" aria-selected="${st.calTab === 'temperatura'}">${I.check || ''} Temperatura y humedad</button>` : ''}
        ${docs.includes('evento') ? `<button class="btn ${st.calTab === 'evento' ? 'pri' : ''}" data-cal-tab="evento" role="tab" aria-selected="${st.calTab === 'evento'}">${I.alerta} Reporte de eventos adversos</button>` : ''}</div>
      <div data-cal-cuerpo></div>`;
    c.querySelectorAll('[data-cal-tab]').forEach((b) => (b.onclick = () => { st.calTab = b.dataset.calTab; A.recargar(); }));
    const cu = c.querySelector('[data-cal-cuerpo]');
    if (st.calTab === 'limpieza') await A.G.limpieza(cu, { ent, sede });
    else if (st.calTab === 'glucometro') await A.G.glucometro(cu, { ent, sede });
    else if (st.calTab === 'temperatura') await A.G.temperatura(cu, { ent, sede });
    else if (st.calTab === 'evento') await A.G.eventosCalidad(cu, { ent, sede });
    else { cu.innerHTML = '<section class="panel" data-reportes></section>'; await A.panelReportes(cu.querySelector('[data-reportes]'), { entidadId: ent.id, sede }); }
  };

  // ---------------------------------------------------------------- crear usuario de calidad (propietario)
  A.nuevoUsuarioCalidad = async (ent, alListo) => {
    const sedes = A.sedesDe(await S.list('consultorios', { entidad_id: ent.id }), ent);
    return modal({
    titulo: `Usuario del área de calidad · ${ent.razon_social}`, size: 'sm',
    cuerpo: `<form class="form" onsubmit="return false"><p class="muted">Este usuario (calidad o auxiliar) solo podrá diligenciar los documentos que marque. No ve el resto de la carpeta de la entidad.</p>
      <div class="fields">${f.sel('sede', 'Sede * (solo verá y diligenciará los servicios de esta sede)', [...(sedes.length > 1 ? [['', 'Seleccione la sede…']] : []), ...sedes.map((x) => [x, x])], sedes.length > 1 ? '' : (sedes[0] || ''), { full: true })}
      ${f.input('nombre', 'Nombre del encargado de calidad *', '')}${f.input('usuario', 'Usuario *', '', { attrs: 'autocapitalize="none" placeholder="ej: calidad.siempree"' })}
      ${f.input('clave', 'Contraseña * (mínimo 8, con letras y números)', '', { attrs: 'autocomplete="new-password"' })}${A.checksDocsCalidad(null)}</div></form>`,
    acciones: [{ t: 'Cancelar' }, { t: 'Crear usuario', cls: 'pri', fn: async (m) => {
      const d = leer(m.body); d.usuario = String(d.usuario || '').toLowerCase().trim().replace(/\s+/g, '.');
      if (!d.nombre || !d.usuario) { toast('Escriba el nombre y el usuario', true); return false; }
      if (!/^[a-z0-9._-]+$/.test(d.usuario)) { toast('El usuario solo puede tener letras, números, punto y guion', true); return false; }
      const err = S.claveDebil?.(d.clave); if (err) { toast(err, true); return false; }
      if (sedes.length > 1 && !d.sede) { toast('Seleccione la sede del usuario', true); return false; }
      const docsC = A.leerDocsCalidad(m.body); if (!docsC.length) { toast('Marque al menos un documento que diligenciará', true); return false; }
      const sedeU = sedes.length > 1 ? d.sede : null;
      try { await S.crearUsuarioCliente({ ...d, sede: sedeU, entidad_id: ent.id, rol: 'calidad' }); }
      catch (e) { if (/asignar_perfil_calidad|function|schema cache/i.test(e.message)) { toast('Falta activar el portal de calidad en la base de datos (supabase/seguridad_calidad.sql).', true); return false; } throw e; }
      await A.guardarDocsCalidad(ent, d.usuario, docsC);
      toast(`Usuario de calidad ${d.usuario} creado`);
      modal({ titulo: 'Datos para entregar al encargado de calidad', size: 'sm',
        cuerpo: `<p>Enlace: <a href="${h(A.linkCalidad(ent, sedeU))}" target="_blank" rel="noopener" class="mono" style="word-break:break-all">${h(A.linkCalidad(ent, sedeU))}</a></p><p>Usuario: <b class="mono">${h(d.usuario)}</b></p><p class="muted">Entregue la contraseña por un medio privado (no en el mismo mensaje del enlace).</p>`,
        acciones: [{ t: 'Copiar enlace y usuario', fn: async () => { await copiar(`Portal de calidad ${ent.razon_social}${sedeU ? ' · Sede ' + sedeU : ''}\n${A.linkCalidad(ent, sedeU)}\nUsuario: ${d.usuario}`); return false; } }, { t: 'Listo', cls: 'pri' }] });
      alListo?.();
    } }],
  }); };
  const copiar = async (t) => { try { await navigator.clipboard.writeText(t); toast('Copiado'); } catch { prompt('Copie el texto:', t); } };

  // ---------------------------------------------------------------- sección del panel de control (propietario)
  A.panelPortales = async (cont) => {
    if (!cont || st.perfil?.rol !== 'propietario') return;
    const [ents, perf] = await Promise.all([S.list('entidades', {}, 'razon_social'), S.list('perfiles').then((l) => l.filter((p) => !String(p.usuario || '').includes('.eliminado.'))).catch(() => [])]);
    const usuarios = (id) => perf.filter((p) => p.rol === 'calidad' && p.entidad_id === id);
    cont.innerHTML = `<header><h3>${I.users.replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px"')} Portal del área de calidad · limpieza y reporte de daño</h3></header>
      <p class="muted" style="margin-top:0">Un enlace para el encargado de calidad de cada entidad o de cada sede, con usuario y contraseña propios. Solo permite diligenciar la lista de chequeo de limpieza y desinfección y reportar daños de equipos; el resto de la carpeta queda protegido.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Entidad</th><th>Usuarios de calidad</th><th>Enlace</th><th></th></tr></thead><tbody>
      ${ents.filter((e) => e.activo !== false).map((e) => { const us = usuarios(e.id); return `<tr><td><b>${h(e.razon_social)}</b></td>
        <td>${us.length ? us.map((u) => `<span class="pill ${u.activo ? 'ok' : 'bad'}" title="${h(u.nombre || '')}">${h(u.usuario)} · ${h(u.sede || 'todas las sedes')}</span>`).join(' ') : '<span class="muted">Sin usuario</span>'}</td>
        <td><button class="btn sm" data-pc-copiar="${e.id}" title="${h(A.linkCalidad(e))}">Copiar enlace</button></td>
        <td style="white-space:nowrap"><button class="btn sm pri" data-pc-nuevo="${e.id}">${I.mas} Usuario de calidad</button>${us.length ? ` <button class="btn sm" data-pc-ver="${e.id}">Gestionar</button>` : ''}</td></tr>`; }).join('')}
      </tbody></table></div>`;
    const E = (id) => ents.find((x) => x.id === id);
    cont.querySelectorAll('[data-pc-copiar]').forEach((b) => (b.onclick = () => copiar(A.linkCalidad(E(b.dataset.pcCopiar)))));
    cont.querySelectorAll('[data-pc-nuevo]').forEach((b) => (b.onclick = () => A.nuevoUsuarioCalidad(E(b.dataset.pcNuevo), () => A.panelPortales(cont))));
    cont.querySelectorAll('[data-pc-ver]').forEach((b) => (b.onclick = () => A.go('usuarios', { ent: b.dataset.pcVer })));
  };
})();
