import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
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
export class PanelEntrenadorComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {

  entrenador: UsuarioLogueado | null = null;
  mostrarSpinner = false;

  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    console.log('🔷 PANEL: ngOnInit ejecutado');
    // Resetear spinner por si volvemos al componente
    this.mostrarSpinner = false;
    
    this.cargarDatosEntrenador();
  }

  ionViewWillEnter() {
    console.log('🔷 PANEL: ionViewWillEnter ejecutado');
    // Este hook se ejecuta SIEMPRE antes de entrar a la vista
    setTimeout(() => {
      this.mostrarSpinner = false;
      this.cdr.detectChanges();
    }, 0);
    
    // Recargar datos del entrenador por si cambiaron
    this.cargarDatosEntrenador();
  }

  private cargarDatosEntrenador() {
    console.log('🔷 PANEL: Cargando datos del entrenador...');
    // Pequeño delay para asegurar que localStorage esté disponible
    setTimeout(() => {
      // Obtener información del entrenador logueado
      this.entrenador = this.authService.obtenerSesion();
      console.log('🔷 PANEL: Datos cargados:', this.entrenador);
      
      // Verificar si hay sesión
      if (!this.entrenador) {
        console.log('❌ PANEL: No hay sesión, redirigiendo a login');
        this.router.navigate(['/login']);
        return;
      }
      
      // Verificar si es entrenador
      if (this.entrenador.tipo !== 'entrenador') {
        console.log('❌ PANEL: Usuario no es entrenador, redirigiendo a login');
        this.router.navigate(['/login']);
        return;
      }
      
      console.log('✅ PANEL: Entrenador verificado:', this.entrenador.data.nombre);
      this.cdr.detectChanges();
    }, 100);
  }

  ionViewWillLeave() {
    // Apagar spinner al salir de la vista
    this.mostrarSpinner = false;
  }

  ngOnDestroy() {
    // Asegurar que el spinner se apague al destruir el componente
    this.mostrarSpinner = false;
  }

  // Navegar a ver clientes
  verClientes() {
    this.mostrarSpinner = true;
    setTimeout(() => this.router.navigate(['/ver-clientes']), 300);
  }

  // Ver ejercicios
  verEjercicios() {
    this.mostrarSpinner = true;
    setTimeout(() => this.router.navigate(['/ver-ejercicios']), 300);
  }

  // Cerrar sesión
  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/welcome']);
  }

}
