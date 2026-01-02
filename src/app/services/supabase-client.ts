import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * INSTANCIA ÚNICA Y GLOBAL DE SUPABASE
 * Esta es la ÚNICA instancia que debe existir en toda la aplicación
 * para evitar conflictos de NavigatorLock
 */
let supabaseClientInstance: SupabaseClient | null = null;

/**
 * Obtiene o crea la instancia única del cliente de Supabase
 * @returns SupabaseClient - Instancia singleton del cliente
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClientInstance) {
    const supabaseUrl = 'https://tylyzyivlvibfyvetchr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bHl6eWl2bHZpYmZ5dmV0Y2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODQzODIsImV4cCI6MjA3Njc2MDM4Mn0.Q0jRpYSJlunENflglEtVtKURBVn_W6KrVEaXZvnCY3o';
    
    supabaseClientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: window.localStorage
      },
      global: {
        headers: {
          'x-application-name': 'retofitness-app',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
  return supabaseClientInstance;
}
