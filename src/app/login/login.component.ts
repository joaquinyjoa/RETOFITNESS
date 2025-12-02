import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UsuarioLogueado } from '../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, NgIf]
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
  attemptedLogin: boolean = false;

  // Control de visibilidad de contraseña
  showPassword: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastController: ToastController
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
    
    this.attemptedLogin = true;
    this.isSubmitting = true;
    
    try {
      // Validar datos antes del login
      if (!this.isFormValid()) {
        console.log('❌ Validación falló');
        
        // Forzar validación visual
        this.validateCorreo(true);
        this.validatePassword(true);
        
        this.isSubmitting = false;
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
        
        this.isSubmitting = false;
        
        // Mostrar error con toast en la parte superior
        await this.presentToast(result.error || 'Error al iniciar sesión', 'top');
        
        return;
      }

      // Login exitoso
      console.log('🎉 Login exitoso:', result.usuario);
      
      // Guardar sesión
      if (result.usuario) {
        console.log('💾 Guardando sesión en localStorage:', result.usuario);
        this.authService.guardarSesion(result.usuario);
        
        // Verificar que se guardó correctamente
        const sesionGuardada = this.authService.obtenerSesion();
        console.log('🔍 Verificando sesión guardada:', sesionGuardada);
      }

      // Mostrar éxito en la parte superior
      const tipoUsuario = result.usuario?.tipo === 'cliente' ? 'cliente' : 'entrenador';
      console.log('🏷️ Tipo de usuario determinado:', tipoUsuario);
      await this.presentToast(`¡Bienvenido ${tipoUsuario}!`, 'top');
      
      // Navegar según el tipo de usuario inmediatamente
      try {
        console.log('🚀 Iniciando navegación para tipo:', result.usuario?.tipo);
        
        if (result.usuario?.tipo === 'cliente') {
          console.log('📱 Navegando a panel de cliente');
          await this.router.navigate(['/panel-cliente']);
          console.log('✅ Navegación a panel de cliente exitosa');
        } else if (result.usuario?.tipo === 'entrenador') {
          console.log('👨‍💼 Navegando a panel de entrenador');
          await this.router.navigate(['/panel-entrenador']);
          console.log('✅ Navegación a panel de entrenador exitosa');
        } else {
          console.log('❓ Tipo de usuario no reconocido:', result.usuario?.tipo);
        }
      } catch (navError) {
        console.error('❌ Error en navegación:', navError);
        await this.presentToast('Error al cargar el panel. Intenta de nuevo.', 'top');
        return;
      }
      
      console.log('🏁 Proceso de login completado exitosamente');
      
    } catch (error) {
      console.error('💥 ERROR INESPERADO:', error);
      
      this.isSubmitting = false;
      
      // Mostrar error
      await this.presentToast('Error inesperado durante el login', 'top');
    } finally {
      // Este finally se ejecuta siempre
      console.log('🔚 Finally ejecutado - isSubmitting se establece a false');
      this.isSubmitting = false;
    }
  }

  // Método para alternar visibilidad de contraseña
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    console.log('🔍 Visibilidad de contraseña:', this.showPassword ? 'visible' : 'oculta');
  }

  // Método para acceso rápido como entrenador
  async accesoRapidoEntrenador() {

    // Establecer credenciales predefinidas
    this.credenciales.correo = 'gus@retofitness.com';
    // También actualizar el campo enlazado `emailPrefix` para que el input muestre el valor
    this.emailPrefix = 'gus@retofitness.com';
    this.credenciales.password = 'gus1209';
    
    // Mostrar mensaje de acceso rápido
    await this.presentToast('Credenciales de entrenador cargadas', 'top');
    
    // Proceder con el login automáticamente
    await this.onLogin();
  }

  // Método para mostrar toast usando ToastController nativo
  async presentToast(message: string, position: 'top' | 'middle' | 'bottom') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: position,
      color: message.includes('Bienvenido') ? 'success' : 'danger'
    });

    await toast.present();
  }
}
