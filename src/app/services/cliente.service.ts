import { Injectable } from '@angular/core';
import { SupabaseService, Cliente } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  // OPTIMIZACIÓN: Caché simple con TTL de 1 minuto para lista de clientes
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 60 * 1000; // 1 minuto

  constructor(
    private supabaseService: SupabaseService
  ) {}

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidateCache(): void {
    this.cache.clear();
  }
  /**
   * Crear un nuevo cliente
   * @param clienteData - Datos del cliente
   * @param password - Contraseña del cliente (se enviará a Supabase Auth)
   * @returns Promise con el resultado del registro
   */
  async crearCliente(clienteData: Cliente, password: string): Promise<{ success: boolean; data?: any; error?: string; requiresConfirmation?: boolean }> {
    try {

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

      // 4. Registrar cliente en la base de datos
      const result = await this.supabaseService.registrarCliente(clienteConUserId);
      
      if (!result.success || !result.data) {
        // Si falla el registro, eliminar el usuario de auth
        console.error('Error al registrar cliente, eliminando usuario auth...');
        // Nota: Supabase no permite eliminar usuarios desde el cliente, solo desde el admin API
        return { success: false, error: result.error || 'Error al registrar el cliente' };
      }

      const clienteRegistrado = result.data;

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
      // Verificar caché primero
      const cached = this.getCached<any[]>('clientes_aprobados');
      if (cached) {
        return cached;
      }

      // Reutilizamos supabaseService para consultar la tabla 'clientes'
      const { data, error } = await this.supabaseService['supabase']
        .from('clientes')
        .select('*')
        .eq('Estado', true) // Solo clientes aprobados
        .limit(500); // Límite para evitar sobrecarga

      if (error) {
        console.error('ClienteService.listarClientes error:', error);
        return [];
      }

      const result = Array.isArray(data) ? data : [];
      this.setCache('clientes_aprobados', result);
      return result;
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
      // Verificar caché
      const cached = this.getCached<any[]>('clientes_resumido');
      if (cached) {
        return cached;
      }

      const { data, error } = await this.supabaseService['supabase']
        .from('clientes')
        .select('*')
        .eq('Estado', true) // Solo clientes aprobados
        .order('nombre', { ascending: true })
        .limit(500); // Límite

      if (error) {
        console.error('❌ Error al listar clientes:', error.message);
        return [];
      }

      const result = Array.isArray(data) ? data : [];
      this.setCache('clientes_resumido', result);
      return result;
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
      // Verificar caché
      const cached = this.getCached<Cliente[]>('clientes_pendientes');
      if (cached) {
        return cached;
      }

      const { data, error } = await this.supabaseService
        .getClient()
        .from('clientes')
        .select('*')
        .eq('Estado', false)
        .order('nombre', { ascending: true })
        .limit(200); // Límite menor para pendientes

      if (error) {
        console.error('Error al listar clientes pendientes:', error);
        return [];
      }

      const result = data || [];
      this.setCache('clientes_pendientes', result);
      return result;
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

      // Invalidar caché
      this.invalidateCache();

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
      // Verificar caché
      const cacheKey = `cliente_${id}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }
      
      const { data, error } = await this.supabaseService['supabase']
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ ClienteService.obtenerClientePorId error:', error);
        return null;
      }

      // Guardar en caché
      if (data) {
        this.setCache(cacheKey, data);
      }
      return data;
    } catch (error: any) {
      console.error('❌ Error en obtenerClientePorId:', error);
      return null;
    }
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
      return { success: true, data };
      
    } catch (error: any) {
      console.error('Error en actualizarCliente:', error);
      return { success: false, error: 'Error inesperado al actualizar cliente' };
    }
  }
}
