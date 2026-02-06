import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastData {
  message: string;
  duration: number;
  color: 'success' | 'danger' | 'warning' | 'primary';
  icon: string;
  isOpen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new BehaviorSubject<ToastData>({
    message: '',
    duration: 3000,
    color: 'primary',
    icon: 'information-circle-outline',
    isOpen: false
  });

  public toast$ = this.toastSubject.asObservable();

  constructor(private ngZone: NgZone) { }

  mostrarExito(mensaje: string, duracion: number = 3000) {
    console.log('🟢 ToastService: Mostrando toast de éxito:', mensaje);
    this.ngZone.run(() => {
      this.toastSubject.next({
        message: mensaje,
        duration: duracion,
        color: 'success',
        icon: 'checkmark-circle-outline',
        isOpen: true
      });
      console.log('🟢 ToastService: Toast emitido en ngZone');
    });
    return Promise.resolve();
  }

  mostrarError(mensaje: string, duracion: number = 4000) {
    console.log('🔴 ToastService: Mostrando toast de error:', mensaje);
    this.ngZone.run(() => {
      this.toastSubject.next({
        message: mensaje,
        duration: duracion,
        color: 'danger',
        icon: 'alert-circle-outline',
        isOpen: true
      });
      console.log('🔴 ToastService: Toast emitido en ngZone');
    });
    return Promise.resolve();
  }

  mostrarAdvertencia(mensaje: string, duracion: number = 3500) {
    console.log('🟡 ToastService: Mostrando toast de advertencia:', mensaje);
    this.ngZone.run(() => {
      this.toastSubject.next({
        message: mensaje,
        duration: duracion,
        color: 'warning',
        icon: 'warning-outline',
        isOpen: true
      });
      console.log('🟡 ToastService: Toast emitido en ngZone');
    });
    return Promise.resolve();
  }

  mostrarInfo(mensaje: string, duracion: number = 3000) {
    console.log('🟠 ToastService: Mostrando toast de info:', mensaje);
    this.toastSubject.next({
      message: mensaje,
      duration: duracion,
      color: 'primary',
      icon: 'information-circle-outline',
      isOpen: true
    });
    return Promise.resolve();
  }

  cerrarToast() {
    this.ngZone.run(() => {
      const current = this.toastSubject.value;
      this.toastSubject.next({ ...current, isOpen: false });
      console.log('📪 ToastService: Toast cerrado');
    });
  }
}