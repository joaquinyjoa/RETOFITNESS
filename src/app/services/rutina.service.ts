import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Rutina {
  id?: number;
  nombre: string;
  descripcion?: string;
  objetivo?: string;
  nivel_dificultad: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  activo?: boolean;
}

export interface RutinaEjercicio {
  id?: number;
  rutina_id: number;
  ejercicio_id: number;
  orden: number;
  series?: number;
  repeticiones?: string;
  descanso_segundos?: number;
  porcentaje_fuerza?: number; // Porcentaje de fuerza requerido (0-100%)
  ejercicio_alternativo_id?: number | null; // ID del ejercicio alternativo si el equipo está ocupado
  notas?: string;
  created_at?: string;
  // Campos extra para JOIN con ejercicios
  ejercicio?: any;
  ejercicio_alternativo?: any; // Datos del ejercicio alternativo
}

export interface RutinaCliente {
  id?: number;
  rutina_id: number;
  cliente_id: number;
  dia_semana?: number; // 1-6 (Lunes-Sábado)
  fecha_asignacion?: string;
  estado: string;
  progreso?: number;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  // Campos extra para JOIN
  rutina?: Rutina;
  cliente?: any;
}

export interface RutinaConDetalles extends Rutina {
  ejercicios?: RutinaEjercicio[];
  clientes_asignados?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RutinaService {
  
  constructor(private supabaseService: SupabaseService) {}

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Enriquecer ejercicios con datos de ejercicios y ejercicios alternativos
   */
  private async enriquecerEjercicios(ejercicios: any[]): Promise<any[]> {
    if (!ejercicios || ejercicios.length === 0) return [];

    const supabase = this.supabaseService['supabase'];
    
    // Obtener IDs únicos de ejercicios principales y alternativos
    const ejercicioIds = [...new Set(ejercicios.map(e => e.ejercicio_id).filter(Boolean))];
    const alternativoIds = [...new Set(ejercicios.map(e => e.ejercicio_alternativo_id).filter(Boolean))];
    const todosIds = [...new Set([...ejercicioIds, ...alternativoIds])];

    if (todosIds.length === 0) return ejercicios;

    // Cargar todos los ejercicios en una sola consulta
    const { data: ejerciciosData } = await supabase
      .from('ejercicios')
      .select('*')
      .in('id', todosIds);

    if (!ejerciciosData) return ejercicios;

    // Crear mapa para búsqueda rápida
    const ejerciciosMap = new Map(ejerciciosData.map(e => [e.id, e]));

    // Enriquecer cada ejercicio
    return ejercicios.map(ej => ({
      ...ej,
      ejercicio: ejerciciosMap.get(ej.ejercicio_id) || null,
      ejercicio_alternativo: ej.ejercicio_alternativo_id ? ejerciciosMap.get(ej.ejercicio_alternativo_id) || null : null
    }));
  }

  // ============================================
  // CRUD DE RUTINAS
  // ============================================

  /**
   * Obtener todas las rutinas activas
   */
  async obtenerRutinas(): Promise<{ data: Rutina[] | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { data, error } = await supabase
        .from('rutinas')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error al obtener rutinas:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtener rutinas con cantidad de ejercicios y clientes asignados
   * OPTIMIZADO: Usa una sola query con JOIN en lugar de N+1 queries
   */
  async obtenerRutinasConDetalles(): Promise<{ data: RutinaConDetalles[] | null; error: any }> {
    const tiempoInicio = performance.now();
    
    try {
      const supabase = this.supabaseService['supabase'];
      // Una sola query con JOIN para obtener todo
      const { data: rutinas, error: errorRutinas } = await supabase
        .from('rutinas')
        .select(`
          *,
          ejercicios:rutinas_ejercicios(
            id, ejercicio_id, orden, series, repeticiones, descanso_segundos, notas, porcentaje_fuerza, ejercicio_alternativo_id
          ),
          clientes:rutinas_clientes(id, cliente_id)
        `)
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (errorRutinas || !rutinas) {
        console.error('🔴 [RutinaService] Error en consulta:', errorRutinas);
        return { data: null, error: errorRutinas };
      }

      const tiempoConsulta = performance.now();
      
      // Enriquecer ejercicios para todas las rutinas
      const rutinasConDetalles: RutinaConDetalles[] = await Promise.all(
        rutinas.map(async (rutina: any) => {
          const ejerciciosEnriquecidos = await this.enriquecerEjercicios(rutina.ejercicios || []);
          return {
            ...rutina,
            ejercicios: ejerciciosEnriquecidos,
            clientes_asignados: (rutina.clientes || []).length,
            cantidad_ejercicios: ejerciciosEnriquecidos.length
          };
        })
      );

      const tiempoFin = performance.now();

      return { data: rutinasConDetalles, error: null };
    } catch (error) {
      const tiempoFin = performance.now();
      console.error(`🔴 [RutinaService] Error en obtenerRutinasConDetalles después de ${(tiempoFin - tiempoInicio).toFixed(2)}ms:`, error);
      return { data: null, error };
    }
  }

  /**
   * Obtener una rutina por ID con sus ejercicios
   */
  async obtenerRutinaPorId(id: number): Promise<{ data: RutinaConDetalles | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      
      // Obtener rutina
      const { data: rutina, error: errorRutina } = await supabase
        .from('rutinas')
        .select('*')
        .eq('id', id)
        .single();

      if (errorRutina || !rutina) {
        return { data: null, error: errorRutina };
      }

      // Obtener ejercicios de la rutina con JOIN
      const { data: ejercicios, error: errorEjercicios } = await supabase
        .from('rutinas_ejercicios')
        .select('*')
        .eq('rutina_id', id)
        .order('orden', { ascending: true });

      if (errorEjercicios) {
        return { data: null, error: errorEjercicios };
      }

      // Enriquecer ejercicios con datos completos
      const ejerciciosEnriquecidos = await this.enriquecerEjercicios(ejercicios || []);

      // Filtrar ejercicios que fueron eliminados (ejercicio === null)
      const ejerciciosValidos = ejerciciosEnriquecidos.filter(ej => ej.ejercicio !== null);

      if (ejerciciosEnriquecidos.length !== ejerciciosValidos.length) {
        console.warn(`⚠️ Se filtraron ${ejerciciosEnriquecidos.length - ejerciciosValidos.length} ejercicios eliminados`);
      }

      const rutinaCompleta: RutinaConDetalles = {
        ...rutina,
        ejercicios: ejerciciosValidos
      };

      return { data: rutinaCompleta, error: null };
    } catch (error) {
      console.error('Error al obtener rutina por ID:', error);
      return { data: null, error };
    }
  }

  /**
   * Crear una nueva rutina
   */
  async crearRutina(rutina: Rutina): Promise<{ data: Rutina | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { data, error } = await supabase
        .from('rutinas')
        .insert([rutina])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error al crear rutina:', error);
      return { data: null, error };
    }
  }

  /**
   * Actualizar una rutina existente
   */
  async actualizarRutina(id: number, rutina: Partial<Rutina>): Promise<{ data: Rutina | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { data, error } = await supabase
        .from('rutinas')
        .update(rutina)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error al actualizar rutina:', error);
      return { data: null, error };
    }
  }

  /**
   * Eliminar una rutina (delete permanente)
   */
  async eliminarRutina(id: number): Promise<{ success: boolean; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { error } = await supabase
        .from('rutinas')
        .delete()
        .eq('id', id);

      return { success: !error, error };
    } catch (error) {
      console.error('Error al eliminar rutina:', error);
      return { success: false, error };
    }
  }

  // ============================================
  // GESTIÓN DE EJERCICIOS EN RUTINAS
  // ============================================

  /**
   * Obtener ejercicios de una rutina
   */
  async obtenerEjerciciosDeRutina(rutinaId: number): Promise<{ data: RutinaEjercicio[] | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { data, error } = await supabase
        .from('rutinas_ejercicios')
        .select('*')
        .eq('rutina_id', rutinaId)
        .order('orden', { ascending: true});

      if (error) {
        return { data: null, error };
      }

      // Enriquecer ejercicios con datos completos
      const ejerciciosEnriquecidos = await this.enriquecerEjercicios(data || []);

      // Filtrar ejercicios eliminados
      const ejerciciosValidos = ejerciciosEnriquecidos.filter(ej => ej.ejercicio !== null);

      if (ejerciciosEnriquecidos.length !== ejerciciosValidos.length) {
        console.warn(`⚠️ Se filtraron ${ejerciciosEnriquecidos.length - ejerciciosValidos.length} ejercicios eliminados`);
      }

      return { data: ejerciciosValidos, error: null };
    } catch (error) {
      console.error('Error al obtener ejercicios de rutina:', error);
      return { data: null, error };
    }
  }

  /**
   * Agregar un ejercicio a una rutina
   */
  async agregarEjercicioARutina(rutinaEjercicio: RutinaEjercicio): Promise<{ data: RutinaEjercicio | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { data, error } = await supabase
        .from('rutinas_ejercicios')
        .insert([rutinaEjercicio])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error al agregar ejercicio a rutina:', error);
      return { data: null, error };
    }
  }

  /**
   * Actualizar un ejercicio dentro de una rutina
   */
  async actualizarEjercicioEnRutina(id: number, datos: Partial<RutinaEjercicio>): Promise<{ data: RutinaEjercicio | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { data, error } = await supabase
        .from('rutinas_ejercicios')
        .update(datos)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error al actualizar ejercicio en rutina:', error);
      return { data: null, error };
    }
  }

  /**
   * Eliminar un ejercicio de una rutina
   */
  async eliminarEjercicioDeRutina(id: number): Promise<{ success: boolean; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { error } = await supabase
        .from('rutinas_ejercicios')
        .delete()
        .eq('id', id);

      return { success: !error, error };
    } catch (error) {
      console.error('Error al eliminar ejercicio de rutina:', error);
      return { success: false, error };
    }
  }

  /**
   * Guardar múltiples ejercicios en una rutina (batch)
   */
  async guardarEjerciciosEnRutina(rutinaId: number, ejercicios: RutinaEjercicio[]): Promise<{ success: boolean; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      
      // Primero eliminar los ejercicios existentes
      await supabase
        .from('rutinas_ejercicios')
        .delete()
        .eq('rutina_id', rutinaId);

      // Luego insertar los nuevos
      const ejerciciosConRutinaId = ejercicios.map(ej => ({
        ...ej,
        rutina_id: rutinaId
      }));

      const { error } = await supabase
        .from('rutinas_ejercicios')
        .insert(ejerciciosConRutinaId);

      return { success: !error, error };
    } catch (error) {
      console.error('Error al guardar ejercicios en rutina:', error);
      return { success: false, error };
    }
  }

  // ============================================
  // ASIGNACIÓN DE RUTINAS A CLIENTES
  // ============================================

  /**
   * Verificar si la rutina ya está asignada a algún cliente en el mismo día
   */
  async verificarRutinaAsignadaMismoDia(
    rutinaId: number,
    clienteIds: number[],
    diaSemana: number
  ): Promise<{ existe: boolean; cliente: string }> {
    try {
      const supabase = this.supabaseService['supabase'];
      
      const { data, error } = await supabase
        .from('rutinas_clientes')
        .select(`
          cliente_id,
          clientes!inner(nombre, apellido)
        `)
        .eq('rutina_id', rutinaId)
        .eq('dia_semana', diaSemana)
        .in('cliente_id', clienteIds)
        .limit(1)
        .single();

      if (error) {
        console.error('Error al verificar rutina:', error);
        return { existe: false, cliente: '' };
      }

      if (data) {
        // `clientes` puede venir como un objeto o como un array (dependiendo del JOIN de Supabase).
        // Normalizamos para obtener el primer cliente si es un array.
        let clienteInfo: any = data.clientes;
        if (Array.isArray(clienteInfo)) {
          clienteInfo = clienteInfo[0] || null;
        }

        const nombre = clienteInfo?.nombre ?? '';
        const apellido = clienteInfo?.apellido ?? '';
        const nombreCompleto = `${nombre} ${apellido}`.trim();

        return { existe: true, cliente: nombreCompleto };
      }

      return { existe: false, cliente: '' };
    } catch (error) {
      console.error('Error en verificarRutinaAsignadaMismoDia:', error);
      return { existe: false, cliente: '' };
    }
  }

  /**
   * Asignar una rutina a uno o varios clientes
   */
  async asignarRutinaAClientes(
    rutinaId: number, 
    clienteIds: number[], 
    diaSemana: number,
    notas?: string
  ): Promise<{ success: boolean; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      
      const asignaciones = clienteIds.map(clienteId => ({
        rutina_id: rutinaId,
        cliente_id: clienteId,
        dia_semana: diaSemana,
        estado: 'pendiente',
        progreso: 0,
        notas: notas || null
      }));

      const { data: rutinasCreadas, error } = await supabase
        .from('rutinas_clientes')
        .insert(asignaciones)
        .select();

      if (error || !rutinasCreadas) {
        return { success: false, error };
      }

      // Copiar ejercicios originales a cada asignación
      for (const rutinaCliente of rutinasCreadas) {
        await this.copiarEjerciciosAAsignacion(rutinaCliente.id, rutinaId);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error al asignar rutina a clientes:', error);
      return { success: false, error };
    }
  }

  /**
   * Verificar si una rutina ya está asignada a un cliente en un día específico
   */
  async verificarRutinaDuplicada(
    clienteId: number,
    rutinaId: number,
    diaSemana: number
  ): Promise<{ existe: boolean; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { data, error } = await supabase
        .from('rutinas_clientes')
        .select('id')
        .eq('cliente_id', clienteId)
        .eq('rutina_id', rutinaId)
        .eq('dia_semana', diaSemana)
        .limit(1);

      if (error) {
        console.error('Error al verificar rutina:', error);
        return { existe: false, error };
      }

      return { existe: data && data.length > 0, error: null };
    } catch (error) {
      console.error('Error al verificar rutina:', error);
      return { existe: false, error };
    }
  }

  /**
   * Obtener clientes asignados a una rutina
   */
  async obtenerClientesConRutina(rutinaId: number): Promise<{ data: RutinaCliente[] | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { data, error } = await supabase
        .from('rutinas_clientes')
        .select(`
          *,
          cliente:clientes(id, nombre, apellido, correo)
        `)
        .eq('rutina_id', rutinaId)
        .order('fecha_asignacion', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error al obtener clientes con rutina:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtener rutinas asignadas a un cliente
   */
  async obtenerRutinasDeCliente(clienteId: number): Promise<{ data: RutinaCliente[] | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { data, error } = await supabase
        .from('rutinas_clientes')
        .select(`
          *,
          rutina:rutinas(*)
        `)
        .eq('cliente_id', clienteId)
        .order('fecha_asignacion', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error al obtener rutinas de cliente:', error);
      return { data: null, error };
    }
  }

  /**
   * Actualizar asignación de rutina (progreso, estado, etc.)
   */
  async actualizarAsignacionRutina(id: number, datos: Partial<RutinaCliente>): Promise<{ data: RutinaCliente | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { data, error } = await supabase
        .from('rutinas_clientes')
        .update(datos)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error al actualizar asignación de rutina:', error);
      return { data: null, error };
    }
  }

  /**
   * Desasignar rutina de un cliente
   */
  async desasignarRutinaDeCliente(id: number): Promise<{ success: boolean; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { error } = await supabase
        .from('rutinas_clientes')
        .delete()
        .eq('id', id);

      return { success: !error, error };
    } catch (error) {
      console.error('Error al desasignar rutina de cliente:', error);
      return { success: false, error };
    }
  }

  /**
   * Obtener detalles completos de un ejercicio por su ID
   */
  async obtenerEjercicioPorId(ejercicioId: number): Promise<{ data: any | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      
      const { data, error } = await supabase
        .from('ejercicios')
        .select('*')
        .eq('id', ejercicioId)
        .eq('activo', true)
        .single();

      if (error) {
        console.error('❌ Error al obtener ejercicio:', error);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error inesperado al obtener ejercicio:', error);
      return { data: null, error };
    }
  }

  // ============================================
  // GESTIÓN DE EJERCICIOS PERSONALIZADOS POR CLIENTE
  // ============================================

  /**
   * Copiar ejercicios de la rutina original a la asignación del cliente
   * Se ejecuta automáticamente cuando se asigna una rutina
   */
  async copiarEjerciciosAAsignacion(rutinaClienteId: number, rutinaId: number): Promise<{ success: boolean; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      
      // Obtener ejercicios originales de la rutina
      const { data: ejerciciosOriginales, error: errorGet } = await supabase
        .from('rutinas_ejercicios')
        .select('*')
        .eq('rutina_id', rutinaId)
        .order('orden', { ascending: true });

      if (errorGet || !ejerciciosOriginales) {
        return { success: false, error: errorGet };
      }

      // Copiar ejercicios a la asignación del cliente
      const ejerciciosPersonalizados = ejerciciosOriginales.map(ej => ({
        rutina_cliente_id: rutinaClienteId,
        ejercicio_id: ej.ejercicio_id,
        orden: ej.orden,
        series: ej.series,
        repeticiones: ej.repeticiones,
        descanso_segundos: ej.descanso_segundos,
        porcentaje_fuerza: ej.porcentaje_fuerza,
        ejercicio_alternativo_id: ej.ejercicio_alternativo_id || null,
        notas: ej.notas
      }));

      const { error: errorInsert } = await supabase
        .from('rutinas_clientes_ejercicios')
        .insert(ejerciciosPersonalizados);

      return { success: !errorInsert, error: errorInsert };
    } catch (error) {
      console.error('Error al copiar ejercicios a asignación:', error);
      return { success: false, error };
    }
  }

  /**
   * Obtener ejercicios personalizados de una rutina asignada a un cliente
   */
  async obtenerEjerciciosPersonalizados(rutinaClienteId: number): Promise<{ data: any[] | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { data, error } = await supabase
        .from('rutinas_clientes_ejercicios')
        .select('*')
        .eq('rutina_cliente_id', rutinaClienteId)
        .order('orden', { ascending: true });

      if (error) {
        return { data: null, error };
      }

      // Enriquecer ejercicios con datos completos
      const ejerciciosEnriquecidos = await this.enriquecerEjercicios(data || []);

      return { data: ejerciciosEnriquecidos, error: null };
    } catch (error) {
      console.error('Error al obtener ejercicios personalizados:', error);
      return { data: null, error };
    }
  }

  /**
   * Cambiar un ejercicio específico para la rutina asignada a un cliente
   */
  async cambiarEjercicioPersonalizado(
    ejercicioPersonalizadoId: number, 
    nuevoEjercicioId: number,
    series?: number,
    repeticiones?: number,
    descansoSegundos?: number,
    porcentajeFuerza?: number
  ): Promise<{ success: boolean; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      
      const updateData: any = { ejercicio_id: nuevoEjercicioId };
      
      if (series !== undefined) updateData.series = series;
      if (repeticiones !== undefined) updateData.repeticiones = repeticiones;
      if (descansoSegundos !== undefined) updateData.descanso_segundos = descansoSegundos;
      if (porcentajeFuerza !== undefined) updateData.porcentaje_fuerza = porcentajeFuerza;
      
      const { error } = await supabase
        .from('rutinas_clientes_ejercicios')
        .update(updateData)
        .eq('id', ejercicioPersonalizadoId);

      return { success: !error, error };
    } catch (error) {
      console.error('Error al cambiar ejercicio personalizado:', error);
      return { success: false, error };
    }
  }

  /**
   * Obtener un ejercicio personalizado específico
   */
  async obtenerEjercicioPersonalizado(ejercicioPersonalizadoId: number): Promise<{ data: any | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { data, error } = await supabase
        .from('rutinas_clientes_ejercicios')
        .select(`
          *,
          ejercicio:ejercicios(*)
        `)
        .eq('id', ejercicioPersonalizadoId)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error al obtener ejercicio personalizado:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtener todos los ejercicios de una rutina cliente para validación
   */
  async obtenerEjerciciosDeRutinaCliente(rutinaClienteId: number): Promise<{ data: any[] | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { data, error } = await supabase
        .from('rutinas_clientes_ejercicios')
        .select('id, ejercicio_id')
        .eq('rutina_cliente_id', rutinaClienteId);

      return { data, error };
    } catch (error) {
      console.error('Error al obtener ejercicios de rutina cliente:', error);
      return { data: null, error };
    }
  }

  /**
   * Actualizar parámetros de un ejercicio personalizado (series, repeticiones, etc.)
   */
  async actualizarEjercicioPersonalizado(
    ejercicioPersonalizadoId: number,
    datos: Partial<RutinaEjercicio>
  ): Promise<{ success: boolean; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      const { error } = await supabase
        .from('rutinas_clientes_ejercicios')
        .update(datos)
        .eq('id', ejercicioPersonalizadoId);

      return { success: !error, error };
    } catch (error) {
      console.error('Error al actualizar ejercicio personalizado:', error);
      return { success: false, error };
    }
  }

  /**
   * Obtener rutinas asignadas a un cliente con sus ejercicios personalizados
   */
  async obtenerRutinasClienteConEjercicios(clienteId: number): Promise<{ data: any[] | null; error: any }> {
    try {
      const supabase = this.supabaseService['supabase'];
      
      // Obtener rutinas asignadas
      const { data: rutinasCliente, error: errorRutinas } = await supabase
        .from('rutinas_clientes')
        .select(`
          *,
          rutina:rutinas(*)
        `)
        .eq('cliente_id', clienteId)
        .order('fecha_asignacion', { ascending: false });

      if (errorRutinas || !rutinasCliente) {
        return { data: null, error: errorRutinas };
      }

      // Para cada rutina, obtener sus ejercicios personalizados
      const rutinasConEjercicios = await Promise.all(
        rutinasCliente.map(async (rc) => {
          const { data: ejercicios } = await this.obtenerEjerciciosPersonalizados(rc.id);
          return {
            ...rc,
            ejercicios: ejercicios || []
          };
        })
      );

      return { data: rutinasConEjercicios, error: null };
    } catch (error) {
      console.error('Error al obtener rutinas de cliente con ejercicios:', error);
      return { data: null, error };
    }
  }
}
