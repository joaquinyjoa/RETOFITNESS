import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Ejercicio } from '../models/ejercicio/ejercicio.interface';

@Injectable({
  providedIn: 'root'
})
export class EjercicioService {

  // Caché en memoria con TTL
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutos

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Obtener datos del caché si no han expirado
   */
  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Guardar datos en caché
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Invalidar todo el caché (llamar al crear/actualizar/eliminar)
   */
  private invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Listar todos los ejercicios activos
   */
  async listarEjercicios(): Promise<Ejercicio[]> {
    // Verificar caché primero
    const cached = this.getCached('ejercicios_activos');
    if (cached) {
      return cached;
    }

    const tiempoInicio = performance.now();
    
    try {
      const { data, error } = await this.supabaseService['supabase']
        .from('ejercicios')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true })
        .limit(500); // Límite para evitar sobrecarga

      if (error) {
        console.error('🔴 [EjercicioService] Error en consulta:', error);
        return [];
      }

      const tiempoFin = performance.now();
      const duracion = (tiempoFin - tiempoInicio).toFixed(2);

      const result = Array.isArray(data) ? data : [];
      
      // Guardar en caché
      this.setCache('ejercicios_activos', result);
      
      return result;
    } catch (error: any) {
      const tiempoFin = performance.now();
      const duracion = (tiempoFin - tiempoInicio).toFixed(2);
      console.error(`🔴 [EjercicioService] Error en listarEjercicios después de ${duracion}ms:`, error);
      return [];
    }
  }

  /**
   * Crear un nuevo ejercicio
   */
  async crearEjercicio(ejercicio: Ejercicio): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
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
        
        // Manejo específico de errores
        if (error.code === '23505') {
          // Error de clave duplicada
          if (error.message.includes('ejercicios_nombre_key')) {
            return { success: false, error: 'Ya existe un ejercicio con ese nombre. Por favor, usa un nombre diferente.' };
          }
          return { success: false, error: 'Ya existe un registro con esos datos.' };
        }
        
        return { success: false, error: error.message };
      }
      
      // Invalidar caché tras crear
      this.invalidateCache();
      
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
        
        // Manejo específico de errores
        if (error.code === '23505') {
          if (error.message.includes('ejercicios_nombre_key')) {
            return { success: false, error: 'Ya existe otro ejercicio con ese nombre. Por favor, usa un nombre diferente.' };
          }
          return { success: false, error: 'Ya existe un registro con esos datos.' };
        }
        
        return { success: false, error: error.message };
      }

      // Invalidar caché tras actualizar
      this.invalidateCache();

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
      // Eliminar PERMANENTEMENTE el ejercicio de la base de datos
      // La relación ON DELETE CASCADE en rutinas_ejercicios se encargará
      // de eliminar automáticamente todas las referencias en las rutinas
      const { error } = await this.supabaseService['supabase']
        .from('ejercicios')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('EjercicioService: Error al eliminar ejercicio:', error);
        return { success: false, error: error.message };
      }

      // Invalidar caché tras eliminar
      this.invalidateCache();

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
   * Validar que el enlace sea de Google Drive o Supabase Storage
   */
  private isValidGoogleDriveUrl(url: string): boolean {
    // Patrones de Google Drive
    const googleDrivePatterns = [
      /^https:\/\/drive\.google\.com\/(file\/d\/|open\?id=)/,
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+\/preview$/,
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+\/view$/
    ];
    
    // Patrón de Supabase Storage
    const supabasePattern = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//;
    
    const isGoogleDrive = googleDrivePatterns.some(pattern => pattern.test(url));
    const isSupabaseStorage = supabasePattern.test(url);
    
    return isGoogleDrive || isSupabaseStorage;
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