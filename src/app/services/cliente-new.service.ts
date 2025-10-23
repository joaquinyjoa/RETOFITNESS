import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Cliente } from '../models/cliente/cliente-module';
import { QrService } from './qr.service';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private supabase: SupabaseClient;

  constructor(private qrService: QrService) {
    // Inicializar Supabase con tus credenciales
    this.supabase = createClient(
      'YOUR_SUPABASE_URL', 
      'YOUR_SUPABASE_ANON_KEY'
    );
  }

  /**
   * Crear un nuevo cliente con QR generado automáticamente
   * @param clienteData - Datos del cliente sin el ID y QR
   * @returns Promise con el cliente creado
   */
  async crearCliente(clienteData: Omit<Cliente, 'id' | 'qr'>): Promise<Cliente> {
    try {
      // Insertar cliente en la base de datos (sin QR inicialmente)
      const { data, error } = await this.supabase
        .from('clientes')
        .insert([clienteData])
        .select()
        .single();

      if (error) {
        throw new Error(`Error creando cliente: ${error.message}`);
      }

      // Generar QR con el ID del cliente recién creado
      const qrCode = await this.qrService.generarQRCliente(data.id);

      // Actualizar el cliente con el QR generado
      const { data: clienteActualizado, error: updateError } = await this.supabase
        .from('clientes')
        .update({ qr: qrCode })
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error actualizando QR: ${updateError.message}`);
      }

      return clienteActualizado;
    } catch (error) {
      console.error('Error en crearCliente:', error);
      throw error;
    }
  }

  /**
   * Obtener cliente por ID (para cuando el entrenador escanee el QR)
   * @param clienteId - ID del cliente
   * @returns Promise con los datos del cliente
   */
  async obtenerClientePorId(clienteId: number): Promise<Cliente | null> {
    try {
      const { data, error } = await this.supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Cliente no encontrado
        }
        throw new Error(`Error obteniendo cliente: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerClientePorId:', error);
      throw error;
    }
  }

  /**
   * Procesar QR escaneado y obtener datos del cliente
   * @param qrData - Datos del QR escaneado
   * @returns Promise con los datos del cliente
   */
  async procesarQRCliente(qrData: string): Promise<Cliente | null> {
    try {
      // Decodificar el QR
      const datosQR = this.qrService.decodificarQRCliente(qrData);
      
      if (!datosQR) {
        throw new Error('QR inválido o no es de un cliente');
      }

      // Obtener los datos completos del cliente
      return await this.obtenerClientePorId(datosQR.id);
    } catch (error) {
      console.error('Error procesando QR:', error);
      throw error;
    }
  }

  /**
   * Regenerar QR para un cliente existente
   * @param clienteId - ID del cliente
   * @returns Promise con el nuevo QR
   */
  async regenerarQR(clienteId: number): Promise<string> {
    try {
      // Generar nuevo QR
      const nuevoQR = await this.qrService.generarQRCliente(clienteId);

      // Actualizar en la base de datos
      const { error } = await this.supabase
        .from('clientes')
        .update({ qr: nuevoQR })
        .eq('id', clienteId);

      if (error) {
        throw new Error(`Error actualizando QR: ${error.message}`);
      }

      return nuevoQR;
    } catch (error) {
      console.error('Error regenerando QR:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los clientes
   * @returns Promise con la lista de clientes
   */
  async obtenerClientes(): Promise<Cliente[]> {
    try {
      const { data, error } = await this.supabase
        .from('clientes')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        throw new Error(`Error obteniendo clientes: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error en obtenerClientes:', error);
      throw error;
    }
  }
}