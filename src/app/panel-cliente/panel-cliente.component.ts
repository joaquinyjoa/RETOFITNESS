import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RutinaService } from '../services/rutina.service';
import { ConfirmService } from '../services/confirm.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
// removed DomSanitizer/SafeResourceUrl Google Drive helpers per request
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-panel-cliente',
  templateUrl: './panel-cliente.component.html',
  styleUrls: ['./panel-cliente.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SpinnerComponent]
})
export class PanelClienteComponent implements OnInit, ViewWillEnter {
  private router = inject(Router);
  private rutinaService = inject(RutinaService);
  private authService = inject(AuthService);
  private confirmService = inject(ConfirmService);
  private toastService = inject(ToastService);
  // sanitizer and Drive helpers removed
  private cdr = inject(ChangeDetectorRef);

  clienteId: number | null = null;
  nombreCliente: string = '';
  rutinasAsignadas: any[] = [];
  rutinasPorDia: Map<number, any> = new Map();
  diaSeleccionado: number = 1;
  rutinaAsignada: any = null;
  loading = true; // true al inicio para mostrar estado de carga
  mostrarSpinner = false; // controla el overlay animado durante recargas

  // Map para índices de mini carrusel de videos (0 = principal, 1 = alternativo)
  private videoCarouselIndices = new Map<number, number>();

  // Para registrar pesos
  showModalRegistrarPeso = false;
  ejercicioSeleccionado: any = null;
  pesosRegistrados: number[] = []; // Array de pesos, uno por serie

  // Para ver detalles del ejercicio
  showModalDetalleEjercicio = false;
  ejercicioDetalle: any = null;
  cargandoDetalle = false;

  // Caché de pesos en localStorage
  private readonly PESOS_CACHE_KEY = 'pesos_ejercicios_cache';

  async ngOnInit() {
    // Obtener información del usuario logueado
    const sesion = this.authService.obtenerSesion();
    
    if (sesion && sesion.data) {
      const clienteData = sesion.data as any;
      this.clienteId = clienteData.id;
      this.nombreCliente = clienteData.nombre || 'Cliente';
      
      await this.cargarRutinaAsignada();
    } else {
      this.toastService.mostrarError('Sesión no válida');
      this.router.navigate(['/login']);
    }
  }

  async cargarRutinaAsignada() {
    try {
      if (!this.clienteId) {
        console.error('❌ No hay cliente ID');
        return;
      }

      // Mostrar spinner y limpiar datos actuales para forzar recarga completa
      this.mostrarSpinner = true;
      this.rutinasAsignadas = [];
      this.rutinasPorDia.clear();
      this.rutinaAsignada = null;
      this.cdr.detectChanges();

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Ejecutar carga y garantizar mínimo 1.5s de spinner visible
      const cargaPromise = (async () => {
        // CAMBIO: Usar el método que carga ejercicios personalizados del cliente
        const { data, error } = await this.rutinaService.obtenerRutinasClienteConEjercicios(this.clienteId!);

        if (error) {
          console.error('❌ Error al cargar rutinas:', error);
          this.toastService.mostrarError('Error al cargar rutinas');
          return;
        }

        if (data && data.length > 0) {
          // Crear mapa por día con ejercicios personalizados ya incluidos
          const nuevoMap = new Map<number, any>();
          const nuevasRutinas: any[] = data;

          for (const rutina of data) {
            const dia = rutina.dia_semana || 1;
            if (!nuevoMap.has(dia)) {
              // Los ejercicios personalizados ya vienen en rutina.ejercicios
              nuevoMap.set(dia, {
                ...rutina,
                detalles: {
                  ...rutina.rutina,
                  ejercicios: rutina.ejercicios // Ejercicios personalizados del cliente
                }
              });
            }
          }

          // Reemplazar datos cuando todo esté listo
          this.rutinasAsignadas = nuevasRutinas;
          this.rutinasPorDia = nuevoMap;

          // Mantener día seleccionado si existe, sino ir a día 1
          if (!this.rutinasPorDia.has(this.diaSeleccionado)) {
            this.seleccionarDia(1);
          } else {
            this.rutinaAsignada = this.rutinasPorDia.get(this.diaSeleccionado) || null;
            if (this.rutinaAsignada) {
              this.cargarPesosDesdeCache();
            }
          }
        } else {
          this.rutinaAsignada = null;
          this.rutinasAsignadas = [];
          this.rutinasPorDia.clear();
        }
      })();

      await Promise.all([cargaPromise, delay(500)]);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ [PanelCliente] Error:', error);
      this.toastService.mostrarError('Error al cargar tu rutina');
    } finally {
      this.mostrarSpinner = false;
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // Recargar datos cuando la vista entra en foco (volver desde otra pantalla)
  ionViewWillEnter(): void {
    // No await here so Ionic lifecycle isn't blocked, but trigger reload
    this.cargarRutinaAsignada().catch(err => console.error('[PanelCliente] ionViewWillEnter error', err));
  }

  seleccionarDia(dia: number) {
    this.diaSeleccionado = dia;
    this.rutinaAsignada = this.rutinasPorDia.get(dia) || null;
    
    if (this.rutinaAsignada) {
      // Cargar pesos desde caché
      this.cargarPesosDesdeCache();
    }
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
    this.ejercicioSeleccionado = ejercicio;
    
    // Cargar pesos guardados o inicializar array vacío
    const pesosGuardados = this.obtenerPesosCache();
    const cacheEjercicio = pesosGuardados[ejercicio.ejercicio_id];
    
    if (cacheEjercicio && Array.isArray(cacheEjercicio.pesos)) {
      this.pesosRegistrados = [...cacheEjercicio.pesos];
    } else {
      this.pesosRegistrados = [];
    }
    
    this.showModalRegistrarPeso = true;
  }

  async abrirModalDetalleEjercicio(ejercicio: any, ejercicioIndex: number) {
    this.showModalDetalleEjercicio = true;
    this.cargandoDetalle = true;
    this.ejercicioDetalle = null;
    this.cdr.detectChanges();

    try {
      // Determinar si debe cargar el ejercicio principal o alternativo
      const videoIndex = this.getVideoCarouselIndex(ejercicioIndex);
      const esAlternativo = videoIndex === 1 && ejercicio.ejercicio_alternativo;
      
      let ejercicioId: number | undefined;
      
      if (esAlternativo) {
        // Cargar ejercicio alternativo
        ejercicioId = ejercicio.ejercicio_alternativo_id || ejercicio.ejercicio_alternativo?.id;
        console.log('📋 Cargando ejercicio alternativo ID:', ejercicioId);
      } else {
        // Cargar ejercicio principal
        ejercicioId = ejercicio.ejercicio_id || ejercicio.ejercicio?.id;
        console.log('📋 Cargando ejercicio principal ID:', ejercicioId);
      }

      if (!ejercicioId) {
        console.warn('⚠️ No se pudo determinar el ID del ejercicio');
        await this.toastService.mostrarError('No se pudo cargar el ejercicio');
        this.cargandoDetalle = false;
        this.cdr.detectChanges();
        return;
      }

      // Ejecutar carga y delay de 1.5s en paralelo
      const [resultado] = await Promise.all([
        this.rutinaService.obtenerEjercicioPorId(ejercicioId),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);

      const { data, error } = resultado;

      if (data && !error) {
        this.ejercicioDetalle = data;
        console.log('✅ Ejercicio cargado:', data.nombre);
      } else {
        console.error('❌ Error al obtener ejercicio:', error);
        await this.toastService.mostrarError('Error al cargar detalles del ejercicio');
      }
    } catch (error) {
      console.error('💥 Error inesperado en abrirModalDetalleEjercicio:', error);
      await this.toastService.mostrarError('Error inesperado al cargar ejercicio');
    } finally {
      this.cargandoDetalle = false;
      this.cdr.detectChanges();
      console.log('🔄 Spinner ocultado, cargandoDetalle:', this.cargandoDetalle);
    }
  }

  cerrarModalDetalleEjercicio() {
    this.showModalDetalleEjercicio = false;
    this.ejercicioDetalle = null;
  }

  cerrarModalRegistrarPeso() {
    this.showModalRegistrarPeso = false;
    this.ejercicioSeleccionado = null;
    this.pesosRegistrados = [];
  }

  async guardarPeso() {
    if (!this.ejercicioSeleccionado) {
      this.toastService.mostrarError('No hay ejercicio seleccionado');
      return;
    }

    // Validar que haya al menos un peso registrado
    const pesosValidos = this.pesosRegistrados.filter(p => p !== null && p !== undefined && p > 0);
    if (pesosValidos.length === 0) {
      this.toastService.mostrarError('Debe registrar al menos el peso de una serie');
      return;
    }

    // Actualizar localmente
    this.ejercicioSeleccionado.pesos_registrados = [...this.pesosRegistrados];
    
    // Guardar en caché (localStorage)
    this.guardarPesoEnCache(this.ejercicioSeleccionado.ejercicio_id, this.pesosRegistrados);
    
    // Cerrar modal primero
    this.cerrarModalRegistrarPeso();
    
    // Mostrar toast después de cerrar el modal
    await this.toastService.mostrarExito(`${pesosValidos.length} serie(s) registrada(s) correctamente`);
  }

  // Guardar peso en localStorage
  private guardarPesoEnCache(ejercicioId: number, pesos: number[]) {
    try {
      const cacheKey = `${this.PESOS_CACHE_KEY}_${this.clienteId}`;
      const pesosGuardados = this.obtenerPesosCache();
      
      pesosGuardados[ejercicioId] = {
        pesos: pesos,
        fecha: new Date().toISOString()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(pesosGuardados));
    } catch (error) {
      console.error('❌ Error al guardar peso en caché:', error);
    }
  }
  // Agregar nueva serie de peso
  agregarSeriePeso() {
    if (!this.ejercicioSeleccionado) return;
    
    const maxSeries = this.ejercicioSeleccionado.series || 3;
    
    if (this.pesosRegistrados.length >= maxSeries) {
      this.toastService.mostrarAdvertencia(`Máximo ${maxSeries} series permitidas`);
      return;
    }
    
    this.pesosRegistrados.push(0);
  }

  // Eliminar serie de peso
  eliminarSeriePeso(index: number) {
    this.pesosRegistrados.splice(index, 1);
  }

  // Verificar si se puede agregar más series
  puedaAgregarSerie(): boolean {
    if (!this.ejercicioSeleccionado) return false;
    const maxSeries = this.ejercicioSeleccionado.series || 3;
    return this.pesosRegistrados.length < maxSeries;
  }

  // TrackBy para evitar recreación de inputs al escribir
  trackByIndex(index: number): number {
    return index;
  }
  // Obtener pesos del caché
  private obtenerPesosCache(): { [key: number]: { peso?: number, pesos?: number[], fecha: string } } {
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

    this.rutinaAsignada.detalles.ejercicios.forEach((ejercicio: any) => {
      const ejercicioId = ejercicio.ejercicio_id;
      if (pesosCache[ejercicioId]) {
        ejercicio.peso_registrado = pesosCache[ejercicioId].peso;
      }
    });
  }

  // === MÉTODOS PARA MINI CARRUSEL DE VIDEOS (Principal/Alternativo) ===
  /**
   * Obtiene el índice actual del carrusel de videos para un ejercicio (0 = principal, 1 = alternativo)
   */
  getVideoCarouselIndex(ejercicioIndex: number): number {
    return this.videoCarouselIndices.get(ejercicioIndex) || 0;
  }

  /**
   * Establece el índice del carrusel de videos
   */
  setVideoCarouselIndex(ejercicioIndex: number, videoIndex: number): void {
    this.videoCarouselIndices.set(ejercicioIndex, videoIndex);
    this.cdr.detectChanges();
  }

  // actualizarPesoSerie removed - now using [(ngModel)] for better UX

  irAModificarPerfil() {
    this.router.navigate(['/modificar-cliente']);
  }

  async logout() {
    const ok = await this.confirmService.confirmExit('¿Deseas cerrar sesión y salir de la cuenta?', 'Cerrar sesión');
    if (!ok) return;

    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  // ============================================
  // FUNCIONES PARA MANEJO DE GIFs Y VIDEOS
  // ============================================

  // Obtener URL directa para imagen desde Google Drive (con soporte para GIFs animados)
  getDirectImageUrl(url: string): string {
    if (!url) return '';

    const lower = url.toLowerCase();

    // Si no es Google Drive, devolver la URL tal cual
    if (!lower.includes('drive.google.com')) {
      return url;
    }

    // Extraer fileId de Drive (https://drive.google.com/file/d/FILE_ID/... o ?id=FILE_ID)
    const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const fileId = m1 ? m1[1] : (m2 ? m2[1] : null);

    if (!fileId) return url; // fallback

    // Si parece GIF (extensión o palabra gif en la url), usar lh3 endpoint que sirve GIFs
    if (lower.includes('.gif') || !/\.[a-z0-9]{2,5}(\?|$)/.test(lower)) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    // Para imágenes normales, usar la URL de visualización
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Determina si la URL parece apuntar a una imagen (extensiones comunes)
  isImageUrl(url: string | undefined | null): boolean {
    if (!url) return false;
    const path = url.split('?')[0].toLowerCase();
    if (/\.(gif|png|jpe?g|webp|bmp|svg)$/.test(path)) return true;
    // Consider Google Drive links without extension as images (helps GIFs stored in Drive)
    if (path.includes('drive.google.com')) return true;
    return false;
  }

  // Función auxiliar para detectar si es probable que sea un GIF
  private isLikelyGif(url: string): boolean {
    return url ? url.toLowerCase().includes('gif') : false;
  }

  // Obtener URL para video desde Google Drive (usando embed)
  getDirectVideoUrl(url: string): string {
    // Google Drive handling removed; return raw URL
    return url || '';
  }

  // Google Drive helpers removed to simplify URL handling; templates use raw enlace_video
}

