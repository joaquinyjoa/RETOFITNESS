import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { RutinaService, Rutina } from '../services/rutina.service';
import { ClienteService } from '../services/cliente.service';

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
    IonTextarea
  ]
})
export class AsignarRutinaComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private rutinaService = inject(RutinaService);
  private clienteService = inject(ClienteService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  rutina: Rutina | null = null;
  rutinaId: number | null = null;
  clientes: any[] = [];
  clientesFiltrados: any[] = [];
  clientesSeleccionados: Set<number> = new Set();
  
  loading = true;
  guardando = false;
  
  filtroTexto = '';
  fechaInicio = '';
  fechaFin = '';
  notas = '';

  ngOnInit() {
    console.log('ngOnInit - Iniciando componente asignar-rutina');
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('Parámetro id recibido:', id);
      if (id) {
        this.rutinaId = parseInt(id);
        console.log('rutinaId parseado:', this.rutinaId);
        this.cargarDatos();
      } else {
        console.error('No se recibió ID de rutina');
        this.loading = false;
      }
    });
  }

  async cargarDatos() {
    this.loading = true;
    console.log('🔄 Iniciando carga de datos...');
    console.log('📋 Rutina ID:', this.rutinaId);
    
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
        console.log('📥 Solicitando rutina...');
        const resultado = await this.rutinaService.obtenerRutinaPorId(this.rutinaId);
        console.log('✅ Respuesta rutina:', resultado);
        
        if (resultado.error) {
          console.error('❌ Error al cargar rutina:', resultado.error);
          clearTimeout(timeoutId);
          this.loading = false;
          await this.mostrarToast('Error al cargar la rutina', 'danger');
          return;
        }
        
        this.rutina = resultado.data;
        console.log('✅ Rutina asignada:', this.rutina);
      }

      // Cargar clientes
      console.log('📥 Solicitando clientes...');
      const clientes = await this.clienteService.listarClientesResumido();
      console.log('✅ Respuesta clientes:', clientes);
      
      this.clientes = clientes || [];
      this.clientesFiltrados = [...this.clientes];
      
      console.log('✅ Total clientes cargados:', this.clientes.length);
      console.log('🎉 Carga completada exitosamente');
    } catch (error) {
      console.error('❌ Error inesperado al cargar datos:', error);
      await this.mostrarToast('Error al cargar datos', 'danger');
    } finally {
      clearTimeout(timeoutId);
      this.loading = false;
      console.log('🏁 Estado loading:', this.loading);
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
      console.log('🔄 Detección de cambios forzada');
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
    if (this.clientesSeleccionados.size === 0) {
      await this.mostrarToast('Debes seleccionar al menos un cliente', 'warning');
      return;
    }

    if (!this.rutinaId) {
      await this.mostrarToast('Error: No se encontró la rutina', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar asignación',
      message: `¿Deseas asignar esta rutina a ${this.clientesSeleccionados.size} cliente(s)?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Asignar',
          handler: () => {
            this.confirmarAsignacion();
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmarAsignacion() {
    this.guardando = true;
    try {
      const clienteIds = Array.from(this.clientesSeleccionados);
      const { success, error } = await this.rutinaService.asignarRutinaAClientes(
        this.rutinaId!,
        clienteIds,
        this.fechaInicio || undefined,
        this.fechaFin || undefined,
        this.notas || undefined
      );

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
