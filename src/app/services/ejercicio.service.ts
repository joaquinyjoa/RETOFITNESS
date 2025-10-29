import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Ejercicio } from '../models/ejercicio/ejercicio.interface';

@Injectable({
  providedIn: 'root'
})
export class EjercicioService {

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Listar todos los ejercicios activos
   */
  async listarEjercicios(): Promise<Ejercicio[]> {
    try {
      const { data, error } = await this.supabaseService['supabase']
        .from('ejercicios')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('EjercicioService.listarEjercicios error:', error);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('Error en listarEjercicios:', error);
      return [];
    }
  }

  /**
   * Crear un nuevo ejercicio
   */
  async crearEjercicio(ejercicio: Ejercicio): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('EjercicioService: Creando ejercicio:', ejercicio);

      // Validar que el enlace de Google Drive sea válido
      if (!this.isValidGoogleDriveUrl(ejercicio.enlace_video)) {
        return { success: false, error: 'El enlace de Google Drive no es válido' };
      }

      // Validar duración del video (máximo 20 segundos)
      if (ejercicio.duracion_minutos && ejercicio.duracion_minutos > 0.33) { // 20 segundos = 0.33 minutos
        return { success: false, error: 'Los videos no pueden durar más de 20 segundos (0.33 minutos)' };
      }

      const { data, error } = await this.supabaseService['supabase']
        .from('ejercicios')
        .insert([ejercicio])
        .select()
        .single();

      if (error) {
        console.error('EjercicioService: Error al crear ejercicio:', error);
        return { success: false, error: error.message };
      }

      console.log('EjercicioService: Ejercicio creado exitosamente:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error en crearEjercicio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar un ejercicio existente
   */
  async actualizarEjercicio(id: number, ejercicio: Partial<Ejercicio>): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Validar enlace de Google Drive si se está actualizando
      if (ejercicio.enlace_video && !this.isValidGoogleDriveUrl(ejercicio.enlace_video)) {
        return { success: false, error: 'El enlace de Google Drive no es válido' };
      }

      const { data, error } = await this.supabaseService['supabase']
        .from('ejercicios')
        .update(ejercicio)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('EjercicioService: Error al actualizar ejercicio:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error en actualizarEjercicio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Desactivar un ejercicio (soft delete)
   */
  async desactivarEjercicio(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseService['supabase']
        .from('ejercicios')
        .update({ activo: false })
        .eq('id', id);

      if (error) {
        console.error('EjercicioService: Error al desactivar ejercicio:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error en desactivarEjercicio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar ejercicios por categoría
   */
  async buscarPorCategoria(categoria: string): Promise<Ejercicio[]> {
    try {
      const { data, error } = await this.supabaseService['supabase']
        .from('ejercicios')
        .select('*')
        .eq('categoria', categoria)
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('EjercicioService.buscarPorCategoria error:', error);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('Error en buscarPorCategoria:', error);
      return [];
    }
  }

  /**
   * Buscar ejercicios por músculo principal
   */
  async buscarPorMusculo(musculo: string): Promise<Ejercicio[]> {
    try {
      const { data, error } = await this.supabaseService['supabase']
        .from('ejercicios')
        .select('*')
        .eq('musculo_principal', musculo)
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('EjercicioService.buscarPorMusculo error:', error);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('Error en buscarPorMusculo:', error);
      return [];
    }
  }

  /**
   * Validar que el enlace sea de Google Drive (URL directa o preview)
   */
  private isValidGoogleDriveUrl(url: string): boolean {
    const googleDrivePatterns = [
      /^https:\/\/drive\.google\.com\/(file\/d\/|open\?id=)/,
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+\/preview$/,
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+\/view$/
    ];
    
    return googleDrivePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Convertir enlace de Google Drive a formato de vista directa
   */
  convertToDirectViewUrl(url: string): string {
    // Extraer el ID del archivo de diferentes formatos de URL de Google Drive
    let fileId = '';
    
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /[?&]id=([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        fileId = match[1];
        break;
      }
    }

    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    return url; // Devolver URL original si no se puede convertir
  }
}