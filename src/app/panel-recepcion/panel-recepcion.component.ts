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

  recepcion: UsuarioLogueado | null = null;
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  mostrarSpinner = false;
  filtro: 'todos' | 'pendientes' | 'aprobados' = 'todos';
  busquedaCorreo: string = '';
  
  // Modal para cambiar contraseña
  mostrarModalPassword = false;
  clienteSeleccionado: Cliente | null = null;
  nuevaPassword = '';
  confirmarPassword = '';

  private router = inject(Router);
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    console.log('🔷 PANEL RECEPCIÓN: ngOnInit ejecutado');
    this.cargarDatosRecepcion();
    this.cargarClientes();
  }

  async cargarDatosRecepcion() {
    const usuario = this.authService.obtenerSesion();
    if (usuario && usuario.tipo === 'recepcion') {
      this.recepcion = usuario;
      this.cdr.detectChanges();
    } else {
      console.warn('No hay recepción logueada, redirigiendo...');
      await this.router.navigate(['/login']);
    }
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
    this.clienteSeleccionado = cliente;
    this.nuevaPassword = '';
    this.confirmarPassword = '';
    this.mostrarModalPassword = true;
  }

  cerrarModalPassword() {
    this.mostrarModalPassword = false;
    this.clienteSeleccionado = null;
    this.nuevaPassword = '';
    this.confirmarPassword = '';
  }

  async cambiarPassword() {
    if (!this.clienteSeleccionado || !this.clienteSeleccionado.id) {
      alert('Error: Cliente no seleccionado');
      return;
    }

    if (!this.nuevaPassword || this.nuevaPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    this.mostrarSpinner = true;
    
    const resultado = await this.authService.cambiarPasswordCliente(
      this.clienteSeleccionado.id,
      this.nuevaPassword
    );

    this.mostrarSpinner = false;

    if (resultado.success) {
      alert(`Contraseña actualizada exitosamente para ${this.clienteSeleccionado.nombre}`);
      this.cerrarModalPassword();
    } else {
      alert(`Error al cambiar contraseña: ${resultado.error}`);
    }
  }
}
