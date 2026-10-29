// =====================================================================
//  Enviar documentos por WhatsApp y correo electrónico.
//  - Enlace seguro y temporal (Supabase Storage, vence en 1, 7 o 30 días).
//  - WhatsApp (wa.me) y correo (Gmail o el programa de correo) con el
//    mensaje listo; en el celular también se puede compartir el PDF mismo.
//  Se usa desde el visor PDF (todos los documentos) y desde cada archivo.
// =====================================================================
(() => {
  const A = window.APP, S = A.S, st = A.st;
  const { h, I, toast, modal, f } = UI;
  const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(0, 80);
  const LS = 'ibcol_envio_dest';
  const recordado = () => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; } };
  const recordar = (k, v) => { try { const o = recordado(); o[k] = v; localStorage.setItem(LS, JSON.stringify(o)); } catch {} };
  // número de WhatsApp: deja solo dígitos y agrega el indicativo de Colombia a celulares de 10 dígitos
  const numeroWA = (t) => { let d = String(t || '').replace(/\D/g, ''); if (d.length === 10 && d.startsWith('3')) d = '57' + d; return d; };
  const esCorreo = (t) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(t || '').trim());

  // entidad del documento: la que se está viendo en pantalla o la del usuario cliente
  async function entidadActual() {
    try {
      if (st.perfil?.rol !== 'propietario' && st.perfil?.entidad_id) return await S.get('entidades', st.perfil.entidad_id);
      const pila = st.pila || [];
      for (let i = pila.length - 1; i >= 0; i--) {
        const { vista, params = {} } = pila[i];
        if (params.ent) return await S.get('entidades', params.ent);
        if (vista === 'entidad' && params.id) return await S.get('entidades', params.id);
        if (vista === 'areas' && params.id) return await S.get('entidades', params.id);
        if (vista === 'equipo' && params.id) { const e = await S.get('equipos', params.id); if (e) return await S.get('entidades', e.entidad_id); }
      }
    } catch {}
    return null;
  }

  // A.enviarDoc({ nombre, blob | obtenerBlob, archivo, ent })
  A.enviarDoc = async ({ nombre, blob = null, obtenerBlob = null, archivo = null, ent = null, registro = null } = {}) => {
    ent = ent || (await entidadActual());
    const mem = recordado()[ent?.id || 'general'] || {};
    const saludo = ent?.representante ? `Cordial saludo, ${ent.representante}.` : 'Cordial saludo.';
    const nomDoc = String(nombre || 'documento.pdf');
    const textoBase = (dias) => `${saludo}\n\n${st.emp?.nombre || 'IBCOL Ingeniería Biomédica de Colombia'} le comparte el documento «${nomDoc.replace(/\.pdf$/i, '')}»${ent?.razon_social ? ` de ${ent.razon_social}` : ''}.\n\nPuede verlo y descargarlo en este enlace seguro (válido por ${dias} ${dias === 1 ? 'día' : 'días'}):\n[ENLACE]\n\n${st.emp?.responsable || ''}${st.emp?.cargo ? ' · ' + st.emp.cargo : ''}\n${st.emp?.nombre || 'IBCOL'} · ${[st.emp?.telefono, st.emp?.email].filter(Boolean).join(' · ')}`;
    const puedeCompartirArchivo = !!(navigator.canShare && navigator.share && window.File);
    let enlace = null, enlaceDias = null, archivoRuta = archivo, textoEditado = false;
    const m = modal({
      titulo: `Enviar documento · ${nomDoc}`, size: 'sm',
      cuerpo: `<form class="form env-form" onsubmit="return false">
        <div class="env-doc"><span class="ext pdf">${h(UI.ext(nomDoc).toUpperCase() || 'PDF')}</span><b>${h(nomDoc)}</b></div>
        <div class="fields">
          ${f.input('env_correo', 'Correo electrónico del destinatario', mem.correo || ent?.email || '', { type: 'email', full: true })}
          ${f.input('env_wa', 'WhatsApp del destinatario (celular)', mem.wa || ent?.telefono || '', { type: 'tel', full: true, attrs: 'placeholder="Ej: 3001234567" inputmode="tel"' })}
          ${f.sel('env_dias', 'El enlace vence en', [[1, '1 día'], [7, '7 días'], [30, '30 días']], 7)}
          ${f.area('env_msg', 'Mensaje (puede editarlo; [ENLACE] se reemplaza por el enlace)', textoBase(7), { rows: 7 })}
        </div>
        <div class="env-btns">
          <button type="button" class="btn env-wa" data-env="wa">${I.wa} WhatsApp</button>
          <button type="button" class="btn env-mail" data-env="gmail">${I.mail} Gmail</button>
          <button type="button" class="btn" data-env="mail">${I.mail} Programa de correo</button>
          ${puedeCompartirArchivo ? `<button type="button" class="btn" data-env="archivo">${I.subir} Compartir el PDF (celular)</button>` : ''}
          <button type="button" class="btn" data-env="copiar">Copiar enlace</button>
        </div>
        <p class="muted env-nota" data-env-est>El destinatario abre el documento con el enlace, sin usuario ni contraseña, hasta que venza. ${puedeCompartirArchivo ? '“Compartir el PDF” adjunta el archivo directamente (WhatsApp, correo, etc.).' : ''}</p>
      </form>`,
      acciones: [{ t: 'Cerrar' }],
    });
    const b = m.body, $ = (s) => b.querySelector(s), est = $('[data-env-est]');
    $('[name=env_msg]').addEventListener('input', () => { textoEditado = true; });
    $('[name=env_dias]').addEventListener('change', (e) => { if (!textoEditado) $('[name=env_msg]').value = textoBase(+e.target.value); enlace = null; });

    const conseguirBlob = async () => blob || (obtenerBlob ? (blob = await obtenerBlob()) : archivo ? (blob = await S.fileBlob(archivo)) : null);
    const conseguirEnlace = async () => {
      const dias = +$('[name=env_dias]').value;
      if (enlace && enlaceDias === dias) return enlace;
      est.textContent = 'Creando enlace seguro…';
      if (!archivoRuta) {
        // documento generado en pantalla (hoja de vida, reporte, acta…): se guarda una copia para compartir
        const bl = await conseguirBlob(); if (!bl) throw new Error('No se encontró el documento');
        const ruta = `${ent?.id || st.perfil?.entidad_id || 'general'}/compartidos/${Date.now()}-${slug(nomDoc)}`;
        try { await S.upload(ruta, bl); } catch (er) { throw new Error(puedeCompartirArchivo ? 'Su usuario no puede crear enlaces para este documento. Use “Compartir el PDF”.' : 'Su usuario no puede crear enlaces para este documento. Descárguelo y adjúntelo al mensaje.'); }
        archivoRuta = ruta;
      }
      if (!S.enlace) throw new Error('Los enlaces solo funcionan con la nube conectada (no en modo demostración).');
      enlace = await S.enlace(archivoRuta, dias * 86400, nomDoc); enlaceDias = dias;
      est.textContent = `Enlace listo (vence en ${dias} ${dias === 1 ? 'día' : 'días'}).`;
      return enlace;
    };
    const mensaje = (url) => { const t = $('[name=env_msg]').value; return t.includes('[ENLACE]') ? t.replace('[ENLACE]', url) : `${t}\n\n${url}`; };
    const registrar = (canal, dest) => { S.log('ENVIO', 'documentos', registro || archivoRuta || '', `${canal}${dest ? ' a ' + dest : ''}: ${nomDoc}`); };

    b.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-env]'); if (!btn) return;
      const canal = btn.dataset.env, correo = $('[name=env_correo]').value.trim(), wa = numeroWA($('[name=env_wa]').value);
      // la ventana se abre ya (dentro del clic) para que el navegador no la bloquee
      let ventana = null;
      if (canal === 'wa' || canal === 'gmail') ventana = window.open('about:blank', '_blank');
      try {
        if (canal === 'archivo') {
          const bl = await conseguirBlob(); if (!bl) throw new Error('No se encontró el documento');
          const file = new File([bl], nomDoc.match(/\.[a-z0-9]+$/i) ? nomDoc : nomDoc + '.pdf', { type: bl.type || 'application/pdf' });
          if (!navigator.canShare({ files: [file] })) throw new Error('Este dispositivo no permite compartir archivos. Use WhatsApp o correo con enlace.');
          await navigator.share({ files: [file], title: nomDoc, text: $('[name=env_msg]').value.replace(/\n?.*\[ENLACE\]\n?/, '\n') });
          registrar('Archivo compartido'); return;
        }
        if (canal === 'gmail' || canal === 'mail') { if (correo && !esCorreo(correo)) throw new Error('Revise el correo del destinatario'); }
        const url = await conseguirEnlace();
        const asunto = `${nomDoc.replace(/\.pdf$/i, '')}${ent?.razon_social ? ' · ' + ent.razon_social : ''}`;
        if (canal === 'wa') {
          recordar(ent?.id || 'general', { ...recordado()[ent?.id || 'general'], wa: $('[name=env_wa]').value.trim() });
          const dest = `https://wa.me/${wa}?text=${encodeURIComponent(mensaje(url))}`;
          if (ventana) ventana.location.href = dest; else window.open(dest, '_blank');
          registrar('WhatsApp', wa ? '+' + wa : 'contacto a elegir');
        } else if (canal === 'gmail') {
          recordar(ent?.id || 'general', { ...recordado()[ent?.id || 'general'], correo });
          const dest = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(correo)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje(url))}`;
          if (ventana) ventana.location.href = dest; else window.open(dest, '_blank');
          registrar('Correo (Gmail)', correo);
        } else if (canal === 'mail') {
          recordar(ent?.id || 'general', { ...recordado()[ent?.id || 'general'], correo });
          location.href = `mailto:${encodeURIComponent(correo)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje(url))}`;
          registrar('Correo', correo);
        } else if (canal === 'copiar') {
          try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); } catch { window.prompt('Copie el enlace:', url); }
          registrar('Enlace copiado');
        }
      } catch (er) { if (ventana) ventana.close(); est.textContent = ''; toast(er.message, true); }
    });
    return m;
  };
})();
