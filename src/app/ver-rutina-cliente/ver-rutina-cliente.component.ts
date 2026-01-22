import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
  IonLabel
} from '@ionic/angular/standalone';
import { RutinaService } from '../services/rutina.service';
import { ClienteService } from '../services/cliente.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-ver-rutina-cliente',
  templateUrl: './ver-rutina-cliente.component.html',
  styleUrls: ['./ver-rutina-cliente.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
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
    IonLabel
  ]
})
export class VerRutinaClienteComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private rutinaService = inject(RutinaService);
  private clienteService = inject(ClienteService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  clienteId: number | null = null;
  cliente: any = null;
  rutinaAsignada: any = null;
  loading = true;

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
    console.log('🟪 [VerRutinaCliente] === INICIO cargarDatos ===');
    console.log('🟪 [VerRutinaCliente] Activando spinner (loading = true)...');
    this.loading = true;
    this.cdr.detectChanges();
    
    try {
      // Cargar información del cliente
      if (this.clienteId) {
        console.log('🟪 [VerRutinaCliente] Cargando cliente ID:', this.clienteId);
        const tiempoInicio = performance.now();
        
        this.cliente = await this.clienteService.obtenerClientePorId(this.clienteId);
        console.log('🟢 [VerRutinaCliente] Cliente cargado:', this.cliente?.nombre);
        
        // Cargar rutina asignada
        console.log('🟪 [VerRutinaCliente] Cargando rutinas del cliente...');
        const { data, error } = await this.rutinaService.obtenerRutinasDeCliente(this.clienteId);
        
        if (!error && data && data.length > 0) {
          console.log('🟢 [VerRutinaCliente] Rutinas encontradas:', data.length);
          // Obtener la rutina activa o la más reciente
          const rutinaActiva = data.find((r: any) => r.estado === 'en_progreso') || data[0];
          console.log('🟢 [VerRutinaCliente] Rutina activa:', rutinaActiva);
          
          // Obtener los detalles completos de la rutina
          const { data: rutinaDetalle } = await this.rutinaService.obtenerRutinaPorId(rutinaActiva.rutina_id);
          console.log('🟢 [VerRutinaCliente] Detalles de rutina cargados');
          
          this.rutinaAsignada = {
            ...rutinaActiva,
            detalles: rutinaDetalle
          };
        } else {
          console.log('⚠️ [VerRutinaCliente] No se encontraron rutinas para el cliente');
        }
        
        const tiempoFin = performance.now();
        const duracion = (tiempoFin - tiempoInicio).toFixed(2);
        console.log(`🟢 [VerRutinaCliente] Datos cargados en ${duracion}ms`);
      }
    } catch (error) {
      console.error('🔴 [VerRutinaCliente] Error al cargar datos:', error);
    } finally {
      console.log('🟪 [VerRutinaCliente] Desactivando spinner (loading = false)...');
      this.loading = false;
      console.log('🟪 [VerRutinaCliente] Forzando detección de cambios...');
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
      
      // Timeout adicional para asegurar que la UI se actualice
      setTimeout(() => {
        this.loading = false;
        this.cdr.detectChanges();
        console.log('🟪 [VerRutinaCliente] Segunda detección de cambios ejecutada');
      }, 0);
      
      console.log('🟪 [VerRutinaCliente] === FIN cargarDatos ===\n');
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

  asignarNuevaRutina() {
    // Navegar a la página de asignar rutina
    this.router.navigate(['/ver-ejercicios'], { 
      queryParams: { tab: 'rutinas' }
    });
  }
}
