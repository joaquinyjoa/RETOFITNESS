import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SpinnerComponent } from '../spinner/spinner.component';
import { Router } from '@angular/router';
import { ClienteService } from '../services/cliente.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { getSupabaseClient } from '../services/supabase-client';

@Component({
  selector: 'app-modificar-cliente',
  templateUrl: './modificar-cliente.component.html',
  styleUrls: ['./modificar-cliente.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SpinnerComponent]
})
export class ModificarClienteComponent implements OnInit {
  private router = inject(Router);
  private clienteService = inject(ClienteService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  cliente: any = null;
  clienteOriginal: any = null;
  guardando = false;
  cargando = true;

  async ngOnInit() {
    await this.cargarDatosCliente();
  }

  async cargarDatosCliente() {
    try {
      this.cargando = true;

      const sesion = this.authService.obtenerSesion();
      
      if (!sesion?.data || !sesion.data.user_id) {
        this.toastService.mostrarError('No se pudo identificar al usuario');
        this.router.navigate(['/panel-cliente']);
        return;
      }

      // Obtener datos del cliente desde Supabase
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', sesion.data.user_id)
        .single();

      if (error || !data) {
        console.error('Error al cargar cliente:', error);
        this.toastService.mostrarError('No se pudieron cargar los datos');
        this.cliente = null;
        return;
      }

      this.cliente = { ...data };
      this.clienteOriginal = { ...data };
    } catch (error) {
      console.error('Error:', error);
      this.toastService.mostrarError('Error al cargar los datos');
    } finally {
      this.cargando = false;
    }
  }

  async guardarCambios() {
    if (!this.cliente || !this.validarFormulario()) {
      return;
    }

    try {
      this.guardando = true;
      this.cdr?.detectChanges?.();

      // Preparar datos para actualizar (excluir campos no editables)
      const datosActualizar: any = {
        nombre: this.cliente.nombre,
        apellido: this.cliente.apellido || null,
        edad: this.cliente.edad,
        genero: this.cliente.genero || null,
        peso: this.cliente.peso !== undefined && this.cliente.peso !== null && this.cliente.peso !== '' ? Number(this.cliente.peso) : null,
        altura: this.cliente.altura !== undefined && this.cliente.altura !== null && this.cliente.altura !== '' ? Number(this.cliente.altura) : null,
        nivelActividad: this.cliente.nivelActividad || null,
        objetivo: this.cliente.objetivo || null,
        enfermedadCronicoa: this.cliente.enfermedadCronicoa || false,
        descripcionEnfermedad: this.cliente.descripcionEnfermedad || null,
        diabetes: this.cliente.diabetes || false,
        hipotension: this.cliente.hipotension || false,
        hipotiroide: this.cliente.hipotiroide || false,
        hipotiroidismo: this.cliente.hipotiroidismo || false,
        medicacionRegular: this.cliente.medicacionRegular || false,
        descripcionMedicacion: this.cliente.descripcionMedicacion || '',
        cirugias: this.cliente.cirugias || false,
        descripcionCirugias: this.cliente.descripcionCirugias || null,
        lesiones: this.cliente.lesiones || false,
        descripcionLesiones: this.cliente.descripcionLesiones || null,
        fuma: this.cliente.fuma || false,
        alcohol: this.cliente.alcohol || false,
        horas_sueno: this.cliente.horas_sueno || null
      };

      // Ejecutar actualización y esperar mínimo 1.5s mostrando spinner
      const supabase = getSupabaseClient();
      const updatePromise = supabase
        .from('clientes')
        .update(datosActualizar)
        .eq('id', this.cliente.id);

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      const [updateResult] = await Promise.all([updatePromise, delay(1500)]);

      const error = (updateResult as any)?.error;

      if (error) {
        console.error('Error al actualizar:', error);
        this.toastService.mostrarError('Error al guardar los cambios');
        return;
      }

      this.toastService.mostrarExito('Perfil actualizado correctamente');
      this.clienteOriginal = { ...this.cliente };
      this.router.navigate(['/panel-cliente']);
    } catch (error) {
      console.error('Error:', error);
      this.toastService.mostrarError('Error al guardar los cambios');
    } finally {
      this.guardando = false;
    }
  }

  validarFormulario(): boolean {
    if (!this.cliente.nombre || this.cliente.nombre.trim() === '') {
      this.toastService.mostrarError('El nombre es obligatorio');
      return false;
    }

    if (!this.cliente.edad || this.cliente.edad < 1 || this.cliente.edad > 120) {
      this.toastService.mostrarError('La edad debe estar entre 1 y 120 años');
      return false;
    }

    return true;
  }

  volver() {
    this.router.navigate(['/panel-cliente']);
  }
}
