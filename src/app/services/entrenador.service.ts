import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-client';

// NO crear instancia aquí, usar la del archivo centralizado

// Interfaz para el entrenador
export interface Entrenador {
  id?: number;
  user_id?: string; // ID de Supabase Auth
  nombre: string;
  apellido: string;
  correo: string;
  // contraseña ya no se almacena aquí, la maneja Supabase Auth
}

@Injectable({
  providedIn: 'root'
})
export class EntrenadorService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  // Helper para aplicar timeout a promesas de fetch


  // Verificar login de entrenador
  async loginEntrenador(correo: string, contraseña: string): Promise<{ success: boolean; data?: Entrenador; error?: string }> {
    try {
      console.log('EntrenadorService: Intentando login con Supabase Auth:', correo);
      
      // Usar el sistema de autenticación de Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: correo,
        password: contraseña
      });

      if (authError) {
        console.log('EntrenadorService: Error de autenticación:', authError.message);
        return { 
          success: false, 
          error: authError.message === 'Invalid login credentials' 
            ? 'Correo o contraseña incorrectos' 
            : authError.message 
        };
      }

      if (!authData.user) {
        console.log('EntrenadorService: No se obtuvo usuario después de autenticación');
        return { success: false, error: 'Error al obtener datos del usuario' };
      }

      console.log('EntrenadorService: Autenticación exitosa, obteniendo datos del entrenador...');

      // Obtener los datos del entrenador usando el user_id
      const { data: entrenador, error: entrenadorError } = await this.supabase
        .from('entrenadores')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (entrenadorError || !entrenador) {
        console.log('EntrenadorService: No se encontró entrenador para este usuario');
        // Cerrar la sesión si no es entrenador
        await this.supabase.auth.signOut();
        return { success: false, error: 'No se encontraron datos del entrenador' };
      }

      console.log('EntrenadorService: Login de entrenador exitoso');
      return { success: true, data: entrenador };

    } catch (error: any) {
      console.error('EntrenadorService: Error inesperado en loginEntrenador:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener entrenador por ID
  async obtenerEntrenadorPorId(id: number): Promise<{ success: boolean; data?: Entrenador; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('entrenadores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Entrenador no encontrado' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('EntrenadorService: Error en obtenerEntrenadorPorId:', error);
      return { success: false, error: error.message };
    }
  }
}