// =====================================================================
//  Supabase Edge Function: buscar-equipo
//  Gestor Biomédico IBCOL · Búsqueda con Google + IA de Google (Gemini)
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
//
//  Secretos (Supabase > Edge Functions > Secrets):
//   GEMINI_API_KEY        (obligatorio, el mismo del asistente-ia)
//   IA_MODELO_BUSQUEDA    (opcional, lista separada por comas)
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
type Resp = { texto: string; modelo: string; fuentes: { titulo: string; url: string }[]; consultas: string[]; sugerencias: string };
async function gemini(prompt: string, buscar = true): Promise<Resp> {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('Falta el secreto GEMINI_API_KEY en Supabase (Edge Functions > Secrets).');
  let ultimo = '';
  for (const modelo of MODELOS) {
    for (let intento = 0; intento < 2; intento++) {
      let r: Response;
      try {
        r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
          method: 'POST',
          headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            ...(buscar ? { tools: [{ google_search: {} }] } : {}),
            generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
          }),
          signal: AbortSignal.timeout(110000),
        });
      } catch (e) { ultimo = `${modelo}: ${(e as Error).message}`; continue; }
      if (!r.ok) {
        ultimo = `${modelo}: ${r.status} ${(await r.text()).slice(0, 300)}`;
        if (r.status === 503 || r.status === 500) { await new Promise((ok) => setTimeout(ok, 3000)); continue; }
        break; // 404 modelo inexistente, 400 sin búsqueda, 429 cuota: probar el siguiente modelo
      }
      const j = await r.json();
      const c = j.candidates?.[0];
      const texto = (c?.content?.parts || []).filter((p: any) => !p.thought).map((p: any) => p.text || '').join('').trim();
      if (!texto) { ultimo = `${modelo}: respuesta vacía (${c?.finishReason || 'sin candidatos'})`; break; }
      const gm = c?.groundingMetadata || {};
      const vistos = new Set<string>();
      const fuentes = (gm.groundingChunks || []).map((x: any) => ({ titulo: x.web?.title || x.web?.domain || 'Fuente', url: x.web?.uri || '' }))
        .filter((x: any) => x.url && !vistos.has(x.url) && vistos.add(x.url));
      return { texto, modelo, fuentes, consultas: gm.webSearchQueries || [], sugerencias: gm.searchEntryPoint?.renderedContent || '' };
    }
  }
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(ultimo)) throw new Error('Se agotó la cuota gratuita de Google Gemini por hoy o por minuto. Espere un momento e intente de nuevo.');
  if (/503|overload|UNAVAILABLE/i.test(ultimo)) throw new Error('Google Gemini está saturado en este momento. Intente de nuevo en unos minutos.');
  throw new Error('La IA de Google no respondió: ' + ultimo);
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
    if (b.accion === 'investigar') {
      const r = await gemini(promptInvestigar(b.equipo || {}, b.que || []));
      const datos = extraerJSON(r.texto);
      if (!datos) return json({ error: 'La IA no devolvió los datos en el formato esperado. Intente de nuevo.', texto: r.texto.slice(0, 2000) }, 502);
      return json({ datos, fuentes: r.fuentes, consultas: r.consultas, sugerencias: r.sugerencias, modelo: r.modelo });
    }
    if (b.accion === 'mantenimiento') {
      const r = await gemini(promptMantenimiento(b), b.google !== false);
      const datos = extraerJSON(r.texto);
      if (!datos) return json({ error: 'La IA no devolvió los datos en el formato esperado. Intente de nuevo.' }, 502);
      return json({ datos, fuentes: r.fuentes, consultas: r.consultas, sugerencias: r.sugerencias, modelo: r.modelo });
    }
    return json({ error: 'Acción no reconocida' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message || 'Error en la búsqueda' }, 500);
  }
});
