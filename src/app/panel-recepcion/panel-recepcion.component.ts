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

  private router = inject(Router);
  private authService = inject(AuthService);
  private confirmService = inject(ConfirmService);
  private clienteService = inject(ClienteService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarClientes();
  }

  async cargarClientes(mostrarSpinner: boolean = true) {
    if (mostrarSpinner) {
      this.mostrarSpinner = true;
      this.cdr.detectChanges();
    }

    try {
      // OPTIMIZACIÓN: Cargar en paralelo y con límite razonable (max 500 registros)
      if (this.filtro === 'pendientes') {
        this.clientes = await this.clienteService.listarClientesPendientes();
      } else if (this.filtro === 'aprobados') {
        this.clientes = await this.clienteService.listarClientes();
      } else {
        // Obtener todos en paralelo en lugar de secuencial
        const [pendientes, aprobados] = await Promise.all([
          this.clienteService.listarClientesPendientes(),
          this.clienteService.listarClientes()
        ]);
        this.clientes = [...pendientes, ...aprobados]
          .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
          .slice(0, 500); // Límite de 500 registros para evitar sobrecarga
      }

      this.aplicarFiltroCorreo();
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
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

    // Mostrar spinner solo si se está aprobando (nuevoEstado = true)
    if (nuevoEstado) {
      this.mostrarSpinner = true;
      this.cdr.detectChanges();
    }

    try {
      // Si se aprueba, esperar al menos 1.5s antes de ocultar spinner
      if (nuevoEstado) {
        const [exito] = await Promise.all([
          this.clienteService.aprobarCliente(cliente.id, nuevoEstado),
          new Promise(resolve => setTimeout(resolve, 1500))
        ]);

        if (exito) {
          cliente.Estado = nuevoEstado;
          await this.cargarClientes(false); // No mostrar spinner adicional
        } else {
          console.error('Error al cambiar estado');
          alert('Error al actualizar el estado del cliente');
        }
      } else {
        // Si se desaprueba, no mostrar spinner
        const exito = await this.clienteService.aprobarCliente(cliente.id, nuevoEstado);

        if (exito) {
          cliente.Estado = nuevoEstado;
          await this.cargarClientes(false); // No mostrar spinner
        } else {
          console.error('Error al cambiar estado');
          alert('Error al actualizar el estado del cliente');
        }
      }
    } finally {
      if (nuevoEstado) {
        this.mostrarSpinner = false;
        this.cdr.detectChanges();
      }
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
