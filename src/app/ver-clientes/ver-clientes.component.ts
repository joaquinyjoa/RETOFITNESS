import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService } from '../services/cliente.service';

@Component({
  selector: 'app-ver-clientes',
  templateUrl: './ver-clientes.component.html',
  styleUrls: ['./ver-clientes.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class VerClientesComponent implements OnInit {
  clientes: any[] = [];
  filteredClientes: any[] = [];
  q: string = '';
  loading = false;
  
  // Caché para evitar recargas innecesarias
  private cacheClientes: any[] | null = null;
  private ultimaCarga = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  
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
  }

  async loadClientes(forzarRecarga = false) {
    console.log('🔄 [Ver Clientes] Iniciando carga...');
    const inicioTotal = performance.now();
    
    // Usar caché si está disponible y no ha expirado
    const ahora = Date.now();
    if (!forzarRecarga && this.cacheClientes && (ahora - this.ultimaCarga) < this.CACHE_TTL) {
      console.log('✅ [Ver Clientes] Usando caché (válido por', Math.round((this.CACHE_TTL - (ahora - this.ultimaCarga)) / 1000), 'segundos más)');
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
      console.log('📥 [Ver Clientes] Solicitando datos al servidor...');
      const inicioQuery = performance.now();
      
      const list = await this.clienteService.listarClientesResumido();
      
      const finQuery = performance.now();
      console.log(`✅ [Ver Clientes] Datos recibidos en ${(finQuery - inicioQuery).toFixed(2)}ms`);
      
      clearTimeout(timeoutId);
      this.clientes = Array.isArray(list) ? list : [];
      
      // Actualizar caché
      this.cacheClientes = this.clientes;
      this.ultimaCarga = ahora;
      
      console.log(`📊 [Ver Clientes] Total de clientes: ${this.clientes.length}`);
      
      this.applyFilter();
      
      const finTotal = performance.now();
      console.log(`🎉 [Ver Clientes] Carga completa en ${(finTotal - inicioTotal).toFixed(2)}ms`);
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
    const term = (this.q || '').trim().toLowerCase();
    if (!term) {
      this.filteredClientes = [...this.clientes];
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
  }

  async verMas(cliente: any) {
    console.log('Ver más:', cliente);
    // Simplemente mostrar el modal con los datos que ya tenemos
    this.clienteSeleccionado = cliente;
    this.isModalOpen = true;
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
    console.log('Ver rutina de:', cliente);
    this.router.navigate(['/ver-rutina-cliente', cliente.id]);
  }

  editarCliente(cliente: any) {
    console.log('Editar cliente:', cliente);
    this.router.navigate(['/editar-cliente', cliente.id]);
  }

  volver() {
    this.router.navigate(['/panel-entrenador']);
  }
}
