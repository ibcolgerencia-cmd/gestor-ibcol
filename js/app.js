// =====================================================================
//  Gestor biomédico IBCOL — núcleo de la aplicación y vistas principales
// =====================================================================
// Protección contra clickjacking: el gestor no se deja abrir dentro de marcos de otros sitios
if (window.top !== window.self) { try { window.top.location.replace(window.self.location.href); } catch { document.documentElement.innerHTML = '<p style="font:16px sans-serif;padding:20px">Por seguridad, abra el Gestor Biomédico IBCOL directamente en el navegador.</p>'; } }
window.APP = (() => {
  const { h, I, toast, modal, confirmar, leer, f } = UI;
  const S = window.Store;
  const st = { perfil: null, emp: {}, firma: null, fmt: {}, pila: [], acts: {} };
  const A = { st, S };
  const esProp = () => st.perfil?.rol === 'propietario';
  A.esProp = esProp;
  const esCalidad = () => st.perfil?.rol === 'calidad';
  A.esCalidad = esCalidad;
  const portal = (() => { try { const q = new URLSearchParams(location.search); return q.get('portal') === 'calidad' ? { nombre: (q.get('n') || '').slice(0, 120) } : null; } catch { return null; } })();
  A.portal = portal;
  const root = document.getElementById('root');

  // ---------------------------------------------------------------- arranque
  A.arrancar = async () => {
    aplicarTema();
    try {
      await S.init?.();
      const p = await S.sesion();
      p ? entrar(p) : login();
    } catch (e) { console.error(e); root.innerHTML = `<div class="loading">No se pudo iniciar: ${h(e.message)}</div>`; }
  };

  // Otra pestaña entró con otro usuario (o cerró sesión): se recarga para no guardar con el usuario equivocado
  let avisoSesion = false;
  window.addEventListener('ibcol-sesion-cambio', () => {
    if (avisoSesion) return; avisoSesion = true;
    root.innerHTML = `<div class="loading" style="text-align:center;padding:40px 16px;line-height:1.6"><b>Se cambió el usuario en otra pestaña de este navegador.</b><br>Esta página se recarga con el usuario que quedó activo…<br><small class="muted">Para trabajar a la vez como propietario y como cliente, use otro navegador o una ventana de incógnito para el cliente.</small></div>`;
    setTimeout(() => location.reload(), 2500);
  });

  function aplicarTema() { let t = null; try { t = localStorage.getItem('ibcol_tema'); } catch {} if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
  function cambiarTema() {
    const act = document.documentElement.dataset.theme;
    const sig = !act ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark') : act === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('ibcol_tema', sig); } catch {} aplicarTema();
  }

  // ---------------------------------------------------------------- login
  function login(msg = '') {
    const demo = S.modo === 'demo';
    // ondas animadas del fondo (líneas que fluyen) y figura biomédica original: anillos que giran + pulso cardiaco
    const ondas = Array.from({ length: 14 }, (_, k) => `<path d="M-200 ${300 + k * 14} C 200 ${120 + k * 22}, 520 ${520 - k * 10}, 900 ${300 + k * 8} S 1500 ${140 + k * 18}, 1800 ${330 + k * 6}" />`).join('');
    root.innerHTML = `<div class="login login-hero">
      <svg class="lh-ondas" viewBox="0 0 1600 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="lh-o1">${ondas}</g><g class="lh-o2">${ondas}</g></svg>
      <div class="lh-puntos" aria-hidden="true"></div>
      <section class="login-brand">
        <div class="logo-card"><img src="${window.IBCOL_LOGO}" alt="IBCOL Ingeniería Biomédica de Colombia"></div>
        <div class="lh-texto">
          <h1 class="lh-bienvenido">Bienvenido</h1>
          <p class="lh-sub">Al ecosistema digital de<br>gestión de tecnología biomédica</p>
          <p class="lh-lema">Hojas de vida, cronogramas, metrología, tecnovigilancia e indicadores en un solo lugar.</p>
          <ul class="lh-chips"><li>Res. 3100 de 2019</li><li>Programa de tecnovigilancia</li><li>Firma digital</li><li>Carpeta por equipo</li></ul>
          <a class="lh-btn" href="mailto:${h(CAT.EMPRESA.email)}?subject=${encodeURIComponent('Solicitud de información · Gestor biomédico IBCOL')}">Solicitar información</a>
        </div>
        <div class="contacto">${h(CAT.EMPRESA.nombre)} · ${h(CAT.EMPRESA.direccion)} · ${h(CAT.EMPRESA.ciudad)}<br>Contacto: ${h(CAT.EMPRESA.telefono)} · ${h(CAT.EMPRESA.email)}</div>
      </section>
      <div class="lh-figura" aria-hidden="true">
        <svg viewBox="0 0 520 520">
          <defs>
            <linearGradient id="lhG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b6fe0"/><stop offset="1" stop-color="#0a2f8f"/></linearGradient>
            <radialGradient id="lhR" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#eef3fb"/><stop offset="1" stop-color="#d9e3f2"/></radialGradient>
          </defs>
          <circle cx="260" cy="260" r="236" fill="url(#lhR)" />
          <g class="lh-r1"><circle cx="260" cy="260" r="214" fill="none" stroke="url(#lhG)" stroke-width="3" stroke-dasharray="2 10" /></g>
          <g class="lh-r2"><circle cx="260" cy="260" r="186" fill="none" stroke="#1b6fe0" stroke-opacity=".55" stroke-width="10" stroke-dasharray="70 22 12 22" /></g>
          <g class="lh-r3"><circle cx="260" cy="260" r="150" fill="none" stroke="url(#lhG)" stroke-width="2" /><circle cx="260" cy="110" r="7" fill="#1b6fe0"/><circle cx="410" cy="260" r="5" fill="#0a2f8f"/><circle cx="154" cy="366" r="6" fill="#17b3d6"/></g>
          <g class="lh-r4"><circle cx="260" cy="260" r="118" fill="none" stroke="#0a2f8f" stroke-opacity=".35" stroke-width="18" stroke-dasharray="4 8" /></g>
          <circle cx="260" cy="260" r="96" fill="url(#lhG)" />
          <circle cx="260" cy="260" r="96" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="2" />
          <path class="lh-ecg" d="M178 262 H218 L230 236 L244 300 L258 206 L272 286 L282 262 H342" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
          <g class="lh-orb"><g transform="translate(260 260)"><g class="lh-sat"><rect x="-17" y="-236" width="34" height="42" rx="6" fill="#fff" stroke="#1b6fe0" stroke-width="2"/><path d="M-9 -224 H9 M-9 -216 H9 M-9 -208 H3" stroke="#1b6fe0" stroke-width="2.4" stroke-linecap="round"/></g></g></g>
          <g class="lh-orb lh-orb2"><g transform="translate(260 260)"><g class="lh-sat"><circle cx="0" cy="-214" r="19" fill="#fff" stroke="#0a2f8f" stroke-width="2"/><path d="M-8 -214 L-2 -208 L9 -220" stroke="#0a2f8f" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></g></g>
        </svg>
      </div>
      <section class="login-form">
        <form id="fLogin" novalidate>
          ${portal ? `<div style="display:grid;gap:4px"><span class="eyebrow">Portal del área de calidad${portal.nombre ? ' · ' + h(portal.nombre) : ''}</span><h2>Documentos de calidad</h2><span class="muted" style="font-size:.88rem">Ingrese con el usuario y la contraseña de calidad o auxiliar. Este acceso solo permite diligenciar los documentos asignados (limpieza y desinfección, reporte de daño, control de glucometría).</span></div>` : '<div class="lh-tit"><span class="eyebrow">Acceso seguro</span><h2>Ingresar al gestor</h2></div>'}
          ${f.input('usuario', 'Usuario o correo', '', { req: true, attrs: 'autocomplete="username" autocapitalize="none"' })}
          ${f.input('clave', 'Contraseña', '', { type: 'password', req: true, attrs: 'autocomplete="current-password"' })}
          <div class="err" id="lErr">${h(msg)}</div>
          <button class="btn pri" style="justify-content:center;padding:10px" type="submit">Ingresar</button>
          <p class="muted" style="font-size:.8rem;margin:0">Al ingresar acepta la <a href="politicas.html" target="_blank" rel="noopener">Política de tratamiento de datos personales y de seguridad de la información</a> (Ley 1581 de 2012).</p>
          ${demo ? `<div class="demo-hint"><b>Modo demostración</b><span>Propietario: <span class="mono">ibcol</span> / <span class="mono">ibcol2026</span></span><span>Cliente: <span class="mono">ips.demo</span> / <span class="mono">demo2026</span></span>
            <div class="actions"><button type="button" class="btn sm" data-demo="ibcol|ibcol2026">Entrar como propietario</button><button type="button" class="btn sm" data-demo="ips.demo|demo2026">Entrar como cliente</button></div></div>` : ''}
        </form>
      </section></div>`;
    const fm = document.getElementById('fLogin');
    // límite de intentos fallidos (protección contra adivinar contraseñas): 5 intentos → espera de 5 minutos
    const KI = 'ibcol_intentos';
    const intentos = () => { try { return JSON.parse(localStorage.getItem(KI) || '{"n":0,"t":0}'); } catch { return { n: 0, t: 0 }; } };
    const guardarInt = (o) => { try { localStorage.setItem(KI, JSON.stringify(o)); } catch { /* */ } };
    const ir = async (u, c) => {
      const b = fm.querySelector('[type=submit]');
      const it = intentos(); const espera = it.n >= 5 ? it.t + 5 * 60000 - Date.now() : 0;
      if (espera > 0) { document.getElementById('lErr').textContent = `Demasiados intentos fallidos. Por seguridad espere ${Math.ceil(espera / 60000)} minuto(s) e intente de nuevo.`; return; }
      if (it.n >= 5) guardarInt({ n: 0, t: 0 });
      b.disabled = true; b.textContent = 'Verificando…';
      try { const p = await S.login(u, c); guardarInt({ n: 0, t: 0 }); entrar(p); }
      catch (e) { const o = intentos(); o.n = (o.n || 0) + 1; o.t = Date.now(); guardarInt(o); document.getElementById('lErr').textContent = e.message + (o.n >= 3 && o.n < 5 ? ` (intento ${o.n} de 5)` : ''); b.disabled = false; b.textContent = 'Ingresar'; }
    };
    fm.onsubmit = (e) => { e.preventDefault(); const d = leer(fm); if (!d.usuario || !d.clave) { document.getElementById('lErr').textContent = 'Escriba usuario y contraseña'; return; } ir(d.usuario, d.clave); };
    fm.querySelectorAll('[data-demo]').forEach((b) => (b.onclick = () => { const [u, c] = b.dataset.demo.split('|'); ir(u, c); }));
  }

  async function entrar(p) {
    st.perfil = p;
    root.innerHTML = '<div class="loading">Cargando…</div>';
    await A.cargarConfig();
    shell();
    vigilarInactividad();
    if (esProp()) go('panel', {}, true);
    else if (esCalidad()) go('calidad', {}, true);
    else if (p.entidad_id) go('entidad', { id: p.entidad_id }, true);
    else { content().innerHTML = '<div class="empty">Su usuario aún no tiene una entidad asignada. Contacte a IBCOL.</div>'; }
    setTimeout(() => A.verificarPoliticas?.(p), 400);
  }

  A.cargarConfig = async () => {
    const e = await S.get('empresa', 1);
    st.emp = { ...CAT.EMPRESA, ...(e?.datos || {}) }; st.firma = e?.firma || null;
    const fm = await S.list('formatos');
    st.fmt = JSON.parse(JSON.stringify(CAT.FORMATOS));
    fm.forEach((x) => { st.fmt[x.clave] = { ...(CAT.FORMATOS[x.clave] || {}), ...(x.datos || {}) }; });
  };

  let tInact;
  function vigilarInactividad() {
    const min = (window.IBCOL_CONFIG?.MINUTOS_INACTIVIDAD || 30) * 60000;
    const reset = () => { clearTimeout(tInact); tInact = setTimeout(async () => { await S.logout(); login('Sesión cerrada por inactividad'); }, min); };
    ['pointerdown', 'keydown', 'scroll'].forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
  }

  // ---------------------------------------------------------------- shell
  const content = () => document.getElementById('content');
  A.content = content;
  function shell() {
    const p = st.perfil;
    const nav = esProp()
      ? [['grp', 'Operación'], ['panel', 'Panel de control', I.panel], ['entidades', 'Entidades y equipos', I.ent], ['comercial', 'Cotizaciones y cobros', I.plata], ['asistente', 'Asistente IA', I.ia],
        ['grp', 'Administración'], ['usuarios', 'Usuarios y accesos', I.users], ['formatos', 'Formatos', I.fmt], ['consecutivos', 'Consecutivos', I.cal], ['auditoria', 'Auditoría', I.audit], ['empresa', 'Mi empresa y firma', I.emp], ['politicas', 'Privacidad y seguridad', I.llave]]
      : esCalidad() ? [['grp', 'Área de calidad'], ['calidad', 'Documentos de calidad', I.ent], ['politicas', 'Privacidad y seguridad', I.audit]]
      : [['grp', 'Mi entidad'], ['entidad', 'Documentación', I.ent], ['cuenta', 'Mi cuenta', I.llave], ['politicas', 'Privacidad y seguridad', I.audit]];
    root.innerHTML = `<div class="app" id="app">
      <aside class="side" aria-label="Menú principal">
        <button class="side-tog" data-menu aria-label="Desplegar menú" title="Desplegar menú">${I.menu}<span>Menú</span></button>
        <div class="brand"><img src="${window.IBCOL_LOGO}" alt=""><div><b>Gestor biomédico</b><small>IBCOL</small></div></div>
        <nav class="nav">${nav.map(([k, t, icn]) => (k === 'grp' ? `<div class="grp">${t}</div>` : `<button data-nav="${k}" title="${t}">${icn}<span>${t}</span></button>`)).join('')}</nav>
        <div class="who"><div class="quien"><b>${h(p.nombre || p.usuario)}</b><br><span class="rol">${p.rol}</span> <span class="mono" style="opacity:.7">${h(p.usuario || '')}</span></div>
          <div class="nav"><button data-tema title="Cambiar tema">${I.luna}<span>Cambiar tema</span></button><button data-salir title="Cerrar sesión">${I.salir}<span>Cerrar sesión</span></button></div><div class="ver" style="font-size:.7rem;opacity:.55;padding:4px 14px">Versión ${h(window.IBCOL_VERSION || '')}</div></div>
      </aside>
      <div class="main">
        <div class="topbar"><button data-menu aria-label="Abrir menú">${I.menu}</button><b>Gestor biomédico IBCOL</b></div>
        ${S.modo === 'demo' ? `<div class="demo-band"><b>Modo demostración.</b><span>Los datos se guardan solo en este navegador. Para usarlo en la nube con sus clientes, configure Supabase (ver guía).</span>${esProp() ? '<button class="btn sm" data-reset>Restaurar datos de ejemplo</button>' : ''}</div>` : ''}
        <main class="content" id="content"></main>
      </div></div>`;
    const app = document.getElementById('app');
    app.addEventListener('click', async (e) => {
      const n = e.target.closest('[data-nav]');
      if (n) { app.classList.remove('menu'); return n.dataset.nav === 'entidad' ? go('entidad', { id: p.entidad_id }, true) : go(n.dataset.nav, {}, true); }
      if (e.target.closest('[data-menu]')) { const ab = app.classList.toggle('menu'); app.querySelectorAll('[data-menu]').forEach((b) => b.setAttribute('aria-expanded', ab)); return; }
      if (e.target.closest('[data-tema]')) return cambiarTema();
      if (e.target.closest('[data-reset]')) { if (await confirmar('Se borrarán todos los cambios del modo demostración y se cargarán de nuevo los datos de ejemplo.', 'Restaurar')) S.reiniciarDemo(); return; }
      if (e.target.closest('[data-salir]')) { await S.logout(); st.perfil = null; login(); return; }
      if (app.classList.contains('menu') && !e.target.closest('.side')) app.classList.remove('menu');
    });
    // Celular: el menú se despliega desde el lado izquierdo (botón ☰ o deslizando el dedo desde el borde)
    let tx = null, ty = 0;
    app.addEventListener('touchstart', (e) => { const t = e.touches[0]; tx = t.clientX; ty = t.clientY; }, { passive: true });
    app.addEventListener('touchend', (e) => {
      if (tx === null || window.innerWidth > 900) return; const t = e.changedTouches[0], dx = t.clientX - tx, dy = Math.abs(t.clientY - ty);
      if (dy < 60 && dx > 60 && tx < 90) app.classList.add('menu');
      else if (dy < 60 && dx < -60 && app.classList.contains('menu')) app.classList.remove('menu');
      tx = null;
    }, { passive: true });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && app.classList.contains('menu')) app.classList.remove('menu'); });
    content().addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b || !content().contains(b)) return;
      const fn = st.acts[b.dataset.act]; if (fn) { e.preventDefault(); e.stopPropagation(); Promise.resolve(fn(b.dataset, b, e)).catch((er) => { console.error(er); toast(er.message, true); }); }
    });
  }

  // ---------------------------------------------------------------- navegación
  const V = {};
  A.V = V;
  async function go(vista, params = {}, reset = false) {
    if (reset) st.pila = [];
    st.pila.push({ vista, params });
    await render();
  }
  A.go = go;
  async function render() {
    let { vista, params } = st.pila[st.pila.length - 1];
    // el usuario de calidad solo puede ver su portal (lista de limpieza y reporte de daño)
    if (esCalidad() && !['calidad', 'politicas'].includes(vista)) { vista = 'calidad'; params = {}; st.pila = [{ vista, params }]; }
    st.acts = {};
    document.querySelectorAll('.nav [data-nav]').forEach((b) => b.classList.toggle('on', b.dataset.nav === (st.pila[0]?.vista)));
    const c = content(); c.innerHTML = '<div class="loading">Cargando…</div>';
    try { await V[vista](params); } catch (e) { console.error(e); c.innerHTML = `<div class="panel"><b>No se pudo cargar esta sección.</b><span class="muted">${h(e.message)}</span></div>`; }
    window.scrollTo(0, 0);
  }
  A.recargar = render;
  A.atras = () => { if (st.pila.length > 1) { st.pila.pop(); render(); } };
  A.acts = (o) => Object.assign(st.acts, o);

  // Migas de pan: elementos [texto, vista, params] o texto final
  function migas(items) {
    st.migas = items;
    A.acts({ miga: (d) => { const [, vista, params] = st.migas[+d.i]; go(vista, params || {}, vista === 'entidades' || (vista === 'entidad' && !esProp())); } });
    // Flecha para volver a la carpeta anterior (el último enlace de la ruta)
    let ant = -1; items.forEach((t, i) => { if (Array.isArray(t)) ant = i; });
    const volver = ant >= 0 ? `<button class="btn-volver" data-act="miga" data-i="${ant}" title="Volver a ${h(items[ant][0])}" aria-label="Volver a ${h(items[ant][0])}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg><span>Volver</span></button>` : '';
    return `<nav class="crumbs" aria-label="Ruta">${volver}${items.map((t, i) => (Array.isArray(t) ? `<button data-act="miga" data-i="${i}">${h(t[0])}</button><span class="sep">/</span>` : `<span>${h(t)}</span>`)).join('')}</nav>`;
  }
  A.migasNav = migas;
  A.rutaEnt = (ent) => [...(esProp() ? [['Entidades', 'entidades']] : []), [ent.razon_social, 'entidad', { id: ent.id }]];

  // ---------------------------------------------------------------- utilidades de dominio
  A.consecutivo = (lista, campo, prefijo) => {
    const n = lista.map((x) => parseInt(String(x[campo] || '').replace(/\D+/g, '').slice(-3), 10)).filter((x) => !isNaN(x));
    return `${prefijo}${String((n.length ? Math.max(...n) : 0) + 1).padStart(3, '0')}`;
  };
  A.estadoPill = (e) => `<span class="pill ${e === 'Activo' ? 'ok' : e === 'En mantenimiento' ? 'warn' : e === 'Fuera de servicio' ? 'bad' : ''}">${h(e)}</span>`;
  A.riesgo = (r) => (r ? `<span class="risk ${r}" title="${h(CAT.RIESGO[r] || '')}">${r}</span>` : '');

  // Vencimientos próximos (≤ 30 días) o vencidos
  A.vencimientos = (equipos, docs = [], entidades = []) => {
    const out = [], en = (id) => entidades.find((e) => e.id === id)?.razon_social || '';
    const add = (fecha, txt, eq, extra = {}) => {
      const d = UI.diasHasta(fecha); if (d === null || d > 30) return;
      out.push({ d, nivel: d < 0 ? 'bad' : d <= 7 ? 'warn' : 'acc', txt, sub: `${eq ? eq.nombre + ' · ' + eq.codigo_inv : ''}${entidades.length ? ' · ' + en(eq?.entidad_id || extra.entidad_id) : ''}`, eq, ...extra });
    };
    equipos.filter((e) => e.estado !== 'Dado de baja').forEach((e) => {
      add(e.fecha_prox_mto, 'Mantenimiento preventivo', e);
      if (e.periodicidad_metro !== 'No aplica') add(e.fecha_prox_metro, 'Calibración / metrología', e);
      add(e.fecha_fin_garantia, 'Fin de garantía', e);
      add(e.fecha_venc_rs, 'Vencimiento registro sanitario', e);
    });
    docs.forEach((d) => add(d.fecha_vencimiento, `Documento: ${d.nombre}`, equipos.find((e) => e.id === d.equipo_id), { entidad_id: d.entidad_id, doc: d }));
    return out.sort((a, b) => a.d - b.d);
  };
  A.listaVenc = (v) => (v.length ? `<div class="alerts">${v.map((x) => `<div class="alert ${x.nivel}"><i></i><div><b>${h(x.txt)}</b><small>${h(x.sub)}</small></div>
      <div style="display:flex;gap:8px;align-items:center"><span class="pill ${x.nivel === 'acc' ? 'acc' : x.nivel}">${x.d < 0 ? `Vencido hace ${-x.d} d` : x.d === 0 ? 'Vence hoy' : `En ${x.d} d`}</span>${x.eq ? `<button class="icon-btn" data-act="abrirEq" data-id="${x.eq.id}" aria-label="Abrir equipo">${I.ver}</button>` : ''}</div></div>`).join('')}</div>`
    : '<div class="empty">Sin vencimientos en los próximos 30 días.</div>');
  // alertas en una pestaña desplegable (cerrada por defecto; se recuerda si el usuario la abre)
  A.alertasPlegables = (v, sub, clave = 'general') => {
    const venc = v.filter((x) => x.d < 0).length, prox = v.length - venc;
    let abierto = false; try { abierto = localStorage.getItem('ibcol_alertas_' + clave) === '1'; } catch { /* */ }
    return `<details class="panel alertas-plegables" data-alertas="${h(clave)}" ${abierto ? 'open' : ''}>
      <summary style="display:flex;align-items:center;gap:10px;cursor:pointer;list-style:none;flex-wrap:wrap">
        <span class="chev" aria-hidden="true" style="display:inline-block;transition:transform .2s">▸</span>
        <h2 style="margin:0">Alertas de vencimiento</h2>
        ${venc ? `<span class="pill bad">${venc} vencida${venc === 1 ? '' : 's'}</span>` : ''}${prox ? `<span class="pill warn">${prox} próxima${prox === 1 ? '' : 's'}</span>` : ''}${!v.length ? '<span class="pill ok">Sin alertas</span>' : ''}
        <span class="muted" style="margin-left:auto">${h(sub)} · ${abierto ? 'clic para ocultar' : 'clic para ver'}</span></summary>
      <div style="margin-top:12px">${A.listaVenc(v)}</div></details>`;
  };
  document.addEventListener('toggle', (e) => {
    const d = e.target; if (!d?.matches?.('details[data-alertas]')) return;
    try { localStorage.setItem('ibcol_alertas_' + d.dataset.alertas, d.open ? '1' : '0'); } catch { /* */ }
    const m = d.querySelector('summary .muted'); if (m) m.textContent = m.textContent.replace(/clic para (ver|ocultar)/, d.open ? 'clic para ocultar' : 'clic para ver');
    const c = d.querySelector('.chev'); if (c) c.style.transform = d.open ? 'rotate(90deg)' : '';
  }, true);

  // Indicadores de gestión
  A.kpis = ({ equipos, cronos, mtos, eventos, alertas, anio = new Date().getFullYear() }) => {
    const mesAct = new Date().getFullYear() === anio ? new Date().getMonth() + 1 : 12;
    const cumpl = (tipo) => {
      let p = 0, e = 0;
      cronos.filter((c) => c.tipo === tipo && c.anio === anio).forEach((c) => Object.entries(c.plan || {}).forEach(([k, val]) => { if (+k.split('-')[0] <= mesAct && val) { p++; if (val === 'E') e++; } }));
      return { p, e, v: p ? Math.round((e / p) * 100) : null };
    };
    const mp = cumpl('mantenimiento'), mm = cumpl('metrologia'), mc = cumpl('capacitacion');
    const corr = mtos.filter((m) => m.tipo === 'correctivo' && m.datos?.fecha_reporte && (m.datos?.fecha_cierre || m.fecha));
    const mttr = corr.length ? Math.round(corr.reduce((s, m) => s + Math.max(0, (new Date(m.datos.fecha_cierre || m.fecha) - new Date(m.datos.fecha_reporte)) / 36e5), 0) / corr.length) : null;
    const activos = equipos.filter((e) => e.estado !== 'Dado de baja');
    const reqMet = activos.filter((e) => e.periodicidad_metro && e.periodicidad_metro !== 'No aplica');
    const metVig = reqMet.filter((e) => e.fecha_prox_metro && UI.diasHasta(e.fecha_prox_metro) >= 0).length;
    const disp = activos.length ? Math.round((activos.filter((e) => e.estado === 'Activo').length / activos.length) * 100) : null;
    const evA = eventos.filter((e) => new Date(e.fecha_evento).getFullYear() === anio);
    const meses = new Set(alertas.map((a) => (a.mes_consulta || '').toLowerCase()).filter(Boolean)).size;
    const pct = (x) => (x === null ? '—' : x + '%');
    return [
      { k: 'mp', nombre: 'Cumplimiento mantenimiento preventivo', formula: 'Preventivos ejecutados / programados a la fecha × 100', valor: pct(mp.v), n: mp.v, meta: '≥ 95%', ok: mp.v === null ? null : mp.v >= 95, det: `${mp.e} de ${mp.p} programados` },
      { k: 'mm', nombre: 'Cumplimiento cronograma de metrología', formula: 'Calibraciones ejecutadas / programadas a la fecha × 100', valor: pct(mm.v), n: mm.v, meta: '≥ 95%', ok: mm.v === null ? null : mm.v >= 95, det: `${mm.e} de ${mm.p} programadas` },
      { k: 'mv', nombre: 'Equipos con calibración vigente', formula: 'Equipos con certificado vigente / equipos que requieren metrología × 100', valor: reqMet.length ? pct(Math.round((metVig / reqMet.length) * 100)) : '—', n: reqMet.length ? Math.round((metVig / reqMet.length) * 100) : null, meta: '100%', ok: reqMet.length ? metVig === reqMet.length : null, det: `${metVig} de ${reqMet.length} equipos` },
      { k: 'mc', nombre: 'Cumplimiento cronograma de capacitación', formula: 'Capacitaciones realizadas / programadas a la fecha × 100', valor: pct(mc.v), n: mc.v, meta: '≥ 90%', ok: mc.v === null ? null : mc.v >= 90, det: `${mc.e} de ${mc.p} programadas` },
      { k: 'disp', nombre: 'Disponibilidad de equipos', formula: 'Equipos activos en servicio / total de equipos × 100', valor: pct(disp), n: disp, meta: '≥ 95%', ok: disp === null ? null : disp >= 95, det: `${activos.filter((e) => e.estado === 'Activo').length} de ${activos.length} equipos` },
      { k: 'mttr', nombre: 'Tiempo medio de reparación (MTTR)', formula: 'Σ horas desde reporte hasta cierre / correctivos', valor: mttr === null ? '—' : mttr + ' h', n: null, meta: '≤ 72 h', ok: mttr === null ? null : mttr <= 72, det: `${corr.length} correctivos` },
      { k: 'ev', nombre: 'Eventos e incidentes de tecnovigilancia', formula: 'Eventos reportados en el año / equipos × 100', valor: activos.length ? (Math.round((evA.length / activos.length) * 1000) / 10) + '%' : '—', n: null, meta: 'Tendencia a la baja', ok: null, det: `${evA.length} reportes en ${anio}` },
      { k: 'al', nombre: 'Consulta de alertas sanitarias', formula: 'Meses con consulta registrada / meses transcurridos × 100', valor: pct(Math.min(100, Math.round((meses / mesAct) * 100))), n: Math.min(100, Math.round((meses / mesAct) * 100)), meta: '100%', ok: meses >= mesAct, det: `${meses} de ${mesAct} meses` },
    ];
  };
  A.kpiTiles = (k, cuales) => `<div class="kpis">${k.filter((x) => !cuales || cuales.includes(x.k)).map((x) => `<div class="kpi ${x.ok === null ? '' : x.ok ? 'ok' : (x.n ?? 0) >= 80 ? 'warn' : 'bad'}">
      <span class="l">${h(x.nombre)}</span><span class="v">${h(x.valor)}</span>${x.n !== null && x.n !== undefined ? `<div class="meter"><i style="width:${Math.min(100, x.n)}%"></i></div>` : ''}<span class="meta">${h(x.det)} · Meta ${h(x.meta)}</span></div>`).join('')}</div>`;

  // ================================================================ VISTAS
  // ---------------------------------------------------------------- Panel
  V.panel = async () => {
    const anio = new Date().getFullYear();
    const [ents, eqs, docs, cronos, mtos, evs, als, aud] = await Promise.all([S.list('entidades', {}, 'razon_social'), S.list('equipos'), S.list('documentos'), S.list('cronogramas', { anio }), S.list('mantenimientos'), S.list('eventos'), S.list('alertas'), S.list('auditoria', {}, '-fecha', 8)]);
    const venc = A.vencimientos(eqs, docs.filter((d) => d.fecha_vencimiento), ents);
    const k = A.kpis({ equipos: eqs, cronos, mtos, eventos: evs, alertas: als, anio });
    const mes = new Date().getMonth() + 1; let progMes = 0, ejeMes = 0;
    cronos.filter((c) => c.tipo !== 'capacitacion').forEach((c) => Object.entries(c.plan || {}).forEach(([kk, v]) => { if (+kk.split('-')[0] === mes && v) { progMes++; if (v === 'E') ejeMes++; } }));
    const porEnt = ents.map((e) => {
      const kk = A.kpis({ equipos: eqs.filter((x) => x.entidad_id === e.id), cronos: cronos.filter((x) => x.entidad_id === e.id), mtos: [], eventos: [], alertas: [], anio });
      return { e, n: eqs.filter((x) => x.entidad_id === e.id).length, mp: kk[0].n };
    });
    const graves = evs.filter((e) => e.estado === 'Abierto' && ['Muerte', 'Deterioro grave'].includes(e.consecuencia));
    content().innerHTML = `
      <div class="page-head"><div><span class="eyebrow">${UI.fecha(UI.hoy())}</span><h1>Panel de control</h1></div>
        <div class="actions"><button class="btn pri" data-act="nuevaEnt">${I.mas} Nueva entidad</button></div></div>
      ${graves.length ? `<div class="panel" style="border-color:var(--bad)"><b style="color:var(--bad)">${I.alerta.replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px"')} ${graves.length} evento(s) adverso(s) grave(s) abierto(s)</b><span class="muted">Deben notificarse al Programa Nacional de Tecnovigilancia del INVIMA dentro de las 72 horas siguientes al conocimiento del evento.</span></div>` : ''}
      <section class="panel" data-reportes></section>
      <section class="panel" data-portales></section>
      <div class="kpis">
        <div class="kpi"><span class="l">Entidades activas</span><span class="v">${ents.filter((e) => e.activo !== false).length}</span><span class="meta">Clientes con carpeta digital</span></div>
        <div class="kpi"><span class="l">Equipos biomédicos</span><span class="v">${eqs.filter((e) => e.estado !== 'Dado de baja').length}</span><span class="meta">${eqs.filter((e) => e.estado === 'Fuera de servicio').length} fuera de servicio</span></div>
        <div class="kpi ${progMes && ejeMes === progMes ? 'ok' : 'warn'}"><span class="l">Actividades de ${CAT.MESES[mes - 1].toLowerCase()}</span><span class="v num">${ejeMes}/${progMes}</span><div class="meter"><i style="width:${progMes ? (ejeMes / progMes) * 100 : 0}%"></i></div><span class="meta">Mantenimiento y metrología programados</span></div>
        <div class="kpi ${venc.some((v) => v.d < 0) ? 'bad' : venc.length ? 'warn' : 'ok'}"><span class="l">Vencimientos</span><span class="v">${venc.length}</span><span class="meta">${venc.filter((v) => v.d < 0).length} vencidos · ${venc.filter((v) => v.d >= 0).length} próximos 30 días</span></div>
      </div>
      <div class="grid2">
        ${A.alertasPlegables(venc, 'Próximos 30 días', 'panel')}
        <section class="panel"><header><h2>Cumplimiento por entidad</h2><span class="muted">Mantenimiento preventivo ${anio}</span></header>
          ${porEnt.length ? `<div class="bars">${porEnt.map((x) => `<div class="bar"><button class="btn ghost sm" style="justify-content:flex-start;min-width:0;overflow:hidden;text-overflow:ellipsis" data-act="abrirEnt" data-id="${x.e.id}">${h(x.e.razon_social)}</button><div class="t"><i style="width:${x.mp ?? 0}%;background:${(x.mp ?? 0) >= 95 ? 'var(--ok)' : (x.mp ?? 0) >= 80 ? 'var(--warn)' : 'var(--bad)'}"></i></div><span class="num">${x.mp === null ? '—' : x.mp + '%'}</span></div>`).join('')}</div>` : '<div class="empty">Aún no hay entidades.</div>'}
        </section>
      </div>
      <section class="panel"><header><h2>Indicadores consolidados</h2><span class="muted">Todas las entidades · ${anio}</span></header>${A.kpiTiles(k, ['mp', 'mm', 'mv', 'disp'])}</section>
      <section class="panel"><header><h2>Actividad reciente</h2><button class="btn sm" data-act="verAud">Ver auditoría completa</button></header>
        <div class="tbl-wrap"><table class="tbl"><tbody>${aud.slice(0, 8).map((a) => `<tr><td class="muted num" style="white-space:nowrap">${UI.fechaHora(a.fecha)}</td><td><b>${h(a.usuario || '')}</b></td><td>${A.accionTxt(a)}</td></tr>`).join('') || '<tr><td class="empty">Sin actividad.</td></tr>'}</tbody></table></div></section>`;
    A.panelReportes?.(content().querySelector('[data-reportes]'));
    A.panelPortales?.(content().querySelector('[data-portales]'));
    A.acts({ abrirEq: (d) => go('equipo', { id: d.id }), abrirEnt: (d) => go('entidad', { id: d.id }), nuevaEnt: () => A.formEntidad(), verAud: () => go('auditoria', {}, true) });
  };

  const TABLAS = { equipos: 'equipo', documentos: 'documento', mantenimientos: 'reporte de mantenimiento', cronogramas: 'cronograma', alertas: 'alerta sanitaria', eventos: 'evento de tecnovigilancia', entidades: 'entidad', consultorios: 'consultorio', cotizaciones: 'cotización', cobros: 'cobro', perfiles: 'usuario', empresa: 'datos de empresa', formatos: 'formato' };
  A.accionTxt = (a) => {
    const reg = a.despues || a.antes || {};
    const nom = reg.nombre || reg.razon_social || reg.numero || reg.codigo_inv || reg.tema || reg.dispositivo || reg.usuario || reg.clave || '';
    const verbo = { INSERT: 'creó', UPDATE: 'modificó', DELETE: 'eliminó', CONSULTA: 'consultó', DESCARGA: 'descargó', FIRMA: 'firmó', LOGIN: 'ingresó al sistema', LOGOUT: 'cerró sesión' }[a.accion] || a.accion;
    if (['LOGIN', 'LOGOUT'].includes(a.accion)) return verbo;
    return `${verbo} ${TABLAS[a.tabla] || a.tabla || ''} ${nom ? `<b>${h(nom)}</b>` : ''} ${a.detalle && !['LOGIN'].includes(a.accion) ? `<span class="muted">· ${h(a.detalle)}</span>` : ''}`;
  };

  // ---------------------------------------------------------------- Entidades
  V.entidades = async () => {
    const [ents, eqs, perf] = await Promise.all([S.list('entidades', {}, 'razon_social'), S.list('equipos'), S.list('perfiles')]);
    content().innerHTML = `
      <div class="page-head"><div><span class="eyebrow">Clientes</span><h1>Entidades y equipos</h1></div>
        <div class="actions">${esProp() ? `<button class="btn" data-act="llenarTodas">${I.subir} Llenar inventarios y cronogramas (todas)</button>` : ''}<button class="btn pri" data-act="nuevaEnt">${I.mas} Nueva entidad</button></div></div>
      ${ents.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Entidad</th><th>NIT</th><th>REPS</th><th>Ciudad</th><th class="r">Equipos</th><th>Usuarios</th><th></th></tr></thead><tbody>
        ${ents.map((e) => `<tr class="clic" data-act="abrirEnt" data-id="${e.id}"><td><b>${h(e.razon_social)}</b>${e.activo === false ? ' <span class="pill">Inactiva</span>' : ''}</td><td class="mono">${h(e.nit || '')}</td><td class="mono">${h(e.reps || '')}</td><td>${h(e.ciudad || '')}</td>
          <td class="r num">${eqs.filter((x) => x.entidad_id === e.id && x.estado !== 'Dado de baja').length}</td><td>${perf.filter((p) => p.entidad_id === e.id).map((p) => `<span class="pill acc mono">${h(p.usuario)}</span>`).join(' ') || '<span class="pill warn">Sin usuario</span>'}</td>
          <td class="r"><button class="icon-btn" data-act="editEnt" data-id="${e.id}" aria-label="Editar">${I.edit}</button></td></tr>`).join('')}
      </tbody></table></div>` : `<div class="panel empty">Registre su primera entidad (IPS, consultorio o clínica) para crear su carpeta digital.<button class="btn pri" data-act="nuevaEnt">${I.mas} Nueva entidad</button></div>`}`;
    A.acts({ llenarTodas: () => A.llenarTodas(), abrirEnt: (d) => go('entidad', { id: d.id }), nuevaEnt: () => A.formEntidad(), editEnt: async (d) => A.formEntidad(await S.get('entidades', d.id)) });
  };

  A.formEntidad = (e = null) => {
    let logo = e?.logo || null;
    modal({
      titulo: e ? 'Editar entidad' : 'Nueva entidad',
      cuerpo: `<form class="form" onsubmit="return false"><div class="fields">
        ${f.input('razon_social', 'Razón social *', e?.razon_social, { full: true, req: true })}
        ${f.input('nit', 'NIT', e?.nit)}${f.input('reps', 'Código prestador (REPS)', e?.reps)}
        ${f.input('representante', 'Representante legal', e?.representante)}${f.input('telefono', 'Teléfono', e?.telefono)}
        ${f.input('email', 'Correo', e?.email, { type: 'email' })}${f.input('ciudad', 'Ciudad', e?.ciudad || 'Popayán')}
        ${f.input('direccion', 'Dirección', e?.direccion, { full: true })}
        ${e ? f.sel('activo', 'Estado', [['true', 'Activa'], ['false', 'Inactiva']], String(e.activo !== false)) : ''}
        <div class="field"><span class="lbl">Logo de la entidad (aparece en los formatos)</span><div class="actions" style="align-items:center"><img data-lprev src="${logo || ''}" alt="" style="max-height:40px;${logo ? '' : 'display:none'}"><label class="btn sm">${I.subir} Cargar logo<input type="file" accept="image/*" hidden data-logo></label></div></div>
      </div></form>`,
      acciones: [
        ...(e ? [{ t: `${I.del} Eliminar`, cls: 'danger', fn: async () => { if (!(await confirmar(`¿Eliminar la entidad "${e.razon_social}"? Se borrarán sus consultorios, equipos, documentos y registros.`))) return false; await S.remove('entidades', e.id); toast('Entidad eliminada'); go('entidades', {}, true); } }] : []),
        { t: 'Cancelar' },
        { t: 'Guardar', cls: 'pri', fn: async (m) => {
          const d = leer(m.body); if (!d.razon_social) { toast('La razón social es obligatoria', true); return false; }
          if (d.activo !== undefined) d.activo = d.activo === 'true';
          d.logo = logo;
          if (e) { await S.update('entidades', e.id, d); toast('Entidad actualizada'); A.recargar(); }
          else { const n = await S.insert('entidades', d); toast('Entidad creada. Ahora cree su usuario de acceso.'); go('entidad', { id: n.id }); }
        } },
      ],
      alAbrir: (m) => { m.body.querySelector('[data-logo]').onchange = async (ev) => { const fl = ev.target.files[0]; if (!fl) return; logo = await UI.reducirImagen(fl, 400, 'image/jpeg'); const im = m.body.querySelector('[data-lprev]'); im.src = logo; im.style.display = ''; }; },
    });
  };

  // ---------------------------------------------------------------- utilidades de orden y nombres
  const sedeK = (x) => ('sede' in x ? String(x.sede || 'Sede principal') : '');
  A.ordenar = (l) => [...l].sort((a, b) => sedeK(a).localeCompare(sedeK(b), 'es', { numeric: true, sensitivity: 'base' }) || ((a.orden ?? 9999) - (b.orden ?? 9999)) || String(a.created_at || '').localeCompare(String(b.created_at || '')) || String(a.nombre || '').localeCompare(String(b.nombre || '')));
  A.sinNum = (t) => String(t || '').replace(/^\s*\d+(\.\d+)*\s*[.\-)]\s*/, '').trim();
  A.numDe = (t) => { const m = String(t || '').match(/^\s*(\d+)/); return m ? +m[1] : null; };
  A.numerado = (lista) => A.ordenar(lista).map((x, i) => ({ ...x, _n: i + 1 }));
  const slug = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_');
  const CARP_EQ = 'equipos';

  // ---------------------------------------------------------------- Entidad (carpeta principal)
  // Sedes de una entidad (según sus servicios). Con 2 o más, la entidad se abre por sedes.
  A.sedesDe = (cons, ent = null) => { const l = [...new Set(A.ordenar(cons).map((c) => c.sede || 'Sede principal'))]; (ent?.config?.sedes || []).forEach((x) => { if (!l.includes(x)) l.push(x); }); return (ent?.config?.sedes || []).length && l.includes('Sede principal') && !cons.some((c) => !c.sede || c.sede === 'Sede principal') ? l.filter((x) => x !== 'Sede principal') : l; };
  // Documento general (subcarpeta sin nombre de sede) o de esta sede (subcarpeta "SEDE/…")
  A.esDeSede = (d, sede, sedes) => { const r = (d.subcarpeta || '').split('/')[0]; return r === sede || !sedes.includes(r); };
  V.entidad = async ({ id, sede = null }) => {
    const anio = new Date().getFullYear();
    const consE = await S.list('consultorios', { entidad_id: id });
    const [ent, eqsT, docsT, cronos, mtos, evs, als] = await Promise.all([S.get('entidades', id), S.list('equipos', { entidad_id: id }), S.list('documentos', { entidad_id: id }), S.list('cronogramas', { entidad_id: id }), S.list('mantenimientos', { entidad_id: id }), S.list('eventos', { entidad_id: id }), S.list('alertas', { entidad_id: id })]);
    if (!ent) throw new Error('Entidad no encontrada o sin permiso');
    st.ent = ent;
    const sedesE = A.sedesDe(consE, ent);
    if (sede && !sedesE.includes(sede)) sede = null;
    const porSedes = sedesE.length > 1;
    // Dentro de una sede: sus equipos y los documentos de su subcarpeta (más los generales de la entidad)
    const idsSede = new Set(consE.filter((c) => (c.sede || 'Sede principal') === sede).map((c) => c.id));
    const eqs = sede ? eqsT.filter((e) => idsSede.has(e.consultorio_id)) : eqsT;
    const docs = sede ? docsT.filter((d) => d.equipo_id ? eqs.some((e) => e.id === d.equipo_id) : A.esDeSede(d, sede, sedesE)) : docsT;
    const venc = A.vencimientos(eqs, docs.filter((d) => d.fecha_vencimiento));
    const enSede = (x) => !sede || eqs.some((e) => e.id === x.equipo_id);
    const k = A.kpis({ equipos: eqs, cronos: cronos.filter(enSede), mtos: mtos.filter(enSede), eventos: evs, alertas: als, anio });
    const nEqSede = (sd) => { const ids = new Set(consE.filter((c) => (c.sede || 'Sede principal') === sd).map((c) => c.id)); return eqsT.filter((e) => ids.has(e.consultorio_id) && e.estado !== 'Dado de baja').length; };
    const nDocSede = (sd) => docsT.filter((d) => !d.equipo_id && (d.subcarpeta || '').split('/')[0] === sd).length;
    const tarjetasSedes = porSedes && !sede ? `<section class="folder-group"><span class="eyebrow">Sedes · abra una sede para ver sus carpetas</span><div class="folders">${sedesE.map((sd) => `<div class="folder-w">${esProp() ? `<div class="folder-tools"><button class="folder-x del" data-act="borrarSede" data-s="${h(sd)}" title="Eliminar esta sede" aria-label="Eliminar la sede ${h(sd)}">${I.x}</button></div>` : ''}<button class="folder sede" data-act="abrirSede" data-s="${h(sd)}"><span class="ic"></span><b>${h(sd.toUpperCase())}</b><small>${nEqSede(sd)} equipo${nEqSede(sd) === 1 ? "" : "s"} · ${nDocSede(sd)} archivo${nDocSede(sd) === 1 ? "" : "s"}</small></button></div>`).join('')}</div></section>` : '';
    const nDocs = (c) => (c.k === CARP_EQ ? eqs.filter((e) => e.estado !== 'Dado de baja').length : docs.filter((d) => d.carpeta === c.k && (c.todos || !d.equipo_id)).length);
    const etiqueta = (c) => { const n = nDocs(c); return c.k === CARP_EQ ? `${n} equipo${n === 1 ? '' : 's'} por área` : `${n} archivo${n === 1 ? '' : 's'}${c.gen ? ' · registros' : ''}`; };
    const ocE = A.ocultas(ent, 'ent');
    const visiblesE = A.carpetasEnt(ent).filter((c) => !ocE.has(c.k));
    const grupos = [...new Set(visiblesE.map((c) => c.g))];
    content().innerHTML = `
      ${sede ? migas([...A.rutaEnt(ent), sede.toUpperCase()]) : esProp() ? migas([['Entidades', 'entidades'], ent.razon_social]) : ''}
      <div class="page-head"><div><span class="eyebrow">${sede ? `Sede · ${h(ent.razon_social)}` : 'Carpeta digital de la entidad'}</span><h1>${h(sede ? sede.toUpperCase() : ent.razon_social)}</h1>
        <span class="muted">NIT <span class="mono">${h(ent.nit || '—')}</span> · REPS <span class="mono">${h(ent.reps || '—')}</span> · ${h(ent.ciudad || '')}</span></div>
        ${esProp() ? `<div class="actions"><button class="btn" data-act="editEnt">${I.edit} Editar</button><button class="btn" data-act="usuariosEnt">${I.users} Accesos</button>${sede ? `<button class="btn danger" data-act="borrarSede" data-s="${h(sede)}">${I.del} Eliminar sede</button>` : ''}${!sede ? `<button class="btn" data-act="nuevaSede" title="Agregar una sede o servicio (ej. HOME CARE)">${I.mas} Sede</button>` : ''}<button class="btn" data-act="carpetaPDF" title="Descargar toda la carpeta de la entidad en un solo PDF (solo administrador)">${I.pdf} Descargar carpeta</button><button class="btn" data-act="configCarp" title="Quitar o volver a mostrar carpetas para esta entidad">${I.carpeta} Carpetas${ocE.size + A.ocultas(ent, 'eq').size ? ` <span class="pill">${ocE.size + A.ocultas(ent, 'eq').size} quitadas</span>` : ''}</button><button class="btn pri" data-act="importarDrive">${I.subir} Importar carpeta de la entidad</button></div>` : ''}</div>
      ${tarjetasSedes}
      <section class="panel" data-reportes></section>
      ${A.kpiTiles(k, ['mp', 'mm', 'mv', 'disp'])}
      ${A.alertasPlegables(venc, 'Mantenimientos, calibraciones, garantías y documentos', 'entidad')}
      ${porSedes && !sede ? '<h2 class="sede-tit" style="margin-top:8px">TODA LA ENTIDAD (TODAS LAS SEDES)</h2>' : ''}${grupos.map((g) => `<section class="folder-group"><span class="eyebrow">${h(g)}</span><div class="folders">${visiblesE.filter((c) => c.g === g).map((c) => A.tarjetaCarpeta(c, etiqueta(c), 'ent', ent)).join('')}${esProp() && g === grupos[0] ? `<div class="folder-w"><button class="folder folder-nueva" data-act="nuevaCarpeta" style="border-style:dashed"><span class="ic"></span><b>${I.mas} Nueva carpeta</b><small>Crear carpeta en esta entidad</small></button></div>` : ''}</div></section>`).join('')}`;
    A.panelReportes?.(content().querySelector('[data-reportes]'), { entidadId: id });
    A.acts({
      abrirEq: (d) => go('equipo', { id: d.id }),
      carpeta: (d) => (d.k === CARP_EQ ? go('areas', { id, ...(sede ? { sede } : {}) }) : go('carpeta', { ent: id, k: d.k, ...(sede ? { sede } : {}) })),
      abrirSede: (d) => go('entidad', { id, sede: d.s }),
      carpetaPDF: () => A.exportarCarpetaPDF(ent, sede),
      borrarSede: (d) => A.eliminarSede(ent, d.s, consE, sedesE, eqsT, docsT),
      nuevaSede: () => modal({
        titulo: 'Agregar sede', size: 'sm',
        cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('nombre', 'Nombre de la sede o servicio', '', { full: true, attrs: 'placeholder="ej: SIEMPREE SEDE TIMBÍO"' })}</div><p class="muted" style="font-size:.85rem">Con dos o más sedes, la entidad se abre por sedes y cada una tiene todas sus carpetas. Los servicios de cada sede se crean en “Información del equipo” o al importar su carpeta.</p></form>`,
        acciones: [{ t: 'Cancelar' }, { t: 'Agregar', cls: 'pri', fn: async (m) => {
          const v = leer(m.body).nombre.replace(/\s+/g, ' ').trim(); if (!v) { toast('Escriba el nombre', true); return false; }
          if (sedesE.some((x) => norm(x) === norm(v))) { toast('Esa sede ya existe', true); return false; }
          const actuales = sedesE.filter((x) => x !== 'Sede principal' || consE.some((c) => !c.sede || c.sede === 'Sede principal'));
          const cfg = { ...(ent.config || {}), sedes: [...new Set([...actuales, v])] };
          if (!(await guardarConfig(ent, cfg))) return false;
          S.log('EDITAR', 'entidades', ent.id, `Nueva sede ${v}`); toast(`Sede “${v}” agregada`); A.recargar();
        } }],
      }),
      editEnt: () => A.formEntidad(ent),
      usuariosEnt: () => go('usuarios', { ent: id }),
      importarDrive: () => A.importarEntidad(ent),
      configCarp: () => A.configCarpetas(ent),
      quitarCarp: (d) => A.quitarCarpeta(ent, d.tipo, d.k, d.tipo === 'ent' ? nDocs(A.carpetasEnt(ent).find((c) => c.k === d.k)) : null),
      nuevaCarpeta: () => A.nuevaCarpeta(ent),
      renCarp: (d) => A.renombrarCarpeta(ent, d.tipo, d.k),
    });
  };

  // ---------------------------------------------------------------- 3. Áreas / consultorios → equipos
  V.areas = async ({ id, sede: sedeP = null }) => {
    const [ent, consR, eqsR] = await Promise.all([S.get('entidades', id), S.list('consultorios', { entidad_id: id }), S.list('equipos', { entidad_id: id })]);
    const cons = A.numerado(consR);
    const sedeC = (c) => c.sede || 'Sede principal';
    const sedesL = A.sedesDe(consR, ent);
    st.sedeSel = st.sedeSel || {}; if (sedeP) st.sedeSel[id] = sedeP;
    const sedeSel = sedesL.includes(st.sedeSel[id]) ? st.sedeSel[id] : '';
    const titulo = A.nomCarpeta(ent, 'ent', CARP_EQ);
    const sinCons = A.numerado(eqsR.filter((e) => !cons.some((c) => c.id === e.consultorio_id)));
    const fila = (e) => `<button class="eq-row" data-act="abrirEq" data-id="${e.id}"><span class="cod">${e._n}. ${h(e.codigo_inv)}</span><span class="nm"><b>${h(e.nombre)}</b><small>${h([e.marca, e.modelo].filter(Boolean).join(' · '))}</small></span><span class="mm muted mono" style="font-size:.8rem">S/N ${h(e.serie || '—')}</span><span class="badges">${A.riesgo(e.clase_riesgo)}${A.estadoPill(e.estado)}</span></button>`;
    const filaEq = (e) => (esProp() ? `<div class="eq-wrap">${fila(e)}<button class="icon-btn eq-edit" data-act="editEqLista" data-id="${e.id}" title="Editar el nombre y los datos del equipo" aria-label="Editar ${h(e.nombre)}">${I.edit}</button><button class="icon-btn bad eq-del" data-act="borrarEqLista" data-id="${e.id}" title="Eliminar este equipo" aria-label="Eliminar ${h(e.nombre)} (${h(e.codigo_inv)})">${I.del}</button></div>` : fila(e));
    const sala = (c, lista) => `<section class="room"><header><h3>${c ? `${c._n}. ${h(c.nombre.toUpperCase())}` : 'SIN SERVICIO ASIGNADO'} ${c?.sede ? `<small class="muted" style="font-family:var(--f-body);font-weight:400;font-size:.85rem">${h(c.sede)}${c.servicio ? ' · ' + h(c.servicio) : ''}</small>` : ''}</h3>
        <div class="actions"><span class="pill">${lista.length} equipo${lista.length === 1 ? '' : 's'}</span>${esProp() && c ? `<button class="icon-btn" data-act="editCons" data-id="${c.id}" aria-label="Editar área">${I.edit}</button><button class="btn sm" data-act="nuevoEq" data-cons="${c.id}">${I.mas} Equipo</button>` : ''}</div></header>
        <div class="eq-list">${lista.map(filaEq).join('') || '<div class="empty">Sin equipos registrados.</div>'}</div></section>`;
    // Carpetas de servicios (ej. EXTRAMURAL con KIT 1, KIT 2…): entidades.config.carpetas_serv = { consultorioId: 'EXTRAMURAL' }
    const mapaCarp = { ...(ent.config?.carpetas_serv || {}) };
    const carpDe = (c) => mapaCarp[c.id] || '';
    st.carpAbierta = st.carpAbierta || {};
    const salasSede = (sd) => {
      // En el orden del inventario: cada servicio suelto o carpeta (ej. EXTRAMURAL) va en la posición de su primer servicio
      const lista = A.numerado(cons.filter((c) => sedeC(c) === sd)); const hechos = new Set(); let html = '';
      lista.forEach((c) => {
        if (!carpDe(c)) { html += sala(c, A.numerado(eqsR.filter((e) => e.consultorio_id === c.id))); return; }
        const cp = carpDe(c);
        if (hechos.has(cp)) return; hechos.add(cp);
        const miembros = A.numerado(lista.filter((x) => carpDe(x) === cp));
        const nEq = eqsR.filter((e) => miembros.some((x) => x.id === e.consultorio_id)).length;
        const k = `${id}|${sd}|${cp}`, abierta = st.carpAbierta[k] !== false;
        html += `<details class="srv-folder" ${abierta ? 'open' : ''} data-k="${h(k)}"><summary><span class="ic-f">${I.carpeta}</span><b>${h(cp)}</b><span class="muted">${miembros.length} servicio${miembros.length === 1 ? '' : 's'} · ${nEq} equipo${nEq === 1 ? '' : 's'}</span>${esProp() ? `<span class="sp"></span><button class="btn sm" data-act="carpEditar" data-s="${h(sd)}" data-n="${h(cp)}">${I.edit} Servicios / nombre</button><button class="btn sm" data-act="carpQuitar" data-s="${h(sd)}" data-n="${h(cp)}" title="Quitar la carpeta (los servicios y equipos no se borran)">${I.x} Quitar carpeta</button>` : ''}</summary>
          <div class="srv-folder-in">${miembros.map((x) => sala(x, A.numerado(eqsR.filter((e) => e.consultorio_id === x.id)))).join('')}</div></details>`;
      });
      return html;
    };
    const guardarCarp = async (nuevoMapa) => {
      const cfg = { ...(ent.config || {}), carpetas_serv: nuevoMapa };
      try { const u = await S.update('entidades', ent.id, { config: cfg }); ent.config = u?.config || cfg; return true; }
      catch (e) { toast(/config/i.test(e.message) ? 'Falta activar la configuración de la entidad en la base de datos.' : e.message, true); return false; }
    };
    const formCarp = (sd, nombre = '') => {
      const lista = A.ordenar(cons.filter((c) => sedeC(c) === sd));
      const existentes = [...new Set(Object.values(mapaCarp))];
      modal({
        titulo: nombre ? `Carpeta “${nombre}”` : 'Nueva carpeta de servicios', size: 'sm',
        cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('nombre', 'Nombre de la carpeta', nombre, { full: true, attrs: 'list="dl-carps" placeholder="ej: EXTRAMURAL"' })}<datalist id="dl-carps">${existentes.map((x) => `<option value="${h(x)}">`).join('')}</datalist></div>
          <p class="muted" style="font-size:.85rem;margin-top:8px">Marque los servicios de ${h(sd)} que van dentro de la carpeta:</p>
          <div class="cfg-cols"><fieldset>${lista.map((c) => { const otra = carpDe(c) && carpDe(c) !== nombre; return `<label class="checks cfg-carp"><input type="checkbox" name="cons" value="${c.id}" ${nombre && carpDe(c) === nombre ? 'checked' : ''}> ${h(c.nombre)} <small class="muted">(${eqsR.filter((e) => e.consultorio_id === c.id).length} equipos${otra ? ' · hoy en ' + h(carpDe(c)) : ''})</small></label>`; }).join('') || '<span class="muted">Sin servicios</span>'}</fieldset></div></form>`,
        acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
          const d = leer(m.body); const n = (d.nombre || '').replace(/\s+/g, ' ').trim().toUpperCase();
          if (!n) { toast('Escriba el nombre de la carpeta', true); return false; }
          const sel = Array.isArray(d.cons) ? d.cons : [];
          if (!sel.length) { toast('Marque al menos un servicio', true); return false; }
          const nm = { ...mapaCarp };
          lista.forEach((c) => { if (nm[c.id] === nombre && nombre) delete nm[c.id]; });
          sel.forEach((cid) => { nm[cid] = n; });
          if (!(await guardarCarp(nm))) return false;
          S.log('EDITAR', 'consultorios', id, `Carpeta de servicios ${n}: ${sel.length} servicios`);
          toast(`Carpeta “${n}” guardada`); A.recargar();
        } }],
      });
    };
    content().innerHTML = `${migas([...A.rutaEnt(ent), ...(sedeSel && sedesL.length > 1 ? [[sedeSel.toUpperCase(), 'entidad', { id, sede: sedeSel }]] : []), titulo])}
      <div class="page-head"><div><span class="eyebrow">Servicios o consultorios · carpeta por equipo</span><h1>${h(titulo)}</h1></div>
        ${esProp() ? `<div class="actions"><button class="btn" data-act="revisarDocs">${I.ia} Revisar documentos (IA)</button><button class="btn" data-act="importarDrive">${I.subir} Importar servicios y equipos</button><button class="btn" data-act="nuevoCons">${I.mas} Servicio / consultorio</button><button class="btn pri" data-act="nuevoEq">${I.mas} Equipo</button></div>` : ''}</div>
      ${sedesL.length > 1 ? `<div class="chips sede-chips" role="tablist" aria-label="Sedes"><button class="chip ${!sedeSel ? 'on' : ''}" data-act="verSede" data-s="">Todas las sedes</button>${sedesL.map((s) => `<button class="chip ${sedeSel === s ? 'on' : ''}" data-act="verSede" data-s="${h(s)}">${h(s)} <small>${eqsR.filter((e) => consR.some((c) => c.id === e.consultorio_id && sedeC(c) === s)).length}</small></button>`).join('')}</div>` : ''}
      ${sedesL.filter((s) => !sedeSel || s === sedeSel).map((s) => `${sedesL.length > 1 || esProp() ? `<h2 class="sede-tit">${h(s.toUpperCase())}${esProp() ? ` <button class="icon-btn" data-act="renSede" data-s="${h(s)}" title="Cambiar el nombre de la sede" aria-label="Cambiar nombre de la sede ${h(s)}">${I.edit}</button><span class="sp"></span><button class="btn sm" data-act="carpNueva" data-s="${h(s)}" title="Agrupar servicios en una carpeta (ej. EXTRAMURAL con los KIT)">${I.carpeta} Carpeta de servicios</button>` : ''}</h2>` : ''}${salasSede(s) || `<div class="empty">Esta sede aún no tiene servicios o consultorios.${esProp() ? ' Use “+ Servicio / consultorio” o importe la carpeta de la sede.' : ''}</div>`}`).join('')}
      ${(sinCons.length || !cons.length) && !sedeSel ? sala(null, sinCons) : ''}`;
    content().querySelectorAll('details.srv-folder').forEach((dt) => dt.addEventListener('toggle', () => { st.carpAbierta[dt.dataset.k] = dt.open; }));
    A.acts({
      abrirEq: (d) => go('equipo', { id: d.id }),
      editEqLista: (d) => { const e = eqsR.find((x) => x.id === d.id); if (e) A.editarEquipoRapido(e, consR); },
      borrarEqLista: async (d) => {
        const e = eqsR.find((x) => x.id === d.id); if (!e) return;
        const docs = await S.list('documentos', { equipo_id: e.id });
        if (!(await confirmar(`¿Eliminar definitivamente ${e.nombre} (${e.codigo_inv})${docs.length ? ` y sus ${docs.length} documento${docs.length === 1 ? '' : 's'}` : ''}? No se puede deshacer. Si solo salió de servicio, es mejor usar "Cambiar estado → Dado de baja" para conservar el historial.`))) return;
        for (const x of docs) { try { await S.removeFile(x.archivo); } catch {} }
        await S.remove('equipos', e.id); S.log('ELIMINAR', 'equipos', e.id, `${e.codigo_inv} ${e.nombre}`);
        toast('Equipo eliminado'); A.recargar();
      },
      verSede: (d) => { st.sedeSel[id] = d.s; A.recargar(); },
      renSede: (d) => modal({
        titulo: 'Cambiar nombre de la sede', size: 'sm',
        cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('nombre', 'Nombre de la sede o servicio', d.s, { full: true })}</div><p class="muted" style="font-size:.85rem">Se cambia en los ${consR.filter((c) => sedeC(c) === d.s).length} servicios o consultorios de esta sede.</p></form>`,
        acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
          const v = leer(m.body).nombre.replace(/\s+/g, ' ').trim(); if (!v) { toast('Escriba el nombre', true); return false; }
          if (v === d.s) return;
          for (const c of consR.filter((x) => sedeC(x) === d.s)) await S.update('consultorios', c.id, { sede: v });
          if ((ent.config?.sedes || []).includes(d.s)) { try { await S.update('entidades', ent.id, { config: { ...ent.config, sedes: ent.config.sedes.map((x) => (x === d.s ? v : x)) } }); } catch {} }
          if (st.sedeSel[id] === d.s) st.sedeSel[id] = v;
          S.log('EDITAR', 'consultorios', id, `Sede ${d.s} → ${v}`); toast('Sede renombrada'); A.recargar();
        } }],
      }),
      nuevoCons: () => A.formConsultorio(id, null, (sedeSel ? cons.filter((c) => sedeC(c) === sedeSel).length : cons.length) + 1, sedeSel || null),
      editCons: (d) => A.formConsultorio(id, cons.find((c) => c.id === d.id)),
      carpNueva: (d) => formCarp(d.s),
      carpEditar: (d) => formCarp(d.s, d.n),
      carpQuitar: async (d) => {
        if (!(await confirmar(`¿Quitar la carpeta “${d.n}”? Sus servicios y equipos no se borran: vuelven a verse sueltos en la sede.`, 'Quitar carpeta'))) return;
        const nm = { ...mapaCarp }; cons.filter((c) => sedeC(c) === d.s && nm[c.id] === d.n).forEach((c) => delete nm[c.id]);
        if (await guardarCarp(nm)) { toast('Carpeta quitada'); A.recargar(); }
      },
      nuevoEq: (d) => A.formEquipo({ entidad_id: id, consultorio_id: d.cons || cons[0]?.id, orden: eqsR.filter((e) => e.consultorio_id === (d.cons || cons[0]?.id)).length + 1 }, cons),
      importarDrive: () => A.importarEntidad(ent, true),
      revisarDocs: async () => { await A.repararEstructura(ent); A.revisarDocumentos(ent); },
    });
  };

  A.formConsultorio = (entidad_id, c = null, ordenSug = 1, sedeSug = null) => modal({
    titulo: c ? 'Editar área / consultorio' : 'Nueva área / consultorio',
    cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('orden', 'N° (orden)', c?.orden ?? ordenSug, { type: 'number', attrs: 'min="0"' })}${f.input('nombre', 'Nombre del área o consultorio *', c?.nombre, { full: true, attrs: 'placeholder="ej: CONSULTORIO MÉDICO"' })}${f.input('sede', 'Sede', c?.sede || sedeSug || 'Sede principal')}${f.input('servicio', 'Servicio habilitado', c?.servicio)}</div></form>`,
    acciones: [
      ...(c ? [{ t: `${I.del} Eliminar`, cls: 'danger', fn: async () => { if (!(await confirmar('¿Eliminar esta área? Sus equipos quedarán sin área asignada.'))) return false; await S.remove('consultorios', c.id); A.recargar(); } }] : []),
      { t: 'Cancelar' },
      { t: 'Guardar', cls: 'pri', fn: async (m) => { const d = leer(m.body); if (!d.nombre) { toast('Escriba el nombre', true); return false; } d.orden = d.orden === '' ? null : Number(d.orden); c ? await S.update('consultorios', c.id, d) : await S.insert('consultorios', { ...d, entidad_id }); toast('Área guardada'); A.recargar(); } },
    ],
  });

  // ---------------------------------------------------------------- Equipo
  V.equipo = async ({ id }) => {
    const eq = await S.get('equipos', id); if (!eq) throw new Error('Equipo no encontrado');
    const [ent, cons, docs, mtos] = await Promise.all([S.get('entidades', eq.entidad_id), S.list('consultorios', { entidad_id: eq.entidad_id }), S.list('documentos', { equipo_id: id }), S.list('mantenimientos', { equipo_id: id }, '-fecha')]);
    const c = A.numerado(cons).find((x) => x.id === eq.consultorio_id);
        const tipoMto = { mto_preventivo: 'preventivo', mto_correctivo: 'correctivo', metrologia: 'metrologia' };
    const cnt = (k) => docs.filter((d) => d.carpeta === k).length + (tipoMto[k] ? mtos.filter((m) => m.tipo === tipoMto[k]).length : 0);
    const dd = (iso) => { const n = UI.diasHasta(iso); return iso ? `${UI.fecha(iso)} ${n !== null && n <= 30 ? `<span class="pill ${n < 0 ? 'bad' : n <= 7 ? 'warn' : 'acc'}">${n < 0 ? 'vencido' : n + ' d'}</span>` : ''}` : '—'; };
    content().innerHTML = `
      ${migas([...A.rutaEnt(ent), [A.nomCarpeta(ent, 'ent', CARP_EQ), 'areas', { id: ent.id }], `${c ? c._n + '. ' + c.nombre.toUpperCase() + ' / ' : ''}${eq.nombre.toUpperCase()}`])}
      <div class="page-head"><div><span class="eyebrow">${h(c?.nombre || 'Sin área')} · ${h(eq.ubicacion || '')}</span><h1>${h(eq.nombre)} ${A.riesgo(eq.clase_riesgo)}${esProp() ? ` <button class="icon-btn" data-act="editEqRapido" title="Cambiar el nombre y los datos del equipo" aria-label="Editar el nombre del equipo">${I.edit}</button>` : ''}</h1>
        <span class="muted"><span class="mono">${h(eq.codigo_inv)}</span> · ${h([eq.marca, eq.modelo].filter(Boolean).join(' · '))} · S/N <span class="mono">${h(eq.serie || '—')}</span></span></div>
        <div class="actions">${A.estadoPill(eq.estado)}${esProp() ? `<button class="btn" data-act="fotoEq">${I.subir} Imagen del equipo</button>` : ''}<button class="btn" data-act="pdfHV">${I.pdf} Hoja de vida PDF</button>${esProp() ? `<button class="btn" data-act="google">${I.ia} Buscar con Google</button><button class="btn pri" data-act="editHV">${I.edit} Editar hoja de vida</button>` : ''}</div></div>
      <section class="panel"><div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
        <div style="flex:0 0 150px;height:150px;border:1px dashed var(--line);border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff${esProp() ? ';cursor:pointer' : ''}" ${esProp() ? 'data-act="fotoEq" title="Cambiar imagen del equipo"' : ''}>
          ${eq.hv?.foto ? `<img src="${eq.hv.foto}" alt="Imagen del equipo" style="max-width:100%;max-height:100%;object-fit:contain">` : '<span class="muted" style="font-size:.8rem;text-align:center;padding:8px">IMAGEN DEL EQUIPO<br>(sin cargar)</span>'}</div>
        <div class="hv-sum" style="flex:1;min-width:260px">
        <div><span>Registro sanitario</span><b class="mono">${h(eq.registro_sanitario || 'NR')}</b></div>
        <div><span>Código ECRI</span><b class="mono">${h(eq.hv?.ecri || 'Sin asignar')}</b></div>
        <div><span>Clasificación de riesgo</span><b>${h(FMT.marca(eq, 'clase_riesgo') || CAT.RIESGO[eq.clase_riesgo] || 'NR')}</b></div>
        <div><span>Activo fijo</span><b class="mono">${h(eq.activo_fijo || '—')}</b></div>
        <div><span>Mantenimiento</span><b>${h(eq.periodicidad_mto || '—')}</b></div>
        <div><span>Próximo mantenimiento</span><b>${dd(eq.fecha_prox_mto)}</b></div>
        <div><span>Metrología</span><b>${h(eq.periodicidad_metro || '—')}</b></div>
        <div><span>Próxima calibración</span><b>${eq.periodicidad_metro === 'No aplica' ? 'No aplica' : dd(eq.fecha_prox_metro)}</b></div>
        <div><span>Garantía hasta</span><b>${dd(eq.fecha_fin_garantia)}</b></div>
      </div></div></section>
      <section class="folder-group"><span class="eyebrow">Carpeta del equipo</span><div class="folders">
        ${A.carpetasEq(ent, eq).filter((k) => !A.ocultasEq(ent, eq).has(k.k)).map((k) => A.tarjetaCarpeta(k, `${cnt(k.k)} documento${cnt(k.k) === 1 ? '' : 's'}`, 'eq', ent, eq)).join('')}
        ${esProp() ? `<div class="folder-w"><button class="folder folder-nueva" data-act="nuevaCarpetaEq" style="border-style:dashed"><span class="ic"></span><b>${I.mas} Nueva carpeta</b><small>Solo este equipo o todos</small></button></div>` : ''}
      </div>${esProp() && (eq.hv?.ocultas || []).length ? `<p class="muted" style="font-size:.85rem;margin-top:6px">Carpetas quitadas solo en este equipo: ${(eq.hv.ocultas).map((k) => h(A.nomCarpeta(ent, 'eq', k))).join(', ')} · <button class="btn sm" data-act="mostrarCarpEq">Volver a mostrar</button></p>` : ''}</section>
      ${esProp() ? `<section class="panel"><header><h3>Acciones del equipo</h3></header><div class="actions">
        <button class="btn" data-act="nuevoMto" data-t="preventivo">${I.mas} Mantenimiento preventivo</button><button class="btn" data-act="nuevoMto" data-t="correctivo">${I.mas} Mantenimiento correctivo</button>
        <button class="btn" data-act="nuevoMto" data-t="metrologia">${I.mas} Metrología</button><button class="btn" data-act="iaHV">${I.ia} Actualizar hoja de vida con IA</button><button class="btn" data-act="ia">${I.ia} Redactar con IA</button><button class="btn" data-act="google">${I.ia} Buscar con Google: ficha, guía, registro, manuales</button><button class="btn" data-act="estado">${I.on} Cambiar estado</button><button class="btn" data-act="importar">${I.subir} Importar carpeta del equipo</button>
        <button class="btn danger" data-act="borrarEq">${I.del} Eliminar equipo</button></div></section>` : ''}`;
    A.acts({
      carpeta: (d) => go('carpeta', { ent: eq.entidad_id, eq: id, k: d.k }),
      quitarCarp: (d) => A.quitarCarpeta(ent, 'eq', d.k, cnt(d.k), eq),
      mostrarCarpEq: async () => { const act = await S.get('equipos', eq.id); await S.update('equipos', eq.id, { hv: { ...(act.hv || {}), ocultas: [] } }); toast('Carpetas visibles de nuevo en este equipo'); A.recargar(); },
      renCarp: (d) => A.renombrarCarpeta(ent, 'eq', d.k, eq),
      nuevaCarpetaEq: () => A.nuevaCarpeta(ent, eq),
      pdfHV: () => A.verHojaVida(eq, ent, c, mtos),
      fotoEq: () => A.cargarFotoEquipo(eq),
      editEqRapido: () => A.editarEquipoRapido(eq, cons),
      editHV: () => A.formHojaVida(eq, cons),
      importar: () => A.importarCarpeta({ ent, eq }),
      ia: () => A.asistenteIA({ ent, eq }),
      iaHV: () => A.asistenteIA({ ent, eq, auto: 'hv' }),
      google: () => A.buscarGoogleEquipo(eq, ent),
      nuevoMto: (d) => A.formMto({ eq, ent, cons: c, tipo: d.t }),
      estado: () => modal({ titulo: 'Cambiar estado del equipo', size: 'sm', cuerpo: `<div class="form">${f.sel('estado', 'Estado operativo', CAT.ESTADOS, eq.estado)}</div>`, acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => { await S.update('equipos', id, leer(m.body)); toast('Estado actualizado'); A.recargar(); } }] }),
      borrarEq: async () => {
        if (!(await confirmar(`¿Eliminar definitivamente ${eq.nombre} (${eq.codigo_inv}) y toda su carpeta? Para conservar el historial se recomienda marcarlo como "Dado de baja".`))) return;
        for (const d of docs) { try { await S.removeFile(d.archivo); } catch {} }
        await S.remove('equipos', id); toast('Equipo eliminado'); go('areas', { id: eq.entidad_id });
      },
    });
  };

  // Imagen del equipo (sale en el recuadro "IMAGEN DEL EQUIPO" de la hoja de vida)
  A.cargarFotoEquipo = (eq) => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => {
      const fl = inp.files[0]; if (!fl) return;
      try {
        const foto = await UI.reducirImagen(fl, 900, 'image/jpeg');
        const act = await S.get('equipos', eq.id);
        await S.update('equipos', eq.id, { hv: { ...(act.hv || {}), foto } });
        toast('Imagen del equipo guardada: ya sale en la hoja de vida'); A.recargar();
      } catch (e) { toast(e.message || 'No se pudo cargar la imagen', true); }
    };
    inp.click();
  };

  A.verHojaVida = async (eq, ent, cons, mtos) => {
    const blob = await FMT.hojaVida({ eq, ent, cons, fmt: st.fmt.hoja_vida });
    S.log('CONSULTA', 'equipos', eq.id, `Hoja de vida ${eq.codigo_inv}`);
    UI.verPDF({ titulo: `Hoja de vida · ${eq.nombre}`, blob, nombre: `HV_${eq.codigo_inv}_${eq.nombre}.pdf`, alDescargar: () => S.log('DESCARGA', 'equipos', eq.id, `Hoja de vida ${eq.codigo_inv}`),
      extras: [{ t: `${I.ver} Documentos de soporte`, fn: () => { A.modalDocsHV(eq, ent, cons); return false; } }] });
  };

  // ---------------------------------------------------------------- Carpeta (genérica)
  V.carpeta = async ({ ent: entId, eq: eqId, k, sede = null }) => {
    const ent = await S.get('entidades', entId);
    const sedesE = sede && !eqId ? A.sedesDe(await S.list('consultorios', { entidad_id: entId }), ent) : [];
    if (!sedesE.includes(sede)) sede = null;
    const eq = eqId ? await S.get('equipos', eqId) : null;
    const def = (eq ? A.carpetasEq(ent, eq) : A.carpetasEnt(ent)).find((c) => c.k === k) || { k, n: k };
    const nomDef = A.nomCarpeta(ent, eq ? 'eq' : 'ent', k, eq);
    const ruta = [...A.rutaEnt(ent), ...(sede ? [[sede.toUpperCase(), 'entidad', { id: ent.id, sede }]] : []), ...(eq ? [[A.nomCarpeta(ent, 'ent', CARP_EQ), 'areas', { id: ent.id }], [eq.nombre.toUpperCase(), 'equipo', { id: eq.id }]] : []), nomDef];
    content().innerHTML = `${migas(ruta)}
      <div class="page-head"><div><span class="eyebrow">${eq ? `Equipo ${h(eq.codigo_inv)}` : sede ? `Sede ${h(sede)}` : 'Carpeta de la entidad'}</span><h1>${h(nomDef)}</h1></div>${esProp() && (def.ia || eq) ? `<div class="actions">${eq && k === 'hoja_vida' ? `<button class="btn pri" data-act="iaHV" title="La IA lee manual, ficha técnica, inventario, registro sanitario y factura del equipo y propone los datos">${I.ia} Actualizar hoja de vida con IA</button>` : ''}${eq ? `<button class="btn" data-act="google">${I.ia} Buscar con Google</button>` : ''}<button class="btn pri" data-act="ia">${I.ia} Redactar con IA</button></div>` : ''}</div>
      ${def.gen ? '<div id="gen" style="display:grid;gap:18px"></div>' : ''}
      <section class="panel" id="archivos"></section>`;
    const ctx = { ent, eq, k, def, sede };
    A.acts({ ia: () => A.asistenteIA({ ent, eq, carpeta: k }), iaHV: () => A.asistenteIA({ ent, eq, auto: 'hv' }), google: () => A.buscarGoogleEquipo(eq, ent) });
    if (def.gen) {
      const [tipo, sub] = def.gen.split(':');
      await A.G[tipo](document.getElementById('gen'), ctx, sub);
    }
    const subs = [...(def.subs || [])];
    if (def.subsAnio) for (let a = new Date().getFullYear(); a >= new Date().getFullYear() - 3; a--) subs.push(def.subsAnio(a));
    await A.archivos(document.getElementById('archivos'), {
      entidad_id: entId, equipo_id: def.rel ? null : (eqId || null), carpeta: def.carpetaReal || k, titulo: k === 'inventarios' ? 'Archivos del inventario' : 'Archivos y subcarpetas',
      subs, todos: !!def.todos, relEquipo: def.rel ? eqId : null, sede, sedes: sedesE,
    });
  };

  // ---------------------------------------------------------------- fecha real de un documento
  // 1) la fecha escrita en el nombre (ej. "MTTO CENT 038 24_04_2026.pdf", "INVENTARIO MAYO-2024.pdf", "2024-2025")
  // 2) la fecha del documento  3) la fecha en que se subió. Devuelve AAAA-MM-DD para ordenar del más reciente al más antiguo.
  const MES_N = { ENE: 1, FEB: 2, MAR: 3, ABR: 4, MAY: 5, JUN: 6, JUL: 7, AGO: 8, SEP: 9, SET: 9, OCT: 10, NOV: 11, DIC: 12 };
  const p2 = (n) => String(n).padStart(2, '0');
  const okF = (y, m, d) => y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31;
  A.fechaDeNombre = (nombre) => {
    const t = String(nombre || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\.[A-Z0-9]{2,5}$/, '');
    let m = t.match(/(?:^|\D)(\d{1,2})[\s._\-/](\d{1,2})[\s._\-/](\d{4})(?!\d)/); if (m && okF(+m[3], +m[2], +m[1])) return `${m[3]}-${p2(m[2])}-${p2(m[1])}`;
    m = t.match(/(?:^|\D)(\d{4})[\s._\-/](\d{1,2})[\s._\-/](\d{1,2})(?!\d)/); if (m && okF(+m[1], +m[2], +m[3])) return `${m[1]}-${p2(m[2])}-${p2(m[3])}`;
    m = t.match(/(?:^|\D)(\d{1,2})[\s._\-/](\d{1,2})[\s._\-/](\d{2})(?!\d)/); if (m && okF(2000 + +m[3], +m[2], +m[1])) return `20${m[3]}-${p2(m[2])}-${p2(m[1])}`;
    m = t.match(/\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|SET|OCT|NOV|DIC)[A-Z]*[\s._\-/]*(?:DE[\s._\-]*)?(\d{4})(?!\d)/); if (m) return `${m[2]}-${p2(MES_N[m[1]])}-01`;
    const ys = [...t.matchAll(/(?:^|\D)(20\d{2}|19\d{2})(?!\d)/g)].map((x) => +x[1]).filter((y) => y >= 1990 && y <= 2100);
    if (ys.length) return `${Math.max(...ys)}-01-01`;
    return '';
  };
  A.fechaDocumento = (d) => A.fechaDeNombre(d.nombre) || String(d.fecha_documento || d.created_at || '').slice(0, 10);
  // orden: más reciente primero; con la misma fecha, el número inicial más alto primero ("2. MTTO…" antes que "1. MTTO…")
  A.ordenDocs = (a, b) => A.fechaDocumento(b).localeCompare(A.fechaDocumento(a)) || ((parseFloat(b.nombre) || 0) - (parseFloat(a.nombre) || 0)) || String(b.created_at || '').localeCompare(String(a.created_at || '')) || String(a.nombre).localeCompare(String(b.nombre), 'es', { numeric: true });

  // ---------------------------------------------------------------- Archivos de una carpeta (con subcarpetas)
  st.subSel = st.subSel || {};
  A.archivos = async (cont, opts) => {
    const { entidad_id, equipo_id, carpeta, titulo = 'Archivos', subs = [], todos = false, relEquipo = null, sede = null, sedes = [] } = opts;
    const recargar = () => A.archivos(cont, opts);
    const filtros = { carpeta, entidad_id: entidad_id || null };
    let docs = await S.list('documentos', filtros, '-created_at');
    // Dentro de una sede: se ven los documentos de "SEDE/…" (sin el nombre de la sede) y los generales de la entidad
    const conSede = (sub) => (sede ? [sede, sub].filter(Boolean).join('/') : sub) || null;
    if (sede && !equipo_id && !relEquipo) {
      docs = docs.filter((d) => d.equipo_id || A.esDeSede(d, sede, sedes)).map((d) => {
        const p = (d.subcarpeta || '').split('/');
        return p[0] === sede ? { ...d, subcarpeta: p.slice(1).join('/') || null, _sede: true } : { ...d, _general: true };
      });
    }
    const subReal = (d, sub) => (d._sede ? conSede(sub) : sub || null);
    if (!esProp()) docs = docs.filter((d) => !window.IBCOL_ES_EXCEL(d.nombre));
    if (relEquipo) docs = docs.filter((d) => d.equipo_id === relEquipo || (d.equipos_rel || []).includes(relEquipo));
    else if (!todos) docs = docs.filter((d) => (d.equipo_id || null) === (equipo_id || null));
    const llave = `${entidad_id}|${equipo_id || relEquipo || ''}|${carpeta}${sede ? '|' + sede : ''}`;
    st.subExtra = st.subExtra || {};
    const raiz = (d) => (d.subcarpeta || '').split('/')[0];
    const listaSubs = [...new Set([...subs, ...[...new Set([...(st.subExtra[llave] || []).map((x) => x.split('/')[0]), ...docs.map(raiz).filter(Boolean)])].filter((x) => !subs.includes(x)).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))])];
    let sel = st.subSel[llave] ?? '';
    // sel puede ser una ruta "SUB/SUBSUB/…" (subcarpetas dentro de subcarpetas)
    if (sel && !listaSubs.includes(sel.split('/')[0])) sel = '';
    const dentro = (d, ruta) => { const x = d.subcarpeta || ''; return x === ruta || x.startsWith(ruta + '/'); };
    const selRaiz = sel.split('/')[0];
    const hijos = sel ? [...new Set([...docs.filter((d) => (d.subcarpeta || '').startsWith(sel + '/')).map((d) => d.subcarpeta.slice(sel.length + 1).split('/')[0]), ...(st.subExtra[llave] || []).filter((x) => x.startsWith(sel + '/')).map((x) => x.slice(sel.length + 1).split('/')[0])])].filter(Boolean).sort((a, b) => a.localeCompare(b, 'es', { numeric: true })) : [];
    const cuentaRuta = (r) => docs.filter((d) => dentro(d, r)).length;
    // Del más reciente al más antiguo: fecha del documento (o de carga), luego hora de carga
    const fechaDoc = (d) => A.fechaDocumento(d);
    const visibles = docs.filter((d) => !sel || dentro(d, sel)).sort(A.ordenDocs);
    const cuenta = (s) => docs.filter((d) => raiz(d) === s).length;
    const tipoExt = (n) => { const e = UI.ext(n); return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(e) ? 'img' : e; };
    cont.innerHTML = `<header><h2>${h(titulo)}</h2>${esProp() ? `<div class="actions">${sel && cuentaRuta(sel) ? `<button class="btn" data-act="renSub" title="Cambiar el nombre de la subcarpeta “${h(sel)}”">${I.edit} Renombrar subcarpeta</button>` : ''}${sel && (cuentaRuta(sel) || !subs.includes(sel)) ? `<button class="btn danger" data-act="delSub" title="Eliminar la subcarpeta “${h(sel)}”">${I.del} Eliminar subcarpeta</button>` : ''}<button class="btn" data-act="nuevaSub">${I.mas} ${sel ? 'Subcarpeta aquí' : 'Subcarpeta'}</button><label class="btn">${I.subir} Importar carpeta<input type="file" webkitdirectory multiple hidden data-dir></label><label class="btn pri">${I.subir} Subir archivos<input type="file" multiple hidden data-up></label></div>` : ''}</header>
      ${listaSubs.length ? `<div class="subs" role="tablist"><button class="sub ${sel ? '' : 'on'}" data-act="sub" data-s="">Todo <span>${docs.length}</span></button>${listaSubs.map((s) => `<button class="sub ${s === selRaiz ? 'on' : ''}" data-act="sub" data-s="${h(s)}">${h(s)} <span>${cuenta(s)}</span></button>`).join('')}</div>` : ''}
      ${sel && (sel.includes('/') || hijos.length) ? `<div class="subs subs-in" aria-label="Subcarpetas de ${h(sel)}">${sel.split('/').map((seg, i, arr) => { const r = arr.slice(0, i + 1).join('/'); return `<button class="sub ruta ${r === sel ? 'on' : ''}" data-act="sub" data-s="${h(r)}">${i ? '› ' : ''}${h(seg)}</button>`; }).join('')}${hijos.map((c) => `<button class="sub" data-act="sub" data-s="${h(sel + '/' + c)}">${I.carpeta} ${h(c)} <span>${cuentaRuta(sel + '/' + c)}</span></button>`).join('')}</div>` : ''}
      ${esProp() ? `<div class="drop" data-drop>Arrastre aquí archivos para guardarlos en <b>${h((sel || 'esta carpeta').replace(/\//g, ' › '))}</b></div>` : ''}
      ${visibles.length ? `<div class="files">${visibles.map((d) => {
        const dv = UI.diasHasta(d.fecha_vencimiento);
        return `<div class="file"><span class="ext ${tipoExt(d.nombre)}">${h(UI.ext(d.nombre).slice(0, 4).toUpperCase())}</span>
          <div class="info"><b>${h(d.nombre)}</b><small>${d.subcarpeta && d.subcarpeta !== sel ? `<span class="pill acc">${h(sel ? d.subcarpeta.slice(sel.length + 1) : d.subcarpeta)}</span>` : ''}${d.fecha_documento ? `<span>Fecha: ${UI.fecha(d.fecha_documento)}</span>` : ''}${d.tamano ? `<span>${UI.tam(d.tamano)}</span>` : ''}
            ${d.fecha_vencimiento ? `<span class="pill ${dv < 0 ? 'bad' : dv <= 30 ? 'warn' : 'ok'}">Vence ${UI.fecha(d.fecha_vencimiento)}</span>` : ''}${d.firmado ? '<span class="pill ok">Firmado</span>' : ''}${sede && d._general && !d.equipo_id ? '<span class="pill">Toda la entidad</span>' : ''}${esProp() && d.visible_cliente === false ? '<span class="pill">Oculto al cliente</span>' : ''}</small></div>
          <div class="tools"><button class="icon-btn" data-act="verDoc" data-id="${d.id}" aria-label="Ver">${I.ver}</button><button class="icon-btn" data-act="bajarDoc" data-id="${d.id}" aria-label="Descargar">${I.bajar}</button><button class="icon-btn" data-act="enviarDoc" data-id="${d.id}" aria-label="Enviar por WhatsApp o correo" title="Enviar por WhatsApp o correo">${I.mail}</button>
            ${esProp() && carpeta === 'inventarios' && /^(pdf|xlsx?|csv)$/.test(UI.ext(d.nombre)) ? `<button class="btn sm" data-act="usarInv" data-id="${d.id}">Crear servicios y equipos</button>` : ''}
            ${esProp() ? `${UI.ext(d.nombre) === 'pdf' ? `<button class="icon-btn" data-act="firmarDoc" data-id="${d.id}" aria-label="Firmar">${I.firma}</button>` : ''}<button class="icon-btn" data-act="editDoc" data-id="${d.id}" aria-label="Modificar">${I.edit}</button><button class="icon-btn bad" data-act="delDoc" data-id="${d.id}" aria-label="Eliminar">${I.del}</button>` : ''}</div></div>`;
      }).join('')}</div>` : `<div class="empty">${esProp() ? `${sel ? `La subcarpeta “${h(sel)}” está vacía.` : 'Esta carpeta aún no tiene archivos.'}` : 'Aún no hay documentos cargados en esta carpeta.'}</div>`}`;

    const ruta = (fl) => `${entidad_id || 'interno'}/${equipo_id || relEquipo || 'general'}/${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${slug(fl.name)}`;
    const subir = async (files, conRutas) => {
      if (!files.length) return;
      let n = 0;
      for (const fl of files) {
        if (fl.size > 50 * 1048576) { toast(`${fl.name}: supera 50 MB`, true); continue; }
        const rel = conRutas ? (fl.webkitRelativePath || '').split('/').slice(1, -1).join('/') : '';
        const subcarpeta = conSede([sel, rel].filter(Boolean).join('/'));
        const path = ruta(fl);
        await S.upload(path, fl);
        await S.insert('documentos', { entidad_id, equipo_id: equipo_id || relEquipo || null, carpeta, subcarpeta, nombre: fl.name, archivo: path, mime: fl.type, tamano: fl.size, fecha_documento: UI.hoy(), visible_cliente: true, ...(relEquipo ? { equipos_rel: [relEquipo] } : {}) });
        n++;
      }
      toast(n === 1 ? 'Archivo guardado' : `${n} archivos guardados`);
      recargar();
    };
    const up = cont.querySelector('[data-up]'); if (up) up.onchange = (e) => subir([...e.target.files], false).catch((er) => toast(er.message, true));
    const dir = cont.querySelector('[data-dir]'); if (dir) dir.onchange = (e) => subir(A.filtrarOcultos([...e.target.files]), true).catch((er) => toast(er.message, true));
    const drop = cont.querySelector('[data-drop]');
    if (drop) {
      drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('on'); };
      drop.ondragleave = () => drop.classList.remove('on');
      drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('on'); subir([...e.dataTransfer.files], false).catch((er) => toast(er.message, true)); };
    }
    const doc = (id) => docs.find((d) => d.id === id);
    const blobDe = async (d) => { const b = await S.fileBlob(d.archivo); if (!b) throw new Error('El archivo no está disponible en este dispositivo'); return b; };
    const verDoc = async (d) => {
      const b = await blobDe(d); S.log('CONSULTA', 'documentos', d.id, d.nombre);
      const e = UI.ext(d.nombre);
      if (e === 'pdf') {
        UI.verPDF({ titulo: d.nombre, blob: b, nombre: d.nombre, archivo: d.archivo, alDescargar: () => S.log('DESCARGA', 'documentos', d.id, d.nombre), firmar: esProp() ? (pos) => firmarDoc(d, b, pos) : null });
      } else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(e)) {
        const url = URL.createObjectURL(b);
        modal({ titulo: d.nombre, size: 'wide', cuerpo: `<div class="viewer"><img src="${url}" alt="${h(d.nombre)}"></div>`, acciones: [{ t: `${I.mail} Enviar`, fn: () => { A.enviarDoc({ nombre: d.nombre, blob: b, archivo: d.archivo, registro: d.id }); return false; } }, { t: `${I.bajar} Descargar`, cls: 'pri', fn: () => { UI.descargar(b, d.nombre); return false; } }] });
      } else { UI.descargar(b, d.nombre); S.log('DESCARGA', 'documentos', d.id, d.nombre); toast('Este tipo de archivo se abre con su programa (Excel/Word). Descargando…'); }
    };
    const firmarDoc = async (d, b, pos) => {
      const firma = await UI.pedirFirma({ titulo: 'Firmar documento', actual: st.firma, nota: 'La firma se estampará en el punto que tocó, con su nombre y la fecha.' });
      if (!firma) return false;
      const nb = await PDF.firmarPDF(b, firma, { ...pos, nombre: st.emp.responsable, detalle: `${st.emp.cargo} · Firmado ${new Date().toLocaleString('es-CO')}` });
      const path = d.archivo.replace(/(\.pdf)?$/i, `-firmado-${Date.now()}.pdf`);
      await S.upload(path, nb);
      await S.update('documentos', d.id, { archivo: path, tamano: nb.size, firmado: true, firma_info: { por: st.perfil.usuario, fecha: new Date().toISOString() }, versiones: [...(d.versiones || []), { archivo: d.archivo, fecha: d.updated_at || d.created_at }] });
      S.log('FIRMA', 'documentos', d.id, d.nombre);
      toast('Documento firmado. La versión anterior quedó guardada.');
      recargar();
      return true;
    };
    A.acts({
      sub: (dd) => { st.subSel[llave] = dd.s; recargar(); },
      delSub: () => {
        const viejo = sel; if (!viejo) return;
        const afectados = docs.filter((d) => dentro(d, viejo));
        const fija = subs.includes(viejo);
        const padre = viejo.split('/').slice(0, -1).join('/');
        const fin = () => { st.subExtra[llave] = (st.subExtra[llave] || []).filter((x) => x !== viejo && !x.startsWith(viejo + '/')); st.subSel[llave] = padre; recargar(); };
        if (!afectados.length) { fin(); toast('Subcarpeta eliminada'); return; }
        modal({
          titulo: `Eliminar la subcarpeta “${viejo}”`, size: 'sm',
          cuerpo: `<form class="form" onsubmit="return false"><p>Tiene <b>${afectados.length}</b> archivo${afectados.length === 1 ? '' : 's'} (incluidas sus subcarpetas internas).${fija ? ' Es una subcarpeta propia del formato: queda vacía pero no desaparece.' : ''}</p>
            <label class="checks full radio-line"><input type="radio" name="modo" value="mover" checked> Conservar los archivos: pasarlos a ${padre ? `“${h(padre.split('/').pop())}”` : 'la carpeta principal'}</label>
            <label class="checks full radio-line"><input type="radio" name="modo" value="borrar"> Eliminar también los archivos (no se puede deshacer)</label>
            <div class="fields">${f.input('confirma', 'Para eliminar los archivos escriba ELIMINAR', '', { full: true, attrs: 'autocomplete="off"' })}</div></form>`,
          acciones: [{ t: 'Cancelar' }, { t: `${I.del} Eliminar subcarpeta`, cls: 'pri danger', fn: async (m) => {
            const v = leer(m.body);
            if (v.modo === 'borrar' && v.confirma.trim().toUpperCase() !== 'ELIMINAR') { toast('Escriba ELIMINAR para confirmar que se borran los archivos', true); return false; }
            for (const d of afectados) {
              if (v.modo === 'borrar') { await S.remove('documentos', d.id); try { await S.removeFile(d.archivo); } catch {} }
              else { const resto = (d.subcarpeta || '').slice(viejo.length + 1); await S.update('documentos', d.id, { subcarpeta: subReal(d, [padre, resto].filter(Boolean).join('/')) }); }
            }
            S.log('ELIMINAR', 'documentos', entidad_id, `Subcarpeta ${viejo} eliminada (${v.modo === 'borrar' ? afectados.length + ' archivos borrados' : 'archivos pasados a la carpeta principal'})`);
            toast(v.modo === 'borrar' ? 'Subcarpeta y archivos eliminados' : 'Subcarpeta eliminada; los archivos quedaron en la carpeta principal'); fin();
          } }],
        });
      },
      renSub: () => {
        const viejo = sel; if (!viejo) return;
        const afectados = docs.filter((d) => dentro(d, viejo));
        const padre = viejo.split('/').slice(0, -1).join('/'), nomV = viejo.split('/').pop();
        modal({
          titulo: 'Cambiar nombre de la subcarpeta', size: 'sm',
          cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('nombre', 'Nuevo nombre', nomV, { full: true })}</div><p class="muted" style="font-size:.85rem">Se cambia en ${afectados.length} archivo${afectados.length === 1 ? '' : 's'} de esta subcarpeta (y sus subcarpetas internas).</p></form>`,
          acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
            const v = leer(m.body).nombre.replace(/\//g, '-').replace(/\s+/g, ' ').trim(); if (!v) { toast('Escriba el nombre', true); return false; }
            if (v === nomV) return;
            const nueva = [padre, v].filter(Boolean).join('/');
            for (const d of afectados) { const resto = (d.subcarpeta || '').slice(viejo.length); await S.update('documentos', d.id, { subcarpeta: subReal(d, nueva + resto) }); }
            st.subExtra[llave] = (st.subExtra[llave] || []).map((x) => (x === viejo || x.startsWith(viejo + '/') ? nueva + x.slice(viejo.length) : x));
            st.subSel[llave] = nueva; S.log('EDITAR', 'documentos', entidad_id, `Subcarpeta ${viejo} → ${v}`); toast('Subcarpeta renombrada'); recargar();
          } }],
        });
      },
      usarInv: async (dd) => { const ent = await S.get('entidades', entidad_id); await A.inventarioDesdeDoc(ent, doc(dd.id)); },
      nuevaSub: () => modal({ titulo: sel ? `Nueva subcarpeta dentro de “${sel.split('/').pop()}”` : 'Nueva subcarpeta', size: 'sm', cuerpo: `<div class="form">${sel ? `<p class="muted" style="font-size:.85rem">Se creará dentro de <b>${h(sel.replace(/\//g, ' › '))}</b>. Para crearla al primer nivel, toque antes “Todo”.</p>` : ''}${f.input('nombre', 'Nombre de la subcarpeta', '', { attrs: 'placeholder="ej: 2026-CONSULTA ALERTAS E INFORMES DE SEGURIDAD"' })}<p class="muted">Quedará guardada cuando suba el primer archivo en ella.</p></div>`,
        acciones: [{ t: 'Cancelar' }, { t: 'Crear', cls: 'pri', fn: (m) => { const n = leer(m.body).nombre.replace(/\//g, '-').trim(); if (!n) { toast('Escriba el nombre', true); return false; } const v = sel ? `${sel}/${n}` : n; st.subExtra[llave] = [...(st.subExtra[llave] || []), v]; st.subSel[llave] = v; recargar(); } }] }),
      verDoc: (dd) => verDoc(doc(dd.id)),
      enviarDoc: (dd) => { const d = doc(dd.id); A.enviarDoc({ nombre: d.nombre, archivo: d.archivo, obtenerBlob: () => blobDe(d), registro: d.id }); },
      bajarDoc: async (dd) => { const d = doc(dd.id); UI.descargar(await blobDe(d), d.nombre); S.log('DESCARGA', 'documentos', d.id, d.nombre); },
      firmarDoc: async (dd) => { const d = doc(dd.id); const b = await blobDe(d); toast('Toque “Firmar” y luego el lugar de la página donde va la firma'); UI.verPDF({ titulo: `Firmar · ${d.nombre}`, blob: b, nombre: d.nombre, firmar: (pos) => firmarDoc(d, b, pos) }); },
      delDoc: async (dd) => { const d = doc(dd.id); if (!(await confirmar(`¿Eliminar "${d.nombre}"?`))) return; await S.remove('documentos', d.id); try { await S.removeFile(d.archivo); } catch {} toast('Archivo eliminado'); recargar(); },
      editDoc: (dd) => {
        const d = doc(dd.id); let nuevo = null;
        modal({
          titulo: 'Modificar documento',
          cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('nombre', 'Nombre', d.nombre, { full: true })}${f.input('subcarpeta', 'Subcarpeta', d.subcarpeta || '', { full: true })}${f.input('fecha_documento', 'Fecha del documento', d.fecha_documento, { type: 'date' })}${f.input('fecha_vencimiento', 'Fecha de vencimiento (genera alerta)', d.fecha_vencimiento, { type: 'date' })}
            <div class="field full">${window.IBCOL_ES_EXCEL(d.nombre) ? '<span class="muted">Formato en Excel: solo lo ve IBCOL (las entidades no tienen acceso).</span>' : `<label class="checks"><input type="checkbox" name="visible_cliente" data-single ${d.visible_cliente !== false ? 'checked' : ''}> Visible para el cliente</label>`}</div>
            <div class="field full"><span class="lbl">Reemplazar archivo (la versión anterior se conserva)</span><input type="file" data-rep></div></div></form>`,
          acciones: [{ t: 'Cancelar' }, { t: 'Guardar cambios', cls: 'pri', fn: async (m) => {
            const v = leer(m.body); const cambios = { nombre: v.nombre || d.nombre, subcarpeta: d._general ? (v.subcarpeta || null) : subReal({ _sede: !!sede }, v.subcarpeta), fecha_documento: v.fecha_documento || null, fecha_vencimiento: v.fecha_vencimiento || null, visible_cliente: v.visible_cliente };
            if (nuevo) {
              const path = ruta(nuevo);
              await S.upload(path, nuevo);
              Object.assign(cambios, { archivo: path, mime: nuevo.type, tamano: nuevo.size, firmado: false, versiones: [...(d.versiones || []), { archivo: d.archivo, fecha: d.updated_at || d.created_at }] });
              if (v.nombre === d.nombre) cambios.nombre = nuevo.name;
            }
            await S.update('documentos', d.id, cambios); toast('Documento actualizado'); recargar();
          } }],
          alAbrir: (m) => { m.body.querySelector('[data-rep]').onchange = (e) => { nuevo = e.target.files[0] || null; }; },
        });
      },
    });
  };

  // Guarda un PDF generado como documento de una carpeta
  A.guardarPDF = async ({ blob, nombre, entidad_id, equipo_id, carpeta, subcarpeta = null, equipos_rel = null }) => {
    const path = `${entidad_id}/${equipo_id || 'general'}/${carpeta}/${Date.now()}-${slug(nombre)}`;
    await S.upload(path, blob);
    return S.insert('documentos', { entidad_id, equipo_id, carpeta, subcarpeta, nombre, archivo: path, mime: 'application/pdf', tamano: blob.size, fecha_documento: UI.hoy(), visible_cliente: true, firmado: true, ...(equipos_rel ? { equipos_rel } : {}) });
  };

  A.nombreRel = (fl) => fl.name;
  A.filtrarOcultos = (files) => files.filter((fl) => !/(^|\/)(\.|~\$|Thumbs\.db|desktop\.ini)/i.test(fl.webkitRelativePath || fl.name));
  const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const REGLAS_ENT = [[/inventario/, 'inventarios'], [/cronograma/, 'cronogramas'], [/hoja.*vida.*ingenier|ingenier/, 'hv_ingenieros'], [/informacion del equipo|hojas? de vida|mtos|metrolog.*factura/, 'equipos'],
    [/protocol|programas?$|procedimiento/, 'protocolos'], [/tecnovigil/, 'tecnovigilancia'], [/alerta/, 'alertas'], [/capacitac/, 'capacitaciones'], [/limpieza|desinfecc/, 'limpieza'],
    [/glucomet/, 'glucometro'], [/acta.*revision|revision.*sede/, 'actas_revision'], [/indicador/, 'indicadores'],
    [/contrato/, 'contratos'], [/cotizac/, 'cotizaciones'], [/cuenta.*cobro/, 'cuentas_cobro'], [/factura/, 'facturas'], [/archivo|trazabil|patron|acta/, 'archivo']];
  const REGLAS_EQ = [[/hoja.*vida|\bhv\b/, 'hoja_vida'], [/correctiv/, 'mto_correctivo'], [/preventiv|mantenimiento|mtto|\bmto/, 'mto_preventivo'], [/metrolog|calibrac|certificado.*cal/, 'metrologia'],
    [/registro.*sanit|invima/, 'registro_sanitario'], [/factura/, 'factura'], [/manual|ficha/, 'manual'], [/importac/, 'importacion'], [/baja/, 'acta_baja'], [/entrega/, 'acta_entrega']];
  const adivinarUno = (nombre, cat, reglas) => {
    const n = A.numDe(nombre);
    if (n !== null) { const c = cat.find((x) => A.numDe(x.n) === n); if (c && reglas.some(([re, k]) => k === c.k && re.test(norm(nombre)))) return c.k; }
    const t = norm(nombre); for (const [re, k] of reglas) if (re.test(t)) return k;
    if (n !== null) { const c = cat.find((x) => A.numDe(x.n) === n); if (c) return c.k; }
    return null;
  };
  A.adivinarEnt = (nombre) => adivinarUno(nombre, CAT.CARPETAS_ENTIDAD, REGLAS_ENT);
  A.adivinarEq = (nombre) => adivinarUno(nombre, CAT.CARPETAS_EQUIPO, REGLAS_EQ);

  // Sube un archivo y crea su registro (usado por los importadores)
  const subirDoc = async ({ ent, eqId = null, carpeta, subcarpeta = null, fl }) => {
    const path = `${ent.id}/${eqId || 'general'}/${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${slug(fl.name)}`;
    await S.upload(path, fl);
    await S.insert('documentos', { entidad_id: ent.id, equipo_id: eqId, carpeta, subcarpeta, nombre: fl.name, archivo: path, mime: fl.type, tamano: fl.size, fecha_documento: UI.hoy(), visible_cliente: true });
  };

  // Importa la carpeta de UN equipo (0. HOJA VIDA, 1. MANTENIMIENTOS, …)
  A.importarCarpeta = ({ ent, eq }) => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.webkitdirectory = true;
    inp.onchange = () => {
      const files = A.filtrarOcultos([...inp.files]); if (!files.length) return toast('La carpeta no tiene archivos', true);
      const grupos = {};
      files.forEach((fl) => { const p = fl.webkitRelativePath.split('/'); const sub = p[1] && p.length > 2 ? p[1] : '(raíz de la carpeta)'; (grupos[sub] = grupos[sub] || []).push(fl); });
      const claves = Object.keys(grupos).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
      modal({
        titulo: `Importar carpeta al equipo ${eq.nombre}`, size: 'wide',
        cuerpo: `<div class="form"><p class="muted">${files.length} archivos en “${h(files[0].webkitRelativePath.split('/')[0])}”. Revise a qué carpeta del equipo irá cada subcarpeta.</p>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Subcarpeta del computador</th><th class="r">Archivos</th><th>Guardar en</th></tr></thead><tbody>
          ${claves.map((k, i) => { const sug = (k === '(raíz de la carpeta)' ? null : A.adivinarEq(k)) || 'hoja_vida'; return `<tr><td>${h(k)}</td><td class="r num">${grupos[k].length}</td><td><select data-g="${i}" aria-label="Carpeta destino">${CAT.CARPETAS_EQUIPO.map((c) => `<option value="${c.k}" ${c.k === sug ? 'selected' : ''}>${h(c.n)}</option>`).join('')}<option value="">— No importar —</option></select></td></tr>`; }).join('')}
          </tbody></table></div><div class="muted" data-prog></div></div>`,
        acciones: [{ t: 'Cancelar' }, { t: `${I.subir} Importar ${files.length} archivos`, cls: 'pri', fn: async (m) => {
          const prog = m.body.querySelector('[data-prog]'); let n = 0, err = 0;
          for (const [i, k] of claves.entries()) {
            const carpeta = m.body.querySelector(`[data-g="${i}"]`).value; if (!carpeta) continue;
            for (const fl of grupos[k]) {
              try {
                if (fl.size > 50 * 1048576) throw new Error('grande');
                const p = fl.webkitRelativePath.split('/'); const sub = p.length > 3 ? p.slice(2, -1).join('/') : null;
                await subirDoc({ ent, eqId: eq.id, carpeta, subcarpeta: sub, fl }); n++;
              } catch (e) { err++; console.error(e); }
              prog.textContent = `Subiendo… ${n} de ${files.length}`;
            }
          }
          toast(`${n} archivos importados${err ? ` · ${err} no se pudieron subir` : ''}`, !!err); A.recargar();
        } }],
      });
    };
    inp.click();
  };

  // Importa la carpeta COMPLETA de una entidad con la estructura de Drive:
  //  ENTIDAD / 1. INVENTARIO … / 3. HOJAS DE VIDA… / ÁREA / EQUIPO / 0. HOJA VIDA …
  //  También por SEDES: ENTIDAD / A1. SEDE II / (A1. INVENTARIO, B2. CRONOGRAMAS, C3. HOJAS DE VIDA…)
  //  Cada sede crea sus propios servicios (con el nombre de la sede) y sus documentos quedan
  //  en la carpeta equivalente, dentro de una subcarpeta con el nombre de la sede.
  A.limpiaSede = (t) => String(t || '').replace(/^\s*[A-ZÑ]?\d+(\.\d+)*\s*[.\-)]?\s+/i, '').trim();
  const sedeDe = (c) => c?.sede || 'Sede principal';
  A.importarEntidad = (ent, soloEquipos = false) => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.webkitdirectory = true;
    inp.onchange = async () => {
      const files = A.filtrarOcultos([...inp.files]); if (!files.length) return toast('La carpeta no tiene archivos', true);
      const partes = (fl) => fl.webkitRelativePath.split('/');
      const raizNombre = partes(files[0])[0];
      // Si se eligió directamente la carpeta "3. HOJAS DE VIDA…", tratarla como tal
      const raizEsEquipos = soloEquipos || A.adivinarEnt(raizNombre) === CARP_EQ;
      // ¿Qué subcarpetas de la raíz son SEDES? (tienen dentro inventario / cronogramas / hojas de vida)
      const hijos = {};
      if (!raizEsEquipos) files.forEach((fl) => { const p = partes(fl); if (p.length > 3) (hijos[p[1]] = hijos[p[1]] || new Set()).add(p[2]); });
      const ESTRUCT = ['inventarios', 'cronogramas', CARP_EQ];
      const sedes = Object.keys(hijos).filter((k) => !ESTRUCT.includes(A.adivinarEnt(k)) && [...hijos[k]].filter((x) => ESTRUCT.includes(A.adivinarEnt(x))).length >= 2)
        .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
      const sedeRaizSug = sedes.length ? 'Sede principal' : /home\s*care/i.test(raizNombre) ? 'HOME CARE' : 'Sede principal';
      // Grupos: cada carpeta de primer nivel (o de primer nivel dentro de cada sede)
      const grupos = {};
      files.forEach((fl) => {
        const p = partes(fl); let key, g;
        if (raizEsEquipos) { key = '__equipos__'; g = { sk: '', top: raizNombre, base: 1 }; }
        else if (sedes.includes(p[1])) {
          const top = p.length > 3 ? p[2] : '(archivos sueltos)';
          key = `${p[1]}␟${top}`; g = { sk: p[1], top, base: 3, suelto: p.length <= 3 };
        } else {
          const top = p.length > 2 ? p[1] : '(archivos sueltos)';
          key = `␟${top}`; g = { sk: '', top, base: 2, suelto: p.length <= 2 };
        }
        (grupos[key] = grupos[key] || { ...g, files: [] }).files.push(fl);
      });
      const claves = Object.keys(grupos).sort((a, b) => { const A1 = grupos[a], B1 = grupos[b]; return (A1.sk ? 1 : 0) - (B1.sk ? 1 : 0) || A1.sk.localeCompare(B1.sk, 'es', { numeric: true }) || A1.top.localeCompare(B1.top, 'es', { numeric: true }); });
      const analizar = (lista, base) => {
        const areas = {};
        lista.forEach((fl) => { const p = partes(fl).slice(base); if (p.length >= 3) { const a = p[0], e = p[1]; areas[a] = areas[a] || new Set(); areas[a].add(e); } });
        return areas;
      };
      const CORR = '__corr';
      const sugerir = (g) => (g.top === raizNombre && raizEsEquipos ? CARP_EQ : g.suelto ? 'archivo' : /correctiv/.test(norm(g.top)) ? CORR : (A.adivinarEnt(g.top) || 'archivo'));
      const opciones = (sug) => `${CAT.CARPETAS_ENTIDAD.map((c) => `<option value="${c.k}" ${c.k === sug ? 'selected' : ''}>${h(c.n)}</option>`).join('')}<option value="${CORR}" ${sug === CORR ? 'selected' : ''}>→ Mantenimientos correctivos de cada equipo (según el código del archivo)</option><option value="">— No importar —</option>`;
      const fila = (k, i) => {
        const g = grupos[k], sug = sugerir(g);
        const areas = sug === CARP_EQ ? analizar(g.files, g.base) : null;
        const det = areas ? `<div class="muted" style="font-size:.8rem">${Object.keys(areas).length} áreas · ${Object.values(areas).reduce((s, x) => s + x.size, 0)} equipos</div>` : '';
        return `<tr><td>${h(g.top)}${det}</td><td class="r num">${g.files.length}</td><td><select data-g="${i}" aria-label="Carpeta destino">${opciones(sug)}</select></td></tr>`;
      };
      const cab = '<thead><tr><th>Carpeta del computador</th><th class="r">Archivos</th><th>Guardar en</th></tr></thead>';
      const raizClaves = claves.filter((k) => !grupos[k].sk);
      const hayInv = claves.some((k) => sugerir(grupos[k]) === 'inventarios' && grupos[k].files.some((f) => /\.(pdf|xlsx?|csv)$/i.test(f.name)));
      modal({
        titulo: soloEquipos ? 'Importar áreas y equipos' : `Importar carpeta de ${ent.razon_social}`, size: 'wide',
        cuerpo: `<div class="form"><p class="muted">${files.length} archivos en “${h(raizNombre)}”. Cada carpeta se guardará en la carpeta equivalente del gestor. En “3. Hojas de vida…” se crean automáticamente las áreas y los equipos con sus subcarpetas.${sedes.length ? ` Se encontraron <b>${sedes.length} sedes</b>: cada una crea sus servicios con el nombre de la sede y sus documentos quedan en una subcarpeta con ese nombre.` : ''} Los archivos que ya estén cargados con el mismo nombre no se repiten.</p>
          ${raizClaves.length ? `<div class="imp-sede"><div class="fields">${f.input('sede_raiz', sedes.length ? 'Sede para los equipos sueltos de la raíz' : 'Sede o servicio de esta carpeta', sedeRaizSug, { full: true })}</div>
            <div class="tbl-wrap"><table class="tbl">${cab}<tbody>${raizClaves.map((k) => fila(k, claves.indexOf(k))).join('')}</tbody></table></div></div>` : ''}
          ${sedes.map((s, j) => `<div class="imp-sede"><div class="fields">${f.input(`sede_${j}`, `Sede · carpeta “${s}”`, A.limpiaSede(s), { full: true })}</div>
            <div class="tbl-wrap"><table class="tbl">${cab}<tbody>${claves.filter((k) => grupos[k].sk === s).map((k) => fila(k, claves.indexOf(k))).join('')}</tbody></table></div></div>`).join('')}
          ${hayInv ? `<div class="field full"><label class="checks"><input type="checkbox" name="usarInv" data-single checked> Crear los servicios y sus equipos a partir del inventario${sedes.length ? ' de cada sede' : ''} (se usa el más reciente de la carpeta de inventarios)</label></div>` : ''}
          <div class="muted" data-prog></div></div>`,
        acciones: [{ t: 'Cancelar' }, { t: `${I.subir} Importar ${files.length} archivos`, cls: 'pri', fn: async (m) => {
          const prog = m.body.querySelector('[data-prog]'); let n = 0, err = 0, rep = 0, nAreas = 0, nEq = 0;
          const val = (i) => m.body.querySelector(`[data-g="${i}"]`).value;
          const sedeRaiz = (m.body.querySelector('[name=sede_raiz]')?.value || '').trim() || 'Sede principal';
          const nomSede = (g) => (g.sk ? (m.body.querySelector(`[name=sede_${sedes.indexOf(g.sk)}]`)?.value || '').trim() || A.limpiaSede(g.sk) : sedeRaiz);
          // 1) Inventarios primero (uno por sede): definen los servicios y los equipos reales
          if (m.body.querySelector('[name=usarInv]')?.checked) {
            for (const [i, k] of claves.entries()) {
              if (val(i) !== 'inventarios') continue;
              const g = grupos[k];
              const cand = g.files.filter((x) => /\.(pdf|xlsx?|csv)$/i.test(x.name)).sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }));
              const inv = cand.filter((x) => /\.(xlsx?|csv)$/i.test(x.name)).pop() || cand.pop();
              if (!inv) continue;
              const sede = nomSede(g);
              try { const r = await A.aplicarInventario(ent, await A.parsearInventario(inv), (t) => { prog.textContent = `Inventario ${sede}: ${t}`; }, { sede }); nAreas += r.nS; nEq += r.nE; }
              catch (e) { toast(`No pude leer el inventario de ${sede} (${e.message}). Se importan los archivos igual.`, true); }
            }
          }
          const consulta = await S.list('consultorios', { entidad_id: ent.id });
          const equipos = await S.list('equipos', { entidad_id: ent.id });
          const ya = new Set((await S.list('documentos', { entidad_id: ent.id })).map((d) => [d.equipo_id || '', d.carpeta, d.subcarpeta || '', d.nombre].join('|')));
          const subir = async (o) => { const key = [o.eqId || '', o.carpeta, o.subcarpeta || '', o.fl.name].join('|'); if (ya.has(key)) { rep++; return; } await subirDoc({ ent, ...o }); ya.add(key); n++; };
          const nombresPor = {};
          files.forEach((fl) => { const p = partes(fl); for (let j = 1; j < p.length - 1; j++) { const key = p.slice(0, j + 1).join('/'); (nombresPor[key] = nombresPor[key] || []).push(fl.name); } });
          const consDeSede = (sede) => consulta.filter((c) => norm(sedeDe(c)) === norm(sede));
          const reales = (sede) => { const ids = new Set(consDeSede(sede).map((c) => c.id)); const unaSede = new Set(consulta.map(sedeDe).map(norm)).size <= 1; return equipos.filter((e) => !A.esCarpetaDoc(e.nombre) && (ids.has(e.consultorio_id) || (!e.consultorio_id && unaSede))); };
          const equipoSuelto = async (rutaCarpeta, nombreCarpeta, archivo, sede) => {
            const cand = A.equipoPorCarpeta(nombreCarpeta, nombresPor[rutaCarpeta] || [], reales(sede));
            const e = (cand.length > 1 && A.equipoPorCodigo(archivo, cand)) || cand[0];
            if (e) return e;
            const nom = A.sinNum(nombreCarpeta) || nombreCarpeta;
            let cod = `${nom.normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'EQ'}-${String(equipos.length + 1).padStart(3, '0')}`;
            while (equipos.some((x) => x.codigo_inv === cod)) cod += '-B';
            const area = await areaDe('SIN SERVICIO', sede);
            const nuevo = await S.insert('equipos', { entidad_id: ent.id, consultorio_id: area.id, nombre: nom.toUpperCase(), codigo_inv: cod, estado: 'Activo', periodicidad_mto: 'Semestral', periodicidad_metro: 'No aplica', hv: {} });
            equipos.push(nuevo); nEq++; return nuevo;
          };
          const areaDe = async (nombreCarpeta, sede) => {
            const nom = A.sinNum(nombreCarpeta) || nombreCarpeta;
            let c = consDeSede(sede).find((x) => norm(x.nombre) === norm(nom));
            if (!c) { c = await S.insert('consultorios', { entidad_id: ent.id, nombre: nom, orden: A.numDe(nombreCarpeta) ?? consDeSede(sede).length + 1, sede }); consulta.push(c); nAreas++; }
            return c;
          };
          const equipoDe = async (area, nombreCarpeta) => {
            const nom = A.sinNum(nombreCarpeta) || nombreCarpeta;
            let e = equipos.find((x) => x.consultorio_id === area.id && norm(x.nombre) === norm(nom));
            if (!e) {
              const pref = (norm(A.sinNum(area.nombre)).replace(/[^a-z]/g, '').slice(0, 3) || 'eq').toUpperCase();
              let k = equipos.filter((x) => String(x.codigo_inv || '').startsWith(pref + '-')).length + 1, cod;
              do { cod = `${pref}-${String(k++).padStart(3, '0')}`; } while (equipos.some((x) => x.codigo_inv === cod));
              e = await S.insert('equipos', { entidad_id: ent.id, consultorio_id: area.id, nombre: nom, codigo_inv: cod, orden: A.numDe(nombreCarpeta), estado: 'Activo', periodicidad_mto: 'Semestral', periodicidad_metro: 'No aplica', hv: {} });
              equipos.push(e); nEq++;
            }
            return e;
          };
          const conSede = (g, sede, sub) => (g.sk || (!sedes.length && norm(sedeRaiz) !== norm('Sede principal')) ? [sede, sub].filter(Boolean).join('/') : sub) || null;
          for (const [i, k] of claves.entries()) {
            const carpeta = val(i); if (!carpeta) continue;
            const g = grupos[k], sede = nomSede(g), base = g.base;
            for (const fl of g.files) {
              try {
                if (fl.size > 50 * 1048576) throw new Error('grande');
                const p = partes(fl);
                if (carpeta === CARP_EQ) {
                  const r = p.slice(base); // [SERVICIO /] EQUIPO / CARPETA DEL EQUIPO / … / archivo
                  const pre = p.slice(0, base).join('/');
                  if (r.length < 2) { await subir({ carpeta: 'archivo', subcarpeta: conSede(g, sede, A.sinNum(g.top) || null), fl }); }
                  else {
                    let eq, docFolder, resto;
                    if (A.esCarpetaDoc(r[1]) || r.length === 2) {
                      eq = await equipoSuelto(`${pre}/${r[0]}`, r[0], fl.name, sede); docFolder = r.length === 2 ? '' : r[1]; resto = r.slice(2, -1);
                    } else {
                      const cand = A.equipoPorCarpeta(r[1], nombresPor[`${pre}/${r[0]}/${r[1]}`] || [], reales(sede));
                      eq = (cand.length > 1 && A.equipoPorCodigo(fl.name, cand)) || cand[0] || await equipoDe(await areaDe(r[0], sede), r[1]);
                      docFolder = r.length > 3 ? r[2] : ''; resto = r.slice(3, -1);
                    }
                    const cEq = A.carpetaDeDoc(docFolder, fl.name) || A.carpetaDeDoc(fl.name, fl.name) || 'hoja_vida';
                    await subir({ eqId: eq.id, carpeta: cEq, subcarpeta: resto.length ? resto.join('/') : null, fl });
                  }
                } else if (carpeta === CORR) {
                  // correctivos sueltos: se asignan al equipo por el código / serie del archivo o por la carpeta
                  const cand = reales(sede), r = p.slice(base, -1);
                  let eq = A.equipoPorCodigo(fl.name, cand);
                  for (let j = r.length - 1; !eq && j >= 0; j--) eq = A.equipoPorCarpeta(r[j], nombresPor[p.slice(0, base + j + 1).join('/')] || [], cand)[0];
                  if (eq) await subir({ eqId: eq.id, carpeta: 'mto_correctivo', subcarpeta: null, fl });
                  else await subir({ carpeta: 'archivo', subcarpeta: conSede(g, sede, [A.sinNum(A.limpiaSede(g.top)), ...r].filter(Boolean).join('/')), fl });
                } else {
                  const sub = g.suelto ? null : p.slice(base, -1).join('/') || null;
                  await subir({ carpeta, subcarpeta: conSede(g, sede, sub), fl });
                }
              } catch (e) { err++; console.error(e); }
              prog.textContent = `Subiendo… ${n + rep + err} de ${files.length}${rep ? ` · ${rep} ya estaban` : ''}${nAreas || nEq ? ` · ${nAreas} áreas y ${nEq} equipos creados` : ''}`;
            }
          }
          toast(`${n} archivos importados${rep ? ` · ${rep} ya estaban cargados` : ''}${nEq ? ` · ${nAreas} áreas y ${nEq} equipos creados` : ''}${err ? ` · ${err} con error` : ''}`, !!err); A.recargar();
        } }],
      });
    };
    inp.click();
  };

  // ---------------------------------------------------------------- carpetas por entidad
  // Cada entidad puede quitar las carpetas que no necesita (de la entidad y de cada equipo).
  // Se guardan en entidades.config = { ocultas_ent: [...], ocultas_eq: [...] }.
  // Quitar una carpeta NO borra sus archivos: quedan guardados y vuelven si se activa de nuevo.
  const OBLIG = new Set(['equipos', 'hoja_vida']); // sin estas no funciona la estructura
  A.ocultas = (ent, tipo) => new Set((ent?.config || {})[tipo === 'eq' ? 'ocultas_eq' : 'ocultas_ent'] || []);
  // carpetas ocultas de un equipo: las quitadas para toda la entidad + las quitadas solo en ese equipo (equipos.hv.ocultas)
  A.ocultasEq = (ent, eq) => new Set([...A.ocultas(ent, 'eq'), ...((eq?.hv || {}).ocultas || [])]);
  // Nombre de una carpeta para una entidad (puede haberse cambiado en entidades.config.nombres_ent / nombres_eq)
  // carpetas creadas por el propietario: de la entidad (config.carpetas_ent_extra), de todos los equipos (config.carpetas_eq_extra) y de un solo equipo (hv.carpetas_extra)
  A.carpetasEnt = (ent) => [...CAT.CARPETAS_ENTIDAD, ...((ent?.config || {}).carpetas_ent_extra || []).map((c) => ({ g: 'Estructura documental', ...c, extra: 'ent' }))];
  A.carpetasEq = (ent, eq = null) => [...CAT.CARPETAS_EQUIPO, ...((ent?.config || {}).carpetas_eq_extra || []).map((c) => ({ ...c, extra: 'todos' })), ...((eq?.hv || {}).carpetas_extra || []).map((c) => ({ ...c, extra: 'equipo' }))];
  A.nuevaCarpeta = (ent, eq = null) => modal({
    titulo: eq ? `Nueva carpeta · ${eq.codigo_inv || eq.nombre}` : `Nueva carpeta · ${ent.razon_social}`, size: 'sm',
    cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('nombre', 'Nombre y número de la carpeta *', '', { full: true, attrs: `placeholder="${eq ? 'Ej: 11. GUÍA RÁPIDA DE USO' : 'Ej: 18. PLAN DE CONTINGENCIA'}"` })}</div>
      ${eq ? '<label class="checks"><input type="checkbox" name="todos" data-single> <span>Crear esta carpeta en <b>todos los equipos</b> de la entidad (si no la marca, solo se crea en este equipo)</span></label>' : '<p class="muted" style="font-size:.85rem">La carpeta se crea en la carpeta digital de esta entidad. Puede subir archivos y crear subcarpetas dentro.</p>'}</form>`,
    acciones: [{ t: 'Cancelar' }, { t: 'Crear carpeta', cls: 'pri', fn: async (m) => {
      const d = leer(m.body); const n = String(d.nombre || '').replace(/\s+/g, ' ').trim().toUpperCase();
      if (!n) { toast('Escriba el nombre de la carpeta', true); return false; }
      const nueva = { k: 'x_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), n };
      if (eq && !d.todos) {
        const act = await S.get('equipos', eq.id);
        await S.update('equipos', eq.id, { hv: { ...(act.hv || {}), carpetas_extra: [...((act.hv || {}).carpetas_extra || []), nueva] } });
        S.log('EDITAR', 'equipos', eq.id, `Nueva carpeta «${n}» (solo ${eq.codigo_inv || eq.nombre})`);
      } else {
        const fresca = await S.get('entidades', ent.id); const cfg = { ...(fresca.config || {}) }; const key = eq ? 'carpetas_eq_extra' : 'carpetas_ent_extra';
        cfg[key] = [...(cfg[key] || []), nueva]; if (!(await guardarConfig(fresca, cfg))) return false;
        S.log('EDITAR', 'entidades', ent.id, `Nueva carpeta «${n}»${eq ? ' en todos los equipos' : ''}`);
      }
      toast(`Carpeta «${n}» creada`); A.recargar();
    } }],
  });
  // nombre de carpeta: 1) el propio del equipo (hv.nombres_carpetas), 2) el de la entidad, 3) el original
  A.nomCarpeta = (ent, tipo, k, eq = null) => { const pe = tipo === 'eq' ? eq?.hv?.nombres_carpetas?.[k] : null; if (pe) return pe; const n = ((ent?.config || {})[tipo === 'eq' ? 'nombres_eq' : 'nombres_ent'] || {})[k]; return n || ((tipo === 'eq' ? A.carpetasEq(ent, eq) : A.carpetasEnt(ent)).find((c) => c.k === k)?.n || k); };
  A.tarjetaCarpeta = (c, sub, tipo, ent, eq = null) => { const nom = A.nomCarpeta(ent, tipo, c.k, eq); return `<div class="folder-w"><button class="folder" data-act="carpeta" data-k="${c.k}"><span class="ic"></span><b>${h(nom)}</b><small>${sub}</small></button>${esProp() ? `<div class="folder-tools"><button class="folder-x" data-act="renCarp" data-tipo="${tipo}" data-k="${c.k}" title="Cambiar el nombre de esta carpeta" aria-label="Cambiar nombre de ${h(nom)}">${I.edit}</button>${!OBLIG.has(c.k) ? `<button class="folder-x del" data-act="quitarCarp" data-tipo="${tipo}" data-k="${c.k}" title="Quitar esta carpeta para esta entidad" aria-label="Quitar carpeta ${h(nom)}">${I.x}</button>` : ''}</div>` : ''}</div>`; };
  // cambio de nombre y número de una carpeta SOLO en este equipo (no afecta a los demás)
  function renombrarCarpetaEquipo(ent, eq, c) {
    const actual = A.nomCarpeta(ent, 'eq', c.k, eq);
    const deEnt = A.nomCarpeta(ent, 'eq', c.k);
    modal({
      titulo: `Cambiar nombre de la carpeta · ${eq.codigo_inv || eq.nombre}`, size: 'sm',
      cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('nombre', 'Nombre y número de la carpeta', actual, { full: true })}</div>
        <p class="muted" style="font-size:.85rem">Nombre general: <b>${h(deEnt)}</b>. El cambio aplica <b>solo a este equipo</b> (${h(eq.codigo_inv || '')} ${h(eq.nombre || '')}); los demás equipos no cambian. Los archivos no se mueven.</p>
        <label class="checks"><input type="checkbox" name="todos" data-single> <span>Aplicar este nombre a <b>todos los equipos</b> de la entidad</span></label></form>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Nombre general', fn: async () => guardar('') }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
        const d = leer(m.body); const v = d.nombre.replace(/\s+/g, ' ').trim(); if (!v) { toast('Escriba el nombre', true); return false; }
        if (d.todos) {
          const cfg = { ...(ent.config || {}) }; const mp = { ...(cfg.nombres_eq || {}) }; if (v === c.n) delete mp[c.k]; else mp[c.k] = v; cfg.nombres_eq = mp;
          if (!(await guardarConfig(ent, cfg))) return false;
          const act = await S.get('equipos', eq.id); const nc = { ...(act.hv?.nombres_carpetas || {}) }; delete nc[c.k];
          await S.update('equipos', eq.id, { hv: { ...(act.hv || {}), nombres_carpetas: nc } });
          S.log('EDITAR', 'entidades', ent.id, `Carpeta ${c.n} → ${v} (todos los equipos)`); toast(`Carpeta renombrada a “${v}” en todos los equipos`); A.recargar(); return;
        }
        return guardar(v === deEnt ? '' : v);
      } }],
    });
    async function guardar(nombre) {
      const act = await S.get('equipos', eq.id); const nc = { ...(act.hv?.nombres_carpetas || {}) };
      if (nombre) nc[c.k] = nombre; else delete nc[c.k];
      await S.update('equipos', eq.id, { hv: { ...(act.hv || {}), nombres_carpetas: nc } });
      S.log('EDITAR', 'equipos', eq.id, `Carpeta ${c.n} → ${nombre || deEnt} (solo ${eq.codigo_inv || eq.nombre})`);
      toast(nombre ? `Carpeta renombrada a “${nombre}” solo en este equipo` : 'Se restauró el nombre general'); A.recargar();
    }
  }
  A.renombrarCarpeta = (ent, tipo, k, eq = null) => {
    const cat = tipo === 'eq' ? A.carpetasEq(ent, eq) : A.carpetasEnt(ent), c = cat.find((x) => x.k === k); if (!c) return;
    if (tipo === 'eq' && eq) return renombrarCarpetaEquipo(ent, eq, c);
    const key = tipo === 'eq' ? 'nombres_eq' : 'nombres_ent', actual = A.nomCarpeta(ent, tipo, k);
    modal({
      titulo: 'Cambiar nombre de la carpeta', size: 'sm',
      cuerpo: `<form class="form" onsubmit="return false"><div class="fields">${f.input('nombre', 'Nombre de la carpeta', actual, { full: true })}</div>
        <p class="muted" style="font-size:.85rem">Nombre original: <b>${h(c.n)}</b>${tipo === 'eq' ? ' · se aplica a la carpeta de todos los equipos de la entidad' : ''}. Los archivos no se mueven.</p>
        <label class="checks"><input type="checkbox" name="todas" data-single> Aplicar este nombre en <b>todas las entidades</b></label></form>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Nombre original', fn: async (m) => { const d = leer(m.body); return aplicar('', d.todas); } }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
        const d = leer(m.body); const v = d.nombre.replace(/\s+/g, ' ').trim(); if (!v) { toast('Escriba el nombre', true); return false; }
        return aplicar(v === c.n ? '' : v, d.todas);
      } }],
    });
    async function aplicar(nombre, todas) {
      const lista = todas ? await S.list('entidades') : [ent];
      for (const e of lista) {
        const cfg = { ...(e.config || {}) }; const mp = { ...(cfg[key] || {}) };
        if (nombre) mp[k] = nombre; else delete mp[k];
        cfg[key] = mp; if (!(await guardarConfig(e, cfg))) return false;
      }
      S.log('EDITAR', 'entidades', ent.id, `Carpeta ${c.n} → ${nombre || c.n}${todas ? ' (todas las entidades)' : ''}`);
      toast(nombre ? `Carpeta renombrada a “${nombre}”${todas ? ' en todas las entidades' : ''}` : 'Se restauró el nombre original'); A.recargar();
    }
  };
  const guardarConfig = async (ent, config) => {
    try { const u = await S.update('entidades', ent.id, { config }); ent.config = u?.config || config; return true; }
    catch (e) {
      if (/config/i.test(e.message)) { toast('Falta activar esta función en la base de datos (columna "config" de entidades). Pídale a Claude que la active.', true); return false; }
      throw e;
    }
  };
  A.guardarConfig = (ent, config) => guardarConfig(ent, config);
  A.quitarCarpeta = async (ent, tipo, k, nArch, eq = null) => {
    const cat = tipo === 'eq' ? A.carpetasEq(ent, eq) : A.carpetasEnt(ent), c0 = cat.find((x) => x.k === k); if (!c0) return;
    const c = { ...c0, n: A.nomCarpeta(ent, tipo, k, eq) };
    if (tipo === 'eq' && eq) return quitarCarpetaEquipo(ent, eq, k, c.n, nArch);
    const extra = nArch ? ` Tiene ${nArch} archivo${nArch === 1 ? '' : 's'}: no se borran, quedan guardados y vuelven a aparecer si activa la carpeta otra vez.` : '';
    const donde = tipo === 'eq' ? 'de TODOS los equipos de' : 'de la carpeta de';
    if (!(await confirmar(`¿Quitar “${c.n}” ${donde} ${ent.razon_social}? El cliente tampoco la verá.${extra} Puede volver a mostrarla con el botón “Carpetas” de la entidad.`, 'Quitar carpeta'))) return;
    const cfg = { ...(ent.config || {}) }, key = tipo === 'eq' ? 'ocultas_eq' : 'ocultas_ent';
    cfg[key] = [...new Set([...(cfg[key] || []), k])];
    if (await guardarConfig(ent, cfg)) { S.log('EDITAR', 'entidades', ent.id, `Quitó la carpeta ${c.n}`); toast(`Carpeta “${c.n}” quitada`); A.recargar(); }
  };
  // quitar una carpeta desde un equipo: solo ese equipo, los equipos que no la requieren, o todos
  const quitarCarpetaEquipo = (ent, eq, k, nom, nArch) => {
    const metro = k === 'metrologia';
    modal({ titulo: `Quitar la carpeta “${nom}”`, size: 'sm',
      cuerpo: `<form class="form" onsubmit="return false"><p class="muted">Quitar una carpeta no borra sus archivos${nArch ? ` (este equipo tiene ${nArch})` : ''}: quedan guardados y vuelven a aparecer si la muestra otra vez. El cliente tampoco la verá.</p>
        <label class="checks full radio-line"><input type="radio" name="alcance" value="uno" checked> Solo en este equipo (${h(eq.codigo_inv || '')} ${h(eq.nombre || '')})</label>
        <label class="checks full radio-line"><input type="radio" name="alcance" value="noreq"> En los equipos de ${h(ent.razon_social)} que no la requieren ${metro ? '(los que no llevan calibración)' : '(los que no tienen archivos en esa carpeta)'}</label>
        <label class="checks full radio-line"><input type="radio" name="alcance" value="todos"> En TODOS los equipos de ${h(ent.razon_social)}</label></form>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Quitar carpeta', cls: 'pri danger', fn: async (m) => {
        const al = leer(m.body).alcance;
        if (al === 'todos') {
          const cfg = { ...(ent.config || {}) }; cfg.ocultas_eq = [...new Set([...(cfg.ocultas_eq || []), k])];
          if (!(await guardarConfig(ent, cfg))) return false;
          S.log('EDITAR', 'entidades', ent.id, `Quitó la carpeta ${nom} de todos los equipos`); toast(`Carpeta “${nom}” quitada de todos los equipos`); return A.recargar();
        }
        let lista = [eq];
        if (al === 'noreq') {
          const eqs = await S.list('equipos', { entidad_id: ent.id });
          const docs = metro ? [] : (await S.list('documentos', { entidad_id: ent.id })).filter((d) => d.equipo_id && d.carpeta === k);
          lista = eqs.filter((e) => (metro ? !(A.aplicaCalibracion ? A.aplicaCalibracion(e) : (e.periodicidad_metro && e.periodicidad_metro !== 'No aplica')) : !docs.some((d) => d.equipo_id === e.id)));
        }
        for (const e of lista) { const hv = { ...(e.hv || {}) }; hv.ocultas = [...new Set([...(hv.ocultas || []), k])]; await S.update('equipos', e.id, { hv }); }
        S.log('EDITAR', 'equipos', eq.id, `Quitó la carpeta ${nom} en ${lista.length} equipo(s)`);
        toast(`Carpeta “${nom}” quitada en ${lista.length} equipo${lista.length === 1 ? '' : 's'}`); A.recargar();
      } }] });
  };
  A.configCarpetas = (ent) => {
    const ocE = A.ocultas(ent, 'ent'), ocQ = A.ocultas(ent, 'eq');
    const lista = (cat, oc, tipo) => cat.map((c) => `<label class="checks cfg-carp"><input type="checkbox" name="${tipo}" value="${c.k}" ${oc.has(c.k) ? '' : 'checked'} ${OBLIG.has(c.k) ? 'disabled' : ''}> ${h(A.nomCarpeta(ent, tipo, c.k))}${OBLIG.has(c.k) ? ' <small class="muted">(siempre visible)</small>' : ''}</label>`).join('');
    modal({
      titulo: `Carpetas de ${ent.razon_social}`, size: 'wide',
      cuerpo: `<form class="form" onsubmit="return false"><p class="muted">Marque las carpetas que usa esta entidad. Las que desmarque se quitan para el propietario y para el cliente. Los archivos que tengan <b>no se borran</b>: vuelven a aparecer si marca la carpeta otra vez.</p>
        <div class="cfg-cols"><fieldset><legend>Carpeta de la entidad</legend>${lista(CAT.CARPETAS_ENTIDAD, ocE, 'ent')}</fieldset>
        <fieldset><legend>Carpeta de cada equipo</legend>${lista(CAT.CARPETAS_EQUIPO, ocQ, 'eq')}</fieldset></div></form>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
        const marc = (n) => new Set([...m.body.querySelectorAll(`[name=${n}]:checked`)].map((x) => x.value));
        const vE = marc('ent'), vQ = marc('eq');
        const cfg = { ...(ent.config || {}), ocultas_ent: CAT.CARPETAS_ENTIDAD.filter((c) => !OBLIG.has(c.k) && !vE.has(c.k)).map((c) => c.k), ocultas_eq: CAT.CARPETAS_EQUIPO.filter((c) => !OBLIG.has(c.k) && !vQ.has(c.k)).map((c) => c.k) };
        if (!(await guardarConfig(ent, cfg))) return false;
        S.log('EDITAR', 'entidades', ent.id, `Carpetas: ${cfg.ocultas_ent.length + cfg.ocultas_eq.length} quitadas`);
        toast('Carpetas actualizadas'); A.recargar();
      } }],
    });
  };

  // ---------------------------------------------------------------- eliminar una sede
  // Sus servicios y equipos se pueden pasar a otra sede, o eliminarse con sus documentos.
  A.eliminarSede = (ent, sede, consE, sedesE, eqsT, docsT) => {
    const sedeC = (c) => c.sede || 'Sede principal';
    const consS = consE.filter((c) => sedeC(c) === sede);
    const ids = new Set(consS.map((c) => c.id));
    const eqsS = eqsT.filter((e) => ids.has(e.consultorio_id));
    const docsS = docsT.filter((d) => !d.equipo_id && (d.subcarpeta || '').split('/')[0] === sede);
    const otras = sedesE.filter((x) => x !== sede);
    const vacia = !consS.length && !docsS.length;
    modal({
      titulo: `Eliminar la sede ${sede}`, size: 'sm',
      cuerpo: `<form class="form" onsubmit="return false">
        <p>La sede tiene <b>${consS.length}</b> servicio${consS.length === 1 ? '' : 's'}, <b>${eqsS.length}</b> equipo${eqsS.length === 1 ? '' : 's'} y <b>${docsS.length}</b> archivo${docsS.length === 1 ? '' : 's'} propio${docsS.length === 1 ? '' : 's'}. Los documentos generales de la entidad no se tocan.</p>
        ${vacia ? '' : `<div class="fields">
          ${otras.length ? `<label class="checks full radio-line"><input type="radio" name="modo" value="mover" checked> Pasar sus servicios, equipos y archivos a otra sede</label>${f.sel('destino', 'Sede de destino', otras, otras[0], { full: true })}` : ''}
          <label class="checks full radio-line"><input type="radio" name="modo" value="borrar" ${otras.length ? '' : 'checked'}> Eliminar también sus servicios, equipos y documentos (no se puede deshacer)</label>
          ${f.input('confirma', 'Para eliminar todo escriba ELIMINAR', '', { full: true, attrs: 'autocomplete="off"' })}
        </div>`}</form>`,
      acciones: [{ t: 'Cancelar' }, { t: `${I.del} Eliminar sede`, cls: 'pri danger', fn: async (m) => {
        const d = leer(m.body); const modo = vacia ? 'vacia' : d.modo;
        if (modo === 'borrar' && d.confirma.trim().toUpperCase() !== 'ELIMINAR') { toast('Escriba ELIMINAR para confirmar que se borran los equipos y documentos', true); return false; }
        if (modo === 'mover') {
          const dest = d.destino;
          for (const c of consS) await S.update('consultorios', c.id, { sede: dest });
          for (const x of docsS) await S.update('documentos', x.id, { subcarpeta: [dest, ...(x.subcarpeta || '').split('/').slice(1)].join('/') });
        } else if (modo === 'borrar') {
          const docsEq = (await S.list('documentos', { entidad_id: ent.id })).filter((x) => x.equipo_id && eqsS.some((e) => e.id === x.equipo_id));
          for (const x of [...docsEq, ...docsS]) { try { await S.removeFile(x.archivo); } catch {} }
          for (const x of docsS) await S.remove('documentos', x.id);
          for (const e of eqsS) await S.remove('equipos', e.id);
          for (const c of consS) await S.remove('consultorios', c.id);
        }
        const cfg = { ...(ent.config || {}), sedes: (ent.config?.sedes || []).filter((x) => x !== sede) };
        try { await S.update('entidades', ent.id, { config: cfg }); ent.config = cfg; } catch {}
        S.log('ELIMINAR', 'entidades', ent.id, `Sede ${sede} eliminada${modo === 'mover' ? ' (pasada a ' + d.destino + ')' : modo === 'borrar' ? ` con ${eqsS.length} equipos` : ''}`);
        toast(`Sede “${sede}” eliminada`); go('entidad', { id: ent.id });
      } }],
    });
  };

  // ---------------------------------------------------------------- editar nombre y datos básicos de un equipo
  A.editarEquipoRapido = (e, cons = []) => {
    const lista = A.ordenar(cons);
    const sedes = new Set(lista.map((c) => c.sede || 'Sede principal'));
    modal({
      titulo: `Editar equipo · ${e.codigo_inv || ''}`, size: 'sm',
      cuerpo: `<form class="form" onsubmit="return false"><div class="fields">
        ${f.input('nombre', 'Nombre del equipo *', e.nombre || '', { full: true })}
        ${f.input('codigo_inv', 'Código de inventario *', e.codigo_inv || '')}${f.input('activo_fijo', 'N° activo fijo', e.activo_fijo || '')}
        ${f.input('marca', 'Marca', e.marca || '')}${f.input('modelo', 'Modelo', e.modelo || '')}
        ${f.input('serie', 'Serie', e.serie || '')}${f.input('ubicacion', 'Ubicación', e.ubicacion || '')}
        ${f.sel('consultorio_id', 'Servicio o consultorio', [['', '— Sin servicio —'], ...lista.map((c) => [c.id, sedes.size > 1 ? `${c.sede || 'Sede principal'} · ${c.nombre}` : c.nombre])], e.consultorio_id || '', { full: true })}
        </div><p class="muted" style="font-size:.85rem">El cambio se ve en el inventario, los cronogramas, la hoja de vida y los reportes.</p></form>`,
      acciones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: async (m) => {
        const d = leer(m.body);
        if (!d.nombre || !d.codigo_inv) { toast('El nombre y el código no pueden quedar vacíos', true); return false; }
        const cambios = { nombre: d.nombre, codigo_inv: d.codigo_inv, activo_fijo: d.activo_fijo || null, marca: d.marca || null, modelo: d.modelo || null, serie: d.serie || null, ubicacion: d.ubicacion || null, consultorio_id: d.consultorio_id || null };
        try { await S.update('equipos', e.id, cambios); }
        catch (er) { toast(/duplicate|unique/i.test(er.message) ? 'Ya existe otro equipo con ese código de inventario' : er.message, true); return false; }
        S.log('EDITAR', 'equipos', e.id, `${e.nombre} → ${d.nombre}`);
        toast('Equipo actualizado'); A.recargar();
      } }],
    });
  };

  A.G = {};
  return A;
})();
