// =====================================================================
//  Códigos ECRI (UMDNS) para la hoja de vida: listado oficial ECRI
//  español-inglés (datos/ecri.json, 4.907 códigos). Búsqueda por código,
//  nombre en español o en inglés, y sugerencias según el nombre del equipo.
// =====================================================================
(() => {
  const A = window.APP;
  const { h, modal } = UI;
  let lista = null;
  const nrm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // equivalencias de nombres comunes en las IPS → término UMDNS
  const SINON = { pulsioximetro: 'oximetros de pulsos', oximetro: 'oximetros de pulsos', tensiometro: 'esfigmomanometros', fonendoscopio: 'estetoscopios', glucometro: 'glucosa', termohigrometro: 'higrometros',
    bascula: 'basculas', 'pieza de alta': 'piezas de mano', 'contra angulo': 'piezas de mano', micromotor: 'piezas de mano', 'pieza recta': 'piezas de mano', scaler: 'escarificadores',
    'fotocurado': 'luces activador dental', 'lampara de fotocurado': 'luces activador dental', 'unidad odontologica': 'tratamiento dental', 'equipo organos': 'otoscopios', ecografo: 'exploracion ultrasonido', ecografia: 'exploracion ultrasonido', nevera: 'refrigeradores',
    'termometro max': 'termometros', incubadora: 'incubadoras', cubadora: 'incubadoras', autoclave: 'esterilizadores', electrocardiografo: 'electrocardiografos', centrifuga: 'centrifugas', nebulizador: 'nebulizadores', compresor: 'compresores' };

  async function cargar() {
    if (!lista) lista = (await (await fetch('datos/ecri.json?e1')).json()).map(([c, es, en]) => ({ c, es, en, k: nrm(`${c} ${es} ${en}`) }));
    return lista;
  }
  function buscar(t, max = 60) {
    const q = nrm(t).trim(); if (!q || !lista) return [];
    const pal = q.split(/[\s,]+/).filter(Boolean);
    return lista.map((x) => {
      let p = 0;
      if (x.c === q) p += 100;
      pal.forEach((w) => { const raiz = w.length > 5 ? w.slice(0, w.length - 2) : w; if (x.k.includes(raiz)) p += nrm(x.es).startsWith(raiz) ? 6 : 3; });
      return { x, p: p - x.es.length / 200 };
    }).filter((r) => r.p > 0 && pal.every((w) => r.x.k.includes(w.length > 5 ? w.slice(0, w.length - 2) : w))).sort((a, b) => b.p - a.p).slice(0, max).map((r) => r.x);
  }
  async function sugerir(nombre) {
    await cargar();
    let t = nrm(nombre);
    for (const [k, v] of Object.entries(SINON)) if (t.includes(k)) { t = v; break; }
    let r = buscar(t, 6);
    if (!r.length) r = buscar(t.split(/\s+/)[0], 6);
    return r;
  }
  const texto = (x) => `${x.c} ${x.es}`;

  // ventana de búsqueda: devuelve el código elegido (texto "12-853 Oxímetros")
  function elegir(nombreEquipo, alElegir) {
    const m = modal({
      titulo: 'Código ECRI (UMDNS)', size: 'wide',
      cuerpo: `<div class="form"><div class="fields"><div class="field full"><label for="ecriq">Buscar por nombre en español, inglés o por código</label><input id="ecriq" placeholder="ej: oxímetro, esfigmomanómetro, 12-853"></div></div>
        <p class="muted" data-info>Cargando listado ECRI…</p><div class="tbl-wrap" style="max-height:380px"><table class="tbl"><thead><tr><th>Código</th><th>Nombre (español)</th><th>Nombre (inglés)</th></tr></thead><tbody></tbody></table></div></div>`,
    });
    const q = m.body.querySelector('#ecriq'), tb = m.body.querySelector('tbody'), info = m.body.querySelector('[data-info]');
    const pintar = (l, t) => {
      info.textContent = t;
      tb.innerHTML = l.map((x) => `<tr class="clic" data-c="${h(x.c)}"><td class="mono"><b>${h(x.c)}</b></td><td>${h(x.es)}</td><td class="muted">${h(x.en)}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">Sin resultados. Pruebe con otra palabra.</td></tr>';
    };
    tb.onclick = (e) => { const tr = e.target.closest('[data-c]'); if (!tr) return; const x = lista.find((y) => y.c === tr.dataset.c); alElegir(texto(x)); m.cerrar(); };
    cargar().then(async () => {
      const s = await sugerir(nombreEquipo || '');
      pintar(s, s.length ? `Sugerencias para “${nombreEquipo}”. Escriba para buscar en los ${lista.length} códigos.` : `Escriba para buscar en los ${lista.length} códigos.`);
      let t = null; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { const r = buscar(q.value); pintar(r, q.value ? `${r.length} resultado(s)${r.length === 60 ? ' (se muestran los primeros 60)' : ''}` : ''); }, 150); };
      q.focus();
    });
  }

  A.ECRI = { cargar, buscar, sugerir, elegir, texto };
})();
