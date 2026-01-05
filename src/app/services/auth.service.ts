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
        // Validar que el cliente esté habilitado (campo Estado con mayúscula)
        if (cliente.Estado === false) {
          console.log('AuthService: Cliente encontrado pero Estado = false (no habilitado)');
          return {
            success: false,
            error: 'Tu cuenta no ha sido habilitada por recepción. Por favor contacta con el gimnasio.'
          };
        }
        
        console.log('AuthService: Login exitoso como cliente con Estado =', cliente.Estado);
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

  /**
   * Cambiar contraseña de un cliente (solo para recepción)
   * Usa función RPC de Supabase que actualiza auth.users
   */
  async cambiarPasswordCliente(clienteId: number, nuevaPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = this.supabaseService['supabase'];
      
      if (!nuevaPassword || nuevaPassword.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      // Validar que tenga al menos una mayúscula
      if (!/[A-Z]/.test(nuevaPassword)) {
        return { success: false, error: 'La contraseña debe contener al menos una letra mayúscula' };
      }

      // Obtener el user_id del cliente desde la tabla clientes
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('user_id, correo, nombre')
        .eq('id', clienteId)
        .single();

      if (clienteError || !cliente || !cliente.user_id) {
        console.error('Error al obtener cliente:', clienteError);
        return { success: false, error: 'No se encontró el cliente' };
      }

      console.log(`Cambiando contraseña para cliente: ${cliente.nombre} (user_id: ${cliente.user_id})`);

      // Llamar a la función RPC que actualiza auth.users
      const { data, error } = await supabase.rpc('cambiar_password_usuario', {
        p_user_id: cliente.user_id,
        p_nueva_password: nuevaPassword
      });

      if (error) {
        console.error('Error al llamar función RPC:', error);
        return { 
          success: false, 
          error: 'Error al cambiar la contraseña. Asegúrate de que la función RPC esté creada en Supabase.' 
        };
      }

      // La función RPC retorna un JSON con success y message/error
      if (data && typeof data === 'object') {
        if (data.success) {
          console.log('✅ Contraseña cambiada exitosamente en auth.users');
          return { success: true };
        } else {
          console.error('Error en función RPC:', data.error);
          return { success: false, error: data.error || 'Error al cambiar contraseña' };
        }
      }

      return { success: true };
      
    } catch (error: any) {
      console.error('Error en cambiarPasswordCliente:', error);
      return { success: false, error: error.message || 'Error inesperado al cambiar contraseña' };
    }
  }
}