import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  arrowBack, 
  arrowForward, 
  personOutline, 
  fitnessOutline, 
  medicalOutline, 
  checkmarkCircleOutline, 
  checkmarkCircle, 
  checkmark, 
  logIn,
  personCircleOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  person,
  fitness,
  medical,
  arrowForwardOutline,
  chevronForward,
  chevronBack,
  alert,
  alertCircle,
  alertCircleOutline,
  closeCircle,
  closeCircleOutline,
  informationCircle,
  informationCircleOutline,
  warningOutline,
  warning,
  home,
  homeOutline,
  settings,
  settingsOutline,
  menu,
  menuOutline
} from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Registrar iconos (todos los necesarios para el proyecto)
addIcons({
  'arrow-back-outline': arrowBackOutline,
  'arrow-back': arrowBack,
  'arrow-forward': arrowForward,
  'arrow-forward-outline': arrowForwardOutline,
  'person-outline': personOutline,
  'person': person,
  'fitness-outline': fitnessOutline,
  'fitness': fitness,
  'medical-outline': medicalOutline,
  'medical': medical,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'checkmark-circle': checkmarkCircle,
  'checkmark': checkmark,
  'person-circle-outline': personCircleOutline,
  'mail-outline': mailOutline,
  'lock-closed-outline': lockClosedOutline,
  'eye-outline': eyeOutline,
  'eye-off-outline': eyeOffOutline,
  'chevron-forward': chevronForward,
  'chevron-back': chevronBack,
  'alert': alert,
  'alert-circle': alertCircle,
  'alert-circle-outline': alertCircleOutline,
  'close-circle': closeCircle,
  'close-circle-outline': closeCircleOutline,
  'information-circle': informationCircle,
  'information-circle-outline': informationCircleOutline,
  'warning-outline': warningOutline,
  'warning': warning,
  'home': home,
  'home-outline': homeOutline,
  'settings': settings,
  'settings-outline': settingsOutline,
  'menu': menu,
  'menu-outline': menuOutline,
  'log-in': logIn
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
