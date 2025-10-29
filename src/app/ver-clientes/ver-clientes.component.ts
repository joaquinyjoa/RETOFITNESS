import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService } from '../services/cliente.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-ver-clientes',
  templateUrl: './ver-clientes.component.html',
  styleUrls: ['./ver-clientes.component.scss'],
  standalone: true,
  imports: [NgIf,CommonModule, IonicModule, FormsModule]
})
export class VerClientesComponent implements OnInit {
  clientes: any[] = [];
  filteredClientes: any[] = [];
  q: string = '';
  loading = false;
  
  // Modal de detalle
  isModalOpen = false;
  clienteSeleccionado: any = null;

  constructor(
    private clienteService: ClienteService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadClientes();
  }

  async loadClientes() {
    this.loading = true;
    try {
      const list = await this.clienteService.listarClientes();
      this.clientes = Array.isArray(list) ? list : [];
      this.applyFilter();
    } catch (err) {
      console.error('Error cargando clientes', err);
      this.clientes = [];
      this.filteredClientes = [];
    } finally {
      this.loading = false;
    }
  }

  applyFilter() {
    const term = (this.q || '').trim().toLowerCase();
    if (!term) {
      this.filteredClientes = [...this.clientes];
      return;
    }

    this.filteredClientes = this.clientes.filter(c => {
      const full = ((c.nombre || '') + ' ' + (c.apellido || '')).toLowerCase();
      return full.includes(term) || (c.nombre || '').toLowerCase().includes(term) || (c.apellido || '').toLowerCase().includes(term);
    });
  }

  verMas(cliente: any) {
    console.log('Ver más:', cliente);
    this.clienteSeleccionado = cliente;
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.clienteSeleccionado = null;
  }

  verRutina(cliente: any) {
    console.log('Ver rutina de:', cliente);
    // implementación futura: abrir rutina
  }

  editarCliente(cliente: any) {
    console.log('Editar cliente:', cliente);
    this.router.navigate(['/editar-cliente', cliente.id]);
  }
}
