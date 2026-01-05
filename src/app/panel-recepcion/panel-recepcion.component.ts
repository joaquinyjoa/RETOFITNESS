import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UsuarioLogueado } from '../services/auth.service';
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
  private clienteService = inject(ClienteService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarClientes();
  }

  async cargarClientes() {
    this.mostrarSpinner = true;
    this.cdr.detectChanges();

    try {
      console.log('Cargando clientes con filtro:', this.filtro);

      if (this.filtro === 'pendientes') {
        this.clientes = await this.clienteService.listarClientesPendientes();
      } else if (this.filtro === 'aprobados') {
        this.clientes = await this.clienteService.listarClientes();
      } else {
        // Obtener todos (pendientes + aprobados)
        const pendientes = await this.clienteService.listarClientesPendientes();
        const aprobados = await this.clienteService.listarClientes();
        this.clientes = [...pendientes, ...aprobados].sort((a, b) => 
          (a.nombre || '').localeCompare(b.nombre || '')
        );
      }

      console.log('Clientes cargados:', this.clientes.length);
      this.aplicarFiltroCorreo();
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setTimeout(() => {
        this.mostrarSpinner = false;
        this.cdr.detectChanges();
      }, 0);
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
    console.log(`Cambiando estado de ${cliente.nombre} a ${nuevoEstado}`);

    const exito = await this.clienteService.aprobarCliente(cliente.id, nuevoEstado);

    if (exito) {
      // Actualizar el estado local
      cliente.Estado = nuevoEstado;
      console.log('Estado actualizado correctamente');
      
      // Recargar la lista para reflejar cambios
      await this.cargarClientes();
    } else {
      console.error('Error al cambiar estado');
      alert('Error al actualizar el estado del cliente');
    }
  }

  cambiarFiltro(nuevoFiltro: 'todos' | 'pendientes' | 'aprobados') {
    this.filtro = nuevoFiltro;
    this.cargarClientes();
  }

  async cerrarSesion() {
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
