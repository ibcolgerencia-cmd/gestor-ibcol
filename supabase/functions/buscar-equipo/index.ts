// =====================================================================
//  Supabase Edge Function: buscar-equipo
//  Gestor Biomédico IBCOL · Búsqueda web + IA (Claude primero, Gemini de respaldo)
//
//  Acciones (solo el usuario PROPIETARIO):
//   - investigar:    busca en Google el equipo del inventario y devuelve
//                    ficha técnica, guía rápida, registro sanitario INVIMA,
//                    enlaces a manuales y protocolo de mantenimiento preventivo.
//   - mantenimiento: con el texto de los manuales / fichas / guías del equipo
//                    (y Google) propone pruebas cualitativas, actividades y
//                    observaciones para el reporte FMB-004.
//   - descargar:     descarga en el servidor un PDF público (manual, ficha)
//                    para guardarlo en la carpeta del equipo.
//   - alertas_invima: alertas sanitarias e informes de seguridad de dispositivos
//                    médicos publicados por el INVIMA en un mes (listado + registro sanitario).
//
//  Secretos (Supabase > Edge Functions > Secrets):
//   ANTHROPIC_API_KEY     (Claude, se usa primero; con búsqueda web de Claude)
//   GEMINI_API_KEY        (respaldo: Gemini con Google Search si Claude falla o no tiene saldo)
//   IA_MODELO_CLAUDE      (opcional, por defecto claude-haiku-5-5)
//   IA_MODELO_BUSQUEDA    (opcional, lista de modelos Gemini separada por comas)
// =====================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const MODELOS = (Deno.env.get('IA_MODELO_BUSQUEDA') || 'gemini-3.8-flash,gemini-3.6-flash,gemini-2.5-flash,gemini-2.0-flash')
  .split(',').map((s) => s.trim()).filter(Boolean);

const encodeBase64 = (b: Uint8Array) => { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// ------------------------------------------------------------------ Gemini con Google Search
type Resp = { texto: string; modelo: string; fuentes: { titulo: string; url: string }[]; consultas: string[]; sugerencias: string; sinBusqueda?: boolean };
const GL = 'https://generativelanguage.googleapis.com/v1beta';
// Modelos "flash" que la clave realmente tiene (como en asistente-ia): los configurados primero
let cacheModelos: string[] | null = null;
async function modelosDisponibles(key: string): Promise<string[]> {
  if (cacheModelos) return cacheModelos;
  let lista: string[] = [];
  try {
    const r = await fetch(`${GL}/models?pageSize=200`, { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(15000) });
    if (r.ok) {
      const j = await r.json();
      lista = (j.models || []).filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m: any) => String(m.name).replace('models/', ''))
        .filter((n: string) => /gemini/.test(n) && /flash/.test(n) && !/image|tts|audio|live|embedding|thinking-exp|lite-preview/.test(n));
      lista.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    } else console.error('ListModels', r.status, (await r.text()).slice(0, 200));
  } catch (e) { console.error('ListModels', (e as Error).message); }
  const conf = MODELOS.filter((m) => !lista.length || lista.includes(m));
  cacheModelos = [...new Set([...conf, ...lista])].slice(0, 6);
  if (!cacheModelos.length) cacheModelos = MODELOS;
  console.log('Modelos a probar:', cacheModelos.join(', '));
  return cacheModelos;
}

async function llamarModelo(key: string, modelo: string, prompt: string, buscar: boolean) {
  return await fetch(`${GL}/models/${modelo}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      ...(buscar ? { tools: [{ google_search: {} }] } : {}),
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    }),
    signal: AbortSignal.timeout(100000),
  });
}

async function gemini(prompt: string, buscar = true): Promise<Resp> {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('Falta el secreto GEMINI_API_KEY en Supabase (Edge Functions > Secrets).');
  const modelos = await modelosDisponibles(key);
  const errores: string[] = [];
  const t0 = Date.now();
  for (const conBusqueda of buscar ? [true, false] : [false]) {
    for (const modelo of modelos) {
      if (Date.now() - t0 > 120000) break; // no pasar el límite de tiempo de la función
      let r: Response;
      try { r = await llamarModelo(key, modelo, prompt, conBusqueda); }
      catch (e) { errores.push(`${modelo}: ${(e as Error).message}`); console.error('Gemini', errores.at(-1)); continue; }
      if (!r.ok) {
        const cuerpo = (await r.text()).slice(0, 400);
        let msg = cuerpo; try { msg = JSON.parse(cuerpo).error?.message || cuerpo; } catch { /* texto */ }
        errores.push(`${modelo}${conBusqueda ? ' + Google' : ''}: ${r.status} ${msg}`);
        console.error('Gemini', errores.at(-1));
        continue;
      }
      const j = await r.json();
      const c = j.candidates?.[0];
      const texto = (c?.content?.parts || []).filter((p: any) => !p.thought).map((p: any) => p.text || '').join('').trim();
      if (!texto) { errores.push(`${modelo}: respuesta vacía (${c?.finishReason || j.promptFeedback?.blockReason || 'sin candidatos'})`); console.error('Gemini', errores.at(-1)); continue; }
      const gm = c?.groundingMetadata || {};
      const vistos = new Set<string>();
      const fuentes = (gm.groundingChunks || []).map((x: any) => ({ titulo: x.web?.title || x.web?.domain || 'Fuente', url: x.web?.uri || '' }))
        .filter((x: any) => x.url && !vistos.has(x.url) && vistos.add(x.url));
      if (buscar && !conBusqueda) console.error('Respondió SIN búsqueda de Google. Errores con búsqueda:', errores.join(' | '));
      return { texto, modelo, fuentes, consultas: gm.webSearchQueries || [], sugerencias: gm.searchEntryPoint?.renderedContent || '', sinBusqueda: buscar && !conBusqueda };
    }
    // con búsqueda solo se intenta sin ella si el problema no es de cuota general
    if (errores.every((e) => /429|RESOURCE_EXHAUSTED/.test(e))) break;
  }
  const ultimo = errores.join(' | ');
  console.error('Sin respuesta de Gemini:', ultimo);
  if (errores.length && errores.every((e) => /429|RESOURCE_EXHAUSTED|quota/i.test(e))) throw new Error('Se agotó la cuota gratuita de Google Gemini por hoy o por minuto. Espere un momento e intente de nuevo.');
  if (errores.length && errores.every((e) => /503|overload|UNAVAILABLE/i.test(e))) throw new Error('Google Gemini está saturado en este momento. Intente de nuevo en unos minutos.');
  throw new Error('La IA de Google no respondió. Detalle: ' + (errores.at(-1) || 'sin modelos disponibles').slice(0, 300));
}

// ------------------------------------------------------------------ Claude (primero) con búsqueda web; si falla → Gemini
async function claude(prompt: string, buscar = true): Promise<Resp> {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) throw new Error('sin clave de Claude');
  const base = Deno.env.get('IA_MODELO_CLAUDE') || 'claude-haiku-5-5';
  const errores: string[] = [];
  for (const modelo of [...new Set([base, 'claude-sonnet-5-5'])]) {
    for (const conBusqueda of buscar ? [true, false] : [false]) {
      let r: Response;
      try {
        r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal: AbortSignal.timeout(110000),
          headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({ model: modelo, max_tokens: 8000, messages: [{ role: 'user', content: prompt }],
            ...(conBusqueda ? { tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }] } : {}) }),
        });
      } catch (e) { errores.push(`${modelo}: ${(e as Error).message}`); break; }
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = `${modelo}${conBusqueda ? ' + web' : ''}: ${r.status} ${j?.error?.message || ''}`; errores.push(msg); console.error('Claude', msg);
        if (r.status === 400 && conBusqueda && !/credit|balance|saldo/i.test(msg)) continue; // búsqueda web no habilitada: intenta sin ella
        if (r.status === 404) break; // modelo no existe: siguiente modelo
        throw new Error('Claude: ' + msg);
      }
      const bloques = j.content || [];
      const texto = bloques.filter((c: any) => c.type === 'text').map((c: any) => c.text || '').join('').trim();
      if (!texto) { errores.push(`${modelo}: respuesta vacía`); continue; }
      const vistos = new Set<string>(); const fuentes: { titulo: string; url: string }[] = []; const consultas: string[] = [];
      for (const c of bloques) {
        if (c.type === 'server_tool_use' && c.input?.query) consultas.push(String(c.input.query));
        if (c.type === 'web_search_tool_result' && Array.isArray(c.content)) for (const x of c.content) if (x.url && !vistos.has(x.url)) { vistos.add(x.url); fuentes.push({ titulo: x.title || 'Fuente', url: x.url }); }
      }
      return { texto, modelo, fuentes, consultas, sugerencias: '', sinBusqueda: buscar && !conBusqueda };
    }
  }
  throw new Error('Claude: ' + (errores.at(-1) || 'sin respuesta'));
}

async function ia(prompt: string, buscar = true): Promise<Resp> {
  const errores: string[] = [];
  if (Deno.env.get('ANTHROPIC_API_KEY')) { try { return await claude(prompt, buscar); } catch (e) { errores.push((e as Error).message); console.error('Claude falló, se usa Gemini:', errores[0]); } }
  try { return await gemini(prompt, buscar); } catch (e) { throw new Error([...errores, (e as Error).message].join(' · ')); }
}

function extraerJSON(t: string) {
  const s = t.replace(/```(?:json)?/gi, '');
  const i = s.indexOf('{'), f = s.lastIndexOf('}');
  if (i < 0 || f < i) return null;
  try { return JSON.parse(s.slice(i, f + 1)); } catch { return null; }
}

const datosEquipo = (e: any = {}) => [
  `Nombre del equipo: ${e.nombre || ''}`, `Marca: ${e.marca || 'no registra'}`, `Modelo: ${e.modelo || 'no registra'}`,
  e.serie ? `Serie: ${e.serie}` : '', e.registro_sanitario ? `Registro sanitario en inventario: ${e.registro_sanitario}` : '',
  e.clase_riesgo ? `Clase de riesgo en inventario: ${e.clase_riesgo}` : '', e.fabricante ? `Fabricante: ${e.fabricante}` : '',
].filter(Boolean).join('\n');

// ------------------------------------------------------------------ investigar
function promptInvestigar(e: any, que: string[]) {
  const pide = (k: string) => !que?.length || que.includes(k);
  return `Eres ingeniero biomédico en Colombia y documentas equipos biomédicos para la habilitación (Resolución 3100 de 2019) y el programa de tecnovigilancia.
Busca en Google información REAL y verificable del siguiente equipo del inventario de una IPS. Prioriza: página oficial del fabricante, manuales en PDF del fabricante o distribuidor, consulta de registros sanitarios del INVIMA (consultaregistro.invima.gov.co, datos.gov.co) y distribuidores en Colombia.

${datosEquipo(e)}

Reglas:
- No inventes. Si un dato no aparece en las fuentes, usa null. Si no hay marca o modelo, describe el tipo de equipo de forma general y dilo en "nota".
- Las URL de "documentos" deben ser enlaces que realmente encontraste; prefiere enlaces directos a archivos PDF.
- Textos en español, frases cortas.
- Las pruebas y actividades de mantenimiento deben ser frases de máximo 60 caracteres (caben en una celda del formato).

Responde SOLO con un objeto JSON, sin Markdown, con esta forma:
{
  "identificado": true o false (si encontraste el modelo exacto),
  "nota": "aclaraciones breves (p. ej. 'no se encontró el modelo exacto; datos del tipo de equipo')",
  ${pide('ficha') ? `"ficha": {
    "nombre_comercial": "", "fabricante": "", "pais_origen": "", "descripcion": "2-3 frases", "funcion": "", "principio_funcionamiento": "",
    "especificaciones": [{"parametro": "", "valor": ""}],
    "alimentacion": "", "voltaje": "", "frecuencia": "", "potencia": "", "corriente": "", "bateria": "",
    "peso": "", "dimensiones": "", "rangos": "", "temperatura_operacion": "", "humedad_operacion": "",
    "clase_riesgo": "I | IIa | IIb | III", "vida_util": "", "accesorios": [""], "normas": [""]
  },` : ''}
  ${pide('guia') ? `"guia": {
    "antes_de_usar": [""], "encendido": [""], "uso": [""], "apagado": [""], "limpieza": [""], "almacenamiento": [""],
    "fallas": [{"problema": "", "solucion": ""}], "precauciones": [""]
  },` : ''}
  ${pide('registro') ? `"registro": {
    "numero": "registro sanitario INVIMA o permiso de comercialización", "titular": "", "fabricante": "", "importador": "",
    "fecha_expedicion": "AAAA-MM-DD", "fecha_vencimiento": "AAAA-MM-DD", "estado": "Vigente | Vencido | En trámite de renovación | No encontrado",
    "clase_riesgo": "", "modalidad": "", "coincide_con_inventario": true o false o null, "url_consulta": ""
  },` : ''}
  ${pide('manuales') ? `"documentos": [{"tipo": "Operación | Mantenimiento | Guía rápida | Ficha técnica", "titulo": "", "url": "", "idioma": ""}],` : ''}
  ${pide('mantenimiento') ? `"mantenimiento": {
    "frecuencia": "Mensual | Bimestral | Trimestral | Cuatrimestral | Semestral | Anual", "pruebas": ["hasta 10 pruebas cualitativas"],
    "actividades": ["hasta 10 actividades de mantenimiento preventivo"], "herramientas": [""], "metrologia": "si requiere calibración y de qué magnitud",
    "observaciones": "recomendación técnica breve para el reporte"
  },` : ''}
  "fin": true
}`;
}

// ------------------------------------------------------------------ mantenimiento preventivo (FMB-004)
function promptMantenimiento(b: any) {
  return `Eres ingeniero biomédico. Vas a completar el REPORTE DE MANTENIMIENTO PREVENTIVO (formato FMB-004) del equipo:
${datosEquipo(b.equipo)}
Frecuencia: ${b.equipo?.periodicidad_mto || 'no indicada'}

${b.documentos ? `TEXTO DE LOS MANUALES, FICHAS TÉCNICAS Y GUÍAS DEL EQUIPO (fuente principal, úsala antes que Google):\n${String(b.documentos).slice(0, 60000)}\n` : 'No hay manuales cargados: usa Google para buscar el manual del fabricante o, si no aparece, las buenas prácticas para este tipo de equipo.'}
${b.protocolo ? `PROTOCOLO GUARDADO PARA ESTE EQUIPO:\n${JSON.stringify(b.protocolo).slice(0, 4000)}\n` : ''}
${b.base ? `LISTAS DEL FORMATO (reutiliza su redacción cuando aplique):\nPruebas: ${(b.base.pruebas || []).join('; ')}\nActividades: ${(b.base.actividades || []).join('; ')}\nHerramientas: ${(b.base.herramientas || []).join('; ')}\n` : ''}
${b.anterior ? `OBSERVACIONES DEL REPORTE ANTERIOR: ${String(b.anterior).slice(0, 800)}\n` : ''}
Reglas:
- Máximo 12 pruebas cualitativas y 12 actividades; cada una de máximo 60 caracteres, en mayúscula inicial, sin numeración.
- Las pruebas son verificaciones con resultado Pasa / No pasa (inspección, encendido, alarmas, medición de variables, seguridad eléctrica…).
- Las actividades son lo que hace el técnico (limpieza, ajuste, lubricación, cambio de consumibles, verificación con simulador…).
- "observaciones": 2 a 4 frases para la casilla 5 del reporte: estado del equipo, recomendaciones de uso y cuidado según el fabricante y próxima intervención. No inventes fallas: redacta como equipo en buen estado si no se indica otra cosa.
- "herramientas": elige de la lista del formato cuando aplique.
- No inventes datos técnicos que no estén en los documentos o en las fuentes.

Responde SOLO con JSON sin Markdown:
{"pruebas": [""], "actividades": [""], "herramientas": [""], "observaciones": "", "variables": [{"parametro": "", "valor_esperado": ""}], "fuentes_documentos": ["nombre del documento usado"]}`;
}

// ------------------------------------------------------------------ descarga de PDF público
const PRIVADA = /^(localhost|127\.|10\.|0\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|\[?f[cd][0-9a-f]{2}:|metadata\.google)/i;
async function descargar(url: string) {
  let u: URL;
  try { u = new URL(url); } catch { throw new Error('Enlace inválido'); }
  if (!/^https?:$/.test(u.protocol) || PRIVADA.test(u.hostname)) throw new Error('Enlace no permitido');
  const r = await fetch(u, {
    redirect: 'follow', signal: AbortSignal.timeout(45000),
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36', Accept: 'application/pdf,*/*;q=0.8' },
  });
  if (!r.ok) throw new Error(`El sitio respondió ${r.status}`);
  const largo = Number(r.headers.get('content-length') || 0);
  if (largo > 14_000_000) throw new Error('El archivo pesa más de 14 MB; descárguelo manualmente.');
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.length > 14_000_000) throw new Error('El archivo pesa más de 14 MB; descárguelo manualmente.');
  const esPdf = buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
  if (!esPdf) throw new Error('El enlace no lleva a un PDF (es una página web o requiere registro).');
  const cd = r.headers.get('content-disposition') || '';
  let nombre = (cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i)?.[1] || decodeURIComponent(new URL(r.url).pathname.split('/').pop() || '')).trim();
  if (!/\.pdf$/i.test(nombre)) nombre = (nombre || 'documento') + '.pdf';
  return { base64: encodeBase64(buf), mime: 'application/pdf', nombre: nombre.slice(-120), bytes: buf.length, url_final: r.url };
}


// ------------------------------------------------------------------ alertas sanitarias e informes de seguridad del INVIMA (dispositivos médicos) de un mes
// Lee el listado público www.invima.gov.co/alertas-sanitarias (Dirección de Dispositivos Médicos) y la página de cada alerta (registro sanitario).
const INV = 'https://www.invima.gov.co';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36', 'Accept-Language': 'es-CO,es;q=0.9' };
const sinTags = (t: string) => t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&ntilde;/g, 'ñ').replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(+n)).replace(/\s+/g, ' ').trim();
async function getTxt(url: string) { const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(25000) }); if (!r.ok) throw new Error(`INVIMA respondió ${r.status} (${url})`); return await r.text(); }
function itemsListado(html: string) {
  const re = /href="((?:https?:\/\/www\.invima\.gov\.co)?\/alertas-sanitarias\/(?!page\/)([a-z0-9][a-z0-9\-_]*))"[^>]*>([\s\S]*?)<\/a>/gi;
  const ms: { url: string; slug: string; titulo: string; i: number; f: number }[] = []; let m;
  while ((m = re.exec(html))) { const titulo = sinTags(m[3]); if (!titulo || /^\d+$/.test(m[2]) || /ver pdf|descargar|^pdf$/i.test(titulo)) continue; if (ms.some((x) => x.slug === m![2])) continue; ms.push({ url: m[1].startsWith('http') ? m[1] : INV + m[1], slug: m[2], titulo, i: m.index, f: m.index + m[0].length }); }
  return ms.map((x, k) => {
    const antes = sinTags(html.slice(Math.max(k ? ms[k - 1].f : 0, x.i - 1500), x.i)), despues = sinTags(html.slice(x.f, k + 1 < ms.length ? ms[k + 1].i : x.f + 1500));
    const fecha = (despues.match(/\b(\d{2})-(\d{2})-(\d{4})\b/) || antes.match(/\b(\d{2})-(\d{2})-(\d{4})\b(?!.*\d{2}-\d{2}-\d{4})/) || []);
    const num = (antes.match(/(\d{1,4}-20\d\d)(?!.*\d{1,4}-20\d\d)/) || [])[1] || '';
    const dir = (antes.match(/(Dispositivos m[eé]dicos[^.]{0,30}|Alimentos[^.]{0,20}|Medicamentos[^.]{0,30}|Cosm[eé]ticos[^.]{0,30})(?!.*(Dispositivos m[eé]dicos|Alimentos|Medicamentos|Cosm[eé]ticos))/i) || [])[1] || '';
    const tipo = /informe de seguridad/i.test(despues.slice(0, 300)) ? 'INFORME DE SEGURIDAD' : /alerta sanitaria/i.test(despues.slice(0, 300)) ? 'ALERTA SANITARIA' : '';
    return { url: x.url, titulo: x.titulo, numero: num, direccion: dir, tipo, fecha: fecha[0] ? `${fecha[3]}-${fecha[2]}-${fecha[1]}` : '' };
  }).filter((x) => x.fecha);
}
async function alertasInvima(anio: number, mes: number, debug = false) {
  const ini = `${anio}-${String(mes).padStart(2, '0')}-01`, fin = `${anio}-${String(mes).padStart(2, '0')}-31`;
  const vistos = new Map<string, any>(); const dbg: any[] = [];
  for (let pg = 1; pg <= 40; pg++) {
    const url = `${INV}/alertas-sanitarias${pg > 1 ? '/page/' + pg : ''}?direccion=dd`;
    const html = await getTxt(url); const its = itemsListado(html);
    if (debug && pg <= 2) dbg.push({ url, n: its.length, its: its.slice(0, 4), muestra: sinTags(html).slice(0, 1500) });
    if (!its.length) break;
    its.forEach((x) => { if (x.fecha >= ini && x.fecha <= fin && !vistos.has(x.url) && (!x.direccion || /dispositivo/i.test(x.direccion))) vistos.set(x.url, x); });
    if (its.every((x) => x.fecha < ini)) break;
  }
  const lista = [...vistos.values()].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.numero.localeCompare(b.numero, undefined, { numeric: true }));
  // registro sanitario de cada alerta (página de detalle), de a 6 en paralelo
  for (let i = 0; i < lista.length; i += 6) await Promise.all(lista.slice(i, i + 6).map(async (x) => {
    try {
      const t = sinTags(await getTxt(x.url));
      // el registro se escribe con o sin el prefijo INVIMA (ej. «INVIMA 2022DM-0000097-R2» o «2018DM-0018788»); se busca desde la tabla del producto
      const ip = t.search(/Registro sanitario/i), zona = ip >= 0 ? t.slice(ip, ip + 4000) : t;
      const rs = [...new Set((zona.match(/\b(?:INVIMA\s*)?\d{4}\s*[A-Z]{1,5}\s*-\s*\d{3,8}(?:\s*-\s*R\d+)?\b/g) || []).map((r) => r.replace(/^INVIMA\s*/i, '').replace(/\s+/g, '').trim()))];
      x.registro_sanitario = rs.join(' / ') || (/registro sanitario[^.]{0,40}(no aplica|n\/a|sin registro|no registra)/i.exec(t) ? 'NO APLICA' : '');
      const prod = (t.match(/Producto\s+Registro sanitario\s+Titular\s+Lote \/ Serial\s+(.{5,250}?)\s+(?:INVIMA|\d{4}[A-Z]{1,5}-|No aplica|N\/A)/i) || [])[1];
      x.producto = prod || '';
      if (!x.tipo) x.tipo = /informe de seguridad/i.test(t.slice(0, 3000)) ? 'INFORME DE SEGURIDAD' : 'ALERTA SANITARIA';
      if (debug && !dbg.some((d) => d.detalle)) dbg.push({ detalle: x.url, texto: t.slice(0, 2500) });
    } catch (e) { x.error = (e as Error).message; }
  }));
  return { anio, mes, total: lista.length, alertas: lista, ...(debug ? { debug: dbg } : {}) };
}

// ------------------------------------------------------------------ servidor
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    // Igual que asistente-ia: cliente con la sesión del usuario (las reglas RLS le dejan leer su propio perfil)
    const auth = req.headers.get('Authorization') || '';
    const anon = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || req.headers.get('apikey') || '';
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: u } = await sb.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
    if (!u?.user) return json({ error: 'Sesión no válida. Vuelva a ingresar.' }, 401);
    const { data: p } = await sb.from('perfiles').select('rol').eq('id', u.user.id).maybeSingle();
    if (p?.rol !== 'propietario') return json({ error: 'Solo el usuario propietario puede usar la búsqueda con Google.' }, 403);

    const b = await req.json();
    if (b.accion === 'descargar') return json(await descargar(String(b.url || '')));
    if (b.accion === 'alertas_invima') return json(await alertasInvima(+b.anio, +b.mes, !!b.debug));
    if (b.accion === 'investigar') {
      const r = await ia(promptInvestigar(b.equipo || {}, b.que || []));
      const datos = extraerJSON(r.texto);
      if (!datos) return json({ error: 'La IA no devolvió los datos en el formato esperado. Intente de nuevo.', texto: r.texto.slice(0, 2000) }, 502);
      return json({ datos, fuentes: r.fuentes, consultas: r.consultas, sugerencias: r.sugerencias, modelo: r.modelo, sin_busqueda: !!r.sinBusqueda });
    }
    if (b.accion === 'mantenimiento') {
      const r = await ia(promptMantenimiento(b), b.google !== false);
      const datos = extraerJSON(r.texto);
      if (!datos) return json({ error: 'La IA no devolvió los datos en el formato esperado. Intente de nuevo.' }, 502);
      return json({ datos, fuentes: r.fuentes, consultas: r.consultas, sugerencias: r.sugerencias, modelo: r.modelo, sin_busqueda: !!r.sinBusqueda });
    }
    return json({ error: 'Acción no reconocida' }, 400);
  } catch (e) {
    console.error('buscar-equipo', (e as Error).message);
    return json({ error: (e as Error).message || 'Error en la búsqueda' }, 500);
  }
});
