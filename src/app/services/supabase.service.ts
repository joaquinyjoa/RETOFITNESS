import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-client';

// NO crear instancia aquí, usar la del archivo centralizado

// Interfaz para el cliente
export interface Cliente {
  id?: number;
  nombre: string;
  apellido: string;
  edad: number;
  correo: string;
  contraseña: string;
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
      const { data, error } = await this.supabase
        .from('clientes')
        .select('id')
        .eq('correo', correo)
        .single();

      return data !== null;
    } catch (error) {
      return false;
    }
  }

  // Login de cliente
  async loginCliente(correo: string, contraseña: string): Promise<{ success: boolean; data?: Cliente; error?: string }> {
    try {
      console.log('SupabaseService: Intentando login de cliente con correo:', correo);
      console.log('SupabaseService: Longitud de contraseña recibida:', contraseña.length);
      
      // Asegurar que no hay espacios en blanco
      const correoLimpio = correo.trim();
      const contraseñaLimpia = contraseña.trim();
      
      console.log('SupabaseService: Buscando cliente con correo:', correoLimpio);
      
      const query = this.supabase
        .from('clientes')
        .select('*')
        .eq('correo', correoLimpio)
        .eq('contraseña', contraseñaLimpia)
        .single();

      // Ejecutar la consulta directamente
      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('SupabaseService: No se encontró cliente con esas credenciales');
          return { success: false, error: 'Credenciales incorrectas' };
        }
        console.error('SupabaseService: Error en login de cliente:', error);
        return { success: false, error: error.message };
      }

      console.log('SupabaseService: Login de cliente exitoso:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('SupabaseService: Error en loginCliente:', error);
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
