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
  loading = true;

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
    this.loading = true;
    this.cdr.detectChanges();

    try {
      if (!this.clienteId) {
        console.error('❌ No hay cliente ID');
        return;
      }

      console.log('🟡 [PanelCliente] Cargando rutinas del cliente...');
      const tiempoInicio = performance.now();

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

  getSafeUrl(url: string): SafeResourceUrl {
    if (!url) return '';
    
    let videoId = '';
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) {
        videoId = match[1];
        const embedUrl = `https://drive.google.com/file/d/${videoId}/preview`;
        return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
      }
    }
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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

    if (ejercicio.ejercicio_id || ejercicio.ejercicio?.id) {
      const ejercicioId = ejercicio.ejercicio_id || ejercicio.ejercicio.id;
      const { data, error } = await this.rutinaService.obtenerEjercicioPorId(ejercicioId);
      
      if (data && !error) {
        this.ejercicioDetalle = data;
      } else {
        this.toastService.mostrarError('Error al cargar detalles del ejercicio');
      }
    }

    this.cargandoDetalle = false;
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
}

