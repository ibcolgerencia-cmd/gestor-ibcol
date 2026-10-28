// Datos de EJEMPLO para el modo demostración (no son datos reales)
window.DemoSeed = async (hash, uid) => {
  const anio = new Date().getFullYear();
  const propId = uid(), cliId = uid(), entId = uid(), ent2 = uid();
  const c1 = uid(), c2 = uid(), c3 = uid();
  const d = (m, dd) => `${anio}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  const plan = (per, ini, ejecHasta) => {
    const paso = CAT.PERIODICIDAD[per] || 0, p = {};
    if (!paso) return p;
    for (let m = ini; m <= 12; m += paso) p[`${m}-2`] = m <= ejecHasta ? 'E' : 'P';
    return p;
  };
  const mesAct = new Date().getMonth() + 1;
  const eq = (o) => ({ id: uid(), entidad_id: entId, estado: 'Activo', hv: {}, created_at: new Date().toISOString(), ...o });
  const equipos = [
    eq({ consultorio_id: c1, codigo_inv: 'ODO-001', activo_fijo: 'AF-1021', nombre: 'Unidad odontológica', marca: 'Sirona', modelo: 'Intego', serie: 'SN-77821', ubicacion: 'Consultorio 1', clase_riesgo: 'IIa', registro_sanitario: '2019DM-0019876', fabricante: 'Dentsply Sirona', periodicidad_mto: 'Trimestral', periodicidad_metro: 'No aplica', fecha_ult_mto: d(Math.max(1, mesAct - 2), 10), fecha_prox_mto: d(Math.min(12, mesAct + 1), 10), fecha_fin_garantia: d(12, 31), hv: { funcion: 'Tratamiento', voltaje: '120', frecuencia: '60', adquisicion: 'Compra', fuente: ['Electricidad', 'Aire', 'Agua'], tecnologia: 'Electromecánico', clasif_biomedica: 'Tratamiento y mantenimiento de la vida', vida_util: '10 años' } }),
    eq({ consultorio_id: c1, codigo_inv: 'ODO-002', activo_fijo: 'AF-1022', nombre: 'Autoclave', marca: 'Tuttnauer', modelo: '2340M', serie: 'TT-45120', ubicacion: 'Esterilización', clase_riesgo: 'IIb', registro_sanitario: '2018DM-0017744', fabricante: 'Tuttnauer', periodicidad_mto: 'Trimestral', periodicidad_metro: 'Anual', fecha_ult_metro: d(1, 20), fecha_prox_metro: `${anio + 1}-01-20`, fecha_prox_mto: d(Math.min(12, mesAct), 25), hv: { funcion: 'Prevención', voltaje: '120', adquisicion: 'Compra', fuente: ['Electricidad', 'Agua'], tecnologia: 'Electrónico' } }),
    eq({ consultorio_id: c1, codigo_inv: 'ODO-003', activo_fijo: 'AF-1023', nombre: 'Lámpara de fotocurado', marca: 'Woodpecker', modelo: 'LED-B', serie: 'WP-9921', ubicacion: 'Consultorio 1', clase_riesgo: 'I', registro_sanitario: '2020DM-0021340', fabricante: 'Woodpecker', periodicidad_mto: 'Semestral', periodicidad_metro: 'Anual', fecha_prox_metro: d(Math.min(12, mesAct), 28), hv: {} }),
    eq({ consultorio_id: c2, codigo_inv: 'CEX-001', activo_fijo: 'AF-2001', nombre: 'Tensiómetro digital', marca: 'Omron', modelo: 'HEM-7120', serie: 'OM-20391', ubicacion: 'Consultorio 3', clase_riesgo: 'IIa', registro_sanitario: 'INVIMA 2017DM-0016542', fabricante: 'Omron Healthcare', periodicidad_mto: 'Semestral', periodicidad_metro: 'Anual', fecha_ult_metro: d(3, 5), fecha_prox_metro: `${anio + 1}-03-05`, hv: {} }),
    eq({ consultorio_id: c2, codigo_inv: 'CEX-002', activo_fijo: 'AF-2002', nombre: 'Glucómetro', marca: 'Accu-Chek', modelo: 'Active', serie: 'GL-55012', ubicacion: 'Toma de muestras', clase_riesgo: 'IIb', registro_sanitario: '2016DV-0003311', fabricante: 'Roche', periodicidad_mto: 'Semestral', periodicidad_metro: 'Semestral', fecha_prox_metro: d(Math.max(1, mesAct - 1), 15), hv: {} }),
    eq({ consultorio_id: c2, codigo_inv: 'CEX-003', activo_fijo: 'AF-2003', nombre: 'Báscula con tallímetro', marca: 'Health o meter', modelo: '402KL', serie: 'HM-88120', ubicacion: 'Consultorio 3', clase_riesgo: 'I', registro_sanitario: 'No requiere', fabricante: 'Pelstar', periodicidad_mto: 'Anual', periodicidad_metro: 'Anual', fecha_prox_metro: d(11, 30), hv: {} }),
    eq({ consultorio_id: c3, codigo_inv: 'URG-001', activo_fijo: 'AF-3001', nombre: 'Nebulizador', marca: 'Omron', modelo: 'NE-C801', serie: 'NB-11873', ubicacion: 'Sala ERA', clase_riesgo: 'IIa', registro_sanitario: '2015DM-0013370', fabricante: 'Omron Healthcare', periodicidad_mto: 'Semestral', periodicidad_metro: 'No aplica', hv: {} }),
    eq({ consultorio_id: c3, codigo_inv: 'URG-002', activo_fijo: 'AF-3002', nombre: 'Desfibrilador externo', marca: 'Mindray', modelo: 'BeneHeart D3', serie: 'MD-60231', ubicacion: 'Reanimación', clase_riesgo: 'III', registro_sanitario: '2016DM-0014823', fabricante: 'Shenzhen Mindray', periodicidad_mto: 'Trimestral', periodicidad_metro: 'Anual', fecha_prox_metro: d(Math.min(12, mesAct + 1), 5), estado: 'En mantenimiento', hv: {} }),
    eq({ consultorio_id: c3, codigo_inv: 'URG-003', activo_fijo: 'AF-3003', nombre: 'Pulsioxímetro', marca: 'Contec', modelo: 'CMS50D', serie: 'CT-33019', ubicacion: 'Triage', clase_riesgo: 'IIb', registro_sanitario: '2019DM-0020011', fabricante: 'Contec Medical', periodicidad_mto: 'Semestral', periodicidad_metro: 'Anual', hv: {} }),
  ];
  const ini = { Trimestral: 1, Semestral: 2, Anual: 3 };
  const cronos = equipos.flatMap((e) => {
    const r = [{ id: uid(), entidad_id: entId, equipo_id: e.id, tipo: 'mantenimiento', anio, plan: plan(e.periodicidad_mto, ini[e.periodicidad_mto] || 1, mesAct - 1) }];
    if (e.periodicidad_metro !== 'No aplica') r.push({ id: uid(), entidad_id: entId, equipo_id: e.id, tipo: 'metrologia', anio, plan: plan(e.periodicidad_metro, 3, mesAct - 2) });
    return r;
  });
  cronos.push({ id: uid(), entidad_id: entId, equipo_id: null, tipo: 'capacitacion', anio, tema: 'Uso seguro del desfibrilador externo', plan: { '4-3': 'E', '10-3': 'P' } });
  cronos.push({ id: uid(), entidad_id: entId, equipo_id: null, tipo: 'capacitacion', anio, tema: 'Limpieza y desinfección de dispositivos médicos', plan: { '2-1': 'E', '8-1': 'E' } });
  // un preventivo no ejecutado para que el indicador sea realista
  const cr = cronos.find((x) => x.equipo_id === equipos[6].id && x.tipo === 'mantenimiento'); if (cr) cr.plan['2-2'] = 'N';

  const mto = (e, tipo, f, datos) => ({ id: uid(), entidad_id: entId, equipo_id: e.id, tipo, fecha: f, numero: '', datos, created_at: new Date().toISOString() });
  let n = 100;
  const mantenimientos = [
    mto(equipos[0], 'preventivo', d(Math.max(1, mesAct - 2), 10), { frecuencia: 'Trimestral', tiempo: '02:00', pruebas: CAT.FORMATOS.mto_preventivo.pruebas.map((p) => ({ item: p, r: 'Pasa' })), actividades: CAT.FORMATOS.mto_preventivo.actividades, valoracion: ['Equipo queda en funcionamiento', 'Equipo encontrado en servicio', 'Servicio concluido'], herramientas: ['Herramientas de mano', 'Limpiador neutro', 'Paño limpio', 'Sopladora'], repuestos: [], observaciones: 'Equipo en buen estado general. Se recomienda cambio de mangueras de succión en el próximo semestre.', recibe_nombre: 'Dra. Paula Muñoz', recibe_cargo: 'Odontóloga' }),
    mto(equipos[3], 'preventivo', d(Math.max(1, mesAct - 4), 18), { frecuencia: 'Semestral', tiempo: '00:45', pruebas: CAT.FORMATOS.mto_preventivo.pruebas.slice(0, 5).map((p) => ({ item: p, r: 'Pasa' })), actividades: CAT.FORMATOS.mto_preventivo.actividades.slice(0, 3), valoracion: ['Equipo queda en funcionamiento', 'Servicio concluido'], herramientas: ['Paño limpio', 'Alcohol etílico al 75%'], repuestos: [], observaciones: 'Sin novedad.', recibe_nombre: 'Enf. Carlos Ruiz', recibe_cargo: 'Jefe de enfermería' }),
    mto(equipos[7], 'correctivo', d(Math.max(1, mesAct - 1), 3), { falla: 'No carga la batería; muestra error de autoprueba.', diagnostico: 'Batería agotada por ciclo de vida.', causa: 'Desgaste', actividades: ['Cambio de batería', 'Prueba de descarga con analizador'], repuestos: [{ d: 'Batería Li-ion 14.8V', c: 1 }], horas: 3, fecha_reporte: d(Math.max(1, mesAct - 1), 1), fecha_cierre: d(Math.max(1, mesAct - 1), 3), valoracion: ['Equipo queda en funcionamiento', 'Servicio concluido'], observaciones: 'Equipo operativo tras cambio de batería.', recibe_nombre: 'Enf. Carlos Ruiz', recibe_cargo: 'Jefe de enfermería' }),
    mto(equipos[1], 'metrologia', d(1, 20), { laboratorio: 'Laboratorio de metrología acreditado (ejemplo)', certificado: 'CAL-2026-0451', magnitud: 'Temperatura / Presión', resultado: 'Conforme', proxima: `${anio + 1}-01-20`, observaciones: 'Error máximo dentro de la tolerancia del fabricante.' }),
  ].map((m) => ({ ...m, numero: String(++n).padStart(5, '0') }));

  const empresa = [{ id: 1, datos: { ...CAT.EMPRESA }, firma: null }];
  const formatos = Object.entries(CAT.FORMATOS).map(([clave, datos]) => ({ clave, datos }));
  const perfiles = [
    { id: propId, usuario: 'ibcol', nombre: 'Laura María Pistala Enríquez', email: 'ibcolgerencia@gmail.com', rol: 'propietario', entidad_id: null, activo: true },
    { id: cliId, usuario: 'ips.demo', nombre: 'Coordinación de calidad', email: 'ips.demo@ibcol.app', rol: 'cliente', entidad_id: entId, activo: true },
  ];
  return {
    _usuarios: [{ id: propId, clave: await hash('ibcol2026') }, { id: cliId, clave: await hash('demo2026') }],
    perfiles, empresa, formatos,
    entidades: [
      { id: entId, razon_social: 'IPS Salud Integral del Cauca S.A.S. (ejemplo)', nit: '900.000.001-1', representante: 'María Fernanda Ortiz', direccion: 'Calle 5 # 10-20', ciudad: 'Popayán', email: 'calidad@ejemplo.co', telefono: '3000000000', reps: '190010000001', activo: true },
      { id: ent2, razon_social: 'Consultorio Odontológico Sonrisas (ejemplo)', nit: '1.061.000.000-1', representante: 'Andrés Calvache', direccion: 'Carrera 9 # 4-15', ciudad: 'Popayán', email: 'consultorio@ejemplo.co', telefono: '3110000000', reps: '190010000002', activo: true },
    ],
    consultorios: [
      { id: c1, entidad_id: entId, orden: 1, nombre: 'Consultorio odontológico', sede: 'Sede principal', servicio: 'Odontología general' },
      { id: c2, entidad_id: entId, orden: 2, nombre: 'Consultorio médico', sede: 'Sede principal', servicio: 'Medicina general' },
      { id: c3, entidad_id: entId, orden: 3, nombre: 'Urgencias', sede: 'Sede principal', servicio: 'Urgencias baja complejidad' },
    ],
    equipos, cronogramas: cronos, mantenimientos, documentos: [],
    alertas: [
      { id: uid(), entidad_id: entId, mes_consulta: `${CAT.MESES[Math.max(0, mesAct - 3)]} ${anio}`, registro_sanitario: '2016DM-0014823', dispositivo: 'Desfibrilador externo', tipo_notificacion: 'Alerta sanitaria', agencia: 'INVIMA', fecha_publicacion: d(Math.max(1, mesAct - 3), 12), responsable: 'Laura Pistala', analisis: 'La alerta aplica a lotes distintos al instalado.', aplicabilidad: 'No aplica' },
      { id: uid(), entidad_id: entId, mes_consulta: `${CAT.MESES[Math.max(0, mesAct - 2)]} ${anio}`, registro_sanitario: '—', dispositivo: 'Sin alertas para el inventario', tipo_notificacion: 'Consulta periódica', agencia: 'INVIMA', fecha_publicacion: null, responsable: 'Laura Pistala', analisis: 'No se encontraron alertas que apliquen.', aplicabilidad: 'No aplica' },
      { id: uid(), entidad_id: entId, mes_consulta: `${CAT.MESES[Math.max(0, mesAct - 1)]} ${anio}`, registro_sanitario: '2016DV-0003311', dispositivo: 'Tiras reactivas de glucómetro', tipo_notificacion: 'Retiro de producto (recall)', agencia: 'INVIMA', fecha_publicacion: d(Math.max(1, mesAct - 1), 7), responsable: 'Laura Pistala', analisis: 'Se verificó el lote en uso: no corresponde al lote afectado.', aplicabilidad: 'Aplica - verificado' },
    ],
    eventos: [
      { id: uid(), entidad_id: entId, equipo_id: equipos[7].id, fecha_evento: `${d(Math.max(1, mesAct - 1), 1)}T09:30:00`, servicio: 'Urgencias', reportante: 'Carlos Ruiz', cargo: 'Jefe de enfermería', descripcion: 'Durante la prueba diaria el desfibrilador no superó la autoprueba de batería. No se usó en paciente.', afecto_paciente: false, consecuencia: 'Sin consecuencias', retiro_equipo: true, contingencia: 'Se dispuso desfibrilador de respaldo del servicio de hospitalización.', estado: 'Cerrado' },
    ],
    cotizaciones: [
      { id: uid(), entidad_id: entId, numero: `COT-${anio}-001`, fecha: d(Math.max(1, mesAct - 1), 2), validez_dias: 30, iva: 0, estado: 'Aprobada', condiciones: CAT.FORMATOS.cotizacion.condiciones,
        items: [{ descripcion: 'Mantenimiento preventivo equipos biomédicos (9 equipos)', cantidad: 9, valor: 45000 }, { descripcion: 'Calibración de tensiómetro y báscula con certificado', cantidad: 2, valor: 60000 }, { descripcion: 'Actualización de hojas de vida y cronogramas', cantidad: 1, valor: 150000 }] },
    ],
    cobros: [
      { id: uid(), entidad_id: entId, tipo: 'cuenta_cobro', numero: `00306-${anio}`, fecha: d(Math.max(1, mesAct - 1), 28), concepto: '', items: [{ descripcion: `Cuota correspondiente al mes de ${CAT.MESES[Math.max(0, mesAct - 2)].toLowerCase()} del contrato No. 01-${anio}, con el objeto de actualizar documentación y prestación de servicios de mantenimiento preventivo equipos biomédicos`, cantidad: 1, valor: 450000 }, { descripcion: 'Calibración de tensiómetro y báscula con certificado', cantidad: 2, valor: 60000 }], total: 570000, estado: 'Pendiente' },
    ],
    auditoria: [],
  };
};
