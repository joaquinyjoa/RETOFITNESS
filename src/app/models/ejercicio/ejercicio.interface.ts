export interface Ejercicio {
  id?: number;
  nombre: string;
  descripcion?: string;
  categoria: 'cardio' | 'fuerza' | 'flexibilidad' | 'funcional' | 'general';
  musculo_principal: string;
  musculos_secundarios?: string[];
  nivel_dificultad: 'principiante' | 'intermedio' | 'avanzado';
  enlace_video: string; // URL de Google Drive
  duracion_minutos?: number;
  equipamiento?: string[];
  instrucciones?: string;
  consejos?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  activo?: boolean;
}

export interface EjercicioFormData {
  nombre: string;
  descripcion: string;
  categoria: string;
  musculo_principal: string;
  musculos_secundarios: string[];
  nivel_dificultad: string;
  enlace_video: string;
  duracion_minutos: number | null;
  equipamiento: string[];
  instrucciones: string;
  consejos: string;
}