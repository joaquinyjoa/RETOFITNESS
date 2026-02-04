import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { Router } from '@angular/router';
import { AnimationController } from '@ionic/angular';
import { SpinnerComponent } from '../spinner/spinner.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, SpinnerComponent]
})
export class WelcomeComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  mostrarSpinner = false;
  
  private router = inject(Router);
  private animationCtrl = inject(AnimationController);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  ngOnInit() {
    // Resetear spinner por si volvemos al componente - usar setTimeout para evitar NG0100
    setTimeout(() => {
      this.mostrarSpinner = false;
    }, 0);
    
    setTimeout(() => {
      this.playWelcomeAnimation();
    }, 100);
  }

  ionViewWillEnter() {
    // Usar setTimeout(0) para diferir al siguiente ciclo y evitar ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.mostrarSpinner = false;
      this.cdr.detectChanges();
      
      // Reiniciar animaciones cada vez que entramos a la vista
      this.playWelcomeAnimation();
    }, 0);
  }

  ionViewWillLeave() {
    // Apagar spinner al salir de la vista - usar setTimeout para evitar NG0100
    setTimeout(() => {
      this.mostrarSpinner = false;
    }, 0);
  }

  playWelcomeAnimation() {
    // Animación para el logo
    const logoElement = document.querySelector('.welcome-logo');
    if (logoElement) {
      const logoAnimation = this.animationCtrl
        .create()
        .addElement(logoElement)
        .duration(1000)
        .fromTo('transform', 'scale(0) rotate(-180deg)', 'scale(1) rotate(0deg)')
        .fromTo('opacity', '0', '1');
      logoAnimation.play();
    }

    // Animación para el título
    const titleElement = document.querySelector('.welcome-title');
    if (titleElement) {
      const titleAnimation = this.animationCtrl
        .create()
        .addElement(titleElement)
        .duration(800)
        .delay(300)
        .fromTo('transform', 'translateY(-50px)', 'translateY(0px)')
        .fromTo('opacity', '0', '1');
      titleAnimation.play();
    }

    // Animación para la descripción
    const descElement = document.querySelector('.welcome-description');
    if (descElement) {
      const descAnimation = this.animationCtrl
        .create()
        .addElement(descElement)
        .duration(600)
        .delay(600)
        .fromTo('transform', 'translateY(30px)', 'translateY(0px)')
        .fromTo('opacity', '0', '1');
      descAnimation.play();
    }

    // Animación para los botones
    const buttonsElement = document.querySelector('.welcome-buttons');
    if (buttonsElement) {
      const buttonsAnimation = this.animationCtrl
        .create()
        .addElement(buttonsElement)
        .duration(700)
        .delay(900)
        .fromTo('transform', 'translateY(50px) scale(0.8)', 'translateY(0px) scale(1)')
        .fromTo('opacity', '0', '1');
      buttonsAnimation.play();
    }
  }

  ngOnDestroy() {
    // Asegurar que el spinner se apague al destruir el componente - usar setTimeout para evitar NG0100
    setTimeout(() => {
      this.mostrarSpinner = false;
    }, 0);
  }

  navegarAlLogin() {
    // Verificar si ya hay sesión activa
    const sesion = this.authService.obtenerSesion();
    
    if (sesion) {
      // Si ya está logueado, redirigir directamente al panel correspondiente
      if (sesion.tipo === 'cliente') {
        this.router.navigate(['/panel-cliente'], { replaceUrl: true });
      } else if (sesion.tipo === 'entrenador') {
        this.router.navigate(['/panel-entrenador'], { replaceUrl: true });
      } else if (sesion.tipo === 'recepcion') {
        this.router.navigate(['/panel-recepcion'], { replaceUrl: true });
      }
    } else {
      // Si no hay sesión, navegar al login
      this.router.navigate(['/login']);
    }
  }

  navegarAlRegistro() {
    // Navegar inmediatamente sin mostrar spinner
    this.router.navigate(['/register']);
  }
}
