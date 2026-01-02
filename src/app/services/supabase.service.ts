import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-client';

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
  qr?: string;
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

  constructor() {
    // Usar la instancia compartida en lugar de crear una nueva
    this.supabase = getSupabaseClient();
  }



  // Registrar un nuevo cliente
  async registrarCliente(cliente: Cliente): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('SupabaseService: Iniciando registro de cliente:', cliente);
      
      // Depuración adicional para campos problemáticos
      console.log('SupabaseService: Campos de descripción:', {
        descripcionEnfermedad: cliente.descripcionEnfermedad,
        descripcionMedicacion: cliente.descripcionMedicacion,
        descripcionCirugias: cliente.descripcionCirugias,
        descripcionLesiones: cliente.descripcionLesiones
      });
      
      const { data, error } = await this.supabase
        .from('clientes')
        .insert([cliente])
        .select()
        .single();

      if (error) {
        console.error('SupabaseService: Error al registrar cliente:', error);
        return { success: false, error: error.message };
      }

      console.log('SupabaseService: Cliente registrado exitosamente:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('SupabaseService: Error en registrarCliente:', error);
      return { success: false, error: error.message };
    }
  }

  // Verificar si un email ya existe
  async verificarEmailExistente(correo: string): Promise<boolean> {
    try {
      console.log('SupabaseService: Verificando si existe el correo:', correo);
      
      const { data, error } = await this.supabase
        .from('clientes')
        .select('id')
        .eq('correo', correo)
        .maybeSingle(); // Usar maybeSingle() en lugar de single() para evitar error si no existe

      if (error) {
        console.error('SupabaseService: Error al verificar email:', error);
        return false;
      }

      const existe = data !== null;
      console.log('SupabaseService: Email existe:', existe);
      return existe;
    } catch (error) {
      console.error('SupabaseService: Error inesperado en verificarEmailExistente:', error);
      return false;
    }
  }

  // Crear usuario en Supabase Auth
  async crearUsuarioAuth(email: string, password: string): Promise<{ success: boolean; userId?: string; error?: string; requiresConfirmation?: boolean }> {
    try {
      console.log('SupabaseService: Creando usuario en Supabase Auth:', email);
      
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
        console.error('SupabaseService: Error al crear usuario auth:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        console.error('SupabaseService: No se obtuvo usuario después de signUp');
        return { success: false, error: 'No se pudo crear el usuario' };
      }

      // Detectar si el usuario requiere confirmación de email
      const requiresConfirmation = !data.user.email_confirmed_at;
      
      console.log('SupabaseService: Usuario Auth creado exitosamente:', data.user.id);
      console.log('Email confirmado:', data.user.email_confirmed_at ? 'Sí' : 'No');
      
      if (requiresConfirmation) {
        console.log('⚠️ CONFIRMACIÓN DE EMAIL REQUERIDA');
        console.log('El usuario debe confirmar su email antes de poder iniciar sesión.');
        console.log('Para desarrollo, puedes:');
        console.log('1. Desactivar "Enable email confirmations" en Supabase Dashboard > Authentication > Settings');
        console.log('2. O confirmar manualmente el email en Authentication > Users');
      }
      
      return { 
        success: true, 
        userId: data.user.id,
        requiresConfirmation: requiresConfirmation
      };

    } catch (error: any) {
      console.error('SupabaseService: Error inesperado en crearUsuarioAuth:', error);
      return { success: false, error: error.message };
    }
  }

  // Login de cliente
  async loginCliente(correo: string, contraseña: string): Promise<{ success: boolean; data?: Cliente; error?: string }> {
    try {
      console.log('SupabaseService: Intentando login con Supabase Auth:', correo);
      
      // Usar el sistema de autenticación de Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: correo,
        password: contraseña
      });

      if (authError) {
        console.log('SupabaseService: Error de autenticación:', authError.message);
        return { 
          success: false, 
          error: authError.message === 'Invalid login credentials' 
            ? 'Correo o contraseña incorrectos' 
            : authError.message 
        };
      }

      if (!authData.user) {
        console.log('SupabaseService: No se obtuvo usuario después de autenticación');
        return { success: false, error: 'Error al obtener datos del usuario' };
      }

      console.log('SupabaseService: Autenticación exitosa, obteniendo datos del cliente...');

      // Obtener los datos del cliente usando el user_id
      const { data: cliente, error: clienteError } = await this.supabase
        .from('clientes')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (clienteError || !cliente) {
        console.log('SupabaseService: No se encontró cliente para este usuario (puede ser un entrenador)');
        // Cerrar la sesión de auth para que el entrenador pueda intentar
        await this.supabase.auth.signOut();
        return { success: false, error: 'No se encontraron datos del cliente' };
      }

      console.log('SupabaseService: Login de cliente exitoso');
      return { success: true, data: cliente };

    } catch (error: any) {
      console.error('SupabaseService: Error inesperado en loginCliente:', error);
      return { success: false, error: error.message };
    }
  }

  // Subir imagen QR al storage
  async subirImagenQR(file: Blob, fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase.storage
        .from('qrImages')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error al subir QR:', error);
        return { success: false, error: error.message };
      }

      // Obtener la URL pública de la imagen
      const { data: urlData } = this.supabase.storage
        .from('qrImages')
        .getPublicUrl(fileName);

      return { success: true, url: urlData.publicUrl };
    } catch (error: any) {
      console.error('Error en subirImagenQR:', error);
      return { success: false, error: error.message };
    }
  }

  // Actualizar la URL del QR en el cliente
  async actualizarQRCliente(clienteId: number, qrUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('clientes')
        .update({ qr: qrUrl })
        .eq('id', clienteId);

      if (error) {
        console.error('Error al actualizar QR del cliente:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error en actualizarQRCliente:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener el cliente de Supabase para operaciones personalizadas
  getClient() {
    return this.supabase;
  }
}
