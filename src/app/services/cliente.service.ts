import { Injectable } from '@angular/core';
import { QrService } from './qr.service';
import { SupabaseService, Cliente as ClienteSupabase } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  constructor(
    private qrService: QrService,
    private supabaseService: SupabaseService
  ) {}
  /**
   * Crear un nuevo cliente con QR generado automáticamente
   * @param clienteData - Datos del cliente
   * @returns Promise con el resultado del registro
   */
  async crearCliente(clienteData: ClienteSupabase): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('ClienteService: Iniciando registro de cliente:', clienteData);
      
      // 1. Verificar si el email ya existe
      const emailExists = await this.supabaseService.verificarEmailExistente(clienteData.correo);
      if (emailExists) {
        return { success: false, error: 'Este correo electrónico ya está registrado' };
      }

      // 2. Registrar cliente en la base de datos
      const result = await this.supabaseService.registrarCliente(clienteData);
      
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Error al registrar el cliente' };
      }

      const clienteRegistrado = result.data;
      console.log('Cliente registrado exitosamente:', clienteRegistrado);

      // 3. Generar código QR con el ID del cliente
      const qrDataUrl = await this.qrService.generarQRCliente(clienteRegistrado.id);
      
      // 4. Convertir DataURL a Blob y subir imagen QR al storage
      const qrBlob = this.dataURLtoBlob(qrDataUrl);
      const fileName = `qr_cliente_${clienteRegistrado.id}.png`;
      const uploadResult = await this.supabaseService.subirImagenQR(qrBlob, fileName);
      
      if (!uploadResult.success || !uploadResult.url) {
        console.warn('Cliente registrado, pero no se pudo generar el QR');
        return { success: true, data: clienteRegistrado, error: 'Cliente registrado, pero no se pudo generar el QR' };
      } else {
        // 5. Actualizar el cliente con la URL del QR
        const updateResult = await this.supabaseService.actualizarQRCliente(clienteRegistrado.id, uploadResult.url);
        if (!updateResult.success) {
          console.warn('No se pudo actualizar la URL del QR en el cliente');
        }
      }

      return { success: true, data: clienteRegistrado };
    } catch (error: any) {
      console.error('Error en crearCliente:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convertir DataURL a Blob para subir archivo
   */
  private dataURLtoBlob(dataurl: string): Blob {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Verificar si un email ya existe
   * @param correo - Email a verificar
   * @returns Promise con true si existe, false si no
   */
  async verificarEmailExistente(correo: string): Promise<boolean> {
    return await this.supabaseService.verificarEmailExistente(correo);
  }
}
