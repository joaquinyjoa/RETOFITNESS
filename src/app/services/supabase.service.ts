import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
  horas_sueno?: number;
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
  private supabaseUrl = 'https://tylyzyivlvibfyvetchr.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bHl6eWl2bHZpYmZ5dmV0Y2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODQzODIsImV4cCI6MjA3Njc2MDM4Mn0.Q0jRpYSJlunENflglEtVtKURBVn_W6KrVEaXZvnCY3o';
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  // Registrar un nuevo cliente
  async registrarCliente(cliente: Cliente): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('SupabaseService: Iniciando registro de cliente:', cliente);
      
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
}
