import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { ConfirmService } from '../services/confirm.service';
import { RutinaService, Rutina } from '../services/rutina.service';
import { ClienteService } from '../services/cliente.service';
import { ToastService } from '../services/toast.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-asignar-rutina-cliente-seleccionado',
  templateUrl: './asignar-rutina-cliente-seleccionado.component.html',
  styleUrls: ['./asignar-rutina-cliente-seleccionado.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SpinnerComponent]
})
export class AsignarRutinaClienteSeleccionadoComponent implements OnInit {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private rutinaService = inject(RutinaService);
  private clienteService = inject(ClienteService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  private cdr = inject(ChangeDetectorRef);
  private toastController = inject(ToastController);

  clienteId: number | null = null;
  cliente: any = null;
  rutinasDisponibles: Rutina[] = [];
  rutinasFiltradas: Rutina[] = [];
  loading = true;
  asignando = false;
  mostrarSpinner = false;

  // Datos del formulario de asignación
  rutinaSeleccionadaId: number | null = null;
  diaSeleccionado: number = 1;
  notasEntrenador: string = '';

  // Filtro de búsqueda
  filtroBusqueda: string = '';

  // Días de la semana
  diasSemana = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' }
  ];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.clienteId = parseInt(id);
        this.cargarDatos();
      }
    });
  }

  async cargarDatos() {
    this.loading = true;
    try {
      // Cargar datos del cliente
      if (this.clienteId) {
        this.cliente = await this.clienteService.obtenerClientePorId(this.clienteId);
        console.log('Cliente cargado:', this.cliente);
      }

      // Cargar todas las rutinas disponibles
      const { data, error } = await this.rutinaService.obtenerRutinas();
      if (error) {
        console.error('Error al cargar rutinas:', error);
        this.toastService.mostrarError('Error al cargar las rutinas');
      } else {
        this.rutinasDisponibles = data || [];
        this.rutinasFiltradas = [...this.rutinasDisponibles];
        console.log('Rutinas cargadas:', this.rutinasDisponibles.length);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.toastService.mostrarError('Error al cargar los datos');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // Filtrar rutinas por búsqueda
  filtrarRutinas() {
    if (!this.filtroBusqueda.trim()) {
      this.rutinasFiltradas = [...this.rutinasDisponibles];
    } else {
      const busqueda = this.filtroBusqueda.toLowerCase().trim();
      this.rutinasFiltradas = this.rutinasDisponibles.filter(rutina =>
        rutina.nombre?.toLowerCase().includes(busqueda) ||
        rutina.descripcion?.toLowerCase().includes(busqueda) ||
        rutina.nivel_dificultad?.toLowerCase().includes(busqueda)
      );
    }
    this.cdr.detectChanges();
  }

  // Seleccionar rutina
  seleccionarRutina(rutinaId: number) {
    this.rutinaSeleccionadaId = rutinaId;
  }

  // Validar formulario
  validarFormulario(): boolean {
    if (!this.rutinaSeleccionadaId) {
      this.toastService.mostrarAdvertencia('Debe seleccionar una rutina');
      return false;
    }
    if (!this.diaSeleccionado) {
      this.toastService.mostrarAdvertencia('Debe seleccionar un día de la semana');
      return false;
    }
    return true;
  }

  // Asignar rutina al cliente (sin cuadro de diálogo de confirmación)
  async asignarRutina() {
    if (!this.validarFormulario()) return;

    // Mostrar diálogo de confirmación con el mismo diseño que cerrar sesión
    const cantidad = 1; // aquí es un solo cliente en esta pantalla
    const confirmado = await this.confirmService.confirm(
      `¿Deseas asignar esta rutina a ${cantidad} cliente(s)?`,
      'Confirmar asignación',
      'Asignar'
    );

    if (!confirmado) return;
    
    this.mostrarSpinner = true;
    this.cdr.detectChanges();
    
    // Pequeño delay para asegurar que el DOM se actualice
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      if (!this.clienteId || !this.rutinaSeleccionadaId) {
        throw new Error('Datos incompletos');
      }

      // Verificar si el cliente ya tiene cualquier rutina asignada en ese día
      const { data: rutinasCliente } = await this.rutinaService.obtenerRutinasDeCliente(this.clienteId);
      console.log('Rutinas del cliente:', rutinasCliente);
      console.log('Día seleccionado:', this.diaSeleccionado);
      
      if (rutinasCliente && rutinasCliente.length > 0) {
        const tieneRutinaMismoDia = rutinasCliente.some((rc: any) => {
          console.log('Comparando rutina dia_semana:', rc.dia_semana, 'con día seleccionado:', this.diaSeleccionado);
          return rc.dia_semana === this.diaSeleccionado;
        });
        
        if (tieneRutinaMismoDia) {
          console.log('¡VALIDACIÓN ACTIVADA! Cliente ya tiene rutina ese día');
          this.mostrarSpinner = false;
          this.cdr.detectChanges();
          
          // Delay para asegurar que el spinner se oculte
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Crear y mostrar toast manualmente para mejor control en móvil
          const toast = await this.toastController.create({
            message: 'El cliente ya tiene una rutina asignada ese día. No se puede asignar otra.',
            duration: 4000,
            position: 'top',
            color: 'warning',
            icon: 'warning-outline',
            cssClass: 'toast-warning'
          });
          
          await toast.present();
          return;
        }
      }
      
      // Verificar si esta rutina específica ya está asignada en el mismo día
      const verificacion = await this.rutinaService.verificarRutinaDuplicada(
        this.clienteId,
        this.rutinaSeleccionadaId,
        this.diaSeleccionado
      );

      if (verificacion.existe) {
        this.mostrarSpinner = false;
        this.cdr.detectChanges();
        this.toastService.mostrarAdvertencia('Esta rutina ya está asignada a este cliente ese día.');
        return;
      }

      // Ejecutar la asignación directamente
        // Ejecutar la asignación y asegurar un mínimo de 1.5s mostrando el spinner
        const [resultado] = await Promise.all([
          this.rutinaService.asignarRutinaAClientes(
            this.rutinaSeleccionadaId!,
            [this.clienteId!],
            this.diaSeleccionado,
            this.notasEntrenador
          ),
          new Promise(resolve => setTimeout(resolve, 1500))
        ]);

      if (resultado.success) {
        this.toastService.mostrarExito('Rutina asignada exitosamente');
        this.mostrarSpinner = false;
        this.cdr.detectChanges();
        this.router.navigate(['/ver-rutina-cliente', this.clienteId]);
      } else {
        this.mostrarSpinner = false;
        this.cdr.detectChanges();
        const mensajeError = resultado.error?.message || resultado.error?.error_description || 'Error al asignar rutina';
        this.toastService.mostrarError(mensajeError);
      }
    } catch (error: any) {
      console.error('Error al asignar rutina:', error);
      const mensajeError = error?.message || 'Error al asignar la rutina';
      this.mostrarSpinner = false;
      this.cdr.detectChanges();
      this.toastService.mostrarError(mensajeError);
    }
    finally {
      // Asegurar que el spinner se oculta si quedó visible
      this.mostrarSpinner = false;
      this.cdr.detectChanges();
    }
  }

  // Volver atrás
  volver() {
    this.router.navigate(['/ver-rutina-cliente', this.clienteId]);
  }

  // Obtener el nombre del día
  getNombreDia(dia: number): string {
    const diaEncontrado = this.diasSemana.find(d => d.value === dia);
    return diaEncontrado ? diaEncontrado.label : '';
  }
}
