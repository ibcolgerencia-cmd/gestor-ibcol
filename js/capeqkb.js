// =====================================================================
//  CAPACITACIONES EN EQUIPOS BIOMÉDICOS · contenido base (IBCOL)
//  Por cada tipo de equipo: diapositivas de la presentación y banco de
//  preguntas del pre y post test (c = índice de la opción correcta).
//  El contenido se puede ajustar por sesión desde el gestor.
// =====================================================================
(() => {
  const A = window.APP, P = (A.PROT = A.PROT || {});
  const q = (p, o, c) => ({ p, o, c: Array.isArray(c) ? c : [c] });

  P.CAP_EQ = [
    // ------------------------------------------------------------------ CENTRÍFUGA
    { k: 'centrifuga', n: 'Centrífuga', clase: 'IIa', re: /centr[ií]fug/i, dirigido: 'Bacteriólogos y auxiliares de laboratorio clínico',
      objetivo: 'Fortalecer el uso seguro, la limpieza y los cuidados de la centrífuga de laboratorio para garantizar la calidad de las muestras y la seguridad del operador.',
      diapos: [
        ['¿Qué es y para qué sirve?', ['Equipo que separa los componentes de una muestra (suero, plasma, sedimento) por la fuerza centrífuga generada al girar a alta velocidad.', 'Se usa para obtener suero o plasma, sedimento urinario y otras preparaciones del laboratorio clínico.', 'La separación depende de la velocidad (rpm o fuerza g) y del tiempo programado.']],
        ['Partes principales', ['Cámara y tapa con seguro (interlock) que impide abrirla mientras gira.', 'Rotor y portatubos (cabezal angular o basculante).', 'Panel de control: velocidad (rpm / RCF), tiempo, inicio, parada y freno.', 'Motor, sistema de freno y sensor de desbalance.']],
        ['Antes de usarla', ['Verifique que la centrífuga esté nivelada, sobre una superficie firme y conectada a una toma con polo a tierra.', 'Revise que el rotor y los portatubos estén limpios, completos y sin grietas.', 'Use tubos adecuados para centrífuga, tapados y sin fisuras.', 'Programe la velocidad y el tiempo indicados en el procedimiento del examen.']],
        ['Balanceo de la carga', ['Coloque siempre los tubos en posiciones opuestas y con el mismo volumen y peso.', 'Si tiene un número impar de muestras, complete con un tubo con agua del mismo volumen.', 'Una carga desbalanceada produce vibración, ruido, ruptura de tubos y daño del rotor y del motor.', 'Nunca supere la capacidad ni la velocidad máxima del rotor.']],
        ['Operación segura', ['Cierre la tapa antes de iniciar; no la fuerce ni anule el seguro.', 'Si escucha ruido o vibración anormal, detenga el equipo y revise el balance.', 'No abra la tapa hasta que el rotor se detenga por completo.', 'No se apoye ni deje objetos sobre la centrífuga mientras funciona.']],
        ['Ruptura de tubos o derrames', ['Apague el equipo y espere 30 minutos antes de abrir (los aerosoles pueden ser infecciosos).', 'Use guantes, bata y protección ocular.', 'Retire los vidrios con pinzas, nunca con las manos.', 'Limpie y desinfecte la cámara, el rotor y los portatubos; informe al líder del servicio.']],
        ['Limpieza, desinfección y cuidados', ['Limpieza diaria de la cámara y los portatubos con el desinfectante institucional, con el equipo apagado y desconectado.', 'No use productos abrasivos ni rocíe líquido en el panel.', 'Deje la tapa abierta al terminar para que se seque la humedad.', 'Registre la limpieza en el formato FMB-006.']],
        ['Mantenimiento y metrología', ['Mantenimiento preventivo según el cronograma (FMB-002): revisión del motor, escobillas, freno, seguro de la tapa y desbalance.', 'Verificación metrológica de velocidad (rpm) y tiempo con tacómetro y cronómetro calibrados.', 'Nunca use una centrífuga con etiqueta de fuera de servicio o calibración vencida.']],
      ],
      preguntas: [
        q('¿Qué se debe hacer si hay un número impar de tubos para centrifugar?', ['Centrifugar así, no pasa nada', 'Completar con un tubo con agua del mismo volumen en la posición opuesta', 'Aumentar la velocidad', 'Dejar la tapa abierta'], 1),
        q('¿Cuándo se puede abrir la tapa de la centrífuga?', ['Cuando falten pocos segundos', 'Cuando el rotor se haya detenido por completo', 'En cualquier momento', 'Cuando suene la alarma de desbalance'], 1),
        q('Si se rompe un tubo dentro de la centrífuga, lo correcto es:', ['Abrir de inmediato y retirar el vidrio con la mano', 'Apagar, esperar unos 30 minutos y limpiar con elementos de protección y pinzas', 'Seguir centrifugando', 'Echar agua en la cámara'], 1),
        q('Una carga desbalanceada puede producir:', ['Mejor separación de la muestra', 'Vibración, ruptura de tubos y daño del rotor y del motor', 'Ahorro de energía', 'Nada'], 1),
        q('La limpieza de la cámara y los portatubos se realiza:', ['Una vez al año', 'Diariamente y ante cualquier derrame', 'Solo en el mantenimiento preventivo', 'Nunca'], 1),
        q('¿Qué función cumple el seguro (interlock) de la tapa?', ['Evitar que la tapa se abra mientras el rotor gira', 'Aumentar la velocidad', 'Medir la temperatura', 'Ninguna'], 0),
        q('¿Qué magnitudes se verifican en la metrología de la centrífuga?', ['Peso y volumen', 'Velocidad (rpm) y tiempo', 'Temperatura y humedad', 'Presión'], 1),
        q('Al limpiar la centrífuga se debe:', ['Rociar el desinfectante directamente sobre el panel', 'Apagarla, desconectarla y usar el paño humedecido con el desinfectante', 'Sumergir el equipo', 'Usar productos abrasivos'], 1),
        q('Si la centrífuga hace un ruido o vibración anormal, usted debe:', ['Subir la velocidad', 'Detenerla, revisar el balance de la carga y reportar si persiste', 'Ignorarlo', 'Sostener la tapa con la mano'], 1),
        q('¿Qué tubos se deben usar?', ['Cualquier tubo, aunque esté fisurado', 'Tubos aptos para centrífuga, tapados y sin fisuras', 'Tubos destapados', 'Tubos de diferentes volúmenes'], 1),
      ] },

    // ------------------------------------------------------------------ ELECTROCARDIÓGRAFO
    { k: 'electrocardiografo', n: 'Electrocardiógrafo', clase: 'IIa', re: /electrocardi|\becg\b|\bekg\b/i, dirigido: 'Médicos, enfermeras y auxiliares de enfermería',
      objetivo: 'Fortalecer la toma correcta del electrocardiograma, el uso seguro del equipo y sus cuidados para obtener trazados confiables.',
      diapos: [
        ['¿Qué es el electrocardiógrafo?', ['Equipo que registra la actividad eléctrica del corazón mediante electrodos colocados en la piel.', 'Produce el electrocardiograma (ECG) de 12 derivaciones: 6 de extremidades (I, II, III, aVR, aVL, aVF) y 6 precordiales (V1 a V6).', 'Apoya el diagnóstico de arritmias, isquemia, infarto y otras alteraciones cardiacas.']],
        ['Partes principales', ['Unidad principal con pantalla, teclado e impresora térmica.', 'Cable de paciente (10 latiguillos) y electrodos: pinzas de extremidades, peras de succión o electrodos adhesivos.', 'Batería interna y cable de alimentación con polo a tierra.', 'Papel térmico milimetrado.']],
        ['Preparación del paciente', ['Explique el procedimiento y pida al paciente que permanezca quieto, relajado y sin hablar.', 'Retire objetos metálicos y celulares cercanos.', 'Limpie la piel (y rasure si es necesario) para mejorar el contacto del electrodo.', 'Aplique gel conductor o use electrodos adhesivos nuevos.']],
        ['Ubicación de los electrodos', ['Extremidades: RA (rojo / blanco) brazo derecho, LA (amarillo / negro) brazo izquierdo, LL (verde / rojo) pierna izquierda, RL (negro / verde) pierna derecha.', 'V1: 4.º espacio intercostal, borde derecho del esternón. V2: 4.º espacio, borde izquierdo.', 'V4: 5.º espacio, línea medioclavicular izquierda. V3: entre V2 y V4.', 'V5: línea axilar anterior y V6: línea axilar media, a la altura de V4.']],
        ['Toma del trazado', ['Verifique la velocidad (25 mm/s) y la ganancia (10 mm/mV).', 'Revise que el trazado sea estable antes de imprimir.', 'Registre en el trazado: nombre, documento, edad, fecha y hora.', 'Artefactos comunes: temblor, movimiento, mal contacto, interferencia de 60 Hz; corríjalos antes de imprimir.']],
        ['Fallas frecuentes y qué hacer', ['Mensaje «derivación desconectada»: revise el latiguillo y el contacto del electrodo.', 'Línea de base irregular: paciente en movimiento, electrodos secos o cable tensionado.', 'No imprime: verifique el papel (lado térmico) y la tapa de la impresora.', 'Cables rotos o pelados: retire el equipo y reporte a ingeniería biomédica.']],
        ['Limpieza, desinfección y cuidados', ['Después de cada paciente: retire el gel de pinzas y peras y desinfecte los cables con paño humedecido.', 'No sumerja los cables ni enrolle con fuerza; evite doblarlos.', 'Mantenga la batería cargada y el equipo conectado cuando no se use.', 'Guarde el papel lejos del calor y la luz.']],
        ['Mantenimiento, metrología y tecnovigilancia', ['Mantenimiento preventivo según el cronograma y verificación con simulador de ECG (amplitud y frecuencia).', 'Prueba de seguridad eléctrica (corrientes de fuga).', 'Toda falla que afecte o pudo afectar al paciente se reporta en el formato FT-PGTV-016.']],
      ],
      preguntas: [
        q('¿Cuántas derivaciones registra un electrocardiograma estándar?', ['3', '6', '12', '24'], 2),
        q('El electrodo V1 se ubica en:', ['5.º espacio intercostal, línea medioclavicular izquierda', '4.º espacio intercostal, borde derecho del esternón', 'Línea axilar media', 'Brazo derecho'], 1),
        q('¿Cuál es la velocidad estándar del papel?', ['10 mm/s', '25 mm/s', '50 mm/s', '100 mm/s'], 1),
        q('El electrodo de la pierna derecha (RL) cumple la función de:', ['Medir la derivación V6', 'Referencia / tierra para reducir interferencias', 'Ninguna', 'Medir la presión'], 1),
        q('Una línea de base irregular puede deberse a:', ['Paciente en movimiento o electrodos con mal contacto', 'Papel nuevo', 'Batería cargada', 'Ganancia en 10 mm/mV'], 0),
        q('Antes de colocar los electrodos se debe:', ['Aplicar crema hidratante', 'Limpiar la piel para mejorar el contacto', 'Mojar los cables', 'Nada'], 1),
        q('Si un cable de paciente está roto o pelado, usted debe:', ['Aislarlo con cinta y seguir usándolo', 'Retirar el equipo del servicio y reportarlo a ingeniería biomédica', 'Cambiarlo por cualquier cable', 'Ignorarlo'], 1),
        q('La limpieza de cables, pinzas y peras se realiza:', ['Después de cada paciente', 'Una vez al mes', 'Solo cuando se ven sucios', 'Nunca'], 0),
        q('¿Con qué se verifica metrológicamente el electrocardiógrafo?', ['Con un termómetro', 'Con un simulador de ECG', 'Con una balanza', 'Con un cronómetro'], 1),
        q('Una falla del equipo que pudo afectar al paciente se reporta en:', ['El formato FT-PGTV-016 de tecnovigilancia', 'No se reporta', 'Un mensaje de voz', 'La historia clínica únicamente'], 0),
      ] },

    // ------------------------------------------------------------------ ELECTROBISTURÍ
    { k: 'electrobisturi', n: 'Electrobisturí', clase: 'IIb', re: /electrobist|electrocaut|electroquir|bistur[ií]/i, dirigido: 'Médicos y personal de procedimientos menores',
      objetivo: 'Fortalecer el uso seguro del electrobisturí, la prevención de quemaduras e incendios y los cuidados del equipo y sus accesorios.',
      diapos: [
        ['¿Qué es el electrobisturí?', ['Equipo que usa corriente eléctrica de alta frecuencia para cortar tejido y coagular (hemostasia).', 'Modos principales: corte, coagulación y mezcla (blend).', 'Clase de riesgo alto: un uso incorrecto puede causar quemaduras al paciente o al operador.']],
        ['Monopolar y bipolar', ['Monopolar: la corriente va del electrodo activo (lápiz) a la placa de retorno (placa neutra) a través del cuerpo del paciente.', 'Bipolar: la corriente circula solo entre las dos puntas de la pinza; no requiere placa de retorno.', 'Use la potencia mínima eficaz para el procedimiento.']],
        ['La placa de retorno (placa neutra)', ['Colóquela sobre una zona muscular, bien vascularizada, limpia, seca y sin vello, cerca del sitio quirúrgico.', 'Evite prominencias óseas, cicatrices, tatuajes, prótesis metálicas y zonas con líquidos.', 'Debe quedar completamente adherida; nunca la corte ni la reutilice si es desechable.', 'Si el equipo da alarma de la placa (REM), no la ignore: revise la adherencia.']],
        ['Prevención de quemaduras', ['El paciente no debe tocar partes metálicas de la camilla ni otros elementos conectados a tierra.', 'Guarde el lápiz en su funda aislante cuando no se use; nunca lo deje sobre el paciente.', 'Revise que cables y lápiz no estén pelados ni rotos.', 'Retire joyas y objetos metálicos del paciente.']],
        ['Prevención de incendios', ['Deje secar los antisépticos con alcohol antes de activar el equipo.', 'Tenga precaución con el oxígeno suplementario cerca del campo quirúrgico.', 'Mantenga gasas y compresas húmedas cerca del sitio de uso.', 'Active el electrodo solo cuando la punta esté en contacto con el tejido.']],
        ['Pacientes con marcapasos o implantes', ['Consulte al médico antes de usar el modo monopolar en pacientes con marcapasos o desfibrilador implantado.', 'Prefiera el modo bipolar cuando sea posible.', 'Coloque la placa de modo que la corriente no atraviese el dispositivo implantado.', 'Tenga disponible monitoreo y desfibrilador.']],
        ['Humo quirúrgico, limpieza y cuidados', ['El humo quirúrgico contiene partículas y agentes potencialmente infecciosos: use tapabocas y, si existe, evacuador de humo.', 'Después de cada procedimiento desinfecte la unidad y los cables; el electrodo activo se esteriliza o desecha según el fabricante.', 'Limpie la punta del electrodo con el limpiador adecuado, no la raspe con bisturí.']],
        ['Mantenimiento, metrología y tecnovigilancia', ['Mantenimiento preventivo según el cronograma y verificación de la potencia de salida con analizador de electrobisturí.', 'Prueba de seguridad eléctrica y del sistema de monitoreo de la placa.', 'Toda quemadura o falla se reporta como evento o incidente adverso en el formato FT-PGTV-016.']],
      ],
      preguntas: [
        q('En el modo monopolar la corriente regresa al equipo a través de:', ['La pinza bipolar', 'La placa de retorno (placa neutra)', 'El aire', 'El cable de alimentación'], 1),
        q('¿Dónde se debe colocar la placa de retorno?', ['Sobre una prominencia ósea', 'Sobre una zona muscular, limpia, seca y bien vascularizada, cerca del sitio quirúrgico', 'Sobre un tatuaje', 'En cualquier lugar'], 1),
        q('Si el equipo genera alarma de la placa de retorno, usted debe:', ['Ignorarla y continuar', 'Revisar la adherencia y la ubicación de la placa antes de continuar', 'Subir la potencia', 'Cortar la placa'], 1),
        q('Para prevenir incendios se debe:', ['Activar el equipo con el antiséptico húmedo', 'Dejar secar los antisépticos con alcohol antes de activar el equipo', 'Aumentar el oxígeno', 'Usar gasas secas cerca del electrodo'], 1),
        q('Cuando el lápiz no se está usando debe quedar:', ['Sobre el paciente', 'En su funda aislante', 'Colgando de la camilla', 'Encendido'], 1),
        q('¿Qué modo es preferible en un paciente con marcapasos, si es posible?', ['Monopolar a máxima potencia', 'Bipolar', 'Ninguno', 'Corte puro'], 1),
        q('La potencia del equipo se debe programar:', ['Siempre al máximo', 'En la mínima potencia eficaz para el procedimiento', 'Al azar', 'Igual para todos los procedimientos'], 1),
        q('¿Qué riesgo tiene el humo quirúrgico?', ['Ninguno', 'Contiene partículas y agentes potencialmente infecciosos', 'Mejora la visión', 'Es solo vapor de agua'], 1),
        q('¿Con qué se verifica metrológicamente el electrobisturí?', ['Con un analizador de electrobisturí (potencia de salida)', 'Con una balanza', 'Con un termómetro', 'No requiere verificación'], 0),
        q('Una quemadura del paciente asociada al electrobisturí se debe:', ['Ocultar', 'Reportar como evento adverso en el formato FT-PGTV-016', 'Reportar solo si el paciente se queja', 'Registrar únicamente en la historia clínica'], 1),
      ] },

    // ------------------------------------------------------------------ ECÓGRAFO
    { k: 'ecografo', n: 'Ecógrafo', clase: 'IIa', re: /ec[oó]graf|ultrason(ido|ógrafo)|ecogr/i, dirigido: 'Médicos ecografistas y personal de apoyo',
      objetivo: 'Fortalecer el uso seguro del ecógrafo y el cuidado de los transductores para garantizar imágenes de calidad y evitar daños costosos.',
      diapos: [
        ['¿Qué es el ecógrafo?', ['Equipo de diagnóstico por imagen que usa ondas de ultrasonido (no ionizantes) para obtener imágenes en tiempo real.', 'El transductor emite el ultrasonido y recibe los ecos que el equipo convierte en imagen.', 'Modos: B (2D), M, Doppler color y Doppler pulsado.']],
        ['Partes principales', ['Consola: panel de control, monitor y computador.', 'Transductores (sondas): convexo (abdomen y obstetricia), lineal (partes blandas y vascular), endocavitario y sectorial.', 'Impresora, almacenamiento de imágenes y conexión a red.', 'Gel conductor de ultrasonido.']],
        ['Cuidado de los transductores', ['Son la parte más delicada y costosa del equipo: evite golpes y caídas.', 'No pise ni doble los cables; no los deje colgando.', 'Revise la superficie del transductor: grietas o burbujas pueden afectar la imagen y la seguridad eléctrica.', 'Guárdelo en su soporte después de cada uso.']],
        ['Uso seguro', ['Aplique el principio ALARA: la menor exposición necesaria para obtener la imagen diagnóstica.', 'Use solo gel de ultrasonido; no use otros productos como acople.', 'Encienda y apague el equipo con el procedimiento del fabricante; no lo desconecte en caliente.', 'Mantenga los filtros de ventilación limpios y el equipo sobre una superficie estable.']],
        ['Limpieza y desinfección del transductor', ['Después de cada paciente retire el gel con paño suave y desinfecte con el producto aprobado por el fabricante.', 'Transductor endocavitario: use funda protectora por paciente y desinfección de alto nivel según el fabricante.', 'Nunca sumerja el conector ni use alcohol o productos no aprobados que dañen la lente.', 'Limpie la consola y el teclado a diario.']],
        ['Fallas frecuentes y qué hacer', ['Líneas o zonas oscuras en la imagen: posible daño de elementos del transductor; repórtelo.', 'El equipo no enciende o se reinicia: verifique la alimentación y reporte.', 'Imagen con ruido: revise la ganancia, el gel y el contacto con la piel.', 'Cable pelado o carcasa rota: retire el transductor de uso.']],
        ['Mantenimiento y tecnovigilancia', ['Mantenimiento preventivo según el cronograma: limpieza interna, ventiladores, pruebas de imagen con fantoma y seguridad eléctrica.', 'Actualizaciones de software solo por el proveedor autorizado.', 'Las fallas que afecten o pudieron afectar el diagnóstico se reportan en el formato FT-PGTV-016.']],
      ],
      preguntas: [
        q('¿Qué tipo de energía usa el ecógrafo para obtener la imagen?', ['Rayos X', 'Ondas de ultrasonido', 'Campo magnético', 'Luz infrarroja'], 1),
        q('¿Cuál es la parte más delicada y costosa del ecógrafo?', ['El teclado', 'Los transductores', 'La impresora', 'El cable de poder'], 1),
        q('¿Qué significa el principio ALARA?', ['Usar la máxima potencia siempre', 'Usar la menor exposición necesaria para obtener la imagen diagnóstica', 'Apagar el equipo cada hora', 'No usar gel'], 1),
        q('Después de cada paciente el transductor se debe:', ['Guardar con el gel', 'Limpiar el gel y desinfectar con el producto aprobado por el fabricante', 'Sumergir completo con el conector', 'Limpiar con alcohol puro siempre'], 1),
        q('El transductor endocavitario requiere:', ['Funda protectora por paciente y desinfección de alto nivel', 'Solo agua', 'Ningún cuidado', 'Limpieza una vez al mes'], 0),
        q('¿Qué producto se usa como acople entre el transductor y la piel?', ['Crema hidratante', 'Gel de ultrasonido', 'Alcohol', 'Aceite'], 1),
        q('Si aparecen líneas oscuras verticales en la imagen, puede indicar:', ['Daño de elementos del transductor', 'Que el equipo está nuevo', 'Exceso de gel', 'Nada importante'], 0),
        q('¿Qué se debe hacer con un transductor con la carcasa rota?', ['Seguir usándolo con cuidado', 'Retirarlo de uso y reportarlo a ingeniería biomédica', 'Pegarlo con cinta', 'Usarlo solo en adultos'], 1),
        q('Para cuidar los cables de los transductores se debe:', ['Dejarlos en el piso', 'Evitar pisarlos, doblarlos o dejarlos colgando', 'Enrollarlos con fuerza', 'Desconectarlos con el equipo encendido'], 1),
        q('Las actualizaciones de software del ecógrafo las realiza:', ['Cualquier persona', 'Solo el proveedor autorizado', 'El paciente', 'No se actualiza nunca'], 1),
      ] },

    // ------------------------------------------------------------------ TENS
    { k: 'tens', n: 'TENS (electroestimulador)', clase: 'IIa', re: /\btens\b|electroestim|electro estim|estimulador/i, dirigido: 'Fisioterapeutas y personal de rehabilitación',
      objetivo: 'Fortalecer la aplicación segura de la electroestimulación TENS, sus contraindicaciones y los cuidados del equipo y los electrodos.',
      diapos: [
        ['¿Qué es el TENS?', ['Estimulación eléctrica nerviosa transcutánea: corriente eléctrica de baja intensidad aplicada sobre la piel con electrodos.', 'Se usa principalmente para el alivio del dolor y, en otros equipos, para estimulación muscular (EMS).', 'Parámetros: frecuencia (Hz), ancho de pulso (µs), intensidad (mA) y tiempo de aplicación.']],
        ['Partes principales', ['Unidad con controles de intensidad por canal y selección de programa.', 'Cables de conexión y electrodos autoadhesivos o de caucho con esponja.', 'Batería o fuente de alimentación.']],
        ['Contraindicaciones', ['Pacientes con marcapasos o desfibrilador implantado.', 'Sobre el área cardiaca, la parte anterior del cuello (seno carotídeo), los ojos o la cabeza.', 'Abdomen o zona lumbar en embarazadas.', 'Sobre heridas abiertas, piel lesionada, zonas con trombosis, tumores o pérdida de sensibilidad.', 'Pacientes con epilepsia no controlada o que no pueden comunicar sus molestias.']],
        ['Aplicación segura', ['Revise la piel antes de colocar los electrodos: limpia, seca e íntegra.', 'Encienda el equipo con la intensidad en cero y auméntela poco a poco hasta una sensación cómoda.', 'Nunca coloque ni retire los electrodos con el equipo encendido.', 'Vigile la piel durante y después de la sesión (enrojecimiento, ardor, quemadura).']],
        ['Electrodos', ['Use electrodos en buen estado: si no se adhieren bien concentran la corriente y pueden quemar.', 'Los autoadhesivos son de uso individual; guárdelos en su empaque y cámbielos cuando pierdan adherencia.', 'Separe los electrodos al menos el ancho de uno; no los coloque uno sobre otro.']],
        ['Limpieza, desinfección y cuidados', ['Después de cada paciente desinfecte la unidad y los cables con paño humedecido.', 'Los electrodos de caucho y las esponjas se lavan y desinfectan; los autoadhesivos son por paciente.', 'Retire las baterías si el equipo no se va a usar por tiempo prolongado.', 'Revise que los cables no estén pelados ni rotos.']],
        ['Mantenimiento, metrología y tecnovigilancia', ['Mantenimiento preventivo según el cronograma y verificación de la salida (frecuencia, ancho de pulso, intensidad) con osciloscopio o analizador.', 'Prueba de seguridad eléctrica en los equipos conectados a la red.', 'Quemaduras o fallas se reportan como evento o incidente adverso en el formato FT-PGTV-016.']],
      ],
      preguntas: [
        q('¿Qué significa TENS?', ['Terapia de enfriamiento neuromuscular', 'Estimulación eléctrica nerviosa transcutánea', 'Tensión eléctrica normal', 'Tratamiento de energía solar'], 1),
        q('¿Cuál de estas es una contraindicación del TENS?', ['Dolor lumbar crónico', 'Paciente con marcapasos', 'Dolor de rodilla', 'Contractura muscular'], 1),
        q('¿Dónde NO se deben colocar los electrodos?', ['En la zona lumbar de un adulto sin contraindicaciones', 'En la parte anterior del cuello (seno carotídeo)', 'En el hombro', 'En la rodilla'], 1),
        q('La intensidad se debe programar:', ['Al máximo desde el inicio', 'Iniciando en cero y aumentando poco a poco hasta una sensación cómoda', 'Igual para todos los pacientes', 'Sin preguntar al paciente'], 1),
        q('Los electrodos se colocan o retiran:', ['Con el equipo encendido', 'Con el equipo apagado o en intensidad cero', 'Durante la estimulación', 'No importa'], 1),
        q('Un electrodo que no se adhiere bien puede:', ['Mejorar el tratamiento', 'Concentrar la corriente y causar quemaduras', 'Ahorrar batería', 'No tiene efecto'], 1),
        q('Los electrodos autoadhesivos son:', ['De uso individual por paciente', 'Para compartir entre todos', 'Desechables después de un año', 'Lavables con alcohol'], 0),
        q('Antes de aplicar el TENS la piel debe estar:', ['Con crema', 'Limpia, seca e íntegra', 'Húmeda', 'Con heridas'], 1),
        q('¿Qué parámetros se verifican en el TENS?', ['Peso y volumen', 'Frecuencia, ancho de pulso e intensidad de salida', 'Temperatura', 'Presión arterial'], 1),
        q('Una quemadura por el TENS se debe:', ['Reportar como evento adverso en el formato FT-PGTV-016', 'Ignorar', 'Tratar sin informar', 'Reportar solo al año'], 0),
      ] },
  ];

  // preguntas generales para cualquier otro equipo del inventario
  P.CAP_GENERAL = [
    q('Antes de usar un equipo biomédico con el paciente se debe:', ['Verificar su estado, accesorios y que no tenga etiqueta de fuera de servicio', 'Usarlo sin revisar', 'Desconectar la tierra', 'Ninguna'], 0),
    q('Si un equipo presenta una falla durante su uso, usted debe:', ['Seguir usándolo', 'Retirarlo, rotularlo «fuera de servicio» y reportarlo a ingeniería biomédica', 'Repararlo usted mismo', 'Guardarlo sin informar'], 1),
    q('La limpieza y desinfección del equipo se realiza:', ['Según el protocolo institucional y la frecuencia indicada para el equipo', 'Una vez al año', 'Solo si se ve sucio', 'Nunca'], 0),
    q('El desinfectante se aplica:', ['Directamente sobre pantallas y conectores', 'Sobre un paño, que luego se pasa por el equipo', 'Sumergiendo el equipo', 'No se usa desinfectante'], 1),
    q('Un equipo con calibración vencida:', ['Se puede usar sin problema', 'No debe usarse hasta que se calibre', 'Funciona igual', 'Solo se usa en urgencias'], 1),
    q('¿Quién está autorizado para abrir o reparar un equipo biomédico?', ['Cualquier persona del servicio', 'Solo ingeniería biomédica o el proveedor autorizado', 'El paciente', 'El personal de aseo'], 1),
    q('Un evento o incidente adverso con un equipo se reporta en:', ['El formato FT-PGTV-016 del programa de tecnovigilancia', 'No se reporta', 'Un chat personal', 'La cartelera'], 0),
    q('Los equipos eléctricos se deben conectar a:', ['Extensiones improvisadas', 'Tomas con polo a tierra en buen estado', 'Cualquier enchufe', 'Multitomas sobrecargadas'], 1),
  ];

  // contenido para un equipo que no está en la lista: se arma con el conocimiento de limpieza y metrología
  P.capGenerico = (n) => ({ k: 'otro', n, clase: '', re: null, dirigido: 'Personal asistencial que usa el equipo', objetivo: `Fortalecer el uso seguro, la limpieza y los cuidados del equipo ${String(n).toLowerCase()}.`,
    diapos: [
      ['Uso seguro del equipo', ['Use el equipo solo para el fin previsto y según el manual del fabricante.', 'Verifique su estado, accesorios y etiquetas de mantenimiento y calibración antes de usarlo.', 'Conéctelo a tomas con polo a tierra; no use extensiones improvisadas.', 'Si presenta fallas, retírelo, rotúlelo «fuera de servicio» y repórtelo.']],
      ['Fallas frecuentes y qué hacer', ['Mensajes de error o alarmas: consulte la guía rápida y no las desactive.', 'Cables pelados, carcasas rotas o líquidos derramados: retire el equipo de uso.', 'Resultados dudosos: no los entregue y verifique con ingeniería biomédica.']],
    ], preguntas: P.CAP_GENERAL });
})();
