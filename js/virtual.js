// =====================================================================
//  CAPACITACIÓN VIRTUAL POR GOOGLE MEET
//  · Programar la reunión desde el gestor (Google Calendar con videollamada de Meet, o «Crear reunión ahora»)
//  · El gestor solo guarda el ENLACE (no guarda video: no ocupa almacenamiento)
//  · Invitación por WhatsApp / correo con el enlace de Meet + el enlace del pre / post test
//  · El enlace del test (test.html) muestra el botón «Entrar a Google Meet»
//  · Fotos de evidencia: capturas de la pantalla de la reunión (manual o automática cada N minutos),
//    reducidas a JPEG (~150 KB) y guardadas en la carpeta de capacitaciones y en la sesión
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, toast, modal, f, leer } = UI;
  const MEET_RE = /(?:https?:\/\/)?meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i;
  A.meetCodigo = (u) => ((String(u || '').match(MEET_RE) || [])[1] || '').toLowerCase();
  A.meetUrl = (u) => { const c = A.meetCodigo(u); return c ? `https://meet.google.com/${c}` : ''; };
  // enlace del test con el botón de Meet (parámetro m = código de la reunión)
  A.urlTestMeet = (tk, meet) => { const base = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}test.html?t=${encodeURIComponent(tk)}`; const c = A.meetCodigo(meet); return c ? `${base}&m=${c}` : base; };
  const ICO_MEET = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 10l6-4v12l-6-4z"/></svg>';
  A.ICO_MEET = ICO_MEET;
  const fLarga = (s) => (s ? new Date(s + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '');
  const slug = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(0, 60);
  const reducir = (canvas) => new Promise((res, rej) => { const k = Math.min(1, 1400 / Math.max(canvas.width, canvas.height)); const c = document.createElement('canvas'); c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k); c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height); c.toBlob((b) => (b ? res(b) : rej(new Error('No se pudo crear la foto'))), 'image/jpeg', 0.75); });

  // ------------------------------------------------------------------ captura de fotos (sigue activa aunque se cierre la ventana)
  let cap = null; // { stream, video, s, ent, tb, carpeta, subcarpeta, base, timer, n, bar }
  const pintarBarra = () => {
    if (!cap) { document.getElementById('vir-barra')?.remove(); return; }
    let b = document.getElementById('vir-barra');
    if (!b) { b = document.createElement('div'); b.id = 'vir-barra'; b.className = 'vir-barra'; document.body.appendChild(b); }
    b.innerHTML = `<span class="vir-rec"></span><b>Fotos de evidencia</b><span>${cap.n} tomada${cap.n === 1 ? '' : 's'}${cap.cada ? ` · automática cada ${cap.cada} min` : ''}</span><button type="button" class="btn sm pri" data-vir="foto">📷 Tomar foto</button><button type="button" class="btn sm" data-vir="parar">Detener</button>`;
    b.onclick = (e) => { const x = e.target.closest('[data-vir]'); if (!x) return; if (x.dataset.vir === 'foto') A.virFoto(); else A.virParar(); };
  };
  // una foto a la vez (la automática y la manual no se pisan) y solo se registra si el archivo quedó guardado
  let colaFoto = Promise.resolve();
  const existe = async (path) => { try { if (S.r2Existe) return await S.r2Existe(path); } catch (e) { /* se verifica descargando */ } try { const b = await S.fileBlob(path); return !!(b && b.size); } catch (e) { return false; } };
  A.virFoto = () => (colaFoto = colaFoto.then(tomarFoto, tomarFoto));
  const tomarFoto = async () => {
    if (!cap) return;
    try {
      const v = cap.video; if (!v.videoWidth) { await new Promise((r) => setTimeout(r, 400)); if (!v.videoWidth) throw new Error('La pantalla aún no está lista'); }
      const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
      const b = await reducir(c); const s = cap.s;
      const neg = await new Promise((r) => { try { const k = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let sum = 0, n = 0; for (let i = 0; i < k.length; i += 4 * 997) { sum += k[i] + k[i + 1] + k[i + 2]; n++; } r(n && sum / n < 6); } catch (e) { r(false); } });
      if (neg) throw new Error('la pantalla capturada está en negro; no se guardó');
      const fresco = await S.get(cap.tb, s.id).catch(() => null); const d = fresco?.datos || s.datos || {};
      const ahora = new Date(), hh = `${String(ahora.getHours()).padStart(2, '0')}-${String(ahora.getMinutes()).padStart(2, '0')}`;
      const nombre = `Evidencia virtual ${cap.base} ${UI.hoy()} ${hh} (${(d.fotos || []).length + 1}).jpg`;
      const path = `${cap.ent.id}/general/${cap.carpeta}/${Date.now()}-${slug(nombre)}.jpg`;
      await S.upload(path, b);
      if (!(await existe(path))) { await S.upload(path, b); if (!(await existe(path))) throw new Error('el archivo no quedó guardado; intente de nuevo'); }
      await S.insert('documentos', { entidad_id: cap.ent.id, equipo_id: null, carpeta: cap.carpeta, subcarpeta: cap.subcarpeta, nombre, archivo: path, mime: 'image/jpeg', tamano: b.size, fecha_documento: UI.hoy(), visible_cliente: true, firmado: false });
      const nd = { ...d, fotos: [...(d.fotos || []), { archivo: path, nombre, virtual: true }] };
      await S.update(cap.tb, s.id, { datos: nd }); s.datos = nd; cap.n++; pintarBarra(); toast(`Foto de evidencia guardada (${Math.round(b.size / 1024)} KB)`);
    } catch (er) { toast('No se pudo tomar la foto: ' + er.message, true); }
  };
  A.virParar = () => { if (!cap) return; clearInterval(cap.timer); cap.stream.getTracks().forEach((t) => t.stop()); const n = cap.n; cap = null; pintarBarra(); toast(`Captura detenida · ${n} foto${n === 1 ? '' : 's'} de evidencia`); };
  A.virIniciar = async (ctx, cada = 0) => {
    if (!navigator.mediaDevices?.getDisplayMedia) return toast('Este navegador no permite capturar la pantalla. Use Chrome o Edge en el computador.', true);
    if (cap) A.virParar();
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser', frameRate: 2 }, audio: false, selfBrowserSurface: 'exclude', preferCurrentTab: false });
      const video = document.createElement('video'); video.muted = true; video.playsInline = true; video.srcObject = stream; await video.play();
      cap = { ...ctx, stream, video, n: 0, cada };
      stream.getVideoTracks()[0].addEventListener('ended', () => { if (cap?.stream === stream) A.virParar(); });
      if (cada) cap.timer = setInterval(() => A.virFoto(), cada * 60000);
      pintarBarra(); toast('Captura activa: elija «Tomar foto» en los momentos clave' + (cada ? ` (y se toma una sola cada ${cada} min)` : ''));
      setTimeout(() => A.virFoto(), 1500);
    } catch (er) { if (er.name !== 'NotAllowedError') toast('No se pudo iniciar la captura: ' + er.message, true); }
  };

  // ------------------------------------------------------------------ ventana de la capacitación virtual
  // ctx: { ent, s, tb, carpeta, subcarpeta, tema, testUrl(s) → url del test o '', abrirTest() → abre la ventana del enlace del test }
  A.capVirtual = (ctx) => {
    const { ent, s } = ctx; const d = s.datos || {}, v = d.virtual || {};
    const tema = ctx.tema || d.tema || d.equipo || 'Capacitación';
    const hora = v.hora || '08:00', dur = v.duracion || 60;
    const texto = (meet, fecha, hh, du, capa) => {
      const tu = ctx.testUrl(s, meet);
      return [`${ent.razon_social} · Capacitación virtual: ${tema}`, `Fecha: ${fLarga(fecha)}${hh ? ' · ' + hh : ''}${du ? ` (${du} min)` : ''}`,
        tu ? `1) Antes de iniciar responda el PRE-TEST (no necesita usuario): ${tu}` : '', meet ? `${tu ? '2' : '1'}) Únase por Google Meet: ${meet}` : '',
        tu ? `${meet ? '3' : '2'}) Al terminar responda el POST-TEST en el mismo enlace del test.` : '', `Capacitador: ${(capa ?? d.capacitador ?? '').trim() || st.emp?.responsable || 'IBCOL Ingeniería Biomédica'}`].filter(Boolean).join('\n');
    };
    const m = modal({
      titulo: `Capacitación virtual · Google Meet`, size: 'wide',
      cuerpo: `<form class="form" onsubmit="return false">
        <p class="muted" style="font-size:.86rem"><b>${h(tema)}</b> · ${h(ent.razon_social)}. El gestor solo guarda el enlace de la reunión (no guarda video), así que no ocupa almacenamiento. Las fotos de evidencia son capturas livianas (unos 150 KB cada una).</p>
        <fieldset><legend>1. Programar la reunión</legend>
          <div class="fields">${f.input('fecha', 'Fecha', s.fecha || UI.hoy(), { type: 'date' })}${f.input('hora', 'Hora de inicio', hora, { type: 'time' })}${f.sel('duracion', 'Duración', [[30, '30 minutos'], [45, '45 minutos'], [60, '1 hora'], [90, '1 hora 30 min'], [120, '2 horas']], dur)}${f.input('capacitador', 'Capacitador(a)', d.capacitador || st.emp?.responsable || '', { attrs: 'placeholder="Nombre de quien dicta la capacitación"' })}</div>
          <div class="actions" style="margin-top:6px"><button type="button" class="btn pri" data-vx="cal">📅 Programar en Google Calendar</button><button type="button" class="btn" data-vx="nueva">${ICO_MEET} Crear reunión ahora</button></div>
          <p class="muted" style="font-size:.8rem;margin:6px 0">En Google Calendar revise que diga «Unirse con Google Meet» (si no, pulse «Agregar videoconferencia de Google Meet»), guarde y copie el enlace de la reunión aquí. Con la cuenta gratuita de Google las reuniones de 3 o más personas duran máximo 60 minutos.</p>
          <div class="fields">${f.input('meet', 'Enlace de Google Meet', v.meet || '', { full: true, attrs: 'placeholder="https://meet.google.com/abc-defg-hij" inputmode="url"' })}</div>
        </fieldset>
        <fieldset><legend>2. Enviar la invitación (Meet + pre y post test)</legend>
          <div data-vx-test></div>
          <div class="actions" style="margin-top:6px"><button type="button" class="btn" data-vx="wa">WhatsApp</button><button type="button" class="btn" data-vx="mail">Correo</button><button type="button" class="btn" data-vx="copiar">Copiar mensaje</button></div>
          <textarea data-vx-msg rows="6" style="width:100%;margin-top:6px;font-size:.85rem" aria-label="Mensaje de invitación"></textarea>
        </fieldset>
        <fieldset><legend>3. Durante la capacitación: fotos de evidencia</legend>
          <p class="muted" style="font-size:.82rem;margin:0 0 6px">Abra la reunión en otra pestaña, pulse «Iniciar fotos» y elija la pestaña de Google Meet. Puede tomar fotos cuando quiera (barra abajo a la derecha) o dejar que se tomen solas. Las fotos quedan en el acta de la capacitación y en la carpeta de capacitaciones.</p>
          <div class="fields">${f.sel('cada', 'Fotos automáticas', [[0, 'No (solo cuando yo pulse)'], [5, 'Cada 5 minutos'], [10, 'Cada 10 minutos'], [15, 'Cada 15 minutos'], [20, 'Cada 20 minutos']], v.cada ?? 10)}</div>
          <div class="actions"><button type="button" class="btn" data-vx="unirse">${ICO_MEET} Unirse a la reunión</button><button type="button" class="btn pri" data-vx="fotos">📷 Iniciar fotos de evidencia</button></div>
          <p class="muted" data-vx-nf style="font-size:.82rem"></p>
        </fieldset>
        <fieldset><legend>4. Después (opcional)</legend><div class="fields">${f.input('grabacion', 'Enlace de la grabación (Drive o YouTube)', v.grabacion || '', { full: true, attrs: 'placeholder="https://…"' })}</div></fieldset>
      </form>`,
      alAbrir: (mm) => {
        const g = (n) => mm.body.querySelector(`[name=${n}]`);
        const meetV = () => A.meetUrl(g('meet').value);
        const pintar = () => {
          const tu = ctx.testUrl(s, meetV());
          mm.body.querySelector('[data-vx-test]').innerHTML = tu ? `<p style="font-size:.85rem;margin:0">Enlace del pre / post test: <a href="${h(tu)}" target="_blank" rel="noopener">${h(tu)}</a> <span class="muted">(al abrirlo también aparece el botón «Entrar a Google Meet»)</span></p>`
            : `<p class="muted" style="font-size:.85rem;margin:0">Aún no hay enlace del pre / post test. <button type="button" class="btn sm" data-vx="test">Crear enlace del test</button></p>`;
          mm.body.querySelector('[data-vx-msg]').value = texto(meetV(), g('fecha').value, g('hora').value, g('duracion').value, g('capacitador').value);
          const nf = (s.datos?.fotos || []).filter((x) => x.virtual).length;
          mm.body.querySelector('[data-vx-nf]').textContent = nf ? `${nf} foto${nf === 1 ? '' : 's'} de evidencia virtual guardada${nf === 1 ? '' : 's'}.` : '';
        };
        pintar(); mm.body.addEventListener('input', pintar); mm.body.addEventListener('change', pintar);
        mm.body.addEventListener('click', async (e) => {
          const b = e.target.closest('[data-vx]'); if (!b) return; const k = b.dataset.vx;
          if (k === 'cal') {
            const fe = g('fecha').value || UI.hoy(), [hh, mi] = (g('hora').value || '08:00').split(':').map(Number), du = +g('duracion').value || 60;
            const ini = new Date(`${fe}T00:00:00`); ini.setHours(hh, mi); const fin = new Date(ini.getTime() + du * 60000);
            const fx = (x) => `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, '0')}${String(x.getDate()).padStart(2, '0')}T${String(x.getHours()).padStart(2, '0')}${String(x.getMinutes()).padStart(2, '0')}00`;
            const det = `${texto('', fe, g('hora').value, du, g('capacitador').value)}\n\nCapacitación del programa de ${ent.razon_social}. La asistencia queda registrada con el pre y post test.`;
            window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Capacitación: ${tema} · ${ent.razon_social}`)}&dates=${fx(ini)}/${fx(fin)}&ctz=America/Bogota&details=${encodeURIComponent(det)}&vcon=meet`, '_blank', 'noopener');
          }
          if (k === 'nueva') window.open('https://meet.google.com/new', '_blank', 'noopener');
          if (k === 'unirse') { const u = meetV(); if (!u) return toast('Pegue primero el enlace de Google Meet', true); window.open(u, '_blank', 'noopener'); }
          if (k === 'test') { m.cerrar(); return ctx.abrirTest(); }
          const msg = mm.body.querySelector('[data-vx-msg]').value;
          if (k === 'wa') window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
          if (k === 'mail') location.href = `mailto:?subject=${encodeURIComponent('Capacitación virtual · ' + tema)}&body=${encodeURIComponent(msg)}`;
          if (k === 'copiar') { try { await navigator.clipboard.writeText(msg); toast('Mensaje copiado'); } catch { toast('No se pudo copiar', true); } }
          if (k === 'fotos') { await guardar(mm, false); A.virIniciar({ ent, s, tb: ctx.tb, carpeta: ctx.carpeta, subcarpeta: ctx.subcarpeta, base: tema }, +g('cada').value || 0); }
        });
      },
      acciones: [{ t: 'Cerrar' }, { t: 'Guardar', cls: 'pri', fn: (mm) => guardar(mm, true) }],
    });
    async function guardar(mm, cerrar) {
      const x = leer(mm.body); const meet = A.meetUrl(x.meet);
      if (x.meet && !meet) { toast('El enlace de Google Meet no es válido (debe ser como https://meet.google.com/abc-defg-hij)', true); return false; }
      const nd = { ...(s.datos || {}), modalidad: meet ? 'Virtual (Google Meet)' : (s.datos?.modalidad || ''), lugar: meet && !s.datos?.lugar ? 'Google Meet' : (s.datos?.lugar || ''), capacitador: (x.capacitador || '').trim() || s.datos?.capacitador || '', virtual: { meet, hora: x.hora, duracion: +x.duracion || 60, cada: +x.cada || 0, grabacion: (x.grabacion || '').trim() } };
      const cambios = { datos: nd }; if (x.fecha && x.fecha !== s.fecha) cambios.fecha = x.fecha;
      await S.update(ctx.tb, s.id, cambios); s.datos = nd; if (cambios.fecha) s.fecha = cambios.fecha;
      if (cerrar) { toast('Capacitación virtual guardada'); A.recargar(); } return cerrar ? undefined : false;
    }
    return m;
  };
})();
