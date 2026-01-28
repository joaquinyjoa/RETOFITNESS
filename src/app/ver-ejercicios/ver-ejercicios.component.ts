import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EjercicioService } from '../services/ejercicio.service';
import { ToastService } from '../services/toast.service';
import { RutinaService, Rutina, RutinaEjercicio, RutinaConDetalles } from '../services/rutina.service';
import { ClienteService } from '../services/cliente.service';
import { Ejercicio, EjercicioFormData } from '../models/ejercicio/ejercicio.interface';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-ver-ejercicios',
  templateUrl: './ver-ejercicios.component.html',
  styleUrls: ['./ver-ejercicios.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SpinnerComponent]
})
export class VerEjerciciosComponent implements OnInit {

  // Control de tabs
  segmentValue = 'ejercicios';

  // === EJERCICIOS ===
  ejercicios: Ejercicio[] = [];
  ejerciciosFiltrados: Ejercicio[] = [];
  loading = false;
  eliminandoEjercicio = false;
  
  // Variables para manejo de archivos
  archivoSeleccionado: File | null = null;
  previewUrl: string | null = null;
  subiendoArchivo = false;
  
  // Modal para agregar/editar ejercicio
  showModal = false;
  editMode = false;
  ejercicioActual: EjercicioFormData = this.getEmptyForm();

  // Filtros
  filtroTexto = '';
  filtroCategoria = '';
  filtroMusculo = '';

  // Spinner global para operaciones de creación
  mostrarSpinnerGlobal = false;

  // Debounce para búsqueda
  private searchTimeout: any;

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
  diaSemanaAsignacion: number = 1;
  notasAsignacion: string = '';

  // Modal para ver detalle de rutina
  showModalDetalle = false;
  rutinaDetalle: RutinaConDetalles | null = null;

  // Carrusel de ejercicios en modal detalle
  currentIndexCarrusel = 0;
  touchStartXCarrusel = 0;
  touchEndXCarrusel = 0;
  isDraggingCarrusel = false;

  // Modal para ver video
  showModalVideo = false;
  ejercicioVideo: Ejercicio | null = null;

  // Filtros de rutinas
  filtroTextoRutina = '';
  filtroNivelRutina = '';

  // Buscador de ejercicios en el modal
  filtroEjercicioModal = '';
  ejerciciosDisponiblesFiltrados: Ejercicio[] = [];

  // Búsqueda de ejercicio alternativo por ejercicio
  busquedaAlternativo: Map<number, string> = new Map();
  ejerciciosAlternativosFiltrados: Map<number, Ejercicio[]> = new Map();
  mostrarListaAlternativo: Map<number, boolean> = new Map();

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
  private alertController = inject(AlertController);

  // Índice del ejercicio cuyo botón editar está mostrando spinner
  isEditingIndex: number | null = null;
  // Índice de la rutina cuyo botón editar está mostrando spinner
  isEditingRutinaIndex: number | null = null;

  // Caché simple para evitar recargas innecesarias
  private cacheEjercicios: Ejercicio[] | null = null;
  private cacheRutinas: RutinaConDetalles[] | null = null;
  private ultimaCargaEjercicios = 0;
  private ultimaCargaRutinas = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  ngOnInit() {
    // Solo cargar ejercicios inicialmente (lazy load de rutinas)
    this.cargarEjercicios();
  }

  async cargarEjercicios(forzarRecarga = false) {
    // Usar caché si está disponible y no ha expirado
    const ahora = Date.now();
    if (!forzarRecarga && this.cacheEjercicios && (ahora - this.ultimaCargaEjercicios) < this.CACHE_TTL) {
      this.ejercicios = this.cacheEjercicios;
      this.aplicarFiltros();
      return;
    }

    this.loading = true;
    
    try {
      const tiempoInicio = performance.now();
      
      const ejerciciosCargados = await this.ejercicioService.listarEjercicios();
      
      const tiempoFin = performance.now();
      const duracion = (tiempoFin - tiempoInicio).toFixed(2);
      
      // Convertir duración de minutos a segundos para mostrar en la interfaz
      this.ejercicios = ejerciciosCargados.map(ejercicio => ({
        ...ejercicio,
        duracion_minutos: ejercicio.duracion_minutos ? ejercicio.duracion_minutos * 60 : undefined
      }));
      
      // Actualizar caché
      this.cacheEjercicios = this.ejercicios;
      this.ultimaCargaEjercicios = ahora;
      
      this.aplicarFiltros();
      
    } catch (error) {
      console.error('🔴 [VerEjerciciosComponent] Error al cargar ejercicios:', error);
      await this.toastService.mostrarError('Error al cargar ejercicios');
    } finally {
      this.loading = false;
      
      // Forzar detección de cambios de forma síncrona
      this.cdr.detectChanges();
      
      // Timeout adicional para asegurar que la UI se actualice
      setTimeout(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }, 0);
    }
  }

  aplicarFiltros() {
    // Cancelar búsqueda anterior si existe
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce de 300ms
    this.searchTimeout = setTimeout(() => {
      this.ejerciciosFiltrados = this.ejercicios.filter(ejercicio => {
        const coincideTexto = !this.filtroTexto || 
          ejercicio.nombre.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
          ejercicio.descripcion?.toLowerCase().includes(this.filtroTexto.toLowerCase());
        
        const coincideCategoria = !this.filtroCategoria || ejercicio.categoria === this.filtroCategoria;
        const coincideMusculo = !this.filtroMusculo || ejercicio.musculo_principal === this.filtroMusculo;

      return coincideTexto && coincideCategoria && coincideMusculo;
    });
      this.cdr.detectChanges();
    }, 300);
  }

  limpiarFiltros() {
    this.filtroTexto = '';
    this.filtroCategoria = '';
    this.filtroMusculo = '';
    this.aplicarFiltros();
  }

  async abrirModal(ejercicio?: Ejercicio, suppressSpinner: boolean = false) {
    this.editMode = !!ejercicio;

    // Si se solicita suprimir spinner, abrir modal inmediatamente con los datos
    if (ejercicio && suppressSpinner) {
      this.ejercicioActual = {
        id: ejercicio.id,
        nombre: ejercicio.nombre,
        descripcion: ejercicio.descripcion || '',
        categoria: ejercicio.categoria,
        musculo_principal: ejercicio.musculo_principal,
        musculos_secundarios: ejercicio.musculos_secundarios || [],
        nivel_dificultad: ejercicio.nivel_dificultad,
        enlace_video: ejercicio.enlace_video,
        equipamiento: ejercicio.equipamiento || [],
        instrucciones: ejercicio.instrucciones || '',
        consejos: ejercicio.consejos || ''
      };
      this.showModal = true;
      return;
    }

    // Comportamiento por defecto: si hay ejercicio, mostrar spinner global 1.5s, luego abrir modal
    if (ejercicio) {
      this.mostrarSpinnerGlobal = true;
      this.cdr.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 1500));

      this.ejercicioActual = {
        id: ejercicio.id,
        nombre: ejercicio.nombre,
        descripcion: ejercicio.descripcion || '',
        categoria: ejercicio.categoria,
        musculo_principal: ejercicio.musculo_principal,
        musculos_secundarios: ejercicio.musculos_secundarios || [],
        nivel_dificultad: ejercicio.nivel_dificultad,
        enlace_video: ejercicio.enlace_video,
        equipamiento: ejercicio.equipamiento || [],
        instrucciones: ejercicio.instrucciones || '',
        consejos: ejercicio.consejos || ''
      };

      this.showModal = true;
      this.mostrarSpinnerGlobal = false;
      this.cdr.detectChanges();
      return;
    }

    // Nuevo ejercicio: abrir modal sin spinner
    this.ejercicioActual = this.getEmptyForm();
    this.showModal = true;
  }

  // Mostrar spinner en el propio botón de editar durante 1.5s y abrir modal sin spinner global
  async editarConSpinner(ejercicio: Ejercicio, index: number) {
    this.isEditingIndex = index;
    // Mostrar overlay spinner global
    this.mostrarSpinnerGlobal = true;
    this.cdr.detectChanges();

    try {
      // Mantener spinner 1.5s
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Abrir modal sin spinner global adicional
      await this.abrirModal(ejercicio, true);
    } finally {
      // Ocultar overlay y limpiar estado siempre
      this.mostrarSpinnerGlobal = false;
      this.isEditingIndex = null;
      this.cdr.detectChanges();
    }
  }

  // Similar para rutinas: mostrar spinner en botón editar y abrir modal
  async editarRutinaConSpinner(rutina: Rutina | RutinaConDetalles, index: number) {
    this.isEditingRutinaIndex = index;
    // Mostrar overlay spinner global
    this.mostrarSpinnerGlobal = true;
    this.cdr.detectChanges();

    try {
      // Mantener spinner 1.5s
      await new Promise(resolve => setTimeout(resolve, 1500));

      await this.abrirModalRutina(rutina);
    } finally {
      // Ocultar overlay y limpiar estado siempre
      this.mostrarSpinnerGlobal = false;
      this.isEditingRutinaIndex = null;
      this.cdr.detectChanges();
    }
  }

  // Mostrar overlay spinner 1.5s y luego navegar a asignar rutina
  async asignarConSpinner(rutina: Rutina | RutinaConDetalles) {
    if (!rutina || !rutina.id) return;
    this.mostrarSpinnerGlobal = true;
    this.cdr.detectChanges();
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await this.router.navigate(['/asignar-rutina', rutina.id]);
    } finally {
      this.mostrarSpinnerGlobal = false;
      this.cdr.detectChanges();
    }
  }

  cerrarModal() {
    this.showModal = false;
    this.ejercicioActual = this.getEmptyForm();
    this.archivoSeleccionado = null;
    this.previewUrl = null;
  }

  // Manejar selección de archivo
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar que sea solo GIF
    const validTypes = ['image/gif'];
    if (!validTypes.includes(file.type)) {
      await this.toastService.mostrarError('Solo se permiten archivos GIF');
      return;
    }

    // Validar tamaño (máximo 10MB para GIFs)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      await this.toastService.mostrarError('El archivo no debe superar los 10MB');
      return;
    }

    this.archivoSeleccionado = file;
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  // Subir archivo a Supabase Storage con reintentos automáticos
  async subirArchivoAStorage(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    const maxReintentos = 3;
    let intento = 0;

    while (intento < maxReintentos) {
      try {
        intento++;
        console.log(`📤 Intento ${intento}/${maxReintentos} de subir archivo: ${file.name}`);

        const { getSupabaseClient } = await import('../services/supabase-client');
        const supabase = getSupabaseClient();
        
        // Obtener session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return { success: false, error: 'No hay sesión activa' };
        }

        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `${fileName}`;

        // Determinar el Content-Type correcto
        const extension = file.name.toLowerCase().split('.').pop();
        const mimeTypes: { [key: string]: string } = {
          'gif': 'image/gif',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'webp': 'image/webp',
          'mp4': 'video/mp4',
          'webm': 'video/webm',
          'mov': 'video/quicktime'
        };
        
        const contentType = mimeTypes[extension || ''] || file.type || 'application/octet-stream';
        console.log(`📝 Content-Type detectado: ${contentType}`);

        // Convertir archivo a ArrayBuffer para mejor compatibilidad
        const arrayBuffer = await file.arrayBuffer();
        console.log(`📦 Archivo convertido a ArrayBuffer: ${arrayBuffer.byteLength} bytes`);

        // Obtener la URL base del proyecto
        const supabaseUrl = 'https://tylyzyivlvibfyvetchr.supabase.co';
        const uploadUrl = `${supabaseUrl}/storage/v1/object/ejercicios/${filePath}`;

        // Subir usando fetch con ArrayBuffer
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': contentType,
            'x-upsert': 'false',
            'cache-control': 'max-age=3600'
          },
          body: arrayBuffer
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
          console.error(`❌ Error al subir archivo (intento ${intento}):`, errorData);
          
          // Si es el último intento, retornar error
          if (intento >= maxReintentos) {
            return { success: false, error: `Error al subir: ${errorData.message || response.statusText}` };
          }
          
          // Esperar antes del próximo intento (backoff exponencial)
          const delay = Math.min(1000 * Math.pow(2, intento - 1), 5000);
          console.log(`⏳ Esperando ${delay}ms antes del próximo intento...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Construir URL pública
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/ejercicios/${filePath}`;
        console.log(`✅ Archivo subido exitosamente: ${publicUrl}`);
        return { success: true, url: publicUrl };

      } catch (error: any) {
        console.error(`❌ Error en subirArchivoAStorage (intento ${intento}):`, error);
        
        // Si es el último intento, retornar error
        if (intento >= maxReintentos) {
          return { success: false, error: error.message || 'Error al subir el archivo' };
        }
        
        // Esperar antes del próximo intento
        const delay = Math.min(1000 * Math.pow(2, intento - 1), 5000);
        console.log(`⏳ Esperando ${delay}ms antes del próximo intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { success: false, error: 'No se pudo subir el archivo después de varios intentos' };
  }

  async guardarEjercicio() {
    try {
      // Validaciones básicas
      if (!this.ejercicioActual.nombre.trim()) {
        await this.toastService.mostrarError('El nombre del ejercicio es obligatorio');
        return;
      }

      // Validar que haya archivo GIF
      if (!this.archivoSeleccionado) {
        await this.toastService.mostrarError('Debes subir un archivo GIF');
        return;
      }
      // Mostrar spinner global
      this.mostrarSpinnerGlobal = true;
      this.cdr.detectChanges();

      // Dar tiempo al spinner para mostrarse
      await new Promise(resolve => setTimeout(resolve, 50));

      // Si hay archivo seleccionado, subirlo primero
      if (this.archivoSeleccionado) {
        this.subiendoArchivo = true;
        this.cdr.detectChanges();

        const uploadResult = await this.subirArchivoAStorage(this.archivoSeleccionado);
        
        this.subiendoArchivo = false;
        this.cdr.detectChanges();

        if (!uploadResult.success) {
          this.mostrarSpinnerGlobal = false;
          this.cdr.detectChanges();
          // Pequeña pausa antes de mostrar el error
          await new Promise(resolve => setTimeout(resolve, 100));
          await this.toastService.mostrarError(uploadResult.error || 'Error al subir el archivo');
          return;
        }

        // Usar la URL del archivo subido
        this.ejercicioActual.enlace_video = uploadResult.url!;
      }

      const ejercicioData: Ejercicio = {
        ...this.ejercicioActual,
        categoria: this.ejercicioActual.categoria as 'cardio' | 'fuerza' | 'flexibilidad' | 'funcional' | 'general',
        nivel_dificultad: this.ejercicioActual.nivel_dificultad as 'principiante' | 'intermedio' | 'avanzado',
        musculos_secundarios: this.ejercicioActual.musculos_secundarios.filter(m => m.trim()),
        equipamiento: this.ejercicioActual.equipamiento.filter(e => e.trim())
      };

      let result;

      if (this.editMode && this.ejercicioActual.id) {
        // Actualizar ejercicio existente
        result = await this.ejercicioService.actualizarEjercicio(this.ejercicioActual.id, ejercicioData);
      } else {
        // Crear nuevo ejercicio
        result = await this.ejercicioService.crearEjercicio(ejercicioData);
      }

      if (result.success) {
        // Mantener spinner visible por un momento
        await new Promise(resolve => setTimeout(resolve, 800));

        // Ocultar spinner antes de cerrar modal
        this.mostrarSpinnerGlobal = false;
        this.cdr.detectChanges();

        // Pequeña pausa
        await new Promise(resolve => setTimeout(resolve, 100));

        // Cerrar modal
        this.cerrarModal();

        // Mostrar toast de éxito
        await this.toastService.mostrarExito(
          this.editMode ? 'Ejercicio actualizado correctamente' : 'Ejercicio creado correctamente'
        );

        // Recargar ejercicios
        await this.cargarEjercicios(true);

      } else {
        // Error al guardar
        this.mostrarSpinnerGlobal = false;
        this.cdr.detectChanges();

        // Pequeña pausa antes de mostrar el error
        await new Promise(resolve => setTimeout(resolve, 100));
        // Mostrar toast de error (sin cerrar modal)
        await this.toastService.mostrarError(result.error || 'Error al guardar ejercicio');
      }
    } catch (error: any) {
      // Ocultar spinner global en caso de error
      this.mostrarSpinnerGlobal = false;
      this.cdr.detectChanges();
      // Pequeña pausa antes de mostrar el error
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.toastService.mostrarError('Error inesperado al guardar');
    } finally {
      // Asegurar que el spinner esté oculto al final siempre
      this.mostrarSpinnerGlobal = false;
      this.cdr.detectChanges();
    }
  }

async eliminarEjercicio(ejercicio: Ejercicio) {
  let timeoutId: any;

  try {
    if (!ejercicio.id) {
      return;
    }
    
    const confirmado = await this.confirmarEliminar(ejercicio);

    if (!confirmado) {
      return;
    }
    this.eliminandoEjercicio = true;
    this.cdr.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 50));
    timeoutId = setTimeout(() => {
      this.eliminandoEjercicio = false;
      this.cdr.detectChanges();
    }, 10000);
    const result = await this.ejercicioService.desactivarEjercicio(ejercicio.id);

    clearTimeout(timeoutId);

    if (result.success) {

      // Mantener spinner visible por un momento
      await new Promise(resolve => setTimeout(resolve, 800));

      // Ocultar spinner
      this.eliminandoEjercicio = false;
      this.cdr.detectChanges();

      // Pequeña pausa antes de mostrar toast y actualizar lista
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mostrar toast
      await this.toastService.mostrarExito('Ejercicio eliminado');

      // Actualizar lista (desaparece el ejercicio)
      this.ejercicios = this.ejercicios.filter(e => e.id !== ejercicio.id);
      this.cacheEjercicios = this.ejercicios;
      this.aplicarFiltros();
      this.cdr.detectChanges();
    } else {
      this.eliminandoEjercicio = false;
      this.cdr.detectChanges();
    }

  } catch (error) {
    this.eliminandoEjercicio = false;
    this.cdr.detectChanges();
  } finally {
    clearTimeout(timeoutId);
  }
}

 async confirmarEliminar(ejercicio: Ejercicio): Promise<boolean> {

  const alert = await this.alertController.create({
    header: 'Confirmar eliminación',
    message: `¿Estás seguro de que deseas eliminar "${ejercicio.nombre}"?`,
    cssClass: 'neon-alert',
    buttons: [
      { text: 'Cancelar', role: 'cancel', cssClass: 'neon-cancel' },
      { text: 'Eliminar', role: 'confirm', cssClass: 'neon-confirm' }
    ]
  });

  await alert.present();

  const { role } = await alert.onDidDismiss();

  return role === 'confirm';
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

  // Obtener URL directa de imagen/GIF desde Google Drive o Supabase
    getDirectImageUrl(url: string): string {
    if (!url) return '';

    // Si es de Supabase Storage, devolver directamente
    if (url.includes('supabase.co/storage')) {
      return url;
    }

    // Extraer el ID del archivo de Google Drive
    let fileId = '';

    // Patrón para URLs como: https://drive.google.com/file/d/FILE_ID/view
    const patronId = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (patronId) {
      fileId = patronId[1];

      // Para GIFs, intentar diferentes URLs
      if (url.toLowerCase().includes('.gif') || this.isLikelyGif(url)) {
        // URL alternativa que podría funcionar mejor para GIFs
        const resultado = `https://lh3.googleusercontent.com/d/${fileId}`;
        return resultado;
      }

      // Para otras imágenes, usar la URL de vista
      const resultado = `https://drive.google.com/uc?export=view&id=${fileId}`;
      return resultado;
    }

    // Patrón para URLs como: https://drive.google.com/open?id=FILE_ID
    const patronOpen = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (patronOpen) {
      fileId = patronOpen[1];

      if (url.toLowerCase().includes('.gif') || this.isLikelyGif(url)) {
        const resultado = `https://lh3.googleusercontent.com/d/${fileId}`;
        return resultado;
      }
      const resultado = `https://drive.google.com/uc?export=view&id=${fileId}`;
      return resultado;
    }

    // Si no se puede extraer el ID, devolver la URL original
    return url;
  }

  // Función auxiliar para detectar si es probable que sea un GIF
  private isLikelyGif(url: string): boolean {
    const lower = url.toLowerCase();
    // Si contiene 'gif' en cualquier parte de la URL
    if (lower.includes('gif')) return true;
    // Si es de Google Drive y no tiene extensión clara de imagen/video
    if (lower.includes('drive.google.com') && !/\.(png|jpe?g|webp|mp4|mov|avi)/.test(lower)) return true;
    return false;
  }

  // Obtener URL para video desde Google Drive (usando embed)
  getDirectVideoUrl(url: string): string {
    if (!url) return '';

    // Extraer el ID del archivo de Google Drive
    let fileId = '';

    // Patrón para URLs como: https://drive.google.com/file/d/FILE_ID/view
    const patronId = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (patronId) {
      fileId = patronId[1];
      // Para videos, usar la URL de embed que permite reproducción
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    // Patrón para URLs como: https://drive.google.com/open?id=FILE_ID
    const patronOpen = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (patronOpen) {
      fileId = patronOpen[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    // Si no se puede extraer el ID, devolver la URL original
    return url;
  }

  // Alias para usar en el HTML de rutinas
  getSafeUrl(url: string): SafeResourceUrl {
    return this.getVideoEmbedUrl(url);
  }

  isImageUrl(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();

    // Extensiones de imagen/GIF
    if (/\.(gif|png|jpe?g|webp)$/.test(lower)) {
      return true;
    }

    // URLs ya procesadas de Drive
    if (lower.includes('uc?export=view') || lower.includes('export=download') || lower.includes('thumbnail')) {
      return true;
    }

    // URLs de Supabase Storage con extensión de imagen/GIF
    if (lower.includes('supabase.co/storage') && /\.(gif|png|jpe?g|webp)/.test(lower)) {
      return true;
    }

    // Para Google Drive: si NO es claramente un video, asumir que es imagen/GIF
    if (lower.includes('drive.google.com') && !this.isVideoFile(url)) {
      return true;
    }
    return false;
  }

  isVideoUrl(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();

    // Extensiones de video reales
    if (/\.(mp4|webm|mov|mkv|ogg|avi)$/.test(lower)) {
      return true;
    }

    // URLs ya procesadas como videos
    if (lower.includes('uc?export=download') || lower.includes('webcontent') || lower.includes('export=download')) {
      return true;
    }

    // URLs de Supabase Storage con extensión de video
    if (lower.includes('supabase.co/storage') && /\.(mp4|webm|mov|mkv|ogg|avi)/.test(lower)) {
      return true;
    }

    // Solo para Google Drive: si es claramente un archivo de video
    if (lower.includes('drive.google.com') && this.isVideoFile(url)) {
      return true;
    }

    return false;
  }

  // Función auxiliar para detectar archivos de video por extensión o nombre
  private isVideoFile(url: string): boolean {
    const lower = url.toLowerCase();
    return /\.(mp4|webm|mov|mkv|ogg|avi|m4v|3gp|flv|wmv)$/.test(lower);
  }

  // Manejadores de eventos de imagen
  onImageError(event: any, url: string) {
    console.error('❌ Error al cargar imagen:', url);
    console.error('❌ Evento de error:', event);
  }

  getDirectMediaUrl(url: string): string {
    // Para videos, usar la URL de embed que permite reproducción
    return this.getDirectVideoUrl(url);
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

  trackByEjercicioId(index: number, item: any): number | string {
    return item?.ejercicio_id ?? index;
  }

  goBack() {
    this.router.navigate(['/panel-entrenador']);
  }

  getCategoriaColor(categoria: string): string {
    const colores: { [key: string]: string } = {
      'cardio': 'success',
      'fuerza': 'success',
      'flexibilidad': 'success',
      'funcional': 'success',
      'general': 'success'
    };
    return colores[categoria] || 'success';
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

  async cargarRutinas(forzarRecarga = false) {
    
    // Usar caché si está disponible y no ha expirado
    const ahora = Date.now();
    if (!forzarRecarga && this.cacheRutinas && (ahora - this.ultimaCargaRutinas) < this.CACHE_TTL) {
      this.rutinas = this.cacheRutinas;
      this.aplicarFiltrosRutinas();
      return;
    }

    this.loadingRutinas = true;
    
    try {
      const tiempoInicio = performance.now();
      
      const { data, error } = await this.rutinaService.obtenerRutinasConDetalles();
      
      const tiempoFin = performance.now();
      const duracion = (tiempoFin - tiempoInicio).toFixed(2);
      
      if (error) {
        throw error;
      }
      
      this.rutinas = data || [];
      
      // Actualizar caché
      this.cacheRutinas = this.rutinas;
      this.ultimaCargaRutinas = ahora;
      this.aplicarFiltrosRutinas();
      
    } catch (error) {
      await this.toastService.mostrarError('Error al cargar rutinas');
    } finally {
      this.loadingRutinas = false;
      
      // Forzar detección de cambios de forma síncrona
      this.cdr.detectChanges();
      
      // Timeout adicional para asegurar que la UI se actualice
      setTimeout(() => {
        this.loadingRutinas = false;
        this.cdr.detectChanges();
      }, 0);
      
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
    
    this.editModeRutina = !!rutina;
    
    // Siempre recargar ejercicios para tener los datos más actualizados
    const tiempoInicio = performance.now();
    await this.cargarEjercicios();
    const tiempoFin = performance.now();

    // Asignar ejercicios disponibles
    this.ejerciciosDisponibles = [...this.ejercicios];
    this.ejerciciosDisponiblesFiltrados = [...this.ejercicios];
    this.filtroEjercicioModal = '';

    if (rutina && rutina.id) {
      // Modo edición: cargar datos de la rutina
      this.rutinaActual = {
        id: rutina.id,
        nombre: rutina.nombre,
        descripcion: rutina.descripcion || '',
        objetivo: rutina.objetivo || '',
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
        porcentaje_fuerza: re.porcentaje_fuerza || 100,
        notas: re.notas || '',
        enlace_video: re.ejercicio?.enlace_video
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

      // Validar repeticiones
      for (const ej of this.ejerciciosSeleccionados) {
        if (!this.validarRepeticiones(ej.repeticiones)) {
          await this.toastService.mostrarError('Las repeticiones no pueden ser mayores a 20. Formato válido: "12" o "10-15"');
          return;
        }
      }

      // Validar descanso (máximo 4 minutos = 240 segundos)
      for (const ej of this.ejerciciosSeleccionados) {
        const descanso = parseInt(ej.descanso_segundos?.toString() || '0');
        if (descanso > 240) {
          await this.toastService.mostrarError('El descanso no puede superar los 4 minutos (240 segundos)');
          return;
        }
      }
      // Mostrar spinner global
      this.mostrarSpinnerGlobal = true;
      this.cdr.detectChanges();

      // Dar tiempo al spinner para mostrarse
      await new Promise(resolve => setTimeout(resolve, 50));

      let rutinaId: number;

      if (this.editModeRutina && this.rutinaActual.id) {
        // Actualizar rutina existente
        const { data, error } = await this.rutinaService.actualizarRutina(this.rutinaActual.id, {
          nombre: this.rutinaActual.nombre,
          descripcion: this.rutinaActual.descripcion,
          objetivo: this.rutinaActual.objetivo,
          nivel_dificultad: this.rutinaActual.nivel_dificultad
        });

        if (error) {
          this.mostrarSpinnerGlobal = false;
          this.cdr.detectChanges();
          throw error;
        }
        rutinaId = this.rutinaActual.id;
      } else {
        // Crear nueva rutina
        const { data, error } = await this.rutinaService.crearRutina({
          nombre: this.rutinaActual.nombre,
          descripcion: this.rutinaActual.descripcion,
          objetivo: this.rutinaActual.objetivo,
          nivel_dificultad: this.rutinaActual.nivel_dificultad,
          activo: true
        });

        if (error || !data) {
          this.mostrarSpinnerGlobal = false;
          this.cdr.detectChanges();
          throw error;
        }
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
        porcentaje_fuerza: ej.porcentaje_fuerza || 100,
        ejercicio_alternativo_id: ej.ejercicio_alternativo_id || null,
        notas: ej.notas
      }));
      const { success, error: errorEjercicios } = await this.rutinaService.guardarEjerciciosEnRutina(rutinaId, ejerciciosParaGuardar);

      if (!success) {
        this.mostrarSpinnerGlobal = false;
        this.cdr.detectChanges();
        throw errorEjercicios;
      }

      // Mantener spinner visible por un momento
      await new Promise(resolve => setTimeout(resolve, 800));

      // Cerrar modal primero
      this.cerrarModalRutina();

      // Ocultar spinner después de cerrar modal
      this.mostrarSpinnerGlobal = false;
      this.cdr.detectChanges();

      // Pequeña pausa
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mostrar toast de éxito
      await this.toastService.mostrarExito(
        this.editModeRutina ? 'Rutina actualizada correctamente' : 'Rutina creada correctamente'
      );

      // Recargar rutinas
      await this.cargarRutinas(true);

    } catch (error) {
      // Ocultar spinner global en caso de error
      this.mostrarSpinnerGlobal = false;
      this.cdr.detectChanges();

      console.error('Error al guardar rutina:', error);
      await this.toastService.mostrarError('Error al guardar rutina');
    } finally {
      // Asegurar que el spinner esté oculto al final
      if (this.mostrarSpinnerGlobal) {
        this.mostrarSpinnerGlobal = false;
        this.cdr.detectChanges();
      }
    }
  }

  async eliminarRutina(rutina: Rutina) {
    let timeoutId: any;

    try {
      if (!rutina.id) {
        return;
      }
      const confirmado = await this.confirmarEliminarRutina(rutina);

      if (!confirmado) {
        return;
      }

      this.eliminandoEjercicio = true;
      this.cdr.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 50));
      timeoutId = setTimeout(() => {
        this.eliminandoEjercicio = false;
        this.cdr.detectChanges();
      }, 10000);

      const { success, error } = await this.rutinaService.eliminarRutina(rutina.id);

      clearTimeout(timeoutId);

      if (success) {

        // Mantener spinner visible por un momento
        await new Promise(resolve => setTimeout(resolve, 800));

        // Ocultar spinner
        this.eliminandoEjercicio = false;
        this.cdr.detectChanges();

        // Pequeña pausa antes de mostrar toast y actualizar lista
        await new Promise(resolve => setTimeout(resolve, 100));

        // Mostrar toast
        await this.toastService.mostrarExito('Rutina eliminada');

        // Actualizar lista (desaparece la rutina)
        this.rutinas = this.rutinas.filter(r => r.id !== rutina.id);
        this.cacheRutinas = this.rutinas;
        this.aplicarFiltrosRutinas();
        this.cdr.detectChanges();
      } else {
        this.eliminandoEjercicio = false;
        this.cdr.detectChanges();
        await this.toastService.mostrarError(error || 'Error al eliminar rutina');
      }

    } catch (error) {
      this.eliminandoEjercicio = false;
      this.cdr.detectChanges();
      await this.toastService.mostrarError('Error inesperado');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async confirmarEliminarRutina(rutina: Rutina): Promise<boolean> {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar la rutina "${rutina.nombre}"?`,
      cssClass: 'neon-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'neon-cancel'
        },
        {
          text: 'Eliminar',
          role: 'confirm',
          cssClass: 'neon-confirm'
        }
      ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();

    return role === 'confirm';
  }

  // Filtrar ejercicios disponibles en el modal
  filtrarEjerciciosModal() {
    const filtro = this.filtroEjercicioModal?.toLowerCase().trim() || '';
    
    if (!filtro) {
      this.ejerciciosDisponiblesFiltrados = [...this.ejerciciosDisponibles];
      return;
    }
    
    this.ejerciciosDisponiblesFiltrados = this.ejerciciosDisponibles.filter(ej => {
      const nombreMatch = ej.nombre?.toLowerCase().includes(filtro);
      const musculoMatch = ej.musculo_principal?.toLowerCase().includes(filtro);
      const categoriaMatch = ej.categoria?.toLowerCase().includes(filtro);
      return nombreMatch || musculoMatch || categoriaMatch;
    });
    
  }

  // Agregar ejercicio a la rutina
  agregarEjercicioARutina(ejercicio: Ejercicio) {
    
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
      porcentaje_fuerza: 100,
      notas: '',
      enlace_video: ejercicio.enlace_video
    };
    
    this.ejerciciosSeleccionados.push(nuevoEjercicio);
    
    // Mostrar confirmación
    this.toastService.mostrarExito(`${ejercicio.nombre} agregado a la rutina`);
  }

  // Validar porcentaje de fuerza (0-100)
  validarPorcentajeFuerza(ejercicio: any) {
    const valor = ejercicio.porcentaje_fuerza;
    
    // Si el campo está vacío, no validar
    if (valor === null || valor === undefined || valor === '') {
      return;
    }

    // Convertir a número y validar
    const numero = Number(valor);
    
    // Verificar si es un número válido
    if (isNaN(numero)) {
      this.toastService.mostrarError('El porcentaje de fuerza debe ser un número');
      ejercicio.porcentaje_fuerza = 100;
      return;
    }

    // Validar rango 0-100
    if (numero < 0) {
      this.toastService.mostrarError('El porcentaje no puede ser negativo');
      ejercicio.porcentaje_fuerza = 0;
    } else if (numero > 100) {
      this.toastService.mostrarError('El porcentaje no puede ser mayor a 100');
      ejercicio.porcentaje_fuerza = 100;
    }
  }

  // Validar números positivos (series, descanso, etc.)
  validarNumeroPositivo(ejercicio: any, campo: string) {
    const valor = ejercicio[campo];
    
    // Si el campo está vacío, no validar
    if (valor === null || valor === undefined || valor === '') {
      return;
    }

    // Convertir a número y validar
    const numero = Number(valor);
    
    // Verificar si es un número válido
    if (isNaN(numero)) {
      this.toastService.mostrarError(`El valor debe ser un número`);
      ejercicio[campo] = campo === 'series' ? 3 : 60;
      return;
    }

    // Validar que sea positivo
    if (numero < 0) {
      this.toastService.mostrarError('El valor no puede ser negativo');
      ejercicio[campo] = 0;
      return;
    }

    // Validación específica para series (máximo 5)
    if (campo === 'series' && numero > 5) {
      this.toastService.mostrarError('El número de series no puede ser mayor a 5');
      ejercicio[campo] = 5;
    }
  }

  // Verificar si un ejercicio ya fue agregado
  isEjercicioYaAgregado(ejercicioId?: number): boolean {
    if (!ejercicioId) return false;
    return this.ejerciciosSeleccionados.some(e => e.ejercicio_id === ejercicioId);
  }

  async eliminarEjercicioDeRutina(index: number) {
    const ejercicio = this.ejerciciosSeleccionados[index];
    
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar "${ejercicio.ejercicio?.nombre}" de esta rutina?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.ejerciciosSeleccionados.splice(index, 1);
            // Reordenar
            this.ejerciciosSeleccionados.forEach((ej, i) => {
              ej.orden = i + 1;
            });
          }
        }
      ]
    });

    await alert.present();
  }

  validarRepeticiones(repeticiones: string): boolean {
    if (!repeticiones || repeticiones.trim() === '') {
      return true; // Permitir vacío
    }

    const repsStr = repeticiones.trim();

    // Si es un rango (contiene "-")
    if (repsStr.includes('-')) {
      const partes = repsStr.split('-');
      if (partes.length !== 2) {
        return false;
      }

      const num1 = parseInt(partes[0].trim());
      const num2 = parseInt(partes[1].trim());

      // Validar que ambos sean números válidos y no mayores a 20
      if (isNaN(num1) || isNaN(num2) || num1 < 1 || num2 < 1 || num1 > 20 || num2 > 20) {
        return false;
      }

      return true;
    } else {
      // Si es un número simple
      const num = parseInt(repsStr);
      return !isNaN(num) && num >= 1 && num <= 20;
    }
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
    this.notasAsignacion = '';
    this.diaSemanaAsignacion = 1;

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
      // Mostrar spinner
      this.mostrarSpinnerGlobal = true;
      this.cdr.detectChanges();

      // Dar tiempo al spinner para mostrarse
      await new Promise(resolve => setTimeout(resolve, 50));

      const { success, error } = await this.rutinaService.asignarRutinaAClientes(
        this.rutinaParaAsignar.id,
        this.clientesSeleccionados,
        this.diaSemanaAsignacion,
        this.notasAsignacion
      );

      if (success) {
        // Mantener spinner visible por un momento
        await new Promise(resolve => setTimeout(resolve, 800));

        // Cerrar modal
        this.cerrarModalAsignar();

        // Ocultar spinner
        this.mostrarSpinnerGlobal = false;
        this.cdr.detectChanges();

        // Pequeña pausa
        await new Promise(resolve => setTimeout(resolve, 100));

        // Mostrar toast
        await this.toastService.mostrarExito(`Rutina asignada a ${this.clientesSeleccionados.length} cliente(s)`);

        // Recargar rutinas
        await this.cargarRutinas(true);
      } else {
        this.mostrarSpinnerGlobal = false;
        this.cdr.detectChanges();
        await this.toastService.mostrarError(error || 'Error al asignar rutina');
      }
    } catch (error) {
      console.error('Error al asignar rutina:', error);
      this.mostrarSpinnerGlobal = false;
      this.cdr.detectChanges();
      await this.toastService.mostrarError('Error inesperado');
    } finally {
      // Asegurar que el spinner esté oculto al final
      if (this.mostrarSpinnerGlobal) {
        this.mostrarSpinnerGlobal = false;
        this.cdr.detectChanges();
      }
    }
  }

  // Abrir modal de detalle de rutina
  async verDetalleRutina(rutina: RutinaConDetalles) {
    // Si la rutina no tiene ejercicios cargados, cargarlos
    if (!rutina.ejercicios || rutina.ejercicios.length === 0) {
      if (rutina.id) {
        const { data: ejerciciosRutina } = await this.rutinaService.obtenerEjerciciosDeRutina(rutina.id);
        rutina.ejercicios = ejerciciosRutina || [];
      }
    }
    
    this.rutinaDetalle = rutina;
    this.currentIndexCarrusel = 0; // Reset carrusel index
    
    // Usar requestAnimationFrame para mejor rendimiento
    requestAnimationFrame(() => {
      this.showModalDetalle = true;
      this.cdr.detectChanges();
    });
  }

  // Mostrar overlay spinner 1.5s y luego abrir detalle
  async verDetalleConSpinner(rutina: RutinaConDetalles) {
    this.mostrarSpinnerGlobal = true;
    this.cdr.detectChanges();
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await this.verDetalleRutina(rutina);
    } finally {
      this.mostrarSpinnerGlobal = false;
      this.cdr.detectChanges();
    }
  }

  // Cerrar modal de detalle
  cerrarModalDetalle() {
    this.showModalDetalle = false;
    this.rutinaDetalle = null;
    this.currentIndexCarrusel = 0;
  }

  // === MÉTODOS DE EJERCICIO ALTERNATIVO ===
  filtrarEjerciciosAlternativos(index: number) {
    const busqueda = this.busquedaAlternativo.get(index) || '';
    if (busqueda.trim() === '') {
      this.ejerciciosAlternativosFiltrados.set(index, this.ejerciciosDisponibles);
    } else {
      const filtrados = this.ejerciciosDisponibles.filter(ej => 
        ej.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
      this.ejerciciosAlternativosFiltrados.set(index, filtrados);
    }
    this.mostrarListaAlternativo.set(index, true);
  }

  getEjerciciosAlternativosFiltrados(index: number): any[] {
    return this.ejerciciosAlternativosFiltrados.get(index) || this.ejerciciosDisponibles;
  }

  seleccionarAlternativo(ejSel: any, ejercicio: any | null, index: number) {
    ejSel.ejercicio_alternativo_id = ejercicio?.id ?? null;
    this.busquedaAlternativo.set(index, '');
    this.mostrarListaAlternativo.set(index, false);
    this.ejerciciosAlternativosFiltrados.set(index, []);
  }

  limpiarAlternativo(ejSel: any, index: number) {
    ejSel.ejercicio_alternativo_id = null;
    this.busquedaAlternativo.set(index, '');
    this.mostrarListaAlternativo.set(index, true);
    this.ejerciciosAlternativosFiltrados.set(index, this.ejerciciosDisponibles);
  }

  getNombreEjercicio(id: number): string {
    const ejercicio = this.ejerciciosDisponibles.find(ej => ej.id === id);
    return ejercicio ? ejercicio.nombre : '';
  }

  // === MÉTODOS DE CARRUSEL ===
  onTouchStartCarrusel(event: TouchEvent) {
    this.touchStartXCarrusel = event.touches[0].clientX;
    this.isDraggingCarrusel = true;
  }

  onTouchMoveCarrusel(event: TouchEvent) {
    if (!this.isDraggingCarrusel) return;
    this.touchEndXCarrusel = event.touches[0].clientX;
  }

  onTouchEndCarrusel() {
    if (!this.isDraggingCarrusel) return;
    this.isDraggingCarrusel = false;

    const diff = this.touchStartXCarrusel - this.touchEndXCarrusel;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.siguienteEjercicioCarrusel();
      } else {
        this.anteriorEjercicioCarrusel();
      }
    }

    this.touchStartXCarrusel = 0;
    this.touchEndXCarrusel = 0;
    this.cdr.detectChanges();
  }

  anteriorEjercicioCarrusel() {
    if (this.currentIndexCarrusel > 0) {
      this.currentIndexCarrusel--;
      this.cdr.detectChanges();
    }
  }

  siguienteEjercicioCarrusel() {
    const totalEjercicios = this.rutinaDetalle?.ejercicios?.length || 0;
    if (this.currentIndexCarrusel < totalEjercicios - 1) {
      this.currentIndexCarrusel++;
      this.cdr.detectChanges();
    }
  }

  irAEjercicioCarrusel(index: number) {
    this.currentIndexCarrusel = index;
    this.cdr.detectChanges();
  }

  // Método para manejar la carga de imágenes
  onImageLoad(videoUrl: string) {
    console.log('Imagen cargada para:', videoUrl);
  }

  // === MÉTODOS PARA CARRUSEL DE EJERCICIOS EN LISTADO ===
  // Map para mantener el índice actual del carrusel de cada ejercicio
  private carouselIndices = new Map<number, number>();

  // Map para manejar touch events de cada ejercicio
  private touchStartX = new Map<number, number>();
  private touchEndX = new Map<number, number>();
  private isDragging = new Map<number, boolean>();

  /**
   * Obtiene las URLs de videos/imágenes para un ejercicio
   * Por ahora, si el ejercicio tiene enlace_video, retorna un array con ese enlace
   * En el futuro, se puede modificar para soportar múltiples enlaces
   */
  getVideoUrls(ejercicio: Ejercicio): string[] {
    const urls: string[] = [];
    
    // Agregar enlace principal si existe
    if (ejercicio.enlace_video && ejercicio.enlace_video.trim()) {
      urls.push(ejercicio.enlace_video);
    }

    // NOTA: Aquí se pueden agregar enlaces adicionales en el futuro
    // Por ejemplo, si agregamos un campo "enlaces_alternativos" al modelo:
    // if (ejercicio.enlaces_alternativos && ejercicio.enlaces_alternativos.length > 0) {
    //   urls.push(...ejercicio.enlaces_alternativos);
    // }

    return urls;
  }

  /**
   * Obtiene el índice actual del carrusel para un ejercicio específico
   */
  getCurrentCarouselIndex(ejercicioIndex: number): number {
    return this.carouselIndices.get(ejercicioIndex) || 0;
  }

  /**
   * Establece el índice del carrusel para un ejercicio específico
   */
  setCarouselIndex(ejercicioIndex: number, slideIndex: number): void {
    this.carouselIndices.set(ejercicioIndex, slideIndex);
  }

  /**
   * Avanza al siguiente slide
   */
  nextSlide(ejercicioIndex: number): void {
    const ejercicio = this.ejerciciosFiltrados[ejercicioIndex];
    if (!ejercicio) return;

    const urls = this.getVideoUrls(ejercicio);
    const currentIndex = this.getCurrentCarouselIndex(ejercicioIndex);
    
    if (currentIndex < urls.length - 1) {
      this.setCarouselIndex(ejercicioIndex, currentIndex + 1);
    } else {
      // Volver al inicio (loop)
      this.setCarouselIndex(ejercicioIndex, 0);
    }
  }

  /**
   * Retrocede al slide anterior
   */
  prevSlide(ejercicioIndex: number): void {
    const ejercicio = this.ejerciciosFiltrados[ejercicioIndex];
    if (!ejercicio) return;

    const urls = this.getVideoUrls(ejercicio);
    const currentIndex = this.getCurrentCarouselIndex(ejercicioIndex);
    
    if (currentIndex > 0) {
      this.setCarouselIndex(ejercicioIndex, currentIndex - 1);
    } else {
      // Ir al final (loop)
      this.setCarouselIndex(ejercicioIndex, urls.length - 1);
    }
  }

  /**
   * Maneja el inicio del touch event
   */
  onTouchStart(event: TouchEvent, ejercicioIndex: number): void {
    this.touchStartX.set(ejercicioIndex, event.touches[0].clientX);
    this.isDragging.set(ejercicioIndex, true);
  }

  /**
   * Maneja el movimiento del touch event
   */
  onTouchMove(event: TouchEvent, ejercicioIndex: number): void {
    if (!this.isDragging.get(ejercicioIndex)) return;
    this.touchEndX.set(ejercicioIndex, event.touches[0].clientX);
  }

  /**
   * Maneja el final del touch event y determina si hacer swipe
   */
  onTouchEnd(event: TouchEvent, ejercicioIndex: number): void {
    if (!this.isDragging.get(ejercicioIndex)) return;
    this.isDragging.set(ejercicioIndex, false);

    const startX = this.touchStartX.get(ejercicioIndex) || 0;
    const endX = this.touchEndX.get(ejercicioIndex) || 0;
    const diff = startX - endX;
    const threshold = 50; // Umbral mínimo para considerar un swipe

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left - siguiente
        this.nextSlide(ejercicioIndex);
      } else {
        // Swipe right - anterior
        this.prevSlide(ejercicioIndex);
      }
    }

    // Limpiar valores
    this.touchStartX.delete(ejercicioIndex);
    this.touchEndX.delete(ejercicioIndex);
  }

  // === MÉTODOS PARA MINI CARRUSEL DE VIDEOS EN MODAL DE DETALLE ===
  // Map para mantener el índice del video actual (0 = principal, 1 = alternativo) por ejercicio
  private videoCarouselIndices = new Map<number, number>();

  /**
   * Obtiene el índice actual del carrusel de videos para un ejercicio
   */
  getVideoCarouselIndex(ejercicioIndex: number): number {
    return this.videoCarouselIndices.get(ejercicioIndex) || 0;
  }

  /**
   * Establece el índice del carrusel de videos
   */
  setVideoCarouselIndex(ejercicioIndex: number, videoIndex: number): void {
    this.videoCarouselIndices.set(ejercicioIndex, videoIndex);
  }

  /**
   * Avanza al siguiente video (alternativo)
   */
  nextVideoSlide(ejercicioIndex: number): void {
    const currentIndex = this.getVideoCarouselIndex(ejercicioIndex);
    if (currentIndex === 0) {
      this.setVideoCarouselIndex(ejercicioIndex, 1);
    }
  }

  /**
   * Retrocede al video anterior (principal)
   */
  prevVideoSlide(ejercicioIndex: number): void {
    const currentIndex = this.getVideoCarouselIndex(ejercicioIndex);
    if (currentIndex === 1) {
      this.setVideoCarouselIndex(ejercicioIndex, 0);
    }
  }
}
