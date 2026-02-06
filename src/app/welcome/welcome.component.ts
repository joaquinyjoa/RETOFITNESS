import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter, ViewWillLeave, AlertController } from '@ionic/angular';
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
  mostrarBotonInstalar = false;
  private deferredPrompt: any;
  
  private router = inject(Router);
  private animationCtrl = inject(AnimationController);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private alertController = inject(AlertController);

  ngOnInit() {
    // Resetear spinner por si volvemos al componente - usar setTimeout para evitar NG0100
    setTimeout(() => {
      this.mostrarSpinner = false;
    }, 0);
    
    setTimeout(() => {
      this.playWelcomeAnimation();
    }, 100);

    // Log para debug
    console.log('🔍 Inicializando detección PWA');
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('🌐 Plataforma:', navigator.platform);

    // Escuchar evento de PWA instalable
    window.addEventListener('pwa-installable', () => {
      console.log('✅ Evento pwa-installable recibido');
      this.deferredPrompt = (window as any).deferredPrompt;
      this.mostrarBotonInstalar = true;
      this.cdr.detectChanges();
      console.log('📲 Botón de instalación PWA activado');
    });

    // Verificar si ya existe el prompt al cargar (importante para móvil)
    setTimeout(() => {
      if ((window as any).deferredPrompt) {
        console.log('✅ Prompt encontrado en window al cargar');
        this.deferredPrompt = (window as any).deferredPrompt;
        this.mostrarBotonInstalar = true;
        this.cdr.detectChanges();
      } else {
        console.log('⚠️ No hay prompt disponible todavía');
      }
    }, 1000);

    // Verificación adicional después de 3 segundos (para móvil)
    setTimeout(() => {
      if ((window as any).deferredPrompt && !this.mostrarBotonInstalar) {
        console.log('✅ Prompt encontrado en verificación tardía (móvil)');
        this.deferredPrompt = (window as any).deferredPrompt;
        this.mostrarBotonInstalar = true;
        this.cdr.detectChanges();
      }
    }, 3000);
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

  async instalarPWA() {
    console.log('🚀 Intentando instalar PWA...');
    
    if (!this.deferredPrompt) {
      console.log('⚠️ No hay prompt de instalación disponible');
      alert('La instalación no está disponible en este momento. Intenta usar el menú del navegador: ⋮ → "Instalar aplicación"');
      return;
    }

    try {
      // Mostrar el prompt de instalación
      console.log('📲 Mostrando prompt de instalación');
      this.deferredPrompt.prompt();
      
      // Esperar la respuesta del usuario
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`Usuario ${outcome === 'accepted' ? '✅ aceptó' : '❌ rechazó'} la instalación`);
      
      if (outcome === 'accepted') {
        console.log('🎉 PWA instalada exitosamente');
      }
    } catch (error) {
      console.error('❌ Error al instalar PWA:', error);
      alert('Error al instalar. Usa el menú del navegador: ⋮ → "Instalar aplicación"');
    } finally {
      // Limpiar el prompt
      this.deferredPrompt = null;
      this.mostrarBotonInstalar = false;
      this.cdr.detectChanges();
    }
  }

  esMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  esSafariOiOS(): boolean {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/i.test(ua) || (/Safari/i.test(ua) && !/Chrome|CriOS|Edg/i.test(ua));
  }

  async mostrarInstruccionesInstalacion() {
    const esAndroid = /Android/i.test(navigator.userAgent);
    const esIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    let instrucciones = '';
    
    if (esAndroid) {
      instrucciones = `
        <strong>📱 En Android/Chrome:</strong><br><br>
        1. Toca el menú <strong>⋮</strong> (tres puntos arriba a la derecha)<br>
        2. Busca la opción <strong>"Agregar a pantalla de inicio"</strong> o <strong>"Instalar aplicación"</strong><br>
        3. Confirma y listo 🎉<br><br>
        La app se instalará como una aplicación nativa.
      `;
    } else if (esIOS) {
      instrucciones = `
        <strong>📱 En iPhone/iPad (Safari):</strong><br><br>
        1. Toca el botón <strong>Compartir</strong> 📤 (abajo en la barra)<br>
        2. Desliza hacia abajo y toca <strong>"Agregar a pantalla de inicio"</strong><br>
        3. Toca <strong>"Agregar"</strong> y listo 🎉<br><br>
        ⚠️ <strong>Importante:</strong> Debes usar <strong>Safari</strong>, no Chrome.
      `;
    } else {
      instrucciones = `
        <strong>📱 Instalación:</strong><br><br>
        Busca en el menú de tu navegador la opción:<br>
        <strong>"Agregar a pantalla de inicio"</strong> o<br>
        <strong>"Instalar aplicación"</strong>
      `;
    }

    const alert = await this.alertController.create({
      header: '¿Cómo instalar RetoFitness?',
      message: instrucciones,
      buttons: ['Entendido'],
      cssClass: 'install-instructions-alert'
    });

    await alert.present();
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
