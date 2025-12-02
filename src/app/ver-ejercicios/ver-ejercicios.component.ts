import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EjercicioService } from '../services/ejercicio.service';
import { ToastService } from '../services/toast.service';
import { RutinaService, Rutina, RutinaEjercicio, RutinaConDetalles } from '../services/rutina.service';
import { ClienteService } from '../services/cliente.service';
import { Ejercicio, EjercicioFormData } from '../models/ejercicio/ejercicio.interface';

@Component({
  selector: 'app-ver-ejercicios',
  templateUrl: './ver-ejercicios.component.html',
  styleUrls: ['./ver-ejercicios.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class VerEjerciciosComponent implements OnInit {

  // Control de tabs
  segmentValue = 'ejercicios';

  // === EJERCICIOS ===
  ejercicios: Ejercicio[] = [];
  ejerciciosFiltrados: Ejercicio[] = [];
  loading = false;
  
  // Validación de URL
  urlValida = false;
  
  // Modal para agregar/editar ejercicio
  showModal = false;
  editMode = false;
  ejercicioActual: EjercicioFormData = this.getEmptyForm();

  // Filtros
  filtroTexto = '';
  filtroCategoria = '';
  filtroMusculo = '';

  // === RUTINAS ===
  rutinas: RutinaConDetalles[] = [];
  rutinasFiltradas: RutinaConDetalles[] = [];
  loadingRutinas = false;

  // Modal para agregar/editar rutina
  showModalRutina = false;
  editModeRutina = false;
  rutinaActual: any = this.getEmptyRutinaForm();
  ejerciciosDisponibles: Ejercicio[] = [];
  ejerciciosSeleccionados: any[] = [];

  // Modal para asignar rutina a clientes
  showModalAsignar = false;
  rutinaParaAsignar: Rutina | null = null;
  clientesDisponibles: any[] = [];
  clientesSeleccionados: number[] = [];
  fechaInicioAsignacion: string = '';
  fechaFinAsignacion: string = '';
  notasAsignacion: string = '';

  // Filtros de rutinas
  filtroTextoRutina = '';
  filtroNivelRutina = '';

  // Opciones para los select
  categorias = [
    { value: 'cardio', label: 'Cardio' },
    { value: 'fuerza', label: 'Fuerza' },
    { value: 'flexibilidad', label: 'Flexibilidad' },
    { value: 'funcional', label: 'Funcional' },
    { value: 'general', label: 'General' }
  ];

  nivesDificultad = [
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' }
  ];

  gruposMusculares = [
    'Pecho', 'Espalda', 'Hombros', 'Brazos', 'Piernas', 'Glúteos', 
    'Core', 'Abdomen', 'Cardio', 'Cuerpo completo'
  ];

  constructor(
    private ejercicioService: EjercicioService,
    private toastService: ToastService,
    private rutinaService: RutinaService,
    private clienteService: ClienteService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.cargarEjercicios();
  }

  async cargarEjercicios() {
    this.loading = true;
    try {
      const ejerciciosCargados = await this.ejercicioService.listarEjercicios();
      // Convertir duración de minutos a segundos para mostrar en la interfaz
      this.ejercicios = ejerciciosCargados.map(ejercicio => ({
        ...ejercicio,
        duracion_minutos: ejercicio.duracion_minutos ? ejercicio.duracion_minutos * 60 : undefined // Convertir minutos a segundos
      }));
      this.aplicarFiltros();
      console.log('Ejercicios cargados:', this.ejercicios);
    } catch (error) {
      console.error('Error al cargar ejercicios:', error);
      await this.toastService.mostrarError('Error al cargar ejercicios');
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltros() {
    this.ejerciciosFiltrados = this.ejercicios.filter(ejercicio => {
      const coincideTexto = !this.filtroTexto || 
        ejercicio.nombre.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        ejercicio.descripcion?.toLowerCase().includes(this.filtroTexto.toLowerCase());
      
      const coincideCategoria = !this.filtroCategoria || ejercicio.categoria === this.filtroCategoria;
      const coincideMusculo = !this.filtroMusculo || ejercicio.musculo_principal === this.filtroMusculo;

      return coincideTexto && coincideCategoria && coincideMusculo;
    });
  }

  limpiarFiltros() {
    this.filtroTexto = '';
    this.filtroCategoria = '';
    this.filtroMusculo = '';
    this.aplicarFiltros();
  }

  abrirModal(ejercicio?: Ejercicio) {
    this.editMode = !!ejercicio;
    if (ejercicio) {
      this.ejercicioActual = {
        nombre: ejercicio.nombre,
        descripcion: ejercicio.descripcion || '',
        categoria: ejercicio.categoria,
        musculo_principal: ejercicio.musculo_principal,
        musculos_secundarios: ejercicio.musculos_secundarios || [],
        nivel_dificultad: ejercicio.nivel_dificultad,
        enlace_video: ejercicio.enlace_video,
        duracion_minutos: ejercicio.duracion_minutos || null,
        equipamiento: ejercicio.equipamiento || [],
        instrucciones: ejercicio.instrucciones || '',
        consejos: ejercicio.consejos || ''
      };
    } else {
      this.ejercicioActual = this.getEmptyForm();
    }
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
    this.ejercicioActual = this.getEmptyForm();
  }

  async guardarEjercicio() {
    try {
      // Validaciones básicas
      if (!this.ejercicioActual.nombre.trim()) {
        await this.toastService.mostrarError('El nombre del ejercicio es obligatorio');
        return;
      }

      if (!this.ejercicioActual.enlace_video.trim()) {
        await this.toastService.mostrarError('La URL del video es obligatoria');
        return;
      }

      if (!this.urlValida) {
        await this.toastService.mostrarError('La URL de Google Drive no es válida');
        return;
      }

      this.loading = true;

      const ejercicioData: Ejercicio = {
        ...this.ejercicioActual,
        categoria: this.ejercicioActual.categoria as 'cardio' | 'fuerza' | 'flexibilidad' | 'funcional' | 'general',
        nivel_dificultad: this.ejercicioActual.nivel_dificultad as 'principiante' | 'intermedio' | 'avanzado',
        duracion_minutos: this.ejercicioActual.duracion_minutos ? this.ejercicioActual.duracion_minutos / 60 : undefined, // Convertir segundos a minutos
        musculos_secundarios: this.ejercicioActual.musculos_secundarios.filter(m => m.trim()),
        equipamiento: this.ejercicioActual.equipamiento.filter(e => e.trim())
      };

      const result = await this.ejercicioService.crearEjercicio(ejercicioData);

      if (result.success) {
        await this.toastService.mostrarExito('Ejercicio guardado correctamente');
        this.cerrarModal();
        await this.cargarEjercicios();
      } else {
        await this.toastService.mostrarError(result.error || 'Error al guardar ejercicio');
      }
    } catch (error: any) {
      console.error('Error al guardar ejercicio:', error);
      await this.toastService.mostrarError('Error inesperado al guardar');
    } finally {
      this.loading = false;
    }
  }

  // Validar URL de Google Drive
  validarUrlDrive() {
    const url = this.ejercicioActual.enlace_video.trim();
    
    if (!url) {
      this.urlValida = false;
      return;
    }

    // Patrones válidos para URLs de Google Drive
    const patronesValidos = [
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+\/view/,
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+\/preview/,
      /^https:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9-_]+/
    ];

    this.urlValida = patronesValidos.some(patron => patron.test(url));
    
    if (!this.urlValida) {
      this.toastService.mostrarError('URL de Google Drive no válida. Formato: drive.google.com/file/d/ID/view');
    }
  }

  // Vista previa del video
  previsualizarVideo() {
    if (this.urlValida && this.ejercicioActual.enlace_video) {
      const url = this.convertirAPreview(this.ejercicioActual.enlace_video);
      window.open(url, '_blank', 'width=800,height=600');
    }
  }

  // Convertir URL a formato preview
  private convertirAPreview(url: string): string {
    // Extraer el ID del archivo
    let fileId = '';
    
    const patronId = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (patronId) {
      fileId = patronId[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    const patronOpen = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (patronOpen) {
      fileId = patronOpen[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    return url; // Si no se puede convertir, devolver original
  }

  // Convertir segundos a minutos (para la validación)
  convertirSegundosAMinutos() {
    if (this.ejercicioActual.duracion_minutos) {
      // Si el usuario ingresa más de 20 segundos, limitar a 20
      if (this.ejercicioActual.duracion_minutos > 20) {
        this.ejercicioActual.duracion_minutos = 20;
        this.toastService.mostrarError('Duración máxima: 20 segundos');
      }
      
      // Convertir segundos a minutos para almacenar en la base de datos
      // (Mantenemos el valor en segundos en la interfaz, pero se convierte internamente)
    }
  }

  async eliminarEjercicio(ejercicio: Ejercicio) {
    // TODO: Implementar confirmación
    try {
      if (!ejercicio.id) return;

      this.loading = true;
      const result = await this.ejercicioService.desactivarEjercicio(ejercicio.id);

      if (result.success) {
        await this.toastService.mostrarExito('Ejercicio eliminado');
        await this.cargarEjercicios();
      } else {
        await this.toastService.mostrarError(result.error || 'Error al eliminar ejercicio');
      }
    } catch (error) {
      console.error('Error al eliminar ejercicio:', error);
      await this.toastService.mostrarError('Error inesperado');
    } finally {
      this.loading = false;
    }
  }

  // Convertir URL de Google Drive a formato embed para mostrar en iframe
  getVideoEmbedUrl(url: string): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    
    // Extraer el ID del archivo de Google Drive
    let fileId = '';
    
    // Patrón para URLs como: https://drive.google.com/file/d/FILE_ID/view
    const patronId = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (patronId) {
      fileId = patronId[1];
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }

    // Patrón para URLs como: https://drive.google.com/open?id=FILE_ID
    const patronOpen = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (patronOpen) {
      fileId = patronOpen[1];
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }

    // Si ya está en formato preview, sanitizarlo tal como está
    if (url.includes('/preview')) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    // Si no se puede convertir, sanitizar la URL original
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Métodos para manejar arrays dinámicos
  agregarMusculoSecundario() {
    this.ejercicioActual.musculos_secundarios.push('');
  }

  async eliminarMusculoSecundario(index: number) {
    if (this.ejercicioActual.musculos_secundarios.length === 1) {
      await this.toastService.mostrarInfo('Debe mantener al menos un músculo secundario o eliminar todos');
    }
    this.ejercicioActual.musculos_secundarios.splice(index, 1);
  }

  agregarEquipamiento() {
    this.ejercicioActual.equipamiento.push('');
  }

  async eliminarEquipamiento(index: number) {
    if (this.ejercicioActual.equipamiento.length === 1) {
      await this.toastService.mostrarInfo('Eliminando último equipamiento');
    }
    this.ejercicioActual.equipamiento.splice(index, 1);
  }

  // Limpiar todos los músculos secundarios
  limpiarMusculosSecundarios() {
    this.ejercicioActual.musculos_secundarios = [];
  }

  // Limpiar todo el equipamiento
  limpiarEquipamiento() {
    this.ejercicioActual.equipamiento = [];
  }

  trackByIndex(index: number): number {
    return index;
  }

  goBack() {
    this.router.navigate(['/panel-entrenador']);
  }

  getCategoriaColor(categoria: string): string {
    const colores: { [key: string]: string } = {
      'cardio': 'primary',
      'fuerza': 'secondary',
      'flexibilidad': 'tertiary',
      'funcional': 'warning',
      'general': 'medium'
    };
    return colores[categoria] || 'medium';
  }

  getCategoriaLabel(categoria: string): string {
    const labels: { [key: string]: string } = {
      'cardio': 'Cardio',
      'fuerza': 'Fuerza',
      'flexibilidad': 'Flexibilidad',
      'funcional': 'Funcional',
      'general': 'General'
    };
    return labels[categoria] || categoria;
  }

  getNivelLabel(nivel: string): string {
    const labels: { [key: string]: string } = {
      'principiante': 'Principiante',
      'intermedio': 'Intermedio',
      'avanzado': 'Avanzado'
    };
    return labels[nivel] || nivel;
  }

  getEquipamientoText(equipamiento: string[]): string {
    if (!equipamiento || equipamiento.length === 0) return 'Sin equipamiento';
    if (equipamiento.length === 1) return equipamiento[0];
    if (equipamiento.length === 2) return equipamiento.join(' y ');
    return `${equipamiento.slice(0, -1).join(', ')} y ${equipamiento[equipamiento.length - 1]}`;
  }

  private getEmptyForm(): EjercicioFormData {
    return {
      nombre: '',
      descripcion: '',
      categoria: 'general',
      musculo_principal: '',
      musculos_secundarios: [],
      nivel_dificultad: 'principiante',
      enlace_video: '',
      duracion_minutos: null,
      equipamiento: [],
      instrucciones: '',
      consejos: ''
    };
  }

  private getEmptyRutinaForm(): any {
    return {
      nombre: '',
      descripcion: '',
      objetivo: '',
      duracion_semanas: 4,
      nivel_dificultad: 'principiante',
      activo: true
    };
  }

  // ============================================
  // MÉTODOS PARA RUTINAS
  // ============================================

  onSegmentChange(event: any) {
    this.segmentValue = event.detail.value;
    if (this.segmentValue === 'rutinas' && this.rutinas.length === 0) {
      this.cargarRutinas();
    }
  }

  async cargarRutinas() {
    this.loadingRutinas = true;
    try {
      const { data, error } = await this.rutinaService.obtenerRutinasConDetalles();
      if (error) throw error;
      this.rutinas = data || [];
      this.aplicarFiltrosRutinas();
      console.log('Rutinas cargadas:', this.rutinas);
    } catch (error) {
      console.error('Error al cargar rutinas:', error);
      await this.toastService.mostrarError('Error al cargar rutinas');
    } finally {
      this.loadingRutinas = false;
    }
  }

  aplicarFiltrosRutinas() {
    this.rutinasFiltradas = this.rutinas.filter(rutina => {
      const coincideTexto = !this.filtroTextoRutina ||
        rutina.nombre.toLowerCase().includes(this.filtroTextoRutina.toLowerCase()) ||
        rutina.descripcion?.toLowerCase().includes(this.filtroTextoRutina.toLowerCase());
      
      const coincideNivel = !this.filtroNivelRutina || rutina.nivel_dificultad === this.filtroNivelRutina;

      return coincideTexto && coincideNivel;
    });
  }

  limpiarFiltrosRutinas() {
    this.filtroTextoRutina = '';
    this.filtroNivelRutina = '';
    this.aplicarFiltrosRutinas();
  }

  async abrirModalRutina(rutina?: Rutina) {
    this.editModeRutina = !!rutina;
    
    // Cargar ejercicios disponibles si no están cargados
    if (this.ejercicios.length === 0) {
      await this.cargarEjercicios();
    }
    this.ejerciciosDisponibles = [...this.ejercicios];

    if (rutina && rutina.id) {
      // Modo edición: cargar datos de la rutina
      this.rutinaActual = {
        id: rutina.id,
        nombre: rutina.nombre,
        descripcion: rutina.descripcion || '',
        objetivo: rutina.objetivo || '',
        duracion_semanas: rutina.duracion_semanas || 4,
        nivel_dificultad: rutina.nivel_dificultad,
        activo: rutina.activo !== false
      };

      // Cargar ejercicios de la rutina
      const { data: ejerciciosRutina } = await this.rutinaService.obtenerEjerciciosDeRutina(rutina.id);
      this.ejerciciosSeleccionados = (ejerciciosRutina || []).map((re: any) => ({
        id: re.id,
        ejercicio_id: re.ejercicio_id,
        ejercicio: re.ejercicio,
        orden: re.orden,
        series: re.series || 3,
        repeticiones: re.repeticiones || '10-12',
        descanso_segundos: re.descanso_segundos || 60,
        notas: re.notas || ''
      }));
    } else {
      // Modo creación
      this.rutinaActual = this.getEmptyRutinaForm();
      this.ejerciciosSeleccionados = [];
    }

    this.showModalRutina = true;
  }

  cerrarModalRutina() {
    this.showModalRutina = false;
    this.rutinaActual = this.getEmptyRutinaForm();
    this.ejerciciosSeleccionados = [];
  }

  async guardarRutina() {
    try {
      // Validaciones
      if (!this.rutinaActual.nombre.trim()) {
        await this.toastService.mostrarError('El nombre de la rutina es obligatorio');
        return;
      }

      if (this.ejerciciosSeleccionados.length === 0) {
        await this.toastService.mostrarError('Debe agregar al menos un ejercicio a la rutina');
        return;
      }

      this.loadingRutinas = true;

      let rutinaId: number;

      if (this.editModeRutina && this.rutinaActual.id) {
        // Actualizar rutina existente
        const { data, error } = await this.rutinaService.actualizarRutina(this.rutinaActual.id, {
          nombre: this.rutinaActual.nombre,
          descripcion: this.rutinaActual.descripcion,
          objetivo: this.rutinaActual.objetivo,
          duracion_semanas: this.rutinaActual.duracion_semanas,
          nivel_dificultad: this.rutinaActual.nivel_dificultad
        });

        if (error) throw error;
        rutinaId = this.rutinaActual.id;
      } else {
        // Crear nueva rutina
        const { data, error } = await this.rutinaService.crearRutina({
          nombre: this.rutinaActual.nombre,
          descripcion: this.rutinaActual.descripcion,
          objetivo: this.rutinaActual.objetivo,
          duracion_semanas: this.rutinaActual.duracion_semanas,
          nivel_dificultad: this.rutinaActual.nivel_dificultad,
          activo: true
        });

        if (error || !data) throw error;
        rutinaId = data.id!;
      }

      // Guardar ejercicios de la rutina
      const ejerciciosParaGuardar: RutinaEjercicio[] = this.ejerciciosSeleccionados.map((ej, index) => ({
        rutina_id: rutinaId,
        ejercicio_id: ej.ejercicio_id,
        orden: index + 1,
        series: ej.series,
        repeticiones: ej.repeticiones,
        descanso_segundos: ej.descanso_segundos,
        notas: ej.notas
      }));

      const { success, error: errorEjercicios } = await this.rutinaService.guardarEjerciciosEnRutina(rutinaId, ejerciciosParaGuardar);

      if (!success) throw errorEjercicios;

      await this.toastService.mostrarExito(this.editModeRutina ? 'Rutina actualizada' : 'Rutina creada correctamente');
      this.cerrarModalRutina();
      await this.cargarRutinas();
    } catch (error) {
      console.error('Error al guardar rutina:', error);
      await this.toastService.mostrarError('Error al guardar rutina');
    } finally {
      this.loadingRutinas = false;
    }
  }

  async eliminarRutina(rutina: Rutina) {
    if (!rutina.id) return;

    try {
      this.loadingRutinas = true;
      const { success, error } = await this.rutinaService.eliminarRutina(rutina.id);

      if (success) {
        await this.toastService.mostrarExito('Rutina eliminada');
        await this.cargarRutinas();
      } else {
        await this.toastService.mostrarError(error || 'Error al eliminar rutina');
      }
    } catch (error) {
      console.error('Error al eliminar rutina:', error);
      await this.toastService.mostrarError('Error inesperado');
    } finally {
      this.loadingRutinas = false;
    }
  }

  // Agregar ejercicio a la rutina
  agregarEjercicioARutina(ejercicio: Ejercicio) {
    // Verificar si ya está agregado
    const yaAgregado = this.ejerciciosSeleccionados.some(e => e.ejercicio_id === ejercicio.id);
    if (yaAgregado) {
      this.toastService.mostrarInfo('Este ejercicio ya está en la rutina');
      return;
    }

    this.ejerciciosSeleccionados.push({
      ejercicio_id: ejercicio.id,
      ejercicio: ejercicio,
      orden: this.ejerciciosSeleccionados.length + 1,
      series: 3,
      repeticiones: '10-12',
      descanso_segundos: 60,
      notas: ''
    });
  }

  eliminarEjercicioDeRutina(index: number) {
    this.ejerciciosSeleccionados.splice(index, 1);
    // Reordenar
    this.ejerciciosSeleccionados.forEach((ej, i) => {
      ej.orden = i + 1;
    });
  }

  moverEjercicioArriba(index: number) {
    if (index === 0) return;
    const temp = this.ejerciciosSeleccionados[index];
    this.ejerciciosSeleccionados[index] = this.ejerciciosSeleccionados[index - 1];
    this.ejerciciosSeleccionados[index - 1] = temp;
    // Reordenar
    this.ejerciciosSeleccionados.forEach((ej, i) => {
      ej.orden = i + 1;
    });
  }

  moverEjercicioAbajo(index: number) {
    if (index === this.ejerciciosSeleccionados.length - 1) return;
    const temp = this.ejerciciosSeleccionados[index];
    this.ejerciciosSeleccionados[index] = this.ejerciciosSeleccionados[index + 1];
    this.ejerciciosSeleccionados[index + 1] = temp;
    // Reordenar
    this.ejerciciosSeleccionados.forEach((ej, i) => {
      ej.orden = i + 1;
    });
  }

  // Modal para asignar rutina a clientes
  async abrirModalAsignar(rutina: Rutina) {
    this.rutinaParaAsignar = rutina;
    this.clientesSeleccionados = [];
    this.fechaInicioAsignacion = new Date().toISOString().split('T')[0];
    this.fechaFinAsignacion = '';
    this.notasAsignacion = '';

    // Cargar clientes disponibles
    try {
      const clientes = await this.clienteService.listarClientes();
      this.clientesDisponibles = clientes;
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      await this.toastService.mostrarError('Error al cargar clientes');
    }

    this.showModalAsignar = true;
  }

  cerrarModalAsignar() {
    this.showModalAsignar = false;
    this.rutinaParaAsignar = null;
    this.clientesSeleccionados = [];
  }

  toggleClienteSeleccionado(clienteId: number) {
    const index = this.clientesSeleccionados.indexOf(clienteId);
    if (index === -1) {
      this.clientesSeleccionados.push(clienteId);
    } else {
      this.clientesSeleccionados.splice(index, 1);
    }
  }

  isClienteSeleccionado(clienteId: number): boolean {
    return this.clientesSeleccionados.includes(clienteId);
  }

  async confirmarAsignacion() {
    if (!this.rutinaParaAsignar || !this.rutinaParaAsignar.id) return;

    if (this.clientesSeleccionados.length === 0) {
      await this.toastService.mostrarError('Debe seleccionar al menos un cliente');
      return;
    }

    try {
      this.loadingRutinas = true;
      const { success, error } = await this.rutinaService.asignarRutinaAClientes(
        this.rutinaParaAsignar.id,
        this.clientesSeleccionados,
        this.fechaInicioAsignacion,
        this.fechaFinAsignacion,
        this.notasAsignacion
      );

      if (success) {
        await this.toastService.mostrarExito(`Rutina asignada a ${this.clientesSeleccionados.length} cliente(s)`);
        this.cerrarModalAsignar();
        await this.cargarRutinas();
      } else {
        await this.toastService.mostrarError(error || 'Error al asignar rutina');
      }
    } catch (error) {
      console.error('Error al asignar rutina:', error);
      await this.toastService.mostrarError('Error inesperado');
    } finally {
      this.loadingRutinas = false;
    }
  }
}