import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ClienteService } from '../services/cliente.service';
import { Cliente } from '../services/supabase.service';
import { ToastService } from '../services/toast.service';
import { ConfirmService } from '../services/confirm.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-cambiar-password',
  templateUrl: './cambiar-password.component.html',
  styleUrls: ['./cambiar-password.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SpinnerComponent]
})
export class CambiarPasswordComponent  implements OnInit {
  clienteId: number | null = null;
  cliente: Cliente | null = null;
  nuevaPassword = '';
  confirmarPassword = '';
  mostrarNuevaPassword = false;
  mostrarConfirmarPassword = false;
  guardando = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private clienteService: ClienteService,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.clienteId = parseInt(id, 10);
      await this.cargarCliente();
    } else {
      this.volver();
    }
  }

  async cargarCliente() {
    if (!this.clienteId) {
      console.error('❌ clienteId es null');
      return;
    }
    
    try {
      this.cliente = await this.clienteService.obtenerClientePorId(this.clienteId);
      
      if (!this.cliente) {
        await this.toastService.mostrarError('Cliente no encontrado');
        this.volver();
      } else {
        // Forzar detección de cambios
        this.cdr.detectChanges();
      }
    } catch (error: any) {
      await this.toastService.mostrarError(`Error al cargar el cliente: ${error.message || 'Error desconocido'}`);
      this.volver();
    }
  }

  async cambiarPassword() {
    if (!this.clienteId || !this.cliente) {
      await this.toastService.mostrarError('Error: Cliente no encontrado');
      return;
    }

    if (!this.nuevaPassword || this.nuevaPassword.length < 6) {
      await this.toastService.mostrarError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar que tenga al menos una mayúscula
    if (!/[A-Z]/.test(this.nuevaPassword)) {
      await this.toastService.mostrarError('La contraseña debe contener al menos una letra mayúscula');
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      await this.toastService.mostrarError('Las contraseñas no coinciden');
      return;
    }

    // Mostrar confirmación con diseño neon (igual que "Cerrar sesión")
    const confirmado = await this.confirmService.confirm(
      `¿Estás seguro de cambiar la contraseña de ${this.cliente.nombre}?`,
      'Confirmar cambio',
      'Cambiar contraseña'
    );

    if (!confirmado) return;
    
    try {
      // Mostrar spinner
      this.guardando = true;
      this.cdr.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 50));

      const resultado = await this.authService.cambiarPasswordCliente(
        this.clienteId,
        this.nuevaPassword
      );

      if (resultado.success) {
        // Mantener spinner visible por un momento
        await new Promise(resolve => setTimeout(resolve, 800));

        // Forzar ejecución en NgZone
        await this.ngZone.run(async () => {
          this.guardando = false;
          this.cdr.detectChanges();

          await new Promise(resolve => setTimeout(resolve, 50));

          await this.toastService.mostrarExito(`Contraseña actualizada exitosamente para ${this.cliente!.nombre}`);

          await new Promise(resolve => setTimeout(resolve, 200));

          this.volver();
        });
      } else {
        this.guardando = false;
        this.cdr.detectChanges();
        await this.toastService.mostrarError(`Error al cambiar contraseña: ${resultado.error}`);
      }
    } catch (error: any) {
      console.error('Error inesperado:', error);
      this.guardando = false;
      this.cdr.detectChanges();
      await this.toastService.mostrarError('Error inesperado al cambiar la contraseña');
    }
  }

  volver() {
    this.router.navigate(['/panel-recepcion']);
  }

  toggleNuevaPasswordVisibility() {
    this.mostrarNuevaPassword = !this.mostrarNuevaPassword;
  }

  toggleConfirmarPasswordVisibility() {
    this.mostrarConfirmarPassword = !this.mostrarConfirmarPassword;
  }
}
