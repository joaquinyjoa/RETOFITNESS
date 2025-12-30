import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  imports: [CommonModule, IonicModule, FormsModule, RouterLink]
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

  // Modal para ver detalle de rutina
  showModalDetalle = false;
  rutinaDetalle: RutinaConDetalles | null = null;

  // Modal para ver video
  showModalVideo = false;
  ejercicioVideo: Ejercicio | null = null;

  // Filtros de rutinas
  filtroTextoRutina = '';
  filtroNivelRutina = '';

  // Buscador de ejercicios en el modal
  filtroEjercicioModal = '';
  ejerciciosDisponiblesFiltrados: Ejercicio[] = [];

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

  // Inyección moderna con inject()
  private ejercicioService = inject(EjercicioService);
  private toastService = inject(ToastService);
  private rutinaService = inject(RutinaService);
  private clienteService = inject(ClienteService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  // Caché simple para evitar recargas innecesarias
  private cacheEjercicios: Ejercicio[] | null = null;
  private cacheRutinas: RutinaConDetalles[] | null = null;
  private ultimaCargaEjercicios = 0;
  private ultimaCargaRutinas = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  ngOnInit() {
    console.log('🚀 [VerEjerciciosComponent] ngOnInit - Componente inicializado');
    // Solo cargar ejercicios inicialmente (lazy load de rutinas)
    this.cargarEjercicios();
  }

  async cargarEjercicios(forzarRecarga = false) {
    console.log('🟡 [VerEjerciciosComponent] === INICIO cargarEjercicios ===');
    console.log('🟡 [VerEjerciciosComponent] forzarRecarga:', forzarRecarga);
    
    // Usar caché si está disponible y no ha expirado
    const ahora = Date.now();
    if (!forzarRecarga && this.cacheEjercicios && (ahora - this.ultimaCargaEjercicios) < this.CACHE_TTL) {
      console.log('🟢 [VerEjerciciosComponent] Usando caché, ejercicios en caché:', this.cacheEjercicios.length);
      this.ejercicios = this.cacheEjercicios;
      this.aplicarFiltros();
      return;
    }

    console.log('🟡 [VerEjerciciosComponent] Activando spinner (loading = true)...');
    this.loading = true;
    console.log('🟡 [VerEjerciciosComponent] Estado del spinner:', this.loading);
    
    try {
      console.log('🟡 [VerEjerciciosComponent] Llamando a ejercicioService.listarEjercicios()...');
      const tiempoInicio = performance.now();
      
      const ejerciciosCargados = await this.ejercicioService.listarEjercicios();
      
      const tiempoFin = performance.now();
      const duracion = (tiempoFin - tiempoInicio).toFixed(2);
      
      console.log(`🟢 [VerEjerciciosComponent] Ejercicios recibidos del servicio en ${duracion}ms:`, ejerciciosCargados.length);
      console.log('🟢 [VerEjerciciosComponent] Datos recibidos:', ejerciciosCargados);
      
      // Convertir duración de minutos a segundos para mostrar en la interfaz
      console.log('🟡 [VerEjerciciosComponent] Procesando ejercicios (conversión de duración)...');
      this.ejercicios = ejerciciosCargados.map(ejercicio => ({
        ...ejercicio,
        duracion_minutos: ejercicio.duracion_minutos ? ejercicio.duracion_minutos * 60 : undefined
      }));
      
      console.log('🟢 [VerEjerciciosComponent] Ejercicios procesados:', this.ejercicios.length);
      
      // Actualizar caché
      this.cacheEjercicios = this.ejercicios;
      this.ultimaCargaEjercicios = ahora;
      console.log('🟢 [VerEjerciciosComponent] Caché actualizado');
      
      console.log('🟡 [VerEjerciciosComponent] Aplicando filtros...');
      this.aplicarFiltros();
      console.log('🟢 [VerEjerciciosComponent] Ejercicios filtrados:', this.ejerciciosFiltrados.length);
      
    } catch (error) {
      console.error('🔴 [VerEjerciciosComponent] Error al cargar ejercicios:', error);
      await this.toastService.mostrarError('Error al cargar ejercicios');
    } finally {
      console.log('🟡 [VerEjerciciosComponent] Desactivando spinner (loading = false)...');
      this.loading = false;
      console.log('🟡 [VerEjerciciosComponent] Estado final del spinner:', this.loading);
      console.log('🟡 [VerEjerciciosComponent] Forzando detección de cambios...');
      
      // Forzar detección de cambios de forma síncrona
      this.cdr.detectChanges();
      
      // Timeout adicional para asegurar que la UI se actualice
      setTimeout(() => {
        this.loading = false;
        this.cdr.detectChanges();
        console.log('🟡 [VerEjerciciosComponent] Segunda detección de cambios ejecutada');
      }, 0);
      
      console.log('🟡 [VerEjerciciosComponent] === FIN cargarEjercicios ===\n');
    }
  }

  aplicarFiltros() {
    console.log('🟣 [VerEjerciciosComponent] Aplicando filtros...');
    console.log('🟣 [VerEjerciciosComponent] Total ejercicios antes de filtrar:', this.ejercicios.length);
    console.log('🟣 [VerEjerciciosComponent] Filtros activos:', {
      texto: this.filtroTexto,
      categoria: this.filtroCategoria,
      musculo: this.filtroMusculo
    });
    
    this.ejerciciosFiltrados = this.ejercicios.filter(ejercicio => {
      const coincideTexto = !this.filtroTexto || 
        ejercicio.nombre.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        ejercicio.descripcion?.toLowerCase().includes(this.filtroTexto.toLowerCase());
      
      const coincideCategoria = !this.filtroCategoria || ejercicio.categoria === this.filtroCategoria;
      const coincideMusculo = !this.filtroMusculo || ejercicio.musculo_principal === this.filtroMusculo;

      return coincideTexto && coincideCategoria && coincideMusculo;
    });
    
    console.log('🟣 [VerEjerciciosComponent] Total ejercicios después de filtrar:', this.ejerciciosFiltrados.length);
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

      let result;
      
      if (this.editMode && this.ejercicioActual.id) {
        // Actualizar ejercicio existente
        console.log('Actualizando ejercicio ID:', this.ejercicioActual.id);
        result = await this.ejercicioService.actualizarEjercicio(this.ejercicioActual.id, ejercicioData);
      } else {
        // Crear nuevo ejercicio
        console.log('Creando nuevo ejercicio');
        result = await this.ejercicioService.crearEjercicio(ejercicioData);
      }

      if (result.success) {
        await this.toastService.mostrarExito(
          this.editMode ? 'Ejercicio actualizado correctamente' : 'Ejercicio creado correctamente'
        );
        this.cerrarModal();
        await this.cargarEjercicios(true); // true = forzar recarga, invalidar caché
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
    try {
      if (!ejercicio.id) return;

      this.loading = true;
      const result = await this.ejercicioService.desactivarEjercicio(ejercicio.id);

      if (result.success) {
        // Actualizar la lista localmente sin recargar desde el servidor
        this.ejercicios = this.ejercicios.filter(e => e.id !== ejercicio.id);
        this.cacheEjercicios = this.ejercicios;
        this.aplicarFiltros();
        await this.toastService.mostrarExito('Ejercicio eliminado');
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
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview?autoplay=0&loop=0`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }

    // Patrón para URLs como: https://drive.google.com/open?id=FILE_ID
    const patronOpen = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (patronOpen) {
      fileId = patronOpen[1];
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview?autoplay=0&loop=0`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }

    // Si ya está en formato preview, agregar parámetros para evitar loop
    if (url.includes('/preview')) {
      const urlWithParams = url.includes('?') ? `${url}&autoplay=0&loop=0` : `${url}?autoplay=0&loop=0`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams);
    }

    // Si no se puede convertir, sanitizar la URL original
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Alias para usar en el HTML de rutinas
  getSafeUrl(url: string): SafeResourceUrl {
    return this.getVideoEmbedUrl(url);
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

  abrirVideoModal(ejercicio: Ejercicio) {
    this.ejercicioVideo = ejercicio;
    this.showModalVideo = true;
  }

  cerrarVideoModal() {
    this.showModalVideo = false;
    this.ejercicioVideo = null;
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
    console.log('🔄 [VerEjerciciosComponent] Cambio de segmento:', event.detail.value);
    this.segmentValue = event.detail.value;
    
    if (this.segmentValue === 'rutinas' && this.rutinas.length === 0) {
      console.log('🔄 [VerEjerciciosComponent] Cargando rutinas por primera vez...');
      this.cargarRutinas();
    } else if (this.segmentValue === 'rutinas') {
      console.log('🔄 [VerEjerciciosComponent] Rutinas ya cargadas:', this.rutinas.length);
    }
  }

  async cargarRutinas(forzarRecarga = false) {
    console.log('🟪 [VerEjerciciosComponent] === INICIO cargarRutinas ===');
    console.log('🟪 [VerEjerciciosComponent] forzarRecarga:', forzarRecarga);
    
    // Usar caché si está disponible y no ha expirado
    const ahora = Date.now();
    if (!forzarRecarga && this.cacheRutinas && (ahora - this.ultimaCargaRutinas) < this.CACHE_TTL) {
      console.log('🟢 [VerEjerciciosComponent] Usando caché, rutinas en caché:', this.cacheRutinas.length);
      this.rutinas = this.cacheRutinas;
      this.aplicarFiltrosRutinas();
      return;
    }

    console.log('🟪 [VerEjerciciosComponent] Activando spinner rutinas (loadingRutinas = true)...');
    this.loadingRutinas = true;
    console.log('🟪 [VerEjerciciosComponent] Estado del spinner:', this.loadingRutinas);
    
    try {
      console.log('🟪 [VerEjerciciosComponent] Llamando a rutinaService.obtenerRutinasConDetalles()...');
      const tiempoInicio = performance.now();
      
      const { data, error } = await this.rutinaService.obtenerRutinasConDetalles();
      
      const tiempoFin = performance.now();
      const duracion = (tiempoFin - tiempoInicio).toFixed(2);
      
      if (error) {
        console.error(`🔴 [VerEjerciciosComponent] Error al cargar rutinas después de ${duracion}ms:`, error);
        throw error;
      }
      
      console.log(`🟢 [VerEjerciciosComponent] Rutinas recibidas en ${duracion}ms:`, data?.length || 0);
      console.log('🟢 [VerEjerciciosComponent] Datos recibidos:', data);
      
      this.rutinas = data || [];
      
      // Actualizar caché
      this.cacheRutinas = this.rutinas;
      this.ultimaCargaRutinas = ahora;
      console.log('🟢 [VerEjerciciosComponent] Caché de rutinas actualizado');
      
      console.log('🟪 [VerEjerciciosComponent] Aplicando filtros de rutinas...');
      this.aplicarFiltrosRutinas();
      console.log('🟢 [VerEjerciciosComponent] Rutinas filtradas:', this.rutinasFiltradas.length);
      
    } catch (error) {
      console.error('🔴 [VerEjerciciosComponent] Error al cargar rutinas:', error);
      await this.toastService.mostrarError('Error al cargar rutinas');
    } finally {
      console.log('🟪 [VerEjerciciosComponent] Desactivando spinner rutinas (loadingRutinas = false)...');
      this.loadingRutinas = false;
      console.log('🟪 [VerEjerciciosComponent] Estado final del spinner:', this.loadingRutinas);
      console.log('🟪 [VerEjerciciosComponent] Forzando detección de cambios...');
      
      // Forzar detección de cambios de forma síncrona
      this.cdr.detectChanges();
      
      // Timeout adicional para asegurar que la UI se actualice
      setTimeout(() => {
        this.loadingRutinas = false;
        this.cdr.detectChanges();
        console.log('🟪 [VerEjerciciosComponent] Segunda detección de cambios ejecutada');
      }, 0);
      
      console.log('🟪 [VerEjerciciosComponent] === FIN cargarRutinas ===\n');
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

  async abrirModalRutina(rutina?: Rutina | RutinaConDetalles) {
    console.log('🔧 [abrirModalRutina] === INICIO ===');
    console.log('🔧 [abrirModalRutina] Abriendo modal rutina con:', rutina);
    console.log('🔧 [abrirModalRutina] Tiene ID?', rutina?.id);
    console.log('🔧 [abrirModalRutina] Modo edición?', !!rutina);
    
    this.editModeRutina = !!rutina;
    
    // Siempre recargar ejercicios para tener los datos más actualizados
    console.log('🔧 [abrirModalRutina] Cargando ejercicios disponibles...');
    const tiempoInicio = performance.now();
    await this.cargarEjercicios();
    const tiempoFin = performance.now();
    console.log(`🔧 [abrirModalRutina] Ejercicios cargados en ${(tiempoFin - tiempoInicio).toFixed(2)}ms`);
    
    // Asignar ejercicios disponibles
    this.ejerciciosDisponibles = [...this.ejercicios];
    this.ejerciciosDisponiblesFiltrados = [...this.ejercicios];
    this.filtroEjercicioModal = '';
    
    console.log('✅ [abrirModalRutina] Modal abierto - Ejercicios disponibles:', this.ejerciciosDisponibles.length);
    console.log('📋 [abrirModalRutina] Primeros 3 ejercicios:', this.ejerciciosDisponibles.slice(0, 3).map(e => e.nombre));

    if (rutina && rutina.id) {
      console.log('✏️ MODO EDICIÓN - Cargando datos de rutina ID:', rutina.id);
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

      console.log('📝 Datos de rutina cargados:', this.rutinaActual);

      // Cargar ejercicios de la rutina
      const { data: ejerciciosRutina } = await this.rutinaService.obtenerEjerciciosDeRutina(rutina.id);
      console.log('🏋️ Ejercicios de la rutina:', ejerciciosRutina);
      
      this.ejerciciosSeleccionados = (ejerciciosRutina || []).map((re: any) => ({
        id: re.id,
        ejercicio_id: re.ejercicio_id,
        ejercicio: re.ejercicio,
        orden: re.orden,
        series: re.series || 3,
        repeticiones: re.repeticiones || '10-12',
        descanso_segundos: re.descanso_segundos || 60,
        notas: re.notas || '',
        enlace_video: re.ejercicio?.enlace_video
      }));
      
      console.log('✅ Ejercicios seleccionados cargados:', this.ejerciciosSeleccionados.length);
    } else {
      console.log('➕ MODO CREACIÓN - Nueva rutina');
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
      await this.cargarRutinas(true); // true = forzar recarga, invalidar caché
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

  // Filtrar ejercicios disponibles en el modal
  filtrarEjerciciosModal() {
    const filtro = this.filtroEjercicioModal?.toLowerCase().trim() || '';
    
    console.log('🔍 Filtrando ejercicios:', {
      filtro,
      totalDisponibles: this.ejerciciosDisponibles.length,
      hayEjercicios: this.ejerciciosDisponibles.length > 0
    });
    
    if (!filtro) {
      this.ejerciciosDisponiblesFiltrados = [...this.ejerciciosDisponibles];
      console.log('⚪ Sin filtro - Mostrando todos:', this.ejerciciosDisponiblesFiltrados.length);
      return;
    }
    
    this.ejerciciosDisponiblesFiltrados = this.ejerciciosDisponibles.filter(ej => {
      const nombreMatch = ej.nombre?.toLowerCase().includes(filtro);
      const musculoMatch = ej.musculo_principal?.toLowerCase().includes(filtro);
      const categoriaMatch = ej.categoria?.toLowerCase().includes(filtro);
      return nombreMatch || musculoMatch || categoriaMatch;
    });
    
    console.log('✅ Resultados filtrados:', this.ejerciciosDisponiblesFiltrados.length);
    if (this.ejerciciosDisponiblesFiltrados.length > 0) {
      console.log('📋 Primeros 3 resultados:', this.ejerciciosDisponiblesFiltrados.slice(0, 3).map(e => e.nombre));
    }
  }

  // Agregar ejercicio a la rutina
  agregarEjercicioARutina(ejercicio: Ejercicio) {
    console.log('Intentando agregar ejercicio:', ejercicio);
    
    // Verificar si ya está agregado
    const yaAgregado = this.ejerciciosSeleccionados.some(e => e.ejercicio_id === ejercicio.id);
    if (yaAgregado) {
      this.toastService.mostrarInfo('Este ejercicio ya está en la rutina');
      return;
    }

    const nuevoEjercicio = {
      ejercicio_id: ejercicio.id,
      ejercicio: ejercicio,
      orden: this.ejerciciosSeleccionados.length + 1,
      series: 3,
      repeticiones: '10-12',
      descanso_segundos: 60,
      notas: '',
      enlace_video: ejercicio.enlace_video
    };
    
    this.ejerciciosSeleccionados.push(nuevoEjercicio);
    
    console.log('✅ Ejercicio agregado:', nuevoEjercicio);
    console.log('📊 Total ejercicios seleccionados:', this.ejerciciosSeleccionados.length);
    
    // Mostrar confirmación
    this.toastService.mostrarExito(`${ejercicio.nombre} agregado a la rutina`);
  }

  // Verificar si un ejercicio ya fue agregado
  isEjercicioYaAgregado(ejercicioId?: number): boolean {
    if (!ejercicioId) return false;
    return this.ejerciciosSeleccionados.some(e => e.ejercicio_id === ejercicioId);
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

  // Abrir modal de detalle de rutina
  async verDetalleRutina(rutina: RutinaConDetalles) {
    console.log('📋 Abriendo detalle de rutina:', rutina);
    console.log('📊 Ejercicios en la rutina:', rutina.ejercicios);
    console.log('🔢 Cantidad de ejercicios:', rutina.ejercicios?.length || 0);
    
    // Si la rutina no tiene ejercicios cargados, cargarlos
    if (!rutina.ejercicios || rutina.ejercicios.length === 0) {
      console.log('⚠️ No hay ejercicios, intentando cargar...');
      if (rutina.id) {
        const { data: ejerciciosRutina } = await this.rutinaService.obtenerEjerciciosDeRutina(rutina.id);
        console.log('✅ Ejercicios cargados:', ejerciciosRutina);
        rutina.ejercicios = ejerciciosRutina || [];
      }
    }
    
    this.rutinaDetalle = rutina;
    this.showModalDetalle = true;
    console.log('✅ Modal abierto con rutina:', this.rutinaDetalle);
  }

  // Cerrar modal de detalle
  cerrarModalDetalle() {
    this.showModalDetalle = false;
    this.rutinaDetalle = null;
  }
}