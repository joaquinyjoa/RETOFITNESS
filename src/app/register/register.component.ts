import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Cliente } from '../models/cliente/cliente.interface';
import { Cliente as ClienteSupabase } from '../services/supabase.service';
import { ClienteService } from '../services/cliente.service';
import { ToastService } from '../services/toast.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SpinnerComponent]
})
export class RegisterComponent implements OnInit {

  // Datos del formulario
  cliente: Cliente = {
    // id se generará automáticamente en la base de datos
    nombre: '',
    apellido: '',
    edad: 18,
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
    genero: 'Hombre'
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
  private toastService: ToastService,
  private cdr: ChangeDetectorRef
  ) { 
    // Asegurar que el objeto cliente esté completamente inicializado
  }

  ngOnInit() {
    // Resetear el formulario al estado inicial cuando se carga el componente
    this.resetForm();
  }

  ngAfterViewInit() {
    // Inicializar lista cacheada de condiciones
    this.refreshSelectedConditions();
  }

  // Método para resetear el formulario a su estado inicial
  resetForm() {
    this.currentStep = 1;
    this.showSuccess = false;
    this.showSpinner = false;
    this.isSubmitting = false;
    this.attemptedNextStep = false;
    
    // Resetear datos del cliente a valores iniciales
    this.cliente = {
      nombre: '',
      apellido: '',
      edad: 18,
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
      genero: 'Hombre'
    };
    
    // Resetear objetivos
    this.objetivos = {
      bajarPeso: false,
      aumentarMasa: false,
      mejorarFuerza: false,
      mejorarResistencia: false,
      mejorarSalud: false,
      otro: false
    };
    this.objetivoOtro = '';
    
    // Resetear validación de campos
    this.fieldsTouched = {
      nombre: false,
      apellido: false,
      edad: false,
      correo: false,
      password: false,
      genero: false
    };
    
    this.validationErrors = {
      nombre: '',
      apellido: '',
      edad: '',
      correo: '',
      password: '',
      genero: ''
    };
  }


  // Método para actualizar valores sin validar automáticamente
  onInputChange(field: string, event: any) {
    const target = event.target as any;
    let value: any = '';

    // Manejar checkboxes correctamente (usar checked) y tipos numéricos
    if (target) {
      if (target.type === 'checkbox') {
        value = !!target.checked;
      } else if (target.type === 'number') {
        // mantener número o cadena vacía
        value = target.value === '' ? '' : Number(target.value);
      } else {
        value = target.value ?? '';
      }
    }

    // Actualizar el valor en el modelo
    (this.cliente as any)[field] = value;

    // Si cambiaron campos relacionados con condiciones médicas, refrescar la lista cacheada
    const healthFields = [
      'enfermedadCronica', 'descripcionEnfermedad', 'diabetes', 'hipotension', 'hipotiroide',
      'hipotiroidismo', 'medicacionRegular', 'descripcionMedicacion', 'cirugias', 'descripcionCirugias',
      'lesiones', 'descripcionLesiones', 'fuma', 'alcohol'
    ];
    if (healthFields.includes(field)) {
      // Usar setTimeout con delay mínimo para no bloquear el hilo principal
      setTimeout(() => this.refreshSelectedConditions(), 0);
    }
    
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
   
  }

  // Método para cuando el usuario hace foco en un campo
  onInputFocus(field: string) {
    // Limpiar error cuando el usuario hace foco en el campo
    if (this.validationErrors[field as keyof typeof this.validationErrors]) {
      (this.validationErrors as any)[field] = '';
    }
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
    
  }

  goBack() {
    if (this.currentStep > 1) {
      this.currentStep--;
    } else {
      this.router.navigate(['/welcome']);
    }
  }

  async nextStep() {
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

        // Validar que el correo no esté registrado en la base de datos
        this.showSpinner = true;
        this.cdr.detectChanges(); // Forzar actualización UI

        // Garantizar duración mínima del spinner
        const spinnerStart = Date.now();
        const minSpinnerDuration = 1500; // ms

        try {
          const emailExists = await this.clienteService.verificarEmailExistente(this.cliente.correo.trim());

          // Asegurar que el spinner esté visible al menos `minSpinnerDuration`
          const elapsed = Date.now() - spinnerStart;
          const remaining = Math.max(0, minSpinnerDuration - elapsed);
          if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));

          this.showSpinner = false;
          this.cdr.detectChanges(); // Forzar actualización UI

          if (emailExists) {
            this.validationErrors.correo = 'Este correo ya está registrado. Por favor usa otro.';
            await this.toastService.mostrarError('El correo ya está en uso');
            return;
          }
        } catch (error) {
          console.error('🔴 Error verificando correo:', error);

          const elapsed = Date.now() - spinnerStart;
          const remaining = Math.max(0, minSpinnerDuration - elapsed);
          if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));

          this.showSpinner = false;
          this.cdr.detectChanges(); // Forzar actualización UI
          await this.toastService.mostrarError('Error al verificar el correo. Intenta nuevamente.');
          return;
        }
      }
      
      // Si estamos en el paso 2, validar antes de avanzar
      if (this.currentStep === 2) {
        if (!this.isStep2Valid()) {
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
    
    // Envolver en setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      // Aplicar animación de salida
      this.animationClass = direction === 'next' ? 'step-slide-leave' : 'step-slide-leave-back';
      this.cdr.detectChanges();
      
      setTimeout(() => {
        // Cambiar el paso después de la animación de salida
        if (direction === 'next') {
          this.currentStep++;
        } else {
          this.currentStep--;
        }

        // Si llegamos al paso 4, refrescar condiciones para asegurar que se muestren
        if (this.currentStep === 4) {
          this.refreshSelectedConditions();
        }

        // Resetear el estado de intento de avanzar cuando se cambia de paso
        if (direction === 'back' && this.currentStep === 1) {
          this.attemptedNextStep = false;
        }
        
        // Aplicar animación de entrada
        this.animationClass = direction === 'next' ? 'step-slide-enter' : 'step-slide-enter-back';
        this.cdr.detectChanges();
        
        setTimeout(() => {
          // Limpiar animaciones
          this.animationClass = '';
          this.isAnimating = false;
          this.cdr.detectChanges();
        }, 400);
      }, 200);
    }, 0);
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
        this.toastService.mostrarError('La contraseña debe contener al menos una letra mayúscula y un número');
      this.currentStep = 1;
      return false;
    }

    return true;
  }

  // Validar que la contraseña tenga letras y números
  validatePassword(): boolean {
    const hasUppercase = /[A-Z]/.test(this.cliente.password);
    const hasNumber = /\d/.test(this.cliente.password);
    return hasUppercase && hasNumber;
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
    this.isSubmitting = true;
    this.showSpinner = true;
    this.cdr.detectChanges();

    // Timer para asegurar que el spinner se muestre por al menos 1.5 segundos
    const spinnerStartTime = Date.now();
    const minSpinnerDuration = 1500; // 1.5 segundos
    
    try {
      // Validar datos antes del registro
      if (!this.validateAllData()) {
        this.isSubmitting = false;
        this.showSpinner = false;
        this.cdr.detectChanges();
        return;
      }

      // Preparar datos del cliente para Supabase
      const clienteSupabase: ClienteSupabase = {
        nombre: this.cliente.nombre.trim(),
        apellido: this.cliente.apellido.trim(),
        edad: this.cliente.edad,
        correo: this.cliente.correo.trim(),
        // contraseña ya no se incluye, se maneja con Supabase Auth
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
        horas_sueno: this.cliente.horasSueno || '7',
        peso: this.cliente.peso,
        objetivo: this.cliente.objetivo,
        altura: this.cliente.altura,
        nivelActividad: this.cliente.nivelActividad || 'Medio',
        genero: this.cliente.genero || 'Hombre'
      };

      // Usar ClienteService para crear el cliente
      const result = await this.clienteService.crearCliente(clienteSupabase, this.cliente.password.trim());
      
      if (!result.success) {
        console.error('Error en el registro:', result.error);
        
        // Detener spinner inmediatamente en caso de error
        this.showSpinner = false;
        this.isSubmitting = false;
        this.cdr.detectChanges();
        
        await this.toastService.mostrarError(result.error || 'Error al registrar el cliente');
        return;
      }

      // Calcular tiempo restante para cumplir los 1.5 segundos
      const elapsedTime = Date.now() - spinnerStartTime;
      const remainingTime = Math.max(0, minSpinnerDuration - elapsedTime);
      
      // Esperar el tiempo restante si es necesario
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      // Ocultar spinner
      this.showSpinner = false;
      this.cdr.detectChanges();
      
      // Mostrar mensaje apropiado según si requiere confirmación o no
      if (result.requiresConfirmation) {
        await this.toastService.mostrarAdvertencia(
          '¡Registro completado! Tu cuenta está pendiente de aprobación. El administrador debe confirmar tu email antes de que puedas iniciar sesión.',
          6000
        );
      } else {
        await this.toastService.mostrarExito('¡Registro completado! Redirigiendo al login...');
      }
      
      // Navegar al login después de breve pausa
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, result.requiresConfirmation ? 3000 : 1500);
      
    } catch (error) {
      console.error('Error registrando cliente:', error);
      
      // Detener spinner inmediatamente en caso de error
      this.showSpinner = false;
      this.isSubmitting = false;
      this.cdr.detectChanges();
      
      await this.toastService.mostrarError('Error inesperado durante el registro');
    } finally {
      this.isSubmitting = false;
    }
  }

  // Método para probar el spinner
  testSpinner() {
    this.showSpinner = true;
    setTimeout(() => {
      this.showSpinner = false;
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
    const isValid = this.cliente.edad >= 12 && this.cliente.edad <= 70;
    
    if (showError || this.fieldsTouched.edad || this.attemptedNextStep) {
      if (!isValid) {
        this.validationErrors.edad = 'Debe tener entre 12 y 70 años';
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
      // Verificar si el usuario eliminó el dominio completo
      if (this.cliente.correo.length > 0 && !includesDomain) {
        this.validationErrors.correo = 'El correo debe incluir el dominio @retofitness.com';
      } else if (!includesDomain) {
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
        this.validationErrors.password = 'La contraseña debe tener mínimo 6 caracteres y una letra mayúscula';
      } else if (!hasLetterAndNumber) {
        this.validationErrors.password = 'La contraseña debe tener al menos una letra en mayúscula y un número';
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

  // Devuelve un array con las condiciones médicas seleccionadas y sus detalles opcionales
  // Lista cacheada de condiciones seleccionadas (se actualiza cuando cambian toggles/descripciones)
  selectedConditions: Array<{ label: string; detail?: string }> = [];

  // Reconstruye selectedConditions desde el modelo cliente
  refreshSelectedConditions() {
    const list: Array<{ label: string; detail?: string }> = [];

    // Solo agregar las condiciones que están en true, sin descripciones para evitar problemas de renderizado
    if (this.cliente.enfermedadCronica) {
      list.push({ label: 'Enfermedad crónica' });
    }
    if (this.cliente.diabetes) list.push({ label: 'Diabetes' });
    if (this.cliente.hipotension) list.push({ label: 'Hipotensión' });
    if (this.cliente.hipotiroide) list.push({ label: 'Hipotiroides' });
    if (this.cliente.hipotiroidismo) list.push({ label: 'Hipotiroidismo' });
    if (this.cliente.medicacionRegular) {
      list.push({ label: 'Medicación regular' });
    }
    if (this.cliente.cirugias) {
      list.push({ label: 'Cirugías' });
    }
    if (this.cliente.lesiones) {
      list.push({ label: 'Lesiones' });
    }
    if (this.cliente.fuma) list.push({ label: 'Fumador' });
    if (this.cliente.alcohol) list.push({ label: 'Consumo de alcohol' });

    this.selectedConditions = list;
    
    // Eliminamos detectChanges() para evitar conflictos con ion-icon duplicado
    // La detección de cambios se hará automáticamente
  }

  hasSelectedConditions(): boolean {
    const hasConditions = this.selectedConditions && this.selectedConditions.length > 0;
    return hasConditions;
  }

  // Método alternativo para verificar condiciones médicas directamente del modelo
  hasAnyMedicalCondition(): boolean {
    const hasConditions = this.cliente.enfermedadCronica || 
           this.cliente.diabetes || 
           this.cliente.hipotension || 
           this.cliente.hipotiroide || 
           this.cliente.hipotiroidismo || 
           this.cliente.medicacionRegular || 
           this.cliente.cirugias || 
           this.cliente.lesiones || 
           this.cliente.fuma || 
           this.cliente.alcohol;
    return hasConditions;
  }

  // Método para actualizar condiciones cuando cambien durante el paso 3
  onMedicalConditionChange() {
    this.refreshSelectedConditions();
  }

  // Devuelve todas las opciones médicas (label, valor y detalle opcional)
  getMedicalOptions(): Array<{ key: string; label: string; value: boolean; detail?: string }> {
    const map = [
      { key: 'enfermedadCronica', label: 'Enfermedad crónica', detailKey: 'descripcionEnfermedad' },
      { key: 'diabetes', label: 'Diabetes' },
      { key: 'hipotension', label: 'Hipotensión' },
      { key: 'hipotiroide', label: 'Hipotiroides' },
      { key: 'hipotiroidismo', label: 'Hipotiroidismo' },
      { key: 'medicacionRegular', label: 'Medicación regular', detailKey: 'descripcionMedicacion' },
      { key: 'cirugias', label: 'Cirugías', detailKey: 'descripcionCirugias' },
      { key: 'lesiones', label: 'Lesiones', detailKey: 'descripcionLesiones' },
      { key: 'fuma', label: 'Fumador' },
      { key: 'alcohol', label: 'Consumo de alcohol' }
    ];

    return map.map(m => {
      const value = !!(this.cliente as any)[m.key];
      const detail = m.detailKey ? ((this.cliente as any)[m.detailKey] || '').trim() : undefined;
      return { key: m.key, label: m.label, value, detail };
    });
  }
}