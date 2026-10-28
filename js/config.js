// =====================================================================
//  CONFIGURACIÓN DEL GESTOR BIOMÉDICO IBCOL
//  1. Cree un proyecto gratis en https://supabase.com
//  2. Copie aquí la "Project URL" y la "anon public key"
//     (Supabase > Project Settings > API)
//  Si se dejan vacíos, la app funciona en MODO DEMOSTRACIÓN
//  (los datos se guardan solo en ese navegador).
// =====================================================================
window.IBCOL_CONFIG = {
  SUPABASE_URL: 'https://wmngnvoswrdcppsbmxsu.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_NvwpLD-9RBYaa2BDnRireQ_kzP4iT_-', // clave publicable (segura en el navegador)

  // Dominio interno para convertir "usuario" en correo de acceso.
  // El cliente entra con "clinica.sanjose" y el sistema usa "clinica.sanjose@ibcol.app"
  DOMINIO_USUARIOS: 'ibcol.app',

  // Cierre automático de sesión por inactividad (minutos)
  MINUTOS_INACTIVIDAD: 30,
};
