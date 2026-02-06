import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter, ViewWillLeave, NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService, UsuarioLogueado } from '../services/auth.service';
import { ConfirmService } from '../services/confirm.service';
import { ToastService } from '../services/toast.service';
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
  private navCtrl = inject(NavController);
  private authService = inject(AuthService);
  private confirmService = inject(ConfirmService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // Getter para obtener datos del entrenador con type safety
  get datosEntrenador() {
    if (this.entrenador && this.entrenador.tipo === 'entrenador') {
      return this.entrenador.data as import('../services/entrenador.service').Entrenador;
    }
    return null;
  }

  ngOnInit() {
    // Resetear spinner por si volvemos al componente
    this.mostrarSpinner = false;
    
    this.cargarDatosEntrenador();
  }

  ionViewWillEnter() {
    // Este hook se ejecuta SIEMPRE antes de entrar a la vista
    setTimeout(() => {
      this.mostrarSpinner = false;
      this.cdr.detectChanges();
    }, 0);
    
    // Recargar datos del entrenador por si cambiaron
    this.cargarDatosEntrenador();
  }

  private cargarDatosEntrenador() {
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
    
    this.cdr.detectChanges();
  }

  ionViewWillLeave() {
    // Apagar spinner al salir de la vista
    this.mostrarSpinner = false;
  }

  ngOnDestroy() {
    // Asegurar que el spinner se apague al destruir el componente
    this.mostrarSpinner = false;
  }

  // Verificar conexión a internet
  private verificarConexion(): boolean {
    // En móvil, confiar en navigator.onLine es suficiente
    return navigator.onLine;
  }

  // Navegar a ver clientes
  async verClientes() {
    // Verificar conexión antes de navegar
    const tieneConexion = this.verificarConexion();
    if (!tieneConexion) {
      await this.toastService.mostrarError('Debes estar conectado a internet para ver los clientes');
      return;
    }

    // Mostrar spinner durante 1.5s para dar tiempo de carga
    this.mostrarSpinner = true;
    this.cdr.detectChanges();
    
    // Esperar 1.5 segundos antes de navegar
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Navegar sin animación para evitar problemas visuales
    await this.navCtrl.navigateForward('/ver-clientes', {
      animated: false
    });
    
    // Pequeño delay para que el nuevo componente renderice
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Ocultar spinner suavemente después de navegar
    this.mostrarSpinner = false;
    this.cdr.detectChanges();
  }

  // Ver ejercicios
  async verEjercicios() {
    // Verificar conexión antes de navegar
    const tieneConexion = this.verificarConexion();
    if (!tieneConexion) {
      await this.toastService.mostrarError('Debes estar conectado a internet para ver los ejercicios');
      return;
    }

    // Mostrar spinner durante 1.5s para dar tiempo de carga
    this.mostrarSpinner = true;
    this.cdr.detectChanges();
    
    // Esperar 1.5 segundos antes de navegar
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Navegar sin animación para evitar problemas visuales
    await this.navCtrl.navigateForward('/ver-ejercicios', {
      animated: false
    });
    
    // Pequeño delay para que el nuevo componente renderice
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Ocultar spinner suavemente después de navegar
    this.mostrarSpinner = false;
    this.cdr.detectChanges();
  }

  // Cerrar sesión
  async cerrarSesion() {
    const ok = await this.confirmService.confirmExit('¿Estás seguro que deseas cerrar sesión?', 'Cerrar sesión');
    if (!ok) return;

    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

}
