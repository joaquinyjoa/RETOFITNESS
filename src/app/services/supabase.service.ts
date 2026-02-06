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
  terminos_aceptados?: boolean; // Aceptación de términos y condiciones
  fecha_aceptacion_terminos?: string; // Fecha de aceptación de términos
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
      console.log('💾 Insertando cliente en BD...');
      console.log('📝 Datos a insertar (sin password):', { ...cliente, password: '[OCULTO]' });
      console.log('📊 Cantidad de campos:', Object.keys(cliente).length);
      
      const { data, error } = await this.supabase
        .from('clientes')
        .insert([cliente])
        .select()
        .single();

      if (error) {
        this.logger.error('SupabaseService: Error al registrar cliente:', error);
        console.error('❌ Error en insert de cliente:', error);
        console.error('❌ Código:', error.code);
        console.error('❌ Mensaje:', error.message);
        console.error('❌ Detalles:', error.details);
        console.error('❌ Hint:', error.hint);
        
        // Traducir errores comunes
        let mensajeError = error.message;
        if (error.code === '23505') { // Duplicate key
          mensajeError = '❌ Ya existe un registro con estos datos. Verifica el email o contacta al administrador.';
        } else if (error.code === '42501') { // Insufficient privilege
          mensajeError = '❌ Error de permisos en la base de datos. Contacta al administrador.';
        } else if (error.message.includes('permission denied') || error.message.includes('policy')) {
          mensajeError = '❌ Error de permisos (RLS Policy). Contacta al administrador para configurar los permisos correctamente.';
        }
        
        return { success: false, error: mensajeError };
      }
      
      if (!data) {
        console.error('❌ Insert no devolvió datos');
        return { success: false, error: 'No se recibieron datos después de insertar el cliente' };
      }
      
      console.log('✅ Cliente insertado en BD exitosamente');
      console.log('✅ ID del cliente:', data.id);
      console.log('✅ Email:', data.correo);
      console.log('✅ User ID:', data.user_id);
      console.log('✅ Estado:', data.Estado);
      
      return { success: true, data };
    } catch (error: any) {
      this.logger.error('SupabaseService: Error en registrarCliente:', error);
      console.error('❌ Error inesperado en registrarCliente:', error);
      console.error('❌ Stack:', error?.stack);
      return { success: false, error: error.message || 'Error desconocido al registrar cliente' };
    }
  }

  // Verificar si un email ya existe
  async verificarEmailExistente(correo: string): Promise<boolean> {
    try {
      console.log(`🔍 Verificando email: ${correo}`);
      
      const { data, error } = await this.supabase
        .from('clientes')
        .select('id')
        .eq('correo', correo)
        .maybeSingle(); // Usar maybeSingle() en lugar de single() para evitar error si no existe

      if (error) {
        this.logger.error('SupabaseService: Error al verificar email en BD:', error);
        console.error('❌ Error en verificarEmailExistente:', error);
        return false;
      }

      const existe = data !== null;
      console.log(`🔍 Email ${correo} existe en BD: ${existe}`);
      return existe;
    } catch (error) {
      this.logger.error('SupabaseService: Error inesperado en verificarEmailExistente:', error);
      console.error('❌ Error inesperado en verificarEmailExistente:', error);
      return false;
    }
  }

  // Crear usuario en Supabase Auth
  async crearUsuarioAuth(email: string, password: string): Promise<{ success: boolean; userId?: string; error?: string; requiresConfirmation?: boolean }> {
    try {
      console.log(`🔐 Creando usuario Auth para: ${email}`);
      
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
        console.error('❌ Error en signUp:', error);
        console.error('❌ Código de error:', error.status);
        console.error('❌ Mensaje:', error.message);
        
        // Traducir mensajes de error comunes a español
        let mensajeError = error.message;
        if (error.message.includes('User already registered') || error.message.includes('already registered')) {
          mensajeError = '📧 Este correo electrónico ya está registrado. Si ya tienes una cuenta, intenta iniciar sesión. Si olvidaste tu contraseña, contacta al administrador.';
        } else if (error.message.includes('Invalid email')) {
          mensajeError = '❌ Correo electrónico inválido';
        } else if (error.message.includes('Password should be at least')) {
          mensajeError = '❌ La contraseña debe tener al menos 6 caracteres';
        } else if (error.message.includes('Database error')) {
          mensajeError = '❌ Error de base de datos. Contacta al administrador.';
        }
        
        return { success: false, error: mensajeError };
      }

      if (!data.user) {
        this.logger.error('SupabaseService: No se obtuvo usuario después de signUp');
        console.error('❌ No se obtuvo usuario en signUp');
        return { success: false, error: 'No se pudo crear el usuario' };
      }

      console.log('✅ Usuario Auth creado:', data.user.id);
      console.log('📧 Email confirmado:', data.user.email_confirmed_at ? 'SÍ' : 'NO');
      
      // Detectar si el usuario requiere confirmación de email
      const requiresConfirmation = !data.user.email_confirmed_at;
      return { 
        success: true, 
        userId: data.user.id,
        requiresConfirmation: requiresConfirmation
      };

    } catch (error: any) {
      this.logger.error('SupabaseService: Error inesperado en crearUsuarioAuth:', error);
      console.error('❌ Error inesperado en crearUsuarioAuth:', error);
      console.error('❌ Stack:', error?.stack);
      return { success: false, error: error.message || 'Error desconocido al crear usuario' };
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
