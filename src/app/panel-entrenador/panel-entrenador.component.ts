import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService, UsuarioLogueado } from '../services/auth.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-panel-entrenador',
  templateUrl: './panel-entrenador.component.html',
  styleUrls: ['./panel-entrenador.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, SpinnerComponent]
})
export class PanelEntrenadorComponent implements OnInit {

  entrenador: UsuarioLogueado | null = null;
  mostrarSpinner = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {    
    // Pequeño delay para asegurar que localStorage esté disponible
    setTimeout(() => {
      // Obtener información del entrenador logueado
      this.entrenador = this.authService.obtenerSesion();
      
      // Verificar si hay sesión
      if (!this.entrenador) {
        this.router.navigate(['/login']);
        return;
      }
      
      // Verificar si es entrenador
      if (this.entrenador.tipo !== 'entrenador') {
        this.router.navigate(['/login']);
        return;
      }
    }, 100);
  }

  // Navegar a ver clientes
  verClientes() {
    this.mostrarSpinner = true;
    setTimeout(() => {
      this.router.navigate(['/ver-clientes']);
    }, 5000);
  }

  // Ver ejercicios
  verEjercicios() {
    this.mostrarSpinner = true;
    setTimeout(() => {
      this.router.navigate(['/ver-ejercicios']);
    }, 5000);
  }

  // Cerrar sesión
  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/welcome']);
  }

}
