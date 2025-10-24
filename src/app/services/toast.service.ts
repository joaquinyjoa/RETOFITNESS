import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastController: ToastController) { }

  async mostrarExito(mensaje: string, duracion: number = 3000) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: duracion,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle-outline',
      cssClass: 'toast-success'
    });
    toast.present();
  }

  async mostrarError(mensaje: string, duracion: number = 4000) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: duracion,
      position: 'top',
      color: 'danger',
      icon: 'alert-circle-outline',
      cssClass: 'toast-error'
    });
    toast.present();
  }

  async mostrarAdvertencia(mensaje: string, duracion: number = 3500) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: duracion,
      position: 'top',
      color: 'warning',
      icon: 'warning-outline',
      cssClass: 'toast-warning'
    });
    toast.present();
  }

  async mostrarInfo(mensaje: string, duracion: number = 3000) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: duracion,
      position: 'top',
      color: 'primary',
      icon: 'information-circle-outline',
      cssClass: 'toast-info'
    });
    toast.present();
  }
}