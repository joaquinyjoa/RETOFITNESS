import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RutinaService } from '../services/rutina.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-panel-cliente',
  templateUrl: './panel-cliente.component.html',
  styleUrls: ['./panel-cliente.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class PanelClienteComponent implements OnInit {
  private router = inject(Router);
  private rutinaService = inject(RutinaService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  clienteId: number | null = null;
  nombreCliente: string = '';
  rutinasAsignadas: any[] = [];
  rutinasPorDia: Map<number, any> = new Map();
  diaSeleccionado: number = 1;
  rutinaAsignada: any = null;
  loading = false;

  // Para registrar pesos
  showModalRegistrarPeso = false;
  ejercicioSeleccionado: any = null;
  pesoRegistrado: number | null = null;

  // Para ver detalles del ejercicio
  showModalDetalleEjercicio = false;
  ejercicioDetalle: any = null;
  cargandoDetalle = false;

  // Caché de pesos en localStorage
  private readonly PESOS_CACHE_KEY = 'pesos_ejercicios_cache';

  async ngOnInit() {
    console.log('🚀 [PanelCliente] Inicializando...');
    
    // Obtener información del usuario logueado
    const sesion = this.authService.obtenerSesion();
    
    if (sesion && sesion.data) {
      const clienteData = sesion.data as any;
      this.clienteId = clienteData.id;
      this.nombreCliente = clienteData.nombre || 'Cliente';
      console.log('👤 Cliente ID:', this.clienteId);
      
      await this.cargarRutinaAsignada();
    } else {
      console.error('❌ No hay sesión activa');
      this.toastService.mostrarError('Sesión no válida');
      this.router.navigate(['/login']);
    }
  }

  async cargarRutinaAsignada() {
    console.log('🟡 [PanelCliente] === INICIO cargarRutinaAsignada ===');

    try {
      if (!this.clienteId) {
        console.error('❌ No hay cliente ID');
        return;
      }

      console.log('🟡 [PanelCliente] Cargando rutinas del cliente...');
      const tiempoInicio = performance.now();

      // Limpiar caché y datos antiguos
      this.rutinasPorDia.clear();
      this.rutinasAsignadas = [];

      const { data, error } = await this.rutinaService.obtenerRutinasDeCliente(this.clienteId);

      const tiempoFin = performance.now();
      console.log(`🟢 [PanelCliente] Rutinas cargadas en ${(tiempoFin - tiempoInicio).toFixed(2)}ms`);

      if (error) {
        console.error('❌ Error al cargar rutinas:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('🟢 [PanelCliente] Rutinas encontradas:', data.length);
        
        this.rutinasAsignadas = data;
        
        // Organizar rutinas por día
        this.rutinasPorDia.clear();
        for (const rutina of data) {
          const dia = rutina.dia_semana || 1; // Default día 1 si no tiene
          if (!this.rutinasPorDia.has(dia)) {
            // Obtener detalles completos de la rutina
            const { data: rutinaDetalle } = await this.rutinaService.obtenerRutinaPorId(rutina.rutina_id);
            this.rutinasPorDia.set(dia, {
              ...rutina,
              detalles: rutinaDetalle
            });
          }
        }

        // Seleccionar rutina del día 1 por defecto
        this.seleccionarDia(1);
      } else {
        console.log('⚠️ [PanelCliente] No hay rutinas asignadas');
        this.rutinaAsignada = null;
      }
    } catch (error) {
      console.error('❌ [PanelCliente] Error:', error);
      this.toastService.mostrarError('Error al cargar tu rutina');
    } finally {
      console.log('🟡 [PanelCliente] Desactivando spinner...');
      this.loading = false;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }, 0);
      
      console.log('🟡 [PanelCliente] === FIN cargarRutinaAsignada ===\n');
    }
  }

  seleccionarDia(dia: number) {
    this.diaSeleccionado = dia;
    this.rutinaAsignada = this.rutinasPorDia.get(dia) || null;
    
    if (this.rutinaAsignada) {
      // Cargar pesos desde caché
      this.cargarPesosDesdeCache();
    }
    
    console.log(`📅 Día ${dia} seleccionado`, this.rutinaAsignada);
  }

  get diasDisponibles(): number[] {
    return Array.from(this.rutinasPorDia.keys()).sort((a, b) => a - b);
  }

  getNombreDia(dia: number): string {
    const nombres = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return nombres[dia] || `Día ${dia}`;
  }

  getNivelLabel(nivel: string): string {
    const niveles: { [key: string]: string } = {
      'principiante': 'Principiante',
      'intermedio': 'Intermedio',
      'avanzado': 'Avanzado'
    };
    return niveles[nivel] || nivel;
  }

  abrirModalRegistrarPeso(ejercicio: any) {
    console.log('📝 Abriendo modal para registrar peso:', ejercicio);
    this.ejercicioSeleccionado = ejercicio;
    this.pesoRegistrado = ejercicio.peso_registrado || null;
    this.showModalRegistrarPeso = true;
  }

  async abrirModalDetalleEjercicio(ejercicio: any) {
    console.log('🔍 Abriendo detalles del ejercicio:', ejercicio);
    this.showModalDetalleEjercicio = true;
    this.cargandoDetalle = true;
    this.ejercicioDetalle = null;

    try {
      if (ejercicio.ejercicio_id || ejercicio.ejercicio?.id) {
        const ejercicioId = ejercicio.ejercicio_id || ejercicio.ejercicio.id;
        console.log('📡 Obteniendo ejercicio ID:', ejercicioId);

        const { data, error } = await this.rutinaService.obtenerEjercicioPorId(ejercicioId);

        if (data && !error) {
          console.log('✅ Ejercicio obtenido:', data);
          this.ejercicioDetalle = data;
        } else {
          console.error('❌ Error al obtener ejercicio:', error);
          this.toastService.mostrarError('Error al cargar detalles del ejercicio');
        }
      } else {
        console.warn('⚠️ No se pudo determinar el ID del ejercicio');
        this.toastService.mostrarError('No se pudo cargar el ejercicio');
      }
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      this.toastService.mostrarError('Error inesperado al cargar ejercicio');
    } finally {
      console.log('🔄 Desactivando spinner...');
      this.cargandoDetalle = false;
      this.cdr.detectChanges();
    }
  }

  cerrarModalDetalleEjercicio() {
    this.showModalDetalleEjercicio = false;
    this.ejercicioDetalle = null;
  }

  cerrarModalRegistrarPeso() {
    this.showModalRegistrarPeso = false;
    this.ejercicioSeleccionado = null;
    this.pesoRegistrado = null;
  }

  async guardarPeso() {
    if (!this.ejercicioSeleccionado || this.pesoRegistrado === null) {
      this.toastService.mostrarError('Debe ingresar un peso válido');
      return;
    }

    console.log('💾 Guardando peso:', this.pesoRegistrado, 'kg para ejercicio:', this.ejercicioSeleccionado);
    
    // Actualizar localmente
    this.ejercicioSeleccionado.peso_registrado = this.pesoRegistrado;
    
    // Guardar en caché (localStorage)
    this.guardarPesoEnCache(this.ejercicioSeleccionado.ejercicio_id, this.pesoRegistrado);
    
    // Cerrar modal primero
    this.cerrarModalRegistrarPeso();
    
    // Mostrar toast después de cerrar el modal
    await this.toastService.mostrarExito('Peso registrado correctamente');
  }

  // Guardar peso en localStorage
  private guardarPesoEnCache(ejercicioId: number, peso: number) {
    try {
      const cacheKey = `${this.PESOS_CACHE_KEY}_${this.clienteId}`;
      const pesosGuardados = this.obtenerPesosCache();
      
      pesosGuardados[ejercicioId] = {
        peso: peso,
        fecha: new Date().toISOString()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(pesosGuardados));
      console.log('✅ Peso guardado en caché:', ejercicioId, '=', peso, 'kg');
    } catch (error) {
      console.error('❌ Error al guardar peso en caché:', error);
    }
  }

  // Obtener pesos del caché
  private obtenerPesosCache(): { [key: number]: { peso: number, fecha: string } } {
    try {
      const cacheKey = `${this.PESOS_CACHE_KEY}_${this.clienteId}`;
      const cache = localStorage.getItem(cacheKey);
      return cache ? JSON.parse(cache) : {};
    } catch (error) {
      console.error('❌ Error al leer caché de pesos:', error);
      return {};
    }
  }

  // Cargar pesos desde caché a la rutina
  private cargarPesosDesdeCache() {
    if (!this.rutinaAsignada?.detalles?.ejercicios) return;

    const pesosCache = this.obtenerPesosCache();
    console.log('📦 Pesos en caché:', pesosCache);

    this.rutinaAsignada.detalles.ejercicios.forEach((ejercicio: any) => {
      const ejercicioId = ejercicio.ejercicio_id;
      if (pesosCache[ejercicioId]) {
        ejercicio.peso_registrado = pesosCache[ejercicioId].peso;
        console.log('✅ Peso recuperado para ejercicio', ejercicioId, ':', ejercicio.peso_registrado, 'kg');
      }
    });
  }

  logout() {
    console.log('👋 Cerrando sesión...');
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  // ============================================
  // FUNCIONES PARA MANEJO DE GIFs Y VIDEOS
  // ============================================

  // Obtener URL directa para imagen desde Google Drive (con soporte para GIFs animados)
  getDirectImageUrl(url: string): string {
    if (!url) return '';

    console.log('🎨 getDirectImageUrl - URL original:', url);

    // Extraer el ID del archivo de Google Drive
    let fileId = '';

    // Patrón para URLs como: https://drive.google.com/file/d/FILE_ID/view
    const patronId = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (patronId) {
      fileId = patronId[1];
      console.log('🎨 File ID extraído:', fileId);

      // Para GIFs, intentar diferentes URLs
      if (url.toLowerCase().includes('.gif') || this.isLikelyGif(url)) {
        console.log('🎨 Detectado como GIF, usando URL especial de Google');
        // URL alternativa que podría funcionar mejor para GIFs
        return `https://lh3.googleusercontent.com/d/${fileId}`;
      }

      // Para otras imágenes, usar la URL de vista
      console.log('🎨 Usando URL de vista para imagen normal');
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    // Patrón para URLs como: https://drive.google.com/open?id=FILE_ID
    const patronOpen = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (patronOpen) {
      fileId = patronOpen[1];
      console.log('🎨 File ID extraído (open):', fileId);

      if (url.toLowerCase().includes('.gif') || this.isLikelyGif(url)) {
        console.log('🎨 Detectado como GIF (open), usando URL especial de Google');
        return `https://lh3.googleusercontent.com/d/${fileId}`;
      }
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    console.log('🎨 No se pudo extraer ID, devolviendo URL original');
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
    console.log('🔍 isImageUrl - URL:', url);

    // Extensiones de imagen/GIF
    if (/\.(gif|png|jpe?g|webp)$/.test(lower)) {
      console.log('🔍 Detectado como imagen por extensión');
      return true;
    }

    // URLs ya procesadas de Drive
    if (lower.includes('uc?export=view') || lower.includes('export=download') || lower.includes('thumbnail')) {
      console.log('🔍 Detectado como imagen por URL procesada');
      return true;
    }

    // Para Google Drive: si NO es claramente un video, asumir que es imagen/GIF
    if (lower.includes('drive.google.com') && !this.isVideoFile(url)) {
      console.log('🔍 Detectado como imagen por ser Google Drive no-video');
      return true;
    }

    console.log('🔍 No detectado como imagen');
    return false;
  }

  isVideoUrl(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    console.log('🎥 isVideoUrl - URL:', url);

    // Extensiones de video
    if (/\.(mp4|mov|avi|webm|m4v|flv|wmv|mkv)$/.test(lower)) {
      console.log('🎥 Detectado como video por extensión');
      return true;
    }

    // URLs de embed de Google Drive (que son para videos)
    if (lower.includes('drive.google.com') && lower.includes('/preview')) {
      console.log('🎥 Detectado como video por URL de embed');
      return true;
    }

    // Para Google Drive: si NO es imagen, asumir que es video
    if (lower.includes('drive.google.com') && !this.isImageFile(url)) {
      console.log('🎥 Detectado como video por ser Google Drive no-imagen');
      return true;
    }

    console.log('🎥 No detectado como video');
    return false;
  }

  // Función auxiliar para determinar si es archivo de imagen
  private isImageFile(url: string): boolean {
    const lower = url.toLowerCase();
    return /\.(gif|png|jpe?g|webp|bmp|tiff?|svg)$/.test(lower) ||
           lower.includes('uc?export=view') ||
           lower.includes('thumbnail');
  }

  // Función auxiliar para determinar si es archivo de video
  private isVideoFile(url: string): boolean {
    const lower = url.toLowerCase();
    return /\.(mp4|mov|avi|webm|m4v|flv|wmv|mkv)$/.test(lower) ||
           (lower.includes('drive.google.com') && lower.includes('/preview'));
  }

  // Obtener URL de embed para video
  getVideoEmbedUrl(url: string): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');

    const embedUrl = this.getDirectVideoUrl(url);
    console.log('🎬 getVideoEmbedUrl - URL original:', url, '-> Embed:', embedUrl);

    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}

