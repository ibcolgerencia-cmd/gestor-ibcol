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

  const base = () => location.origin + location.pathname.replace(/index\.html$/, '');
  A.linkCalidad = (ent) => `${base()}?portal=calidad&n=${encodeURIComponent(ent.sigla || ent.razon_social || '').slice(0, 200)}`;

  // ---------------------------------------------------------------- vista del usuario de calidad
  A.V.calidad = async () => {
    const c = A.content();
    const ent = st.perfil?.entidad_id ? await S.get('entidades', st.perfil.entidad_id) : null;
    if (!ent) { c.innerHTML = '<div class="empty">Su usuario de calidad aún no tiene una entidad asignada. Contacte a IBCOL.</div>'; return; }
    st.calTab = st.calTab || 'limpieza';
    c.innerHTML = `<div class="page-head"><div><span class="eyebrow">Portal del área de calidad</span><h1>${h(ent.razon_social)}</h1>
        <span class="muted">Diligencie la lista de chequeo de limpieza y desinfección y reporte los daños de los equipos biomédicos. Las demás carpetas de la entidad no están disponibles con este acceso.</span></div></div>
      <div class="tabs" role="tablist" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
        <button class="btn ${st.calTab === 'limpieza' ? 'pri' : ''}" data-cal-tab="limpieza" role="tab" aria-selected="${st.calTab === 'limpieza'}">${I.check || ''} Lista de chequeo limpieza y desinfección</button>
        <button class="btn ${st.calTab === 'dano' ? 'pri' : ''}" data-cal-tab="dano" role="tab" aria-selected="${st.calTab === 'dano'}">${I.alerta} Reporte de daño de equipos</button></div>
      <div data-cal-cuerpo></div>`;
    c.querySelectorAll('[data-cal-tab]').forEach((b) => (b.onclick = () => { st.calTab = b.dataset.calTab; A.recargar(); }));
    const cu = c.querySelector('[data-cal-cuerpo]');
    if (st.calTab === 'limpieza') await A.G.limpieza(cu, { ent, sede: null });
    else { cu.innerHTML = '<section class="panel" data-reportes></section>'; await A.panelReportes(cu.querySelector('[data-reportes]'), { entidadId: ent.id }); }
  };

  // ---------------------------------------------------------------- crear usuario de calidad (propietario)
  A.nuevoUsuarioCalidad = (ent, alListo) => modal({
    titulo: `Usuario del área de calidad · ${ent.razon_social}`, size: 'sm',
    cuerpo: `<form class="form" onsubmit="return false"><p class="muted">Este usuario solo podrá diligenciar la lista de chequeo de limpieza y desinfección y reportar daños de equipos. No ve el resto de la carpeta de la entidad.</p>
      <div class="fields">${f.input('nombre', 'Nombre del encargado de calidad *', '')}${f.input('usuario', 'Usuario *', '', { attrs: 'autocapitalize="none" placeholder="ej: calidad.siempree"' })}
      ${f.input('clave', 'Contraseña * (mínimo 8, con letras y números)', '', { attrs: 'autocomplete="new-password"' })}</div></form>`,
    acciones: [{ t: 'Cancelar' }, { t: 'Crear usuario', cls: 'pri', fn: async (m) => {
      const d = leer(m.body); d.usuario = String(d.usuario || '').toLowerCase().trim().replace(/\s+/g, '.');
      if (!d.nombre || !d.usuario) { toast('Escriba el nombre y el usuario', true); return false; }
      if (!/^[a-z0-9._-]+$/.test(d.usuario)) { toast('El usuario solo puede tener letras, números, punto y guion', true); return false; }
      const err = S.claveDebil?.(d.clave); if (err) { toast(err, true); return false; }
      try { await S.crearUsuarioCliente({ ...d, entidad_id: ent.id, rol: 'calidad' }); }
      catch (e) { if (/asignar_perfil_calidad|function|schema cache/i.test(e.message)) { toast('Falta activar el portal de calidad en la base de datos (supabase/seguridad_calidad.sql).', true); return false; } throw e; }
      toast(`Usuario de calidad ${d.usuario} creado`);
      modal({ titulo: 'Datos para entregar al encargado de calidad', size: 'sm',
        cuerpo: `<p>Enlace: <a href="${h(A.linkCalidad(ent))}" target="_blank" rel="noopener" class="mono" style="word-break:break-all">${h(A.linkCalidad(ent))}</a></p><p>Usuario: <b class="mono">${h(d.usuario)}</b></p><p class="muted">Entregue la contraseña por un medio privado (no en el mismo mensaje del enlace).</p>`,
        acciones: [{ t: 'Copiar enlace y usuario', fn: async () => { await copiar(`Portal de calidad ${ent.razon_social}\n${A.linkCalidad(ent)}\nUsuario: ${d.usuario}`); return false; } }, { t: 'Listo', cls: 'pri' }] });
      alListo?.();
    } }],
  });
  const copiar = async (t) => { try { await navigator.clipboard.writeText(t); toast('Copiado'); } catch { prompt('Copie el texto:', t); } };

  // ---------------------------------------------------------------- sección del panel de control (propietario)
  A.panelPortales = async (cont) => {
    if (!cont || st.perfil?.rol !== 'propietario') return;
    const [ents, perf] = await Promise.all([S.list('entidades', {}, 'razon_social'), S.list('perfiles').catch(() => [])]);
    const usuarios = (id) => perf.filter((p) => p.rol === 'calidad' && p.entidad_id === id);
    cont.innerHTML = `<header><h3>${I.users.replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px"')} Portal del área de calidad · limpieza y reporte de daño</h3></header>
      <p class="muted" style="margin-top:0">Un enlace por entidad para el encargado de calidad, con usuario y contraseña propios. Solo permite diligenciar la lista de chequeo de limpieza y desinfección y reportar daños de equipos; el resto de la carpeta queda protegido.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Entidad</th><th>Usuarios de calidad</th><th>Enlace</th><th></th></tr></thead><tbody>
      ${ents.filter((e) => e.activo !== false).map((e) => { const us = usuarios(e.id); return `<tr><td><b>${h(e.razon_social)}</b></td>
        <td>${us.length ? us.map((u) => `<span class="pill ${u.activo ? 'ok' : 'bad'}" title="${h(u.nombre || '')}">${h(u.usuario)}</span>`).join(' ') : '<span class="muted">Sin usuario</span>'}</td>
        <td><button class="btn sm" data-pc-copiar="${e.id}" title="${h(A.linkCalidad(e))}">Copiar enlace</button></td>
        <td style="white-space:nowrap"><button class="btn sm pri" data-pc-nuevo="${e.id}">${I.mas} Usuario de calidad</button>${us.length ? ` <button class="btn sm" data-pc-ver="${e.id}">Gestionar</button>` : ''}</td></tr>`; }).join('')}
      </tbody></table></div>`;
    const E = (id) => ents.find((x) => x.id === id);
    cont.querySelectorAll('[data-pc-copiar]').forEach((b) => (b.onclick = () => copiar(A.linkCalidad(E(b.dataset.pcCopiar)))));
    cont.querySelectorAll('[data-pc-nuevo]').forEach((b) => (b.onclick = () => A.nuevoUsuarioCalidad(E(b.dataset.pcNuevo), () => A.panelPortales(cont))));
    cont.querySelectorAll('[data-pc-ver]').forEach((b) => (b.onclick = () => A.go('usuarios', { ent: b.dataset.pcVer })));
  };
})();
