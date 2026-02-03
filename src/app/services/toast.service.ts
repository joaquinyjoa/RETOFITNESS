import { Injectable, NgZone } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(
    private toastController: ToastController,
    private ngZone: NgZone
  ) { }

  async mostrarExito(mensaje: string, duracion: number = 3000) {
    // Forzar ejecución en NgZone para asegurar que el toast se muestre
    return this.ngZone.run(async () => {
      const toast = await this.toastController.create({
        message: mensaje,
        duration: duracion,
        position: 'top',
        color: 'success',
        icon: 'checkmark-circle-outline',
        cssClass: 'toast-success'
      });
      await toast.present();
      return toast;
    });
  }

  async mostrarError(mensaje: string, duracion: number = 4000) {
    return this.ngZone.run(async () => {
      const toast = await this.toastController.create({
        message: mensaje,
        duration: duracion,
        position: 'top',
        color: 'danger',
        icon: 'alert-circle-outline',
        cssClass: 'toast-error'
      });
      await toast.present();
      return toast;
    });
  }

  async mostrarAdvertencia(mensaje: string, duracion: number = 3500) {
    return this.ngZone.run(async () => {
      const toast = await this.toastController.create({
        message: mensaje,
        duration: duracion,
        position: 'top',
        color: 'warning',
        icon: 'warning-outline',
        cssClass: 'toast-warning'
      });
      await toast.present();
      return toast;
    });
  }

  async mostrarInfo(mensaje: string, duracion: number = 3000) {
    return this.ngZone.run(async () => {
      const toast = await this.toastController.create({
        message: mensaje,
        duration: duracion,
        position: 'top',
        color: 'primary',
        icon: 'information-circle-outline',
        cssClass: 'toast-info'
      });
      await toast.present();
      return toast;
    });
  }
}