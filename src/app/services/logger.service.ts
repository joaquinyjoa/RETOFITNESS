import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  
  private isDevelopment = !environment.production;

  log(message: string, ...optionalParams: any[]): void {
    if (this.isDevelopment) {
      console.log(message, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: any[]): void {
    if (this.isDevelopment) {
      console.warn(message, ...optionalParams);
    }
  }

  error(message: string, ...optionalParams: any[]): void {
    // Los errores siempre se registran, incluso en producción
    // pero en producción podrían enviarse a un servicio de tracking
    console.error(message, ...optionalParams);
    
    // TODO: En producción, enviar a servicio de monitoreo (Sentry, Firebase Crashlytics, etc.)
    // if (environment.production) {
    //   this.sendToMonitoringService(message, optionalParams);
    // }
  }

  info(message: string, ...optionalParams: any[]): void {
    if (this.isDevelopment) {
      console.info(message, ...optionalParams);
    }
  }

  debug(message: string, ...optionalParams: any[]): void {
    if (this.isDevelopment) {
      console.debug(message, ...optionalParams);
    }
  }
}
