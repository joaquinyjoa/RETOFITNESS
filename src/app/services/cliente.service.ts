import { Injectable } from '@angular/core';
import { QrService } from './qr.service';
import { SupabaseService, Cliente } from './supabase.service';

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
   * @param password - Contraseña del cliente (se enviará a Supabase Auth)
   * @returns Promise con el resultado del registro
   */
  async crearCliente(clienteData: Cliente, password: string): Promise<{ success: boolean; data?: any; error?: string; requiresConfirmation?: boolean }> {
    try {
      console.log('ClienteService: Iniciando registro de cliente:', clienteData);

      // 1. Verificar si el email ya existe
      const emailExists = await this.supabaseService.verificarEmailExistente(clienteData.correo);
      if (emailExists) {
        return { success: false, error: 'Este correo electrónico ya está registrado' };
      }

      // 2. Crear usuario en Supabase Auth
      const authResult = await this.supabaseService.crearUsuarioAuth(clienteData.correo, password);
      
      if (!authResult.success || !authResult.userId) {
        return { success: false, error: authResult.error || 'Error al crear usuario' };
      }

      console.log('Usuario Auth creado con ID:', authResult.userId);
      const requiresConfirmation = authResult.requiresConfirmation || false;

      // 3. Agregar user_id y Estado a los datos del cliente
      const clienteConUserId = {
        ...clienteData,
        user_id: authResult.userId,
        Estado: false // Cliente pendiente de aprobación por recepción
      };

      // Normalizar campos de texto opcionales cuando estén vacíos, undefined o null.
      // descripcionMedicacion tiene UNIQUE constraint y registros existentes con '',
      // por lo que generamos un valor único para evitar conflictos.
      const optionalTextFields = ['descripcionEnfermedad', 'descripcionMedicacion', 'descripcionCirugias', 'descripcionLesiones'];
      optionalTextFields.forEach(field => {
        const value = (clienteConUserId as any)[field];
        if (value === '' || value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
          if (field === 'descripcionMedicacion') {
            // Generar valor único para evitar conflicto con registros existentes
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            (clienteConUserId as any)[field] = `sin_medicacion_${timestamp}_${randomSuffix}`;
          } else {
            // Otros campos pueden ser null
            (clienteConUserId as any)[field] = null;
          }
        }
      });
      
      // Depuración: verificar campos después de normalización
      console.log('ClienteService: Datos después de normalización:', {
        descripcionEnfermedad: clienteConUserId.descripcionEnfermedad,
        descripcionMedicacion: clienteConUserId.descripcionMedicacion,
        descripcionCirugias: clienteConUserId.descripcionCirugias,
        descripcionLesiones: clienteConUserId.descripcionLesiones
      });

      // 4. Registrar cliente en la base de datos
      const result = await this.supabaseService.registrarCliente(clienteConUserId);
      
      if (!result.success || !result.data) {
        // Si falla el registro, eliminar el usuario de auth
        console.error('Error al registrar cliente, eliminando usuario auth...');
        // Nota: Supabase no permite eliminar usuarios desde el cliente, solo desde el admin API
        return { success: false, error: result.error || 'Error al registrar el cliente' };
      }

      const clienteRegistrado = result.data;
      console.log('Cliente registrado exitosamente:', clienteRegistrado);

      // 5. Generar código QR con el ID del cliente
      const qrDataUrl = await this.qrService.generarQRCliente(clienteRegistrado.id);
      
      // 6. Convertir DataURL a Blob y subir imagen QR al storage
      const qrBlob = this.dataURLtoBlob(qrDataUrl);
      const fileName = `qr_cliente_${clienteRegistrado.id}.png`;
      const uploadResult = await this.supabaseService.subirImagenQR(qrBlob, fileName);
      
      if (!uploadResult.success || !uploadResult.url) {
        console.warn('Cliente registrado, pero no se pudo generar el QR');
        return { success: true, data: clienteRegistrado, error: 'Cliente registrado, pero no se pudo generar el QR' };
      } else {
        // 7. Actualizar el cliente con la URL del QR
        const updateResult = await this.supabaseService.actualizarQRCliente(clienteRegistrado.id, uploadResult.url);
        if (!updateResult.success) {
          console.warn('No se pudo actualizar la URL del QR en el cliente');
        }
      }

      return { 
        success: true, 
        data: clienteRegistrado,
        requiresConfirmation: requiresConfirmation
      };
    } catch (error: any) {
      console.error('Error en crearCliente:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Listar todos los clientes.
   * Retorna un arreglo vacío en caso de error.
   */
  async listarClientes(): Promise<any[]> {
    try {
      // Reutilizamos supabaseService para consultar la tabla 'clientes'
      const { data, error } = await this.supabaseService['supabase']
        .from('clientes')
        .select('*')
        .eq('Estado', true); // Solo clientes aprobados

      if (error) {
        console.error('ClienteService.listarClientes error:', error);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('Error en listarClientes:', error);
      return [];
    }
  }

  /**
   * Listar clientes con solo los campos necesarios para la vista de lista (optimizado)
   */
  async listarClientesResumido(): Promise<any[]> {
    try {
      const { data, error } = await this.supabaseService['supabase']
        .from('clientes')
        .select('*')
        .eq('Estado', true) // Solo clientes aprobados
        .order('nombre', { ascending: true });

      if (error) {
        console.error('❌ Error al listar clientes:', error.message);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('❌ Error en listarClientesResumido:', error.message);
      return [];
    }
  }

  /**
   * Listar TODOS los clientes (incluyendo pendientes) - Para recepción
   */
  async listarClientesPendientes(): Promise<Cliente[]> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('clientes')
        .select('*')
        .eq('Estado', false)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error al listar clientes pendientes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error al listar clientes pendientes:', error);
      return [];
    }
  }

  /**
   * Aprobar cliente (cambiar Estado a true)
   */
  async aprobarCliente(id: number, estado: boolean = true): Promise<boolean> {
    try {
      const { error } = await this.supabaseService
        .getClient()
        .from('clientes')
        .update({ Estado: estado })
        .eq('id', id);

      if (error) {
        console.error('Error al actualizar estado del cliente:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error al actualizar estado del cliente:', error);
      return false;
    }
  }

  /**
   * Obtener un cliente por su ID con todos los detalles
   */
  async obtenerClientePorId(id: number): Promise<any> {
    try {
      const { data, error } = await this.supabaseService['supabase']
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('ClienteService.obtenerClientePorId error:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('Error en obtenerClientePorId:', error);
      return null;
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

  /**
   * Actualizar un cliente existente
   * @param id - ID del cliente a actualizar
   * @param clienteData - Datos actualizados del cliente
   * @returns Promise con el resultado de la actualización
   */
  async actualizarCliente(id: number, clienteData: Partial<Cliente>): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('ClienteService: Actualizando cliente ID:', id, clienteData);

      // Normalizar campos de texto opcionales similar al método crearCliente
      const dataToUpdate = { ...clienteData };
      
      const optionalTextFields = ['descripcionEnfermedad', 'descripcionMedicacion', 'descripcionCirugias', 'descripcionLesiones'];
      optionalTextFields.forEach(field => {
        const value = (dataToUpdate as any)[field];
        if (value === '' || value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
          if (field === 'descripcionMedicacion') {
            // Para medicación, mantener un valor único si es requerido
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            (dataToUpdate as any)[field] = `sin_medicacion_${timestamp}_${randomSuffix}`;
          } else {
            // Otros campos pueden ser null
            (dataToUpdate as any)[field] = null;
          }
        }
      });

      // Verificar si el email ya existe (excluyendo el cliente actual)
      if (dataToUpdate.correo) {
        const { data: existingClients, error: checkError } = await this.supabaseService['supabase']
          .from('clientes')
          .select('id, correo')
          .eq('correo', dataToUpdate.correo)
          .neq('id', id);

        if (checkError) {
          console.error('Error verificando email existente:', checkError);
          return { success: false, error: 'Error verificando email existente' };
        }

        if (existingClients && existingClients.length > 0) {
          return { success: false, error: 'El correo electrónico ya está registrado para otro cliente' };
        }
      }

      // Actualizar el cliente en la base de datos
      const { data, error } = await this.supabaseService['supabase']
        .from('clientes')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('ClienteService.actualizarCliente error:', error);
        return { success: false, error: error.message };
      }

      console.log('Cliente actualizado exitosamente:', data);
      return { success: true, data };
      
    } catch (error: any) {
      console.error('Error en actualizarCliente:', error);
      return { success: false, error: 'Error inesperado al actualizar cliente' };
    }
  }
}
