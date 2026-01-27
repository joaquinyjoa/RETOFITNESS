import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
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

  // Asignar rutina al cliente
  async asignarRutina() {
    if (!this.validarFormulario()) return;

    const mensaje = `¿Está seguro de asignar esta rutina a ${this.cliente?.nombre} ${this.cliente?.apellido}?`;
    const confirmado = await this.confirmService.confirm(mensaje, 'Confirmar asignación', 'Asignar');
    if (confirmado) {
      await this.confirmarAsignacion();
    }
  }

  async confirmarAsignacion() {
    // No mostrar spinner ni esperar: proceder directo a asignación

    try {
      if (!this.clienteId || !this.rutinaSeleccionadaId) {
        throw new Error('Datos incompletos');
      }

      // Verificar si la rutina ya existe en el mismo día
      const verificacion = await this.rutinaService.verificarRutinaDuplicada(
        this.clienteId,
        this.rutinaSeleccionadaId,
        this.diaSeleccionado
      );

      if (verificacion.existe) {
        this.toastService.mostrarAdvertencia('Rutina existente en el mismo día');
        this.mostrarSpinner = false;
        this.asignando = false;
        this.cdr.detectChanges();
        return;
      }

      // Verificar si el cliente ya tiene cualquier otra rutina asignada en ese día
      const { data: rutinasCliente } = await this.rutinaService.obtenerRutinasDeCliente(this.clienteId);
      if (rutinasCliente && rutinasCliente.some((rc: any) => rc.dia_semana === this.diaSeleccionado)) {
        this.toastService.mostrarAdvertencia('El cliente ya tiene una rutina asignada en ese día');
        this.mostrarSpinner = false;
        this.asignando = false;
        this.cdr.detectChanges();
        return;
      }

      // Ejecutar la asignación sin esperas artificiales
      const resultado = await this.rutinaService.asignarRutinaAClientes(
        this.rutinaSeleccionadaId!,
        [this.clienteId!],
        this.diaSeleccionado,
        this.notasEntrenador
      );

      if (resultado.success) {
        this.toastService.mostrarExito('Rutina asignada exitosamente');
        // Navegar inmediatamente sin esperas
        this.router.navigate(['/ver-rutina-cliente', this.clienteId]);
      } else {
        const mensajeError = resultado.error?.message || resultado.error?.error_description || 'Error al asignar rutina';
        this.toastService.mostrarError(mensajeError);
      }
    } catch (error: any) {
      console.error('Error al asignar rutina:', error);
      const mensajeError = error?.message || 'Error al asignar la rutina';
      this.toastService.mostrarError(mensajeError);
    } finally {
      // Asegurar detección de cambios; no mostramos spinner aquí
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
