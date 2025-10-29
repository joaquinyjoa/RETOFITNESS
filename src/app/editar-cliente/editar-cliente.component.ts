import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClienteService } from '../services/cliente.service';
import { ToastService } from '../services/toast.service';
import { Cliente } from '../services/supabase.service';

@Component({
  selector: 'app-editar-cliente',
  templateUrl: './editar-cliente.component.html',
  styleUrls: ['./editar-cliente.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class EditarClienteComponent implements OnInit {
  
  cliente: Cliente = {
    nombre: '',
    apellido: '',
    edad: 0,
    correo: '',
    contraseña: '',
    enfermedadCronicoa: false,
    descripcionEnfermedad: '',
    diabetes: false,
    hipotension: false,
    hipotiroide: false,
    hipotiroidismo: false,
    medicacionRegular: false,
    descripcionMedicacion: '',
    cirugias: false,
    descripcionCirugias: '',
    lesiones: false,
    descripcionLesiones: '',
    fuma: false,
    alcohol: false,
    horas_sueno: '',
    objetivo: '',
    genero: '',
    peso: 0,
    altura: 0,
    nivelActividad: ''
  };

  clienteId: number | null = null;
  loading = false;
  guardando = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    // Obtener ID del cliente desde la ruta
    this.clienteId = Number(this.route.snapshot.paramMap.get('id'));
    
    if (this.clienteId) {
      await this.cargarCliente();
    } else {
      this.toastService.mostrarError('ID de cliente no válido');
      this.router.navigate(['/ver-clientes']);
    }
  }

  async cargarCliente() {
    this.loading = true;
    try {
      const clientes = await this.clienteService.listarClientes();
      const clienteEncontrado = clientes.find(c => c.id === this.clienteId);
      
      if (clienteEncontrado) {
        this.cliente = { ...clienteEncontrado };
        console.log('Cliente cargado:', this.cliente);
      } else {
        this.toastService.mostrarError('Cliente no encontrado');
        this.router.navigate(['/ver-clientes']);
      }
    } catch (error) {
      console.error('Error al cargar cliente:', error);
      this.toastService.mostrarError('Error al cargar la información del cliente');
    } finally {
      this.loading = false;
    }
  }

  async guardarCambios() {
    if (!this.validarFormulario()) {
      return;
    }

    this.guardando = true;
    try {
      const resultado = await this.clienteService.actualizarCliente(this.clienteId!, this.cliente);
      
      if (resultado.success) {
        this.toastService.mostrarExito('Cliente actualizado exitosamente');
        this.router.navigate(['/ver-clientes']);
      } else {
        this.toastService.mostrarError(resultado.error || 'Error al actualizar cliente');
      }
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      this.toastService.mostrarError('Error inesperado al guardar');
    } finally {
      this.guardando = false;
    }
  }

  validarFormulario(): boolean {
    if (!this.cliente.nombre.trim()) {
      this.toastService.mostrarError('El nombre es obligatorio');
      return false;
    }

    if (!this.cliente.apellido.trim()) {
      this.toastService.mostrarError('El apellido es obligatorio');
      return false;
    }

    if (!this.cliente.correo.trim()) {
      this.toastService.mostrarError('El correo es obligatorio');
      return false;
    }

    if (this.cliente.edad <= 0) {
      this.toastService.mostrarError('La edad debe ser mayor a 0');
      return false;
    }

    if (this.cliente.peso <= 0) {
      this.toastService.mostrarError('El peso debe ser mayor a 0');
      return false;
    }

    if (this.cliente.altura <= 0) {
      this.toastService.mostrarError('La altura debe ser mayor a 0');
      return false;
    }

    return true;
  }

  cancelar() {
    this.router.navigate(['/ver-clientes']);
  }

  // Método para manejar cambios en checkboxes
  onEnfermedadChange() {
    if (!this.cliente.enfermedadCronicoa) {
      this.cliente.descripcionEnfermedad = '';
    }
  }

  onMedicacionChange() {
    if (!this.cliente.medicacionRegular) {
      this.cliente.descripcionMedicacion = '';
    }
  }

  onCirugiasChange() {
    if (!this.cliente.cirugias) {
      this.cliente.descripcionCirugias = '';
    }
  }

  onLesionesChange() {
    if (!this.cliente.lesiones) {
      this.cliente.descripcionLesiones = '';
    }
  }
}