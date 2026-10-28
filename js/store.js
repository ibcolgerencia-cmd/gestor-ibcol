// =====================================================================
//  Capa de datos: misma interfaz para la NUBE (Supabase) y el MODO DEMO
// =====================================================================
window.Store = (() => {
  const C = window.IBCOL_CONFIG || {};
  const nube = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase);
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  const ahora = () => new Date().toISOString();
  const aCorreo = (u) => (u.includes('@') ? u.trim().toLowerCase() : `${u.trim().toLowerCase()}@${C.DOMINIO_USUARIOS || 'ibcol.app'}`);
  const KEYS = { empresa: 'id', formatos: 'clave' };

  // -------------------------------------------------------------- NUBE
  function crearNube() {
    const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
    let perfil = null;
    const chk = ({ data, error }) => { if (error) throw new Error(traducir(error.message)); return data; };

    async function cargarPerfil() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return null;
      const p = chk(await sb.from('perfiles').select('*').eq('id', user.id).maybeSingle());
      if (!p) throw new Error('El usuario no tiene perfil. Verifique que ejecutó el script SQL.');
      if (!p.activo) { await sb.auth.signOut(); throw new Error('Usuario desactivado. Contacte a IBCOL.'); }
      perfil = p; return p;
    }
    function aplicar(q, filtros) {
      Object.entries(filtros || {}).forEach(([k, v]) => { q = v === null ? q.is(k, null) : q.eq(k, v); });
      return q;
    }
    return {
      modo: 'nube',
      get perfil() { return perfil; },
      async sesion() { try { return await cargarPerfil(); } catch { return null; } },
      async login(usuario, clave) {
        chk(await sb.auth.signInWithPassword({ email: aCorreo(usuario), password: clave }));
        const p = await cargarPerfil();
        this.log('LOGIN', 'perfiles', p.id, 'Ingreso al sistema');
        return p;
      },
      async logout() { try { await this.log('LOGOUT', 'perfiles', perfil?.id, 'Salida'); } catch {} await sb.auth.signOut(); perfil = null; },
      async list(t, filtros, orden) {
        let q = aplicar(sb.from(t).select('*'), filtros);
        if (orden) q = q.order(orden.replace('-', ''), { ascending: !orden.startsWith('-') });
        return chk(await q.limit(5000));
      },
      async get(t, id) { return chk(await sb.from(t).select('*').eq(KEYS[t] || 'id', id).maybeSingle()); },
      async insert(t, o) { return chk(await sb.from(t).insert(o).select().single()); },
      async update(t, id, o) { return chk(await sb.from(t).update(o).eq(KEYS[t] || 'id', id).select().single()); },
      async upsert(t, o) { return chk(await sb.from(t).upsert(o).select().single()); },
      async remove(t, id) { chk(await sb.from(t).delete().eq(KEYS[t] || 'id', id)); },
      async upload(path, blob) {
        chk(await sb.storage.from('documentos').upload(path, blob, { upsert: true, contentType: blob.type || 'application/octet-stream' }));
        return path;
      },
      async fileBlob(path) { return chk(await sb.storage.from('documentos').download(path)); },
      async removeFile(path) { if (path) chk(await sb.storage.from('documentos').remove([path])); },
      async log(accion, tabla, registro, detalle) {
        try { await sb.rpc('registrar_evento', { p_accion: accion, p_tabla: tabla, p_registro: String(registro || ''), p_detalle: detalle || '' }); } catch {}
      },
      async crearUsuarioCliente({ usuario, clave, nombre, entidad_id }) {
        // cliente temporal sin sesión persistente para no cerrar la sesión del propietario
        const tmp = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY,
          { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'ibcol-tmp' } });
        const r = chk(await tmp.auth.signUp({ email: aCorreo(usuario), password: clave, options: { data: { usuario, nombre } } }));
        if (!r.user) throw new Error('No se pudo crear el usuario');
        if (r.user.identities && r.user.identities.length === 0) throw new Error('Ese usuario ya existe');
        chk(await sb.rpc('asignar_perfil', { p_user: r.user.id, p_entidad: entidad_id, p_nombre: nombre, p_usuario: usuario }));
        return r.user.id;
      },
      async cambiarClave(id, clave) { chk(await sb.rpc('cambiar_clave', { p_user: id, p_clave: clave })); },
      async rpc(fn, args) { return chk(await sb.rpc(fn, args)); },
      async ia(body) {
        const { data, error } = await sb.functions.invoke('asistente-ia', { body });
        if (error) {
          let msg = error.message || 'Error del asistente';
          try { const j = await error.context?.json?.(); if (j?.error) msg = j.error; } catch {}
          if (/Failed to send|not found|404/i.test(msg)) msg = 'El asistente de IA aún no está instalado en Supabase (función "asistente-ia").';
          throw new Error(msg);
        }
        if (data?.error) throw new Error(data.error);
        return data.texto || '';
      },
      async cambiarMiClave(clave) { chk(await sb.auth.updateUser({ password: clave })); },
    };
  }

  function traducir(m) {
    const t = {
      'Invalid login credentials': 'Usuario o contraseña incorrectos',
      'Email not confirmed': 'Debe desactivar "Confirm email" en Supabase (Authentication > Providers > Email)',
      'User already registered': 'Ese usuario ya existe',
      'new row violates row-level security policy': 'No tiene permiso para esta acción',
      'Password should be at least 6 characters': 'La contraseña debe tener mínimo 6 caracteres',
    };
    for (const k in t) if (m.includes(k)) return t[k];
    if (m.includes('duplicate key')) return 'Ya existe un registro con ese código o número';
    return m;
  }

  // -------------------------------------------------------------- DEMO (navegador)
  function crearDemo() {
    const LS = 'ibcol_demo_v1', SS = 'ibcol_demo_sesion';
    let db = null, perfil = null;
    const leer = () => { try { return JSON.parse(localStorage.getItem(LS)); } catch { return null; } };
    const guardar = () => { try { localStorage.setItem(LS, JSON.stringify(db)); } catch (e) { console.warn('No se pudo guardar', e); } };
    const memFiles = new Map();
    let idb = null;
    const abrirIDB = () => new Promise((res) => {
      try {
        const r = indexedDB.open('ibcol_demo_files', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('f');
        r.onsuccess = () => res(r.result); r.onerror = () => res(null);
      } catch { res(null); }
    });
    const idbOp = (modo, fn) => new Promise((res) => {
      if (!idb) return res(undefined);
      try { const tx = idb.transaction('f', modo); const r = fn(tx.objectStore('f')); r.onsuccess = () => res(r.result); r.onerror = () => res(undefined); } catch { res(undefined); }
    });
    const hash = async (s) => {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ibcol:' + s));
      return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
    };
    const esProp = () => perfil?.rol === 'propietario';
    const tabla = (t) => (db[t] = db[t] || []);
    const key = (t) => KEYS[t] || 'id';
    function auditar(accion, t, reg, antes, despues, detalle) {
      tabla('auditoria').unshift({
        id: Date.now() + Math.random(), fecha: ahora(), usuario_id: perfil?.id, usuario: perfil?.usuario,
        accion, tabla: t, registro_id: String(reg ?? ''), entidad_id: (despues || antes || {}).entidad_id || perfil?.entidad_id || null,
        detalle: detalle || null, antes: antes || null, despues: despues || null,
      });
      if (db.auditoria.length > 3000) db.auditoria.length = 3000;
    }
    const noPermiso = () => { throw new Error('No tiene permiso para esta acción'); };
    function visible(t, r) {
      if (esProp()) return true;
      if (['auditoria', '_usuarios'].includes(t)) return false;
      if (['empresa', 'formatos'].includes(t)) return true;
      if (t === 'perfiles') return r.id === perfil.id;
      if (t === 'entidades') return r.id === perfil.entidad_id;
      if (t === 'documentos') return r.entidad_id === perfil.entidad_id && r.visible_cliente !== false;
      return r.entidad_id && r.entidad_id === perfil.entidad_id;
    }

    return {
      modo: 'demo',
      get perfil() { return perfil; },
      async init() {
        idb = await abrirIDB();
        db = leer();
        if (!db) { db = await window.DemoSeed(hash, uid); guardar(); }
      },
      async sesion() {
        if (!db) await this.init();
        let id = null; try { id = sessionStorage.getItem(SS); } catch {}
        perfil = id ? (db.perfiles || []).find((p) => p.id === id) || null : null;
        return perfil;
      },
      async login(usuario, clave) {
        if (!db) await this.init();
        const u = (usuario || '').trim().toLowerCase();
        const p = db.perfiles.find((x) => x.usuario === u || x.email === u);
        const cred = p && db._usuarios.find((x) => x.id === p.id);
        if (!cred || cred.clave !== (await hash(clave))) throw new Error('Usuario o contraseña incorrectos');
        if (!p.activo) throw new Error('Usuario desactivado. Contacte a IBCOL.');
        perfil = p; try { sessionStorage.setItem(SS, p.id); } catch {}
        auditar('LOGIN', 'perfiles', p.id, null, null, 'Ingreso al sistema'); guardar();
        return p;
      },
      async logout() { auditar('LOGOUT', 'perfiles', perfil?.id, null, null, 'Salida'); guardar(); perfil = null; try { sessionStorage.removeItem(SS); } catch {} },
      async list(t, filtros, orden) {
        let r = tabla(t).filter((x) => visible(t, x));
        Object.entries(filtros || {}).forEach(([k, v]) => { r = r.filter((x) => (v === null ? x[k] == null : x[k] === v)); });
        if (orden) {
          const c = orden.replace('-', ''), d = orden.startsWith('-') ? -1 : 1;
          r = [...r].sort((a, b) => (a[c] > b[c] ? d : a[c] < b[c] ? -d : 0));
        }
        return JSON.parse(JSON.stringify(r));
      },
      async get(t, id) { const r = tabla(t).find((x) => x[key(t)] === id); return r && visible(t, r) ? JSON.parse(JSON.stringify(r)) : null; },
      async insert(t, o) {
        if (!esProp()) noPermiso();
        if (t === 'equipos' && tabla(t).some((x) => x.entidad_id === o.entidad_id && x.codigo_inv === o.codigo_inv)) throw new Error('Ya existe un equipo con ese código de inventario en esta entidad');
        const r = { id: uid(), created_at: ahora(), updated_at: ahora(), ...o };
        tabla(t).push(r); auditar('INSERT', t, r[key(t)], null, r);
        if (t === 'eventos' && r.equipo_id && ['Muerte', 'Deterioro grave'].includes(r.consecuencia)) {
          const eq = tabla('equipos').find((x) => x.id === r.equipo_id);
          if (eq) { const a = { ...eq }; eq.estado = 'Fuera de servicio'; auditar('UPDATE', 'equipos', eq.id, a, eq, 'Bloqueo automático por evento adverso grave'); }
        }
        guardar(); return JSON.parse(JSON.stringify(r));
      },
      async update(t, id, o) {
        if (!esProp()) noPermiso();
        const r = tabla(t).find((x) => x[key(t)] === id); if (!r) throw new Error('Registro no encontrado');
        const antes = JSON.parse(JSON.stringify(r)); Object.assign(r, o, { updated_at: ahora() });
        auditar('UPDATE', t, id, antes, r); guardar(); return JSON.parse(JSON.stringify(r));
      },
      async upsert(t, o) {
        const k = key(t); return tabla(t).some((x) => x[k] === o[k]) ? this.update(t, o[k], o) : this.insert(t, o);
      },
      async remove(t, id) {
        if (!esProp()) noPermiso();
        const i = tabla(t).findIndex((x) => x[key(t)] === id); if (i < 0) return;
        const [antes] = tabla(t).splice(i, 1); auditar('DELETE', t, id, antes, null);
        if (t === 'equipos') ['documentos', 'mantenimientos', 'cronogramas'].forEach((tt) => { db[tt] = tabla(tt).filter((x) => x.equipo_id !== id); });
        if (t === 'entidades') ['consultorios', 'equipos', 'documentos', 'mantenimientos', 'cronogramas', 'alertas', 'eventos'].forEach((tt) => { db[tt] = tabla(tt).filter((x) => x.entidad_id !== id); });
        guardar();
      },
      async upload(path, blob) {
        if (!esProp()) noPermiso();
        memFiles.set(path, blob); await idbOp('readwrite', (s) => s.put(blob, path)); return path;
      },
      async fileBlob(path) {
        if (!esProp() && path.split('/')[0] !== perfil?.entidad_id) noPermiso();
        return memFiles.get(path) || (await idbOp('readonly', (s) => s.get(path))) || null;
      },
      async removeFile(path) { if (!esProp()) noPermiso(); memFiles.delete(path); await idbOp('readwrite', (s) => s.delete(path)); },
      async log(accion, t, reg, detalle) { auditar(accion, t, reg, null, null, detalle); guardar(); },
      async crearUsuarioCliente({ usuario, clave, nombre, entidad_id }) {
        if (!esProp()) noPermiso();
        const u = usuario.trim().toLowerCase();
        if (db.perfiles.some((p) => p.usuario === u)) throw new Error('Ese usuario ya existe');
        if (clave.length < 6) throw new Error('La contraseña debe tener mínimo 6 caracteres');
        const id = uid();
        db.perfiles.push({ id, usuario: u, nombre, email: aCorreo(u), rol: 'cliente', entidad_id, activo: true, created_at: ahora() });
        db._usuarios.push({ id, clave: await hash(clave) });
        auditar('INSERT', 'perfiles', id, null, { usuario: u, entidad_id }); guardar(); return id;
      },
      async cambiarClave(id, clave) {
        if (!esProp()) noPermiso();
        if (clave.length < 6) throw new Error('La contraseña debe tener mínimo 6 caracteres');
        const c = db._usuarios.find((x) => x.id === id); c.clave = await hash(clave);
        auditar('UPDATE', 'perfiles', id, null, null, 'Cambio de contraseña'); guardar();
      },
      async cambiarMiClave(clave) {
        if (clave.length < 6) throw new Error('La contraseña debe tener mínimo 6 caracteres');
        const c = db._usuarios.find((x) => x.id === perfil.id); c.clave = await hash(clave); guardar();
      },
      async rpc(fn) { throw new Error(`Función ${fn} no disponible en modo demostración`); },
      async ia() { throw new Error('El asistente de IA funciona solo con la nube conectada (no en modo demostración).'); },
      reiniciarDemo() { try { localStorage.removeItem(LS); sessionStorage.removeItem(SS); } catch {} location.reload(); },
    };
  }

  const S = nube ? crearNube() : crearDemo();
  S.uid = uid;
  S.aCorreo = aCorreo;
  return S;
})();
