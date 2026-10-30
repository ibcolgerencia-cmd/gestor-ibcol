// =====================================================================
//  Componentes de interfaz: modales, visor PDF, firma, utilidades
// =====================================================================
window.UI = (() => {
  const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    panel: ic('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
    ent: ic('<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10"/><path d="M9 7h2M9 11h2M9 15h2M3 21h18"/>'),
    plata: ic('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/>'),
    users: ic('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>'),
    fmt: ic('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
    audit: ic('<path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/>'),
    emp: ic('<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/>'),
    salir: ic('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/>'),
    menu: ic('<path d="M3 6h18M3 12h18M3 18h18"/>'),
    mas: ic('<path d="M12 5v14M5 12h14"/>'),
    subir: ic('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
    bajar: ic('<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
    ver: ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    edit: ic('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
    del: ic('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    firma: ic('<path d="M3 17c3-4 5-11 7-11s-1 9 1 9 3-4 4-4 0 4 2 4 3-2 4-2"/><path d="M3 21h18"/>'),
    pdf: ic('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 15h1.5a1.5 1.5 0 0 0 0-3H8v5M13 12v5h1a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2z"/>'),
    ojo: ic('<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.9 9.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/>'),
    excel: ic('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8l8 8M16 8l-8 8"/>'),
    x: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
    carpeta: ic('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    llave: ic('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>'),
    on: ic('<path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>'),
    cal: ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    alerta: ic('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>'),
    wa: ic('<path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.3z"/><path d="M9 8.5c0 3.5 2.6 6.5 6.5 6.5l1-1.6-2-1-1 1c-1.4-.6-2.4-1.6-3-3l1-1-1-2z"/>'),
    mail: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6 8.5-6"/>'),
    ia: ic('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
    luna: ic('<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>'),
  };

  function toast(msg, bad) {
    let c = document.querySelector('.toasts'); if (!c) { c = document.createElement('div'); c.className = 'toasts'; document.body.appendChild(c); }
    const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg; t.setAttribute('role', 'status');
    c.appendChild(t); setTimeout(() => t.remove(), bad ? 6000 : 3200);
  }

  function modal({ titulo, cuerpo, size = '', acciones = [], alAbrir }) {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${h(titulo)}">
      <header><h2>${h(titulo)}</h2><button class="icon-btn" data-x aria-label="Cerrar">${I.x}</button></header>
      <div class="body">${cuerpo}</div>
      ${acciones.length ? `<footer>${acciones.map((a, i) => `<button class="btn ${a.cls || ''}" data-a="${i}">${a.t}</button>`).join('')}</footer>` : ''}
    </div>`;
    document.body.appendChild(bg);
    const m = { el: bg.querySelector('.modal'), body: bg.querySelector('.body'), cerrar: () => { bg.remove(); document.removeEventListener('keydown', esc); } };
    const esc = (e) => { if (e.key === 'Escape' && [...document.querySelectorAll('.modal-bg')].pop() === bg) { e.stopImmediatePropagation(); m.cerrar(); } };
    document.addEventListener('keydown', esc);
    bg.addEventListener('mousedown', (e) => { if (e.target === bg) m.cerrar(); });
    bg.querySelector('[data-x]').onclick = m.cerrar;
    bg.querySelectorAll('[data-a]').forEach((b) => {
      b.onclick = async () => {
        const a = acciones[+b.dataset.a]; if (!a.fn) return m.cerrar();
        b.disabled = true;
        try { const r = await a.fn(m); if (r !== false) m.cerrar(); } catch (e) { console.error(e); toast(e.message || String(e), true); } finally { b.disabled = false; }
      };
    });
    setTimeout(() => (m.el.querySelector('input,select,textarea') || m.el.querySelector('[data-a]') || m.el).focus?.(), 30);
    if (alAbrir) alAbrir(m);
    return m;
  }

  const confirmar = (msg, si = 'Eliminar') => new Promise((res) => {
    let ok = false;
    const m = modal({ titulo: 'Confirmar', size: 'sm', cuerpo: `<p>${h(msg)}</p>`, acciones: [{ t: 'Cancelar' }, { t: si, cls: 'pri', fn: () => { ok = true; } }] });
    const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); res(ok); } });
    obs.observe(document.body, { childList: true });
  });

  // Lee un formulario: checkbox con mismo nombre => arreglo
  function leer(root) {
    const o = {};
    root.querySelectorAll('[name]').forEach((el) => {
      const n = el.name;
      if (el.type === 'checkbox') {
        if (el.dataset.single !== undefined) { o[n] = el.checked; return; }
        o[n] = o[n] || []; if (el.checked) o[n].push(el.value); return;
      }
      if (el.type === 'radio') { if (el.checked) o[n] = el.value; else if (!(n in o)) o[n] = ''; return; }
      if (el.type === 'file') return;
      o[n] = el.value.trim();
    });
    return o;
  }

  const f = {
    input: (n, l, val = '', o = {}) => `<div class="field ${o.full ? 'full' : ''}"><label for="f_${n}">${l}</label><input id="f_${n}" name="${n}" type="${o.type || 'text'}" value="${h(val)}" ${o.req ? 'required' : ''} ${o.attrs || ''}></div>`,
    sel: (n, l, opts, val = '', o = {}) => `<div class="field ${o.full ? 'full' : ''}"><label for="f_${n}">${l}</label><select id="f_${n}" name="${n}">${opts.map((x) => { const [v, t] = Array.isArray(x) ? x : [x, x]; return `<option value="${h(v)}" ${String(v) === String(val ?? '') ? 'selected' : ''}>${h(t)}</option>`; }).join('')}</select></div>`,
    area: (n, l, val = '', o = {}) => `<div class="field ${o.full === false ? '' : 'full'}"><label for="f_${n}">${l}</label><textarea id="f_${n}" name="${n}" rows="${o.rows || 3}">${h(val)}</textarea></div>`,
    checks: (n, l, opts, vals = []) => `<div class="field full"><span class="lbl">${l}</span><div class="checks">${opts.map((x) => `<label><input type="checkbox" name="${n}" value="${h(x)}" ${(vals || []).includes(x) ? 'checked' : ''}> ${h(x)}</label>`).join('')}</div></div>`,
  };

  function descargar(blob, nombre) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  const aDataURL = (blob) => new Promise((r, j) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.onerror = j; fr.readAsDataURL(blob); });

  // Reduce una imagen (logo/firma) para guardarla como base64 liviano
  async function reducirImagen(file, max = 600, tipo = 'image/png') {
    const url = await aDataURL(file);
    const img = await new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = url; });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    const ctx = c.getContext('2d'); if (tipo === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL(tipo, 0.85);
  }

  // ------------------------------------------------------------ Pad de firma
  function padFirma(canvas) {
    const ctx = canvas.getContext('2d'); let dib = false, usado = false, last = null;
    const ajustar = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width * 2; canvas.height = r.height * 2; ctx.scale(2, 2); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0b2530'; };
    ajustar();
    const pt = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    canvas.onpointerdown = (e) => { dib = true; usado = true; last = pt(e); canvas.setPointerCapture(e.pointerId); };
    canvas.onpointermove = (e) => { if (!dib) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; };
    canvas.onpointerup = canvas.onpointercancel = () => { dib = false; };
    return {
      limpiar: () => { ctx.clearRect(0, 0, canvas.width, canvas.height); usado = false; },
      vacio: () => !usado,
      dataURL: () => {
        // recorta al trazo
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let x0 = canvas.width, y0 = canvas.height, x1 = 0, y1 = 0;
        for (let y = 0; y < canvas.height; y += 2) for (let x = 0; x < canvas.width; x += 2) if (d[(y * canvas.width + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
        if (x1 <= x0) return null;
        const c = document.createElement('canvas'); c.width = x1 - x0 + 20; c.height = y1 - y0 + 20;
        c.getContext('2d').drawImage(canvas, x0 - 10, y0 - 10, c.width, c.height, 0, 0, c.width, c.height);
        return c.toDataURL('image/png');
      },
    };
  }

  // Pide una firma: dibujar o cargar imagen. Devuelve dataURL o null
  function pedirFirma({ titulo = 'Firma', actual = null, nota = '' } = {}) {
    return new Promise((res) => {
      let pad, resultado = undefined;
      const m = modal({
        titulo, size: 'sm',
        cuerpo: `<div class="form">${nota ? `<p class="muted">${h(nota)}</p>` : ''}
          ${actual ? `<div class="field"><span class="lbl">Firma guardada</span><div class="sig-prev"><img src="${actual}" alt="Firma guardada"></div><button class="btn sm" data-usar type="button">Usar firma guardada</button></div>` : ''}
          <div class="field"><span class="lbl">Dibuje la firma con el dedo o el mouse</span><canvas class="sigpad"></canvas></div>
          <div class="actions"><button type="button" class="btn sm" data-limpiar>Limpiar</button>
          <label class="btn sm">${I.subir} Cargar imagen de firma<input type="file" accept="image/*" hidden data-img></label></div></div>`,
        acciones: [{ t: 'Cancelar' }, { t: 'Aceptar firma', cls: 'pri', fn: () => { const d = pad.dataURL(); if (!d) { toast('Dibuje o cargue una firma', true); return false; } resultado = d; } }],
        alAbrir: (mm) => {
          pad = padFirma(mm.body.querySelector('canvas'));
          mm.body.querySelector('[data-limpiar]').onclick = () => pad.limpiar();
          const usar = mm.body.querySelector('[data-usar]'); if (usar) usar.onclick = () => { resultado = actual; mm.cerrar(); };
          mm.body.querySelector('[data-img]').onchange = async (e) => { const fl = e.target.files[0]; if (!fl) return; resultado = await reducirImagen(fl, 600); mm.cerrar(); };
        },
      });
      const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); res(resultado || null); } });
      obs.observe(document.body, { childList: true });
    });
  }

  // ------------------------------------------------------------ Visor PDF (pdf.js)
  async function verPDF({ titulo, blob, nombre, alDescargar, firmar, extras = [], archivo = null, enviar = true }) {
    if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    let modoFirma = false;
    const acciones = [...extras];
    if (firmar) acciones.push({ t: `${I.firma} Firmar`, fn: () => { modoFirma = !modoFirma; m.body.querySelector('.viewer').classList.toggle('signing', modoFirma); if (modoFirma) toast('Toque en la página el lugar donde irá la firma'); return false; } });
    if (enviar && window.APP?.enviarDoc) acciones.push({ t: `${I.mail} Enviar`, fn: () => { window.APP.enviarDoc({ blob, nombre: nombre || `${titulo || 'documento'}.pdf`, archivo }); return false; } });
    acciones.push({ t: `${I.bajar} Descargar`, cls: 'pri', fn: () => { descargar(blob, nombre || 'documento.pdf'); alDescargar?.(); return false; } });
    const m = modal({ titulo, size: 'wide pdfm', cuerpo: `<div class="vz-bar" role="toolbar" aria-label="Zoom del documento">
        <button type="button" class="btn sm" data-z="menos" aria-label="Alejar" title="Alejar (Ctrl -)">−</button>
        <select data-z="nivel" aria-label="Nivel de zoom"><option value="ancho">Ajustar al ancho</option><option value="pagina">Página completa</option>${[50, 75, 100, 125, 150, 200, 300, 400].map((n) => `<option value="${n}">${n} %</option>`).join('')}</select>
        <button type="button" class="btn sm" data-z="mas" aria-label="Acercar" title="Acercar (Ctrl +)">+</button>
        <span class="vz-sp"></span><span class="muted vz-pag" data-z="pag"></span>
        <button type="button" class="btn sm" data-z="full" title="Pantalla completa">⤢ Pantalla completa</button></div>
      <div class="viewer"><div class="loading">Abriendo documento…</div></div>`, acciones });
    const v = m.body.querySelector('.viewer'), sel = m.body.querySelector('[data-z=nivel]'), lblPag = m.body.querySelector('[data-z=pag]');
    m.body.classList.add('vz-body');
    let pdf = null, paginas = [], modo = 'ancho', escala = 1, tRender = null;
    const anchoUtil = () => Math.max(200, v.clientWidth - 28), altoUtil = () => Math.max(200, v.clientHeight - 28);
    // tamaño en pantalla (px CSS) de cada página según el modo de zoom
    const calcEscala = () => {
      if (!paginas.length) return 1;
      const p0 = paginas[0].vp1;
      if (modo === 'ancho') return anchoUtil() / p0.width;
      if (modo === 'pagina') return Math.min(anchoUtil() / p0.width, altoUtil() / p0.height);
      return (+modo / 100) * (96 / 72); // 100 % = tamaño real del papel
    };
    const aplicar = (render = true) => {
      escala = calcEscala();
      const pct = Math.round((escala * 72 / 96) * 100);
      if (modo === 'ancho' || modo === 'pagina') { sel.value = modo; sel.options[sel.selectedIndex].textContent = `${modo === 'ancho' ? 'Ajustar al ancho' : 'Página completa'} (${pct} %)`; }
      else { if (![...sel.options].some((o) => o.value === String(modo))) sel.insertAdjacentHTML('beforeend', `<option value="${modo}">${modo} %</option>`); sel.value = String(modo); }
      [...sel.options].forEach((o) => { if (o.value === 'ancho' && modo !== 'ancho') o.textContent = 'Ajustar al ancho'; if (o.value === 'pagina' && modo !== 'pagina') o.textContent = 'Página completa'; });
      v.classList.toggle('zoomed', escala * paginas[0]?.vp1.width > anchoUtil() + 2);
      paginas.forEach((pg) => { pg.c.style.width = `${pg.vp1.width * escala}px`; pg.c.style.height = `${pg.vp1.height * escala}px`; });
      if (render) { clearTimeout(tRender); tRender = setTimeout(renderTodas, 160); }
    };
    const pctActual = () => Math.round((escala * 72 / 96) * 100);
    const pasos = [25, 33, 50, 67, 75, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500];
    const zoomA = (nuevo, foco) => {
      const antes = escala; const sx = v.scrollLeft, sy = v.scrollTop;
      modo = Math.max(25, Math.min(500, Math.round(nuevo))); aplicar();
      const k = escala / antes, fx = foco ? foco.x : v.clientWidth / 2, fy = foco ? foco.y : v.clientHeight / 2;
      v.scrollLeft = (sx + fx) * k - fx; v.scrollTop = (sy + fy) * k - fy;
    };
    const mas = (foco) => zoomA(pasos.find((x) => x > pctActual() + 1) || 500, foco);
    const menos = (foco) => zoomA([...pasos].reverse().find((x) => x < pctActual() - 1) || 25, foco);
    // nitidez: cada página se vuelve a dibujar a la resolución del zoom
    let generacion = 0;
    const renderTodas = async () => {
      const gen = ++generacion; const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const visibles = paginas.map((pg) => { const r = pg.c.getBoundingClientRect(), rv = v.getBoundingClientRect(); return { pg, d: r.bottom < rv.top ? rv.top - r.bottom : r.top > rv.bottom ? r.top - rv.bottom : 0 }; }).sort((a, b) => a.d - b.d).map((x) => x.pg);
      for (const pg of visibles) {
        if (gen !== generacion) return;
        const esc = Math.min(escala * dpr, 6), w = Math.round(pg.vp1.width * esc);
        if (pg.dib === w) continue;
        const vp = pg.page.getViewport({ scale: esc });
        const off = document.createElement('canvas'); off.width = vp.width; off.height = vp.height;
        try { await pg.page.render({ canvasContext: off.getContext('2d'), viewport: vp }).promise; } catch (e) { continue; }
        if (gen !== generacion) return;
        pg.c.width = off.width; pg.c.height = off.height; pg.c.getContext('2d').drawImage(off, 0, 0); pg.dib = w;
      }
    };
    m.body.querySelector('[data-z=mas]').onclick = () => mas();
    m.body.querySelector('[data-z=menos]').onclick = () => menos();
    sel.onchange = () => { modo = sel.value === 'ancho' || sel.value === 'pagina' ? sel.value : +sel.value; aplicar(); };
    m.body.querySelector('[data-z=full]').onclick = (e) => {
      const on = !m.el.classList.contains('vz-full'); m.el.classList.toggle('vz-full', on);
      e.currentTarget.textContent = on ? '⤡ Salir de pantalla completa' : '⤢ Pantalla completa';
      setTimeout(() => aplicar(), 50);
    };
    // Ctrl + rueda del mouse, Ctrl +/- y gesto de pellizco en pantallas táctiles
    v.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); const r = v.getBoundingClientRect(); const f = { x: e.clientX - r.left, y: e.clientY - r.top }; if (e.deltaY < 0) zoomA(pctActual() * 1.12, f); else zoomA(pctActual() / 1.12, f); }, { passive: false });
    const teclas = (e) => {
      if (!document.body.contains(m.el)) { document.removeEventListener('keydown', teclas); return; }
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); mas(); } else if (e.key === '-') { e.preventDefault(); menos(); } else if (e.key === '0') { e.preventDefault(); modo = 'ancho'; aplicar(); }
    };
    document.addEventListener('keydown', teclas);
    const toques = new Map(); let pinch = null;
    v.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') return; toques.set(e.pointerId, e); if (toques.size === 2) { const [a, b] = [...toques.values()]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), pct: pctActual() }; } });
    v.addEventListener('pointermove', (e) => {
      if (!toques.has(e.pointerId)) return; toques.set(e.pointerId, e);
      if (pinch && toques.size === 2) { e.preventDefault(); const [a, b] = [...toques.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); const r = v.getBoundingClientRect(); zoomA(pinch.pct * (d / pinch.d), { x: (a.clientX + b.clientX) / 2 - r.left, y: (a.clientY + b.clientY) / 2 - r.top }); }
    }, { passive: false });
    const fin = (e) => { toques.delete(e.pointerId); if (toques.size < 2) pinch = null; };
    v.addEventListener('pointerup', fin); v.addEventListener('pointercancel', fin);
    // página visible
    v.addEventListener('scroll', () => { if (!paginas.length) return; const rv = v.getBoundingClientRect(); let act = 1; paginas.forEach((pg, i) => { if (pg.c.getBoundingClientRect().top < rv.top + rv.height / 2) act = i + 1; }); lblPag.textContent = `Página ${act} de ${paginas.length}`; clearTimeout(tRender); tRender = setTimeout(renderTodas, 200); });
    window.addEventListener('resize', () => { if (document.body.contains(m.el) && (modo === 'ancho' || modo === 'pagina')) aplicar(); });
    try {
      pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
      v.innerHTML = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i); const vp1 = page.getViewport({ scale: 1 });
        const wrap = document.createElement('div'); wrap.className = 'pg'; wrap.dataset.p = i - 1;
        const c = document.createElement('canvas'); wrap.appendChild(c); v.appendChild(wrap);
        paginas.push({ page, vp1, c, dib: 0 });
        wrap.onclick = async (e) => {
          if (!modoFirma || !firmar) return;
          const r = c.getBoundingClientRect(); const xRel = (e.clientX - r.left) / r.width, yRel = (e.clientY - r.top) / r.height;
          const mk = document.createElement('div'); mk.className = 'mark'; mk.style.cssText = `left:${xRel * 100 - 14}%;top:${yRel * 100 - 3}%;width:28%;height:6%`; wrap.appendChild(mk);
          const ok = await firmar({ pagina: +wrap.dataset.p, xRel, yRel });
          if (ok) m.cerrar(); else mk.remove();
        };
      }
      lblPag.textContent = `Página 1 de ${paginas.length}`;
      aplicar(false); await renderTodas();
    } catch (e) {
      console.error(e);
      v.innerHTML = `<div class="empty">No se pudo mostrar la vista previa en este dispositivo. Use “Descargar” para abrir el archivo.</div>`;
    }
    return m;
  }

  // Fechas
  const hoy = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  const sumarMeses = (iso, n) => { const d = new Date((iso || hoy()) + 'T12:00:00'); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); };
  const diasHasta = (iso) => (iso ? Math.round((new Date(iso + 'T12:00:00') - new Date(hoy() + 'T12:00:00')) / 864e5) : null);
  const fecha = (iso) => (iso ? new Date(String(iso).length <= 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
  const fechaHora = (iso) => (iso ? new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
  const tam = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
  const ext = (n) => (n || '').split('.').pop().toLowerCase();

  return { h, I, toast, modal, confirmar, leer, f, descargar, aDataURL, reducirImagen, pedirFirma, verPDF, hoy, sumarMeses, diasHasta, fecha, fechaHora, tam, ext };
})();
