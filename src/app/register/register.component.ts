import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Cliente } from '../models/cliente/cliente-module';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class RegisterComponent implements OnInit {

  // Datos del formulario
  cliente: Cliente = {
    // id se generará automáticamente en la base de datos
    nombre: '',
    apellido: '',
    edad: 18,
    correo: '@cliente.com',
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
    genero: 'M',
    qr: '' // Se generará después del registro con el id
  };

  // Objetivos múltiples separados
  objetivos = {
    bajarPeso: false,
    aumentarMasa: false,
    mejorarFuerza: false,
    mejorarResistencia: false,
    mejorarSalud: false
  };

  // Estado del formulario
  currentStep: number = 1;
  totalSteps: number = 4;
  isSubmitting: boolean = false;
  showSuccess: boolean = false;
  
  // Variables para animaciones
  animationClass: string = '';
  isAnimating: boolean = false;

  constructor(private router: Router) { 
    // Asegurar que el objeto cliente esté completamente inicializado
    console.log('Cliente inicializado:', this.cliente);
  }

  ngOnInit() {
    // Debug para verificar el estado inicial
    console.log('ngOnInit - Cliente:', this.cliente);
  }

  // Método para debug del two-way binding
  onInputChange(field: string, event: any) {
    const value = event.target?.value || '';
    console.log(`Campo ${field} cambió a:`, value);
    console.log('Cliente actual:', this.cliente);
  }

  // Métodos debug para eventos
  onInputFocus(field: string) {
    console.log(`Focus en ${field}`);
  }

  onInputBlur(field: string) {
    console.log(`Blur en ${field}`);
  }

  // Actualizar objetivos múltiples
  updateObjetivos() {
    const objetivosSeleccionados = [];
    if (this.objetivos.bajarPeso) objetivosSeleccionados.push('Bajar de peso');
    if (this.objetivos.aumentarMasa) objetivosSeleccionados.push('Aumentar masa muscular');
    if (this.objetivos.mejorarFuerza) objetivosSeleccionados.push('Mejorar fuerza');
    if (this.objetivos.mejorarResistencia) objetivosSeleccionados.push('Mejorar resistencia');
    if (this.objetivos.mejorarSalud) objetivosSeleccionados.push('Mejorar salud general');
    
    this.cliente.objetivo = objetivosSeleccionados.join(', ');
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

  async onSubmit() {
    this.isSubmitting = true;
    
    try {
      // Aquí se implementará la lógica de registro con QR
      console.log('Datos del cliente:', this.cliente);
      
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.showSuccess = true;
      console.log('Cliente registrado exitosamente');
    } catch (error) {
      console.error('Error registrando cliente:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  // Validaciones por paso
  isStep1Valid(): boolean {
    return this.cliente.nombre.trim() !== '' && 
           this.cliente.apellido.trim() !== '' && 
           this.cliente.correo.includes('@cliente.com') &&
           this.cliente.correo.length > '@cliente.com'.length &&
           this.cliente.password.trim() !== '' &&
           this.cliente.password.length >= 6 &&
           this.cliente.edad >= 13;
  }

  isStep2Valid(): boolean {
    return this.cliente.peso > 0 && 
           this.cliente.altura > 0 && 
           this.cliente.objetivo.trim() !== '' &&
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