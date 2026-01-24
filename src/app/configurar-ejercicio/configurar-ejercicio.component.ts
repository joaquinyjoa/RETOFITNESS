import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonSearchbar,
  IonInput,
  IonChip,
  IonLabel,
  AlertController
} from '@ionic/angular/standalone';
import { EjercicioService } from '../services/ejercicio.service';
import { RutinaService } from '../services/rutina.service';
import { ToastService } from '../services/toast.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-configurar-ejercicio',
  templateUrl: './configurar-ejercicio.component.html',
  styleUrls: ['./configurar-ejercicio.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    IonSearchbar,
    IonInput,
    IonChip,
    IonLabel,
    SpinnerComponent
  ]
})
export class ConfigurarEjercicioComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ejercicioService = inject(EjercicioService);
  private rutinaService = inject(RutinaService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private alertController = inject(AlertController);

  // Parámetros de ruta
  ejercicioPersonalizadoId: number | null = null;
  clienteId: number | null = null;

  // Estados
  loading = true;
  guardando = false;
  
  // Selección de ejercicio
  ejercicioSeleccionado: any = null;
  ejerciciosDisponibles: any[] = [];
  ejerciciosDisponiblesFiltrados: any[] = [];
  filtroEjercicio = '';
  mostrandoLista = false;

  // Datos actuales del ejercicio personalizado
  ejercicioActual: any = null;
  rutinaClienteId: number | null = null;
  ejerciciosEnRutina: any[] = [];

  // Configuración
  series: number = 3;
  repeticiones: number = 12;
  descansoSegundos: number = 60;
  porcentajeFuerza: number = 100;
  mostrarSpinner = false;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const clienteIdParam = params.get('clienteId');
      
      if (id) {
        this.ejercicioPersonalizadoId = parseInt(id);
      }
      
      if (clienteIdParam) {
        this.clienteId = parseInt(clienteIdParam);
      }

      this.cargarDatos();
    });
  }

  async cargarDatos() {
    this.loading = true;
    
    try {
      // Cargar todos los ejercicios disponibles
      this.ejerciciosDisponibles = await this.ejercicioService.listarEjercicios();
      this.ejerciciosDisponiblesFiltrados = [...this.ejerciciosDisponibles];

      // Si es edición, cargar datos del ejercicio personalizado actual
      if (this.ejercicioPersonalizadoId) {
        const { data, error } = await this.rutinaService.obtenerEjercicioPersonalizado(this.ejercicioPersonalizadoId);
        
        if (data && !error) {
          this.ejercicioActual = data;
          this.ejercicioSeleccionado = data.ejercicio;
          this.series = data.series || 3;
          this.repeticiones = data.repeticiones || 12;
          this.descansoSegundos = data.descanso_segundos || 60;
          this.porcentajeFuerza = data.porcentaje_fuerza || 100;
          this.rutinaClienteId = data.rutina_cliente_id;
          
          // Cargar todos los ejercicios de esta rutina para validar duplicados
          if (this.rutinaClienteId) {
            const ejerciciosRutina = await this.rutinaService.obtenerEjerciciosDeRutinaCliente(this.rutinaClienteId);
            if (ejerciciosRutina.data) {
              this.ejerciciosEnRutina = ejerciciosRutina.data;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.toastService.mostrarError('Error al cargar ejercicios');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  toggleListaEjercicios() {
    this.mostrandoLista = !this.mostrandoLista;
    if (this.mostrandoLista) {
      this.filtroEjercicio = '';
      this.ejerciciosDisponiblesFiltrados = [...this.ejerciciosDisponibles];
    }
  }

  filtrarEjercicios() {
    const filtro = this.filtroEjercicio.toLowerCase().trim();
    
    if (!filtro) {
      this.ejerciciosDisponiblesFiltrados = [...this.ejerciciosDisponibles];
    } else {
      this.ejerciciosDisponiblesFiltrados = this.ejerciciosDisponibles.filter(ej => 
        ej.nombre?.toLowerCase().includes(filtro) ||
        ej.musculo_principal?.toLowerCase().includes(filtro) ||
        ej.categoria?.toLowerCase().includes(filtro)
      );
    }
  }

  seleccionarEjercicio(ejercicio: any) {
    this.ejercicioSeleccionado = ejercicio;
    this.mostrandoLista = false;
    this.filtroEjercicio = '';
    this.cdr.detectChanges();
  }

  async guardarCambios() {
    // Validar
    if (!this.ejercicioSeleccionado) {
      this.toastService.mostrarError('Selecciona un ejercicio');
      return;
    }

    // Validar que el ejercicio no esté duplicado en la rutina
    const ejercicioDuplicado = this.ejerciciosEnRutina.find(
      ej => ej.ejercicio_id === this.ejercicioSeleccionado.id && ej.id !== this.ejercicioPersonalizadoId
    );
    
    if (ejercicioDuplicado) {
      this.toastService.mostrarError('Este ejercicio ya está en la rutina');
      return;
    }

    if (!this.series || this.series < 1) {
      this.toastService.mostrarError('Las series deben ser al menos 1');
      return;
    }

    if (!this.repeticiones || this.repeticiones < 1) {
      this.toastService.mostrarError('Las repeticiones deben ser al menos 1');
      return;
    }

    if (!this.descansoSegundos || this.descansoSegundos < 0) {
      this.toastService.mostrarError('El descanso debe ser 0 o mayor');
      return;
    }
    
    if (this.porcentajeFuerza < 0 || this.porcentajeFuerza > 200) {
      this.toastService.mostrarError('El porcentaje de fuerza debe estar entre 0 y 200');
      return;
    }

    this.mostrarSpinner = true;
    this.cdr.detectChanges();

    try {
      // Ejecutar la operación y el delay en paralelo
      const [resultado] = await Promise.all([
        this.rutinaService.cambiarEjercicioPersonalizado(
          this.ejercicioPersonalizadoId!,
          this.ejercicioSeleccionado.id,
          this.series,
          this.repeticiones,
          this.descansoSegundos,
          this.porcentajeFuerza
        ),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);

      const { success, error } = resultado as any;

      if (success) {
        this.toastService.mostrarExito('Ejercicio actualizado correctamente');
        this.goBack();
      } else {
        this.toastService.mostrarError(error || 'Error al actualizar ejercicio');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      this.toastService.mostrarError('Error inesperado al guardar');
    } finally {
      this.mostrarSpinner = false;
      this.cdr.detectChanges();
    }
  }

  goBack() {
    if (this.clienteId) {
      this.router.navigate(['/ver-rutina-cliente', this.clienteId]);
    } else {
      this.router.navigate(['/ver-clientes']);
    }
  }
}
