import { Injectable } from '@angular/core';
import { SupabaseService, Cliente } from './supabase.service';
import { EntrenadorService, Entrenador } from './entrenador.service';
import { RecepcionService } from './recepcion.service';
import { Recepcion } from '../models/recepcion.interface';

export interface UsuarioLogueado {
  tipo: 'cliente' | 'entrenador' | 'recepcion';
  data: Cliente | Entrenador | Recepcion;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private supabaseService: SupabaseService,
    private entrenadorService: EntrenadorService,
    private recepcionService: RecepcionService
  ) {}

  // Intentar login verificando clientes, entrenadores y recepción
  async login(correo: string, contraseña: string): Promise<{ success: boolean; usuario?: UsuarioLogueado; error?: string }> {
    try {
      console.log('AuthService: Iniciando proceso de login para:', correo);

      // Validar que correo y contraseña no estén vacíos
      if (!correo || !contraseña || correo.trim() === '' || contraseña.trim() === '') {
        console.error('AuthService: Credenciales vacías o inválidas');
        return { 
          success: false, 
          error: 'Por favor ingresa correo y contraseña' 
        };
      }

      // Validar formato de correo
      if (!correo.includes('@')) {
        console.error('AuthService: Formato de correo inválido');
        return { 
          success: false, 
          error: 'El correo debe tener un formato válido' 
        };
      }

      console.log('AuthService: Intentando autenticación con credenciales:', {
        correo: correo,
        passwordLength: contraseña.length
      });

      // Primero autenticar con Supabase Auth (UNA SOLA VEZ)
      const supabase = this.supabaseService['supabase']; // Acceder a la instancia de supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: correo,
        password: contraseña
      });

      if (authError) {
        console.error('❌ AuthService: Error de autenticación:', {
          message: authError.message,
          status: authError.status,
          name: authError.name
        });
        
        // Mensajes de error más específicos
        let errorMessage = 'Error al iniciar sesión';
        
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'Correo o contraseña incorrectos';
        } else if (authError.message.includes('Email not confirmed')) {
          console.error('⚠️ EMAIL NO CONFIRMADO - Soluciones:');
          console.error('1. Ve a Supabase Dashboard > Authentication > Users');
          console.error('2. Busca el usuario:', correo);
          console.error('3. Click en el usuario > Confirmar email manualmente');
          console.error('O desactiva "Enable email confirmations" en Authentication > Settings');
          errorMessage = 'Tu cuenta necesita ser aprobada. Contacta al administrador o espera la confirmación.';
        } else if (authError.status === 400) {
          errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña';
        } else {
          errorMessage = authError.message;
        }
        
        return { 
          success: false, 
          error: errorMessage
        };
      }

      if (!authData.user) {
        console.log('AuthService: No se obtuvo usuario después de autenticación');
        return { success: false, error: 'Error al obtener datos del usuario' };
      }

      const userId = authData.user.id;
      console.log('AuthService: Autenticación exitosa, user_id:', userId);

      // Intentar obtener datos como cliente
      console.log('AuthService: Buscando en tabla clientes...');
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (cliente) {
        console.log('AuthService: Login exitoso como cliente');
        return {
          success: true,
          usuario: {
            tipo: 'cliente',
            data: cliente
          }
        };
      }

      // Si no es cliente, intentar como entrenador
      console.log('AuthService: No es cliente, buscando en tabla entrenadores...');
      const { data: entrenador, error: entrenadorError } = await supabase
        .from('entrenadores')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (entrenador) {
        console.log('AuthService: Login exitoso como entrenador');
        return {
          success: true,
          usuario: {
            tipo: 'entrenador',
            data: entrenador
          }
        };
      }

      // Si no es entrenador, intentar como recepción
      console.log('AuthService: No es entrenador, buscando en tabla recepcion...');
      const { data: recepcion, error: recepcionError } = await supabase
        .from('recepcion')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (recepcion) {
        console.log('AuthService: Login exitoso como recepción');
        return {
          success: true,
          usuario: {
            tipo: 'recepcion',
            data: recepcion
          }
        };
      }

      // Si no es ni cliente ni entrenador ni recepción, cerrar sesión
      console.log('AuthService: Usuario no encontrado en ninguna tabla');
      await supabase.auth.signOut();
      return { 
        success: false, 
        error: 'Usuario no registrado en el sistema' 
      };

    } catch (error: any) {
      console.error('AuthService: Error en login:', error);
      
      // Manejo específico del error de NavigatorLock de Supabase
      if (error.message?.includes('NavigatorLockAcquireTimeoutError') || 
          error.message?.includes('lock:sb-')) {
        console.log('AuthService: Error de lock detectado, reintentando...');
        
        // Esperar un momento y reintentar
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
          return await this.login(correo, contraseña);
        } catch (retryError) {
          console.error('AuthService: Reintento falló:', retryError);
          return { 
            success: false, 
            error: 'Error de conexión. Por favor intenta nuevamente.' 
          };
        }
      }
      
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