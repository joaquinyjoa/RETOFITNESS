import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-client';

// NO crear instancia aquí, usar la del archivo centralizado

// Interfaz para el entrenador
export interface Entrenador {
  id?: number;
  nombre: string;
  apellido: string;
  correo: string;
  contraseña: string;
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
      console.log('EntrenadorService: Intentando login con correo:', correo);
      
      const query = this.supabase
        .from('entrenadores')
        .select('*')
        .eq('correo', correo)
        .eq('contraseña', contraseña)
        .single();

      // Ejecutar la consulta directamente
      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Credenciales incorrectas' };
        }
        console.error('EntrenadorService: Error en login:', error);
        return { success: false, error: error.message };
      }

      console.log('EntrenadorService: Login exitoso:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('EntrenadorService: Error en loginEntrenador:', error);
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