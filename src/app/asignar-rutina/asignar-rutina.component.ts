import { Component, OnInit, inject, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonSearchbar,
  IonSpinner,
  IonBadge,
  IonChip,
  IonDatetime,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { RutinaService, Rutina } from '../services/rutina.service';
import { ClienteService } from '../services/cliente.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-asignar-rutina',
  templateUrl: './asignar-rutina.component.html',
  styleUrls: ['./asignar-rutina.component.scss'],
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
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonSearchbar,
    IonSpinner,
    IonBadge,
    IonChip,
    IonDatetime,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    SpinnerComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AsignarRutinaComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private rutinaService = inject(RutinaService);
  private clienteService = inject(ClienteService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private cdr = inject(ChangeDetectorRef);

  rutina: Rutina | null = null;
  rutinaId: number | null = null;
  clientes: any[] = [];
  clientesFiltrados: any[] = [];
  clientesSeleccionados: Set<number> = new Set();
  
  loading = true;
  guardando = false;
  
  filtroTexto = '';
  diaSemana = 1; // Día por defecto (Lunes)
  fechaInicio = '';
  fechaFin = '';
  notas = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.rutinaId = parseInt(id);
        this.cargarDatos();
      } else {
        console.error('No se recibió ID de rutina');
        this.loading = false;
      }
    });
  }

  async cargarDatos() {
    this.loading = true;
    
    // Timeout de seguridad de 10 segundos
    const timeoutId = setTimeout(() => {
      if (this.loading) {
        console.error('⏱️ TIMEOUT: La carga tardó más de 10 segundos');
        this.loading = false;
        this.mostrarToast('Error: La carga tardó demasiado tiempo', 'danger');
      }
    }, 10000);
    
    try {
      // Cargar rutina
      if (this.rutinaId) {
        const resultado = await this.rutinaService.obtenerRutinaPorId(this.rutinaId);
        
        if (resultado.error) {
          console.error('❌ Error al cargar rutina:', resultado.error);
          clearTimeout(timeoutId);
          this.loading = false;
          await this.mostrarToast('Error al cargar la rutina', 'danger');
          return;
        }
        
        this.rutina = resultado.data;
      }

      // Cargar clientes
      const clientes = await this.clienteService.listarClientesResumido();
      
      this.clientes = clientes || [];
      this.clientesFiltrados = [...this.clientes];
    } catch (error) {
      console.error('❌ Error inesperado al cargar datos:', error);
      await this.mostrarToast('Error al cargar datos', 'danger');
    } finally {
      clearTimeout(timeoutId);
      this.loading = false;
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
    }
  }

  aplicarFiltro() {
    const textoLower = this.filtroTexto.toLowerCase().trim();
    if (!textoLower) {
      this.clientesFiltrados = [...this.clientes];
      return;
    }

    this.clientesFiltrados = this.clientes.filter(cliente => {
      const nombre = `${cliente.nombre || ''} ${cliente.apellido || ''}`.toLowerCase();
      const correo = (cliente.correo || '').toLowerCase();
      return nombre.includes(textoLower) || correo.includes(textoLower);
    });
  }

  toggleCliente(clienteId: number) {
    if (this.clientesSeleccionados.has(clienteId)) {
      this.clientesSeleccionados.delete(clienteId);
    } else {
      this.clientesSeleccionados.add(clienteId);
    }
  }

  seleccionarTodos() {
    if (this.clientesSeleccionados.size === this.clientesFiltrados.length) {
      // Deseleccionar todos
      this.clientesSeleccionados.clear();
    } else {
      // Seleccionar todos los filtrados
      this.clientesFiltrados.forEach(cliente => {
        this.clientesSeleccionados.add(cliente.id);
      });
    }
  }

  isClienteSeleccionado(clienteId: number): boolean {
    return this.clientesSeleccionados.has(clienteId);
  }

  get todosSeleccionados(): boolean {
    return this.clientesFiltrados.length > 0 && 
           this.clientesFiltrados.every(cliente => this.clientesSeleccionados.has(cliente.id));
  }

  get algunosSeleccionados(): boolean {
    return this.clientesSeleccionados.size > 0 && !this.todosSeleccionados;
  }

  async asignarRutina() {
    console.log('🚀 Botón Asignar Rutina presionado');
    
    if (this.clientesSeleccionados.size === 0) {
      await this.mostrarToast('Debes seleccionar al menos un cliente', 'warning');
      return;
    }

    if (!this.rutinaId) {
      await this.mostrarToast('Error: No se encontró la rutina', 'danger');
      return;
    }

    console.log('💬 Mostrando alert de confirmación');
    const alert = await this.alertController.create({
      header: 'Confirmar asignación',
      message: `¿Deseas asignar esta rutina a ${this.clientesSeleccionados.size} cliente(s)?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('❌ Usuario canceló la asignación');
          }
        },
        {
          text: 'Asignar',
          role: 'confirm',
          handler: () => {
            console.log('✅ Usuario confirmó');
            return true; // Cierra el alert
          }
        }
      ]
    });

    await alert.present();
    
    // Esperar a que se cierre el alert y verificar el resultado
    const { role } = await alert.onDidDismiss();
    console.log('🚪 Alert cerrado con role:', role);
    
    if (role === 'confirm') {
      console.log('🎬 Llamando a confirmarAsignacion()');
      this.confirmarAsignacion();
    }
  }

  async confirmarAsignacion() {
    console.log('🎬 Iniciando asignación de rutina');
    this.guardando = true;
    
    // Esperar 3 segundos para simular carga
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const clienteIds = Array.from(this.clientesSeleccionados);
      
      // Validar si la rutina ya está asignada en el mismo día para algún cliente
      const { existe, cliente } = await this.rutinaService.verificarRutinaAsignadaMismoDia(
        this.rutinaId!,
        clienteIds,
        this.diaSemana
      );

      if (existe) {
        console.log('⚠️ Validación fallida - rutina ya asignada');
        this.guardando = false;
        await this.mostrarToast(
          `Esta rutina ya está asignada a "${cliente}" el mismo día. Elige otro día.`,
          'warning'
        );
        return;
      }

      const { success, error } = await this.rutinaService.asignarRutinaAClientes(
        this.rutinaId!,
        clienteIds,
        this.diaSemana,
        this.fechaInicio || undefined,
        this.fechaFin || undefined,
        this.notas || undefined
      );

      console.log('✅ Asignación completada');

      if (success) {
        await this.mostrarToast(
          `Rutina asignada exitosamente a ${clienteIds.length} cliente(s)`,
          'success'
        );
        this.router.navigate(['/ver-ejercicios'], { replaceUrl: true });
      } else {
        console.error('Error al asignar rutina:', error);
        await this.mostrarToast('Error al asignar la rutina', 'danger');
      }
    } catch (error) {
      console.log('❌ Error en asignación');
      console.error('Error al asignar rutina:', error);
      await this.mostrarToast('Error inesperado al asignar la rutina', 'danger');
    } finally {
      this.guardando = false;
    }
  }

  goBack() {
    this.router.navigate(['/ver-ejercicios'], { replaceUrl: true });
  }

  private async mostrarToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  trackByClienteId(index: number, cliente: any): number {
    return cliente.id;
  }
}
