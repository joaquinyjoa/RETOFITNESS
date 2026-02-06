import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UsuarioLogueado } from '../services/auth.service';
import { NgIf } from '@angular/common';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, NgIf, SpinnerComponent]
})
export class LoginComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {

  // Estado del spinner
  mostrarSpinner = false;

  // Datos del formulario
  credenciales = {
    correo: '',
    password: ''
  };

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
  enviando: boolean = false;
  intentoLogin: boolean = false;

  // Control de visibilidad de contraseña
  mostrarPassword: boolean = false;

  private router = inject(Router);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    // Resetear spinner por si volvemos al componente
    this.mostrarSpinner = false;
  }

  ionViewWillEnter() {
    // Este hook se ejecuta SIEMPRE antes de entrar a la vista
    setTimeout(() => {
      this.mostrarSpinner = false;
      this.cdr.detectChanges();
    }, 0);
  }

  ionViewWillLeave() {
    // Apagar spinner al salir de la vista
    this.mostrarSpinner = false;
  }

  ngOnDestroy() {
    // Asegurar que el spinner se apague al destruir el componente
    this.mostrarSpinner = false;
  }

  // Método para actualizar valores sin validar automáticamente
  onInputChange(field: string, event: any) {
    const value = event.target?.value || '';
    
    // Actualizar el valor en el modelo
    (this.credenciales as any)[field] = value;
    
    // Solo validar si el campo ya fue tocado o se intentó hacer login
    if (this.fieldsTouched[field as keyof typeof this.fieldsTouched] || this.intentoLogin) {
      switch(field) {
        case 'correo':
          this.validateCorreo();
          break;
        case 'password':
          this.validatePassword();
          break;
      }
    }
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
    
  }

  // Método para cuando el usuario hace foco en un campo
  onInputFocus(field: string) {
    // Limpiar error cuando el usuario hace foco en el campo
    if (this.validationErrors[field as keyof typeof this.validationErrors]) {
      (this.validationErrors as any)[field] = '';
    }
  }

  // Validación del correo
  validateCorreo(showError: boolean = false): boolean {
    const emailPrefix = this.credenciales.correo.replace('@retofitness.com', '');
    const includesDomain = this.credenciales.correo.includes('@retofitness.com');
    const hasPrefix = emailPrefix.length >= 3;
    const isValid = includesDomain && hasPrefix;
    
    if (showError || this.fieldsTouched.correo || this.intentoLogin) {
      if (!includesDomain) {
        this.validationErrors.correo = 'El correo debe terminar en @retofitness.com';
      } else if (emailPrefix.length === 0) {
        this.validationErrors.correo = 'Debe ingresar un correo con terminacion @retofitness.com';
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
    const hasUppercase = /[A-Z]/.test(this.credenciales.password);
    const isValid = hasMinLength && hasUppercase;

    if (showError || this.fieldsTouched.password || this.intentoLogin) {
      if (!hasMinLength) {
        this.validationErrors.password = 'La contraseña debe tener mínimo 6 caracteres';
      } else if (!hasUppercase) {
        this.validationErrors.password = 'La contraseña debe contener al menos una letra mayúscula';
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

  // Verificar conexión a internet
  private verificarConexion(): boolean {
    // En móvil, confiar en navigator.onLine es suficiente
    return navigator.onLine;
  }

  // Proceso de login
  async onLogin() {
    this.intentoLogin = true;
    this.enviando = true;
    this.mostrarSpinner = true;
    this.cdr.detectChanges();
    
    // Timeout de seguridad: apagar spinner después de 30 segundos máximo
    const timeoutId = setTimeout(() => {
      this.mostrarSpinner = false;
      this.enviando = false;
      this.cdr.detectChanges();
    }, 30000);
    
    try {
      // Verificar conexión a internet PRIMERO
      const tieneConexion = this.verificarConexion();
      if (!tieneConexion) {
        await this.presentToast('Necesitas conectarte a internet para iniciar sesión', 'top');
        return;
      }

      // Validar datos antes del login
      if (!this.isFormValid()) {
        // Forzar validación visual
        this.validateCorreo(true);
        this.validatePassword(true);
        return;
      }

      // Preparar credenciales
      const correoLimpio = this.credenciales.correo.trim();
      const passwordLimpio = this.credenciales.password.trim();

      // Validar que no estén vacías después del trim
      if (!correoLimpio || !passwordLimpio) {
        await this.presentToast('Por favor ingresa correo y contraseña', 'top');
        return;
      }

      // Intentar login con timeout de 15 segundos
      const loginPromise = this.authService.login(correoLimpio, passwordLimpio);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 15000)
      );
      
      const result = await Promise.race([loginPromise, timeoutPromise]) as any;
      
      if (!result.success) {
        await this.presentToast(result.error || 'Error al iniciar sesión', 'top');
        return;
      }
      
      // Guardar sesión
      if (result.usuario) {
        try {
          this.authService.guardarSesion(result.usuario);
        } catch (e) {
          console.error('Error guardando sesión:', e);
        }
      }
      
      // Navegar según el tipo de usuario con delay de 1.5s para mostrar spinner
      let ruta = '/login';
      if (result.usuario?.tipo === 'cliente') {
        ruta = '/panel-cliente';
      } else if (result.usuario?.tipo === 'entrenador') {
        ruta = '/panel-entrenador';
      } else if (result.usuario?.tipo === 'recepcion') {
        ruta = '/panel-recepcion';
      }
      
      // Esperar 1.5 segundos antes de navegar
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await this.router.navigate([ruta], { replaceUrl: true });
      
    } catch (error: any) {
      console.error('ERROR EN LOGIN:', error);
      if (error.message === 'Login timeout') {
        await this.presentToast('El servidor está tardando mucho. Intenta nuevamente.', 'top');
      } else {
        await this.presentToast('Error inesperado durante el login', 'top');
      }
    } finally {
      clearTimeout(timeoutId);
      // SIEMPRE apagar spinner
      this.enviando = false;
      this.mostrarSpinner = false;
      this.cdr.detectChanges();
    }
  }

  // Método para alternar visibilidad de contraseña
  togglePasswordVisibility() {
    this.mostrarPassword = !this.mostrarPassword;
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
