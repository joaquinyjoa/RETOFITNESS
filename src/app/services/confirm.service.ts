import { Injectable, inject, Injector } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { ConfirmModalComponent } from '../components/confirm-modal/confirm-modal.component';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private injector = inject(Injector);

  /**
   * Muestra un diálogo de confirmación estilizado en neón para acciones de salida.
   * Retorna `true` si el usuario confirma (Salir), `false` si cancela.
   */
  async confirmExit(
    message: string = '¿Deseas cerrar sesión?',
    header: string = 'Salir',
    confirmLabel: string = 'Salir'
  ): Promise<boolean> {

    try {
      console.log('[ConfirmService] creating modal', { header, message, confirmLabel });
      const modalCtrl = this.injector.get(ModalController, null as unknown as ModalController | null);

      if (modalCtrl) {
        const modal = await modalCtrl.create({
          component: ConfirmModalComponent,
          componentProps: {
            header,
            message,
            cancelText: 'Cancelar',
            confirmText: confirmLabel
          },
          cssClass: 'confirm-modal-wrapper',
          backdropDismiss: false
        });

        await modal.present();
        const { data, role } = await modal.onWillDismiss();
        return data === true || role === 'confirm';
      }

      // Fallback: si no hay ModalController (p.ej. en algunos contextos), usar AlertController
      console.log('[ConfirmService] ModalController no disponible, usando AlertController como fallback');
      const alertCtrl = this.injector.get(AlertController) as AlertController;
      const alert = await alertCtrl.create({
        header,
        message,
        cssClass: 'neon-alert',
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'neon-cancel' },
          { text: confirmLabel, role: 'confirm', cssClass: 'neon-confirm' }
        ]
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      return role === 'confirm';
    } catch (err) {
      console.error('[ConfirmService] error showing modal/alert', err);
      return false;
    }
  }

  /**
   * Método genérico para confirmar acciones con estilo neón.
   * `confirmLabel` permite personalizar el texto del botón de confirmación.
   */
  async confirm(message: string, header: string = 'Confirmar', confirmLabel: string = 'Aceptar'): Promise<boolean> {
    try {
      console.log('[ConfirmService] opening generic confirm modal', { header, message, confirmLabel });
      const modalCtrl = this.injector.get(ModalController, null as unknown as ModalController | null);
      if (modalCtrl) {
        const modal = await modalCtrl.create({
          component: ConfirmModalComponent,
          componentProps: {
            header,
            message,
            cancelText: 'Cancelar',
            confirmText: confirmLabel
          },
          cssClass: 'confirm-modal-wrapper',
          backdropDismiss: false
        });
        await modal.present();
        const { data, role } = await modal.onWillDismiss();
        console.log('[ConfirmService] generic modal dismissed', { data, role });
        return data === true || role === 'confirm';
      }

      console.log('[ConfirmService] ModalController no disponible, usando AlertController como fallback');
      const alertCtrl = this.injector.get(AlertController) as AlertController;
      const alert = await alertCtrl.create({
        header,
        message,
        cssClass: 'neon-alert',
        buttons: [
          { text: 'Cancelar', role: 'cancel', cssClass: 'neon-cancel' },
          { text: confirmLabel, role: 'confirm', cssClass: 'neon-confirm' }
        ]
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      return role === 'confirm';
    } catch (err) {
      console.error('[ConfirmService] error opening generic modal/alert', err);
      return false;
    }
  }
}
