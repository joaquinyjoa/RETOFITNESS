import { Component, OnInit, inject, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, NgZone } from '@angular/core';
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
  IonTextarea,
  IonSelect,
  IonSelectOption,
  AlertController,
  ToastController,
  LoadingController,
  ModalController,
  NavController
} from '@ionic/angular/standalone';
import { RutinaService, Rutina } from '../services/rutina.service';
import { ClienteService } from '../services/cliente.service';
import { SpinnerComponent } from '../spinner/spinner.component';
import { ConfirmService } from '../services/confirm.service';

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
  private confirmService = inject(ConfirmService);
  private modalController = inject(ModalController);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private navCtrl = inject(NavController);

  rutina: Rutina | null = null;
  rutinaId: number | null = null;
  clientes: any[] = [];
  clientesFiltrados: any[] = [];
  clientesSeleccionados: Set<number> = new Set();
  
  loading = true;
  guardando = false;
  
  filtroTexto = '';
  diaSemana = 1; // Día por defecto (Lunes)
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
      // Cargar rutina y clientes en PARALELO
      const [resultadoRutina, clientes] = await Promise.all([
        this.rutinaId ? this.rutinaService.obtenerRutinaPorId(this.rutinaId) : Promise.resolve({ data: null, error: null }),
        this.clienteService.listarClientesResumido()
      ]);
      
      // Procesar rutina
      if (this.rutinaId && resultadoRutina.error) {
        console.error('❌ Error al cargar rutina:', resultadoRutina.error);
        clearTimeout(timeoutId);
        this.loading = false;
        await this.mostrarToast('Error al cargar la rutina', 'danger');
        return;
      }
      
      this.rutina = resultadoRutina.data;

      // Procesar clientes
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
    if (this.clientesSeleccionados.size === 0) {
      await this.mostrarToast('Debes seleccionar al menos un cliente', 'warning');
      return;
    }

    if (!this.rutinaId) {
      await this.mostrarToast('Error: No se encontró la rutina', 'danger');
      return;
    }

    // Mostrar confirmación con diseño neon (igual que "Cerrar sesión")
    const confirmado = await this.confirmService.confirm(
      `¿Deseas asignar esta rutina a ${this.clientesSeleccionados.size} cliente(s)?`,
      'Confirmar asignación',
      'Asignar'
    );

    if (!confirmado) return;

    this.confirmarAsignacion();
  }

  async confirmarAsignacion() {
    
    try {
      // Mostrar spinner
      this.guardando = true;
      this.cdr.detectChanges();

      // Dar tiempo al spinner para mostrarse
      await new Promise(resolve => setTimeout(resolve, 50));

      const clienteIds = Array.from(this.clientesSeleccionados);
      
      // Verificar si algún cliente ya tiene UNA rutina en ese día
      for (const clienteId of clienteIds) {
        const { data: rutinasCliente } = await this.rutinaService.obtenerRutinasDeCliente(clienteId);
        if (rutinasCliente && rutinasCliente.some((rc: any) => rc.dia_semana === this.diaSemana)) {
          // Buscar el nombre del cliente
          const cliente = this.clientes.find(c => c.id === clienteId);
          const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'este cliente';
          this.guardando = false;
          this.cdr.detectChanges();
          await this.mostrarToast(
            `${nombreCliente} ya tiene una rutina asignada ese día. No se puede asignar otra.`,
            'warning'
          );
          return;
        }
      }
      
      // Verificar si la rutina específica ya está asignada en el mismo día para algún cliente
      const { existe, cliente } = await this.rutinaService.verificarRutinaAsignadaMismoDia(
        this.rutinaId!,
        clienteIds,
        this.diaSemana
      );

      if (existe) {
        this.guardando = false;
        this.cdr.detectChanges();
        await this.mostrarToast(
          `${cliente} ya tiene esta rutina asignada ese día.`,
          'warning'
        );
        return;
      }

      const { success, error } = await this.rutinaService.asignarRutinaAClientes(
        this.rutinaId!,
        clienteIds,
        this.diaSemana,
        this.notas || undefined
      );

      if (success) {
        // Mantener spinner visible por un momento
        await new Promise(resolve => setTimeout(resolve, 800));

        // Forzar ejecución en NgZone
        await this.ngZone.run(async () => {
          // Ocultar spinner
          this.guardando = false;
          this.cdr.detectChanges();

          // Pequeña pausa
          await new Promise(resolve => setTimeout(resolve, 50));

          // Mostrar toast
          await this.mostrarToast(
            `Rutina asignada exitosamente a ${clienteIds.length} cliente(s)`,
            'success'
          );

          // Esperar un momento adicional antes de navegar
          await new Promise(resolve => setTimeout(resolve, 200));

          // Limpiar overlays
          await this.dismissAllOverlays();

          // Navegar de vuelta sin animación para evitar superposición
          await this.navCtrl.navigateBack('/ver-ejercicios', {
            animated: false
          });
          
          // Forzar actualización
          this.cdr.markForCheck();
        });
      } else {
        console.error('Error al asignar rutina:', error);
        this.guardando = false;
        this.cdr.detectChanges();
        await this.mostrarToast('Error al asignar la rutina', 'danger');
      }
    } catch (error) {
      console.error('Error al asignar rutina:', error);
      this.guardando = false;
      this.cdr.detectChanges();
      await this.mostrarToast('Error inesperado al asignar la rutina', 'danger');
    } finally {
      // Asegurar que el spinner esté oculto al final
      if (this.guardando) {
        this.guardando = false;
        this.cdr.detectChanges();
      }
    }
  }

  async goBack() {
    // Limpiar overlays antes de volver
    await this.dismissAllOverlays();
    
    // Navegar sin animación para evitar superposición de componentes
    await this.navCtrl.navigateBack('/ver-ejercicios', {
      animated: false
    });
  }

  // Intentar descartar modales/alerts/loaders abiertos y ocultar overlays residuales
  private async dismissAllOverlays() {
    try {
      const modal = await this.modalController.getTop();
      if (modal) await modal.dismiss();
    } catch (e) {
      console.debug('No modal to dismiss', e);
    }

    try {
      const alert = await this.alertController.getTop();
      if (alert) await alert.dismiss();
    } catch (e) {
      console.debug('No alert to dismiss', e);
    }

    try {
      const loading = await this.loadingController.getTop();
      if (loading) await loading.dismiss();
    } catch (e) {
      console.debug('No loading to dismiss', e);
    }

    // Forzar ocultación de overlays residuales en el DOM (fallback)
    try {
      document.querySelectorAll('.spinner-overlay-transparent').forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
      document.querySelectorAll('.confirm-modal-backdrop').forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    } catch (e) {
      console.debug('Error hiding residual overlays', e);
    }
  }

  private async mostrarToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'top',
      color
    });
    await toast.present();
  }

  trackByClienteId(index: number, cliente: any): number {
    return cliente.id;
  }
}
