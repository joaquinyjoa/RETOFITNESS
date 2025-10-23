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
  cliente: any = {
    nombre: '',
    apellido: '',
    edad: 18,
    correo: '',
    contraseña: '',
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
    horasSueño: '',
    peso: 0,
    objetivo: '',
    altura: 0,
    nivelActividad: 'Medio',
    genero: 'M'
  };

  // Estado del formulario
  currentStep: number = 1;
  totalSteps: number = 4;
  isSubmitting: boolean = false;
  showSuccess: boolean = false;

  constructor(private router: Router) { }

  ngOnInit() {}

  goBack() {
    if (this.currentStep > 1) {
      this.currentStep--;
    } else {
      this.router.navigate(['/welcome']);
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
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
           this.cliente.correo.trim() !== '' && 
           this.cliente.contraseña.trim() !== '' &&
           this.cliente.edad >= 13;
  }

  isStep2Valid(): boolean {
    return this.cliente.peso > 0 && 
           this.cliente.altura > 0 && 
           this.cliente.objetivo.trim() !== '' &&
           this.cliente['horasSueño'].trim() !== '';
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