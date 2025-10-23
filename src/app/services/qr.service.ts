import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';

@Injectable({
  providedIn: 'root'
})
export class QrService {

  constructor() { }

  /**
   * Genera un código QR con el ID del cliente
   * @param clienteId - ID del cliente
   * @returns Promise con el QR en formato base64
   */
  async generarQRCliente(clienteId: number): Promise<string> {
    try {
      // Crear un objeto con la información del cliente para el QR
      const qrData = {
        tipo: 'cliente',
        id: clienteId,
        timestamp: new Date().toISOString()
      };

      // Convertir a string JSON para el QR
      const dataString = JSON.stringify(qrData);

      // Generar el código QR
      const qrCodeDataURL = await QRCode.toDataURL(dataString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generando QR:', error);
      throw new Error('No se pudo generar el código QR');
    }
  }

  /**
   * Decodifica un código QR escaneado para obtener los datos del cliente
   * @param qrData - Datos del QR escaneado
   * @returns Objeto con la información del cliente
   */
  decodificarQRCliente(qrData: string): { tipo: string, id: number, timestamp: string } | null {
    try {
      const data = JSON.parse(qrData);
      
      // Validar que sea un QR de cliente
      if (data.tipo === 'cliente' && data.id) {
        return {
          tipo: data.tipo,
          id: data.id,
          timestamp: data.timestamp
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error decodificando QR:', error);
      return null;
    }
  }

  /**
   * Genera un QR más simple solo con el ID
   * @param clienteId - ID del cliente
   * @returns Promise con el QR en formato base64
   */
  async generarQRSimple(clienteId: number): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(`cliente:${clienteId}`, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generando QR simple:', error);
      throw new Error('No se pudo generar el código QR');
    }
  }
}