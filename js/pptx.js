// =====================================================================
//  PPTX: generador mínimo de presentaciones PowerPoint (16:9) en el
//  navegador, sin librerías externas. Formas, textos con viñetas,
//  imágenes (PNG/JPEG o SVG convertido a PNG) y tablas.
//  Uso: const p = PPTX.nueva({ titulo }); const s = p.diapo('FFFFFF');
//       s.rect(...); s.texto(...); s.imagen(await PPTX.img(src), ...);
//       const blob = await p.blob();
//  Medidas en pulgadas (diapositiva de 13,333 × 7,5).
// =====================================================================
(() => {
  const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  const RT = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const X = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  const E = (v) => Math.round(v * 914400);
  const col = (c) => String(c || '000000').replace('#', '').toUpperCase();
  const enc = new TextEncoder();

  // ------------------------------------------------------------------ ZIP (sin compresión)
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const zip = (files) => {
    const partes = [], central = []; let off = 0;
    const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
    for (const f of files) {
      const nm = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, c = crc32(data);
      const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, c, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
      partes.push(new Uint8Array(h.buffer), nm, data);
      const ce = new DataView(new ArrayBuffer(46)); ce.setUint32(0, 0x02014b50, true); ce.setUint16(4, 20, true); ce.setUint16(6, 20, true); ce.setUint16(8, 0x0800, true); ce.setUint16(10, 0, true); ce.setUint16(12, dt, true); ce.setUint16(14, dd, true); ce.setUint32(16, c, true); ce.setUint32(20, data.length, true); ce.setUint32(24, data.length, true); ce.setUint16(28, nm.length, true); ce.setUint32(42, off, true);
      central.push(new Uint8Array(ce.buffer), nm); off += 30 + nm.length + data.length;
    }
    const tam = central.reduce((s, x) => s + x.length, 0), fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, files.length, true); fin.setUint16(10, files.length, true); fin.setUint32(12, tam, true); fin.setUint32(16, off, true);
    return new Blob([...partes, ...central, new Uint8Array(fin.buffer)], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  };

  // ------------------------------------------------------------------ imágenes → PNG/JPEG con su tamaño
  const cache = new Map();
  const img = (src, { ancho = 1200, jpg = false } = {}) => {
    if (!src) return Promise.resolve(null);
    const clave = `${src.length}|${src.slice(0, 80)}|${src.slice(-80)}|${ancho}|${jpg}`; if (cache.has(clave)) return cache.get(clave);
    const pr = new Promise((res) => {
      const esSvg = /^\s*<svg/i.test(src); const url = esSvg ? URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' })) : src;
      const im = new Image(); im.onload = () => {
        const w0 = im.naturalWidth || 800, h0 = im.naturalHeight || 600, k = esSvg ? ancho / w0 : Math.min(1, ancho / Math.max(w0, h0));
        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w0 * k)); c.height = Math.max(1, Math.round(h0 * k)); const g = c.getContext('2d');
        if (jpg) { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); } g.drawImage(im, 0, 0, c.width, c.height); if (esSvg) URL.revokeObjectURL(url);
        const du = c.toDataURL(jpg ? 'image/jpeg' : 'image/png', 0.85), bin = atob(du.split(',')[1]), b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
        res({ data: b, ext: jpg ? 'jpeg' : 'png', w: c.width, h: c.height });
      };
      im.onerror = () => { if (esSvg) URL.revokeObjectURL(url); res(null); }; im.src = url;
    });
    cache.set(clave, pr); return pr;
  };

  // ------------------------------------------------------------------ texto
  // parrafos: string | [string | {t, runs:[{t,b,i,color,sz}], b, color, sz, bullet, num, align, spcAfter}]
  const runXml = (r, base) => { const sz = r.sz || base.sz || 18, c = r.color || base.color || '1F2937', b = r.b ?? base.b, it = r.i ?? base.i; return `<a:r><a:rPr lang="es-CO" sz="${Math.round(sz * 100)}" b="${b ? 1 : 0}" i="${it ? 1 : 0}" dirty="0"><a:solidFill><a:srgbClr val="${col(c)}"/></a:solidFill><a:latin typeface="${X(r.font || base.font || 'Calibri')}"/><a:cs typeface="${X(r.font || base.font || 'Calibri')}"/></a:rPr><a:t>${X(r.t)}</a:t></a:r>`; };
  const parXml = (p, o) => {
    if (typeof p === 'string') p = { t: p };
    const base = { sz: p.sz || o.sz, color: p.color || o.color, b: p.b ?? o.b, i: p.i ?? o.i, font: p.font || o.font }, al = { l: 'l', c: 'ctr', r: 'r', j: 'just' }[p.align || o.align || 'l'];
    const bul = p.bullet ?? o.bullet, num = p.num ?? o.num, ind = Math.round((base.sz || 18) * 12700 * 1.25);
    const ppr = `<a:pPr algn="${al}"${bul || num ? ` marL="${ind}" indent="-${ind}"` : ''}><a:lnSpc><a:spcPct val="${Math.round((p.lh || o.lh || 1) * 100000)}"/></a:lnSpc><a:spcBef><a:spcPts val="0"/></a:spcBef><a:spcAft><a:spcPts val="${Math.round((p.spcAfter ?? o.spcAfter ?? 6) * 100)}"/></a:spcAft>${bul ? `<a:buClr><a:srgbClr val="${col(o.bulletColor || '0096BE')}"/></a:buClr><a:buSzPct val="110000"/><a:buFont typeface="Arial"/><a:buChar char="${X(typeof bul === 'string' ? bul : '•')}"/>` : num ? `<a:buClr><a:srgbClr val="${col(o.bulletColor || '0096BE')}"/></a:buClr><a:buFont typeface="+mj-lt"/><a:buAutoNum type="arabicPeriod"/>` : '<a:buNone/>'}</a:pPr>`;
    const runs = (p.runs || [{ t: p.t }]).filter((r) => r.t !== undefined && r.t !== null);
    return `<a:p>${ppr}${runs.map((r) => runXml(r, base)).join('')}<a:endParaRPr lang="es-CO" sz="${Math.round((base.sz || 18) * 100)}" dirty="0"/></a:p>`;
  };
  const txBody = (pars, o = {}) => {
    const l = Array.isArray(pars) ? pars : String(pars ?? '').split('\n');
    const ins = E(o.pad ?? 0.08), anc = { t: 't', m: 'ctr', b: 'b' }[o.valign || 't'];
    return `<p:txBody><a:bodyPr wrap="square" lIns="${ins}" tIns="${ins}" rIns="${ins}" bIns="${ins}" rtlCol="0" anchor="${anc}">${o.autofit === false ? '<a:noAutofit/>' : '<a:normAutofit/>'}</a:bodyPr><a:lstStyle/>${(l.length ? l : ['']).map((p) => parXml(p, o)).join('')}</p:txBody>`;
  };
  const lineXml = (ln) => (ln ? `<a:ln w="${Math.round((ln.w || 1) * 12700)}"><a:solidFill><a:srgbClr val="${col(ln.color)}"/></a:solidFill>${ln.dash ? '<a:prstDash val="dash"/>' : ''}</a:ln>` : '<a:ln><a:noFill/></a:ln>');
  const fillXml = (f, alpha) => (f ? `<a:solidFill><a:srgbClr val="${col(f)}">${alpha != null ? `<a:alpha val="${Math.round(alpha * 100000)}"/>` : ''}</a:srgbClr></a:solidFill>` : '<a:noFill/>');

  class Diapo {
    constructor(pres, n, bg) { this.pres = pres; this.n = n; this.bg = bg || 'FFFFFF'; this.xml = []; this.rels = []; this.id = 2; this.notas = ''; }
    forma(x, y, w, h, o = {}) {
      const id = this.id++, geo = o.forma || 'rect', adj = o.radio != null && geo === 'roundRect' ? `<a:gd name="adj" fmla="val ${Math.round(o.radio * 100000)}"/>` : '';
      const sombra = o.sombra ? '<a:effectLst><a:outerShdw blurRad="76200" dist="25400" dir="5400000" algn="t" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="18000"/></a:srgbClr></a:outerShdw></a:effectLst>' : '';
      this.xml.push(`<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${X(o.nombre || (o.texto != null ? 'Texto ' : 'Forma ') + id)}"/><p:cNvSpPr${o.texto != null && !o.fill ? ' txBox="1"' : ''}/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm${o.rot ? ` rot="${Math.round(o.rot * 60000)}"` : ''}><a:off x="${E(x)}" y="${E(y)}"/><a:ext cx="${E(w)}" cy="${E(h)}"/></a:xfrm><a:prstGeom prst="${geo}"><a:avLst>${adj}</a:avLst></a:prstGeom>${fillXml(o.fill, o.alpha)}${lineXml(o.line)}${sombra}</p:spPr>${o.texto != null ? txBody(o.texto, o) : `<p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="es-CO" dirty="0"/></a:p></p:txBody>`}</p:sp>`);
      return this;
    }
    rect(x, y, w, h, fill, o = {}) { return this.forma(x, y, w, h, { ...o, fill }); }
    texto(x, y, w, h, texto, o = {}) { return this.forma(x, y, w, h, { ...o, texto }); }
    linea(x1, y1, x2, y2, o = {}) {
      const id = this.id++, fx = x2 < x1, fy = y2 < y1;
      this.xml.push(`<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="${id}" name="Línea ${id}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr><a:xfrm${fx ? ' flipH="1"' : ''}${fy ? ' flipV="1"' : ''}><a:off x="${E(Math.min(x1, x2))}" y="${E(Math.min(y1, y2))}"/><a:ext cx="${E(Math.abs(x2 - x1))}" cy="${E(Math.abs(y2 - y1))}"/></a:xfrm><a:prstGeom prst="line"><a:avLst/></a:prstGeom>${lineXml({ w: o.w || 1, color: o.color || 'BFBFBF', dash: o.dash })}</p:spPr></p:cxnSp>`);
      return this;
    }
    // im = resultado de PPTX.img(); ajuste 'contain' (default) o 'cover' (recorta)
    imagen(im, x, y, w, h, o = {}) {
      if (!im) return this; const id = this.id++, rid = `rId${this.rels.length + 2}`, nombre = this.pres.media(im);
      this.rels.push({ id: rid, type: 'image', target: `../media/${nombre}` });
      const r = im.w / im.h; let cx = w, cy = h, ox = x, oy = y, src = '';
      if (o.ajuste === 'cover') { if (r > w / h) { const vis = (w / h) / r, c = (1 - vis) / 2; src = `<a:srcRect l="${Math.round(c * 100000)}" r="${Math.round(c * 100000)}"/>`; } else { const vis = r / (w / h), c = (1 - vis) / 2; src = `<a:srcRect t="${Math.round(c * 100000)}" b="${Math.round(c * 100000)}"/>`; } }
      else if (r > w / h) { cy = w / r; oy = y + (h - cy) / 2; } else { cx = h * r; ox = x + (w - cx) / 2; }
      this.xml.push(`<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="Imagen ${id}" descr="${X(o.alt || '')}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rid}"/>${src}<a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${E(ox)}" y="${E(oy)}"/><a:ext cx="${E(cx)}" cy="${E(cy)}"/></a:xfrm><a:prstGeom prst="${o.forma || 'rect'}"><a:avLst/></a:prstGeom>${o.line ? lineXml(o.line) : ''}</p:spPr></p:pic>`);
      return this;
    }
    // filas: [[celda...]] celda = string | {t, b, fill, color, align}; o: {anchos:[pulg], alto, sz, cabecera:'0096BE', cabColor:'FFFFFF', zebra:'F2FAFD'}
    tabla(x, y, w, filas, o = {}) {
      const id = this.id++, nc = Math.max(...filas.map((f) => f.length)), anchos = o.anchos || Array(nc).fill(w / nc), tot = anchos.reduce((a, b) => a + b, 0), aw = anchos.map((a) => (a / tot) * w), alto = o.alto || 0.4, sz = o.sz || 12;
      const borde = (t) => `<a:${t} w="9525"><a:solidFill><a:srgbClr val="${col(o.borde || 'C9D6DF')}"/></a:solidFill></a:${t}>`;
      const filasXml = filas.map((f, i) => `<a:tr h="${E(alto)}">${f.map((c) => { const cc = typeof c === 'object' && c ? c : { t: c }; const cab = i === 0 && o.cabecera; const fill = cc.fill || (cab ? o.cabecera : o.zebra && i % 2 === 0 ? o.zebra : 'FFFFFF');
        return `<a:tc>${txBody(String(cc.t ?? '').split('\n'), { sz: cc.sz || sz, b: cc.b ?? cab, color: cc.color || (cab ? o.cabColor || 'FFFFFF' : '1F2937'), align: cc.align || (cab ? 'c' : 'l'), spcAfter: 0, pad: 0 }).replace('<p:txBody>', '<a:txBody>').replace('</p:txBody>', '</a:txBody>').replace(/<a:bodyPr[^>]*>.*?<\/a:bodyPr>/, '<a:bodyPr/>')}<a:tcPr marL="${E(0.08)}" marR="${E(0.08)}" marT="${E(0.04)}" marB="${E(0.04)}" anchor="ctr">${borde('lnL')}${borde('lnR')}${borde('lnT')}${borde('lnB')}${fillXml(fill)}</a:tcPr></a:tc>`; }).join('')}</a:tr>`).join('');
      this.xml.push(`<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="Tabla ${id}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${E(x)}" y="${E(y)}"/><a:ext cx="${E(w)}" cy="${E(alto * filas.length)}"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>${aw.map((a) => `<a:gridCol w="${E(a)}"/>`).join('')}</a:tblGrid>${filasXml}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`);
      return this;
    }
    xmlDiapo() { return `${HEAD}<p:sld ${NS}><p:cSld><p:bg><p:bgPr>${fillXml(this.bg)}<a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${this.xml.join('')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`; }
    xmlRels() { return `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RT}slideLayout" Target="../slideLayouts/slideLayout7.xml"/>${this.rels.map((r) => `<Relationship Id="${r.id}" Type="${RT}${r.type}" Target="${r.target}"/>`).join('')}</Relationships>`; }
  }

  class Presentacion {
    constructor({ titulo = 'Presentación', autor = 'IBCOL' } = {}) { this.titulo = titulo; this.autor = autor; this.diapos = []; this.medios = []; this.W = 13.333; this.H = 7.5; }
    diapo(bg) { const d = new Diapo(this, this.diapos.length + 1, bg); this.diapos.push(d); return d; }
    media(im) { let m = this.medios.find((x) => x.im === im); if (!m) { m = { im, nombre: `image${this.medios.length + 1}.${im.ext}` }; this.medios.push(m); } return m.nombre; }
    async blob() {
      const B = window.PPT_BASE, n = this.diapos.length, ahora = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
      const ct = `${HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout7.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/><Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/><Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>${this.diapos.map((d) => `<Override PartName="/ppt/slides/slide${d.n}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')}</Types>`;
      const rels = `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RT}officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
      const core = `${HEAD}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${X(this.titulo)}</dc:title><dc:creator>${X(this.autor)}</dc:creator><cp:lastModifiedBy>${X(this.autor)}</cp:lastModifiedBy><cp:revision>1</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">${ahora}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${ahora}</dcterms:modified></cp:coreProperties>`;
      const pres = B['ppt/presentation.xml'].replace('{{SLDS}}', n ? `<p:sldIdLst>${this.diapos.map((d, i) => `<p:sldId id="${256 + i}" r:id="rId${100 + i}"/>`).join('')}</p:sldIdLst>` : '');
      const presRels = `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RT}slideMaster" Target="slideMasters/slideMaster1.xml"/><Relationship Id="rId3" Type="${RT}presProps" Target="presProps.xml"/><Relationship Id="rId4" Type="${RT}viewProps" Target="viewProps.xml"/><Relationship Id="rId5" Type="${RT}theme" Target="theme/theme1.xml"/><Relationship Id="rId6" Type="${RT}tableStyles" Target="tableStyles.xml"/>${this.diapos.map((d, i) => `<Relationship Id="rId${100 + i}" Type="${RT}slide" Target="slides/slide${d.n}.xml"/>`).join('')}</Relationships>`;
      const files = [{ name: '[Content_Types].xml', data: ct }, { name: '_rels/.rels', data: rels }, { name: 'docProps/core.xml', data: core }, { name: 'ppt/presentation.xml', data: pres }, { name: 'ppt/_rels/presentation.xml.rels', data: presRels }];
      Object.entries(B).forEach(([k, v]) => { if (k !== 'ppt/presentation.xml') files.push({ name: k, data: v }); });
      this.diapos.forEach((d) => { files.push({ name: `ppt/slides/slide${d.n}.xml`, data: d.xmlDiapo() }, { name: `ppt/slides/_rels/slide${d.n}.xml.rels`, data: d.xmlRels() }); });
      this.medios.forEach((m) => files.push({ name: `ppt/media/${m.nombre}`, data: m.im.data }));
      return zip(files);
    }
  }
  window.PPTX = { nueva: (o) => new Presentacion(o), img, X };
})();
