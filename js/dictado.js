// =====================================================================
//  DICTADO POR VOZ (Web Speech API) para diligenciar reportes en sitio.
//  UI.dictar(boton, alTerminarFrase, elementoVistaPrevia): inicia o detiene.
//  Comandos: «punto», «coma», «dos puntos», «siguiente» / «nueva línea».
//  Funciona en Chrome y Edge (computador y Android) y en Safari de iPhone;
//  necesita conexión a internet y permiso del micrófono.
// =====================================================================
(() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const ICO = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>';
  let activo = null;
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  UI.dictadoSoportado = !!SR;
  UI.dictarBtn = (k, label = 'Dictar') => `<span class="mic-row"><button type="button" class="btn sm mic" data-mic="${k}" title="Dictar por voz: pulse, hable y pulse de nuevo para terminar">${ICO}<span>${label}</span></button><span class="mic-prev" data-mic-prev="${k}" aria-live="polite"></span></span>`;
  // comandos de puntuación y salto de línea
  UI.textoDictado = (t) => String(t || '')
    .replace(/\s*\b(punto y aparte|nueva l[ií]nea|siguiente l[ií]nea|siguiente)\b[.,]?\s*/gi, '\n')
    .replace(/\s*\bdos puntos\b/gi, ':').replace(/\s*\bpunto y coma\b/gi, ';').replace(/\s*\bpunto\b/gi, '.').replace(/\s*\bcoma\b/gi, ',')
    .replace(/[ \t]+/g, ' ').split('\n').map((x) => x.trim()).filter(Boolean).map(cap).join('\n');
  // "dos filtros de aire" → { c: 2, d: 'Filtros de aire' }
  const NUM = { un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, quince: 15, veinte: 20, media: 0.5, medio: 0.5 };
  UI.parteDictada = (t) => {
    let s = String(t || '').trim().replace(/[.;]$/, ''); let c = '';
    const m = s.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/) || s.match(/^(\S+)\s+(.+)$/);
    if (m && /^\d/.test(m[1])) { c = m[1].replace(',', '.'); s = m[2]; } else if (m && NUM[norm(m[1])] !== undefined) { c = String(NUM[norm(m[1])]); s = m[2]; }
    const m2 = s.match(/^(.+?)\s*(?:,|\bcantidad\b|\bpor\b)\s*(\d+)\s*(?:unidades?)?$/i); if (!c && m2) { s = m2[1]; c = m2[2]; }
    return { c, d: cap(s.replace(/^(de|del)\s+/i, '').trim()) };
  };
  // ¿la frase corresponde a una actividad de la lista? devuelve el índice o -1
  const VACIAS = new Set(['para', 'con', 'del', 'las', 'los', 'una', 'que', 'por', 'segun', 'equipo', 'general', 'sus', 'este', 'esta']);
  const pal = (s) => norm(s).split(/[^a-z0-9ñ]+/).filter((w) => w.length > 3 && !VACIAS.has(w));
  UI.coincidencia = (frase, opciones) => {
    const f = pal(frase).map((w) => w.slice(0, 6)); let mejor = -1, puntaje = 0;
    opciones.forEach((o, i) => { const p = pal(o).map((w) => w.slice(0, 6)); if (!p.length) return; const n = p.filter((w) => f.includes(w)).length, r = n / p.length; if (n >= Math.min(2, p.length) && r >= 0.6 && r > puntaje) { puntaje = r; mejor = i; } });
    return mejor;
  };
  UI.detenerDictado = () => { if (activo) { activo.parar = true; try { activo.rec.stop(); } catch (e) { /* */ } } };

  UI.dictar = (btn, alFinal, prev) => {
    if (!SR) { UI.toast('Este navegador no permite el dictado por voz. Use Chrome o Edge (en el celular: Chrome en Android o Safari en iPhone).', true); return; }
    const mismo = activo?.btn === btn; UI.detenerDictado(); if (mismo) return;
    const rec = new SR(), yo = { rec, btn, parar: false }; activo = yo;
    rec.lang = 'es-CO'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    btn.classList.add('grabando'); btn.setAttribute('aria-pressed', 'true'); const lbl = btn.querySelector('span'), lbl0 = lbl?.textContent; if (lbl) lbl.textContent = 'Escuchando… (pulse para terminar)';
    rec.onresult = (e) => {
      if (!btn.isConnected) { UI.detenerDictado(); return; }
      let prov = '';
      for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) { const t = r[0].transcript.trim(); if (t) alFinal(t); } else prov += r[0].transcript; }
      if (prev) prev.textContent = prov;
    };
    rec.onerror = (e) => {
      const msg = { 'not-allowed': 'Permita el uso del micrófono en el navegador para dictar.', 'service-not-allowed': 'Permita el uso del micrófono en el navegador para dictar.', network: 'El dictado por voz necesita conexión a internet.', 'audio-capture': 'No se encontró un micrófono.', 'language-not-supported': 'El navegador no tiene dictado en español.' }[e.error];
      if (msg) { yo.parar = true; UI.toast(msg, true); }
    };
    rec.onend = () => {
      if (!yo.parar && btn.isConnected && activo === yo) { try { rec.start(); return; } catch (er) { /* sigue y termina */ } }
      btn.classList.remove('grabando'); btn.removeAttribute('aria-pressed'); if (lbl) lbl.textContent = lbl0; if (prev) prev.textContent = '';
      if (activo === yo) activo = null;
    };
    try { rec.start(); } catch (er) { rec.onend(); UI.toast('No se pudo iniciar el dictado: ' + er.message, true); }
  };
})();
