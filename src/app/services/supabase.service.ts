import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-client';
import { LoggerService } from './logger.service';

// NO crear instancia aquí, usar la del archivo centralizado

// Interfaz para el cliente
export interface Cliente {
  id?: number;
  user_id?: string; // ID de Supabase Auth
  nombre: string;
  apellido: string;
  edad: number;
  correo: string;
  telefono?: string;
  Estado?: boolean; // Campo para aprobación por recepción
  // contraseña ya no se almacena aquí, la maneja Supabase Auth
  enfermedadCronicoa: boolean;
  descripcionEnfermedad?: string;
  diabetes: boolean;
  hipotension: boolean;
  hipotiroide: boolean;
  hipotiroidismo: boolean;
  medicacionRegular: boolean;
  descripcionMedicacion: string;
  cirugias: boolean;
  descripcionCirugias?: string;
  lesiones: boolean;
  descripcionLesiones?: string;
  fuma: boolean;
  alcohol: boolean;
  horas_sueno?: string; // Cambiado a string para coincidir con BD (text)
  objetivo: string;
  genero: string;
  peso: number;
  altura: number;
  nivelActividad: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private logger: LoggerService) {
    // Usar la instancia compartida en lugar de crear una nueva
    this.supabase = getSupabaseClient();
  }



  // Registrar un nuevo cliente
  async registrarCliente(cliente: Cliente): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('clientes')
        .insert([cliente])
        .select()
        .single();

      if (error) {
        this.logger.error('SupabaseService: Error al registrar cliente:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (error: any) {
      this.logger.error('SupabaseService: Error en registrarCliente:', error);
      return { success: false, error: error.message };
    }
  }

  // Verificar si un email ya existe
  async verificarEmailExistente(correo: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('clientes')
        .select('id')
        .eq('correo', correo)
        .maybeSingle(); // Usar maybeSingle() en lugar de single() para evitar error si no existe

      if (error) {
        this.logger.error('SupabaseService: Error al verificar email:', error);
        return false;
      }

      const existe = data !== null;
      return existe;
    } catch (error) {
      this.logger.error('SupabaseService: Error inesperado en verificarEmailExistente:', error);
      return false;
    }
  }

  // Crear usuario en Supabase Auth
  async crearUsuarioAuth(email: string, password: string): Promise<{ success: boolean; userId?: string; error?: string; requiresConfirmation?: boolean }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: undefined,
          // Nota: Para que esto funcione, debes desactivar "Enable email confirmations" 
          // en Supabase Dashboard > Authentication > Settings > Email Auth
          data: {
            email_confirmed: true
          }
        }
      });

      if (error) {
        this.logger.error('SupabaseService: Error al crear usuario auth:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        this.logger.error('SupabaseService: No se obtuvo usuario después de signUp');
        return { success: false, error: 'No se pudo crear el usuario' };
      }

      // Detectar si el usuario requiere confirmación de email
      const requiresConfirmation = !data.user.email_confirmed_at;
      return { 
        success: true, 
        userId: data.user.id,
        requiresConfirmation: requiresConfirmation
      };

    } catch (error: any) {
      this.logger.error('SupabaseService: Error inesperado en crearUsuarioAuth:', error);
      return { success: false, error: error.message };
    }
  }

  // Login de cliente
  async loginCliente(correo: string, contraseña: string): Promise<{ success: boolean; data?: Cliente; error?: string }> {
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
      // Obtener los datos del cliente usando el user_id
      const { data: cliente, error: clienteError } = await this.supabase
        .from('clientes')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (clienteError || !cliente) {
        // Cerrar la sesión de auth para que el entrenador pueda intentar
        await this.supabase.auth.signOut();
        return { success: false, error: 'No se encontraron datos del cliente' };
      }
      return { success: true, data: cliente };

    } catch (error: any) {
      this.logger.error('SupabaseService: Error inesperado en loginCliente:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener el cliente de Supabase para operaciones personalizadas
  getClient() {
    return this.supabase;
  }
}
