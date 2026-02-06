import { Component, OnDestroy, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { IonApp, IonRouterOutlet, IonToast } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from './spinner/spinner.component';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { SpinnerService } from './services/spinner.service';
import { AuthService } from './services/auth.service';
import { ToastService } from './services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonToast, CommonModule, SpinnerComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  spinner$ = this.spinnerService.visible$;
  private subs: Subscription;
  private toastSub?: Subscription;

  // Propiedades del toast (binding directo para Safari)
  toastIsOpen = false;
  toastMessage = '';
  toastDuration = 3000;
  toastColor: 'success' | 'danger' | 'warning' | 'primary' = 'primary';
  toastIcon = 'information-circle-outline';

  constructor(
    private router: Router, 
    private spinnerService: SpinnerService,
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
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
    
    // Suscribirse a los cambios del toast - ejecutar en NgZone para Safari
    this.toastSub = this.toastService.toast$.subscribe(toast => {
      // Ejecutar en NgZone para forzar change detection en Safari
      this.ngZone.run(() => {
        this.toastIsOpen = toast.isOpen;
        this.toastMessage = toast.message;
        this.toastDuration = toast.duration;
        this.toastColor = toast.color;
        this.toastIcon = toast.icon;
        
        // Forzar change detection para Safari
        this.cdr.detectChanges();
      });
    });
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

  onToastDismiss() {
    this.ngZone.run(() => {
      this.toastService.cerrarToast();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
    this.toastSub?.unsubscribe();
  }
}
