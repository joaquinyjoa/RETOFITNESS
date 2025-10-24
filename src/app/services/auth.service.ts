import { Injectable } from '@angular/core';
import { SupabaseService, Cliente } from './supabase.service';
import { EntrenadorService, Entrenador } from './entrenador.service';

export interface UsuarioLogueado {
  tipo: 'cliente' | 'entrenador';
  data: Cliente | Entrenador;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private supabaseService: SupabaseService,
    private entrenadorService: EntrenadorService
  ) {}

  // Intentar login verificando tanto clientes como entrenadores
  async login(correo: string, contraseña: string): Promise<{ success: boolean; usuario?: UsuarioLogueado; error?: string }> {
    try {
      console.log('AuthService: Iniciando proceso de login para:', correo);

      // Primero intentar login como cliente
      console.log('AuthService: Verificando credenciales como cliente...');
      const clienteResult = await this.supabaseService.loginCliente(correo, contraseña);
      
      if (clienteResult.success && clienteResult.data) {
        console.log('AuthService: Login exitoso como cliente');
        return {
          success: true,
          usuario: {
            tipo: 'cliente',
            data: clienteResult.data
          }
        };
      }

      // Si no es cliente, intentar login como entrenador
      console.log('AuthService: Verificando credenciales como entrenador...');
      const entrenadorResult = await this.entrenadorService.loginEntrenador(correo, contraseña);
      
      if (entrenadorResult.success && entrenadorResult.data) {
        console.log('AuthService: Login exitoso como entrenador');
        return {
          success: true,
          usuario: {
            tipo: 'entrenador',
            data: entrenadorResult.data
          }
        };
      }

      // Si no es ni cliente ni entrenador
      console.log('AuthService: Credenciales incorrectas para ambos tipos de usuario');
      return { 
        success: false, 
        error: 'Correo o contraseña incorrectos' 
      };

    } catch (error: any) {
      console.error('AuthService: Error en login:', error);
      return { 
        success: false, 
        error: 'Error inesperado durante el login' 
      };
    }
  }

  // Guardar usuario en localStorage (opcional)
  guardarSesion(usuario: UsuarioLogueado) {
    localStorage.setItem('usuario_logueado', JSON.stringify(usuario));
  }

  // Obtener usuario de localStorage
  obtenerSesion(): UsuarioLogueado | null {
    const usuario = localStorage.getItem('usuario_logueado');
    return usuario ? JSON.parse(usuario) : null;
  }

  // Cerrar sesión
  cerrarSesion() {
    localStorage.removeItem('usuario_logueado');
  }
}