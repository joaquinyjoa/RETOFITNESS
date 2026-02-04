import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-client';
import { Recepcion } from '../models/recepcion.interface';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class RecepcionService {
  private supabase: SupabaseClient;

  constructor(private logger: LoggerService) {
    this.supabase = getSupabaseClient();
  }

  // Login de recepción con Supabase Auth
  async loginRecepcion(correo: string, contraseña: string): Promise<{ success: boolean; data?: Recepcion; error?: string }> {
    try {
      // Usar el sistema de autenticación de Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: correo,
        password: contraseña
      });

      if (authError) {
        return { 
          success: false, 
          error: authError.message === 'Invalid login credentials' 
            ? 'Correo o contraseña incorrectos' 
            : authError.message 
        };
      }

      if (!authData.user) {
        return { success: false, error: 'Error al obtener datos del usuario' };
      }

      // Obtener los datos de recepción usando el user_id
      const { data: recepcion, error: recepcionError } = await this.supabase
        .from('recepcion')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (recepcionError || !recepcion) {
        await this.supabase.auth.signOut();
        return { success: false, error: 'No se encontraron datos de recepción' };
      }
      return { success: true, data: recepcion };

    } catch (error: any) {
      this.logger.error('RecepcionService: Error inesperado en loginRecepcion:', error);
      return { success: false, error: error.message };
    }
  }
}
