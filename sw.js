// Service worker: permite instalar la app y abrirla rápido (los datos siempre vienen de la nube)
const CACHE = 'ibcol-v32';
const ARCHIVOS = ['./', './index.html', './css/styles.css', './js/config.js', './js/logo.js', './js/catalogos.js', './js/demo-seed.js',
  './js/store.js', './js/pdf.js', './js/ui.js', './js/app.js', './js/ia.js', './js/formatos.js', './js/consecutivos.js', './js/inventario.js', './js/revision.js', './js/modulos.js', './js/editables.js', './js/google.js', './js/comites.js', './js/limpieza.js', './js/enviar.js', './img/icon-192.png', './img/icon-512.png', './manifest.json'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Supabase y CDN van directo a la red
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; }).catch(() => caches.match(e.request)));
});
