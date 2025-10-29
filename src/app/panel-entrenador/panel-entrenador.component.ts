import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService, UsuarioLogueado } from '../services/auth.service';

@Component({
  selector: 'app-panel-entrenador',
  templateUrl: './panel-entrenador.component.html',
  styleUrls: ['./panel-entrenador.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PanelEntrenadorComponent implements OnInit {

  entrenador: UsuarioLogueado | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    console.log('🔍 Panel Entrenador - ngOnInit ejecutado');
    
    // Pequeño delay para asegurar que localStorage esté disponible
    setTimeout(() => {
      // Obtener información del entrenador logueado
      this.entrenador = this.authService.obtenerSesion();
      
      console.log('📋 Datos de sesión obtenidos:', this.entrenador);
      
      // Verificar si hay sesión
      if (!this.entrenador) {
        console.log('❌ No hay sesión activa - redirigiendo al login');
        this.router.navigate(['/login']);
        return;
      }
      
      console.log('👤 Tipo de usuario:', this.entrenador.tipo);
      
      // Verificar si es entrenador
      if (this.entrenador.tipo !== 'entrenador') {
        console.log('❌ Usuario no es entrenador - redirigiendo al login');
        this.router.navigate(['/login']);
        return;
      }
      
      console.log('✅ Usuario válido como entrenador:', this.entrenador.data);
    }, 100);
  }

  // Navegar a ver clientes
  verClientes() {
    console.log('Navegando a ver clientes...');
    // Navegar a la ruta creada para ver clientes
    this.router.navigate(['/ver-clientes']);
  }

  // Abrir escáner QR
  escanearQR() {
    console.log('Abriendo escáner QR...');
    // TODO: Implementar funcionalidad de escáner QR
    // this.router.navigate(['/scanner']);
  }

  // Ver ejercicios
  verEjercicios() {
    console.log('Navegando a ejercicios...');
    this.router.navigate(['/ver-ejercicios']);
  }

  // Cerrar sesión
  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/welcome']);
  }

}
