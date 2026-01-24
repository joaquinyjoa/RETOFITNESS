import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClienteService } from '../services/cliente.service';
import { ToastService } from '../services/toast.service';
import { Cliente } from '../services/supabase.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-editar-cliente',
  templateUrl: './editar-cliente.component.html',
  styleUrls: ['./editar-cliente.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SpinnerComponent]
})
export class EditarClienteComponent implements OnInit {
  
  cliente: Cliente = {
    nombre: '',
    apellido: '',
    edad: 0,
    correo: '',
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
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
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
    this.cdr.detectChanges();
    
    try {
      const tiempoInicio = performance.now();
      
      const clienteEncontrado = await this.clienteService.obtenerClientePorId(this.clienteId!);
      
      const tiempoFin = performance.now();
      const duracion = (tiempoFin - tiempoInicio).toFixed(2);
      
      if (clienteEncontrado) {
        this.cliente = { ...clienteEncontrado };
      } else {
        await this.toastService.mostrarError('Cliente no encontrado');
        this.router.navigate(['/ver-clientes'], { replaceUrl: true });
      }
    } catch (error) {
      console.error('🔴 [EditarCliente] Error al cargar cliente:', error);
      await this.toastService.mostrarError('Error al cargar la información del cliente');
    } finally {
      this.loading = false;
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
      
      // Timeout adicional para asegurar que la UI se actualice
      setTimeout(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }, 0);
    }
  }

  async guardarCambios() {
    if (!this.validarFormulario()) {
      return;
    }

    try {
      // Mostrar spinner
      this.guardando = true;
      this.cdr.detectChanges();
      
      // Dar tiempo al spinner para mostrarse
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const tiempoInicio = performance.now();
      const resultado = await this.clienteService.actualizarCliente(this.clienteId!, this.cliente);
      const tiempoFin = performance.now();
      
      if (resultado.success) {
       
        // Mantener spinner visible por 800ms
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Ocultar spinner
        this.guardando = false;
        this.cdr.detectChanges();
        
        // Pequeña pausa antes del toast
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Mostrar toast
        await this.toastService.mostrarExito('Cliente actualizado exitosamente');
        
        // Navegar
        this.router.navigate(['/ver-clientes'], { replaceUrl: true });
      } else {
        console.error('🔴 [EditarCliente] Error:', resultado.error);
        this.guardando = false;
        this.cdr.detectChanges();
        await this.toastService.mostrarError(resultado.error || 'Error al actualizar cliente');
      }
    } catch (error) {
      console.error('🔴 [EditarCliente] Error al guardar cliente:', error);
      this.guardando = false;
      this.cdr.detectChanges();
      await this.toastService.mostrarError('Error inesperado al guardar');
    } finally {
      // Asegurar que el spinner esté oculto al final
      if (this.guardando) {
        this.guardando = false;
        this.cdr.detectChanges();
      }
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
    this.router.navigate(['/ver-clientes'], { replaceUrl: true });
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