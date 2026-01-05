import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ClienteService } from '../services/cliente.service';
import { Cliente } from '../services/supabase.service';
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
  mostrarSpinner = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private clienteService: ClienteService
  ) { }

  async ngOnInit() {
    console.log('🔷 CambiarPassword: ngOnInit iniciado');
    const id = this.route.snapshot.paramMap.get('id');
    console.log('🔷 ID del parámetro:', id);
    
    if (id) {
      this.clienteId = parseInt(id, 10);
      console.log('🔷 Cliente ID parseado:', this.clienteId);
      await this.cargarCliente();
    } else {
      console.warn('⚠️ No se proporcionó ID, volviendo...');
      this.volver();
    }
    console.log('🔷 CambiarPassword: ngOnInit completado');
  }

  async cargarCliente() {
    if (!this.clienteId) {
      console.error('❌ clienteId es null');
      return;
    }
    
    console.log('🔷 Iniciando carga de cliente ID:', this.clienteId);
    this.mostrarSpinner = true;
    
    // Timeout de seguridad: 10 segundos máximo
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: La carga del cliente tardó demasiado')), 10000);
    });
    
    try {
      console.log('🔷 Llamando a obtenerClientePorId...');
      
      // Race entre la carga del cliente y el timeout
      this.cliente = await Promise.race([
        this.clienteService.obtenerClientePorId(this.clienteId),
        timeoutPromise
      ]) as any;
      
      console.log('🔷 Cliente obtenido:', this.cliente);
      
      if (!this.cliente) {
        console.error('❌ Cliente no encontrado');
        alert('Cliente no encontrado');
        this.volver();
      } else {
        console.log('✅ Cliente cargado exitosamente:', this.cliente.nombre);
      }
    } catch (error: any) {
      console.error('❌ Error al cargar cliente:', error);
      alert(`Error al cargar el cliente: ${error.message || 'Error desconocido'}`);
      this.volver();
    } finally {
      console.log('🔷 Ocultando spinner');
      this.mostrarSpinner = false;
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

    this.mostrarSpinner = true;
    
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
    } finally {
      this.mostrarSpinner = false;
    }
  }

  volver() {
    this.router.navigate(['/panel-recepcion']);
  }
}
