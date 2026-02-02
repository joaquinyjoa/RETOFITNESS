import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService } from '../services/cliente.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-ver-clientes',
  templateUrl: './ver-clientes.component.html',
  styleUrls: ['./ver-clientes.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SpinnerComponent]
})
export class VerClientesComponent implements OnInit, ViewWillEnter, ViewWillLeave {
  clientes: any[] = [];
  filteredClientes: any[] = [];
  q: string = '';
  loading = false;
  mostrarSpinner = false;
  
  // Caché para evitar recargas innecesarias
  private cacheClientes: any[] | null = null;
  private ultimaCarga = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  
  // Debouncing para búsqueda
  private searchTimeout: any;
  
  // Modal de detalle
  isModalOpen = false;
  clienteSeleccionado: any = null;

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Detectar si viene de editar cliente para invalidar caché
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['reload']) {
      this.cacheClientes = null;
      this.ultimaCarga = 0;
    }
  }

  async ngOnInit() {
    // Cargar sin bloquear - mostrar UI inmediatamente
    this.loadClientes();
    // Asegurar que el spinner no quede visible por estados previos
    this.mostrarSpinner = false;
    this.cdr.detectChanges();
  }

  ionViewWillEnter() {
    // Resetear spinner al entrar a la vista
    setTimeout(() => {
      this.mostrarSpinner = false;
      this.cdr.detectChanges();
    }, 0);
  }

  ionViewWillLeave() {
    // Apagar spinner al salir de la vista
    setTimeout(() => {
      this.mostrarSpinner = false;
    }, 0);
  }

  async loadClientes(forzarRecarga = false) {
    const inicioTotal = performance.now();
    
    // Usar caché si está disponible y no ha expirado
    const ahora = Date.now();
    if (!forzarRecarga && this.cacheClientes && (ahora - this.ultimaCarga) < this.CACHE_TTL) {
      this.clientes = this.cacheClientes;
      this.applyFilter();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges(); // Forzar actualización del spinner
    
    // Timeout de seguridad: si tarda más de 3 segundos, mostrar mensaje
    const timeoutId = setTimeout(() => {
      if (this.loading) {
        console.warn('⚠️ [Ver Clientes] La carga está tardando más de 3 segundos...');
      }
    }, 3000);
    
    try {
      const inicioQuery = performance.now();
      
      const list = await this.clienteService.listarClientesResumido();
      
      const finQuery = performance.now();
      
      clearTimeout(timeoutId);
      this.clientes = Array.isArray(list) ? list : [];
      
      // Actualizar caché
      this.cacheClientes = this.clientes;
      this.ultimaCarga = ahora;
      
      this.applyFilter();
      
      const finTotal = performance.now();
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('❌ [Ver Clientes] Error cargando clientes:', err);
      this.clientes = [];
      this.filteredClientes = [];
    } finally {
      this.loading = false;
      this.cdr.detectChanges(); // Forzar actualización para ocultar spinner
    }
  }

  applyFilter() {
    // Cancelar búsqueda anterior si existe
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce de 300ms
    this.searchTimeout = setTimeout(() => {
      const term = (this.q || '').trim().toLowerCase();
      if (!term) {
        this.filteredClientes = [...this.clientes];
        this.cdr.detectChanges();
        return;
      }

      this.filteredClientes = this.clientes.filter(c => {
        const fullName = ((c.nombre || '') + ' ' + (c.apellido || '')).toLowerCase();
        const nombre = (c.nombre || '').toLowerCase();
        const apellido = (c.apellido || '').toLowerCase();
        const correo = (c.correo || '').toLowerCase();
        
        return fullName.includes(term) || 
               nombre.includes(term) || 
               apellido.includes(term) || 
               correo.includes(term);
      });
      this.cdr.detectChanges();
    }, 300);
  }

  async verMas(cliente: any) {
    this.mostrarSpinner = true;
    this.cdr.detectChanges();
    
    try {
      // Cargar datos completos del cliente desde la base de datos
      const clienteCompleto = await this.clienteService.obtenerClientePorId(cliente.id);
      
      if (clienteCompleto) {
        this.clienteSeleccionado = clienteCompleto;
        this.isModalOpen = true;
      } else {
        console.error('No se pudo cargar la información completa del cliente');
        this.clienteSeleccionado = cliente; // Usar datos parciales como fallback
        this.isModalOpen = true;
      }
    } catch (error) {
      console.error('Error al cargar cliente:', error);
      this.clienteSeleccionado = cliente; // Usar datos parciales como fallback
      this.isModalOpen = true;
    } finally {
      this.mostrarSpinner = false;
      this.cdr.detectChanges();
    }
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.clienteSeleccionado = null;
  }

  // TrackBy para optimizar rendimiento del ngFor
  trackByClienteId(index: number, cliente: any): number {
    return cliente.id || index;
  }

  // Verificar si el cliente tiene alguna condición médica marcada como true
  tieneCondicionesMedicas(): boolean {
    if (!this.clienteSeleccionado) return false;
    
    return this.clienteSeleccionado.enfermedadCronicoa ||
           this.clienteSeleccionado.diabetes ||
           this.clienteSeleccionado.hipotension ||
           this.clienteSeleccionado.hipotiroide ||
           this.clienteSeleccionado.hipotiroidismo ||
           this.clienteSeleccionado.medicacionRegular ||
           this.clienteSeleccionado.cirugias ||
           this.clienteSeleccionado.lesiones ||
           this.clienteSeleccionado.fuma ||
           this.clienteSeleccionado.alcohol;
  }

  verRutina(cliente: any) {
    this.mostrarSpinner = true;
    this.cdr.detectChanges();
    
    // Dar tiempo para que se muestre el spinner antes de navegar
    setTimeout(async () => {
      await this.router.navigate(['/ver-rutina-cliente', cliente.id]);
      // ocultar spinner si por alguna razón quedó visible
      this.mostrarSpinner = false;
      this.cdr.detectChanges();
    }, 1500);
  }

  editarCliente(cliente: any) {
    this.mostrarSpinner = true;
    this.cdr.detectChanges();
    
    // Dar tiempo para que se muestre el spinner antes de navegar
    setTimeout(async () => {
      await this.router.navigate(['/editar-cliente', cliente.id]);
      // ocultar spinner si por alguna razón quedó visible
      this.mostrarSpinner = false;
      this.cdr.detectChanges();
    }, 1500);
  }

  volver() {
    this.router.navigate(['/panel-entrenador']);
  }
}
