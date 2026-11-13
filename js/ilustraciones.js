// =====================================================================
//  Ilustraciones vectoriales propias (SVG) para las presentaciones de
//  capacitación: equipos biomédicos genéricos y elementos de limpieza y
//  desinfección. Se convierten a PNG al armar el PowerPoint.
// =====================================================================
(() => {
  const N = '#0B3B5C', AZ = '#0096BE', CL = '#D9F1F8', TE = '#19B5A5', GR = '#9AA9B5', G2 = '#E6ECF0', BL = '#FFFFFF', NA = '#F2A33A', RO = '#E05252', AM = '#F5C542', VE = '#3CC48A';
  const svg = (c, vb = '0 0 400 300') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="800" height="${vb === '0 0 400 300' ? 600 : 800}">${c}</svg>`;
  const sombra = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.09}" fill="${N}" opacity=".12"/>`;
  const IL = {
    centrifuga: svg(`${sombra(200, 262, 150)}
      <rect x="62" y="128" width="276" height="126" rx="22" fill="${BL}" stroke="${N}" stroke-width="5"/>
      <rect x="62" y="200" width="276" height="54" rx="22" fill="${CL}" stroke="${N}" stroke-width="5"/>
      <path d="M70 140 Q200 40 330 140 Z" fill="${AZ}" stroke="${N}" stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="200" cy="118" rx="70" ry="22" fill="${N}" opacity=".85"/>
      <g fill="${NA}" stroke="${BL}" stroke-width="2"><rect x="146" y="110" width="22" height="9" rx="4" transform="rotate(-12 157 114)"/><rect x="232" y="110" width="22" height="9" rx="4" transform="rotate(12 243 114)"/><rect x="190" y="99" width="20" height="8" rx="4"/><rect x="190" y="125" width="20" height="8" rx="4"/></g>
      <circle cx="200" cy="117" r="7" fill="${GR}" stroke="${BL}" stroke-width="2"/>
      <rect x="92" y="212" width="96" height="30" rx="6" fill="${N}"/><text x="140" y="234" font-family="Arial" font-weight="bold" font-size="20" fill="${VE}" text-anchor="middle">3500</text>
      <circle cx="230" cy="227" r="11" fill="${VE}" stroke="${N}" stroke-width="3"/><circle cx="264" cy="227" r="11" fill="${RO}" stroke="${N}" stroke-width="3"/><rect x="286" y="216" width="30" height="22" rx="5" fill="${BL}" stroke="${N}" stroke-width="3"/>
      <path d="M318 82 a40 40 0 0 1 22 30" fill="none" stroke="${TE}" stroke-width="5" stroke-linecap="round"/><path d="M336 104 l5 10 l8 -8" fill="none" stroke="${TE}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`),
    electrocardiografo: svg(`${sombra(190, 262, 150)}
      <path d="M118 96 L118 40 L262 40 L262 96" fill="#FDECEF" stroke="${N}" stroke-width="4"/>
      <g stroke="#F4B6C2" stroke-width="1">${Array.from({ length: 14 }, (_, i) => `<line x1="${128 + i * 10}" y1="42" x2="${128 + i * 10}" y2="96"/>`).join('')}${Array.from({ length: 5 }, (_, i) => `<line x1="120" y1="${50 + i * 10}" x2="260" y2="${50 + i * 10}"/>`).join('')}</g>
      <polyline points="122,72 145,72 152,72 158,52 164,86 170,72 196,72 202,72 208,52 214,86 220,72 258,72" fill="none" stroke="${N}" stroke-width="3"/>
      <rect x="52" y="96" width="276" height="158" rx="18" fill="${BL}" stroke="${N}" stroke-width="5"/>
      <rect x="72" y="116" width="150" height="96" rx="8" fill="${N}"/>
      <polyline points="80,168 100,168 106,168 112,138 120,190 126,168 150,168 156,168 162,138 170,190 176,168 214,168" fill="none" stroke="${VE}" stroke-width="4" stroke-linejoin="round"/>
      <g fill="${CL}" stroke="${N}" stroke-width="3"><rect x="238" y="118" width="70" height="20" rx="5"/><rect x="238" y="146" width="32" height="20" rx="5"/><rect x="276" y="146" width="32" height="20" rx="5"/><rect x="238" y="174" width="32" height="20" rx="5"/><rect x="276" y="174" width="32" height="20" rx="5" fill="${VE}"/></g>
      <rect x="72" y="224" width="236" height="14" rx="7" fill="${CL}"/>
      <path d="M328 200 C360 200 352 140 368 128 M328 214 C360 222 360 172 374 168 M328 228 C362 248 356 214 370 214" fill="none" stroke="${GR}" stroke-width="4"/>
      <g stroke="${N}" stroke-width="3"><circle cx="370" cy="124" r="10" fill="${AM}"/><circle cx="378" cy="166" r="10" fill="${RO}"/><circle cx="374" cy="214" r="10" fill="${VE}"/></g>`),
    electrobisturi: svg(`${sombra(170, 262, 140)}
      <rect x="40" y="92" width="240" height="162" rx="18" fill="${BL}" stroke="${N}" stroke-width="5"/>
      <rect x="40" y="92" width="240" height="34" rx="18" fill="${AZ}"/><rect x="40" y="110" width="240" height="16" fill="${AZ}"/>
      <text x="160" y="116" font-family="Arial" font-weight="bold" font-size="17" fill="${BL}" text-anchor="middle">ESU</text>
      <rect x="58" y="140" width="96" height="52" rx="8" fill="${AM}" stroke="${N}" stroke-width="3"/><text x="106" y="160" font-family="Arial" font-weight="bold" font-size="13" fill="${N}" text-anchor="middle">CUT</text><text x="106" y="184" font-family="Arial" font-weight="bold" font-size="20" fill="${N}" text-anchor="middle">30 W</text>
      <rect x="166" y="140" width="96" height="52" rx="8" fill="#7CC4F2" stroke="${N}" stroke-width="3"/><text x="214" y="160" font-family="Arial" font-weight="bold" font-size="13" fill="${N}" text-anchor="middle">COAG</text><text x="214" y="184" font-family="Arial" font-weight="bold" font-size="20" fill="${N}" text-anchor="middle">25 W</text>
      <g stroke="${N}" stroke-width="3"><circle cx="76" cy="222" r="11" fill="${CL}"/><circle cx="110" cy="222" r="11" fill="${CL}"/><rect x="200" y="212" width="58" height="22" rx="6" fill="${N}"/></g>
      <path d="M262 222 C310 222 290 140 316 118" fill="none" stroke="${GR}" stroke-width="5"/>
      <g transform="translate(-34 26) rotate(-40 350 80)"><rect x="318" y="70" width="70" height="20" rx="10" fill="${CL}" stroke="${N}" stroke-width="4"/><rect x="334" y="64" width="12" height="8" rx="3" fill="${AM}" stroke="${N}" stroke-width="2"/><rect x="352" y="64" width="12" height="8" rx="3" fill="#7CC4F2" stroke="${N}" stroke-width="2"/><path d="M388 80 L410 80" stroke="${GR}" stroke-width="5" stroke-linecap="round"/></g>
      <path d="M229 234 C250 280 300 280 320 260" fill="none" stroke="${GR}" stroke-width="5"/>
      <rect x="312" y="232" width="74" height="40" rx="10" fill="${TE}" stroke="${N}" stroke-width="4"/><rect x="324" y="242" width="50" height="20" rx="5" fill="${BL}" opacity=".6"/>`),
    ecografo: svg(`${sombra(200, 278, 120)}
      <rect x="108" y="16" width="184" height="120" rx="12" fill="${N}"/>
      <rect x="120" y="28" width="160" height="96" rx="6" fill="#111"/>
      <path d="M200 38 L246 112 A70 70 0 0 1 154 112 Z" fill="#555"/><path d="M200 38 L238 104 A60 60 0 0 1 162 104 Z" fill="#888" opacity=".6"/>
      <ellipse cx="196" cy="88" rx="16" ry="10" fill="#222"/><ellipse cx="216" cy="70" rx="8" ry="5" fill="#ddd" opacity=".7"/>
      <rect x="190" y="136" width="20" height="16" fill="${GR}"/>
      <path d="M86 152 L314 152 L300 192 L100 192 Z" fill="${BL}" stroke="${N}" stroke-width="5" stroke-linejoin="round"/>
      <g fill="${CL}" stroke="${N}" stroke-width="2">${Array.from({ length: 7 }, (_, i) => `<rect x="${118 + i * 18}" y="162" width="14" height="10" rx="2"/>`).join('')}</g>
      <circle cx="270" cy="172" r="11" fill="${AZ}" stroke="${N}" stroke-width="3"/>
      <rect x="186" y="192" width="28" height="56" fill="${G2}" stroke="${N}" stroke-width="4"/>
      <path d="M130 266 L270 266 L250 246 L150 246 Z" fill="${AZ}" stroke="${N}" stroke-width="4" stroke-linejoin="round"/>
      <g fill="${N}"><circle cx="140" cy="272" r="8"/><circle cx="260" cy="272" r="8"/></g>
      <path d="M100 176 C58 186 50 230 70 250" fill="none" stroke="${GR}" stroke-width="4"/>
      <path d="M58 248 L82 248 L86 262 Q70 276 54 262 Z" fill="${TE}" stroke="${N}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M328 60 a28 28 0 0 1 0 40 M342 48 a46 46 0 0 1 0 64" fill="none" stroke="${TE}" stroke-width="4" stroke-linecap="round"/>`),
    tens: svg(`${sombra(200, 262, 150)}
      <rect x="138" y="58" width="124" height="176" rx="26" fill="${BL}" stroke="${N}" stroke-width="5"/>
      <rect x="156" y="78" width="88" height="54" rx="8" fill="${N}"/>
      <text x="200" y="104" font-family="Arial" font-weight="bold" font-size="20" fill="${VE}" text-anchor="middle">CH1 12</text><text x="200" y="124" font-family="Arial" font-size="10.5" fill="${VE}" text-anchor="middle">100 Hz · 20 min</text>
      <circle cx="200" cy="178" r="26" fill="${CL}" stroke="${N}" stroke-width="4"/><path d="M200 160 L200 172" stroke="${N}" stroke-width="4" stroke-linecap="round"/>
      <g fill="${AZ}" stroke="${N}" stroke-width="3"><circle cx="164" cy="214" r="9"/><circle cx="236" cy="214" r="9"/></g>
      <path d="M170 58 C160 20 100 30 84 70 M230 58 C240 20 300 30 316 70" fill="none" stroke="${GR}" stroke-width="4"/>
      <path d="M84 70 C70 100 60 120 54 150 M84 70 C96 100 100 130 104 160 M316 70 C304 100 300 130 296 160 M316 70 C330 100 340 120 346 150" fill="none" stroke="${GR}" stroke-width="3"/>
      <g fill="${TE}" stroke="${N}" stroke-width="3"><rect x="30" y="150" width="46" height="46" rx="8"/><rect x="82" y="160" width="46" height="46" rx="8"/><rect x="274" y="160" width="46" height="46" rx="8"/><rect x="324" y="150" width="46" height="46" rx="8"/></g>
      <g fill="${BL}" opacity=".5"><rect x="40" y="160" width="26" height="26" rx="4"/><rect x="92" y="170" width="26" height="26" rx="4"/><rect x="284" y="170" width="26" height="26" rx="4"/><rect x="334" y="160" width="26" height="26" rx="4"/></g>`),
    equipo: svg(`${sombra(200, 262, 140)}
      <rect x="70" y="56" width="260" height="176" rx="18" fill="${BL}" stroke="${N}" stroke-width="5"/>
      <rect x="90" y="76" width="160" height="110" rx="8" fill="${N}"/>
      <polyline points="98,130 120,130 128,104 138,152 146,130 170,130 178,112 186,140 194,130 242,130" fill="none" stroke="${VE}" stroke-width="4" stroke-linejoin="round"/>
      <text x="104" y="172" font-family="Arial" font-weight="bold" font-size="18" fill="${AM}">98%</text><text x="236" y="172" font-family="Arial" font-weight="bold" font-size="18" fill="#7CC4F2" text-anchor="end">72</text>
      <g fill="${CL}" stroke="${N}" stroke-width="3"><rect x="266" y="80" width="46" height="22" rx="5"/><rect x="266" y="110" width="46" height="22" rx="5"/><rect x="266" y="140" width="46" height="22" rx="5" fill="${VE}"/></g>
      <rect x="90" y="200" width="220" height="14" rx="7" fill="${CL}"/>
      <path d="M330 140 a30 30 0 0 1 30 30" fill="none" stroke="${TE}" stroke-width="5" stroke-linecap="round"/>`),
    limpieza: svg(`${sombra(200, 268, 160)}
      <path d="M110 110 L150 110 L158 140 L176 150 L176 262 L84 262 L84 150 L102 140 Z" fill="${AZ}" stroke="${N}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="96" y="176" width="68" height="54" rx="8" fill="${BL}"/><path d="M114 204 l10 10 l20 -22" fill="none" stroke="${TE}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M104 110 L104 84 L172 84 L186 98 L150 98 L150 110" fill="${BL}" stroke="${N}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M150 98 L170 120" stroke="${N}" stroke-width="6" stroke-linecap="round"/>
      <g fill="${TE}" opacity=".8"><circle cx="204" cy="88" r="5"/><circle cx="220" cy="78" r="4"/><circle cx="216" cy="100" r="4"/><circle cx="234" cy="92" r="3"/><circle cx="238" cy="70" r="3"/><circle cx="232" cy="110" r="3"/></g>
      <path d="M210 200 C230 180 300 176 330 196 L338 252 C300 268 240 266 214 254 Z" fill="${AM}" stroke="${N}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M226 214 C254 204 296 202 322 214 M228 234 C260 226 296 226 326 234" fill="none" stroke="${N}" stroke-width="2" opacity=".35"/>
      <g fill="${BL}" stroke="${AZ}" stroke-width="3"><circle cx="290" cy="128" r="16"/><circle cx="318" cy="150" r="10"/><circle cx="262" cy="150" r="8"/></g>`),
    epp: svg(`${sombra(200, 268, 160)}
      <path d="M70 250 L70 150 Q70 136 82 136 Q94 136 94 150 L94 118 Q94 104 106 104 Q118 104 118 118 L118 110 Q118 96 130 96 Q142 96 142 110 L142 120 Q142 108 154 108 Q166 108 166 122 L166 196 Q170 180 186 172 Q198 168 200 178 Q176 214 166 250 Z" fill="#7CC4F2" stroke="${N}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="70" y="232" width="96" height="30" rx="6" fill="${AZ}" stroke="${N}" stroke-width="5"/>
      <path d="M232 128 Q300 104 368 128 L360 196 Q300 226 240 196 Z" fill="${BL}" stroke="${N}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M244 148 Q300 132 356 148 M246 168 Q300 154 354 168 M250 186 Q300 176 350 186" fill="none" stroke="${GR}" stroke-width="3"/>
      <path d="M232 132 Q206 132 210 160 Q214 184 240 192 M368 132 Q394 132 390 160 Q386 184 360 192" fill="none" stroke="${N}" stroke-width="4"/>
      <circle cx="300" cy="72" r="26" fill="${TE}" stroke="${N}" stroke-width="4"/><path d="M288 72 l8 8 l16 -16" fill="none" stroke="${BL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`),
    manos: svg(`${sombra(200, 270, 150)}
      <path d="M150 40 L150 70 Q150 80 160 80 L176 80" fill="none" stroke="${GR}" stroke-width="14" stroke-linecap="round"/>
      <g fill="${AZ}" opacity=".85"><path d="M172 96 q6 12 0 18 q-6 -6 0 -18z"/><path d="M186 110 q6 12 0 18 q-6 -6 0 -18z"/><path d="M168 126 q6 12 0 18 q-6 -6 0 -18z"/></g>
      <path d="M104 250 C96 210 110 170 140 150 L186 132 Q200 128 204 140 Q206 150 194 156 L166 168 L232 150 Q246 148 248 160 Q250 172 236 176 L250 174 Q264 174 264 186 Q264 198 250 200 L256 200 Q268 202 266 214 Q264 226 250 226 L196 236 Q160 262 104 250 Z" fill="#F6D2B8" stroke="${N}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M296 250 C304 214 292 180 266 162" fill="none" stroke="${N}" stroke-width="5"/>
      <g fill="${BL}" stroke="${AZ}" stroke-width="3"><circle cx="232" cy="120" r="14"/><circle cx="262" cy="134" r="9"/><circle cx="110" cy="150" r="11"/><circle cx="290" cy="210" r="12"/><circle cx="96" cy="190" r="7"/></g>`),
    checklist: svg(`${sombra(200, 274, 120)}
      <rect x="100" y="34" width="200" height="238" rx="16" fill="${AZ}" stroke="${N}" stroke-width="5"/>
      <rect x="116" y="54" width="168" height="206" rx="8" fill="${BL}"/>
      <rect x="162" y="22" width="76" height="30" rx="8" fill="${GR}" stroke="${N}" stroke-width="4"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="132" y="${78 + i * 44}" width="24" height="24" rx="5" fill="${CL}" stroke="${N}" stroke-width="3"/><path d="M137 ${90 + i * 44} l6 6 l12 -14" fill="none" stroke="${i < 3 ? TE : 'none'}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><rect x="168" y="${84 + i * 44}" width="${i % 2 ? 84 : 100}" height="10" rx="5" fill="${G2}"/>`).join('')}`),
    alerta: svg(`${sombra(200, 266, 130)}
      <path d="M200 36 L330 254 L70 254 Z" fill="${AM}" stroke="${N}" stroke-width="8" stroke-linejoin="round"/>
      <rect x="188" y="104" width="24" height="88" rx="12" fill="${N}"/><circle cx="200" cy="222" r="14" fill="${N}"/>`),
    mantenimiento: svg(`${sombra(200, 268, 150)}
      <g transform="translate(250 130)"><g fill="${GR}" stroke="${N}" stroke-width="4">${Array.from({ length: 8 }, (_, i) => `<rect x="-14" y="-82" width="28" height="30" rx="5" transform="rotate(${i * 45})"/>`).join('')}<circle r="62"/></g><circle r="24" fill="${BL}" stroke="${N}" stroke-width="4"/></g>
      <g transform="rotate(-45 150 170)"><rect x="70" y="156" width="150" height="28" rx="14" fill="${AZ}" stroke="${N}" stroke-width="5"/><path d="M220 140 a34 34 0 1 1 0 60 l0 -16 l18 0 l0 -28 l-18 0 z" fill="${AZ}" stroke="${N}" stroke-width="5" stroke-linejoin="round"/></g>`),
    metrologia: svg(`${sombra(200, 268, 140)}
      <circle cx="200" cy="150" r="110" fill="${BL}" stroke="${N}" stroke-width="6"/>
      <path d="M110 186 A96 96 0 1 1 290 186" fill="none" stroke="${CL}" stroke-width="20"/><path d="M110 186 A96 96 0 0 1 150 70" fill="none" stroke="${VE}" stroke-width="20"/><path d="M250 70 A96 96 0 0 1 290 186" fill="none" stroke="${RO}" stroke-width="20"/>
      ${Array.from({ length: 11 }, (_, i) => { const a = (-210 + i * 24) * Math.PI / 180; return `<line x1="${200 + Math.cos(a) * 70}" y1="${150 + Math.sin(a) * 70}" x2="${200 + Math.cos(a) * 82}" y2="${150 + Math.sin(a) * 82}" stroke="${N}" stroke-width="4"/>`; }).join('')}
      <path d="M200 150 L250 96" stroke="${N}" stroke-width="7" stroke-linecap="round"/><circle cx="200" cy="150" r="14" fill="${N}"/>
      <text x="200" y="216" font-family="Arial" font-weight="bold" font-size="22" fill="${N}" text-anchor="middle">OK</text>`),
    tecnovigilancia: svg(`${sombra(200, 272, 130)}
      <path d="M200 30 L300 66 L300 140 C300 206 256 244 200 266 C144 244 100 206 100 140 L100 66 Z" fill="${AZ}" stroke="${N}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M200 52 L280 80 L280 140 C280 192 246 224 200 242 Z" fill="${BL}" opacity=".18"/>
      <rect x="188" y="88" width="24" height="88" rx="12" fill="${BL}"/><circle cx="200" cy="208" r="14" fill="${BL}"/>
      <g transform="translate(300 200)"><circle r="34" fill="${BL}" stroke="${N}" stroke-width="6"/><path d="M24 24 L56 56" stroke="${N}" stroke-width="12" stroke-linecap="round"/></g>`),
    desconectar: svg(`${sombra(200, 262, 150)}
      <rect x="40" y="110" width="110" height="80" rx="16" fill="${BL}" stroke="${N}" stroke-width="5"/><g fill="${N}"><rect x="76" y="134" width="10" height="32" rx="4"/><rect x="104" y="134" width="10" height="32" rx="4"/></g>
      <path d="M232 150 L350 150" stroke="${GR}" stroke-width="12" stroke-linecap="round"/>
      <rect x="196" y="116" width="70" height="68" rx="14" fill="${AZ}" stroke="${N}" stroke-width="5"/>
      <g fill="${GR}" stroke="${N}" stroke-width="3"><rect x="168" y="128" width="30" height="12" rx="4"/><rect x="168" y="160" width="30" height="12" rx="4"/></g>
      <g stroke="${RO}" stroke-width="6" stroke-linecap="round"><path d="M156 90 L168 106"/><path d="M180 82 L182 100"/><path d="M156 214 L168 198"/><path d="M180 222 L182 204"/></g>`),
    tiempo: svg(`${sombra(200, 270, 120)}
      <circle cx="200" cy="148" r="108" fill="${BL}" stroke="${N}" stroke-width="7"/>
      <path d="M200 148 L200 40 A108 108 0 0 1 293 202 Z" fill="${CL}"/>
      ${Array.from({ length: 12 }, (_, i) => { const a = i * 30 * Math.PI / 180; return `<line x1="${200 + Math.sin(a) * 88}" y1="${148 - Math.cos(a) * 88}" x2="${200 + Math.sin(a) * 100}" y2="${148 - Math.cos(a) * 100}" stroke="${N}" stroke-width="${i % 3 ? 3 : 6}"/>`; }).join('')}
      <path d="M200 148 L200 78 M200 148 L250 176" stroke="${N}" stroke-width="8" stroke-linecap="round"/><circle cx="200" cy="148" r="10" fill="${AZ}"/>`),
    evaluacion: svg(`${sombra(200, 274, 130)}
      <rect x="96" y="28" width="180" height="240" rx="12" fill="${BL}" stroke="${N}" stroke-width="5"/>
      <text x="186" y="74" font-family="Arial" font-weight="bold" font-size="26" fill="${AZ}" text-anchor="middle">TEST</text>
      ${[0, 1, 2, 3].map((i) => `<circle cx="126" cy="${108 + i * 38}" r="10" fill="${i === 2 ? RO : TE}"/><path d="M121 ${108 + i * 38} l4 5 l8 -9" fill="none" stroke="${BL}" stroke-width="3" stroke-linecap="round"/><rect x="146" y="${102 + i * 38}" width="${100 - (i % 2) * 24}" height="10" rx="5" fill="${G2}"/>`).join('')}
      <g transform="rotate(35 300 170)"><rect x="284" y="70" width="30" height="170" rx="6" fill="${AM}" stroke="${N}" stroke-width="5"/><path d="M284 240 L299 272 L314 240 Z" fill="#F6D2B8" stroke="${N}" stroke-width="5" stroke-linejoin="round"/><rect x="284" y="60" width="30" height="20" rx="4" fill="${RO}" stroke="${N}" stroke-width="5"/></g>`),
    capacitacion: svg(`${sombra(200, 274, 170)}
      <rect x="150" y="30" width="220" height="140" rx="10" fill="${BL}" stroke="${N}" stroke-width="5"/>
      <rect x="168" y="50" width="90" height="64" rx="6" fill="${CL}"/><path d="M176 102 L200 80 L218 94 L238 70 L250 84" fill="none" stroke="${AZ}" stroke-width="5" stroke-linejoin="round"/>
      <g fill="${G2}"><rect x="272" y="56" width="80" height="10" rx="5"/><rect x="272" y="76" width="64" height="10" rx="5"/><rect x="272" y="96" width="72" height="10" rx="5"/><rect x="168" y="132" width="180" height="10" rx="5"/></g>
      <line x1="260" y1="170" x2="260" y2="262" stroke="${N}" stroke-width="5"/>
      <circle cx="96" cy="88" r="28" fill="#F6D2B8" stroke="${N}" stroke-width="5"/><path d="M50 262 L50 168 Q50 130 96 130 Q142 130 142 168 L142 262 Z" fill="${AZ}" stroke="${N}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M134 156 L176 120" stroke="${N}" stroke-width="6" stroke-linecap="round"/>
      ${[0, 1, 2].map((i) => `<circle cx="${190 + i * 70}" cy="${214}" r="18" fill="#F6D2B8" stroke="${N}" stroke-width="4"/><path d="M${162 + i * 70} 266 Q${162 + i * 70} 236 ${190 + i * 70} 236 Q${218 + i * 70} 236 ${218 + i * 70} 266 Z" fill="${[TE, NA, '#7CC4F2'][i]}" stroke="${N}" stroke-width="4"/>`).join('')}`),
  };
  // ilustración para un título de diapositiva
  IL.para = (titulo, equipoK) => {
    const t = String(titulo || '').toLowerCase();
    if (/contraindic|precauci|riesgo|quemadur|incendio|marcapas|derrame|ruptura|errores/.test(t)) return 'alerta';
    if (/lavado|higiene de manos|por qu[eé] limpiar/.test(t)) return 'manos';
    if (/conceptos/.test(t)) return 'checklist';
    if (/cuidados por tipo/.test(t)) return 'equipo';
    if (/protecci[oó]n personal|epp|guantes/.test(t)) return 'epp';
    if (/tiempo|frecuencia/.test(t)) return 'tiempo';
    if (/limpieza|desinfec|humo|producto/.test(t)) return 'limpieza';
    if (/antes de|preparaci|verific|paso a paso|procedimiento/.test(t)) return 'checklist';
    if (/tecnovigil|falla|reporte|evento/.test(t)) return 'tecnovigilancia';
    if (/metrolog/.test(t)) return 'metrologia';
    if (/mantenim/.test(t)) return 'mantenimiento';
    if (/evaluaci|test/.test(t)) return 'evaluacion';
    if (/objetivo|capacitaci/.test(t)) return 'capacitacion';
    return IL[equipoK] && equipoK !== 'para' ? equipoK : 'equipo';
  };
  window.ILUS = IL;
})();
