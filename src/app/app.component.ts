import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from './spinner/spinner.component';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { SpinnerService } from './services/spinner.service';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, CommonModule, SpinnerComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  spinner$ = this.spinnerService.visible$;
  private subs: Subscription;

  constructor(
    private router: Router, 
    private spinnerService: SpinnerService,
    private authService: AuthService
  ) {
    // Subscribe to router events to mark navigation state in the spinner service
    this.subs = this.router.events.subscribe(evt => {
      if (evt instanceof NavigationStart) {
        this.spinnerService.markNavigationStart();
      } else if (evt instanceof NavigationEnd || evt instanceof NavigationCancel || evt instanceof NavigationError) {
        this.spinnerService.markNavigationEnd();
      }
    });
  }

  ngOnInit() {
    // Verificar si hay sesión activa al iniciar la app
    this.verificarSesionInicial();
  }

  private verificarSesionInicial() {
    const sesion = this.authService.obtenerSesion();
    
    if (sesion) {
      // Si hay sesión activa, redirigir al panel correspondiente
      if (sesion.tipo === 'cliente') {
        this.router.navigate(['/panel-cliente'], { replaceUrl: true });
      } else if (sesion.tipo === 'entrenador') {
        this.router.navigate(['/panel-entrenador'], { replaceUrl: true });
      } else if (sesion.tipo === 'recepcion') {
        this.router.navigate(['/panel-recepcion'], { replaceUrl: true });
      }
    }
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}
