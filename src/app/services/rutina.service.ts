import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Rutina {
  id?: number;
  nombre: string;
  descripcion?: string;
  objetivo?: string;
  duracion_semanas?: number;
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
  notas?: string;
  created_at?: string;
  // Campos extra para JOIN con ejercicios
  ejercicio?: any;
}

export interface RutinaCliente {
  id?: number;
  rutina_id: number;
  cliente_id: number;
  fecha_asignacion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
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
  // CRUD DE RUTINAS
  // ============================================

  /**
   * Obtener todas las rutinas activas
   */
  async obtenerRutinas(): Promise<{ data: Rutina[] | null; error: any }> {
    try {
      const supabase = this.supabaseService.getClient();
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
   */
  async obtenerRutinasConDetalles(): Promise<{ data: RutinaConDetalles[] | null; error: any }> {
    try {
      const supabase = this.supabaseService.getClient();
      
      // Obtener rutinas
      const { data: rutinas, error: errorRutinas } = await supabase
        .from('rutinas')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (errorRutinas || !rutinas) {
        return { data: null, error: errorRutinas };
      }

      // Para cada rutina, obtener cantidad de ejercicios y clientes
      const rutinasConDetalles: RutinaConDetalles[] = await Promise.all(
        rutinas.map(async (rutina) => {
          // Contar ejercicios
          const { count: countEjercicios } = await supabase
            .from('rutinas_ejercicios')
            .select('*', { count: 'exact', head: true })
            .eq('rutina_id', rutina.id);

          // Contar clientes asignados
          const { count: countClientes } = await supabase
            .from('rutinas_clientes')
            .select('*', { count: 'exact', head: true })
            .eq('rutina_id', rutina.id);

          return {
            ...rutina,
            ejercicios: [],
            clientes_asignados: countClientes || 0,
            cantidad_ejercicios: countEjercicios || 0
          } as any;
        })
      );

      return { data: rutinasConDetalles, error: null };
    } catch (error) {
      console.error('Error al obtener rutinas con detalles:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtener una rutina por ID con sus ejercicios
   */
  async obtenerRutinaPorId(id: number): Promise<{ data: RutinaConDetalles | null; error: any }> {
    try {
      const supabase = this.supabaseService.getClient();
      
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
        .select(`
          *,
          ejercicio:ejercicios(*)
        `)
        .eq('rutina_id', id)
        .order('orden', { ascending: true });

      if (errorEjercicios) {
        return { data: null, error: errorEjercicios };
      }

      const rutinaCompleta: RutinaConDetalles = {
        ...rutina,
        ejercicios: ejercicios || []
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
      const supabase = this.supabaseService.getClient();
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
      const supabase = this.supabaseService.getClient();
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
   * Eliminar una rutina (soft delete)
   */
  async eliminarRutina(id: number): Promise<{ success: boolean; error: any }> {
    try {
      const supabase = this.supabaseService.getClient();
      const { error } = await supabase
        .from('rutinas')
        .update({ activo: false })
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
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase
        .from('rutinas_ejercicios')
        .select(`
          *,
          ejercicio:ejercicios(*)
        `)
        .eq('rutina_id', rutinaId)
        .order('orden', { ascending: true });

      return { data, error };
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
      const supabase = this.supabaseService.getClient();
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
      const supabase = this.supabaseService.getClient();
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
      const supabase = this.supabaseService.getClient();
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
      const supabase = this.supabaseService.getClient();
      
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
   * Asignar una rutina a uno o varios clientes
   */
  async asignarRutinaAClientes(
    rutinaId: number, 
    clienteIds: number[], 
    fechaInicio?: string, 
    fechaFin?: string,
    notas?: string
  ): Promise<{ success: boolean; error: any }> {
    try {
      const supabase = this.supabaseService.getClient();
      
      const asignaciones = clienteIds.map(clienteId => ({
        rutina_id: rutinaId,
        cliente_id: clienteId,
        fecha_inicio: fechaInicio || null,
        fecha_fin: fechaFin || null,
        estado: 'pendiente',
        progreso: 0,
        notas: notas || null
      }));

      const { error } = await supabase
        .from('rutinas_clientes')
        .insert(asignaciones);

      return { success: !error, error };
    } catch (error) {
      console.error('Error al asignar rutina a clientes:', error);
      return { success: false, error };
    }
  }

  /**
   * Obtener clientes asignados a una rutina
   */
  async obtenerClientesConRutina(rutinaId: number): Promise<{ data: RutinaCliente[] | null; error: any }> {
    try {
      const supabase = this.supabaseService.getClient();
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
      const supabase = this.supabaseService.getClient();
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
      const supabase = this.supabaseService.getClient();
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
      const supabase = this.supabaseService.getClient();
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
}
