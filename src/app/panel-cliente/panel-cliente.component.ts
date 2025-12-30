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
  rutinaAsignada: any = null;
  loading = true;

  // Para registrar pesos
  showModalRegistrarPeso = false;
  ejercicioSeleccionado: any = null;
  pesoRegistrado: number | null = null;

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
        
        // Obtener la rutina activa o la más reciente
        const rutinaActiva = data.find((r: any) => r.estado === 'en_progreso') || data[0];
        console.log('🟢 [PanelCliente] Rutina activa:', rutinaActiva);

        // Obtener los detalles completos de la rutina
        const { data: rutinaDetalle } = await this.rutinaService.obtenerRutinaPorId(rutinaActiva.rutina_id);
        console.log('🟢 [PanelCliente] Detalles de rutina:', rutinaDetalle);

        this.rutinaAsignada = {
          ...rutinaActiva,
          detalles: rutinaDetalle
        };
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
    
    await this.toastService.mostrarExito('Peso registrado correctamente');
    this.cerrarModalRegistrarPeso();
  }

  logout() {
    console.log('👋 Cerrando sesión...');
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}

