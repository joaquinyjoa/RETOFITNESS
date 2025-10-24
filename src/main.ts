import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, arrowBack, arrowForward, personOutline, fitnessOutline, medicalOutline, checkmarkCircleOutline, checkmarkCircle, checkmark, logIn } from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Registrar iconos
addIcons({
  'arrow-back-outline': arrowBackOutline,
  'arrow-back': arrowBack,
  'arrow-forward': arrowForward,
  'person-outline': personOutline,
  'fitness-outline': fitnessOutline,
  'medical-outline': medicalOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'checkmark-circle': checkmarkCircle,
  'checkmark': checkmark,
  'log-in': logIn
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
