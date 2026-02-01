import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UsuarioLogueado } from '../services/auth.service';
import { ConfirmService } from '../services/confirm.service';
import { ClienteService } from '../services/cliente.service';
import { Cliente } from '../services/supabase.service';
import { SpinnerComponent } from '../spinner/spinner.component';
import { ToastService } from '../services/toast.service';
import { CacheService } from '../services/cache.service';

@Component({
  selector: 'app-panel-recepcion',
  templateUrl: './panel-recepcion.component.html',
  styleUrls: ['./panel-recepcion.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, SpinnerComponent, FormsModule]
})
export class PanelRecepcionComponent implements OnInit {

  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  mostrarSpinner = false;
  filtro: 'todos' | 'pendientes' | 'aprobados' = 'todos';
  busquedaCorreo: string = '';

  // ✅ AbortController para cancelar requests
  private abortController: AbortController | null = null;

  private router = inject(Router);
  private authService = inject(AuthService);
  private confirmService = inject(ConfirmService);
  private clienteService = inject(ClienteService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);
  private cacheService = inject(CacheService);

  ngOnInit() {
    this.cargarClientes();
  }

  async cargarClientes(mostrarSpinner: boolean = true) {
    // ✅ Cancelar request anterior si existe
    if (this.abortController) {
      this.abortController.abort();
    }

    // Crear nuevo AbortController
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    if (mostrarSpinner) {
      this.mostrarSpinner = true;
      this.cdr.detectChanges();
    }

    try {
      // ✅ Cargar con AbortSignal para poder cancelar
      if (this.filtro === 'pendientes') {
        this.clientes = await this.clienteService.listarClientesPendientes(signal);
      } else if (this.filtro === 'aprobados') {
        this.clientes = await this.clienteService.listarClientes(signal);
      } else {
        // Obtener todos en paralelo con señal de cancelación
        const [pendientes, aprobados] = await Promise.all([
          this.clienteService.listarClientesPendientes(signal),
          this.clienteService.listarClientes(signal)
        ]);
        this.clientes = [...pendientes, ...aprobados]
          .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
          .slice(0, 500);
      }

      this.aplicarFiltroCorreo();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Error al cargar clientes:', error);
    } finally {
      this.abortController = null;
      if (mostrarSpinner) {
        setTimeout(() => {
          this.mostrarSpinner = false;
          this.cdr.detectChanges();
        }, 0);
      }
    }
  }

  aplicarFiltroCorreo() {
    if (!this.busquedaCorreo.trim()) {
      this.clientesFiltrados = [...this.clientes];
    } else {
      const busqueda = this.busquedaCorreo.toLowerCase().trim();
      this.clientesFiltrados = this.clientes.filter(cliente => 
        cliente.correo?.toLowerCase().includes(busqueda) ||
        cliente.nombre?.toLowerCase().includes(busqueda) ||
        cliente.apellido?.toLowerCase().includes(busqueda)
      );
    }
    this.cdr.detectChanges();
  }

  async cambiarEstado(cliente: Cliente) {
    if (!cliente.id) {
      console.error('Cliente sin ID');
      return;
    }

    const nuevoEstado = !cliente.Estado;
    const estadoAnterior = cliente.Estado;

    // ✅ OPTIMISTIC UPDATE: Actualizar UI inmediatamente
    cliente.Estado = nuevoEstado;
    this.cdr.detectChanges();

    try {
      // Guardar en backend (sin spinner, en background)
      const success = await this.clienteService.actualizarEstado(cliente.id, nuevoEstado);
      
      if (!success) {
        throw new Error('Error al actualizar estado');
      }

      // Invalidar caché para próxima carga
      await this.cacheService.invalidatePattern('clientes:');
      
      // Mostrar mensaje de éxito
      const mensaje = nuevoEstado ? 'Cliente aprobado' : 'Cliente deshabilitado';
      this.toastService.mostrarExito(mensaje);
      
    } catch (error) {
      // ❌ ERROR: Revertir cambio
      console.error('Error al cambiar estado:', error);
      cliente.Estado = estadoAnterior;
      this.cdr.detectChanges();
      
      // Mostrar mensaje de error
      this.toastService.mostrarError('No se pudo actualizar el estado del cliente');
    }
  }

  cambiarFiltro(nuevoFiltro: 'todos' | 'pendientes' | 'aprobados') {
    this.filtro = nuevoFiltro;
    this.cargarClientes();
  }

  async cerrarSesion() {
    const ok = await this.confirmService.confirmExit('¿Estás seguro que deseas cerrar sesión?', 'Cerrar sesión');
    if (!ok) return;

    await this.authService.cerrarSesion();
    await this.router.navigate(['/login']);
  }

  getEstadoTexto(estado: boolean | undefined): string {
    return estado ? 'Aprobado' : 'Pendiente';
  }

  getEstadoColor(estado: boolean | undefined): string {
    return estado ? 'success' : 'warning';
  }

  abrirModalCambiarPassword(cliente: Cliente) {
    if (!cliente.id) return;
    this.router.navigate(['/cambiar-password', cliente.id]);
  }
}
