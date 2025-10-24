import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonIcon } from '@ionic/angular';
import { IonIcon as IonIconStandalone } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Cliente } from '../models/cliente/cliente.interface';
import { Cliente as ClienteSupabase } from '../services/supabase.service';
import { ClienteService } from '../services/cliente.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, IonIconStandalone]
})
export class RegisterComponent implements OnInit {

  // Datos del formulario
  cliente: Cliente = {
    // id se generará automáticamente en la base de datos
    nombre: '',
    apellido: '',
    edad: 25,
    correo: '@retofitness.com',
    password: '',
    enfermedadCronica: false,
    descripcionEnfermedad: '',
    diabetes: false,
    hipotension: false,
    hipotiroide: false,
    hipotiroidismo: false,
    medicacionRegular: false,
    descripcionMedicacion: '',
    cirugias: false,
    descripcionCirugias: '',
    lesiones: false,
    descripcionLesiones: '',
    fuma: false,
    alcohol: false,
    horasSueno: '7',
    peso: 70,
    objetivo: '',
    altura: 170,
    nivelActividad: 'Medio',
    genero: 'Hombre',
    qr: '' // Se generará después del registro con el id
  };

  // Mensajes de error para validación
  validationErrors = {
    nombre: '',
    apellido: '',
    edad: '',
    correo: '',
    password: '',
    genero: ''
  };

  // Seguimiento de campos tocados por el usuario
  fieldsTouched = {
    nombre: false,
    apellido: false,
    edad: false,
    correo: false,
    password: false,
    genero: false
  };

  // Seguimiento de intentos de avanzar al siguiente paso
  attemptedNextStep = false;

  // Objetivos múltiples separados
  objetivos = {
    bajarPeso: false,
    aumentarMasa: false,
    mejorarFuerza: false,
    mejorarResistencia: false,
    mejorarSalud: false,
    otro: false
  };

  // Campo para objetivo personalizado
  objetivoOtro: string = '';

  // Estado del formulario
  currentStep: number = 1;
  totalSteps: number = 4;
  isSubmitting: boolean = false;
  showSuccess: boolean = false;
  showSpinner: boolean = false;
  
  // Detección de dispositivo móvil para iconos
  isMobile: boolean = false;
  
  
  // Variables para animaciones
  animationClass: string = '';
  isAnimating: boolean = false;

  constructor(
    private router: Router,
    private clienteService: ClienteService,
    private toastService: ToastService
  ) { 
    // Asegurar que el objeto cliente esté completamente inicializado
    console.log('Cliente inicializado:', this.cliente);
  }

  ngOnInit() {}


  // Método para actualizar valores sin validar automáticamente
  onInputChange(field: string, event: any) {
    const value = event.target?.value || '';
    
    // Actualizar el valor en el modelo
    (this.cliente as any)[field] = value;
    
    // Solo validar si el campo ya fue tocado o se intentó avanzar
    if (this.fieldsTouched[field as keyof typeof this.fieldsTouched] || this.attemptedNextStep) {
      switch(field) {
        case 'nombre':
          this.validateNombre();
          break;
        case 'apellido':
          this.validateApellido();
          break;
        case 'edad':
          this.validateEdad();
          break;
        case 'correo':
          this.validateCorreo();
          break;
        case 'password':
          this.validatePasswordField();
          break;
        case 'genero':
          this.validateGenero();
          break;
      }
    }
    
    console.log(`Campo ${field} cambió a:`, value);
  }

  // Métodos para eventos de focus
  onInputFocus(field: string) {
    console.log(`Focus en ${field}`);
  }

  // Método para cuando el usuario sale del campo (blur)
  onInputBlur(field: string) {
    // Marcar el campo como tocado
    (this.fieldsTouched as any)[field] = true;
    
    // Ahora validar el campo específico
    switch(field) {
      case 'nombre':
        this.validateNombre();
        break;
      case 'apellido':
        this.validateApellido();
        break;
      case 'edad':
        this.validateEdad();
        break;
      case 'correo':
        this.validateCorreo();
        break;
      case 'password':
        this.validatePasswordField();
        break;
      case 'genero':
        this.validateGenero();
        break;
    }
    
    console.log(`Blur en ${field} - Campo marcado como tocado`);
  }

  // Actualizar objetivos múltiples
  updateObjetivos() {
    const objetivosSeleccionados = [];
    if (this.objetivos.bajarPeso) objetivosSeleccionados.push('Bajar de peso');
    if (this.objetivos.aumentarMasa) objetivosSeleccionados.push('Aumentar masa muscular');
    if (this.objetivos.mejorarFuerza) objetivosSeleccionados.push('Mejorar fuerza');
    if (this.objetivos.mejorarResistencia) objetivosSeleccionados.push('Mejorar resistencia');
    if (this.objetivos.mejorarSalud) objetivosSeleccionados.push('Mejorar salud general');
    if (this.objetivos.otro && this.objetivoOtro.trim() !== '') {
      objetivosSeleccionados.push(this.objetivoOtro.trim());
    }
    
    // Si no hay objetivos seleccionados, usar valor por defecto
    this.cliente.objetivo = objetivosSeleccionados.length > 0 
      ? objetivosSeleccionados.join(', ') 
      : 'Mejorar condición física general';
      
    console.log('Objetivos actualizados:', this.cliente.objetivo);
  }

  goBack() {
    if (this.currentStep > 1) {
      this.currentStep--;
    } else {
      this.router.navigate(['/welcome']);
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps && !this.isAnimating) {
      // Si estamos en el paso 1, validar antes de avanzar
      if (this.currentStep === 1) {
        this.attemptedNextStep = true;
        
        // Forzar validación de todos los campos del paso 1
        const nombreValid = this.validateNombre(true);
        const apellidoValid = this.validateApellido(true);
        const edadValid = this.validateEdad(true);
        const correoValid = this.validateCorreo(true);
        const passwordValid = this.validatePasswordField(true);
        const generoValid = this.validateGenero(true);
        
        // Solo avanzar si todos los campos son válidos
        if (!this.isStep1Valid()) {
          return;
        }
      }
      
      this.animateStepTransition('next');
    }
  }

  prevStep() {
    if (this.currentStep > 1 && !this.isAnimating) {
      this.animateStepTransition('back');
    }
  }

  animateStepTransition(direction: 'next' | 'back') {
    this.isAnimating = true;
    
    // Aplicar animación de salida
    this.animationClass = direction === 'next' ? 'step-slide-leave' : 'step-slide-leave-back';
    
    setTimeout(() => {
      // Cambiar el paso después de la animación de salida
      if (direction === 'next') {
        this.currentStep++;
      } else {
        this.currentStep--;
      }

      // Resetear el estado de intento de avanzar cuando se cambia de paso
      if (direction === 'back' && this.currentStep === 1) {
        this.attemptedNextStep = false;
      }
      
      // Aplicar animación de entrada
      this.animationClass = direction === 'next' ? 'step-slide-enter' : 'step-slide-enter-back';
      
      setTimeout(() => {
        // Limpiar animaciones
        this.animationClass = '';
        this.isAnimating = false;
      }, 400);
    }, 200);
  }

  toggleObjetivo(objetivo: string) {
    (this.objetivos as any)[objetivo] = !(this.objetivos as any)[objetivo];
    this.updateObjetivos();
  }

  // Validación completa de todos los datos
  validateAllData(): boolean {
    // Validar paso 1
    if (!this.isStep1Valid()) {
      this.toastService.mostrarError('Por favor completa correctamente los datos personales');
      this.currentStep = 1;
      return false;
    }

    // Validar paso 2
    if (!this.isStep2Valid()) {
      this.toastService.mostrarError('Por favor completa correctamente los datos físicos');
      this.currentStep = 2;
      return false;
    }

    // Validar contraseña con letras y números
    if (!this.validatePassword()) {
      this.toastService.mostrarError('La contraseña debe contener al menos una letra y un número');
      this.currentStep = 1;
      return false;
    }

    return true;
  }

  // Validar que la contraseña tenga letras y números
  validatePassword(): boolean {
    const hasLetter = /[a-zA-Z]/.test(this.cliente.password);
    const hasNumber = /\d/.test(this.cliente.password);
    return hasLetter && hasNumber;
  }

  // Convertir DataURL a Blob para subir archivo
  dataURLtoBlob(dataurl: string): Blob {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  async onSubmit() {
    console.log('Iniciando onSubmit');
    this.isSubmitting = true;
    this.showSpinner = true;
    console.log('Spinner activado:', this.showSpinner);

    // Timeout de seguridad para evitar que el spinner se quede colgado
    const timeoutId = setTimeout(() => {
      console.log('Timeout de seguridad activado');
      this.showSpinner = false;
      this.isSubmitting = false;
      this.toastService.mostrarError('El proceso tomó demasiado tiempo. Por favor, inténtalo de nuevo.');
    }, 30000); // 30 segundos
    
    try {
      // Validar datos antes del registro
      if (!this.validateAllData()) {
        this.isSubmitting = false;
        this.showSpinner = false;
        clearTimeout(timeoutId);
        return;
      }

      // Preparar datos del cliente para Supabase
      const clienteSupabase: ClienteSupabase = {
        nombre: this.cliente.nombre.trim(),
        apellido: this.cliente.apellido.trim(),
        edad: this.cliente.edad,
        correo: this.cliente.correo.trim(),
        contraseña: this.cliente.password,
        enfermedadCronicoa: this.cliente.enfermedadCronica,
        descripcionEnfermedad: this.cliente.descripcionEnfermedad?.trim() || '',
        diabetes: this.cliente.diabetes,
        hipotension: this.cliente.hipotension,
        hipotiroide: this.cliente.hipotiroide,
        hipotiroidismo: this.cliente.hipotiroidismo,
        medicacionRegular: this.cliente.medicacionRegular,
        descripcionMedicacion: this.cliente.descripcionMedicacion?.trim() || '',
        cirugias: this.cliente.cirugias,
        descripcionCirugias: this.cliente.descripcionCirugias?.trim() || '',
        lesiones: this.cliente.lesiones,
        descripcionLesiones: this.cliente.descripcionLesiones?.trim() || '',
        fuma: this.cliente.fuma,
        alcohol: this.cliente.alcohol,
        horas_sueno: this.cliente.horasSueno || '7', // Enviar como string para coincidir con BD
        peso: this.cliente.peso,
        objetivo: this.cliente.objetivo,
        altura: this.cliente.altura,
        nivelActividad: this.cliente.nivelActividad || 'Medio',
        genero: this.cliente.genero || 'Hombre',
        qr: '' // Se actualizará después de generar el QR
      };

      // Usar ClienteService para crear el cliente con QR automáticamente
      console.log('Intentando registrar cliente:', clienteSupabase);
      const result = await this.clienteService.crearCliente(clienteSupabase);
      console.log('Resultado del registro:', result);
      
      if (!result.success) {
        console.error('Error en el registro:', result.error);
        await this.toastService.mostrarError(result.error || 'Error al registrar el cliente');
        this.isSubmitting = false;
        this.showSpinner = false;
        clearTimeout(timeoutId);
        return;
      }

      // Mostrar éxito
      await this.toastService.mostrarExito('¡Registro completado exitosamente!');
      
      // Limpiar timeout de seguridad
      clearTimeout(timeoutId);
      
      // Pequeña pausa antes de mostrar éxito
      setTimeout(() => {
        this.showSpinner = false;
        this.showSuccess = true;
      }, 1000);
      
      console.log('Proceso completado exitosamente');
      
    } catch (error) {
      console.error('Error registrando cliente:', error);
      await this.toastService.mostrarError('Error inesperado durante el registro');
      // Limpiar timeout de seguridad
      clearTimeout(timeoutId);
      this.showSpinner = false;
    } finally {
      this.isSubmitting = false;
    }
  }

  // Método para probar el spinner
  testSpinner() {
    this.showSpinner = true;
    console.log('Spinner de prueba activado:', this.showSpinner);
    
    setTimeout(() => {
      this.showSpinner = false;
      console.log('Spinner de prueba desactivado');
    }, 3000);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  // Validación individual de campos (solo muestra error si ha sido tocado)
  validateNombre(showError: boolean = false): boolean {
    const isValid = this.cliente.nombre.trim() !== '';
    
    if (showError || this.fieldsTouched.nombre || this.attemptedNextStep) {
      if (!isValid) {
        this.validationErrors.nombre = 'El nombre es obligatorio';
      } else {
        this.validationErrors.nombre = '';
      }
    }
    
    return isValid;
  }

  validateApellido(showError: boolean = false): boolean {
    const isValid = this.cliente.apellido.trim() !== '';
    
    if (showError || this.fieldsTouched.apellido || this.attemptedNextStep) {
      if (!isValid) {
        this.validationErrors.apellido = 'El apellido es obligatorio';
      } else {
        this.validationErrors.apellido = '';
      }
    }
    
    return isValid;
  }

  validateEdad(showError: boolean = false): boolean {
    const isValid = this.cliente.edad >= 10 && this.cliente.edad <= 80;
    
    if (showError || this.fieldsTouched.edad || this.attemptedNextStep) {
      if (!isValid) {
        this.validationErrors.edad = 'Debe tener entre 10 y 80 años';
      } else {
        this.validationErrors.edad = '';
      }
    }
    
    return isValid;
  }

  validateCorreo(showError: boolean = false): boolean {
    const emailPrefix = this.cliente.correo.replace('@retofitness.com', '');
    const includesDomain = this.cliente.correo.includes('@retofitness.com');
    const hasPrefix = emailPrefix.length >= 3;
    const isValid = includesDomain && hasPrefix;
    
    if (showError || this.fieldsTouched.correo || this.attemptedNextStep) {
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

  validatePasswordField(showError: boolean = false): boolean {
    const hasMinLength = this.cliente.password.length >= 6;
    const hasLetterAndNumber = this.validatePassword();
    const isValid = hasMinLength && hasLetterAndNumber;
    
    if (showError || this.fieldsTouched.password || this.attemptedNextStep) {
      if (!hasMinLength) {
        this.validationErrors.password = 'La contraseña debe tener mínimo 6 caracteres';
      } else if (!hasLetterAndNumber) {
        this.validationErrors.password = 'La contraseña debe tener al menos una letra y un número';
      } else {
        this.validationErrors.password = '';
      }
    }
    
    return isValid;
  }

  validateGenero(showError: boolean = false): boolean {
    const isValid = !!this.cliente.genero;
    
    if (showError || this.fieldsTouched.genero || this.attemptedNextStep) {
      if (!isValid) {
        this.validationErrors.genero = 'Debe seleccionar un género';
      } else {
        this.validationErrors.genero = '';
      }
    }
    
    return isValid;
  }

  // Validaciones por paso
  isStep1Valid(): boolean {
    const nombreValid = this.validateNombre();
    const apellidoValid = this.validateApellido();
    const edadValid = this.validateEdad();
    const correoValid = this.validateCorreo();
    const passwordValid = this.validatePasswordField();
    const generoValid = this.validateGenero();

    return nombreValid && apellidoValid && edadValid && correoValid && passwordValid && generoValid;
  }

  isStep2Valid(): boolean {
    return this.cliente.peso > 0 && 
           this.cliente.altura > 0 && 
           this.cliente.horasSueno.trim() !== '';
  }

  isStep3Valid(): boolean {
    // Step 3 es opcional, siempre válido
    return true;
  }

  isStep4Valid(): boolean {
    // Step 4 es resumen, siempre válido
    return true;
  }

  // Método para verificar si hay condiciones médicas para mostrar en el resumen
  hasHealthConditions(): boolean {
    return this.cliente.enfermedadCronica || 
           this.cliente.diabetes || 
           this.cliente.hipotension || 
           this.cliente.hipotiroide || 
           this.cliente.medicacionRegular || 
           this.cliente.cirugias || 
           this.cliente.lesiones || 
           this.cliente.fuma || 
           this.cliente.alcohol;
  }
}