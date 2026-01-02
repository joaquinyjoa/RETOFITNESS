import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-client';
import { Recepcion } from '../models/recepcion.interface';

@Injectable({
  providedIn: 'root'
})
export class RecepcionService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  // Login de recepción con Supabase Auth
  async loginRecepcion(correo: string, contraseña: string): Promise<{ success: boolean; data?: Recepcion; error?: string }> {
    try {
      console.log('RecepcionService: Intentando login con Supabase Auth:', correo);
      
      // Usar el sistema de autenticación de Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: correo,
        password: contraseña
      });

      if (authError) {
        console.log('RecepcionService: Error de autenticación:', authError.message);
        return { 
          success: false, 
          error: authError.message === 'Invalid login credentials' 
            ? 'Correo o contraseña incorrectos' 
            : authError.message 
        };
      }

      if (!authData.user) {
        console.log('RecepcionService: No se obtuvo usuario después de autenticación');
        return { success: false, error: 'Error al obtener datos del usuario' };
      }

      console.log('RecepcionService: Autenticación exitosa, obteniendo datos de recepción...');

      // Obtener los datos de recepción usando el user_id
      const { data: recepcion, error: recepcionError } = await this.supabase
        .from('recepcion')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (recepcionError || !recepcion) {
        console.log('RecepcionService: No se encontró recepción para este usuario');
        await this.supabase.auth.signOut();
        return { success: false, error: 'No se encontraron datos de recepción' };
      }

      console.log('RecepcionService: Login de recepción exitoso');
      return { success: true, data: recepcion };

    } catch (error: any) {
      console.error('RecepcionService: Error inesperado en loginRecepcion:', error);
      return { success: false, error: error.message };
    }
  }
}
