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
  IonBadge,
  IonChip,
  IonLabel,
  IonItem,
  IonList
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
    IonBadge,
    IonChip,
    IonLabel,
    IonItem,
    IonList
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
