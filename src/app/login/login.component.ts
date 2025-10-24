import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UsuarioLogueado } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class LoginComponent implements OnInit {

  // Datos del formulario
  credenciales = {
    correo: '@retofitness.com',
    password: ''
  };

  // Prefijo del email (la parte antes de @retofitness.com)
  emailPrefix: string = '';

  // Mensajes de error para validación
  validationErrors = {
    correo: '',
    password: ''
  };

  // Seguimiento de campos tocados por el usuario
  fieldsTouched = {
    correo: false,
    password: false
  };

  // Estado del formulario
  isSubmitting: boolean = false;
  showSpinner: boolean = false;
  attemptedLogin: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {}

  // Método para manejar el cambio del prefijo del email
  onEmailPrefixChange(event: any) {
    const prefix = event.target?.value || '';
    this.emailPrefix = prefix;
    
    // Actualizar el correo completo
    this.credenciales.correo = prefix + '@retofitness.com';
    
    // Validar si ya fue tocado
    if (this.fieldsTouched.correo || this.attemptedLogin) {
      this.validateCorreo();
    }
    
    console.log('Email completo:', this.credenciales.correo);
  }

  // Método para actualizar valores sin validar automáticamente
  onInputChange(field: string, event: any) {
    const value = event.target?.value || '';
    
    // Actualizar el valor en el modelo
    (this.credenciales as any)[field] = value;
    
    // Solo validar si el campo ya fue tocado o se intentó hacer login
    if (this.fieldsTouched[field as keyof typeof this.fieldsTouched] || this.attemptedLogin) {
      switch(field) {
        case 'correo':
          this.validateCorreo();
          break;
        case 'password':
          this.validatePassword();
          break;
      }
    }
    
    console.log(`Campo ${field} cambió a:`, value);
  }

  // Método para cuando el usuario sale del campo (blur)
  onInputBlur(field: string) {
    // Marcar el campo como tocado
    (this.fieldsTouched as any)[field] = true;
    
    // Ahora validar el campo específico
    switch(field) {
      case 'correo':
        this.validateCorreo();
        break;
      case 'password':
        this.validatePassword();
        break;
    }
    
    console.log(`Blur en ${field} - Campo marcado como tocado`);
  }

  // Métodos para eventos de focus
  onInputFocus(field: string) {
    console.log(`Focus en ${field}`);
  }

  // Validación del correo
  validateCorreo(showError: boolean = false): boolean {
    const emailPrefix = this.credenciales.correo.replace('@retofitness.com', '');
    const includesDomain = this.credenciales.correo.includes('@retofitness.com');
    const hasPrefix = emailPrefix.length >= 3;
    const isValid = includesDomain && hasPrefix;
    
    if (showError || this.fieldsTouched.correo || this.attemptedLogin) {
      if (!includesDomain) {
        this.validationErrors.correo = 'El correo debe terminar en @retofitness.com';
      } else if (emailPrefix.length === 0) {
        this.validationErrors.correo = 'Debe ingresar caracteres antes de @retofitness.com';
      } else if (!hasPrefix) {
        this.validationErrors.correo = 'El correo debe tener al menos 3 caracteres antes de @retofitness.com';
      } else {
        this.validationErrors.correo = '';
      }
    }
    
    return isValid;
  }

  // Validación de la contraseña
  validatePassword(showError: boolean = false): boolean {
    const hasMinLength = this.credenciales.password.length >= 6;
    const isValid = hasMinLength;
    
    if (showError || this.fieldsTouched.password || this.attemptedLogin) {
      if (!hasMinLength) {
        this.validationErrors.password = 'La contraseña debe tener mínimo 6 caracteres';
      } else {
        this.validationErrors.password = '';
      }
    }
    
    return isValid;
  }

  // Validación completa del formulario
  isFormValid(): boolean {
    const correoValid = this.validateCorreo();
    const passwordValid = this.validatePassword();
    return correoValid && passwordValid;
  }

  // Navegar al registro
  goToRegister() {
    this.router.navigate(['/register']);
  }

  // Proceso de login
  async onLogin() {
    console.log('=== INICIANDO LOGIN ===');
    console.log('Estado inicial - showSpinner:', this.showSpinner, 'isSubmitting:', this.isSubmitting);
    
    this.attemptedLogin = true;
    this.isSubmitting = true;
    this.showSpinner = true;
    
    console.log('Estado después de activar - showSpinner:', this.showSpinner, 'isSubmitting:', this.isSubmitting);

    // Timeout de seguridad
    const timeoutId = setTimeout(() => {
      console.log('⚠️ TIMEOUT DE SEGURIDAD ACTIVADO');
      this.showSpinner = false;
      this.isSubmitting = false;
      this.toastService.mostrarError('El proceso tomó demasiado tiempo. Por favor, inténtalo de nuevo.');
    }, 15000);
    
    try {
      // Validar datos antes del login
      if (!this.isFormValid()) {
        console.log('❌ Validación falló');
        
        // Forzar validación visual
        this.validateCorreo(true);
        this.validatePassword(true);
        
        clearTimeout(timeoutId);
        this.isSubmitting = false;
        this.showSpinner = false;
        return;
      }

      console.log('✅ Validación pasó');

      // Intentar login
      console.log('📤 Enviando credenciales a AuthService...');
      const result = await this.authService.login(
        this.credenciales.correo.trim(),
        this.credenciales.password
      );
      
      console.log('📥 Respuesta recibida:', result);
      
      if (!result.success) {
        console.error('❌ ERROR EN LOGIN:', result.error);
        
        // Limpiar timeout de seguridad
        clearTimeout(timeoutId);
        
        // Ocultar spinner inmediatamente
        this.showSpinner = false;
        this.isSubmitting = false;
        
        console.log('🔄 Estado después de error - showSpinner:', this.showSpinner, 'isSubmitting:', this.isSubmitting);
        
        // Mostrar error con toast
        console.log('🍞 Mostrando toast de error...');
        await this.toastService.mostrarError(result.error || 'Error al iniciar sesión');
        console.log('✅ Toast de error mostrado');
        
        return;
      }

      // Login exitoso
      console.log('🎉 Login exitoso:', result.usuario);
      
      // Guardar sesión
      if (result.usuario) {
        this.authService.guardarSesion(result.usuario);
      }
      
      // Limpiar timeout de seguridad
      clearTimeout(timeoutId);

      // Mostrar éxito
      console.log('🎉 Login exitoso, mostrando toast...');
      const tipoUsuario = result.usuario?.tipo === 'cliente' ? 'cliente' : 'entrenador';
      await this.toastService.mostrarExito(`¡Bienvenido ${tipoUsuario}!`);
      
      // Navegar según el tipo de usuario
      setTimeout(() => {
        this.showSpinner = false;
        
        if (result.usuario?.tipo === 'cliente') {
          console.log('📱 Navegando a dashboard de cliente');
          // TODO: Navegar a dashboard de cliente
          this.router.navigate(['/welcome']); // Temporal
        } else {
          console.log('👨‍💼 Navegando a dashboard de entrenador');
          // TODO: Navegar a dashboard de entrenador
          this.router.navigate(['/welcome']); // Temporal
        }
      }, 1000);
      
      console.log('🏁 Proceso de login completado exitosamente');
      
    } catch (error) {
      console.error('💥 ERROR INESPERADO:', error);
      
      // Limpiar timeout de seguridad
      clearTimeout(timeoutId);
      
      // Ocultar spinner
      this.showSpinner = false;
      this.isSubmitting = false;
      
      // Mostrar error
      await this.toastService.mostrarError('Error inesperado durante el login');
    } finally {
      // Este finally se ejecuta siempre
      console.log('🔚 Finally ejecutado - isSubmitting se establece a false');
      this.isSubmitting = false;
    }
  }
}
