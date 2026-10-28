// Catálogos: carpetas, formatos y valores por defecto del gestor IBCOL
window.CAT = (() => {
  const EMPRESA = {
    nombre: 'IBCOL Ingeniería Biomédica de Colombia',
    sigla: 'IBCOL',
    direccion: 'Carrera 39 # 6B-22 B/ Colombia II Etapa',
    ciudad: 'Popayán - Cauca',
    telefono: '3146872775',
    telefono2: '3146586628',
    email: 'ibcolgerencia@gmail.com',
    responsable: 'Laura María Pistala Enríquez',
    cedula: '',
    cargo: 'Ingeniera Biomédica',
    matricula: '19244-317669 CAU',
    invima: 'RH-201601-032',
    banco: 'Bancolombia',
    tipo_cuenta: 'Ahorros',
    numero_cuenta: '91236834269',
    cobro_titular: 'Miller Albeiro Navia Daza',
    cobro_documento: '10298069',
    cobro_expedicion: 'Popayán – Cauca',
    cobro_ciudad: 'Popayán',
    regimen: 'No responsable de IVA',
  };

  // Carpetas generales de cada entidad (cliente)
  // Estructura documental definida por IBCOL (11 carpetas por entidad)
  const G1 = 'Estructura documental', G2 = 'Otros módulos';
  const SUBS_CRONO = ['MANTENIMIENTOS PREVENTIVOS', 'CRONOGRAMA METROLOGÍA', 'CRONOGRAMA CAPACITACIÓN'];
  const CARPETAS_ENTIDAD = [
    { k: 'inventarios', n: '1. INVENTARIOS', g: G1, gen: 'inventario' },
    { k: 'cronogramas', n: '2. CRONOGRAMAS', g: G1, gen: 'cronogramas', subs: SUBS_CRONO },
    { k: 'equipos', n: '3. INFORMACIÓN DEL EQUIPO', g: G1, nav: 'areas' },
    { k: 'protocolos', n: '4. PROTOCOLOS Y PROGRAMAS', g: G1, ia: true },
    { k: 'alertas', n: '5. ALERTAS SANITARIAS', g: G1, gen: 'alertas', subsAnio: (a) => `${a}-CONSULTA ALERTAS E INFORMES DE SEGURIDAD`, ia: true },
    { k: 'capacitaciones', n: '6. PLAN DE CAPACITACIÓN', g: G1, ia: true },
    { k: 'limpieza', n: '7. LISTA CHEQUEO LIMPIEZA Y DESINFECCIÓN', g: G1, ia: true },
    { k: 'indicadores', n: '8. GESTIÓN DE INDICADORES', g: G1, gen: 'indicadores', ia: true },
    { k: 'glucometro', n: '9. CONTROL CALIDAD GLUCÓMETRO', g: G1, ia: true },
    { k: 'actas_revision', n: '10. ACTAS REVISIÓN SEDES', g: G1, ia: true },
    { k: 'hv_ingenieros', n: '11. HOJAS DE VIDA INGENIEROS BIOMÉDICOS', g: G1 },
    { k: 'tecnovigilancia', n: 'PROGRAMA DE TECNOVIGILANCIA', g: G2, gen: 'tecnovigilancia', ia: true },
    { k: 'contratos', n: 'CONTRATOS DE PRESTACIÓN DE SERVICIOS', g: G2 },
    { k: 'archivo', n: 'CARPETA DE ARCHIVO', g: G2 },
    { k: 'cotizaciones', n: 'COTIZACIONES', g: G2, gen: 'cotizaciones' },
    { k: 'facturas', n: 'FACTURAS', g: G2, gen: 'facturas' },
    { k: 'cuentas_cobro', n: 'CUENTAS DE COBRO', g: G2, gen: 'cuentas_cobro' },
  ];

  // 3. Información del equipo → Servicio o consultorio → carpeta de cada equipo
  const CARPETAS_EQUIPO = [
    { k: 'hoja_vida', n: '1. HOJA DE VIDA', gen: 'hoja_vida' },
    { k: 'mto_preventivo', n: '2. MANTENIMIENTOS PREVENTIVOS', gen: 'mto:preventivo' },
    { k: 'mto_correctivo', n: '3. MANTENIMIENTOS CORRECTIVOS', gen: 'mto:correctivo' },
    { k: 'metrologia', n: '4. METROLOGÍA', gen: 'mto:metrologia' },
    { k: 'registro_sanitario', n: '5. REGISTRO SANITARIO' },
    { k: 'factura', n: '6. FACTURAS' },
    { k: 'manual', n: '7. MANUAL O FICHA TÉCNICA' },
    { k: 'importacion', n: '8. CERTIFICADO IMPORTACIÓN' },
    { k: 'acta_baja', n: '9. ACTA BAJA', gen: 'acta:baja' },
    { k: 'acta_entrega', n: '10. ACTA ENTREGA', gen: 'acta:entrega' },
  ];

  // Encabezados de formatos (el propietario puede modificarlos)
  const FORMATOS = {
    hoja_vida: { titulo: 'Hoja de vida de equipo biomédico', codigo: 'FHVEB-001', version: '002', fecha: '2025-01-15' },
    inventario: { titulo: 'Inventario', codigo: 'FMB-001', version: '01', fecha: '2021-08-02' },
    cronograma: { titulo: 'Cronograma de mantenimiento preventivo', codigo: 'FMB-002', version: '01', fecha: '2021-08-02' },
    mto_preventivo: {
      titulo: 'Lista de chequeo mantenimiento preventivo', codigo: 'FMB-004', version: '01', fecha: '2021-08-02',
      pruebas: ['Inspección física de carcasa y estructura', 'Estado de cable de poder y conectores', 'Encendido y autodiagnóstico',
        'Funcionamiento de controles e indicadores', 'Alarmas audibles y visuales', 'Estado de accesorios', 'Prueba funcional general'],
      actividades: ['Limpieza general externa con limpiador neutro', 'Limpieza interna y soplado de polvo',
        'Ajuste de tornillería y conexiones', 'Lubricación de partes móviles (si aplica)', 'Verificación de variables de funcionamiento',
        'Rotulado de mantenimiento'],
      herramientas: ['Herramientas de mano', 'Limpiador neutro', 'Paño limpio', 'Silicona', 'Paño húmedo', 'Aplicadores',
        'Alcohol etílico al 75%', 'Sopladora'],
    },
    mto_correctivo: { titulo: 'Reporte de mantenimiento correctivo', codigo: 'FMB-005', version: '01', fecha: '2024-01-09' },
    metrologia: { titulo: 'Registro de metrología / calibración', codigo: 'FMB-006', version: '01', fecha: '2024-01-09' },
    alertas: { titulo: 'Formato bitácora de consulta de alertas sanitarias', codigo: 'FT-PGTV-015', version: '001', fecha: '2024-01-09' },
    evento: { titulo: 'Reporte de evento / incidente adverso con dispositivo médico', codigo: 'FT-PGTV-016', version: '001', fecha: '2024-01-09' },
    acta_comite: { titulo: 'Formato acta de reunión', codigo: 'FAR-013', version: '002', fecha: '2024-01-09' },
    acta_baja: { titulo: 'Acta de baja', codigo: 'FT-AB-033', version: '001', fecha: '2024-09-01' },
    acta_entrega: { titulo: 'Acta de entrega', codigo: 'FT-AE-032', version: '001', fecha: '2024-09-01' },
    cotizacion: { titulo: 'Cotización', codigo: 'FT-COT-001', version: '001', fecha: '2024-01-09',
      condiciones: 'Forma de pago: 50% anticipo, 50% contra entrega del informe.\nLos repuestos no incluidos se cotizan por separado.\nIncluye informe técnico, hojas de vida actualizadas y rotulación de equipos.' },
    cuenta_cobro: { titulo: 'Cuenta de cobro', codigo: 'CC', version: '001', fecha: '2026-01-01' },
  };

  const VALORACION = [
    'Equipo queda en funcionamiento', 'Se adjunta verificación de variables', 'Se debe enviar a laboratorio',
    'No usar, retirar del servicio', 'Requiere cotización', 'Tecnología obsoleta requiere cambio',
    'Equipo encontrado en servicio', 'Servicio concluido',
  ];

  const PERIODICIDAD = { 'Mensual': 1, 'Bimestral': 2, 'Trimestral': 3, 'Cuatrimestral': 4, 'Semestral': 6, 'Anual': 12, 'No aplica': 0 };
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const RIESGO = { I: 'Clase I · Bajo', IIa: 'Clase IIa · Moderado', IIb: 'Clase IIb · Alto', III: 'Clase III · Muy alto' };
  const ESTADOS = ['Activo', 'En mantenimiento', 'Fuera de servicio', 'Dado de baja'];
  const CONSECUENCIAS = ['Muerte', 'Deterioro grave', 'Lesión temporal', 'Sin consecuencias'];

  return { EMPRESA, SUBS_CRONO, CARPETAS_ENTIDAD, CARPETAS_EQUIPO, FORMATOS, VALORACION, PERIODICIDAD, MESES, RIESGO, ESTADOS, CONSECUENCIAS };
})();
