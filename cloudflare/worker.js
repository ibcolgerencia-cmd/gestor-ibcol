// =====================================================================
//  GUARDIÁN DE ARCHIVOS · Gestor Biomédico IBCOL (Cloudflare Worker + R2)
//  Los archivos del gestor se guardan en el depósito privado R2 "gestor-ibcol".
//  Nadie entra directo al depósito: cada pedido pasa por este programa, que
//  verifica la sesión de Supabase del usuario y sus permisos:
//   · Propietario (IBCOL): todo.
//   · Cliente / calidad: solo archivos de su entidad que las reglas de la base
//     de datos (RLS) le dejan ver.
//   · Enlaces para compartir: firmados (HMAC) y con fecha de vencimiento.
//  Configuración en Cloudflare (Workers › gestor-ibcol-archivos › Settings):
//   · Binding R2: BUCKET → depósito "gestor-ibcol"
//   · Secret: FIRMA → texto aleatorio largo (firma de los enlaces)
// =====================================================================
const SB_URL = 'https://wmngnvoswrdcppsbmxsu.supabase.co';
const SB_KEY = 'sb_publishable_NvwpLD-9RBYaa2BDnRireQ_kzP4iT_-'; // clave publicable (no es secreta)
const ORIGENES = ['https://ibcolgerencia-cmd.github.io', 'http://localhost:8765'];

const cors = (req) => {
  const o = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ORIGENES.includes(o) ? o : ORIGENES[0],
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
};
const json = (req, data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } });
const ruta = (p) => decodeURIComponent(p).replace(/^\/+/, '');
const valida = (k) => k && k.length < 1024 && !k.includes('..') && /^[\w.\-/ ()]+$/.test(k);

// ---------------------------------------------------------------- sesión y permisos
const cache = new Map(); // token → { u, t }
async function usuario(req) {
  const tok = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!tok) return null;
  const c = cache.get(tok); if (c && Date.now() - c.t < 60000) return c.u;
  const h = { apikey: SB_KEY, Authorization: `Bearer ${tok}` };
  const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: h });
  if (!r.ok) return null;
  const au = await r.json();
  const pr = await fetch(`${SB_URL}/rest/v1/perfiles?id=eq.${au.id}&select=rol,entidad_id,activo`, { headers: h });
  const p = pr.ok ? (await pr.json())[0] : null;
  if (!p || p.activo === false) return null;
  const u = { id: au.id, rol: p.rol, entidad: p.entidad_id, tok };
  cache.set(tok, { u, t: Date.now() }); if (cache.size > 500) cache.clear();
  return u;
}
const esProp = (u) => u?.rol === 'propietario';
async function visibleEnTabla(u, tabla, k) {
  const r = await fetch(`${SB_URL}/rest/v1/${tabla}?archivo=eq.${encodeURIComponent(k)}&select=id&limit=1`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${u.tok}` } });
  return r.ok && (await r.json()).length > 0;
}
async function puedeLeer(u, k) {
  if (esProp(u)) return true;
  if (!u?.entidad || k.split('/')[0] !== u.entidad) return false;
  // copias para compartir y fotos/anexos de actas: dentro de la carpeta de su entidad
  if (/\/(compartidos|comites)\//.test(k)) return true;
  return (await visibleEnTabla(u, 'documentos', k)) || (await visibleEnTabla(u, 'cobros', k));
}
const puedeEscribir = (u, k) => esProp(u) || (!!u?.entidad && k.split('/')[0] === u.entidad);

// ---------------------------------------------------------------- enlaces firmados
async function firma(env, texto) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.FIRMA), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(texto)));
  return btoa(String.fromCharCode(...s)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const entregar = (req, obj, nombre) => {
  const h = new Headers(cors(req));
  obj.writeHttpMetadata(h);
  h.set('etag', obj.httpEtag);
  h.set('Cache-Control', 'private, max-age=300');
  if (nombre) h.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(nombre)}`);
  return new Response(obj.body, { headers: h });
};

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url);
    try {
      // enlace público firmado: /s/<ruta>?e=<vence>&f=<firma>&n=<nombre>
      if (url.pathname.startsWith('/s/') && req.method === 'GET') {
        const k = ruta(url.pathname.slice(3)); const e = Number(url.searchParams.get('e') || 0);
        if (!valida(k) || !e || e < Date.now() / 1000) return new Response('Enlace vencido o no válido', { status: 403 });
        if ((await firma(env, `${k}|${e}`)) !== url.searchParams.get('f')) return new Response('Enlace no válido', { status: 403 });
        const obj = await env.BUCKET.get(k); if (!obj) return new Response('Archivo no encontrado', { status: 404 });
        return entregar(req, obj, url.searchParams.get('n'));
      }
      if (url.pathname === '/' || url.pathname === '/salud') return json(req, { ok: true, servicio: 'archivos IBCOL' });

      const u = await usuario(req);
      if (!u) return json(req, { error: 'Sesión no válida' }, 401);

      // /o/<ruta>: leer, guardar o borrar un archivo
      if (url.pathname.startsWith('/o/')) {
        const k = ruta(url.pathname.slice(3)); if (!valida(k)) return json(req, { error: 'Ruta no válida' }, 400);
        if (req.method === 'GET') {
          if (!(await puedeLeer(u, k))) return json(req, { error: 'Sin permiso' }, 403);
          const obj = await env.BUCKET.get(k); if (!obj) return json(req, { error: 'No existe' }, 404);
          return entregar(req, obj);
        }
        if (req.method === 'PUT') {
          if (!puedeEscribir(u, k)) return json(req, { error: 'Sin permiso' }, 403);
          const largo = Number(req.headers.get('Content-Length') || 0); if (largo > 100 * 1048576) return json(req, { error: 'Archivo muy grande' }, 413);
          await env.BUCKET.put(k, req.body, { httpMetadata: { contentType: req.headers.get('Content-Type') || 'application/octet-stream' } });
          return json(req, { ok: true, ruta: k });
        }
        if (req.method === 'DELETE') {
          if (!esProp(u)) return json(req, { error: 'Sin permiso' }, 403);
          await env.BUCKET.delete(k); return json(req, { ok: true });
        }
      }
      // ¿existe? (propietario: para el paso de archivos)
      if (url.pathname.startsWith('/existe/') && req.method === 'GET') {
        if (!esProp(u)) return json(req, { error: 'Sin permiso' }, 403);
        const o = await env.BUCKET.head(ruta(url.pathname.slice(8)));
        return json(req, { existe: !!o, tamano: o?.size || 0 });
      }
      // crear enlace firmado para compartir
      if (url.pathname === '/firmar' && req.method === 'POST') {
        const { ruta: k, segundos = 604800, nombre = '' } = await req.json();
        if (!valida(k) || !(await puedeLeer(u, k))) return json(req, { error: 'Sin permiso' }, 403);
        if (!(await env.BUCKET.head(k))) return json(req, { error: 'No existe' }, 404);
        const e = Math.floor(Date.now() / 1000) + Math.min(Number(segundos) || 604800, 2592000);
        const f = await firma(env, `${k}|${e}`);
        return json(req, { url: `${url.origin}/s/${k.split('/').map(encodeURIComponent).join('/')}?e=${e}&f=${f}${nombre ? `&n=${encodeURIComponent(nombre)}` : ''}` });
      }
      // lista y uso del depósito (propietario)
      if (url.pathname === '/lista' && req.method === 'GET') {
        if (!esProp(u)) return json(req, { error: 'Sin permiso' }, 403);
        const r = await env.BUCKET.list({ cursor: url.searchParams.get('cursor') || undefined, limit: 1000 });
        return json(req, { objetos: r.objects.map((o) => ({ ruta: o.key, tamano: o.size })), cursor: r.truncated ? r.cursor : null });
      }
      return json(req, { error: 'No encontrado' }, 404);
    } catch (e) {
      return json(req, { error: e.message || 'Error' }, 500);
    }
  },
};
