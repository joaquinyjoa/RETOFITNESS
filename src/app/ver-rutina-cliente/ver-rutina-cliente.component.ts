import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  IonSpinner,
  IonChip,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  AlertController
} from '@ionic/angular/standalone';
import { RutinaService } from '../services/rutina.service';
import { ClienteService } from '../services/cliente.service';
import { EjercicioService } from '../services/ejercicio.service';
import { ToastService } from '../services/toast.service';
import { ConfirmService } from '../services/confirm.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-ver-rutina-cliente',
  templateUrl: './ver-rutina-cliente.component.html',
  styleUrls: ['./ver-rutina-cliente.component.scss'],
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
    IonSpinner,
    IonChip,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonBadge,
    SpinnerComponent
  ]
})
export class VerRutinaClienteComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private rutinaService = inject(RutinaService);
  private clienteService = inject(ClienteService);
  private ejercicioService = inject(EjercicioService);
  private toastService = inject(ToastService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private alertController = inject(AlertController);
  private confirmService = inject(ConfirmService);

  clienteId: number | null = null;
  cliente: any = null;
  rutinasAsignadas: any[] = [];
  rutinasFiltradasPorDia: any[] = []; // Rutinas filtradas por el día seleccionado
  loading = true;
  mostrarSpinner = false;
  diaSeleccionado: number = 0; // 0 = todos, 1-6 = días específicos
  diasDisponibles: number[] = []; // Días que tienen rutinas asignadas
  
  // Modal de cambio de ejercicio
  showModalCambiarEjercicio = false;
  ejercicioACambiar: any = null;
  rutinaClienteActual: any = null;
  ejerciciosDisponibles: any[] = [];
  ejerciciosDisponiblesFiltrados: any[] = [];
  filtroEjercicio = '';
  cargandoEjercicios = false;
  cambiandoEjercicio = false;

  // Mapeo de días
  diasSemana: { [key: number]: string } = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
  };

  // Índices de carrusel por rutina (para mantener el estado independiente)
  carouselIndices: Map<number, number> = new Map();

  // Map para índices de mini carrusel de videos (0 = principal, 1 = alternativo)
  // Key: "rutinaId-ejercicioIndex"
  private videoCarouselIndices = new Map<string, number>();

  // Variables para gestos táctiles
  touchStartX: Map<number, number> = new Map();
  currentTranslateX: Map<number, number> = new Map();
  dragging: Map<number, boolean> = new Map();

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
    this.cdr.detectChanges();
    
    try {
      // Cargar información del cliente
      if (this.clienteId) {
        const tiempoInicio = performance.now();
        
        this.cliente = await this.clienteService.obtenerClientePorId(this.clienteId);
        
        // Cargar TODAS las rutinas del cliente con ejercicios personalizados
        const { data, error } = await this.rutinaService.obtenerRutinasClienteConEjercicios(this.clienteId);
        
        if (!error && data && data.length > 0) {
          
          // Ordenar por día de semana
          this.rutinasAsignadas = data.sort((a: any, b: any) => {
            return (a.dia_semana || 0) - (b.dia_semana || 0);
          });
          
          // Obtener días disponibles
          this.diasDisponibles = [...new Set(this.rutinasAsignadas.map(r => r.dia_semana))].sort();
          
          // Por defecto mostrar "Todos"
          this.diaSeleccionado = 0;
          this.filtrarPorDia();
          
        } else {
          this.rutinasAsignadas = [];
          this.diasDisponibles = [];
        }
        
        const tiempoFin = performance.now();
        const duracion = (tiempoFin - tiempoInicio).toFixed(2);
      }
    } catch (error) {
      console.error('🔴 [VerRutinaCliente] Error al cargar datos:', error);
    } finally {
      this.loading = false;
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
      
      // Timeout adicional para asegurar que la UI se actualice
      setTimeout(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }, 0);
    }
  }

  getSafeUrl(url: string): SafeResourceUrl {
    if (!url) return '';
    
    // Convertir URL de Google Drive a formato embed
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

  // Obtener URL directa de imagen/GIF desde Google Drive
  getDirectImageUrl(url: string): string {
    if (!url) return '';

    // Extraer el ID del archivo de Google Drive
    const patronId = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (patronId) {
      const fileId = patronId[1];
      // Para GIFs, usar la URL especial de Google que preserva animación
      if (url.toLowerCase().includes('.gif') || this.isLikelyGif(url)) {
        return `https://lh3.googleusercontent.com/d/${fileId}`;
      }
      // Para otras imágenes, usar la URL de vista que funciona mejor
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    const patronOpen = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (patronOpen) {
      const fileId = patronOpen[1];
      if (url.toLowerCase().includes('.gif') || this.isLikelyGif(url)) {
        return `https://lh3.googleusercontent.com/d/${fileId}`;
      }
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

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

  isImageUrl(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    if (/\.(gif|png|jpe?g|webp)$/.test(lower)) return true;
    // Si ya está en formato directo de Drive que devuelve la imagen
    if (lower.includes('uc?export=view') || lower.includes('export=download') || lower.includes('thumbnail')) return true;
    // Para Google Drive: si NO es claramente un video, asumir que es imagen/GIF
    if (lower.includes('drive.google.com') && !this.isVideoFile(url)) return true;
    return false;
  }

  isVideoUrl(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    // Extensiones comunes de video
    if (/\.(mp4|webm|mov|mkv|ogg|avi)$/.test(lower)) return true;
    // Si ya es una URL directa de contenido de Drive
    if (lower.includes('uc?export=download') || lower.includes('webcontent') || lower.includes('export=download')) return true;
    // Solo para Google Drive: si es claramente un archivo de video
    if (lower.includes('drive.google.com') && this.isVideoFile(url)) return true;
    return false;
  }

  // Función auxiliar para detectar archivos de video por extensión
  private isVideoFile(url: string): boolean {
    const lower = url.toLowerCase();
    return /\.(mp4|webm|mov|mkv|ogg|avi|m4v|3gp|flv|wmv)$/.test(lower);
  }

  // Obtener URL directa reproducible para video desde Google Drive
  getDirectMediaUrl(url: string): string {
    // Para videos, usar la URL de embed que permite reproducción
    return this.getDirectVideoUrl(url);
  }

  getNivelLabel(nivel: string): string {
    const niveles: { [key: string]: string } = {
      'principiante': 'Principiante',
      'intermedio': 'Intermedio',
      'avanzado': 'Avanzado'
    };
    return niveles[nivel] || nivel;
  }

  goBack() {
    this.router.navigate(['/ver-clientes'], { replaceUrl: true });
  }

  // Asignar nueva rutina
  asignarNuevaRutina() {
    if (!this.clienteId) return;

    // Validar máximo de 6 rutinas
    if (this.rutinasAsignadas.length >= 6) {
      this.alertController.create({
        header: 'Máximo de rutinas alcanzado',
        message: 'Este cliente ya tiene 6 rutinas asignadas (una por cada día de Lunes a Sábado). No se pueden asignar más rutinas.',
        buttons: ['OK']
      }).then(alert => alert.present());
      return;
    }

    this.router.navigate(['/asignar-rutina-cliente-seleccionado', this.clienteId]);
  }

  async eliminarRutinaAsignada(rutinaCliente: any) {
    const header = '¿Eliminar rutina?';
    const message = `Se eliminará la rutina "${rutinaCliente.rutina?.nombre}" del ${this.diasSemana[rutinaCliente.dia_semana]}.`;
    const confirm = await this.confirmService.confirm(message, header, 'Eliminar');

    if (!confirm) return;

    // Pequeño delay para asegurar cierre de diálogo
    await new Promise(resolve => setTimeout(resolve, 100));

    this.mostrarSpinner = true;
    this.cdr.detectChanges();

    try {
      // Ejecutar eliminación y delay en paralelo
      const [resultado] = await Promise.all([
        this.rutinaService.desasignarRutinaDeCliente(rutinaCliente.id),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);

      // Ocultar spinner primero
      this.mostrarSpinner = false;
      this.cdr.detectChanges();

      if (resultado.success) {
        // Actualizar la vista inmediatamente
        this.rutinasAsignadas = this.rutinasAsignadas.filter(r => r.id !== rutinaCliente.id);
        this.diasDisponibles = [...new Set(this.rutinasAsignadas.map(r => r.dia_semana))].sort();
        this.filtrarPorDia();
        this.cdr.detectChanges();

        // Mostrar toast después de actualizar la vista
        this.toastService.mostrarExito('Rutina eliminada correctamente');
      } else {
        console.error('Error al eliminar rutina:', resultado.error);
        this.toastService.mostrarError('Error al eliminar la rutina');
      }
    } catch (error) {
      console.error('Error inesperado al eliminar rutina:', error);
      this.toastService.mostrarError('Error inesperado al eliminar la rutina');
      this.mostrarSpinner = false;
      this.cdr.detectChanges();
    }
  }

  async cambiarEjercicio(rutinaCliente: any, ejercicioPersonalizado: any) {
    // Navegar al componente de configuración
    if (this.clienteId) {
      this.router.navigate(['/configurar-ejercicio', ejercicioPersonalizado.id, this.clienteId]);
    }
  }

  filtrarEjercicios() {
    const filtro = this.filtroEjercicio.toLowerCase().trim();
    
    if (!filtro) {
      this.ejerciciosDisponiblesFiltrados = [...this.ejerciciosDisponibles];
    } else {
      this.ejerciciosDisponiblesFiltrados = this.ejerciciosDisponibles.filter(ej => 
        ej.nombre?.toLowerCase().includes(filtro) ||
        ej.musculo_principal?.toLowerCase().includes(filtro) ||
        ej.categoria?.toLowerCase().includes(filtro)
      );
    }
  }

  async seleccionarNuevoEjercicio(nuevoEjercicio: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar cambio',
      message: `¿Cambiar "${this.ejercicioACambiar.ejercicio?.nombre}" por "${nuevoEjercicio.nombre}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cambiar',
          role: 'confirm'
        }
      ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();

    if (role !== 'confirm') return;

    // Mostrar spinner
    this.cambiandoEjercicio = true;
    this.cdr.detectChanges();

    try {
      const { success, error } = await this.rutinaService.cambiarEjercicioPersonalizado(
        this.ejercicioACambiar.id,
        nuevoEjercicio.id
      );

      if (success) {
        // Actualizar localmente
        this.ejercicioACambiar.ejercicio = nuevoEjercicio;
        this.ejercicioACambiar.ejercicio_id = nuevoEjercicio.id;
        
        this.cerrarModalCambiarEjercicio();
        this.cdr.detectChanges();

        const successAlert = await this.alertController.create({
          header: 'Éxito',
          message: 'Ejercicio cambiado correctamente',
          buttons: ['OK']
        });
        await successAlert.present();
      } else {
        console.error('Error al cambiar ejercicio:', error);
        const errorAlert = await this.alertController.create({
          header: 'Error',
          message: 'Error al cambiar el ejercicio',
          buttons: ['OK']
        });
        await errorAlert.present();
      }
    } catch (error) {
      console.error('Error inesperado al cambiar ejercicio:', error);
      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: 'Error inesperado al cambiar el ejercicio',
        buttons: ['OK']
      });
      await errorAlert.present();
    } finally {
      // Ocultar spinner
      this.cambiandoEjercicio = false;
      this.cdr.detectChanges();
    }
  }

  cerrarModalCambiarEjercicio() {
    this.showModalCambiarEjercicio = false;
    this.ejercicioACambiar = null;
    this.rutinaClienteActual = null;
    this.ejerciciosDisponibles = [];
    this.ejerciciosDisponiblesFiltrados = [];
    this.filtroEjercicio = '';
    this.cambiandoEjercicio = false;
  }

  cambiarDia(event: any) {
    this.diaSeleccionado = parseInt(event.detail.value);
    this.filtrarPorDia();
  }

  filtrarPorDia() {
    if (this.diaSeleccionado === 0) {
      // Mostrar todos los días
      this.rutinasFiltradasPorDia = [...this.rutinasAsignadas];
    } else {
      // Filtrar por día específico (puede haber más de una asignación por día)
      this.rutinasFiltradasPorDia = this.rutinasAsignadas.filter(r => r.dia_semana === this.diaSeleccionado);
    }

    // Evitar duplicados por id (defensa ante datos duplicados desde el backend)
    const map = new Map<number, any>();
    for (const r of this.rutinasFiltradasPorDia) {
      if (r && r.id != null && !map.has(r.id)) {
        map.set(r.id, r);
      }
    }
    this.rutinasFiltradasPorDia = Array.from(map.values());

    this.cdr.detectChanges();
  }

  get rutinasAMostrar() {
    return this.rutinasFiltradasPorDia || [];
  }

  // Métodos del carrusel
  getCarouselIndex(rutina: any): number {
    return this.carouselIndices.get(rutina.id) || 0;
  }

  getCarouselTransform(rutina: any): string {
    const index = this.getCarouselIndex(rutina);
    const baseTranslate = -index * 100;
    const currentDrag = this.currentTranslateX.get(rutina.id) || 0;
    return `calc(${baseTranslate}% + ${currentDrag}px)`;
  }

  isDragging(rutina: any): boolean {
    return this.dragging.get(rutina.id) || false;
  }

  anteriorEjercicio(rutina: any) {
    const currentIndex = this.getCarouselIndex(rutina);
    if (currentIndex > 0) {
      this.carouselIndices.set(rutina.id, currentIndex - 1);
      this.cdr.detectChanges();
    }
  }

  siguienteEjercicio(rutina: any) {
    const currentIndex = this.getCarouselIndex(rutina);
    if (rutina.ejercicios && currentIndex < rutina.ejercicios.length - 1) {
      this.carouselIndices.set(rutina.id, currentIndex + 1);
      this.cdr.detectChanges();
    }
  }

  irAEjercicio(rutina: any, index: number) {
    this.carouselIndices.set(rutina.id, index);
    this.cdr.detectChanges();
  }

  // === MÉTODOS PARA MINI CARRUSEL DE VIDEOS (Principal/Alternativo) ===
  /**
   * Genera key única para identificar ejercicio dentro de rutina
   */
  private getVideoKey(rutina: any, ejercicioIndex: number): string {
    return `${rutina.id}-${ejercicioIndex}`;
  }

  /**
   * Obtiene el índice actual del carrusel de videos para un ejercicio (0 = principal, 1 = alternativo)
   */
  getVideoCarouselIndex(rutina: any, ejercicioIndex: number): number {
    return this.videoCarouselIndices.get(this.getVideoKey(rutina, ejercicioIndex)) || 0;
  }

  /**
   * Establece el índice del carrusel de videos
   */
  setVideoCarouselIndex(rutina: any, ejercicioIndex: number, videoIndex: number): void {
    this.videoCarouselIndices.set(this.getVideoKey(rutina, ejercicioIndex), videoIndex);
    this.cdr.detectChanges();
  }

  // Gestos táctiles para deslizar
  onTouchStart(event: TouchEvent, rutina: any) {
    this.touchStartX.set(rutina.id, event.touches[0].clientX);
    this.currentTranslateX.set(rutina.id, 0);
    this.dragging.set(rutina.id, true);
  }

  onTouchMove(event: TouchEvent, rutina: any) {
    if (!this.dragging.get(rutina.id)) return;
    
    const startX = this.touchStartX.get(rutina.id) || 0;
    const currentX = event.touches[0].clientX;
    const diff = currentX - startX;
    
    // Limitar el arrastre en los bordes
    const currentIndex = this.getCarouselIndex(rutina);
    const maxIndex = rutina.ejercicios.length - 1;
    
    if ((currentIndex === 0 && diff > 0) || (currentIndex === maxIndex && diff < 0)) {
      // Reducir el movimiento en los bordes
      this.currentTranslateX.set(rutina.id, diff * 0.3);
    } else {
      this.currentTranslateX.set(rutina.id, diff);
    }
    
    this.cdr.detectChanges();
  }

  onTouchEnd(event: TouchEvent, rutina: any) {
    this.dragging.set(rutina.id, false);
    
    const translateX = this.currentTranslateX.get(rutina.id) || 0;
    const threshold = 50; // Píxeles mínimos para cambiar de slide
    
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0) {
        // Deslizar a la derecha - ir al anterior
        this.anteriorEjercicio(rutina);
      } else {
        // Deslizar a la izquierda - ir al siguiente
        this.siguienteEjercicio(rutina);
      }
    }
    
    // Reset
    this.currentTranslateX.set(rutina.id, 0);
    this.cdr.detectChanges();
  }

  // Convertir estado a texto legible
  obtenerEstadoLegible(estado: string): string {
    const estados: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'en_progreso': 'En Progreso',
      'completada': 'Completada',
      'pausada': 'Pausada',
      'cancelada': 'Cancelada'
    };
    return estados[estado] || estado?.replace('_', ' ') || 'Pendiente';
  }
}
