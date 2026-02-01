import { Injectable } from '@angular/core';
import { SupabaseService, Cliente } from './supabase.service';
import { CacheService } from './cache.service';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  // TTL aumentado a 15 minutos (antes: 1 minuto)
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutos

  constructor(
    private supabaseService: SupabaseService,
    private cacheService: CacheService,
    private stateService: StateService
  ) {}

  /**
   * Invalidar caché de clientes
   */
  async invalidateCache(): Promise<void> {
    await this.cacheService.invalidatePattern('clientes:');
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
   * Listar todos los clientes aprobados.
   * ✅ Usa caché persistente con IndexedDB (TTL: 15 min)
   */
  async listarClientes(signal?: AbortSignal): Promise<any[]> {
    try {
      const CACHE_KEY = 'clientes:aprobados';
      
      // Verificar caché primero (IndexedDB)
      const cached = await this.cacheService.get<any[]>(CACHE_KEY, this.CACHE_TTL);
      if (cached) {
        console.log('✅ Clientes aprobados cargados desde caché');
        return cached;
      }

      // Cargar desde Supabase
      const query = this.supabaseService['supabase']
        .from('clientes')
        .select('*')
        .eq('Estado', true)
        .limit(500);

      // Agregar signal si está disponible (para cancelar requests)
      if (signal) {
        (query as any).abortSignal(signal);
      }

      const { data, error } = await query;

      if (error) {
        if (error.name === 'AbortError') throw error;
        console.error('ClienteService.listarClientes error:', error);
        return [];
      }

      const result = Array.isArray(data) ? data : [];
      
      // Guardar en caché persistente
      await this.cacheService.set(CACHE_KEY, result);
      console.log(`✅ ${result.length} clientes aprobados cargados y guardados en caché`);
      
      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('⚠️ Request de clientes cancelado');
        throw error;
      }
      console.error('Error en listarClientes:', error);
      return [];
    }
  }

  /**
   * Listar clientes con solo los campos necesarios para la vista de lista (optimizado)
   * ✅ Usa caché persistente
   */
  async listarClientesResumido(signal?: AbortSignal): Promise<any[]> {
    try {
      const CACHE_KEY = 'clientes:resumido';
      
      // Verificar caché
      const cached = await this.cacheService.get<any[]>(CACHE_KEY, this.CACHE_TTL);
      if (cached) {
        console.log('✅ Clientes resumidos cargados desde caché');
        return cached;
      }

      const query = this.supabaseService['supabase']
        .from('clientes')
        .select('id, nombre, apellido, correo, Estado, genero')
        .eq('Estado', true)
        .order('nombre', { ascending: true })
        .limit(500);

      if (signal) {
        (query as any).abortSignal(signal);
      }

      const { data, error } = await query;

      if (error) {
        if (error.name === 'AbortError') throw error;
        console.error('❌ Error al listar clientes:', error.message);
        return [];
      }

      const result = Array.isArray(data) ? data : [];
      await this.cacheService.set(CACHE_KEY, result);
      console.log(`✅ ${result.length} clientes resumidos cargados`);
      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      console.error('❌ Error en listarClientesResumido:', error.message);
      return [];
    }
  }

  /**
   * Listar clientes pendientes de aprobación
   * ✅ Usa caché persistente
   */
  async listarClientesPendientes(signal?: AbortSignal): Promise<Cliente[]> {
    try {
      const CACHE_KEY = 'clientes:pendientes';
      
      // Verificar caché
      const cached = await this.cacheService.get<Cliente[]>(CACHE_KEY, this.CACHE_TTL);
      if (cached) {
        console.log('✅ Clientes pendientes cargados desde caché');
        return cached;
      }

      const query = this.supabaseService
        .getClient()
        .from('clientes')
        .select('*')
        .eq('Estado', false)
        .order('nombre', { ascending: true })
        .limit(200);

      if (signal) {
        (query as any).abortSignal(signal);
      }

      const { data, error } = await query;

      if (error) {
        if (error.name === 'AbortError') throw error;
        console.error('Error al listar clientes pendientes:', error);
        return [];
      }

      const result = data || [];
      await this.cacheService.set(CACHE_KEY, result);
      console.log(`✅ ${result.length} clientes pendientes cargados`);
      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      console.error('Error al listar clientes pendientes:', error);
      return [];
    }
  }

  /**
   * Aprobar o desaprobar cliente (cambiar Estado)
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

      // Invalidar caché y notificar cambios
      await this.invalidateCache();
      this.stateService.notifyClientesModificados();

      return true;
    } catch (error) {
      console.error('Error al actualizar estado del cliente:', error);
      return false;
    }
  }

  /**
   * Alias para aprobarCliente (mantiene compatibilidad)
   */
  async actualizarEstado(id: number, estado: boolean): Promise<boolean> {
    return this.aprobarCliente(id, estado);
  }

  /**
   * Obtener un cliente por su ID con todos los detalles
   * ✅ Usa caché persistente
   */
  async obtenerClientePorId(id: number): Promise<any> {
    try {
      const CACHE_KEY = `clientes:${id}`;
      
      // Verificar caché
      const cached = await this.cacheService.get(CACHE_KEY, this.CACHE_TTL);
      if (cached) {
        console.log(`✅ Cliente ${id} cargado desde caché`);
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

      // Guardar en caché persistente
      if (data) {
        await this.cacheService.set(CACHE_KEY, data);
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
