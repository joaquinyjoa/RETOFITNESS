import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private alertCtrl = inject(AlertController);

  /**
   * Muestra un diálogo de confirmación estilizado en neón para acciones de salida.
   * Retorna `true` si el usuario confirma (Salir), `false` si cancela.
   */
  async confirmExit(message: string = '¿Deseas cerrar sesión?', header: string = 'Salir'): Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      cssClass: 'neon-alert',
      backdropDismiss: false,
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'neon-cancel' },
        { text: 'Salir', role: 'confirm', cssClass: 'neon-confirm' }
      ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }
}
