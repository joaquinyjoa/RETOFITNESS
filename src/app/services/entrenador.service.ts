import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
  private supabaseUrl = 'https://tylyzyivlvibfyvetchr.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bHl6eWl2bHZpYmZ5dmV0Y2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODQzODIsImV4cCI6MjA3Njc2MDM4Mn0.Q0jRpYSJlunENflglEtVtKURBVn_W6KrVEaXZvnCY3o';
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  // Verificar login de entrenador
  async loginEntrenador(correo: string, contraseña: string): Promise<{ success: boolean; data?: Entrenador; error?: string }> {
    try {
      console.log('EntrenadorService: Intentando login con correo:', correo);
      
      const { data, error } = await this.supabase
        .from('entrenadores')
        .select('*')
        .eq('correo', correo)
        .eq('contraseña', contraseña)
        .single();

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