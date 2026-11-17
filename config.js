// ============================================================
//  CONFIGURACIÓN DE SUPABASE (reusa el mismo proyecto)
//  El anon key es PÚBLICO por diseño. La seguridad la da RLS.
// ============================================================
const SUPABASE_URL      = "https://aqcpkfodvzwvsxyhihrn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxY3BrZm9kdnp3dnN4eWhpaHJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NTYzMTMsImV4cCI6MjEwOTIzMjMxM30.K_k7yxlrDSnrxrv_bJe35uDNJn6LUiI4Ocx0DJM2AJg";

const SUPABASE_LISTO =
  !SUPABASE_URL.includes("TU-PROYECTO") && !SUPABASE_ANON_KEY.includes("TU_ANON_KEY");

const supaClient = SUPABASE_LISTO
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
