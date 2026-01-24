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
  IonModal,
  IonSearchbar,
  IonList,
  IonItem,
  AlertController
} from '@ionic/angular/standalone';
import { RutinaService } from '../services/rutina.service';
import { ClienteService } from '../services/cliente.service';
import { EjercicioService } from '../services/ejercicio.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
    IonModal,
    IonSearchbar,
    IonList,
    IonItem
  ]
})
export class VerRutinaClienteComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private rutinaService = inject(RutinaService);
  private clienteService = inject(ClienteService);
  private ejercicioService = inject(EjercicioService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private alertController = inject(AlertController);

  clienteId: number | null = null;
  cliente: any = null;
  rutinasAsignadas: any[] = [];
  loading = true;
  
  // Modal de cambio de ejercicio
  showModalCambiarEjercicio = false;
  ejercicioACambiar: any = null;
  rutinaClienteActual: any = null;
  ejerciciosDisponibles: any[] = [];
  ejerciciosDisponiblesFiltrados: any[] = [];
  filtroEjercicio = '';
  cargandoEjercicios = false;

  // Mapeo de días
  diasSemana: { [key: number]: string } = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
  };

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
          
        } else {
          this.rutinasAsignadas = [];
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

  async eliminarRutinaAsignada(rutinaCliente: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar la rutina "${rutinaCliente.rutina?.nombre}" del ${this.diasSemana[rutinaCliente.dia_semana]}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'confirm',
          cssClass: 'alert-button-confirm'
        }
      ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();

    if (role !== 'confirm') return;

    try {
      const { success, error } = await this.rutinaService.desasignarRutinaDeCliente(rutinaCliente.id);
      
      if (success) {
        this.rutinasAsignadas = this.rutinasAsignadas.filter(r => r.id !== rutinaCliente.id);
        this.cdr.detectChanges();
        
        const successAlert = await this.alertController.create({
          header: 'Éxito',
          message: 'Rutina eliminada correctamente',
          buttons: ['OK']
        });
        await successAlert.present();
      } else {
        console.error('Error al eliminar rutina:', error);
        const errorAlert = await this.alertController.create({
          header: 'Error',
          message: 'Error al eliminar la rutina',
          buttons: ['OK']
        });
        await errorAlert.present();
      }
    } catch (error) {
      console.error('Error inesperado al eliminar rutina:', error);
      const errorAlert = await this.alertController.create({
        header: 'Error',
        message: 'Error inesperado al eliminar la rutina',
        buttons: ['OK']
      });
      await errorAlert.present();
    }
  }

  async cambiarEjercicio(rutinaCliente: any, ejercicioPersonalizado: any) {
    this.ejercicioACambiar = ejercicioPersonalizado;
    this.rutinaClienteActual = rutinaCliente;
    
    // Cargar ejercicios disponibles
    this.cargandoEjercicios = true;
    this.showModalCambiarEjercicio = true;
    
    try {
      const ejercicios = await this.ejercicioService.listarEjercicios();
      this.ejerciciosDisponibles = ejercicios;
      this.ejerciciosDisponiblesFiltrados = ejercicios;
    } catch (error) {
      console.error('Error al cargar ejercicios:', error);
    } finally {
      this.cargandoEjercicios = false;
      this.cdr.detectChanges();
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
    }
  }

  cerrarModalCambiarEjercicio() {
    this.showModalCambiarEjercicio = false;
    this.ejercicioACambiar = null;
    this.rutinaClienteActual = null;
    this.ejerciciosDisponibles = [];
    this.ejerciciosDisponiblesFiltrados = [];
    this.filtroEjercicio = '';
  }

  asignarNuevaRutina() {
    // Navegar a la página de asignar rutina
    this.router.navigate(['/ver-ejercicios'], { 
      queryParams: { tab: 'rutinas' }
    });
  }
}
