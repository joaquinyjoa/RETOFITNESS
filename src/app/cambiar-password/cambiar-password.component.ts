import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ClienteService } from '../services/cliente.service';
import { Cliente } from '../services/supabase.service';

@Component({
  selector: 'app-cambiar-password',
  templateUrl: './cambiar-password.component.html',
  styleUrls: ['./cambiar-password.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class CambiarPasswordComponent  implements OnInit {
  clienteId: number | null = null;
  cliente: Cliente | null = null;
  nuevaPassword = '';
  confirmarPassword = '';
  mostrarNuevaPassword = false;
  mostrarConfirmarPassword = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef
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
        alert('Cliente no encontrado');
        this.volver();
      } else {
        // Forzar detección de cambios
        this.cdr.detectChanges();
      }
    } catch (error: any) {
      alert(`Error al cargar el cliente: ${error.message || 'Error desconocido'}`);
      this.volver();
    }
  }

  async cambiarPassword() {
    if (!this.clienteId || !this.cliente) {
      alert('Error: Cliente no encontrado');
      return;
    }

    if (!this.nuevaPassword || this.nuevaPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar que tenga al menos una mayúscula
    if (!/[A-Z]/.test(this.nuevaPassword)) {
      alert('La contraseña debe contener al menos una letra mayúscula');
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    try {
      const resultado = await this.authService.cambiarPasswordCliente(
        this.clienteId,
        this.nuevaPassword
      );

      if (resultado.success) {
        alert(`Contraseña actualizada exitosamente para ${this.cliente.nombre}`);
        this.volver();
      } else {
        alert(`Error al cambiar contraseña: ${resultado.error}`);
      }
    } catch (error: any) {
      console.error('Error inesperado:', error);
      alert('Error inesperado al cambiar la contraseña');
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
